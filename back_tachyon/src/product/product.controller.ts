import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProductsService } from './product.service';
import { Products } from 'src/stock/entities/products.entity';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(): Promise<Products[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Products> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() productData: Partial<Products>): Promise<Products> {
    return this.productsService.create(productData);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() productData: Partial<Products>,
  ): Promise<Products> {
    return this.productsService.update(id, productData);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.productsService.delete(id);
  }
  @Put('/archiver/:id')
  async archive(@Param('id') id: number): Promise<void> {
    await this.productsService.archive(id);
  }
}
