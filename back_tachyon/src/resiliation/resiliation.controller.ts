import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ResiliationService } from './resiliation.service';
import { Resiliation } from './entities/resiliation.entity';

@Controller('resiliation')
export class ResiliationController {
  constructor(private readonly resiliationService: ResiliationService) {}

  @Get('problemes')
  async findAllPblemCursorPaginated(
    @Query('lastId') rawLastId?: number,
    @Query('limit') rawLimit?: string,
    @Query('search') search?: string,
  ): Promise<{
    data: Resiliation[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const lastId = rawLastId && rawLastId.toString() !== '' ? rawLastId : null;
    const limit = rawLimit ? parseInt(rawLimit, 10) : 100;

    return this.resiliationService.findAllPblemCursorPaginated(
      lastId,
      limit,
      search,
    );
  }
  @Get('sla/stt')
  async getAverageSLABySTT(@Query('period') period: string) {
    return this.resiliationService.getAverageSLABySTT(period);
  }

  @Get('company/:companyId')
  async getByCompany(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Query()
    query: {
      searchTerm?: string;
      page?: number;
      limit?: number;
      REP_TRAVAUX_STT?: string;
      gouvernorat?: string;
      delegation?: string;
      DATE_AFFECTATION_STT?: string;
      DES_PACK?: string;
      Detail?: string;
      REP_RDV?: string;
      DATE_PRISE_RDV?: string;
      CMT_RDV?: string;
      Description?: number;
      STATUT?: string;
    },
  ) {
    const {
      searchTerm,
      page = 1,
      limit = 50,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      Detail,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      Description,
      STATUT,
    } = query;

    return this.resiliationService.findResiliaByCompany(
      companyId,
      searchTerm,
      page,
      limit,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      Detail,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      Description,
      STATUT,
    );
  }
  @Get('paginated')
  async getPaginatedStats(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.resiliationService.getPaginatedStats(page, limit);
  }
  @Get('valid')
  async findAllWithCursorPagination(
    @Query()
    query: {
      searchTerm?: string;
      cursor?: string;
      limit?: number;
      REP_TRAVAUX_STT?: string;
      gouvernorat?: string;
      delegation?: string;
      DATE_AFFECTATION_STT?: string;
      DES_PACK?: string;
      Detail?: string;
      REP_RDV?: string;
      DATE_PRISE_RDV?: string;
      CMT_RDV?: string;
      METRAGE_CABLE?: number;
      STATUT?: string;
    },
  ) {
    const {
      searchTerm,
      limit = 50,
      cursor,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      Detail,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      STATUT,
    } = query;

    const numericLimit = limit ? Number(limit) : 50;

    return this.resiliationService.findAllValidResiliationsCursorPaginated(
      searchTerm,
      numericLimit,
      cursor,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      Detail,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      STATUT,
    );
  }
}
