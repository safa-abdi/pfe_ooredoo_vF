import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pack } from './entities/pack.entity';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { Products } from 'src/stock/entities/products.entity';

@Injectable()
export class PackService {
  constructor(
    @InjectRepository(Pack)
    private readonly packRepository: Repository<Pack>,

    @InjectRepository(Products)
    private readonly productRepository: Repository<Products>,
  ) {}

  // ✅ Créer un pack avec les produits associés
  async create(createPackDto: CreatePackDto): Promise<Pack> {
    const { name, description, products } = createPackDto;

    // Vérifier si les produits existent
    const existingProducts = await this.productRepository.findByIds(products);

    if (existingProducts.length !== products.length) {
      throw new NotFoundException(
        'Un ou plusieurs produits sont introuvables.',
      );
    }

    const pack = this.packRepository.create({
      name,
      description,
      products: existingProducts,
    });
    return await this.packRepository.save(pack);
  }

  // ✅ Récupérer un pack par son ID
  async findOne(id: number): Promise<Pack> {
    const pack = await this.packRepository.findOne({
      where: { id },
      relations: ['products'], // Charger les produits associés
    });

    if (!pack) {
      throw new NotFoundException(`Pack avec l'ID ${id} non trouvé.`);
    }
    return pack;
  }

  // ✅ Mettre à jour un pack
  async update(id: number, updatePackDto: UpdatePackDto): Promise<Pack> {
    const pack = await this.findOne(id);

    if (updatePackDto.products) {
      const existingProducts = await this.productRepository.findByIds(
        updatePackDto.products,
      );
      if (existingProducts.length !== updatePackDto.products.length) {
        throw new NotFoundException(
          'Un ou plusieurs produits sont introuvables.',
        );
      }
      pack.products = existingProducts;
    }

    Object.assign(pack, updatePackDto);
    return await this.packRepository.save(pack);
  }

  // ✅ Supprimer un pack
  async remove(id: number): Promise<void> {
    const pack = await this.findOne(id);
    await this.packRepository.remove(pack);
  }
  async findAll(): Promise<Pack[]> {
    return await this.packRepository.find({
      relations: ['products'], // Charger les produits associés pour chaque pack
    });
  }
}
