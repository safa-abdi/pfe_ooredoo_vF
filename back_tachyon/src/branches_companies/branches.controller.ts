import {
  Controller,
  Get,
  Post,
  Body,
  ParseIntPipe,
  Param,
  Put,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { User } from 'src/users/entities/user.entity';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get('/blocked')
  findAllblocked() {
    return this.branchesService.findAllBlocked();
  }

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get('/getBycompany/:companyId')
  async getBranchesByCompanyId(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return await this.branchesService.findByCompanyId(companyId);
  }

  @Put(':id/block')
  async block(@Param('id') id: number) {
    return await this.branchesService.blockBranch(id);
  }
  // company-delegation.controller.ts
  @Put('block-governorate')
  async blockGovernorate(
    @Body()
    body: {
      governorate: string;
      companyId: number;
      action: 'block' | 'unblock';
    },
  ) {
    if (body.action === 'block') {
      return this.branchesService.blockGovernorate(
        body.governorate,
        body.companyId,
      );
    } else {
      return this.branchesService.unblockGovernorate(
        body.governorate,
        body.companyId,
      );
    }
  }
  @Put(':id/unblock')
  async unblock(@Param('id') id: number) {
    return await this.branchesService.unblockBranch(id);
  }
  @Get(':id/technicians')
  async getTechniciansByCompanyId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User[]> {
    return this.branchesService.findTechniciansByCompanyId(id);
  }
  @Get(':id/technicians-by-gov')
  async getTechniciansByGovernorate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Record<string, User[]>> {
    return this.branchesService.findTechniciansByCompanyIdGroupedByGovernorate(
      id,
    );
  }
  @Get('moyenne-prise-rdv/:companyId')
  async getMoyennePriseRDVParTechnicien(
    @Param('companyId', ParseIntPipe) companyId: number,
  ) {
    return this.branchesService.getTempsMoyenParTechnicien(companyId);
  }
}
