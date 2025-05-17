/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivationBulkService } from './activation-bulk.service';

@Injectable()
export class ActivationCronService {
  private readonly logger = new Logger(ActivationCronService.name);

  constructor(private readonly bulkService: ActivationBulkService) {}

  @Cron('0 2 * * *', { timeZone: 'UTC' }) // Tous les jours à 2h UTC
  async handleSlaRecalculation() {
    this.logger.log('🚀 Début du recalcul automatique des SLA');
    try {
      await this.bulkService.processAllActivations();
      this.logger.log('✅ Recalcul des SLA terminé avec succès');
    } catch (error) {
      this.logger.error('❌ Erreur lors du recalcul automatique', error.stack);
    }
  }
}
