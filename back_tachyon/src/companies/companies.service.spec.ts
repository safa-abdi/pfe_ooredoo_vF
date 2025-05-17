/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: CompaniesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAll_Unblocked_C: jest.fn(),
    findAllBlocked: jest.fn(),
    findSTT: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    blockCompany: jest.fn(),
    unblockCompany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a company', () => {
    const dto: CreateCompanyDto = {
      name: 'NestCorp',
      type: 'societe_principale',
    };
    mockService.create.mockReturnValue(dto);
    expect(controller.create(dto)).toEqual(dto);
    expect(mockService.create).toHaveBeenCalledWith(dto);
  });

  it('should return all companies', () => {
    const result = [{ id: 1, name: 'Company A' }];
    mockService.findAll.mockReturnValue(result);
    expect(controller.findAll()).toEqual(result);
  });

  it('should return unblocked companies', () => {
    const result = [{ id: 1, name: 'Active Co' }];
    mockService.findAll_Unblocked_C.mockReturnValue(result);
    expect(controller.findAll_unblocked()).toEqual(result);
  });

  it('should return blocked companies', () => {
    const result = [{ id: 2, name: 'Blocked Co' }];
    mockService.findAllBlocked.mockReturnValue(result);
    expect(controller.findAllblocked()).toEqual(result);
  });

  it('should return STT companies', () => {
    const result = [{ id: 3, name: 'STT Co' }];
    mockService.findSTT.mockReturnValue(result);
    expect(controller.findAllSTT()).toEqual(result);
  });

  it('should return one company by id', () => {
    const result = { id: 1, name: 'Single Co' };
    mockService.findOne.mockReturnValue(result);
    expect(controller.findOne('1')).toEqual(result);
  });

  it('should update a company', () => {
    const dto: UpdateCompanyDto = { name: 'Updated Co' };
    const result = { id: 1, ...dto };
    mockService.update.mockReturnValue(result);
    expect(controller.update('1', dto)).toEqual(result);
  });

  it('should delete a company', () => {
    const result = { deleted: true };
    mockService.remove.mockReturnValue(result);
    expect(controller.remove('1')).toEqual(result);
  });

  it('should block a company', async () => {
    const result = { id: 1, blocked: true };
    mockService.blockCompany.mockResolvedValue(result);
    await expect(controller.block(1)).resolves.toEqual(result);
  });

  it('should unblock a company', async () => {
    const result = { id: 1, blocked: false };
    mockService.unblockCompany.mockResolvedValue(result);
    await expect(controller.unblock(1)).resolves.toEqual(result);
  });
});
