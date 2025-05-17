import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './entities/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}
  // src/history/history.service.ts

  async logAssignment({
    dataType,
    crmCase,
    actionType,
    userId,
    actionDate = new Date(),
    STT,
  }: {
    dataType: string;
    crmCase: string;
    actionType: 'affectation' | 'reaffectation' | 'Cloture';
    userId?: string;
    actionDate?: Date;
    STT?: string;
  }) {
    const history = this.historyRepository.create({
      data_type: dataType,
      crm_case: crmCase,
      action: actionType,
      actionDate,
      user_id: userId,
      STT,
    });

    await this.historyRepository.save(history);
  }

  async logAction({
    dataType,
    crmCase,
    action,
    userId,
  }: {
    dataType: string;
    crmCase: string;
    action: string;
    userId?: string;
  }) {
    const history = this.historyRepository.create({
      data_type: dataType,
      crm_case: crmCase,
      action,
      user_id: userId,
    });

    await this.historyRepository.save(history);
  }
}
