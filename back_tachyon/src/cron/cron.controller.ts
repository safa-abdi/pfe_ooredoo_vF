import { Controller, Get, Post, Query } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller('test-cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post()
  async triggerCronManually() {
    return this.cronService.handleSlaCriticalCalculations();
  }
  // @Get('sla-critiques')
  // async getSlaCritiques() {
  //   return await this.cronService.getAllCritiques();
  // }
  @Get('sla-critiques')
  async getSlaCritiques(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return await this.cronService.getAllCritiques(page, limit);
  }
}
