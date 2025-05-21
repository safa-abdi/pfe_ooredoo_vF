/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  HttpException,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Stock } from './entities/stock.entity';

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
  @Post('alimenter/:companyId')
  async alimenterStock(
    @Param('companyId') companyId: number,
    @Body() body: any,
  ) {
    console.log('Received body:', body);
    console.log('Body type:', typeof body);

    if (!body || body.productId === undefined || body.quantity === undefined) {
      console.log('Missing parameters', {
        productId: body?.productId,
        quantity: body?.quantity,
      });
    }

    return this.stockService.alimenterStock(
      body.productId,
      companyId,
      body.quantity,
    );
  }

  @Post('alimenter-multiple/:companyId')
  async alimenterStockMultiple(
    @Param('companyId') companyId: number,
    @Body() body: { items: Array<{ productId: number; quantity: number }> },
  ): Promise<Stock[]> {
    if (!body || !body.items || !Array.isArray(body.items)) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Le paramètre items (array) est requis',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.stockService.alimenterStockMultiple(
        body.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
        Number(companyId),
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: "Erreur lors de l'alimentation multiple du stock",
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post(':stockId/alimenter-items')
  async alimenterStockItems(
    @Param('stockId') stockId: number,
    @Body()
    body: {
      items: {
        imei_idu: string;
        imei_odu: string;
        serial_number: string;
      }[];
    },
  ) {
    try {
      const result = await this.stockService.alimenterStock_items(
        stockId,
        body.items,
      );
      return {
        message: 'Stock alimenté avec succès',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message || "Erreur lors de l'alimentation du stock",
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}