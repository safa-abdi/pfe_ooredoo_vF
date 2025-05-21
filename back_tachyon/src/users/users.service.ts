/* eslint-disable @typescript-eslint/no-unused-vars */
// src/users/users.service.ts
import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Role } from './entities/roles.entity';
import { UserResponseDto } from './dto/user-response.dto';
import { EmailService } from './email/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private verificationCodes: Map<string, string> = new Map();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,

    private readonly emailService: EmailService, // Injecter EmailService
  ) {}
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Code à 6 chiffres
  }
  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    try {
      if (!createUserDto || typeof createUserDto !== 'object') {
        throw new HttpException('Invalid user data', HttpStatus.BAD_REQUEST);
      }

      // Vérifier si l'e-mail contient "@gmail"
      if (!createUserDto.email.includes('@gmail')) {
        throw new HttpException(
          'Email must contain @gmail',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      // Générer un code de validation
      const verificationCode = this.generateVerificationCode();
      this.verificationCodes.set(createUserDto.email, verificationCode);

      // Envoyer le code par e-mail
      await this.emailService.sendVerificationEmail(
        createUserDto.email,
        verificationCode,
      );

      return { message: 'Verification code sent to your email' };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during user creation:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyAndCreateUser(
    email: string,
    code: string,
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const storedCode = this.verificationCodes.get(email);
      if (!storedCode || storedCode !== code) {
        throw new HttpException(
          'Invalid verification code',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.verificationCodes.delete(email);

      const role = createUserDto.role_id
        ? await this.rolesRepository.findOne({
            where: { id: createUserDto.role_id },
          })
        : null;

      if (!role) {
        throw new HttpException('Role not found', HttpStatus.BAD_REQUEST);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createUserDto.mdp, salt);

      const user = this.usersRepository.create({
        ...createUserDto,
        mdp: hashedPassword,
        role,
      });

      const savedUser = await this.usersRepository.save(user);

      const { mdp, ...userResponse } = savedUser;
      return userResponse as UserResponseDto;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during user verification:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        select: ['id', 'email', 'mdp'],
      });

      if (user && (await bcrypt.compare(password, user.mdp))) {
        const { mdp, ...userResponse } = user;
        return userResponse as UserResponseDto;
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during user validation:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // src/users/users.service.ts
  async findAll(): Promise<UserResponseDto[]> {
    try {
      const users = await this.usersRepository.find({
        relations: ['role', 'company'],
      });

      return users.map((user) => {
        const { mdp, ...userResponse } = user;

        const userDto: UserResponseDto = {
          ...userResponse,
          role: user.role,
          company: user.company,
        };

        return userDto;
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during findAll:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // src/users/users.service.ts
  async update(
    id: number,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Mettre à jour les champs fournis dans updateUserDto
      if (updateUserDto.mdp) {
        const salt = await bcrypt.genSalt(10);
        updateUserDto.mdp = await bcrypt.hash(updateUserDto.mdp, salt);
      }

      // Mettre à jour l'utilisateur
      Object.assign(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);

      // Retourner l'utilisateur mis à jour sans le mot de passe

      const { mdp, ...userResponse } = updatedUser;
      return userResponse as UserResponseDto;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during user update:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findOne(id: number): Promise<UserResponseDto | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (user) {
        const { mdp, ...userResponse } = user;
        return userResponse as UserResponseDto;
      }
      return null;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during findOne:', error.message);
      } else {
        this.logger.error('Unknown error:', error);
      }
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async findOneByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'nom',
        'prénom',
        'num_tel',
        'email',
        'mdp', // Ensure 'mdp' is included
        'date_naiss',
        'disponibilité',
        'role_id',
        'company_id',
      ],
      relations: ['role', 'company'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    console.log('User object from database:', user);

    return user;
  }
  async findOneByTel(num_tel: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { num_tel: num_tel.toString() },
      select: [
        'id',
        'nom',
        'prénom',
        'num_tel',
        'email',
        'mdp',
        'date_naiss',
        'disponibilité',
        'role_id',
        'company_id',
      ],
      relations: ['role', 'company'],
    });

    if (!user) {
      throw new NotFoundException(
        `User with phone number ${num_tel} not found`,
      );
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<{ message: string }> {
    try {
      if (!createUserDto || typeof createUserDto !== 'object') {
        throw new HttpException('Invalid user data', HttpStatus.BAD_REQUEST);
      }

      if (!createUserDto.email.includes('@gmail')) {
        throw new HttpException(
          'Email must contain @gmail',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(createUserDto.mdp, 10);

      const newUser = this.usersRepository.create({
        ...createUserDto,
        mdp: hashedPassword,
      });
      await this.usersRepository.save(newUser);

      return { message: 'User successfully registered' };
    } catch (error) {
      this.logger.error('Error during user registration:', error);
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getUserDetails(userId: number): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        select: [
          'id',
          'nom',
          'prénom',
          'num_tel',
          'email',
          'mdp',
          'date_naiss',
          'disponibilité',
          'role_id',
          'company_id',
        ],
        relations: ['role', 'company'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while fetching user details',
      );
    }
  }

  async getUsersByCompanyId(
    companyId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.usersRepository.findAndCount({
      where: { company_id: companyId },
      relations: ['role', 'company', 'coordinateur'],
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async getAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async getCoordinateursByCompanyId(companyId: number): Promise<User[]> {
    const users = await this.usersRepository.find({
      where: {
        company: { id: companyId },
        role: { id: 6 },
      },
      relations: ['role', 'company', 'coordinateur'],
    });
    return users;
  }
  async getRoles(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }
}
