import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  create(@Body() createStockDto: CreateStockDto) {
    return this.stockService.create(createStockDto);
  }

  @Get()
  findAll() {
    return this.stockService.findAll();
  }

  @Get('/ByPack')
  findByPack() {
    return this.stockService.findByPack();
  }
  @Get('/ByPack/:id')
  findByPack_Company(@Param('id') id: string) {
    return this.stockService.findByPack_Company(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
    return this.stockService.update(+id, updateStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockService.remove(+id);
  }
  @Get('company/:company_id')
  async getStocksByCompanyId(
    @Param('company_id') company_id: number,
  ): Promise<any[]> {
    // Changez le retour en any[] ou créez un DTO spécifique
    return this.stockService.findByCompanyId(company_id);
  }

  @Put(':id/thresholds')
  @HttpCode(HttpStatus.OK)
  async updateThresholds(
    @Param('id') id: string,
    @Body() thresholds: { low: number; medium: number },
  ) {
    return this.stockService.updateThresholds(
      +id,
      thresholds.low,
      thresholds.medium,
    );
  }
}
