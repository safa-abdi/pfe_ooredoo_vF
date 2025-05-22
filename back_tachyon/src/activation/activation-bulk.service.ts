/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activation } from './entities/activation.entity';

@Injectable()
export class ActivationBulkService {
  private readonly logger = new Logger(ActivationBulkService.name);
  private lastExecution: {
    date: Date;
    duration: number;
    processed: number;
    status: 'completed' | 'failed';
  } | null = null;

  constructor(
    @InjectRepository(Activation)
    private readonly activationRepo: Repository<Activation>,
  ) {}

  async processAllActivations(batchSize = 1000): Promise<void> {
    const startTime = Date.now();
    let processedCount = 0;

    try {
      this.logger.log('Début du recalcul des SLA');

      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const activations = await this.activationRepo.find({
          skip,
          take: batchSize,
          order: { crm_case: 'ASC' },
        });

        if (activations.length === 0) {
          hasMore = false;
          continue;
        }

        processedCount += activations.length;
        await this.processBatch(activations);
        skip += batchSize;
        this.logger.log(`Lot traité: ${processedCount} activations`);
      }

      this.lastExecution = {
        date: new Date(),
        duration: Date.now() - startTime,
        processed: processedCount,
        status: 'completed',
      };
    } catch (error) {
      this.lastExecution = {
        date: new Date(),
        duration: Date.now() - startTime,
        processed: processedCount,
        status: 'failed',
      };
      this.logger.error('Erreur lors du recalcul', error.stack);
      throw error;
    }
  }

  getLastExecutionStatus() {
    return this.lastExecution;
  }

  private async processBatch(activations: Activation[]): Promise<void> {
    await Promise.all(
      activations.map((activation) =>
        this.activationRepo.save(activation).catch((e) => {
          this.logger.error(
            `Erreur sur l'activation ${activation.crm_case}`,
            e.message,
          );
        }),
      ),
    );
  }
}
