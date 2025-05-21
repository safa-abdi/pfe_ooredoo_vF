// src/cron/cron.module.ts
import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activation } from 'src/activation/entities/activation.entity';
import { Plainte } from 'src/plaintes/entities/plaintes.entity';
import { Resiliation } from 'src/resiliation/entities/resiliation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activation, Plainte, Resiliation])],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
