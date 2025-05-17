import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDelegation } from './entities/CompanyDelegation';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyDelegation])],
  exports: [TypeOrmModule.forFeature([CompanyDelegation])],
})
export class CompanyDelegationModule {}
