import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from 'src/stock/entities/products.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}

  async findAll(): Promise<Products[]> {
    return this.productsRepository.find({
      where: {
        archived: false,
      },
    });
  }

  async findOne(id: number): Promise<Products> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} introuvable.`);
    }
    return product;
  }

  async create(productData: Partial<Products>): Promise<Products> {
    const product = this.productsRepository.create(productData);
    return this.productsRepository.save(product);
  }

  async update(id: number, productData: Partial<Products>): Promise<Products> {
    await this.productsRepository.update(id, productData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Produit avec l'ID ${id} introuvable.`);
    }
  }
  async archive(id: number): Promise<Products> {
    const product = await this.findOne(id);
    product.archived = true;
    return this.productsRepository.save(product);
  }
}
