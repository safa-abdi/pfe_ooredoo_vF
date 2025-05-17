// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/roles.entity';
import { UsersController } from './users.controller'; // Importer le contrôleur
import { EmailModule } from './email/email.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), EmailModule, JwtModule],
  providers: [UsersService],
  controllers: [UsersController], // Enregistrer le contrôleur
  exports: [UsersService],
})
export class UsersModule {}
