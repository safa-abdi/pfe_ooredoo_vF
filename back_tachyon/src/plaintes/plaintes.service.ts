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
import { Plainte } from './entities/plaintes.entity';
import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Company } from 'src/companies/entities/company.entity';
import { Delegation } from 'src/branches_companies/entities/Delegation.entity';
import { BatchAssignSttDto } from './dto/batch-assign-stt.dto';
import { BatchClotureDto } from './dto/BatchClotureDto.dto';
import { UpdatePlainteDto } from './dto/update-plainte.dto';
import { CacheService } from 'src/cache/cache.service';
import { PlainteFrozenDto } from './dto/plaintefrozen.dto';
import { PaginationDto } from '../activation/dto/pagination.dto';
export type PlainteWithoutPdf = Omit<
  Plainte,
  | 'pdfFile'
  | 'pdfMimeType'
  | 'calculateSLAs'
  | 'normalizeDates'
  | 'parseDate'
  | 'calcHoursDiff'
>;

@Injectable()
export class PlainteService {
  private readonly logger = new Logger(PlainteService.name);

  constructor(
    @InjectRepository(Plainte)
    private readonly PlainteRepository: Repository<Plainte>,
    @InjectRepository(CompanyDelegation)
    private readonly companyDelegationRepository: Repository<CompanyDelegation>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Delegation)
    private readonly delegationRepository: Repository<Delegation>,
    private cacheService: CacheService,
  ) {}

  async getPaginatedStats(page: number = 1, limit: number = 50) {
    const queryBuilder = this.PlainteRepository.createQueryBuilder('p')
      .select([
        'p.NAME_STT as "stt"',
        'COUNT(p.crm_case) as "total"',
        `SUM(CASE WHEN p.STATUT = 'Terminé' THEN 1 ELSE 0 END) as "termine"`,
        `SUM(CASE WHEN p.STATUT = 'En cours' THEN 1 ELSE 0 END) as "enCours"`,
        `SUM(CASE WHEN p.STATUT = 'Abandonné' THEN 1 ELSE 0 END) as "abandonne"`,
      ])
      .where('p.NAME_STT IS NOT NULL AND p.NAME_STT != :empty', { empty: '' })
      .groupBy('p.NAME_STT')
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
  async findPlaintesByCompany(
    companyId: number,
    searchTerm?: string,
    page: number = 1,
    limit: number = 50,
    REP_TRAVAUX_STT?: string,
    gouvernorat?: string,
    delegation?: string,
    DATE_AFFECTATION_STT?: string,
    DES_PACK?: string,
    offre?: string,
    REP_RDV?: string,
    DATE_PRISE_RDV?: string,
    CMT_RDV?: string,
    Description?: number,
    STATUT?: string,
  ): Promise<{ data: PlainteWithoutPdf[]; total: number }> {
    const queryBuilder = this.PlainteRepository.createQueryBuilder('p').where(
      'p.company_id = :companyId',
      { companyId },
    );

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
            .orWhere(likeCondition('Gouvernorat'))
            .orWhere(likeCondition('Delegation'))
            .orWhere(likeCondition('crm_case'))
            .orWhere(likeCondition('NAME_STT'))
            .orWhere(likeCondition('offre'));
        }),
      );
    }

    // Filtres dynamiques
    const filters = {
      REP_TRAVAUX_STT,
      Gouvernorat: gouvernorat,
      Delegation: delegation,
      DATE_AFFECTATION_STT,
      DES_PACK,
      offre,
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
  async findRecurringComplaintsSingleQuery(): Promise<Plainte[]> {
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

    const subQuery = this.PlainteRepository.createQueryBuilder('p')
      .select('p.MSISDN')
      .where('p.DATE_CREATION_CRM >= :fiveMonthsAgo', { fiveMonthsAgo })
      .groupBy('p.MSISDN')
      .having('COUNT(p.crm_case) > 3');

    return this.PlainteRepository.createQueryBuilder('plainte')
      .where(`plainte.MSISDN IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .andWhere('plainte.DATE_CREATION_CRM >= :fiveMonthsAgo', {
        fiveMonthsAgo,
      })
      .orderBy('plainte.MSISDN', 'ASC')
      .addOrderBy('plainte.DATE_CREATION_CRM', 'DESC')
      .getMany();
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
      groupBy === 'NAME_STT'
        ? "a.NAME_STT IS NOT NULL AND a.NAME_STT != ''"
        : '1=1',
    ]
      .filter(Boolean)
      .join(' AND ');

    const groupedResults = await this.PlainteRepository.createQueryBuilder('a')
      .select([
        `${groupBy} AS group_by`,
        `AVG(a.SLA_STT) AS avg_sla_stt`,
        `AVG(a.TEMPS_MOYEN_PRISE_RDV) AS avg_temps_rdv`,
      ])
      .where(whereConditions)
      .groupBy(groupBy)
      .getRawMany();

    const globalResults = await this.PlainteRepository.createQueryBuilder('a')
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

  async getCountOfPlaintesBySttId_technicien(
    sttId: number,
    technicianId: number,
    Gouv: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.PlainteRepository.createQueryBuilder('plainte')
      .select('plainte.STATUT', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('plainte.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .where('plainte.company_id = :sttId', { sttId })
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(plainte.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('plainte.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('plainte.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('plainte.STATUT');

    return query.getRawMany();
  }
  async getAverageSLABySTT(period: string) {
    return this.getAverageSLA('NAME_STT', period);
  }
  async findAllInProgressCursorPaginated(
    lastId: string | null = null,
    limit: number = 100,
  ): Promise<{ data: Plainte[]; nextCursor: string | null }> {
    const query = this.PlainteRepository.createQueryBuilder('p')
      .where('p.LATITUDE_SITE != 0')
      .andWhere('p.LONGITUDE_SITE != 0')
      .andWhere('p.STATUT = "En cours"')
      .andWhere('p.LONGITUDE_SITE BETWEEN :minLng AND :maxLng', {
        minLng: 6,
        maxLng: 11,
      })
      .andWhere('p.LATITUDE_SITE BETWEEN :minLat AND :maxLat', {
        minLat: 30,
        maxLat: 38,
      })
      .orderBy('p.crm_case', 'ASC')
      .take(limit);

    if (lastId) {
      query.andWhere('p.crm_case > :lastId', { lastId });
    }

    const data = await query.getMany();
    const nextCursor = data.length ? data[data.length - 1].crm_case : null;
    console.log('totale s', data.length);
    return { data, nextCursor };
  }
  async assignTechnicianToActivations(
    plainteIds: number[],
    technicianId: number,
    companyId: number,
  ): Promise<Plainte[]> {
    const plaintesToUpdate = await this.PlainteRepository.findByIds(plainteIds);

    if (plaintesToUpdate.length === 0) {
      console.warn('No complaint found for the provided IDs.');
      return [];
    }

    const companyDelegation = await this.companyDelegationRepository
      .createQueryBuilder('cd')
      .where('cd.companyId = :companyId', { companyId })
      .andWhere('cd.technicienId = :technicianId', { technicianId })
      .getOne();

    if (!companyDelegation) {
      console.warn(
        `Technician with ID ${technicianId} is not associated with company ${companyId}.`,
      );
      return [];
    }

    for (const plainte of plaintesToUpdate) {
      plainte.companyDelegation = companyDelegation;
    }
    return await this.PlainteRepository.save(plaintesToUpdate);
  }
  async findAllCursorPaginated(
    lastId: string | null = null,
    limit: number = 100,
  ): Promise<{ data: Plainte[]; nextCursor: string | null }> {
    const query = this.PlainteRepository.createQueryBuilder('p')
      .where('p.LATITUDE_SITE != 0')
      .andWhere('p.LONGITUDE_SITE != 0')
      .andWhere('p.LONGITUDE_SITE BETWEEN :minLng AND :maxLng', {
        minLng: 6,
        maxLng: 11,
      })
      .andWhere('p.LATITUDE_SITE BETWEEN :minLat AND :maxLat', {
        minLat: 30,
        maxLat: 38,
      })
      .orderBy('p.crm_case', 'ASC')
      .take(limit);

    if (lastId) {
      query.andWhere('p.crm_case > :lastId', { lastId });
    }

    const data = await query.getMany();
    const nextCursor = data.length ? data[data.length - 1].crm_case : null;

    return { data, nextCursor };
  }
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
    const queryBuilder = this.PlainteRepository.createQueryBuilder('plainte')
      .leftJoin('plainte.company', 'company')
      .select('plainte.STATUT', 'STATUT')
      .addSelect('COUNT(*)', 'count')
      .groupBy('plainte.STATUT');

    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('plainte.client LIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('plainte.msisdn LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.contact_client LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.Gouvernorat LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.Delegation LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.crm_case LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.NAME_STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('plainte.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    if (REP_TRAVAUX_STT) {
      queryBuilder.andWhere('plainte.REP_TRAVAUX_STT = :REP_TRAVAUX_STT', {
        REP_TRAVAUX_STT,
      });
    }

    if (gouvernorat) {
      queryBuilder.andWhere('plainte.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `%${gouvernorat}%`,
      });
    }

    if (delegation) {
      queryBuilder.andWhere('plainte.Delegation LIKE :delegation', {
        delegation: `%${delegation}%`,
      });
    }

    if (DATE_AFFECTATION_STT) {
      queryBuilder.andWhere(
        'plainte.DATE_AFFECTATION_STT = :DATE_AFFECTATION_STT',
        { DATE_AFFECTATION_STT },
      );
    }

    if (DES_PACK) {
      queryBuilder.andWhere('plainte.DES_PACK LIKE :DES_PACK', {
        DES_PACK: `%${DES_PACK}%`,
      });
    }

    if (offre) {
      queryBuilder.andWhere('plainte.offre LIKE :offre', {
        offre: `%${offre}%`,
      });
    }

    if (REP_RDV) {
      queryBuilder.andWhere('plainte.REP_RDV = :REP_RDV', { REP_RDV });
    }

    if (DATE_PRISE_RDV) {
      queryBuilder.andWhere('plainte.DATE_PRISE_RDV = :DATE_PRISE_RDV', {
        DATE_PRISE_RDV,
      });
    }

    if (CMT_RDV) {
      queryBuilder.andWhere('plainte.CMT_RDV LIKE :CMT_RDV', {
        CMT_RDV: `%${CMT_RDV}%`,
      });
    }

    if (METRAGE_CABLE) {
      queryBuilder.andWhere('plainte.METRAGE_CABLE = :METRAGE_CABLE', {
        METRAGE_CABLE,
      });
    }

    const result = await queryBuilder.getRawMany();
    return result.map((r) => ({
      STATUT: r.STATUT,
      count: parseInt(r.count, 10),
    }));
  }

  async assignSTTToplainte(
    plainteId: string,
    sttName: string,
    companyDelegationId?: number,
    companyId?: number,
  ): Promise<Plainte> {
    const plainte = await this.PlainteRepository.findOne({
      where: { crm_case: plainteId },
    });

    if (!plainte) {
      throw new Error('plainte non trouvée');
    }

    plainte.NAME_STT = sttName;
    plainte.DATE_AFFECTATION_STT = new Date();
    plainte.REP_TRAVAUX_STT = 'en cours';
    plainte.STATUT = 'en cours';
    plainte.company = null;
    plainte.companyDelegation = null;

    if (companyDelegationId) {
      const companyDelegation = await this.companyDelegationRepository.findOne({
        where: { id: companyDelegationId },
      });
      if (!companyDelegation) {
        throw new Error('Branche non trouvée');
      }
      plainte.companyDelegation = companyDelegation;

      if (!companyId && companyDelegation.company) {
        plainte.company = companyDelegation.company;
      }
    }

    if (companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new Error('Company non trouvée');
      }
      plainte.company = company;
    }

    return await this.PlainteRepository.save(plainte);
  }

  // async findAllPblemCursorPaginated(
  //   lastId: string | null = null,
  //   limit: number = 100,
  // ): Promise<{ data: Plainte[]; nextCursor: string | null; total: number }> {
  //   const baseQuery = this.PlainteRepository.createQueryBuilder('p')
  //     .where("p.STATUT IN ('En cours', 'Gelé')")
  //     .andWhere(
  //       new Brackets((qb) => {
  //         qb.where('p.LONGITUDE_SITE = 0')
  //           .orWhere('p.LONGITUDE_SITE > 11')
  //           .orWhere('p.LONGITUDE_SITE < 6')
  //           .orWhere('p.LATITUDE_SITE = 0')
  //           .orWhere('p.LATITUDE_SITE > 38')
  //           .orWhere('p.LATITUDE_SITE < 30')
  //           .orWhere('p.Gouvernorat IS NULL')
  //           .orWhere("p.Gouvernorat = ''")
  //           .orWhere('p.Delegation IS NULL')
  //           .orWhere("p.Delegation = ''");
  //       }),
  //     );

  //   const paginatedQuery = baseQuery
  //     .clone()
  //     .orderBy('p.crm_case', 'ASC')
  //     .take(limit);

  //   if (lastId) {
  //     paginatedQuery.andWhere('p.crm_case > :lastId', { lastId });
  //   }

  //   const data = await paginatedQuery.getMany();
  //   const nextCursor = data.length ? data[data.length - 1].crm_case : null;

  //   const total = await baseQuery.getCount();

  //   return { data, nextCursor, total };
  // }
  async findAllPblemCursorPaginated(
    lastId: string | null = null,
    limit: number = 100,
    search?: string,
  ): Promise<{
    data: Plainte[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const query = this.PlainteRepository.createQueryBuilder('p')
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
            .orWhere("p.Gouvernorat = ''")
            .orWhere('p.Delegation IS NULL')
            .orWhere("p.Delegation = ''");
        }),
      );

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('p.crm_case LIKE :search', { search: `%${search}%` })
            .orWhere('p.Gouvernorat LIKE :search', { search: `%${search}%` })
            .orWhere('p.Delegation LIKE :search', { search: `%${search}%` })
            .orWhere('p.Detail LIKE :search', { search: `%${search}%` })
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

  async findAllValidComplaintsCursorPaginated(
    searchTerm?: string,
    page: number = 1,
    limit: number = 50,
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
    total: number;
    data: any[];
  }> {
    const baseQuery = this.PlainteRepository.createQueryBuilder('p').where(
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
              .andWhere("p.Gouvernorat != ''")
              .andWhere('p.Delegation IS NOT NULL')
              .andWhere("p.Delegation != ''");
          }),
        );
      }),
    );

    const queryBuilder = baseQuery
      .orderBy('p.crm_case', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

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
            .orWhere('p.NAME_STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('p.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    // Filtres supplémentaires
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

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
    };
  }

  private async findMatchingCompany(name: string): Promise<Company | null> {
    if (!name?.trim()) return null;

    return await this.companyRepository.findOne({
      where: [{ name: ILike(`%${name.trim()}%`) }],
    });
  }
  async linkPlaintes(): Promise<{
    linked: number;
  }> {
    const plaintes = await this.PlainteRepository.find({
      where: { companyDelegation: { id: IsNull() } },
      relations: ['company'],
    });

    let linked = 0;

    for (const plainte of plaintes) {
      if (!plainte.company && plainte.NAME_STT) {
        plainte.company = await this.findMatchingCompany(plainte.NAME_STT);
        if (plainte.company) {
          await this.PlainteRepository.save(plainte);
          linked++;
        }
      }
    }
    return { linked };
  }
  async linkPlainte_BySpecificCrm_case(crmCase: string): Promise<{
    success: boolean;
    message: string;
    linkedCompany?: boolean;
  }> {
    if (!crmCase?.trim()) {
      this.logger.warn('Tentative de lien sans CRM Case');
      return {
        success: false,
        message: 'Le CRM Case est requis',
      };
    }

    try {
      const plainte = await this.PlainteRepository.findOne({
        where: { crm_case: crmCase },
        relations: ['company', 'companyDelegation'],
      });

      if (!plainte) {
        this.logger.warn(`Plainte non trouvée pour CRM Case: ${crmCase}`);
        return {
          success: false,
          message: `Plainte avec CRM Case ${crmCase} non trouvée`,
        };
      }

      let linkedCompany = false;

      if (!plainte.company && plainte.NAME_STT) {
        this.logger.debug(`Recherche company pour: ${plainte.NAME_STT}`);
        plainte.company = await this.findMatchingCompany(plainte.NAME_STT);

        if (!plainte.company) {
          this.logger.warn(`Company introuvable pour: ${plainte.NAME_STT}`);
          return {
            success: false,
            message: `Company correspondant à ${plainte.NAME_STT} non trouvée`,
          };
        }

        linkedCompany = true;
        await this.PlainteRepository.save(plainte);
        this.logger.log(`Company liée pour CRM Case: ${crmCase}`);
      }

      return {
        success: true,
        message: `Plainte ${crmCase} traitée avec succès`,
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

    const query = this.PlainteRepository.createQueryBuilder('plainte')
      .select('plainte')
      .leftJoin('plainte.company', 'company')
      .where('company.id = :companyId', { companyId });

    if (filters.startDate) {
      query.andWhere('plainte.OPENING_DATE_SUR_TIMOS >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters.endDate) {
      query.andWhere('plainte.OPENING_DATE_SUR_TIMOS <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.cursorDate) {
      query.andWhere(
        `plainte.OPENING_DATE_SUR_TIMOS ${cursorOperator} :cursorDate`,
        { cursorDate: filters.cursorDate },
      );
    }

    if (filters.status) {
      query.andWhere('plainte.STATUT LIKE :status', {
        status: `${filters.status}%`,
      });
    }

    if (filters.msisdn) {
      query.andWhere('plainte.MSISDN = :msisdn', {
        msisdn: filters.msisdn,
      });
    }

    if (filters.client) {
      query.andWhere('plainte.CLIENT LIKE :client', {
        client: `${filters.client}%`,
      });
    }

    if (filters.gouvernorat) {
      query.andWhere('plainte.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `${filters.gouvernorat}%`,
      });
    }

    query.orderBy('plainte.OPENING_DATE_SUR_TIMOS', orderDirection);
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
  async getCountOfInProgressPlaintesBySttId_Gouv(
    sttId: number,
    Gouv: string,
  ): Promise<number> {
    return await this.PlainteRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
      } as FindOptionsWhere<Plainte>,
    });
  }
  async getCountOfInProgressPlaintesBySttId_Gouv_Del(
    sttId: number,
    Gouv: string,
    Deleg: string,
  ): Promise<number> {
    return await this.PlainteRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
        Delegation: ILike(`%${Deleg}%`),
      } as FindOptionsWhere<Plainte>,
    });
  }

  async getCountOfPlaintesBy_technicien(
    technicianId: number,
    Gouv?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.PlainteRepository.createQueryBuilder('plainte')
      .select('plainte.REP_RDV', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('plainte.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(plainte.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('plainte.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('plainte.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('plainte.REP_RDV');

    return query.getRawMany();
  }

  async batchAssignStt(batchAssignSttDto: BatchAssignSttDto) {
    const { plainteIds, sttName, companyId } = batchAssignSttDto;
    const currentDate = new Date();

    await this.PlainteRepository.createQueryBuilder()
      .update(Plainte)
      .set({
        NAME_STT: sttName,
        REP_TRAVAUX_STT: 'en_cours',
        company: { id: companyId },
        companyDelegation: null,
        STATUT: 'En cours',
        DATE_AFFECTATION_STT: currentDate,
      })
      .where('crm_case IN (:...ids)', { ids: plainteIds })
      .execute();

    return this.PlainteRepository.find({
      where: { crm_case: In(plainteIds) },
      relations: ['company'],
    });
  }
  async batchClotureTask(batchClotureDto: BatchClotureDto) {
    let { plainteIds, note } = batchClotureDto;
    const currentDate = new Date();

    if (plainteIds == null) {
      throw new Error('plainteIds must be provided');
    }

    if (!Array.isArray(plainteIds)) {
      plainteIds = [plainteIds];
    }

    if (plainteIds.length === 0) {
      throw new Error('At least one plainte ID must be provided');
    }

    if (!note || typeof note !== 'string') {
      throw new Error('Closure note is required and must be a string');
    }

    try {
      await this.PlainteRepository.createQueryBuilder()
        .update(Plainte)
        .set({
          STATUT: 'Abandonné',
          DATE_CLOTURE_ZM: currentDate,
          NOTE_CLOTURE_ZM: note,
          REP_TRAVAUX_STT: 'Abandonné',
        })
        .where('crm_case IN (:...ids)', { ids: plainteIds })
        .execute();

      return await this.PlainteRepository.find({
        where: { crm_case: In(plainteIds) },
      });
    } catch (error) {
      console.error('Error in batchClotureTask:', error);
      throw new Error('Failed to batch close plaintes');
    }
  }
  async updatePlainte(dto: UpdatePlainteDto): Promise<Plainte> {
    const plainte = await this.PlainteRepository.findOneBy({
      crm_case: dto.crm_case,
    });

    if (!plainte) {
      throw new Error(`Plainte with crm_case ${dto.crm_case} not found`);
    }

    if (dto.Gouvernorat !== undefined) plainte.Gouvernorat = dto.Gouvernorat;
    if (dto.Delegation !== undefined) plainte.Delegation = dto.Delegation;
    if (dto.LATITUDE_SITE !== undefined)
      plainte.LATITUDE_SITE = dto.LATITUDE_SITE;
    if (dto.LONGITUDE_SITE !== undefined)
      plainte.LONGITUDE_SITE = dto.LONGITUDE_SITE;
    if (dto.CLIENT !== undefined) plainte.CLIENT = dto.CLIENT;
    if (dto.Detail !== undefined) plainte.Detail = dto.Detail;
    if (dto.CONTACT2_CLIENT !== undefined)
      plainte.CONTACT2_CLIENT = dto.CONTACT2_CLIENT;
    if (dto.CONTACT_CLIENT !== undefined)
      plainte.CONTACT_CLIENT = dto.CONTACT_CLIENT;
    if (dto.Description !== undefined) plainte.Description = dto.Description;
    return await this.PlainteRepository.save(plainte);
  }
  async findPlaintesByTechnician(
    technicienId: number,
    pagination: PaginationDto,
  ) {
    const cacheKey = `Plaintes_technicien_${technicienId}_${pagination.page}_${pagination.take}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const query = this.PlainteRepository.createQueryBuilder('plainte')
      .innerJoin('plainte.companyDelegation', 'companyDelegation')
      .innerJoin(
        'companyDelegation.technicien',
        'technicien',
        'technicien.id = :technicienId',
        { technicienId },
      )
      .leftJoinAndSelect('plainte.company', 'company')
      .select([
        'plainte.crm_case',
        'plainte.DATE_CREATION_CRM',
        'plainte.LATITUDE_SITE',
        'plainte.LONGITUDE_SITE',
        'plainte.MSISDN',
        'plainte.CONTACT_CLIENT',
        'plainte.CLIENT',
        'plainte.REP_TRAVAUX_STT',
        'plainte.NAME_STT',
        'plainte.Delegation',
        'plainte.Gouvernorat',
        'plainte.DATE_AFFECTATION_STT',
        'plainte.DES_PACK',
        'plainte.offre',
        'plainte.REP_RDV',
        'plainte.DATE_PRISE_RDV',
        'plainte.Detail',
        'plainte.Description',
        'plainte.CMT_RDV',
        'plainte.STATUT',
        'plainte.DATE_FIN_TRV',
        'plainte.DATE_debut_TRV',
        'plainte.last_sync',
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
    plainteId: string,
    DATE_PRISE_RDV: Date,
  ): Promise<Plainte> {
    const plainte = await this.PlainteRepository.findOne({
      where: { crm_case: plainteId },
    });

    if (!plainte) {
      throw new Error('plainte non trouvée');
    }

    plainte.DATE_PRISE_RDV = DATE_PRISE_RDV;
    plainte.REP_TRAVAUX_STT = 'en_cours';
    plainte.STATUT = 'En cours';
    plainte.REP_RDV = 'Confirmé';
    return await this.PlainteRepository.save(plainte);
  }

  async detectRDVPblem_technicien(
    plainteId: string,
    raison: string,
    cmntr: string,
  ): Promise<Plainte> {
    const plainte = await this.PlainteRepository.findOne({
      where: { crm_case: plainteId },
    });

    if (!plainte) {
      throw new Error('plainte non trouvée');
    }
    if (raison.toLocaleLowerCase() == 'installé par le client') {
      plainte.REP_TRAVAUX_STT = 'Effectué par le client';
      plainte.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'abondonné') {
      plainte.REP_TRAVAUX_STT = 'Effectué';
      plainte.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'client ingoinable') {
      plainte.REP_TRAVAUX_STT = 'Client injoignable';
      plainte.STATUT = 'Gelé';
    }

    plainte.REP_RDV = raison;
    plainte.CMT_RDV = cmntr;
    return await this.PlainteRepository.save(plainte);
  }
  async MarquerDebut_travaux(plainteId: string): Promise<Plainte> {
    const plainte = await this.PlainteRepository.findOne({
      where: { crm_case: plainteId },
    });
    const currentDate = new Date();
    if (!plainte) {
      throw new Error('plainte non trouvée');
    }

    plainte.DATE_debut_TRV = currentDate;
    return await this.PlainteRepository.save(plainte);
  }
  async getInProgressPlaintesGroupedByCompany(
    page = 1,
    limit = 100,
  ): Promise<{
    [companyName: string]: { count: number; data: PlainteFrozenDto[] };
  }> {
    const plaintes = await this.PlainteRepository.find({
      where: {
        STATUT: 'En cours',
        REP_TRAVAUX_STT: Not('non_affecté_stt'),
      },
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const groupedResult = plaintes.reduce(
      (acc, plainte) => {
        const companyName = plainte.company?.name || 'Unknown';

        const activationDto: PlainteFrozenDto = {
          crm_case: plainte.crm_case,
          DATE_CREATION_CRM: plainte.DATE_CREATION_CRM,
          LATITUDE_SITE: plainte.LATITUDE_SITE,
          LONGITUDE_SITE: plainte.LONGITUDE_SITE,
          MSISDN: plainte.MSISDN,
          CONTACT_CLIENT: plainte.CONTACT_CLIENT,
          CLIENT: plainte.CLIENT,
          NAME_STT: plainte.NAME_STT,
          Delegation: plainte.Delegation,
          Gouvernorat: plainte.Gouvernorat,
          STATUT: plainte.STATUT,
          DATE_PRISE_RDV: plainte.DATE_PRISE_RDV,
          REP_RDV: plainte.REP_RDV,
          DES_PACK: plainte.DES_PACK,
          offre: plainte.offre,
          DATE_AFFECTATION_STT: plainte.DATE_AFFECTATION_STT,
          REP_TRAVAUX_STT: plainte.REP_TRAVAUX_STT,
          OPENING_DATE_SUR_TIMOS: plainte.OPENING_DATE_SUR_TIMOS,
          DATE_FIN_TRV: plainte.DATE_FIN_TRV,
          DATE_debut_TRV: plainte.DATE_debut_TRV,
          NOTE_CLOTURE_ZM: plainte.NOTE_CLOTURE_ZM,
          DATE_CLOTURE_ZM: plainte.DATE_CLOTURE_ZM,
          CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
          Detail: plainte.Detail,
          Description: plainte.Description,
        };

        if (!acc[companyName]) {
          acc[companyName] = {
            count: 0,
            data: [],
          };
        }

        acc[companyName].count++;
        acc[companyName].data.push(activationDto);

        return acc;
      },
      {} as {
        [companyName: string]: { count: number; data: PlainteFrozenDto[] };
      },
    );

    return groupedResult;
  }

  async getFrozenplaintes(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{ count: number; data: PlainteFrozenDto[] }> {
    const where: any = { STATUT: 'Gelé' };
    if (gouvernorat) where.Gouvernorat = gouvernorat;

    const [results, total] = await this.PlainteRepository.findAndCount({
      where,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: PlainteFrozenDto[] = results.map((plainte) => ({
      crm_case: plainte.crm_case,
      DATE_CREATION_CRM: plainte.DATE_CREATION_CRM,
      LATITUDE_SITE: plainte.LATITUDE_SITE,
      LONGITUDE_SITE: plainte.LONGITUDE_SITE,
      MSISDN: plainte.MSISDN,
      CONTACT_CLIENT: plainte.CONTACT_CLIENT,
      CLIENT: plainte.CLIENT,
      NAME_STT: plainte.NAME_STT,
      Delegation: plainte.Delegation,
      Gouvernorat: plainte.Gouvernorat,
      STATUT: plainte.STATUT,
      DATE_PRISE_RDV: plainte.DATE_PRISE_RDV,
      REP_RDV: plainte.REP_RDV,
      DES_PACK: plainte.DES_PACK,
      offre: plainte.offre,
      DATE_AFFECTATION_STT: plainte.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: plainte.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: plainte.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: plainte.DATE_FIN_TRV,
      DATE_debut_TRV: plainte.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: plainte.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: plainte.DATE_CLOTURE_ZM,
      CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
      Detail: plainte.Detail,
      Description: plainte.Description,
    }));

    return { count: total, data };
  }
  async getNon_affectedplaintes(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_TRAVAUX_STT: 'non_affecté_stt',
      STATUT: 'En cours',
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.PlainteRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: PlainteFrozenDto[] = results.map((plainte) => ({
      crm_case: plainte.crm_case,
      DATE_CREATION_CRM: plainte.DATE_CREATION_CRM,
      LATITUDE_SITE: plainte.LATITUDE_SITE,
      LONGITUDE_SITE: plainte.LONGITUDE_SITE,
      MSISDN: plainte.MSISDN,
      CONTACT_CLIENT: plainte.CONTACT_CLIENT,
      CLIENT: plainte.CLIENT,
      NAME_STT: plainte.NAME_STT,
      Delegation: plainte.Delegation,
      Gouvernorat: plainte.Gouvernorat,
      STATUT: plainte.STATUT,
      DATE_PRISE_RDV: plainte.DATE_PRISE_RDV,
      REP_RDV: plainte.REP_RDV,
      DES_PACK: plainte.DES_PACK,
      offre: plainte.offre,
      DATE_AFFECTATION_STT: plainte.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: plainte.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: plainte.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: plainte.DATE_FIN_TRV,
      DATE_debut_TRV: plainte.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: plainte.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: plainte.DATE_CLOTURE_ZM,
      CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
      Detail: plainte.Detail,
      Description: plainte.Description,
    }));

    return { count: total, data };
  }

  async getEnRDVplaintes(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_RDV: IsNull(),
      STATUT: 'En cours',
      REP_TRAVAUX_STT: Not('non_affecté_stt'),
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.PlainteRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: PlainteFrozenDto[] = results.map((plainte) => ({
      crm_case: plainte.crm_case,
      DATE_CREATION_CRM: plainte.DATE_CREATION_CRM,
      LATITUDE_SITE: plainte.LATITUDE_SITE,
      LONGITUDE_SITE: plainte.LONGITUDE_SITE,
      MSISDN: plainte.MSISDN,
      CONTACT_CLIENT: plainte.CONTACT_CLIENT,
      CLIENT: plainte.CLIENT,
      NAME_STT: plainte.NAME_STT,
      Delegation: plainte.Delegation,
      Gouvernorat: plainte.Gouvernorat,
      STATUT: plainte.STATUT,
      DATE_PRISE_RDV: plainte.DATE_PRISE_RDV,
      REP_RDV: plainte.REP_RDV,
      DES_PACK: plainte.DES_PACK,
      offre: plainte.offre,
      DATE_AFFECTATION_STT: plainte.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: plainte.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: plainte.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: plainte.DATE_FIN_TRV,
      DATE_debut_TRV: plainte.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: plainte.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: plainte.DATE_CLOTURE_ZM,
      CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
      Detail: plainte.Detail,
      Description: plainte.Description,
    }));

    return { count: total, data };
  }

  async getEnWork(
    page = 1,
    limit = 10000,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: PlainteFrozenDto[];
  }> {
    const whereCondition: any = {
      REP_RDV: Not(IsNull()),
      STATUT: 'En cours',
      DATE_PRISE_RDV: Not(IsNull()),
    };

    if (gouvernorat) {
      whereCondition.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.PlainteRepository.findAndCount({
      where: whereCondition,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: PlainteFrozenDto[] = results.map((plainte) => ({
      crm_case: plainte.crm_case,
      DATE_CREATION_CRM: plainte.DATE_CREATION_CRM,
      LATITUDE_SITE: plainte.LATITUDE_SITE,
      LONGITUDE_SITE: plainte.LONGITUDE_SITE,
      MSISDN: plainte.MSISDN,
      CONTACT_CLIENT: plainte.CONTACT_CLIENT,
      CLIENT: plainte.CLIENT,
      NAME_STT: plainte.NAME_STT,
      Delegation: plainte.Delegation,
      Gouvernorat: plainte.Gouvernorat,
      STATUT: plainte.STATUT,
      DATE_PRISE_RDV: plainte.DATE_PRISE_RDV,
      REP_RDV: plainte.REP_RDV,
      DES_PACK: plainte.DES_PACK,
      offre: plainte.offre,
      DATE_AFFECTATION_STT: plainte.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: plainte.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: plainte.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: plainte.DATE_FIN_TRV,
      DATE_debut_TRV: plainte.DATE_debut_TRV,
      NOTE_CLOTURE_ZM: plainte.NOTE_CLOTURE_ZM,
      DATE_CLOTURE_ZM: plainte.DATE_CLOTURE_ZM,
      CONTACT2_CLIENT: plainte.CONTACT2_CLIENT,
      Detail: plainte.Detail,
      Description: plainte.Description,
    }));

    return { count: total, data };
  }
}
