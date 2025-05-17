/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Patch,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { User } from './entities/user.entity';
import { Role } from './entities/roles.entity';

interface UserPayload {
  [x: string]: any;
  id: number;
  email: string;
  role?: string;
}

interface RequestWithUser extends Request {
  user: UserPayload;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    return this.usersService.register(createUserDto);
  }
  @Post('create')
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    try {
      await this.usersService.create(createUserDto);
      return { message: 'User successfully registered' };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof HttpException
          ? error.getResponse()
          : 'An unexpected error occurred';

      throw new HttpException(message, status);
    }
  }

  @Post('verify')
  async verifyAndCreateUser(
    @Query('email') email: string,
    @Query('code') code: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.verifyAndCreateUser(email, code, createUserDto);
  }

  @Get('/id/:id')
  async findOne(@Param('id') id: number): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  @Get('/')
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getMe(@Req() request: RequestWithUser) {
    console.log('here');

    const userId = request.user.sub;
    console.log('userId', userId);
    const userDetails = await this.usersService.getUserDetails(userId);
    console.log('User Details:', userDetails);
    return userDetails;
  }
  @Get('/by-company/:companyId')
  async getUsersByCompany(
    @Param('companyId') companyId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getUsersByCompanyId(
      companyId,
      Number(page),
      Number(limit),
    );
  }
  @Get('company/:companyId/coordinateurs')
  async getCoordinateursByCompanyId(
    @Param('companyId', ParseIntPipe) companyId: number,
  ): Promise<User[]> {
    return this.usersService.getCoordinateursByCompanyId(companyId);
  }
  @Get('roles')
  async getRoles(): Promise<Role[]> {
    return this.usersService.getRoles();
  }
}
