import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pack } from './entities/pack.entity';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';
import { Products } from 'src/stock/entities/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pack, Products])],
  controllers: [PackController],
  providers: [PackService],
})
export class PackModule {}
