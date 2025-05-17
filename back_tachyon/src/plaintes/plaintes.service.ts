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
    console.log('totale', data.length);
    return { data, nextCursor };
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
