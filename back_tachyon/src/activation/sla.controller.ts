/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ActivationBulkService } from './activation-bulk.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('SLA - Management')
@Controller('api/v1/activations/sla')
export class ActivationSlaController {
  constructor(private readonly bulkService: ActivationBulkService) {}

  @Post('recalculate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Lancer le recalcul des SLA',
    description:
      'Déclenche le recalcul complet des indicateurs SLA pour toutes les activations existantes',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Le recalcul a été démarré avec succès',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Le service est temporairement indisponible',
  })
  async triggerRecalculation() {
    try {
      await this.bulkService.processAllActivations();
      return {
        success: true,
        message: 'Recalcul des SLA initié avec succès',
        note: "Cette opération s'exécute en arrière-plan",
      };
    } catch (error) {
      return {
        success: false,
        message: 'Échec du démarrage du recalcul',
        error: error.message,
      };
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'État du dernier recalcul',
    description:
      'Retourne les informations sur la dernière exécution du recalcul des SLA',
  })
  async getRecalculationStatus() {
    const status = await this.bulkService.getLastExecutionStatus();
    return {
      status: status ? status.status : 'never-executed',
      lastExecution: status?.date,
      durationMs: status?.duration,
      processed: status?.processed,
      nextScheduled: '02:00 UTC (quotidien)',
    };
  }
}
