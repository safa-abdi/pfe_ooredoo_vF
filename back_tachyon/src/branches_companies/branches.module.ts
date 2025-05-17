import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/Branch.entity';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { Company } from 'src/companies/entities/company.entity';
import { Delegation } from './entities/Delegation.entity';
import { Gouv } from './entities/gouv.entity';
import { CompanyDelegation } from './entities/CompanyDelegation';
import { CompanyDelegationModule } from './company-delegation.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      Company,
      Delegation,
      Gouv,
      CompanyDelegation,
    ]),
    CompanyDelegationModule,
  ],

  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
