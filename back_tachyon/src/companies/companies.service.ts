import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({
      relations: {
        users: true,
      },
    });
  }

  async findAll_Unblocked(): Promise<Company[]> {
    return await this.companyRepository.find({
      relations: {
        users: true,
        companyDelegations: {
          delegation: true,
        },
      },
      where: [{ blocked: false }, { companyDelegations: { blocked: false } }],
    });
  }
  async findAll_Unblocked_C(): Promise<Company[]> {
    return this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.users', 'users')
      .leftJoinAndSelect('company.companyDelegations', 'companyDelegations')
      .leftJoinAndSelect('companyDelegations.delegation', 'delegation')
      .leftJoinAndSelect('delegation.gouver', 'gouver')
      .where('company.blocked = :blocked', { blocked: false })
      .andWhere('companyDelegations.blocked = :delegBlocked', {
        delegBlocked: false,
      })
      .distinctOn(['company.id'])
      .getMany();
  }
  async findAllBlocked(): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { blocked: true },
    });
  }

  async findSTT(): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { name: Not('Ooredoo') },
    });
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async remove(id: number): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
  }

  async blockCompany(id: number): Promise<Company> {
    const company = await this.findOne(id);
    company.blocked = true;
    return await this.companyRepository.save(company);
  }

  async unblockCompany(id: number): Promise<Company> {
    const company = await this.findOne(id);
    company.blocked = false;
    return await this.companyRepository.save(company);
  }
}
