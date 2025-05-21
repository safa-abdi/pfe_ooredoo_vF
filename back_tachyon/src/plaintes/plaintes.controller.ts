/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { PlainteService } from './plaintes.service';
import { Plainte } from './entities/plaintes.entity';
import { BatchAssignSttDto } from './dto/batch-assign-stt.dto';
import { BatchClotureDto } from './dto/BatchClotureDto.dto';
import { UpdatePlainteDto } from './dto/update-plainte.dto';
import { PaginationDto } from 'src/activation/dto/pagination.dto';
import { PlainteFrozenDto } from './dto/plaintefrozen.dto';

@Controller('plainte')
export class PlainteController {
  constructor(private readonly plaintesService: PlainteService) {}

  @Get('paginated')
  async getPaginatedStats(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.plaintesService.getPaginatedStats(page, limit);
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
      offre?: string;
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
      offre,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      Description,
      STATUT,
    } = query;

    return this.plaintesService.findPlaintesByCompany(
      companyId,
      searchTerm,
      page,
      limit,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      offre,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      Description,
      STATUT,
    );
  }
  @Get('count-by-status-tech')
  async getCountByStatus(
    @Query('sttId') sttId: number,
    @Query('technicianId') technicianId: number,
    @Query('Gouv') Gouv: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.plaintesService.getCountOfPlaintesBySttId_technicien(
      sttId,
      technicianId,
      Gouv,
      start,
      end,
    );
  }
  @Put('assign-delegation')
  async assignDelegation(
    @Body('plainteIds') plainteIds: number[],
    @Body('technicianId') technicianId: number,
    @Body('companyId') companyId: number,
  ): Promise<Plainte[]> {
    return this.plaintesService.assignTechnicianToActivations(
      plainteIds,
      technicianId,
      companyId,
    );
  }
  @Get('inProgress')
  async findAllInProgress(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const parsedLimit = Math.min(Number(limit) || 100, 1000);
    const parsedCursor = cursor || null;

    const result = await this.plaintesService.findAllInProgressCursorPaginated(
      parsedCursor,
      parsedLimit,
    );

    return {
      data: result.data,
      meta: {
        next_cursor: result.nextCursor,
        limit: parsedLimit,
      },
    };
  }
  @Get()
  async findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    const parsedLimit = Math.min(Number(limit) || 100, 1000);
    const parsedCursor = cursor || null;

    const result = await this.plaintesService.findAllCursorPaginated(
      parsedCursor,
      parsedLimit,
    );

    return {
      data: result.data,
      meta: {
        next_cursor: result.nextCursor,
        limit: parsedLimit,
      },
    };
  }

  @Get('problemes')
  async findAllPblemCursorPaginated(
    @Query('lastId') rawLastId?: string,
    @Query('limit') rawLimit?: string,
    @Query('search') search?: string,
  ): Promise<{
    data: Plainte[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const lastId = rawLastId && rawLastId !== '' ? rawLastId : null;
    const limit = rawLimit ? parseInt(rawLimit, 10) : 100;

    return this.plaintesService.findAllPblemCursorPaginated(
      lastId,
      limit,
      search,
    );
  }

  @Get('recurring')
  async getRecurringComplaints(): Promise<Plainte[]> {
    return this.plaintesService.findRecurringComplaintsSingleQuery();
  }

  @Get('sla/stt')
  async getAverageSLABySTT(@Query('period') period: string) {
    return this.plaintesService.getAverageSLABySTT(period);
  }

  @Get('valid')
  async findAllWithPagination(
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
      offre?: string;
      REP_RDV?: string;
      DATE_PRISE_RDV?: string;
      CMT_RDV?: string;
      METRAGE_CABLE?: number;
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
      offre,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      STATUT,
    } = query;

    const numericPage = page ? Number(page) : 1;
    const numericLimit = limit ? Number(limit) : 50;

    return this.plaintesService.findAllValidComplaintsCursorPaginated(
      searchTerm,
      numericPage,
      numericLimit,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      offre,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      STATUT,
    );
  }
  @Put('link-plaintes')
  async linkPlaintes() {
    return this.plaintesService.linkPlaintes();
  }
  @Put('linkByCrmCase/:crmCase')
  async linkByCrmCase(@Param('crmCase') crmCase: string) {
    return this.plaintesService.linkPlainte_BySpecificCrm_case(crmCase);
  }
  @Get('by-company')
  async getPlaintesByCompany(
    @Query('companyId') companyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('msisdn') msisdn?: string,
    @Query('client') client?: string,
    @Query('gouvernorat') gouvernorat?: string,
    @Query('cursorDate') cursorDate?: string,
    @Query('direction') direction?: 'next' | 'prev',
    @Query('STATUT') STATUT?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      msisdn,
      client,
      gouvernorat,
      cursorDate: cursorDate ? new Date(cursorDate) : undefined,
      direction,
      STATUT,
    };

    const parsedLimit = limit ? parseInt(limit, 10) : 20;

    const result = await this.plaintesService.findPlaintByCompanyWithCursor(
      companyId,
      filters,
      parsedLimit,
    );

    return result;
  }
  // @Get('stt/:sttId/in-progress-count/:Gouv')
  // getCountOfInProgressActivationsBySttId(
  //   @Param('sttId') sttId: number,
  //   @Param('Gouv') Gouv: string,
  // ): number {
  //   return this.plaintesService.getCountOfInProgressActivationsBySttId_Gouv(
  //     sttId,
  //     Gouv,
  //   );
  // }
  // @Get('stt/:sttId/in-progress-count/:Gouv/:Deleg')
  // getCountOfInProgressActivationsBySttId_Deleg(
  //   @Param('sttId') sttId: number,
  //   @Param('Gouv') Gouv: string,
  //   @Param('Deleg') Deleg: string,
  // ): number {
  //   return this.plaintesService.getCountOfInProgressActivationsBySttId_Gouv_Del(
  //     sttId,
  //     Gouv,
  //     Deleg,
  //   );
  // }
  @Put('batch-assign-stt')
  async batchAssignStt(@Body() batchAssignSttDto: BatchAssignSttDto) {
    return this.plaintesService.batchAssignStt(batchAssignSttDto);
  }
  @Put('batch-cloture-ByZM')
  async batchClotureByZM(@Body() batchClotureDto: BatchClotureDto) {
    return this.plaintesService.batchClotureTask(batchClotureDto);
  }
  @Patch()
  async updatePlainte(@Body() dto: UpdatePlainteDto): Promise<Plainte> {
    return this.plaintesService.updatePlainte(dto);
  }
  @Get('technicien/count-by-status-tech')
  async getCountByStatusTechn(
    @Query('technicianId') technicianId: number,
    @Query('Gouv') Gouv?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.plaintesService.getCountOfPlaintesBy_technicien(
      technicianId,
      Gouv,
      start,
      end,
    );
  }
  @Get('by-technician/:technicienId')
  async getPlaintesByTechnician(
    @Param('technicienId') technicienId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.plaintesService.findPlaintesByTechnician(
      technicienId,
      pagination,
    );
  }
  @Put('prise-rdv-technicien')
  async priseRdvTechnicien(
    @Body() body: { plainteId: string; DATE_PRISE_RDV: Date },
  ): Promise<Plainte> {
    const { plainteId, DATE_PRISE_RDV } = body;

    if (!plainteId || !DATE_PRISE_RDV) {
      throw new BadRequestException('plainteId et DATE_PRISE_RDV sont requis');
    }

    try {
      return await this.plaintesService.PriseRDV_technicien(
        plainteId,
        new Date(DATE_PRISE_RDV),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('probleme-rdv-technicien')
  async pblemeRdvTechnicien(
    @Body() body: { plainteId: string; raison: string; cmntr: string },
  ): Promise<Plainte> {
    const { plainteId, raison, cmntr } = body;

    if (!plainteId || !raison) {
      throw new BadRequestException('activationId et raison sont requis');
    }

    try {
      return await this.plaintesService.detectRDVPblem_technicien(
        plainteId,
        raison,
        cmntr,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Put('technicien/marquer-debut-travaux')
  async marquerDebutTravaux(
    @Body() body: { plainteId: string },
  ): Promise<Plainte> {
    const { plainteId } = body;

    if (!plainteId) {
      throw new BadRequestException('Le champ activationId est requis.');
    }

    try {
      return await this.plaintesService.MarquerDebut_travaux(plainteId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('in-progress-by-company')
  async getInProgressPlaintesGroupedByCompany(
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    return this.plaintesService.getInProgressPlaintesGroupedByCompany(
      page,
      limit,
    );
  }
  @Get('frozen')
  async getFrozenActivations(
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    return this.plaintesService.getFrozenplaintes(1, 10000, gouvernorat);
  }

  @Get('non_affected')
  async getNonAffectedComplaint(
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    return this.plaintesService.getNon_affectedplaintes(1, 10000, gouvernorat);
  }

  @Get('En_rdv')
  async getEnRdv(@Query('gouvernorat') gouvernorat?: string): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    return this.plaintesService.getEnRDVplaintes(1, 10000, gouvernorat);
  }

  @Get('En_travaux')
  async getEnTravaux(@Query('gouvernorat') gouvernorat?: string): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    return this.plaintesService.getEnWork(1, 10000, gouvernorat);
  }
}
