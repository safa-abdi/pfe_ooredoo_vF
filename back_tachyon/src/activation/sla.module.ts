// src/activation/activation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activation } from './entities/activation.entity';
import { ActivationBulkService } from './activation-bulk.service';
import { ActivationCronService } from './activation.cron.service';
import { ActivationSlaController } from './sla.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activation])],
  controllers: [ActivationSlaController],
  providers: [ActivationBulkService, ActivationCronService],
  exports: [ActivationBulkService],
})
export class slaModule {}
