// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Role } from './users/entities/roles.entity';
import { UsersModule } from './users/users.module';
import { EmailModule } from './users/email/email.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { CompaniesModule } from './companies/companies.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { ActivationModule } from './activation/activation.module';
import { PackModule } from './product/pack/pack.module';
import { ProductsModule } from './product/product.module';
import { PlainteModule } from './plaintes/plaintes.module';
import { ResiliationModule } from './resiliation/resiliation.module';
import { BranchesModule } from './branches_companies/branches.module';
import { Company } from './companies/entities/company.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { MulterModule } from '@nestjs/platform-express';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { extractModule } from './extract_from_image/extract.module';
import { ExportModule } from './history/export.module';
import { HistoryModule } from './history/history.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron/cron.service';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 300,
      max: 1000,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '#Safa@123_#',
      database: 'ooredoo',
      autoLoadEntities: true,
      synchronize: true,
      entities: [User, Role, Company],
    }),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
          },
        },
        defaults: {
          from: `"Ooredoo Stock" <${process.env.EMAIL_USER}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),

    TypeOrmModule.forFeature([User, Role, Company]),
    UsersModule,
    EmailModule,
    AuthModule,
    StockModule,
    CompaniesModule,
    StockMovementsModule,
    ActivationModule,
    PackModule,
    ProductsModule,
    PlainteModule,
    ResiliationModule,
    BranchesModule,
    MulterModule.register(),
    extractModule,
    ExportModule,
    HistoryModule,
    CronModule,
  ],
  providers: [CronService],
})
export class AppModule {}
