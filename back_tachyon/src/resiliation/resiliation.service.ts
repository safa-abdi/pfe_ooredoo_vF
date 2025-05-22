/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Company } from 'src/companies/entities/company.entity';
import { Delegation } from 'src/branches_companies/entities/Delegation.entity';
import { CacheService } from 'src/cache/cache.service';
import { PaginationDto } from '../activation/dto/pagination.dto';
import { Resiliation } from './entities/resiliation.entity';
import { ResiliationFrozenDto } from './dto/resiliationfrozen.dto';
import { UpdateResiliationDto } from './dto/update-res.dto';
import { BatchClotureDto } from './dto/BatchClotureRes.dto';
import { BatchAssignSttDto } from './dto/batch-assign-stt.dto';

export type ResiliationWithoutPdf = Omit<
  Resiliation,
  | 'pdfFile'
  | 'pdfMimeType'
  | 'calculateSLAs'
  | 'normalizeDates'
  | 'parseDate'
  | 'calcHoursDiff'
>;

@Injectable()
export class ResiliationService {
  private readonly logger = new Logger(ResiliationService.name);

  constructor(
    @InjectRepository(Resiliation)
    private readonly ResiliationRepository: Repository<Resiliation>,
    @InjectRepository(CompanyDelegation)
    private readonly companyDelegationRepository: Repository<CompanyDelegation>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Delegation)
    private readonly delegationRepository: Repository<Delegation>,
    private cacheService: CacheService,
  ) {}

  async countAllByStatusGroupByStatut(
    searchTerm?: string,
    REP_TRAVAUX_STT?: string,
    gouvernorat?: string,
    delegation?: string,
    DATE_AFFECTATION_STT?: string,
    DES_PACK?: string,
    offre?: string,
    REP_RDV?: string,
    DATE_PRISE_RDV?: string,
    CMT_RDV?: string,
    METRAGE_CABLE?: number,
  ): Promise<{ STATUT: string; count: number }[]> {
    const queryBuilder = this.ResiliationRepository.createQueryBuilder(
      'resiliation',
    )
      .leftJoin('resiliation.company', 'company')
      .select('resiliation.STATUT', 'STATUT')
      .addSelect('COUNT(*)', 'count')
      .groupBy('resiliation.STATUT');

    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('resiliation.client LIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('resiliation.msisdn LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.contact1_client LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.Gouvernorat LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.Delegation LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.crm_case LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('resiliation.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    if (REP_TRAVAUX_STT) {
      queryBuilder.andWhere('resiliation.REP_TRAVAUX_STT = :REP_TRAVAUX_STT', {
        REP_TRAVAUX_STT,
      });
    }

    if (gouvernorat) {
      queryBuilder.andWhere('resiliation.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `%${gouvernorat}%`,
      });
    }

    if (delegation) {
      queryBuilder.andWhere('resiliation.Delegation LIKE :delegation', {
        delegation: `%${delegation}%`,
      });
    }

    if (DATE_AFFECTATION_STT) {
      queryBuilder.andWhere(
        'resiliation.DATE_AFFECTATION_STT = :DATE_AFFECTATION_STT',
        { DATE_AFFECTATION_STT },
      );
    }

    if (DES_PACK) {
      queryBuilder.andWhere('resiliation.DES_PACK LIKE :DES_PACK', {
        DES_PACK: `%${DES_PACK}%`,
      });
    }

    if (offre) {
      queryBuilder.andWhere('resiliation.offre LIKE :offre', {
        offre: `%${offre}%`,
      });
    }

    if (REP_RDV) {
      queryBuilder.andWhere('resiliation.REP_RDV = :REP_RDV', { REP_RDV });
    }

    if (DATE_PRISE_RDV) {
      queryBuilder.andWhere('resiliation.DATE_PRISE_RDV = :DATE_PRISE_RDV', {
        DATE_PRISE_RDV,
      });
    }

    if (CMT_RDV) {
      queryBuilder.andWhere('resiliation.CMT_RDV LIKE :CMT_RDV', {
        CMT_RDV: `%${CMT_RDV}%`,
      });
    }

    if (METRAGE_CABLE) {
      queryBuilder.andWhere('resiliation.METRAGE_CABLE = :METRAGE_CABLE', {
        METRAGE_CABLE,
      });
    }

    const result = await queryBuilder.getRawMany();
    return result.map((r) => ({
      STATUT: r.STATUT,
      count: parseInt(r.count, 10),
    }));
  }
  async findResiliaByCompany(
    companyId: number,
    searchTerm?: string,
    page: number = 1,
    limit: number = 50,
    REP_TRAVAUX_STT?: string,
    gouvernorat?: string,
    delegation?: string,
    DATE_AFFECTATION_STT?: string,
    DES_PACK?: string,
    Detail?: string,
    REP_RDV?: string,
    DATE_PRISE_RDV?: string,
    CMT_RDV?: string,
    Description?: number,
    STATUT?: string,
  ): Promise<{ data: ResiliationWithoutPdf[]; total: number }> {
    const queryBuilder = this.ResiliationRepository.createQueryBuilder(
      'p',
    ).where('p.company_id = :companyId', { companyId });

    const validatedPage = Math.max(page, 1);
    const validatedLimit = Math.min(limit, 100);

    queryBuilder
      .orderBy('p.crm_case', 'ASC')
      .skip((validatedPage - 1) * validatedLimit)
      .take(validatedLimit);

    if (searchTerm) {
      const likeCondition = (field: string) =>
        new Brackets((qb) => {
          qb.where(`p.${field} LIKE :searchTerm`, {
            searchTerm: `%${searchTerm}%`,
          });
        });

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.orWhere(likeCondition('CLIENT'))
            .orWhere(likeCondition('MSISDN'))
            .orWhere(likeCondition('CONTACT_CLIENT'))
            .orWhere(likeCondition('CONTACT2_CLIENT'))
            .orWhere(likeCondition('Gouvernorat'))
            .orWhere(likeCondition('Delegation'))
            .orWhere(likeCondition('crm_case'))
            .orWhere(likeCondition('STT'))
            .orWhere(likeCondition('Detail'));
        }),
      );
    }

    const filters = {
      REP_TRAVAUX_STT,
      Gouvernorat: gouvernorat,
      Delegation: delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      Detail,
      REP_RDV,
      DATE_PRISE_RDV,
      CMT_RDV,
      Description,
      STATUT,
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          queryBuilder.andWhere(`p.${key} LIKE :${key}`, {
            [key]: `%${value}%`,
          });
        } else {
          queryBuilder.andWhere(`p.${key} = :${key}`, { [key]: value });
        }
      }
    });

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map(({ pdfFile, ...rest }) => rest),
      total,
    };
  }

  async getPaginatedStats(page: number = 1, limit: number = 50) {
    const queryBuilder = this.ResiliationRepository.createQueryBuilder('r')
      .select([
        'r.STT as "stt"',
        'COUNT(r.crm_case) as "total"',
        `SUM(CASE WHEN r.STATUT = 'Terminé' THEN 1 ELSE 0 END) as "termine"`,
        `SUM(CASE WHEN r.STATUT = 'En cours' THEN 1 ELSE 0 END) as "enCours"`,
        `SUM(CASE WHEN r.STATUT = 'Abandonné' THEN 1 ELSE 0 END) as "abandonne"`,
      ])
      .where('r.STT IS NOT NULL AND r.STT != :empty', { empty: '' })
      .groupBy('r.STT')
      .orderBy('"total"', 'DESC');

    if (limit > 0) {
      queryBuilder.offset((page - 1) * limit).limit(limit);
    }

    const [items, total] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    return {
      data: items.map((item) => ({
        stt: item.stt,
        total: parseInt(item.total),
        terminated: parseInt(item.termine), // Notez le mapping ici
        inProgress: parseInt(item.enCours),
        abandoned: parseInt(item.abandonne),
      })),
      meta: {
        total,
        page,
        last_page: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    };
  }
  async assignSTTToresiliation(
    resiliationId: string,
    sttName: string,
    companyDelegationId?: number,
    companyId?: number,
  ): Promise<Resiliation> {
    const resiliation = await this.ResiliationRepository.findOne({
      where: { crm_case: resiliationId },
    });

    if (!resiliation) {
      throw new Error('resiliation non trouvée');
    }

    resiliation.STT = sttName;
    resiliation.DATE_AFFECTATION_STT = new Date();
    resiliation.REP_TRAVAUX_STT = 'en cours';
    resiliation.STATUT = 'en cours';
    resiliation.company = null;
    resiliation.companyDelegation = null;

    if (companyDelegationId) {
      const companyDelegation = await this.companyDelegationRepository.findOne({
        where: { id: companyDelegationId },
      });
      if (!companyDelegation) {
        throw new Error('Branche non trouvée');
      }
      resiliation.companyDelegation = companyDelegation;

      if (!companyId && companyDelegation.company) {
        resiliation.company = companyDelegation.company;
      }
    }

    if (companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new Error('Company non trouvée');
      }
      resiliation.company = company;
    }

    return await this.ResiliationRepository.save(resiliation);
  }

  private async getAverageSLA(groupBy: string, period: string) {
    let dateCondition = '';
    if (period === 'week') {
      dateCondition = `DATE_PART('week', a.last_sync) = DATE_PART('week', NOW())`;
    } else if (period === 'month') {
      dateCondition = `DATE_PART('month', a.last_sync) = DATE_PART('month', NOW())`;
    } else if (period === 'year') {
      dateCondition = `DATE_PART('year', a.last_sync) = DATE_PART('year', NOW())`;
    }

    const whereConditions = [
      dateCondition,
      groupBy === 'STT' ? "a.STT IS NOT NULL AND a.STT != ''" : '1=1',
    ]
      .filter(Boolean)
      .join(' AND ');

    const groupedResults = await this.ResiliationRepository.createQueryBuilder(
      'a',
    )
      .select([
        `${groupBy} AS group_by`,
        `AVG(a.SLA_STT) AS avg_sla_stt`,
        `AVG(a.TEMPS_MOYEN_PRISE_RDV) AS avg_temps_rdv`,
      ])
      .where(whereConditions)
      .groupBy(groupBy)
      .getRawMany();

    const globalResults = await this.ResiliationRepository.createQueryBuilder(
      'a',
    )
      .select([
        `AVG(a.SLA_EQUIPE_FIXE) AS avg_sla_equipe`,
        `AVG(a.TEMPS_MOYEN_AFFECTATION_STT) AS avg_temps_affectation`,
      ])
      .where(dateCondition)
      .getRawOne();

    return {
      avg_sla_equipe: globalResults.avg_sla_equipe || 0,
      avg_temps_affectation: globalResults.avg_temps_affectation || 0,
      details: groupedResults.filter((item) => item.group_by),
    };
  }

  async getAverageSLABySTT(period: string) {
    return this.getAverageSLA('STT', period);
  }
  async findAllPblemCursorPaginated(
    lastId: number | null = null,
    limit: number = 100,
    search?: string,
  ): Promise<{
    data: Resiliation[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query = this.ResiliationRepository.createQueryBuilder('p')
      .where("p.STATUT IN ('En cours', 'Gelé')")
      .andWhere(
        new Brackets((qb) => {
          qb.where('p.LONGITUDE_SITE = 0')
            .orWhere('p.LONGITUDE_SITE > 11')
            .orWhere('p.LONGITUDE_SITE < 6')
            .orWhere('p.LATITUDE_SITE = 0')
            .orWhere('p.LATITUDE_SITE > 38')
            .orWhere('p.LATITUDE_SITE < 30')
            .orWhere('p.Gouvernorat IS NULL')
            .orWhere("p.Gouvernorat = ''");
        }),
      );

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('p.crm_case LIKE :search', { search: `%${search}%` })
            .orWhere('p.Gouvernorat LIKE :search', { search: `%${search}%` })
            .orWhere('p.Delegation LIKE :search', { search: `%${search}%` })
            .orWhere('p.entite LIKE :search', { search: `%${search}%` })
            .orWhere('p.STATUT LIKE :search', { search: `%${search}%` })
            .orWhere('p.CONTACT2_CLIENT LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('p.MSISDN LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('p.Description LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('p.offre LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('p.CLIENT LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere(
              'DATE_FORMAT(p.DATE_CREATION_CRM, "%d/%m/%Y") LIKE :search',
              {
                search: `%${search}%`,
              },
            )
            .orWhere(
              'DATE_FORMAT(p.DATE_CREATION_CRM, "%Y-%m-%d") LIKE :search',
              {
                search: `%${search.replace(/\//g, '-')}%`,
              },
            )
            .orWhere('p.DATE_CREATION_CRM LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('p.CONTACT_CLIENT LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    if (lastId) {
      query.andWhere('p.crm_case > :lastId', { lastId });
    }

    const data = await query
      .orderBy('p.crm_case', 'ASC')
      .take(limit + 1)
      .getMany();

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    return {
      data: items,
      nextCursor: hasMore ? items[items.length - 1]?.crm_case : null,
      hasMore,
    };
  }

  async findAllValidResiliationsCursorPaginated(
    searchTerm?: string,
    limit: number = 50,
    cursor?: string,
    REP_TRAVAUX_STT?: string,
    gouvernorat?: string,
    delegation?: string,
    DATE_AFFECTATION_STT?: string,
    DES_PACK?: string,
    offre?: string,
    REP_RDV?: string,
    DATE_PRISE_RDV?: string,
    CMT_RDV?: string,
    STATUT?: string,
  ): Promise<{
    data: any[];
    nextCursor?: string;
  }> {
    const baseQuery = this.ResiliationRepository.createQueryBuilder('p').where(
      new Brackets((qb) => {
        qb.where("p.STATUT NOT IN ('En cours', 'Gelé')").orWhere(
          new Brackets((subQb) => {
            subQb
              .where("p.STATUT IN ('En cours', 'Gelé')")
              .andWhere('p.LONGITUDE_SITE != 0')
              .andWhere('p.LONGITUDE_SITE BETWEEN 6 AND 11')
              .andWhere('p.LATITUDE_SITE != 0')
              .andWhere('p.LATITUDE_SITE BETWEEN 30 AND 38')
              .andWhere('p.Gouvernorat IS NOT NULL')
              .andWhere("p.Gouvernorat != ''");
          }),
        );
      }),
    );

    const queryBuilder = baseQuery.orderBy('p.crm_case', 'ASC');
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString();
      const [crmCaseCursor, idCursor] = decodedCursor.split('|');

      queryBuilder.andWhere(
        'p.crm_case > :crmCase OR (p.crm_case = :crmCase )',
        { crmCase: crmCaseCursor, id: idCursor },
      );
    }
    queryBuilder.take(limit + 1);
    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('p.CLIENT LIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('p.MSISDN LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.CONTACT_CLIENT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.Gouvernorat LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.Delegation LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.crm_case LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    if (REP_TRAVAUX_STT) {
      queryBuilder.andWhere('p.REP_TRAVAUX_STT = :REP_TRAVAUX_STT', {
        REP_TRAVAUX_STT,
      });
    }

    if (gouvernorat) {
      queryBuilder.andWhere('p.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `%${gouvernorat}%`,
      });
    }

    if (delegation) {
      queryBuilder.andWhere('p.Delegation LIKE :delegation', {
        delegation: `%${delegation}%`,
      });
    }

    if (DATE_AFFECTATION_STT) {
      queryBuilder.andWhere('p.DATE_AFFECTATION_STT = :DATE_AFFECTATION_STT', {
        DATE_AFFECTATION_STT,
      });
    }

    if (DES_PACK) {
      queryBuilder.andWhere('p.DES_PACK LIKE :DES_PACK', {
        DES_PACK: `%${DES_PACK}%`,
      });
    }

    if (offre) {
      queryBuilder.andWhere('p.offre LIKE :offre', { offre: `%${offre}%` });
    }

    if (REP_RDV) {
      queryBuilder.andWhere('p.REP_RDV = :REP_RDV', { REP_RDV });
    }

    if (DATE_PRISE_RDV) {
      queryBuilder.andWhere('p.DATE_PRISE_RDV = :DATE_PRISE_RDV', {
        DATE_PRISE_RDV,
      });
    }

    if (CMT_RDV) {
      queryBuilder.andWhere('p.CMT_RDV LIKE :CMT_RDV', {
        CMT_RDV: `%${CMT_RDV}%`,
      });
    }

    if (STATUT) {
      queryBuilder.andWhere('p.STATUT = :STATUT', { STATUT });
    }

    const results = await queryBuilder.getMany();

    let nextCursor: string | undefined = undefined;

    if (results.length > limit) {
      const nextItem = results[limit];
      const cursorValue = `${nextItem.crm_case}`;
      nextCursor = Buffer.from(cursorValue).toString('base64');
      results.pop();
    }

    return {
      data: results,
      nextCursor,
    };
  }
  private async findMatchingCompany(name: string): Promise<Company | null> {
    if (!name?.trim()) return null;

    return await this.companyRepository.findOne({
      where: [{ name: ILike(`%${name.trim()}%`) }],
    });
  }
  async linkResiliations(): Promise<{
    linked: number;
  }> {
    const resiliations = await this.ResiliationRepository.find({
      where: { companyDelegation: { id: IsNull() } },
      relations: ['company'],
    });

    let linked = 0;

    for (const resiliation of resiliations) {
      if (!resiliation.company && resiliation.STT) {
        resiliation.company = await this.findMatchingCompany(resiliation.STT);
        if (resiliation.company) {
          await this.ResiliationRepository.save(resiliation);
          linked++;
        }
      }
    }
    return { linked };
  }
  async linkResiliation_BySpecificCrm_case(crmCase: string): Promise<{
    success: boolean;
    message: string;
    linkedCompany?: boolean;
  }> {
    if (!crmCase.toString()?.trim()) {
      this.logger.warn('Tentative de lien sans CRM Case');
      return {
        success: false,
        message: 'Le CRM Case est requis',
      };
    }

    try {
      const resiliation = await this.ResiliationRepository.findOne({
        where: { crm_case: crmCase },
        relations: ['company', 'companyDelegation'],
      });

      if (!resiliation) {
        this.logger.warn(`Resiliation non trouvée pour CRM Case: ${crmCase}`);
        return {
          success: false,
          message: `Resiliation avec CRM Case ${crmCase} non trouvée`,
        };
      }

      let linkedCompany = false;

      if (!resiliation.company && resiliation.STT) {
        this.logger.debug(`Recherche company pour: ${resiliation.STT}`);
        resiliation.company = await this.findMatchingCompany(resiliation.STT);

        if (!resiliation.company) {
          this.logger.warn(`Company introuvable pour: ${resiliation.STT}`);
          return {
            success: false,
            message: `Company correspondant à ${resiliation.STT} non trouvée`,
          };
        }

        linkedCompany = true;
        await this.ResiliationRepository.save(resiliation);
        this.logger.log(`Company liée pour CRM Case: ${crmCase}`);
      }

      return {
        success: true,
        message: `Resiliation ${crmCase} traitée avec succès`,
        linkedCompany,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement de ${crmCase}:`,
        error.stack,
      );
      return {
        success: false,
        message: `Erreur serveur lors du traitement`,
      };
    }
  }
  async findPlaintByCompanyWithCursor(
    companyId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      msisdn?: string;
      client?: string;
      gouvernorat?: string;
      cursorDate?: Date;
      direction?: 'next' | 'prev';
    },
    limit: number = 20,
  ) {
    const direction = filters.direction || 'next';
    const cursorOperator = direction === 'prev' ? '>' : '<';
    const orderDirection = direction === 'prev' ? 'ASC' : 'DESC';

    const query = this.ResiliationRepository.createQueryBuilder('resiliation')
      .select('resiliation')
      .leftJoin('resiliation.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (filters.startDate) {
      query.andWhere('resiliation.OPENING_DATE_SUR_TIMOS >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('resiliation.OPENING_DATE_SUR_TIMOS <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.cursorDate) {
      query.andWhere(
        `resiliation.OPENING_DATE_SUR_TIMOS ${cursorOperator} :cursorDate`,
        { cursorDate: filters.cursorDate },
      );
    }

    if (filters.status) {
      query.andWhere('resiliation.STATUT LIKE :status', {
        status: `${filters.status}%`,
      });
    }

    if (filters.msisdn) {
      query.andWhere('resiliation.MSISDN = :msisdn', {
        msisdn: filters.msisdn,
      });
    }

    if (filters.client) {
      query.andWhere('resiliation.CLIENT LIKE :client', {
        client: `${filters.client}%`,
      });
    }

    if (filters.gouvernorat) {
      query.andWhere('resiliation.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `${filters.gouvernorat}%`,
      });
    }

    query.orderBy('resiliation.OPENING_DATE_SUR_TIMOS', orderDirection);
    query.take(limit + 1);

    const results = await query.getMany();
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    if (direction === 'prev') {
      data.reverse();
    }

    return {
      data,
      hasMore,
      nextCursor: data.length
        ? data[data.length - 1].OPENING_DATE_SUR_TIMOS
        : null,
      prevCursor: data.length ? data[0].OPENING_DATE_SUR_TIMOS : null,
    };
  }
  async getCountOfInProgressResiliationsBySttId_Gouv(
    sttId: number,
    Gouv: string,
  ): Promise<number> {
    return await this.ResiliationRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
      } as FindOptionsWhere<Resiliation>,
    });
  }
  async getCountOfInProgressResiliationsBySttId_Gouv_Del(
    sttId: number,
    Gouv: string,
    Deleg: string,
  ): Promise<number> {
    return await this.ResiliationRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
        Delegation: ILike(`%${Deleg}%`),
      } as FindOptionsWhere<Resiliation>,
    });
  }

  async getCountOfResiliationsBy_technicien(
    technicianId: number,
    Gouv?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.ResiliationRepository.createQueryBuilder('resiliation')
      .select('resiliation.REP_RDV', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('resiliation.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(resiliation.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('resiliation.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('resiliation.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('resiliation.REP_RDV');

    return query.getRawMany();
  }

  async batchAssignStt(batchAssignSttDto: BatchAssignSttDto) {
    const { resiliationIds, sttName, companyId } = batchAssignSttDto;
    const currentDate = new Date();

    await this.ResiliationRepository.createQueryBuilder()
      .update(Resiliation)
      .set({
        STT: sttName,
        REP_TRAVAUX_STT: 'en_cours',
        company: { id: companyId },
        companyDelegation: null,
        STATUT: 'En cours',
        DATE_AFFECTATION_STT: currentDate,
      })
      .where('crm_case IN (:...ids)', { ids: resiliationIds })
      .execute();

    return this.ResiliationRepository.find({
      where: { crm_case: In(resiliationIds) },
      relations: ['company'],
    });
  }
  async batchClotureTask(batchClotureDto: BatchClotureDto) {
    let { resiliationIds, note } = batchClotureDto;
    const currentDate = new Date();

    if (resiliationIds == null) {
      throw new Error('resiliationIds must be provided');
    }

    if (!Array.isArray(resiliationIds)) {
      resiliationIds = [resiliationIds];
    }

    if (resiliationIds.length === 0) {
      throw new Error('At least one resiliation ID must be provided');
    }

    if (!note || typeof note !== 'string') {
      throw new Error('Closure note is required and must be a string');
    }

    try {
      await this.ResiliationRepository.createQueryBuilder()
        .update(Resiliation)
        .set({
          STATUT: 'Abandonné',
          DATE_CLOTURE_ZM: currentDate,
          NOTE_CLOTURE_ZM: note,
          REP_TRAVAUX_STT: 'Abandonné',
        })
        .where('crm_case IN (:...ids)', { ids: resiliationIds })
        .execute();

      return await this.ResiliationRepository.find({
        where: { crm_case: In(resiliationIds) },
      });
    } catch (error) {
      console.error('Error in batchClotureTask:', error);
      throw new Error('Failed to batch close resiliations');
    }
  }
  async updateResiliation(dto: UpdateResiliationDto): Promise<Resiliation> {
    const resiliation = await this.ResiliationRepository.findOneBy({
      crm_case: dto.crm_case,
    });

    if (!resiliation) {
      throw new Error(`Resiliation with crm_case ${dto.crm_case} not found`);
    }

    if (dto.Gouvernorat !== undefined)
      resiliation.Gouvernorat = dto.Gouvernorat;
    if (dto.Delegation !== undefined) resiliation.Delegation = dto.Delegation;
    if (dto.LATITUDE_SITE !== undefined)
      resiliation.LATITUDE_SITE = dto.LATITUDE_SITE;
    if (dto.LONGITUDE_SITE !== undefined)
      resiliation.LONGITUDE_SITE = dto.LONGITUDE_SITE;
    if (dto.CLIENT !== undefined) resiliation.CLIENT = dto.CLIENT;
    if (dto.entite !== undefined) resiliation.entite = dto.entite;
    return await this.ResiliationRepository.save(resiliation);
  }
  async findResiliationsByTechnician(
    technicienId: number,
    pagination: PaginationDto,
  ) {
    const cacheKey = `Resiliations_technicien_${technicienId}_${pagination.page}_${pagination.take}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const query = this.ResiliationRepository.createQueryBuilder('resiliation')
      .innerJoin('resiliation.companyDelegation', 'companyDelegation')
      .innerJoin(
        'companyDelegation.technicien',
        'technicien',
        'technicien.id = :technicienId',
        { technicienId },
      )
      .leftJoinAndSelect('resiliation.company', 'company')
      .select([
        'resiliation.crm_case',
        'resiliation.DATE_CREATION_CRM',
        'resiliation.LATITUDE_SITE',
        'resiliation.LONGITUDE_SITE',
        'resiliation.MSISDN',
        'resiliation.CONTACT_CLIENT',
        'resiliation.CONTACT2_CLIENT',
        'resiliation.CLIENT',
        'resiliation.REP_TRAVAUX_STT',
        'resiliation.STT',
        'resiliation.Delegation',
        'resiliation.Gouvernorat',
        'resiliation.DATE_AFFECTATION_STT',
        'resiliation.DES_PACK',
        'resiliation.REP_RDV',
        'resiliation.DATE_PRISE_RDV',
        'resiliation.entite',
        'resiliation.Description',
        'resiliation.CMT_RDV',
        'resiliation.STATUT',
        'resiliation.DATE_FIN_TRV',
        'resiliation.DATE_debut_TRV',
        'resiliation.last_sync',
        'company.id',
        'company.name',
        'company.type',
        'company.adresse',
        'company.contact',
      ]);

    const [data, total] = await query
      .skip(pagination.skip)
      .take(pagination.take)
      .getManyAndCount();

    const result = {
      data,
      total,
      page: pagination.page,
      limit: pagination.take,
    };

    this.cacheService.set(cacheKey, result, 300).catch(console.error);

    return result;
  }
  async PriseRDV_technicien(
    resiliationId: string,
    DATE_PRISE_RDV: Date,
  ): Promise<Resiliation> {
    const resiliation = await this.ResiliationRepository.findOne({
      where: { crm_case: resiliationId },
    });

    if (!resiliation) {
      throw new Error('resiliation non trouvée');
    }

    resiliation.DATE_PRISE_RDV = DATE_PRISE_RDV;
    resiliation.REP_TRAVAUX_STT = 'en_cours';
    resiliation.STATUT = 'En cours';
    resiliation.REP_RDV = 'Confirmé';
    return await this.ResiliationRepository.save(resiliation);
  }

  async detectRDVPblem_technicien(
    resiliationId: string,
    raison: string,
    cmntr: string,
  ): Promise<Resiliation> {
    const resiliation = await this.ResiliationRepository.findOne({
      where: { crm_case: resiliationId },
    });

    if (!resiliation) {
      throw new Error('resiliation non trouvée');
    }
    if (raison.toLocaleLowerCase() == 'installé par le client') {
      resiliation.REP_TRAVAUX_STT = 'Effectué par le client';
      resiliation.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'abondonné') {
      resiliation.REP_TRAVAUX_STT = 'Effectué';
      resiliation.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'client ingoinable') {
      resiliation.REP_TRAVAUX_STT = 'Client injoignable';
      resiliation.STATUT = 'Gelé';
    }

    resiliation.REP_RDV = raison;
    resiliation.CMT_RDV = cmntr;
    return await this.ResiliationRepository.save(resiliation);
  }
  async MarquerDebut_travaux(resiliationId: string): Promise<Resiliation> {
    const resiliation = await this.ResiliationRepository.findOne({
      where: { crm_case: resiliationId },
    });
    const currentDate = new Date();
    if (!resiliation) {
      throw new Error('resiliation non trouvée');
    }

    resiliation.DATE_debut_TRV = currentDate;
    return await this.ResiliationRepository.save(resiliation);
  }
  async getInProgressResiliationsGroupedByCompany(
    page = 1,
    limit = 100,
  ): Promise<{
    [companyName: string]: { count: number; data: ResiliationFrozenDto[] };
  }> {
    const resiliations = await this.ResiliationRepository.find({
      where: {
        STATUT: 'En cours',
        REP_TRAVAUX_STT: Not('non_affecté_stt'),
      },
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const groupedResult = resiliations.reduce(
      (acc, resiliation) => {
        const companyName = resiliation.company?.name || 'Unknown';

        const resiliationDto: ResiliationFrozenDto = {
          crm_case: resiliation.crm_case,
          DATE_CREATION_CRM: resiliation.DATE_CREATION_CRM,
          LATITUDE_SITE: resiliation.LATITUDE_SITE,
          LONGITUDE_SITE: resiliation.LONGITUDE_SITE,
          MSISDN: resiliation.MSISDN,
          CONTACT_CLIENT: resiliation.CONTACT_CLIENT,
          CONTACT2_CLIENT: resiliation.CONTACT2_CLIENT,
          CLIENT: resiliation.CLIENT,
          STT: resiliation.STT,
          Delegation: resiliation.Delegation,
          Gouvernorat: resiliation.Gouvernorat,
          STATUT: resiliation.STATUT,
          DATE_PRISE_RDV: resiliation.DATE_PRISE_RDV,
          REP_RDV: resiliation.REP_RDV,
          DES_PACK: resiliation.DES_PACK,
          DATE_AFFECTATION_STT: resiliation.DATE_AFFECTATION_STT,
          REP_TRAVAUX_STT: resiliation.REP_TRAVAUX_STT,
          OPENING_DATE_SUR_TIMOS: resiliation.OPENING_DATE_SUR_TIMOS,
          DATE_FIN_TRV: resiliation.DATE_FIN_TRV,
          DATE_debut_TRV: resiliation.DATE_debut_TRV,
          NOTE_CLOTURE_ZM: resiliation.NOTE_CLOTURE_ZM,
          DATE_CLOTURE_ZM: resiliation.DATE_CLOTURE_ZM,
          entite: resiliation.entite,
          Description: resiliation.Description,
          Detail: resiliation.Detail,
        };

        if (!acc[companyName]) {
          acc[companyName] = {
            count: 0,
            data: [],
          };
        }

        acc[companyName].count++;
        acc[companyName].data.push(resiliationDto);

        return acc;
      },
      {} as {
        [companyName: string]: { count: number; data: ResiliationFrozenDto[] };
      },
    );

    return groupedResult;
  }

  async getFrozenresiliations(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{ count: number; data: ResiliationFrozenDto[] }> {
    const where: any = { STATUT: 'Gelé' };
    if (gouvernorat) where.Gouvernorat = gouvernorat;

    const [results, total] = await this.ResiliationRepository.findAndCount({
      where,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ResiliationFrozenDto[] = results.map((resiliation) => ({
      crm_case: resiliation.crm_case,
      DATE_CREATION_CRM: resiliation.DATE_CREATION_CRM,
      LATITUDE_SITE: resiliation.LATITUDE_SITE,
      LONGITUDE_SITE: resiliation.LONGITUDE_SITE,
      MSISDN: resiliation.MSISDN,
      CONTACT_CLIENT: resiliation.CONTACT_CLIENT,
      CONTACT2_CLIENT: resiliation.CONTACT2_CLIENT,
      CLIENT: resiliation.CLIENT,
      STT: resiliation.STT,
      Delegation: resiliation.Delegation,
      Gouvernorat: resiliation.Gouvernorat,
      STATUT: resiliation.STATUT,
      DATE_PRISE_RDV: resiliation.DATE_PRISE_RDV,
      REP_RDV: resiliation.REP_RDV,
      DES_PACK: resiliation.DES_PACK,
      DATE_AFFECTATION_STT: resiliation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: resiliation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: resiliation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: resiliation.DATE_FIN_TRV,
      DATE_debut_TRV: resiliation.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: resiliation.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: resiliation.DATE_CLOTURE_ZM,
      entite: resiliation.entite,
      Description: resiliation.Description,
      Detail: resiliation.Detail,
    }));

    return { count: total, data };
  }
  async getNon_affectedresiliations(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ResiliationFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_TRAVAUX_STT: 'non_affecté_stt',
      STATUT: 'En cours',
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.ResiliationRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ResiliationFrozenDto[] = results.map((resiliation) => ({
      crm_case: resiliation.crm_case,
      DATE_CREATION_CRM: resiliation.DATE_CREATION_CRM,
      LATITUDE_SITE: resiliation.LATITUDE_SITE,
      LONGITUDE_SITE: resiliation.LONGITUDE_SITE,
      MSISDN: resiliation.MSISDN,
      CONTACT_CLIENT: resiliation.CONTACT_CLIENT,
      CONTACT2_CLIENT: resiliation.CONTACT2_CLIENT,
      CLIENT: resiliation.CLIENT,
      STT: resiliation.STT,
      Delegation: resiliation.Delegation,
      Gouvernorat: resiliation.Gouvernorat,
      STATUT: resiliation.STATUT,
      DATE_PRISE_RDV: resiliation.DATE_PRISE_RDV,
      REP_RDV: resiliation.REP_RDV,
      DES_PACK: resiliation.DES_PACK,
      DATE_AFFECTATION_STT: resiliation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: resiliation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: resiliation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: resiliation.DATE_FIN_TRV,
      DATE_debut_TRV: resiliation.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: resiliation.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: resiliation.DATE_CLOTURE_ZM,
      entite: resiliation.entite,
      Description: resiliation.Description,
      Detail: resiliation.Detail,
    }));

    return { count: total, data };
  }

  async getEnRDVresiliations(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ResiliationFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_RDV: IsNull(),
      STATUT: 'En cours',
      REP_TRAVAUX_STT: Not('non_affecté_stt'),
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.ResiliationRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ResiliationFrozenDto[] = results.map((resiliation) => ({
      crm_case: resiliation.crm_case,
      DATE_CREATION_CRM: resiliation.DATE_CREATION_CRM,
      LATITUDE_SITE: resiliation.LATITUDE_SITE,
      LONGITUDE_SITE: resiliation.LONGITUDE_SITE,
      MSISDN: resiliation.MSISDN,
      CONTACT_CLIENT: resiliation.CONTACT_CLIENT,
      CONTACT2_CLIENT: resiliation.CONTACT2_CLIENT,
      CLIENT: resiliation.CLIENT,
      STT: resiliation.STT,
      Delegation: resiliation.Delegation,
      Gouvernorat: resiliation.Gouvernorat,
      STATUT: resiliation.STATUT,
      DATE_PRISE_RDV: resiliation.DATE_PRISE_RDV,
      REP_RDV: resiliation.REP_RDV,
      DES_PACK: resiliation.DES_PACK,
      DATE_AFFECTATION_STT: resiliation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: resiliation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: resiliation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: resiliation.DATE_FIN_TRV,
      DATE_debut_TRV: resiliation.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: resiliation.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: resiliation.DATE_CLOTURE_ZM,
      entite: resiliation.entite,
      Description: resiliation.Description,
      Detail: resiliation.Detail,
    }));

    return { count: total, data };
  }

  async getEnWork(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ResiliationFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_RDV: Not(IsNull()),
      STATUT: 'En cours',
      DATE_PRISE_RDV: Not(IsNull()),
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.ResiliationRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ResiliationFrozenDto[] = results.map((resiliation) => ({
      crm_case: resiliation.crm_case,
      DATE_CREATION_CRM: resiliation.DATE_CREATION_CRM,
      LATITUDE_SITE: resiliation.LATITUDE_SITE,
      LONGITUDE_SITE: resiliation.LONGITUDE_SITE,
      MSISDN: resiliation.MSISDN,
      CONTACT_CLIENT: resiliation.CONTACT_CLIENT,
      CONTACT2_CLIENT: resiliation.CONTACT2_CLIENT,
      CLIENT: resiliation.CLIENT,
      STT: resiliation.STT,
      Delegation: resiliation.Delegation,
      Gouvernorat: resiliation.Gouvernorat,
      STATUT: resiliation.STATUT,
      DATE_PRISE_RDV: resiliation.DATE_PRISE_RDV,
      REP_RDV: resiliation.REP_RDV,
      DES_PACK: resiliation.DES_PACK,
      DATE_AFFECTATION_STT: resiliation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: resiliation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: resiliation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: resiliation.DATE_FIN_TRV,
      DATE_debut_TRV: resiliation.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: resiliation.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: resiliation.DATE_CLOTURE_ZM,
      entite: resiliation.entite,
      Description: resiliation.Description,
      Detail: resiliation.Detail,
    }));

    return { count: total, data };
  }
}
