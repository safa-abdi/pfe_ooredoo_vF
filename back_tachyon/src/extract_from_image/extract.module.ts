import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtractController } from './extract.controller';
import { ExtractService } from './extract.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ExtractController],
  providers: [ExtractService],
})
export class extractModule {}
