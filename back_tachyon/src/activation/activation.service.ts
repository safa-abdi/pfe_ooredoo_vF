/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Brackets,
  IsNull,
  ILike,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
  FindOptionsWhere,
  Not,
  FindManyOptions,
} from 'typeorm';
import { Activation } from './entities/activation.entity';
import { Company } from '../companies/entities/company.entity';
import { Branch } from 'src/branches_companies/entities/Branch.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PaginationDto } from './dto/pagination.dto';
import { BatchAssignSttDto } from './dto/batch-assign-stt.dto';
import { CompanyDelegation } from 'src/branches_companies/entities/CompanyDelegation';
import { Delegation } from 'src/branches_companies/entities/Delegation.entity';
import { Prod_imei } from './entities/Prod_imei.entity';
import { CacheService } from 'src/cache/cache.service';
import { ActivationFrozenDto } from './dto/ListPartsActivation.dto';
import { HistoryService } from 'src/history/history.service';
import { BatchClotureDto } from './dto/BatchClotureDto.dto';

export type ActivationWithoutPdf = Omit<
  Activation,
  | 'pdfFile'
  | 'pdfMimeType'
  | 'calculateSLAs'
  | 'normalizeDates'
  | 'parseDate'
  | 'calcHoursDiff'
>;

@Injectable()
export class ActivationService {
  constructor(
    @InjectRepository(Activation)
    private readonly activationRepository: Repository<Activation>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(CompanyDelegation)
    private readonly companyDelegationRepository: Repository<CompanyDelegation>,
    @InjectRepository(Delegation)
    private readonly delegationRepository: Repository<Delegation>,
    @InjectRepository(Prod_imei)
    private readonly prodImeiRepository: Repository<Prod_imei>,
    private readonly historyService: HistoryService,
    private cacheService: CacheService,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAllInprogressWithCursor(
    searchTerm?: string,
    cursor?: number,
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
    METRAGE_CABLE?: number,
    STATUT: string = 'En cours',
  ): Promise<{ data: ActivationWithoutPdf[]; nextCursor: string | null }> {
    const queryBuilder = this.activationRepository
      .createQueryBuilder('activation')
      .leftJoinAndSelect('activation.company', 'company')
      .orderBy('activation.crm_case', 'ASC');

    // Filtre par curseur
    if (cursor) {
      queryBuilder.andWhere('activation.crm_case > :cursor', { cursor });
    }

    // Filtre par terme de recherche
    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('activation.client LIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('activation.msisdn LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.contact_client LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.Gouvernorat LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.Delegation LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.crm_case LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.NAME_STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    // Filtres supplémentaires
    if (REP_TRAVAUX_STT) {
      queryBuilder.andWhere('activation.REP_TRAVAUX_STT = :REP_TRAVAUX_STT', {
        REP_TRAVAUX_STT,
      });
    }

    if (gouvernorat) {
      queryBuilder.andWhere('activation.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `%${gouvernorat}%`,
      });
    }

    if (delegation) {
      queryBuilder.andWhere('activation.Delegation LIKE :delegation', {
        delegation: `%${delegation}%`,
      });
    }

    if (DATE_AFFECTATION_STT) {
      queryBuilder.andWhere(
        'activation.DATE_AFFECTATION_STT = :DATE_AFFECTATION_STT',
        { DATE_AFFECTATION_STT },
      );
    }

    if (DES_PACK) {
      queryBuilder.andWhere('activation.DES_PACK LIKE :DES_PACK', {
        DES_PACK: `%${DES_PACK}%`,
      });
    }

    if (offre) {
      queryBuilder.andWhere('activation.offre LIKE :offre', {
        offre: `%${offre}%`,
      });
    }

    if (REP_RDV) {
      queryBuilder.andWhere('activation.REP_RDV = :REP_RDV', { REP_RDV });
    }

    if (DATE_PRISE_RDV) {
      queryBuilder.andWhere('activation.DATE_PRISE_RDV = :DATE_PRISE_RDV', {
        DATE_PRISE_RDV,
      });
    }

    if (CMT_RDV) {
      queryBuilder.andWhere('activation.CMT_RDV LIKE :CMT_RDV', {
        CMT_RDV: `%${CMT_RDV}%`,
      });
    }

    if (METRAGE_CABLE) {
      queryBuilder.andWhere('activation.METRAGE_CABLE = :METRAGE_CABLE', {
        METRAGE_CABLE,
      });
    }

    queryBuilder.andWhere('activation.STATUT = :STATUT', { STATUT });

    const results = await queryBuilder.take(limit + 1).getMany();

    const sanitizedResults: ActivationWithoutPdf[] = results.map(
      ({ pdfFile, ...rest }) => rest,
    );

    const hasNext = results.length > limit;
    const data = hasNext ? sanitizedResults.slice(0, limit) : sanitizedResults;
    const nextCursor = hasNext ? data[data.length - 1].crm_case : null;

    return { data, nextCursor };
  }
  async findAllWithPagination(
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
    METRAGE_CABLE?: number,
    STATUT?: string,
  ): Promise<{
    data: ActivationWithoutPdf[];
    total: number;
  }> {
    const baseQuery = this.activationRepository.createQueryBuilder('p').where(
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

    // Initialisation du queryBuilder avec pagination
    const queryBuilder = baseQuery
      .orderBy('p.crm_case', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    // Filtre par terme de recherche
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

    if (METRAGE_CABLE) {
      queryBuilder.andWhere('p.METRAGE_CABLE = :METRAGE_CABLE', {
        METRAGE_CABLE,
      });
    }

    if (STATUT) {
      queryBuilder.andWhere('p.STATUT = :STATUT', { STATUT });
    }

    // Exécution de la requête
    const [data, total] = await queryBuilder.getManyAndCount();

    // Suppression des données PDF pour alléger la réponse
    const sanitizedResults: ActivationWithoutPdf[] = data.map(
      ({ pdfFile, ...rest }) => rest,
    );

    return {
      data: sanitizedResults,
      total,
    };
  }
  async findAllPblemCursorPaginated(
    lastId: string | null = null,
    limit: number = 100,
  ): Promise<{ data: Activation[]; nextCursor: string | null; total: number }> {
    const baseQuery = this.activationRepository
      .createQueryBuilder('p')
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

    const paginatedQuery = baseQuery
      .clone()
      .orderBy('p.crm_case', 'ASC')
      .take(limit);

    if (lastId) {
      paginatedQuery.andWhere('p.crm_case > :lastId', { lastId });
    }

    const data = await paginatedQuery.getMany();
    const nextCursor = data.length ? data[data.length - 1].crm_case : null;

    const total = await baseQuery.getCount();

    return { data, nextCursor, total };
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
    const queryBuilder = this.activationRepository
      .createQueryBuilder('activation')
      .leftJoin('activation.company', 'company')
      .select('activation.STATUT', 'STATUT')
      .addSelect('COUNT(*)', 'count')
      .groupBy('activation.STATUT');

    if (searchTerm) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('activation.client LIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
          })
            .orWhere('activation.msisdn LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.contact_client LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.Gouvernorat LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.Delegation LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.crm_case LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.NAME_STT LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            })
            .orWhere('activation.offre LIKE :searchTerm', {
              searchTerm: `%${searchTerm}%`,
            });
        }),
      );
    }

    if (REP_TRAVAUX_STT) {
      queryBuilder.andWhere('activation.REP_TRAVAUX_STT = :REP_TRAVAUX_STT', {
        REP_TRAVAUX_STT,
      });
    }

    if (gouvernorat) {
      queryBuilder.andWhere('activation.Gouvernorat LIKE :gouvernorat', {
        gouvernorat: `%${gouvernorat}%`,
      });
    }

    if (delegation) {
      queryBuilder.andWhere('activation.Delegation LIKE :delegation', {
        delegation: `%${delegation}%`,
      });
    }

    if (DATE_AFFECTATION_STT) {
      queryBuilder.andWhere(
        'activation.DATE_AFFECTATION_STT = :DATE_AFFECTATION_STT',
        { DATE_AFFECTATION_STT },
      );
    }

    if (DES_PACK) {
      queryBuilder.andWhere('activation.DES_PACK LIKE :DES_PACK', {
        DES_PACK: `%${DES_PACK}%`,
      });
    }

    if (offre) {
      queryBuilder.andWhere('activation.offre LIKE :offre', {
        offre: `%${offre}%`,
      });
    }

    if (REP_RDV) {
      queryBuilder.andWhere('activation.REP_RDV = :REP_RDV', { REP_RDV });
    }

    if (DATE_PRISE_RDV) {
      queryBuilder.andWhere('activation.DATE_PRISE_RDV = :DATE_PRISE_RDV', {
        DATE_PRISE_RDV,
      });
    }

    if (CMT_RDV) {
      queryBuilder.andWhere('activation.CMT_RDV LIKE :CMT_RDV', {
        CMT_RDV: `%${CMT_RDV}%`,
      });
    }

    if (METRAGE_CABLE) {
      queryBuilder.andWhere('activation.METRAGE_CABLE = :METRAGE_CABLE', {
        METRAGE_CABLE,
      });
    }

    const result = await queryBuilder.getRawMany();
    return result.map((r) => ({
      STATUT: r.STATUT,
      count: parseInt(r.count, 10),
    }));
  }

  private async findMatchingCompany(name: string): Promise<Company | null> {
    if (!name?.trim()) return null;

    return await this.companyRepository.findOne({
      where: [{ name: ILike(`%${name.trim()}%`) }],
    });
  }

  async linkActivations(): Promise<{
    linked: number;
  }> {
    const activations = await this.activationRepository.find({
      where: { companyDelegation: { id: IsNull() } },
      relations: ['company'],
    });

    let linked = 0;

    for (const activation of activations) {
      if (!activation.company && activation.NAME_STT) {
        activation.company = await this.findMatchingCompany(
          activation.NAME_STT,
        );
        if (activation.company) {
          await this.activationRepository.save(activation);
          linked++;
        }
      }
    }
    return { linked };
  }

  async linkActivation_BySpecificCrm_case(crmCase: string): Promise<{
    success: boolean;
    message: string;
    companyDelegationId?: number;
  }> {
    if (!crmCase || crmCase.trim() === '') {
      return {
        success: false,
        message: 'Le CRM Case est requis',
      };
    }

    const activation = await this.activationRepository.findOne({
      where: {
        crm_case: crmCase,
        companyDelegation: { id: IsNull() },
      },
      relations: ['company', 'companyDelegation'],
    });

    if (!activation) {
      return {
        success: false,
        message: `Activation avec CRM Case ${crmCase} non trouvée ou déjà liée`,
      };
    }

    try {
      if (!activation.company && activation.NAME_STT) {
        activation.company = await this.findMatchingCompany(
          activation.NAME_STT,
        );
        if (!activation.company) {
          return {
            success: false,
            message: `Company correspondant à ${activation.NAME_STT} non trouvée`,
          };
        }
      }

      if (
        !activation.company ||
        !activation.Gouvernorat ||
        !activation.Delegation
      ) {
        return {
          success: false,
          message:
            "Company, Gouvernorat ou Délégation manquant dans l'activation",
        };
      }

      // Trouver ou créer la companyDelegation
      const companyDelegation = await this.findOrCreateCompanyDelegation(
        activation.company,
        activation.Gouvernorat,
        activation.Delegation,
      );

      if (!companyDelegation) {
        return {
          success: false,
          message: 'Échec de la création/recherche de la délégation company',
        };
      }

      // Lier l'activation à la companyDelegation
      activation.companyDelegation = companyDelegation;
      await this.activationRepository.save(activation);

      return {
        success: true,
        message: `Activation ${crmCase} liée avec succès à la délégation company ${companyDelegation.id}`,
        companyDelegationId: companyDelegation.id,
      };
    } catch (error) {
      console.error(`Erreur lors du lien de ${crmCase}:`, error);
      return {
        success: false,
        message: `Erreur serveur: ${error.message}`,
      };
    }
  }

  private async findOrCreateCompanyDelegation(
    company: Company,
    gouvernorat: string,
    delegationName: string,
  ): Promise<CompanyDelegation | null> {
    // D'abord trouver la délégation correspondante
    const delegation = await this.delegationRepository.findOne({
      where: {
        name: delegationName,
        gouver: { name: gouvernorat },
      },
      relations: ['gouver'],
    });

    if (!delegation) {
      return null;
    }

    let companyDelegation = await this.companyDelegationRepository.findOne({
      where: {
        company: { id: company.id },
        delegation: { id: delegation.id },
      },
    });

    if (!companyDelegation) {
      companyDelegation = this.companyDelegationRepository.create({
        company,
        delegation,
      });
      await this.companyDelegationRepository.save(companyDelegation);
    }

    return companyDelegation;
  }

  async getPaginatedStats(page: number = 1, limit: number = 50) {
    const queryBuilder = this.activationRepository
      .createQueryBuilder('a')
      .select([
        'a.NAME_STT as "stt"',
        'COUNT(a.crm_case) as "total"',
        `SUM(CASE WHEN a.STATUT = 'Terminé' THEN 1 ELSE 0 END) as "termine"`,
        `SUM(CASE WHEN a.STATUT = 'En cours' THEN 1 ELSE 0 END) as "enCours"`,
        `SUM(CASE WHEN a.STATUT = 'Abandonné' THEN 1 ELSE 0 END) as "abandonne"`,
      ])
      .where('a.NAME_STT IS NOT NULL AND a.NAME_STT != :empty', { empty: '' })
      .groupBy('a.NAME_STT')
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

  async assignSTTToActivation(
    activationId: string,
    sttName: string,
    companyId?: number,
  ): Promise<Activation> {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: activationId },
    });

    if (!activation) {
      throw new Error('Activation non trouvée');
    }

    activation.NAME_STT = sttName;
    activation.DATE_AFFECTATION_STT = new Date();
    activation.REP_TRAVAUX_STT = 'en_cours';
    activation.STATUT = 'En cours';
    activation.company = null;
    if (companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new Error('Company non trouvée');
      }
      activation.company = company;
    }

    return await this.activationRepository.save(activation);
  }

  async assignSTTToActivationAuto(
    activationId: string,
    sttName?: string,
    companyId?: number,
  ) {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: activationId },
    });

    if (!activation) throw new Error('Activation non trouvée');

    if (!sttName) {
      const eligibleStts = await this.companyRepository.find({
        where: { blocked: false },
      });

      if (eligibleStts.length === 1) {
        activation.NAME_STT = eligibleStts[0].name;
        activation.DATE_AFFECTATION_STT = new Date();
        activation.REP_TRAVAUX_STT = 'en cours';
      }
    }

    if (companyId) {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (company) activation.company = company;
    }

    return this.activationRepository.save(activation);
  }
  async testerAutoAffectationSurDonneesExistantes() {
    const activation = await this.activationRepository.findOne({
      where: {
        REP_TRAVAUX_STT: 'non_affecté_stt',
        STATUT: 'en cours',
      },
      order: { DATE_CREATION_CRM: 'DESC' },
    });

    if (!activation) {
      throw new Error('Aucune activation éligible trouvée');
    }

    const sttsDisponibles = await this.companyRepository.find({
      where: { blocked: false },
    });

    if (sttsDisponibles.length === 1) {
      activation.NAME_STT = sttsDisponibles[0].name;
      activation.DATE_AFFECTATION_STT = new Date();
      activation.REP_TRAVAUX_STT = 'en cours';

      return this.activationRepository.save(activation);
    }

    return activation;
  }
  async getSLA(id: number) {
    return await this.activationRepository.findOne({
      where: { crm_case: String(id) },
      select: [
        'SLA_EQUIPE_FIXE',
        'SLA_STT',
        'TEMPS_MOYEN_AFFECTATION_STT',
        'TEMPS_MOYEN_PRISE_RDV',
      ],
    });
  }

  async getAverageSLABySTT(period: string) {
    return this.getAverageSLA('NAME_STT', period);
  }

  async getAverageSLAByBranch(period: string) {
    return this.getAverageSLA('branch_id', period);
  }
  async findSttWithHighestAverageDelay(): Promise<{
    nameStt: string;
    averageSlaStt: number;
    activationCount: number;
  } | null> {
    const result = await this.activationRepository
      .createQueryBuilder('activation')
      .select([
        'activation.NAME_STT as nameStt',
        'AVG(activation.SLA_STT) as averageSlaStt',
        'COUNT(activation.crm_case) as activationCount',
      ])
      .where('activation.NAME_STT IS NOT NULL')
      .andWhere('activation.SLA_STT IS NOT NULL')
      .groupBy('activation.NAME_STT')
      .orderBy('averageSlaStt', 'DESC')
      .limit(1)
      .getRawOne();

    return result || null;
  }

  async findActivationsByCompany(
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
    METRAGE_CABLE?: number,
    STATUT?: string,
  ): Promise<{ data: ActivationWithoutPdf[]; total: number }> {
    const queryBuilder = this.activationRepository
      .createQueryBuilder('p')
      .where('p.company_id = :companyId', { companyId });

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
      METRAGE_CABLE,
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

  // async findActivationsByCompany(
  //   companyId: number,
  //   filters: {
  //     startDate?: Date;
  //     endDate?: Date;
  //     status?: string;
  //     msisdn?: string;
  //     client?: string;
  //     gouvernorat?: string;
  //   },
  //   pagination: PaginationDto,
  // ) {
  //   const query = this.activationRepository
  //     .createQueryBuilder('activation')
  //     .leftJoinAndSelect('activation.company', 'company')
  //     .leftJoinAndSelect('activation.companyDelegation', 'CompanyDelegation')
  //     .where('company.id = :companyId', { companyId });

  //   if (filters.startDate && filters.endDate) {
  //     query.andWhere({
  //       OPENING_DATE_SUR_TIMOS: Between(filters.startDate, filters.endDate),
  //     });
  //   } else if (filters.startDate) {
  //     query.andWhere({
  //       OPENING_DATE_SUR_TIMOS: MoreThanOrEqual(filters.startDate),
  //     });
  //   } else if (filters.endDate) {
  //     query.andWhere({
  //       OPENING_DATE_SUR_TIMOS: LessThanOrEqual(filters.endDate),
  //     });
  //   }

  //   if (filters.status) {
  //     query.andWhere('activation.STATUT LIKE :status', {
  //       status: `%${filters.status}%`,
  //     });
  //   }

  //   if (filters.msisdn) {
  //     query.andWhere('activation.MSISDN LIKE :msisdn', {
  //       msisdn: `%${filters.msisdn}%`,
  //     });
  //   }

  //   if (filters.client) {
  //     query.andWhere('activation.CLIENT LIKE :client', {
  //       client: `%${filters.client}%`,
  //     });
  //   }

  //   if (filters.gouvernorat) {
  //     query.andWhere('activation.Gouvernorat LIKE :gouvernorat', {
  //       gouvernorat: `%${filters.gouvernorat}%`,
  //     });
  //   }

  //   const [data, total] = await query
  //     .skip(pagination.skip)
  //     .take(pagination.take)
  //     .getManyAndCount();

  //   return {
  //     data,
  //     total,
  //     page: pagination.page,
  //     limit: pagination.take,
  //   };
  // }
  async findActivationsByCompanyAndTechnician(
    companyId: number,
    technicienId: number,
    pagination: PaginationDto,
  ) {
    const query = this.activationRepository
      .createQueryBuilder('activation')
      .leftJoinAndSelect('activation.company', 'company')
      .leftJoinAndSelect('activation.companyDelegation', 'companyDelegation')
      .leftJoinAndSelect('companyDelegation.technicien', 'technicien')
      .where('company.id = :companyId', { companyId })
      .andWhere('technicien.id = :technicienId', { technicienId });

    const [data, total] = await query
      .skip(pagination.skip)
      .take(pagination.take)
      .getManyAndCount();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.take,
    };
  }

  async findActivationsByTechnician(
    technicienId: number,
    pagination: PaginationDto,
  ) {
    const cacheKey = `activations_technicien_${technicienId}_${pagination.page}_${pagination.take}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const query = this.activationRepository
      .createQueryBuilder('activation')
      .innerJoin('activation.companyDelegation', 'companyDelegation')
      .innerJoin(
        'companyDelegation.technicien',
        'technicien',
        'technicien.id = :technicienId',
        { technicienId },
      )
      .leftJoinAndSelect('activation.company', 'company')
      .select([
        'activation.crm_case',
        'activation.DATE_CREATION_CRM',
        'activation.LATITUDE_SITE',
        'activation.LONGITUDE_SITE',
        'activation.MSISDN',
        'activation.CONTACT_CLIENT',
        'activation.CLIENT',
        'activation.REP_TRAVAUX_STT',
        'activation.NAME_STT',
        'activation.Delegation',
        'activation.Gouvernorat',
        'activation.DATE_AFFECTATION_STT',
        'activation.DES_PACK',
        'activation.offre',
        'activation.OPENING_DATE_SUR_TIMOS',
        'activation.REP_RDV',
        'activation.DATE_PRISE_RDV',
        'activation.CMT_RDV',
        'activation.METRAGE_CABLE',
        'activation.STATUT',
        'activation.DATE_FIN_TRV',
        'activation.DATE_debut_TRV',
        'activation.SLA_EQUIPE_FIXE',
        'activation.SLA_STT',
        'activation.TEMPS_MOYEN_AFFECTATION_STT',
        'activation.TEMPS_MOYEN_PRISE_RDV',
        'activation.last_sync',
        'company.id',
        'company.name',
        'company.type',
        'company.adresse',
        'company.contact',
        'company.created_at',
        'company.blocked',
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

    const groupedResults = await this.activationRepository
      .createQueryBuilder('a')
      .select([
        `${groupBy} AS group_by`,
        `AVG(a.SLA_STT) AS avg_sla_stt`,
        `AVG(a.TEMPS_MOYEN_PRISE_RDV) AS avg_temps_rdv`,
      ])
      .where(whereConditions)
      .groupBy(groupBy)
      .getRawMany();

    const globalResults = await this.activationRepository
      .createQueryBuilder('a')
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

  async batchAssignStt(batchAssignSttDto: BatchAssignSttDto, user: any) {
    const { activationIds, sttName, companyId } = batchAssignSttDto;
    const currentDate = new Date();

    const activations = await this.activationRepository.find({
      where: { crm_case: In(activationIds) },
      select: ['crm_case', 'REP_TRAVAUX_STT'],
    });

    if (!activations.length) {
      throw new Error('Aucune activation trouvée');
    }

    await this.activationRepository
      .createQueryBuilder()
      .update(Activation)
      .set({
        NAME_STT: sttName,
        REP_TRAVAUX_STT: 'en_cours',
        company: { id: companyId },
        companyDelegation: null,
        STATUT: 'En cours',
        DATE_AFFECTATION_STT: currentDate,
      })
      .where('crm_case IN (:...ids)', { ids: activationIds })
      .execute();

    for (const activation of activations) {
      const oldRepTravauxStt = activation.REP_TRAVAUX_STT;
      const actionType =
        oldRepTravauxStt === 'non_affecté_stt'
          ? 'affectation'
          : 'reaffectation';

      await this.historyService.logAssignment({
        dataType: 'activation',
        crmCase: activation.crm_case,
        actionType,
        userId: user?.id,
        actionDate: currentDate,
        STT: sttName,
      });
    }

    return this.activationRepository.find({
      where: { crm_case: In(activationIds) },
      relations: ['company'],
    });
  }
  async batchClotureTask(batchClotureDto: BatchClotureDto, user: any) {
    const { activationIds, note } = batchClotureDto;
    const currentDate = new Date();

    if (activationIds == null) {
      throw new Error('activationIds must be provided');
    }

    const normalizedIds = Array.isArray(activationIds)
      ? activationIds
      : [activationIds];

    if (normalizedIds.length === 0) {
      throw new Error('At least one activation ID must be provided');
    }

    if (!note || typeof note !== 'string') {
      throw new Error('Closure note is required and must be a string');
    }

    try {
      const activations = await this.activationRepository.find({
        where: { crm_case: In(normalizedIds) },
      });

      for (const activation of activations) {
        const actionType = 'Cloture';

        await this.historyService.logAssignment({
          dataType: 'activation',
          crmCase: activation.crm_case,
          actionType,
          userId: user?.id,
          actionDate: currentDate,
        });
      }

      await this.activationRepository
        .createQueryBuilder()
        .update(Activation)
        .set({
          STATUT: 'Abandonné',
          DATE_CLOTURE_ZM: currentDate,
          NOTE_CLOTURE_ZM: note,
          REP_TRAVAUX_STT: 'Abandonné',
        })
        .where('crm_case IN (:...ids)', { ids: normalizedIds })
        .execute();

      return await this.activationRepository.find({
        where: { crm_case: In(normalizedIds) },
      });
    } catch (error) {
      console.error('Error in batchClotureTask:', error);
      throw new Error('Failed to batch close activations');
    }
  }

  async getInProgressActivationsGroupedByCompany(
    page = 1,
    limit = 100,
  ): Promise<{
    [companyName: string]: { count: number; data: ActivationFrozenDto[] };
  }> {
    const activations = await this.activationRepository.find({
      where: {
        STATUT: 'En cours',
        REP_TRAVAUX_STT: Not('non_affecté_stt'),
      },
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const groupedResult = activations.reduce(
      (acc, activation) => {
        const companyName = activation.company?.name || 'Unknown';

        const activationDto: ActivationFrozenDto = {
          crm_case: activation.crm_case,
          DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
          LATITUDE_SITE: activation.LATITUDE_SITE,
          LONGITUDE_SITE: activation.LONGITUDE_SITE,
          MSISDN: activation.MSISDN,
          CONTACT_CLIENT: activation.CONTACT_CLIENT,
          CLIENT: activation.CLIENT,
          NAME_STT: activation.NAME_STT,
          Delegation: activation.Delegation,
          Gouvernorat: activation.Gouvernorat,
          STATUT: activation.STATUT,
          DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
          REP_RDV: activation.REP_RDV,
          DES_PACK: activation.DES_PACK,
          offre: activation.offre,
          DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
          REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
          OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
          DATE_FIN_TRV: activation.DATE_FIN_TRV,
          DATE_debut_TRV: activation.DATE_debut_TRV,
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
        [companyName: string]: { count: number; data: ActivationFrozenDto[] };
      },
    );

    return groupedResult;
  }
  async getInProgressActivationsGroupedByGouvernorat(
    page = 1,
    limit = 100,
  ): Promise<{
    [companyName: string]: { count: number; data: ActivationFrozenDto[] };
  }> {
    const activations = await this.activationRepository.find({
      where: {
        STATUT: 'En cours',
        REP_TRAVAUX_STT: Not('non_affecté_stt'),
      },
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const groupedResult = activations.reduce(
      (acc, activation) => {
        const GouvName = activation.Gouvernorat || 'Unknown';

        const activationDto: ActivationFrozenDto = {
          crm_case: activation.crm_case,
          DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
          LATITUDE_SITE: activation.LATITUDE_SITE,
          LONGITUDE_SITE: activation.LONGITUDE_SITE,
          MSISDN: activation.MSISDN,
          CONTACT_CLIENT: activation.CONTACT_CLIENT,
          CLIENT: activation.CLIENT,
          NAME_STT: activation.NAME_STT,
          Delegation: activation.Delegation,
          Gouvernorat: activation.Gouvernorat,
          STATUT: activation.STATUT,
          DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
          REP_RDV: activation.REP_RDV,
          DES_PACK: activation.DES_PACK,
          offre: activation.offre,
          DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
          REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
          OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
          DATE_FIN_TRV: activation.DATE_FIN_TRV,
          DATE_debut_TRV: activation.DATE_debut_TRV,
        };

        if (!acc[GouvName]) {
          acc[GouvName] = {
            count: 0,
            data: [],
          };
        }

        acc[GouvName].count++;
        acc[GouvName].data.push(activationDto);

        return acc;
      },
      {} as {
        [companyName: string]: { count: number; data: ActivationFrozenDto[] };
      },
    );

    return groupedResult;
  }
  async getFrozenActivations(
    page = 1,
    limit = 100,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    const where: any = { STATUT: 'Gelé' };
    if (gouvernorat) {
      where.Gouvernorat = gouvernorat;
    }

    const [results, total] = await this.activationRepository.findAndCount({
      where,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ActivationFrozenDto[] = results.map((activation) => ({
      crm_case: activation.crm_case,
      DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
      LATITUDE_SITE: activation.LATITUDE_SITE,
      LONGITUDE_SITE: activation.LONGITUDE_SITE,
      MSISDN: activation.MSISDN,
      CONTACT_CLIENT: activation.CONTACT_CLIENT,
      CLIENT: activation.CLIENT,
      NAME_STT: activation.NAME_STT,
      Delegation: activation.Delegation,
      Gouvernorat: activation.Gouvernorat,
      STATUT: activation.STATUT,
      DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
      REP_RDV: activation.REP_RDV,
      DES_PACK: activation.DES_PACK,
      offre: activation.offre,
      DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: activation.DATE_FIN_TRV,
      DATE_debut_TRV: activation.DATE_debut_TRV,
    }));

    return { count: total, data };
  }

  async getNonAffectedActivations(
    page = 1,
    limit = 100,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    const where: any = {
      REP_TRAVAUX_STT: 'non_affecté_stt',
      STATUT: 'En cours',
    };

    if (gouvernorat) {
      where.Gouvernorat = gouvernorat;
    }

    const total = await this.activationRepository.count({ where });

    const results = await this.activationRepository.find({
      where,
      relations: ['company'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ActivationFrozenDto[] = results.map((activation) => ({
      crm_case: activation.crm_case,
      DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
      LATITUDE_SITE: activation.LATITUDE_SITE,
      LONGITUDE_SITE: activation.LONGITUDE_SITE,
      MSISDN: activation.MSISDN,
      CONTACT_CLIENT: activation.CONTACT_CLIENT,
      CLIENT: activation.CLIENT,
      NAME_STT: activation.NAME_STT,
      Delegation: activation.Delegation,
      Gouvernorat: activation.Gouvernorat,
      STATUT: activation.STATUT,
      DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
      REP_RDV: activation.REP_RDV,
      DES_PACK: activation.DES_PACK,
      offre: activation.offre,
      DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: activation.DATE_FIN_TRV,
      DATE_debut_TRV: activation.DATE_debut_TRV,
    }));

    return { count: total, data };
  }

  async getInRdvActivations(
    page = 1,
    limit?: number,
    getAll = false,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    const whereConditions: any = {
      REP_RDV: '',
      STATUT: 'En cours',
      REP_TRAVAUX_STT: Not('non_affecté_stt'),
    };

    if (gouvernorat) {
      whereConditions.Gouvernorat = gouvernorat;
    }

    const findOptions: FindManyOptions = {
      where: whereConditions,
      relations: ['company'],
    };
    if (!getAll && limit) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
    }

    const [results, total] =
      await this.activationRepository.findAndCount(findOptions);

    const data: ActivationFrozenDto[] = results.map((activation) => ({
      crm_case: activation.crm_case,
      DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
      LATITUDE_SITE: activation.LATITUDE_SITE,
      LONGITUDE_SITE: activation.LONGITUDE_SITE,
      MSISDN: activation.MSISDN,
      CONTACT_CLIENT: activation.CONTACT_CLIENT,
      CLIENT: activation.CLIENT,
      NAME_STT: activation.NAME_STT,
      Delegation: activation.Delegation,
      Gouvernorat: activation.Gouvernorat,
      STATUT: activation.STATUT,
      DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
      REP_RDV: activation.REP_RDV,
      DES_PACK: activation.DES_PACK,
      offre: activation.offre,
      DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: activation.DATE_FIN_TRV,
      DATE_debut_TRV: activation.DATE_debut_TRV,
    }));

    return { count: total, data };
  }
  async getEnWorkActivations(
    page = 1,
    limit?: number,
    getAll = false,
    gouvernorat?: string,
  ): Promise<{
    count: number;
    data: ActivationFrozenDto[];
  }> {
    const whereConditions: any = {
      STATUT: 'En travaux',
      REP_RDV: Not(''),
      DATE_PRISE_RDV: Not(IsNull()),
    };

    if (gouvernorat) {
      whereConditions.Gouvernorat = gouvernorat;
    }

    const findOptions: FindManyOptions = {
      where: whereConditions,
      relations: ['company'],
    };

    if (!getAll && limit) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
    }

    const [results, total] =
      await this.activationRepository.findAndCount(findOptions);

    const data: ActivationFrozenDto[] = results.map((activation) => ({
      crm_case: activation.crm_case,
      DATE_CREATION_CRM: activation.DATE_CREATION_CRM,
      LATITUDE_SITE: activation.LATITUDE_SITE,
      LONGITUDE_SITE: activation.LONGITUDE_SITE,
      MSISDN: activation.MSISDN,
      CONTACT_CLIENT: activation.CONTACT_CLIENT,
      CLIENT: activation.CLIENT,
      NAME_STT: activation.NAME_STT,
      Delegation: activation.Delegation,
      Gouvernorat: activation.Gouvernorat,
      STATUT: activation.STATUT,
      DATE_PRISE_RDV: activation.DATE_PRISE_RDV,
      REP_RDV: activation.REP_RDV,
      DES_PACK: activation.DES_PACK,
      offre: activation.offre,
      DATE_AFFECTATION_STT: activation.DATE_AFFECTATION_STT,
      REP_TRAVAUX_STT: activation.REP_TRAVAUX_STT,
      OPENING_DATE_SUR_TIMOS: activation.OPENING_DATE_SUR_TIMOS,
      DATE_FIN_TRV: activation.DATE_FIN_TRV,
      DATE_debut_TRV: activation.DATE_debut_TRV,
    }));

    return { count: total, data };
  }

  async getCountOfInProgressActivationsBySttId_Gouv(
    sttId: number,
    Gouv: string,
  ): Promise<number> {
    return await this.activationRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
      } as FindOptionsWhere<Activation>,
    });
  }
  async getCountOfInProgressActivationsBySttId_Gouv_Del(
    sttId: number,
    Gouv: string,
    Deleg: string,
  ): Promise<number> {
    return await this.activationRepository.count({
      where: {
        company: { id: sttId },
        STATUT: 'En cours',
        REP_TRAVAUX_STT: 'en_cours',
        Gouvernorat: ILike(Gouv),
        Delegation: ILike(`%${Deleg}%`),
      } as FindOptionsWhere<Activation>,
    });
  }

  async assignTechnicianToActivations(
    activationIds: number[],
    technicianId: number,
    companyId: number,
  ): Promise<Activation[]> {
    const activationsToUpdate =
      await this.activationRepository.findByIds(activationIds);

    if (activationsToUpdate.length === 0) {
      console.warn('No activations found for the provided IDs.');
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

    for (const activation of activationsToUpdate) {
      activation.companyDelegation = companyDelegation;
    }
    return await this.activationRepository.save(activationsToUpdate);
  }

  async getCountOfActivationsBySttId_technicien(
    sttId: number,
    technicianId: number,
    Gouv: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.activationRepository
      .createQueryBuilder('activation')
      .select('activation.STATUT', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('activation.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .where('activation.company_id = :sttId', { sttId })
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(activation.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('activation.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('activation.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('activation.STATUT');

    return query.getRawMany();
  }
  async getCountOfActivationsBy_technicien(
    technicianId: number,
    Gouv?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.activationRepository
      .createQueryBuilder('activation')
      .select('activation.REP_RDV', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('activation.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(activation.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('activation.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('activation.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('activation.REP_RDV');

    return query.getRawMany();
  }
  async getStatusCountOfActivationsBy_technicien(
    technicianId: number,
    Gouv?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ status: string; count: number }[]> {
    const query = this.activationRepository
      .createQueryBuilder('activation')
      .select('activation.STATUT', 'status')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('activation.companyDelegation', 'companyDelegation')
      .leftJoin('companyDelegation.technicien', 'technicien')
      .andWhere('technicien.id = :technicianId', { technicianId });

    if (Gouv) {
      query.andWhere('LOWER(activation.Gouvernorat) LIKE :gouv', {
        gouv: `%${Gouv.toLowerCase()}%`,
      });
    }

    if (startDate) {
      query.andWhere('activation.DATE_AFFECTATION_STT >= :startDate', {
        startDate,
      });
    }

    query.andWhere('activation.DATE_AFFECTATION_STT <= :endDate', {
      endDate: endDate ?? new Date(),
    });

    query.groupBy('activation.STATUT');

    return query.getRawMany();
  }

  async PriseRDV_technicien(
    activationId: string,
    DATE_PRISE_RDV: Date,
  ): Promise<Activation> {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: activationId },
    });

    if (!activation) {
      throw new Error('Activation non trouvée');
    }

    activation.DATE_PRISE_RDV = DATE_PRISE_RDV;
    activation.REP_TRAVAUX_STT = 'en_cours';
    activation.STATUT = 'En cours';
    activation.REP_RDV = 'Effectué';
    return await this.activationRepository.save(activation);
  }

  async MarquerDebut_travaux(activationId: string): Promise<Activation> {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: activationId },
    });
    const currentDate = new Date();
    if (!activation) {
      throw new Error('Activation non trouvée');
    }

    activation.DATE_debut_TRV = currentDate;
    return await this.activationRepository.save(activation);
  }

  async detectRDVPblem_technicien(
    activationId: string,
    raison: string,
    cmntr: string,
  ): Promise<Activation> {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: activationId },
    });

    if (!activation) {
      throw new Error('Activation non trouvée');
    }
    if (raison.toLocaleLowerCase() == 'Effectué par le client') {
      activation.REP_TRAVAUX_STT = 'Effectué';
      activation.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'abondonné') {
      activation.REP_TRAVAUX_STT = 'Effectué';
      activation.STATUT = 'Terminé';
    } else if (raison.toLocaleLowerCase() == 'client injoignable') {
      activation.REP_TRAVAUX_STT = 'Client ingoinable';
      activation.STATUT = 'Gelé';
    }

    activation.REP_RDV = raison;
    activation.CMT_RDV = cmntr;
    return await this.activationRepository.save(activation);
  }

  async savePdf(
    crmCase: string,
    pdfBuffer: Buffer,
    metrageCable: number,
    imeiIdu: string,
    snIdu: string,
    mimeType = 'application/pdf',
  ): Promise<void> {
    const dateFinTrv = new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const activation = await this.activationRepository.findOneBy({
      crm_case: crmCase,
    });

    if (!activation) {
      throw new Error(`Activation avec CRM Case ${crmCase} non trouvée`);
    }

    await this.activationRepository.update(
      { crm_case: crmCase },
      {
        pdfFile: pdfBuffer,
        pdfMimeType: mimeType,
        STATUT: 'Terminé',
        REP_TRAVAUX_STT: 'Effectué',
        DATE_FIN_TRV: dateFinTrv,
        METRAGE_CABLE: metrageCable,
      },
    );
    const prodImei = new Prod_imei();
    prodImei.imei_idu = imeiIdu;
    prodImei.S_N_idu = snIdu;
    prodImei.Date_Ajout_En_Activation = new Date();

    prodImei.activation = activation;

    await this.prodImeiRepository.save(prodImei);
  }

  async getPdf(crmCase: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const activation = await this.activationRepository.findOne({
      where: { crm_case: crmCase },
      select: ['pdfFile', 'pdfMimeType'],
    });

    if (!activation?.pdfFile) {
      throw new Error('PDF non trouvé');
    }

    return {
      buffer: activation.pdfFile,
      mimeType: activation.pdfMimeType || 'application/pdf',
    };
  }
}
