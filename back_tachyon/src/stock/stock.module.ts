import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Stock } from './entities/stock.entity';
import { Products } from './entities/products.entity';
import { Pack } from 'src/product/pack/entities/pack.entity';
import { Company } from 'src/companies/entities/company.entity';
import { StockItem } from './entities/stock-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, Products, Company, Pack, StockItem]),
  ],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
