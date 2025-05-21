/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Activation } from 'src/activation/entities/activation.entity';
import { Resiliation } from 'src/resiliation/entities/resiliation.entity';
import { Plainte } from 'src/plaintes/entities/plaintes.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Activation)
    private readonly activationRepository: Repository<Activation>,

    @InjectRepository(Plainte)
    private readonly plainteRepository: Repository<Plainte>,

    @InjectRepository(Resiliation)
    private readonly resiliationRepository: Repository<Resiliation>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSlaCriticalCalculations() {
    this.logger.log('🧮 Calcul des SLA critiques lancé...');
    const now = new Date();
    const criticalThresholdInHours = 24;

    await this.updateSlaForRepository(
      this.activationRepository,
      'Activation',
      now,
      criticalThresholdInHours,
    );

    await this.updateSlaForRepository(
      this.plainteRepository,
      'Plainte',
      now,
      criticalThresholdInHours,
    );

    await this.updateSlaForRepository(
      this.resiliationRepository,
      'Résiliation',
      now,
      criticalThresholdInHours,
    );

    this.logger.log('✅ Tous les SLA critiques ont été mis à jour.');
  }

  private async updateSlaForRepository(
    repository: Repository<any>,
    label: string,
    now: Date,
    thresholdInHours: number,
  ) {
    const pendingItems = await repository.find({
      where: { STATUT: 'En cours' },
    });

    const criticalItems = pendingItems.filter((item) => {
      const createdAt = new Date(item.DATE_AFFECTATION_STT);
      const hoursElapsed =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursElapsed > thresholdInHours;
    });

    this.logger.warn(
      `⚠️ [${label}] ${criticalItems.length} éléments critiques trouvés.`,
    );

    for (const item of criticalItems) {
      const createdAt = new Date(item.DATE_AFFECTATION_STT);
      const hoursElapsed =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      const hoursOverThreshold = hoursElapsed - thresholdInHours;

      item.SLARDV_Critique = parseFloat(hoursOverThreshold.toFixed(2));
      await repository.save(item);
    }

    this.logger.log(`✅ SLA critiques mis à jour pour ${label}.`);
  }

  async getAllCritiques(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [activations, totalActivations] =
      await this.activationRepository.findAndCount({
        where: { SLARDV_Critique: Not(0) },
        select: [
          'crm_case',
          'CLIENT',
          'NAME_STT',
          'LATITUDE_SITE',
          'LONGITUDE_SITE',
          'DATE_AFFECTATION_STT',
          'MSISDN',
        ],
        skip,
        take: limit,
      });

    const [plaintes, totalPlaintes] = await this.plainteRepository.findAndCount(
      {
        where: { SLARDV_Critique: Not(0) },
        select: [
          'crm_case',
          'CLIENT',
          'NAME_STT',
          'LATITUDE_SITE',
          'LONGITUDE_SITE',
          'DATE_AFFECTATION_STT',
          'MSISDN',
        ],
        skip,
        take: limit,
      },
    );

    const [resiliations, totalResiliations] =
      await this.resiliationRepository.findAndCount({
        where: { SLARDV_Critique: Not(0) },
        select: [
          'crm_case',
          'CLIENT',
          'STT',
          'LATITUDE_SITE',
          'LONGITUDE_SITE',
          'DATE_AFFECTATION_STT',
          'MSISDN',
        ],
        skip,
        take: limit,
      });

    const totalGeneral = totalActivations + totalPlaintes + totalResiliations;

    return {
      page,
      limit,
      totalGeneral,
      activations: {
        data: activations,
        total: totalActivations,
      },
      plaintes: {
        data: plaintes,
        total: totalPlaintes,
      },
      resiliations: {
        data: resiliations,
        total: totalResiliations,
      },
    };
  }
}
