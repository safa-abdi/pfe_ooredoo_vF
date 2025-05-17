import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resiliation } from './entities/resiliation.entity';
import { ResiliationController } from './resiliation.controller';
import { ResiliationService } from './resiliation.service';
import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Company } from 'src/companies/entities/company.entity';
import { Delegation } from 'src/branches_companies/entities/Delegation.entity';
import { CacheService } from 'src/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Resiliation,
      CompanyDelegation,
      Company,
      Delegation,
    ]),
    CacheModule.register({
      ttl: 60 * 60 * 1,
    }),
  ],

  controllers: [ResiliationController],
  providers: [ResiliationService, CacheService],
})
export class ResiliationModule {}
