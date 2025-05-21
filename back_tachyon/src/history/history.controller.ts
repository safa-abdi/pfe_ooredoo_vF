import { Controller, Get, Query } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('msisdn-history')
  async getHistoryMSISDN(
    @Query('crm_case') crm_case: string,
    @Query('msisdn') MSISDN: string,
  ) {
    return this.historyService.getHistoryMSISDN(crm_case, MSISDN);
  }
}