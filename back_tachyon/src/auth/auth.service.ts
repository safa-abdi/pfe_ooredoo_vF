/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './login.dto';
import { LoginTechDto } from './loginTechDto.dto';

import { ConfigService } from '@nestjs/config';
import { OtpDto } from './otp.dto';
import { SmsService } from './SmsService';

@Injectable()
export class AuthService {
  private readonly otpStorage = new Map<
    string,
    { otp: string; expires: number }
  >();
  private readonly otpExpirationTime = 300000;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, mdp } = loginDto;

    if (!email || !mdp) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || null,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithm: 'HS256',
      expiresIn: '1h',
    });
    console.log('JWT_SECRET:', this.configService.get<string>('JWT_SECRET'));
    return { access_token: token };
  }
  async loginTech(loginTechDto: LoginTechDto): Promise<{ message: string }> {
    const { num_tel, mdp } = loginTechDto;

    if (!num_tel || !mdp) {
      throw new UnauthorizedException(
        'Numéro de téléphone et mot de passe sont requis',
      );
    }

    const user = await this.usersService.findOneByTel(num_tel.toString());
    if (!user) {
      throw new UnauthorizedException(
        'Numéro de téléphone ou mot de passe invalide',
      );
    }

    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Numéro de téléphone ou mot de passe invalide',
      );
    }

    const otp = this.generateOTP();
    this.otpStorage.set(num_tel.toString(), {
      otp,
      expires: Date.now() + this.otpExpirationTime,
    });

    await this.smsService.sendSms(
      num_tel.toString(),
      `Votre code OTP est: ${otp}`,
    );
    console.log(`Envoyer OTP ${otp} à ${num_tel}`);

    return { message: 'OTP envoyé. Veuillez vérifier votre téléphone.' };
  }

  async verifyOtp(otpDto: OtpDto): Promise<{ access_token: string }> {
    const { num_tel, otp } = otpDto;

    const storedOtpData = this.otpStorage.get(num_tel);
    if (!storedOtpData) {
      throw new UnauthorizedException(
        'Aucun OTP envoyé à ce numéro de téléphone.',
      );
    }

    if (Date.now() > storedOtpData.expires) {
      this.otpStorage.delete(num_tel);
      throw new UnauthorizedException('Le code OTP a expiré.');
    }

    if (storedOtpData.otp !== otp) {
      throw new UnauthorizedException('Code OTP invalide.');
    }

    this.otpStorage.delete(num_tel); // Supprime l'OTP après vérification

    // Rechercher l'utilisateur par numéro de téléphone
    const user = await this.usersService.findOneByTel(num_tel);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    return this.createToken(user);
  }

  private createToken(user: any): { access_token: string } {
    const payload = {
      sub: user.id,
      num_tel: user.num_tel,
      role: user.role?.name || null,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return { access_token: token };
  }

  private generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Génère un OTP à 4 chiffres
  }
}
