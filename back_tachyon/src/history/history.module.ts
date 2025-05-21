import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { History } from './entities/history.entity';
import { Plainte } from 'src/plaintes/entities/plaintes.entity';
import { Activation } from 'src/activation/entities/activation.entity';
import { Resiliation } from 'src/resiliation/entities/resiliation.entity';
import { HistoryController } from './history.controller';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([History, Activation, Plainte, Resiliation, User]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
