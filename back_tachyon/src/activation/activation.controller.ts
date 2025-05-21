/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ActivationService } from './activation.service';
import { Activation } from './entities/activation.entity';
import { ActivationFiltersDto } from './dto/ActivationFiltersDto';
import { PaginationDto } from './dto/pagination.dto';
import { BatchAssignSttDto } from './dto/batch-assign-stt.dto';
import { ActivationFrozenDto } from './dto/ListPartsActivation.dto';
import { BatchClotureDto } from './dto/BatchClotureDto.dto';

@Controller('activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Get('all_inprogress')
  async findAllInprogressWithCursor(
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
      cursor,
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
      METRAGE_CABLE,
      STATUT,
    } = query;

    const numericCursor = cursor ? parseInt(cursor, 10) : undefined;

    return this.activationService.findAllInprogressWithCursor(
      searchTerm,
      numericCursor,
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
      METRAGE_CABLE,
      STATUT,
    );
  }
  @Get('countAll')
  async getCount(
    @Query('searchTerm') searchTerm?: string,
    @Query('REP_TRAVAUX_STT') REP_TRAVAUX_STT?: string,
    @Query('gouvernorat') gouvernorat?: string,
    @Query('delegation') delegation?: string,
    @Query('DATE_AFFECTATION_STT') DATE_AFFECTATION_STT?: string,
    @Query('DES_PACK') DES_PACK?: string,
    @Query('offre') offre?: string,
    @Query('REP_RDV') REP_RDV?: string,
    @Query('DATE_PRISE_RDV') DATE_PRISE_RDV?: string,
    @Query('CMT_RDV') CMT_RDV?: string,
    @Query('METRAGE_CABLE') METRAGE_CABLE?: number,
  ): Promise<{ STATUT: string; count: number }[]> {
    const result = await this.activationService.countAllByStatusGroupByStatut(
      searchTerm,
      REP_TRAVAUX_STT,
      gouvernorat,
      delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      offre,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      METRAGE_CABLE,
    );

    return result;
  }

  @Get('problemes')
  async findAllPblemCursorPaginated(
    @Query('lastId') lastId: string | null = null,
    @Query('limit') limit: number = 100,
  ): Promise<{ data: Activation[]; nextCursor: string | null; total: number }> {
    return this.activationService.findAllPblemCursorPaginated(lastId, limit);
  }

  @Get('all')
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
      METRAGE_CABLE,
      STATUT,
    } = query;

    const numericPage = page ? Number(page) : 1;
    const numericLimit = limit ? Number(limit) : 50;

    return this.activationService.findAllWithPagination(
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
      METRAGE_CABLE,
      STATUT,
    );
  }
  @Get('paginated')
  async getPaginatedStats(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.activationService.getPaginatedStats(page, limit);
  }

  @Put('link-activations')
  async linkActivations() {
    return this.activationService.linkActivations();
  }
  @Get('linkSingle')
  async linkActivation(@Query('crm') crmCase: string) {
    if (!crmCase) {
      return {
        success: false,
        message: 'Le paramètre ?crm= est requis',
      };
    }

    const result =
      await this.activationService.linkActivation_BySpecificCrm_case(crmCase);

    return {
      success: result,
      crmCase,
      message: result
        ? `Activation ${crmCase} liée avec succès`
        : `Échec du lien pour ${crmCase} (non trouvée ou erreur)`,
    };
  }
  @Put(':id/assign-stt')
  async assignSTT(
    @Param('id') activationId: string,
    @Body()
    body: { sttName: string; companyId?: number },
  ) {
    return this.activationService.assignSTTToActivation(
      activationId,
      body.sttName,
    );
  }
  @Get(':id/sla')
  async getSLA(@Param('id') id: number) {
    return this.activationService.getSLA(id);
  }

  @Get('sla/stt')
  async getAverageSLABySTT(@Query('period') period: string) {
    return this.activationService.getAverageSLABySTT(period);
  }
  @Get('sla/branch')
  async getAverageSLAByBranch(@Query('period') period: string) {
    return this.activationService.getAverageSLAByBranch(period);
  }
  @Get('stt/highest-average-delay')
  async getSttWithHighestAverageDelay() {
    const result =
      await this.activationService.findSttWithHighestAverageDelay();
    if (!result) {
      return { message: 'No STT found with delay data' };
    }
    return {
      sttName: result.nameStt,
      averageDelayHours: result.averageSlaStt,
      message: `The STT with the highest average delay is ${result.nameStt} with an average of ${result.averageSlaStt} hours`,
    };
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
      METRAGE_CABLE,
      STATUT,
    } = query;

    return this.activationService.findActivationsByCompany(
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
      METRAGE_CABLE,
      STATUT,
    );
  }

  @Get('test-auto-affectation')
  async testerAutoAffectation() {
    return this.activationService.testerAutoAffectationSurDonneesExistantes();
  }

  @Put('batch-assign-stt/:user_id')
  async batchAssignStt(
    @Body() batchAssignSttDto: BatchAssignSttDto,
    @Param('user_id') userId: string,
  ) {
    return this.activationService.batchAssignStt(batchAssignSttDto, {
      id: userId,
    });
  }

  @Get('stt/:sttId/in-progress-count/:Gouv')
  async getCountOfInProgressActivationsBySttId(
    @Param('sttId') sttId: number,
    @Param('Gouv') Gouv: string,
  ): Promise<number> {
    return this.activationService.getCountOfInProgressActivationsBySttId_Gouv(
      sttId,
      Gouv,
    );
  }
  @Get('stt/:sttId/in-progress-count/:Gouv/:Deleg')
  async getCountOfInProgressActivationsBySttId_Deleg(
    @Param('sttId') sttId: number,
    @Param('Gouv') Gouv: string,
    @Param('Deleg') Deleg: string,
  ): Promise<number> {
    return this.activationService.getCountOfInProgressActivationsBySttId_Gouv_Del(
      sttId,
      Gouv,
      Deleg,
    );
  }
  @Get('in-progress-by-company')
  async getInProgressActivationsGroupedByCompany(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
  ) {
    return this.activationService.getInProgressActivationsGroupedByCompany(
      page,
      limit,
    );
  }

  @Get('in-progress-by-gouvernorat')
  async getInProgressActivationsGroupedByGovernorate(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
  ) {
    return this.activationService.getInProgressActivationsGroupedByGouvernorat(
      page,
      limit,
    );
  }
  @Get('frozen')
  async getFrozenActivations(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    return this.activationService.getFrozenActivations(
      page,
      limit,
      gouvernorat,
    );
  }

  @Get('non_affected')
  async getNon_affectedActivations(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    return this.activationService.getNonAffectedActivations(
      page,
      limit,
      gouvernorat,
    );
  }

  @Get('En_rdv')
  async getEnRDVActivations(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('getAll') getAll = false,
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    return this.activationService.getInRdvActivations(
      page,
      getAll ? undefined : limit,
      getAll,
      gouvernorat,
    );
  }

  @Get('En_travaux')
  async getEnTravaux(
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
    @Query('getAll') getAll = false,
    @Query('gouvernorat') gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    return this.activationService.getEnWorkActivations(
      page,
      getAll ? undefined : limit,
      getAll,
      gouvernorat,
    );
  }

  //   @Get('linkSingle')
  //   async linkActivation(@Query('crm') crmCase: string) {
  //     if (!crmCase) {
  //       return {
  //         success: false,
  //         message: 'Le paramètre ?crm= est requis',
  //       };
  //     }

  //     // const result =
  //     //   await this.activationService.linkActivation_BySpecificCrm_case(crmCase);

  //     // return {
  //     //   success: result,
  //     //   crmCase,
  //     //   message: result
  //     //     ? `Activation ${crmCase} liée avec succès`
  //     //     : `Échec du lien pour ${crmCase} (non trouvée ou erreur)`,
  //     // };
  //   }
  @Get('by-company-and-technician/:companyId/:technicienId')
  async getActivationsByCompanyAndTechnician(
    @Param('companyId') companyId: number,
    @Param('technicienId') technicienId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.activationService.findActivationsByCompanyAndTechnician(
      companyId,
      technicienId,
      pagination,
    );
  }

  @Put('prise-rdv-technicien')
  async priseRdvTechnicien(
    @Body() body: { activationId: string; DATE_PRISE_RDV: Date },
  ): Promise<Activation> {
    const { activationId, DATE_PRISE_RDV } = body;

    if (!activationId || !DATE_PRISE_RDV) {
      throw new BadRequestException(
        'activationId et DATE_PRISE_RDV sont requis',
      );
    }

    try {
      return await this.activationService.PriseRDV_technicien(
        activationId,
        new Date(DATE_PRISE_RDV),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('probleme-rdv-technicien')
  async pblemeRdvTechnicien(
    @Body() body: { activationId: string; raison: string; cmntr: string },
  ): Promise<Activation> {
    const { activationId, raison, cmntr } = body;

    if (!activationId || !raison) {
      throw new BadRequestException('activationId et raison sont requis');
    }

    try {
      return await this.activationService.detectRDVPblem_technicien(
        activationId,
        raison,
        cmntr,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('technicien/marquer-debut-travaux')
  async marquerDebutTravaux(
    @Body() body: { activationId: string },
  ): Promise<Activation> {
    const { activationId } = body;

    if (!activationId) {
      throw new BadRequestException('Le champ activationId est requis.');
    }

    try {
      return await this.activationService.MarquerDebut_travaux(activationId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('by-technician/:technicienId')
  async getActivationsByTechnician(
    @Param('technicienId') technicienId: number,
    @Query() pagination: PaginationDto,
  ) {
    return this.activationService.findActivationsByTechnician(
      technicienId,
      pagination,
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

    return this.activationService.getCountOfActivationsBySttId_technicien(
      sttId,
      technicianId,
      Gouv,
      start,
      end,
    );
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

    return this.activationService.getCountOfActivationsBy_technicien(
      technicianId,
      Gouv,
      start,
      end,
    );
  }
  @Get('technicien/count-by-statusFinale-tech')
  async getCountByStatusFinalTechn(
    @Query('technicianId') technicianId: number,
    @Query('Gouv') Gouv?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.activationService.getCountOfActivationsBy_technicien(
      technicianId,
      Gouv,
      start,
      end,
    );
  }
  @Put('assign-delegation')
  async assignDelegation(
    @Body('activationIds') activationIds: number[],
    @Body('technicianId') technicianId: number,
    @Body('companyId') companyId: number,
  ): Promise<Activation[]> {
    return this.activationService.assignTechnicianToActivations(
      activationIds,
      technicianId,
      companyId,
    );
  }
  @Put('batch-cloture-ByZM/:user_id')
  async batchClotureByZM(
    @Body() batchClotureDto: BatchClotureDto,
    @Param('user_id') userId: string,
  ) {
    return this.activationService.batchClotureTask(batchClotureDto, {
      id: userId,
    });
  }
}
