/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Products } from './entities/products.entity';
import { Pack } from 'src/product/pack/entities/pack.entity';
import { Company } from 'src/companies/entities/company.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Products) // Ajout du repository pour Product
    private readonly productRepository: Repository<Products>,

    @InjectRepository(Pack)
    private readonly packRepository: Repository<Pack>,
  ) {}

  async create(createStockDto: CreateStockDto): Promise<Stock> {
    const { product_id, company_id } = createStockDto;

    // Vérifie si le produit existe
    const product = await this.productRepository.findOne({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const company = await this.companyRepository.findOne({
      where: { id: company_id },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${company_id} not found`);
    }

    const stock = this.stockRepository.create({
      product,
      company,
      quantity: createStockDto.quantity,
      date_prel: createStockDto.date_prel,
    });

    return await this.stockRepository.save(stock);
  }

  async findAll(): Promise<Stock[]> {
    return await this.stockRepository.find({
      relations: ['product', 'company'],
    });
  }

  async findByPack(): Promise<any[]> {
    const stocks = await this.stockRepository.find({
      relations: ['product', 'company'],
    });

    const packs = await this.packRepository.find({
      relations: ['products'],
    });

    const groupedByPack = new Map<number, any>();

    stocks.forEach((stock) => {
      const pack = packs.find((p) =>
        p.products.some((prod) => prod.id === stock.product.id),
      );

      if (pack) {
        if (!groupedByPack.has(pack.id)) {
          groupedByPack.set(pack.id, {
            pack: {
              id: pack.id,
              name: pack.name,
              description: pack.description,
            },
            stocks: [],
          });
        }
        groupedByPack.get(pack.id).stocks.push(stock);
      }
    });

    return Array.from(groupedByPack.values());
  }
  async findByPack_Company(company_id: number): Promise<any[]> {
    const stocks = await this.stockRepository.find({
      where: { company: { id: company_id } },
      relations: ['product', 'company'],
    });

    const packs = await this.packRepository.find({
      relations: ['products'],
    });

    const groupedByPack = new Map<number, any>();

    stocks.forEach((stock) => {
      const pack = packs.find((p) =>
        p.products.some((prod) => prod.id === stock.product.id),
      );

      if (pack) {
        if (!groupedByPack.has(pack.id)) {
          groupedByPack.set(pack.id, {
            pack: {
              id: pack.id,
              name: pack.name,
              description: pack.description,
            },
            stocks: [],
          });
        }
        groupedByPack.get(pack.id).stocks.push(stock);
      }
    });

    return Array.from(groupedByPack.values());
  }
  async findOne(id: number): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { id },
      relations: ['product', 'company'],
    });
    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }
    return stock;
  }

  async update(id: number, updateStockDto: UpdateStockDto): Promise<Stock> {
    const stock = await this.findOne(id);
    stock.quantity = updateStockDto.quantity;
    return await this.stockRepository.save(stock);
  }

  async alimStock(
    product_id: number,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    const stock = await this.findOne(product_id);
    stock.quantity = updateStockDto.quantity;
    return await this.stockRepository.save(stock);
  }
  async remove(id: number): Promise<void> {
    const stock = await this.findOne(id);
    await this.stockRepository.remove(stock);
  }
  // Ajoutez cette nouvelle méthode
  async updateThresholds(
    id: number,
    low: number,
    medium: number,
  ): Promise<Stock> {
    if (low >= medium) {
      throw new BadRequestException(
        'Le seuil bas doit être inférieur au seuil moyen',
      );
    }

    const stock = await this.findOne(id);
    return await this.stockRepository.save(stock);
  }

  async findByCompanyId(company_id: number): Promise<any[]> {
    const stocks = await this.stockRepository.find({
      where: { company: { id: company_id } },
      relations: ['product', 'company'],
    });

    return stocks.map((stock) => ({
      ...stock,
      status: this.getStockStatus(
        stock.quantity,
        stock.product.lowThreshold ?? 10, // Utilise les seuils du produit
        stock.product.mediumThreshold ?? 50,
      ),
      lowThreshold: stock.product.lowThreshold ?? 10,
      mediumThreshold: stock.product.mediumThreshold ?? 50,
    }));
  }

  private getStockStatus(
    quantity: number,
    lowThreshold: number,
    mediumThreshold: number,
  ): string {
    if (quantity <= lowThreshold) return 'Low';
    if (quantity <= mediumThreshold) return 'Medium';
    return 'High';
  }
}
