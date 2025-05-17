import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plainte } from './entities/plaintes.entity';
import { PlainteController } from './plaintes.controller';
import { PlainteService } from './plaintes.service';
import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Company } from 'src/companies/entities/company.entity';
import { Delegation } from 'src/branches_companies/entities/Delegation.entity';
import { CacheService } from 'src/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plainte, CompanyDelegation, Company, Delegation]),
    CacheModule.register({
      ttl: 60 * 60 * 1,
    }),
  ],
  controllers: [PlainteController],
  providers: [PlainteService, CacheService],
})
export class PlainteModule {}
