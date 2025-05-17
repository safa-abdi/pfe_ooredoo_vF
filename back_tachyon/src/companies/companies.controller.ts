import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('/unblocked')
  findAll_unblocked() {
    return this.companiesService.findAll_Unblocked_C();
  }
  @Get('/blocked')
  findAllblocked() {
    return this.companiesService.findAllBlocked();
  }

  @Get('/STT')
  findAllSTT() {
    return this.companiesService.findSTT();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(+id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(+id);
  }

  @Put(':id/block')
  async block(@Param('id') id: number) {
    return await this.companiesService.blockCompany(id);
  }

  @Put(':id/unblock')
  async unblock(@Param('id') id: number) {
    return await this.companiesService.unblockCompany(id);
  }
}
