import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activation } from './entities/activation.entity';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches_companies/entities/Branch.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

// Contrôleurs
import { ActivationController } from './activation.controller';
import { ActivationSlaController } from './sla.controller';

// Services
import { ActivationService } from './activation.service';
import { ActivationBulkService } from './activation-bulk.service';
import { ActivationCronService } from './activation.cron.service';
import { CompanyDelegationModule } from 'src/branches_companies/company-delegation.module';
import { DelegationModule } from 'src/branches_companies/delegation.module';
import { Prod_imei } from './entities/Prod_imei.entity';
import { PdfController } from './pv.controller';
import { CacheService } from 'src/cache/cache.service';
import { History } from 'src/history/entities/history.entity';
import { HistoryService } from 'src/history/history.service';
import { Plainte } from 'src/plaintes/entities/plaintes.entity';
import { Resiliation } from 'src/resiliation/entities/resiliation.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activation,
      Company,
      Branch,
      Prod_imei,
      History,
      Plainte,
      Resiliation,
      User,
    ]),
    CacheModule.register({
      ttl: 60 * 60 * 1,
    }),
    ScheduleModule.forRoot(),
    CompanyDelegationModule,
    DelegationModule,
  ],
  controllers: [ActivationController, ActivationSlaController, PdfController],
  providers: [
    ActivationService,
    ActivationBulkService,
    ActivationCronService,
    HistoryService,
    {
      provide: 'SLA_CONFIG',
      useValue: {
        batchSize: 1000,
        timeout: 30000,
      },
    },
    CacheService,
  ],
  exports: [ActivationService, TypeOrmModule],
})
export class ActivationModule {}
