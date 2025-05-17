import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { Branch } from './entities/Branch.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CompanyDelegation } from './entities/CompanyDelegation';
import { User } from 'src/users/entities/user.entity';
import { Delegation } from './entities/Delegation.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyDelegation)
    private readonly companyDelegationRepository: Repository<CompanyDelegation>,
  ) {}

  async findAll() {
    return this.branchRepository.find();
  }
  async findAllBlocked(): Promise<any[]> {
    return await this.companyDelegationRepository
      .createQueryBuilder('cd')
      .leftJoinAndSelect('cd.company', 'company')
      .leftJoinAndSelect('cd.delegation', 'delegation')
      .leftJoinAndSelect('delegation.gouver', 'gouver')
      .leftJoinAndSelect('cd.coordinateur', 'coordinateur')
      .leftJoinAndSelect('cd.technicien', 'technicien')
      .where('cd.blocked = :blocked', { blocked: true })
      .select([
        'company.id',
        'company.name',
        'gouver.name as governorate',
        'COUNT(cd.id) AS count',
      ])
      .groupBy('company.id')
      .addGroupBy('gouver.name')
      .getRawMany();
  }
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const { parentCompanyId, name, ...branchData } = createBranchDto;

    if (!name) {
      throw new Error('Branch name is required');
    }

    // Check if a branch with the same name already exists
    const existingBranch = await this.branchRepository.findOne({
      where: { name },
    });

    if (existingBranch) {
      throw new Error(
        `Branch with name "${name}" already exists. Name must be unique.`,
      );
    }

    // Find the parent company
    const parentCompany = await this.companyRepository.findOne({
      where: { id: parentCompanyId },
    });

    if (!parentCompany) {
      throw new Error('Parent company not found');
    }

    // Create and save the branch, linking it with the found company
    const branch = this.branchRepository.create({
      ...branchData,
      parentCompany,
      name, // Ensure the name is passed here
    });

    return this.branchRepository.save(branch);
  }

  async findByCompanyId(companyId: number): Promise<{
    governorates: Record<
      string,
      {
        technicians: User[];
        isBlocked: boolean;
      }
    >;
    company: Company;
  }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['companyDelegations'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const delegations = await this.companyDelegationRepository.find({
      where: { company: { id: companyId } },
      relations: ['company', 'delegation', 'delegation.gouver', 'technicien'],
    });

    const groupedByGov: Record<
      string,
      {
        technicians: User[];
        isBlocked: boolean;
      }
    > = {};

    for (const delegation of delegations) {
      const govName = delegation.delegation.gouver?.name || 'Non spécifié';
      const technician = delegation.technicien;

      if (!groupedByGov[govName]) {
        groupedByGov[govName] = {
          technicians: [],
          isBlocked: true,
        };
      }

      if (
        technician &&
        !groupedByGov[govName].technicians.some((t) => t.id === technician.id)
      ) {
        groupedByGov[govName].technicians.push(technician);
      }

      if (!delegation.blocked) {
        groupedByGov[govName].isBlocked = false;
      }
    }

    return {
      governorates: groupedByGov,
      company: company,
    };
  }

  async findTechniciansByCompanyId(companyId: number): Promise<User[]> {
    const delegations = await this.companyDelegationRepository.find({
      where: { company: { id: companyId } },
      relations: ['technicien'],
    });

    const techniciansMap = new Map<number, User>();

    for (const delegation of delegations) {
      const technician = delegation.technicien;
      if (technician && !techniciansMap.has(technician.id)) {
        techniciansMap.set(technician.id, technician);
      }
    }

    return Array.from(techniciansMap.values());
  }
  async findTechniciansByCompanyIdGroupedByGovernorate(
    companyId: number,
  ): Promise<Record<string, User[]>> {
    const delegations = await this.companyDelegationRepository.find({
      where: { company: { id: companyId } },
      relations: ['technicien', 'delegation', 'delegation.gouver'],
    });

    const groupedByGov: Record<string, User[]> = {};

    for (const delegation of delegations) {
      const technician = delegation.technicien;
      const govName = delegation.delegation?.gouver?.name || 'Non spécifié';

      if (technician) {
        if (!groupedByGov[govName]) {
          groupedByGov[govName] = [];
        }

        const alreadyExists = groupedByGov[govName].some(
          (t) => t.id === technician.id,
        );
        if (!alreadyExists) {
          groupedByGov[govName].push(technician);
        }
      }
    }

    return groupedByGov;
  }

  async blockBranch(
    id: number,
  ): Promise<{ message: string; blockedCount: number }> {
    // 1. Trouver la délégation cible avec ses relations
    const targetDelegation = await this.companyDelegationRepository.findOne({
      where: { id },
      relations: ['delegation', 'delegation.gouver', 'company'],
    });

    if (!targetDelegation) {
      throw new NotFoundException(`Délégation avec l'ID ${id} non trouvée`);
    }

    // 2. Vérifier que le gouvernorat et l'entreprise existent
    const governorateName = targetDelegation.delegation?.gouver?.name;
    const companyId = targetDelegation.company?.id;
    const gouverId = targetDelegation.delegation.gouver?.id;

    if (!governorateName || !companyId || !gouverId) {
      throw new BadRequestException(
        'Informations manquantes (gouvernorat ou entreprise)',
      );
    }

    // 3. Mettre à jour toutes les CompanyDelegation correspondantes
    const updateResult = await this.companyDelegationRepository
      .createQueryBuilder('cd')
      .update()
      .set({ blocked: true })
      .where('cd.companyId = :companyId', { companyId })
      .andWhere(
        'cd.delegationId IN (SELECT id FROM delegation WHERE gouverId = :gouverId)',
        { gouverId },
      )
      .execute();

    return {
      message: `Toutes les délégations du gouvernorat ${governorateName} ont été bloquées pour cette entreprise`,
      blockedCount: updateResult.affected || 0,
    };
  }
  async unblockBranch(id: number): Promise<CompanyDelegation> {
    const companyDelegation = await this.companyDelegationRepository.findOne({
      where: { id },
    });

    if (!companyDelegation) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    companyDelegation.blocked = false;
    return this.companyDelegationRepository.save(companyDelegation);
  }
  async blockGovernorate(governorateName: string, companyId: number) {
    // Vérification que le gouvernorat existe
    const governorateExists = await this.companyDelegationRepository
      .createQueryBuilder('cd')
      .innerJoin('cd.delegation', 'delegation')
      .innerJoin('delegation.gouver', 'gouver')
      .where('gouver.name = :governorateName', { governorateName })
      .getCount();

    if (!governorateExists) {
      throw new NotFoundException(`Gouvernorat ${governorateName} non trouvé`);
    }

    // Création de la sous-requête séparément
    const subQuery = this.companyDelegationRepository
      .createQueryBuilder('cd_sub')
      .subQuery()
      .select('d.id')
      .from(Delegation, 'd')
      .innerJoin('d.gouver', 'g')
      .where('g.name = :governorateName')
      .getQuery();

    // Exécution de la requête de mise à jour
    const updateResult = await this.companyDelegationRepository
      .createQueryBuilder()
      .update(CompanyDelegation)
      .set({ blocked: true })
      .where('companyId = :companyId', { companyId })
      .andWhere(`delegationId IN ${subQuery}`, { governorateName })
      .execute();

    return {
      message: `Toutes les délégations du gouvernorat ${governorateName} ont été bloquées`,
      blockedCount: updateResult.affected || 0,
    };
  }
  async unblockGovernorate(governorateName: string, companyId: number) {
    // Vérification que le gouvernorat existe
    const governorateExists = await this.companyDelegationRepository
      .createQueryBuilder('cd')
      .innerJoin('cd.delegation', 'delegation')
      .innerJoin('delegation.gouver', 'gouver')
      .where('gouver.name = :governorateName', { governorateName })
      .getCount();

    if (!governorateExists) {
      throw new NotFoundException(`Gouvernorat ${governorateName} non trouvé`);
    }

    // Création de la sous-requête séparément
    const subQuery = this.companyDelegationRepository
      .createQueryBuilder('cd_sub')
      .subQuery()
      .select('d.id')
      .from(Delegation, 'd')
      .innerJoin('d.gouver', 'g')
      .where('g.name = :governorateName')
      .getQuery();

    // Exécution de la requête de mise à jour
    const updateResult = await this.companyDelegationRepository
      .createQueryBuilder()
      .update(CompanyDelegation)
      .set({ blocked: false })
      .where('companyId = :companyId', { companyId })
      .andWhere(`delegationId IN ${subQuery}`, { governorateName })
      .execute();

    return {
      message: `Toutes les délégations du gouvernorat ${governorateName} ont été bloquées`,
      blockedCount: updateResult.affected || 0,
    };
  }
}
