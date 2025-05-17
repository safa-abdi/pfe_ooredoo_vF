import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovement } from './entities/stock-movement.entity';
import { Products } from '../stock/entities/products.entity';
import { Company } from '../companies/entities/company.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { Pack } from 'src/product/pack/entities/pack.entity';
import { MailerModule } from '@nestjs-modules/mailer';
@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, Products, Company, Stock, Pack]),
    MailerModule,
  ],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
})
export class StockMovementsModule {}
