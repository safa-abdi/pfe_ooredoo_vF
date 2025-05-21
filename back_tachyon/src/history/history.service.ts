import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { History } from './entities/history.entity';
import { Activation } from 'src/activation/entities/activation.entity';
import { Plainte } from 'src/plaintes/entities/plaintes.entity';
import { Resiliation } from 'src/resiliation/entities/resiliation.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,

    @InjectRepository(Activation)
    private activationRepository: Repository<Activation>,

    @InjectRepository(Plainte)
    private plainteRepository: Repository<Plainte>,

    @InjectRepository(Resiliation)
    private resiliationRepository: Repository<Resiliation>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
  async getHistoryMSISDN(crm_case: string, MSISDN: string) {
    const caseHistory = await this.historyRepository.find({
      where: { crm_case },
      order: { actionDate: 'DESC' },
    });

    const userIds = caseHistory.map((item) => item.user_id).filter((id) => id);
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });

    const userMap = new Map(
      users.map((user) => [
        user.id,
        {
          nom: user.nom,
          prénom: user.prénom,
          fullName: `${user.prénom} ${user.nom}`.trim(),
        },
      ]),
    );

    const formattedHistory = caseHistory.map((history) => ({
      ...history,
      user_name: history.user_id
        ? userMap.get(Number(history.user_id))?.fullName || null
        : null,
      user_details: history.user_id
        ? userMap.get(Number(history.user_id)) || null
        : null,
    }));

    const activations = await this.activationRepository.find({
      where: { MSISDN },
      order: { DATE_CREATION_CRM: 'DESC' },
    });

    const plaintes = await this.plainteRepository.find({
      where: { MSISDN },
      order: { DATE_CREATION_CRM: 'DESC' },
    });

    const resiliations = await this.resiliationRepository.find({
      where: { MSISDN },
      order: { DATE_CREATION_CRM: 'DESC' },
    });

    return {
      caseHistory: formattedHistory,
      demandesHistory: {
        activations,
        plaintes,
        resiliations,
      },
    };
  }
}
