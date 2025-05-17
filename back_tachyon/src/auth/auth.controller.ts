// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { LoginTechDto } from './loginTechDto.dto';
import { OtpDto } from './otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @Post('loginTech')
  async loginTech(@Body() loginTechDto: LoginTechDto) {
    return this.authService.loginTech(loginTechDto);
  }
  @Post('verify-otp')
  async verifyOtp(@Body() otpDto: OtpDto) {
    return this.authService.verifyOtp(otpDto);
  }
}
