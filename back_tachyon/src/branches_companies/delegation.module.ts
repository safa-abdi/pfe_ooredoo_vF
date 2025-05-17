import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delegation } from './entities/Delegation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Delegation])],
  exports: [TypeOrmModule.forFeature([Delegation])],
})
export class DelegationModule {}
