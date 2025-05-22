/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { Products } from 'src/stock/entities/products.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { CreateStockMovementByPackDto } from './dto/create-stock-movement-pack.dto';
import { Pack } from 'src/product/pack/entities/pack.entity';
import { Company } from 'src/companies/entities/company.entity';
import { IsNull } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';

@Injectable()
export class StockMovementsService {
  private readonly logger = new Logger(StockMovementsService.name);

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(Products) // Ajout du repository pour Product
    private readonly productRepository: Repository<Products>,

    @InjectRepository(Pack) // Ajout du repository pour Product
    private readonly packRepository: Repository<Pack>,
    private readonly mailerService: MailerService,
  ) {}

  async create(
    createStockMovementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    const { product_id, from_company_id, to_company_id, quantity } =
      createStockMovementDto;

    const product = await this.productRepository.findOne({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const fromCompany = await this.companyRepository.findOne({
      where: { id: from_company_id },
    });
    if (!fromCompany) {
      throw new NotFoundException(
        `Company with ID ${from_company_id} not found`,
      );
    }

    const toCompany = await this.companyRepository.findOne({
      where: { id: to_company_id },
    });
    if (!toCompany) {
      throw new NotFoundException(`Company with ID ${to_company_id} not found`);
    }

    const fromCompanyStock = await this.stockRepository.findOne({
      where: { company: fromCompany, product },
    });

    if (!fromCompanyStock || fromCompanyStock.quantity < quantity) {
      throw new BadRequestException(
        `Not enough stock for product ${product.id} (${product.name}) in company ${fromCompany.id}`,
      );
    }

    fromCompanyStock.DPM_quantity = fromCompanyStock.DPM_quantity - quantity;
    await this.stockRepository.save(fromCompanyStock);

    const stockMovement = this.stockMovementRepository.create({
      ...createStockMovementDto,
      product,
      fromCompany,
      toCompany,
    });

    return await this.stockMovementRepository.save(stockMovement);
  }

  async findAll(): Promise<StockMovement[]> {
    return await this.stockMovementRepository.find({
      relations: ['product', 'fromCompany', 'toCompany'],
    });
  }

  async findOne(id: number): Promise<StockMovement> {
    const stockMovement = await this.stockMovementRepository.findOne({
      where: { id },
      relations: ['product', 'fromCompany', 'toCompany'],
    });
    if (!stockMovement) {
      throw new NotFoundException(`Stock movement with ID ${id} not found`);
    }
    return stockMovement;
  }

  async update(
    id: number,
    updateStockMovementDto: UpdateStockMovementDto,
  ): Promise<StockMovement> {
    const stockMovement = await this.findOne(id);
    Object.assign(stockMovement, updateStockMovementDto);
    return await this.stockMovementRepository.save(stockMovement);
  }

  async updateEtat(id: number): Promise<StockMovement> {
    const stockMovement = await this.findOne(id);
    stockMovement.etat = 1;
    return await this.stockMovementRepository.save(stockMovement);
  }

  async cancelMovement(id: number): Promise<StockMovement> {
    const stockMovement = await this.findOne(id);
    const fromCompanyStock = await this.stockRepository.findOne({
      where: {
        company: stockMovement.fromCompany,
        product: stockMovement.product,
      },
    });

    if (!fromCompanyStock) {
      throw new NotFoundException(
        `Stock entry not found for company ${stockMovement.fromCompany.id} and product ${stockMovement.product.id}`,
      );
    }

    fromCompanyStock.quantity += stockMovement.quantity;
    await this.stockRepository.save(fromCompanyStock);

    stockMovement.etat = 3;
    return await this.stockMovementRepository.save(stockMovement);
  }

  async validMovement(
    id: number,
    datePrelevement?: Date,
  ): Promise<StockMovement> {
    const stockMovement = await this.stockMovementRepository.findOne({
      where: { id },
      relations: ['product', 'fromCompany', 'toCompany'],
    });

    if (!stockMovement) {
      throw new NotFoundException(`StockMovement with ID ${id} not found`);
    }

    if (stockMovement.etat !== 1) {
      throw new BadRequestException();
    }

    let toCompanyStock = await this.stockRepository.findOne({
      where: {
        company: stockMovement.toCompany,
        product: stockMovement.product,
      },
    });

    let fromCompanyStock = await this.stockRepository.findOne({
      where: {
        company: stockMovement.fromCompany,
        product: stockMovement.product,
      },
    });
    if (!toCompanyStock) {
      toCompanyStock = this.stockRepository.create({
        company: stockMovement.toCompany,
        product: stockMovement.product,
        quantity: 0,
      });
    }
    if (!fromCompanyStock) {
      fromCompanyStock = this.stockRepository.create({
        company: stockMovement.fromCompany,
        product: stockMovement.product,
        quantity: 0,
      });
    }

    fromCompanyStock.quantity -= stockMovement.quantity;
    const qtes =
      stockMovement.quantity +
      stockMovement.taux_exces -
      stockMovement.taux_deficit;
    toCompanyStock.quantity += qtes;
    fromCompanyStock.quantity -= qtes;
    await this.stockRepository.save(toCompanyStock);
    await this.stockRepository.save(fromCompanyStock);
    console.log(stockMovement.taux_deficit);
    if (stockMovement.taux_deficit != 0 || stockMovement.taux_exces != 0) {
      stockMovement.etat = 4;
      console.log('4');
    } else {
      stockMovement.etat = 2;
      console.log('2');
    }
    if (datePrelevement) {
      stockMovement.date_prelev = datePrelevement;
    }

    return await this.stockMovementRepository.save(stockMovement);
  }

  private async sendRDVConfirmationEmail(
    movement: StockMovement,
    date_rdv: Date,
    pdfPath?: string,
  ): Promise<void> {
    try {
      const companyWithUsers = await this.companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect(
          'company.users',
          'user',
          'user.role_id IN (:...roleIds)',
          {
            roleIds: [2, 4],
          },
        )

        .where('company.id = :companyId', { companyId: movement.toCompany.id })
        .getOne();

      if (!companyWithUsers?.users?.length) {
        this.logger.warn(
          `Aucun utilisateur trouvé pour ${movement.toCompany.name}`,
        );
        return;
      }

      const recipientEmails = companyWithUsers.users
        .filter((user) => user.email?.includes('@'))
        .map((user) => user.email);

      if (!recipientEmails.length) {
        this.logger.warn(`Aucun email valide pour ${movement.toCompany.name}`);
        return;
      }

      const products = await this.getMovementProducts(
        movement.N_Bon_Enlévement_DPM,
      );

      const formattedDate = new Date(date_rdv).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const attachments: any[] = [];

      if (pdfPath) {
        try {
          const fullPath = path.isAbsolute(pdfPath)
            ? pdfPath
            : path.join(__dirname, '..', '..', pdfPath);

          await fs.access(fullPath);
          const stats = await fs.stat(fullPath);

          if (stats.isFile() && stats.size > 0) {
            attachments.push({
              filename: `Bon_DPM_${movement.N_Bon_Enlévement_DPM}.pdf`,
              path: fullPath,
              contentType: 'application/pdf',
            });
          }
        } catch (fileError) {
          this.logger.error(`Erreur fichier PDF: ${pdfPath}`, fileError);
        }
      }

      // 6. Envoi de l'email
      await this.mailerService.sendMail({
        to: recipientEmails,
        subject: `[Ooredoo] RDV programmé - Bon DPM ${movement.N_Bon_Enlévement_DPM}`,
        template: 'dpm-rdv',
        context: {
          bonNumber: movement.N_Bon_Enlévement_DPM,
          date: formattedDate,
          fromCompany: movement.fromCompany.name,
          toCompany: movement.toCompany.name,
          products: products,
          hasAttachment: attachments.length > 0,
        },
        attachments,
      });

      this.logger.log(
        `Email envoyé pour le DPM ${movement.N_Bon_Enlévement_DPM}` +
          (attachments.length
            ? ' (avec pièce jointe)'
            : ' (sans pièce jointe)'),
      );
    } catch (error) {
      this.logger.error("Échec d'envoi d'email", error.stack);
      throw new Error("Échec d'envoi mais RDV enregistré");
    }
  }

  async RDV_DPM(id: number, date_rdv: Date, pdfPath?: string): Promise<void> {
    const movement = await this.stockMovementRepository.findOne({
      where: { id },
      relations: ['fromCompany', 'toCompany'],
    });
    if (!movement) {
      throw new BadRequestException('Mouvement de stock non trouvé');
    }

    movement.date_rdv = date_rdv;
    movement.etat = 1;

    try {
      await this.stockMovementRepository.save(movement);
      this.logger.log(
        `Mouvement ${id} mis à jour avec etat=1 et date_rdv=${date_rdv}`,
      );
    } catch (error) {
      this.logger.error('Erreur lors de la sauvegarde du mouvement', error);
      throw error;
    }

    await this.sendRDVConfirmationEmail(movement, date_rdv, pdfPath);
  }

  private async getMovementProducts(
    bonNumber: string,
  ): Promise<Array<{ name: string; quantity: number; reference: string }>> {
    const movements = await this.stockMovementRepository.find({
      where: { N_Bon_Enlévement_DPM: bonNumber },
      relations: ['product'],
    });

    return movements.map((m) => ({
      name: m.product.name,
      quantity: m.quantity,
      reference: m.product.reference || 'N/A',
    }));
  }
  async RDV_DPMCompany(
    id: number,
    CompId: number,
  ): Promise<{ toCompanyStock: Stock; existingStock: StockMovement | null }> {
    const stockMovement = await this.stockMovementRepository.findOne({
      where: { id },
    });

    if (!stockMovement) {
      throw new NotFoundException(`StockMovement with ID ${id} not found`);
    }

    const toCompanyStock = await this.stockRepository.findOne({
      where: {
        company: stockMovement.toCompany,
        product: stockMovement.product,
      },
    });

    if (!toCompanyStock) {
      throw new NotFoundException(
        `Stock entry not found for company ${stockMovement.fromCompany.id} and product ${stockMovement.product.id}`,
      );
    }

    const existingStock = await this.stockMovementRepository.findOne({
      where: {
        fromCompany: { id: CompId },
        etat: 2,
      },
    });

    return { toCompanyStock, existingStock };
  }

  async processGroupRDV(bon: string, dateRdv: Date, pdfPath: string) {
    const movements = await this.stockMovementRepository.find({
      where: { N_Bon_Enlévement_DPM: bon },
      relations: ['fromCompany', 'toCompany'],
    });

    await Promise.all(
      movements.map(async (m) => {
        m.date_rdv = dateRdv;
        m.etat = 1;
        await this.stockMovementRepository.save(m);
      }),
    );

    await Promise.all(
      movements.map((m) => this.sendRDVConfirmationEmail(m, dateRdv, pdfPath)),
    );
  }

  async remove(id: number): Promise<void> {
    const stockMovement = await this.findOne(id);
    await this.stockMovementRepository.remove(stockMovement);
  }
  async calculateProductQuantities(
    packId: number,
    quantity: number,
  ): Promise<{ [productId: number]: number }> {
    const pack = await this.packRepository.findOne({
      where: { id: packId },
      relations: ['products'],
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${packId} not found`);
    }

    const productQuantities: { [productId: number]: number } = {};

    // Exemple de calcul basé sur le métrage de câble
    pack.products.forEach((product) => {
      switch (product.name) {
        case 'Câble':
          productQuantities[product.id] = quantity; // 500 mètres par touret
          break;
        case 'Serre Câble':
          productQuantities[product.id] = Math.ceil(quantity / 6.25);
          break;
        case 'Boots':
          productQuantities[product.id] = Math.ceil(quantity / 12.5);
          break;
        case 'Connecteurs':
          productQuantities[product.id] = Math.ceil(quantity / 6.25);
          break;
        default:
          productQuantities[product.id] = quantity;
          break;
      }
    });

    return productQuantities;
  }

  /**
   * Crée un mouvement de stock basé sur un pack et un métrage de câble.
   * @param createStockMovementByPackDto DTO contenant l'ID du pack, le métrage de câble, et les informations de mouvement
   * @returns Le mouvement de stock créé
   */
  async createByPack(
    createStockMovementByPackDto: CreateStockMovementByPackDto,
  ): Promise<StockMovement[]> {
    const {
      pack_id,
      quantity,
      from_company_id,
      to_company_id,
      movement_type,
      N_Bon_Enlévement_DPM,
    } = createStockMovementByPackDto;

    const pack = await this.packRepository.findOne({
      where: { id: pack_id },
      relations: ['products'],
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${pack_id} not found`);
    }

    const fromCompany = await this.companyRepository.findOne({
      where: { id: from_company_id },
    });
    if (!fromCompany) {
      throw new NotFoundException(
        `Company with ID ${from_company_id} not found`,
      );
    }

    const toCompany = await this.companyRepository.findOne({
      where: { id: to_company_id },
    });
    if (!toCompany) {
      throw new NotFoundException(`Company with ID ${to_company_id} not found`);
    }

    const productQuantities = await this.calculateProductQuantities(
      pack_id,
      quantity,
    );

    const stockMovements: StockMovement[] = [];

    for (const product of pack.products) {
      const productQuantity = productQuantities[product.id];

      if (productQuantity > 0) {
        const fromCompanyStock = await this.stockRepository.findOne({
          where: { company: fromCompany, product },
        });

        if (!fromCompanyStock || fromCompanyStock.quantity < productQuantity) {
          throw new BadRequestException(
            `Not enough stock for product ${product.id} (${product.name})`,
          );
        }

        const previousDPM = fromCompanyStock.DPM_quantity;
        fromCompanyStock.DPM_quantity = Math.max(
          fromCompanyStock.DPM_quantity - productQuantity,
          0,
        );

        console.log(
          `✔️ Produit ID: ${product.id} - ${product.name} | DPM_quantity: ${previousDPM} - ${productQuantity} = ${fromCompanyStock.DPM_quantity}`,
        );

        await this.stockRepository.save(fromCompanyStock);

        const stockMovement = this.stockMovementRepository.create({
          product,
          fromCompany,
          toCompany,
          quantity: productQuantity,
          N_Bon_Enlévement_DPM,
          etat: 0,
          movement_type,
        });

        stockMovements.push(
          await this.stockMovementRepository.save(stockMovement),
        );
      }
    }

    return stockMovements;
  }

  async getMovementsGroupedByBonOptimized(): Promise<
    { bon: string; movements: StockMovement[] }[]
  > {
    // D'abord récupérer la liste distincte des bons
    const distinctBons = await this.stockMovementRepository
      .createQueryBuilder('sm')
      .select('DISTINCT(sm.N_Bon_Enlévement_DPM)', 'bon')
      .where('sm.N_Bon_Enlévement_DPM IS NOT NULL')
      .getRawMany();

    // Pour chaque bon, récupérer les mouvements associés
    const results = await Promise.all(
      distinctBons.map(async ({ bon }) => {
        const movements = await this.stockMovementRepository.find({
          where: { N_Bon_Enlévement_DPM: bon },
          relations: ['product', 'fromCompany', 'toCompany'],
          order: { date_dpm: 'DESC' },
        });
        return { bon, movements };
      }),
    );

    const movementsWithoutBon = await this.stockMovementRepository.find({
      where: { N_Bon_Enlévement_DPM: IsNull() },
      relations: ['product', 'fromCompany', 'toCompany'],
      order: { date_dpm: 'DESC' },
    });

    if (movementsWithoutBon.length > 0) {
      results.push({ bon: 'SANS_BON', movements: movementsWithoutBon });
    }

    return results;
  }
  async getDPMByToCompanyGroupedByBon(
    to_company_id: number,
  ): Promise<{ bon: string; movements: StockMovement[] }[]> {
    const company = await this.companyRepository.findOne({
      where: { id: to_company_id },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${to_company_id} not found`);
    }

    const allMovements = await this.stockMovementRepository.find({
      where: {
        toCompany: { id: to_company_id },
        movement_type: 'DPM',
        etat: Not(0),
      },
      relations: ['product', 'fromCompany', 'toCompany'],
      order: { date_dpm: 'DESC' },
    });

    const groupedResults: { [bon: string]: StockMovement[] } = {};

    allMovements.forEach((movement) => {
      const bon = movement.N_Bon_Enlévement_DPM || 'SANS_BON';
      if (!groupedResults[bon]) {
        groupedResults[bon] = [];
      }
      groupedResults[bon].push(movement);
    });

    // Convertir en tableau d'objets trié par date
    return Object.keys(groupedResults)
      .map((bon) => ({
        bon,
        movements: groupedResults[bon],
        // Prendre la date du premier mouvement comme référence pour le tri
        latestDate: groupedResults[bon][0].date_dpm,
      }))
      .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime())
      .map(({ bon, movements }) => ({ bon, movements }));
  }
  async createTransferBetweenSTT(
    dto: CreateStockMovementDto | CreateBulkStockMovementDto,
  ): Promise<StockMovement | StockMovement[]> {
    if ('products' in dto) {
      return this.handleBulkTransfer(dto);
    }
    return this.handleSingleTransfer(dto);
  }

  // -------------------- Méthodes privées --------------------

  private async findCompany(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company)
      throw new NotFoundException(`Entreprise avec ID ${id} non trouvée`);
    return company;
  }

  private async findProduct(id: number): Promise<Products> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Produit avec ID ${id} non trouvé`);
    return product;
  }

  private async getAndValidateStock(
    companyId: number,
    productId: number,
    quantity: number,
    productName: string,
    companyName: string,
  ): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: {
        company: { id: companyId },
        product: { id: productId },
      },
    });

    if (!stock || stock.quantity < quantity) {
      throw new BadRequestException(
        `Stock insuffisant pour le produit ${productName} dans le STT ${companyName}`,
      );
    }

    return stock;
  }

  private async createMovementAndUpdateStock(
    product: Products,
    fromCompany: Company,
    toCompany: Company,
    quantity: number,
    N_Bon_Enlévement_DPM: string,
  ): Promise<StockMovement> {
    const fromStock = await this.getAndValidateStock(
      fromCompany.id,
      product.id,
      quantity,
      product.name,
      fromCompany.name,
    );

    const movement = this.stockMovementRepository.create({
      product,
      fromCompany,
      toCompany,
      quantity,
      movement_type: 'transfert',
      etat: 0,
      N_Bon_Enlévement_DPM,
    });

    fromStock.quantity -= quantity;
    await this.stockRepository.save(fromStock);

    return this.stockMovementRepository.save(movement);
  }

  private async handleBulkTransfer(
    dto: CreateBulkStockMovementDto,
  ): Promise<StockMovement[]> {
    const { from_company_id, to_company_id, N_Bon_Enlévement_DPM, products } =
      dto;

    const fromCompany = await this.findCompany(from_company_id);
    const toCompany = await this.findCompany(to_company_id);
    const results: StockMovement[] = [];

    for (const item of products) {
      const product = await this.findProduct(item.product_id);
      const savedMovement = await this.createMovementAndUpdateStock(
        product,
        fromCompany,
        toCompany,
        item.quantity,
        N_Bon_Enlévement_DPM,
      );
      results.push(savedMovement);
    }

    return results;
  }

  private async handleSingleTransfer(
    dto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    const {
      product_id,
      from_company_id,
      to_company_id,
      quantity,
      N_Bon_Enlévement_DPM,
    } = dto;

    const fromCompany = await this.findCompany(from_company_id);
    const toCompany = await this.findCompany(to_company_id);
    const product = await this.findProduct(product_id);
    if (!N_Bon_Enlévement_DPM) {
      throw new BadRequestException(
        "Le numéro de bon d'enlèvement est requis.",
      );
    }

    return this.createMovementAndUpdateStock(
      product,
      fromCompany,
      toCompany,
      quantity,
      N_Bon_Enlévement_DPM,
    );
  }

  async validateTransfer(transferId: number): Promise<StockMovement> {
    const transfer = await this.stockMovementRepository.findOne({
      where: {
        id: transferId,
        movement_type: 'transfert',
        etat: 0,
      },
      relations: ['product', 'toCompany'],
    });

    if (!transfer) {
      throw new NotFoundException('Transfert non trouvé ou déjà validé');
    }

    let toStock = await this.stockRepository.findOne({
      where: {
        company: transfer.toCompany,
        product: transfer.product,
      },
    });

    if (!toStock) {
      toStock = this.stockRepository.create({
        company: transfer.toCompany,
        product: transfer.product,
        quantity: 0,
      });
    }

    toStock.quantity += transfer.quantity;
    await this.stockRepository.save(toStock);

    transfer.etat = 2;
    return await this.stockMovementRepository.save(transfer);
  }
  async cancelTransfer(transferId: number): Promise<StockMovement> {
    const transfer = await this.stockMovementRepository.findOne({
      where: {
        id: transferId,
        movement_type: 'transfert',
        etat: 0,
      },
      relations: ['product', 'fromCompany'],
    });

    if (!transfer) {
      throw new NotFoundException('Transfert non trouvé ou déjà traité');
    }

    // Restituer le stock à l'entreprise source
    const fromStock = await this.stockRepository.findOne({
      where: {
        company: transfer.fromCompany,
        product: transfer.product,
      },
    });

    if (fromStock) {
      fromStock.quantity += transfer.quantity;
      await this.stockRepository.save(fromStock);
    }

    transfer.etat = 3;
    return await this.stockMovementRepository.save(transfer);
  }
  async getSTTTransfers(companyId?: number): Promise<StockMovement[]> {
    const query = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.fromCompany', 'fromCompany')
      .leftJoinAndSelect('movement.toCompany', 'toCompany')
      .where('movement.movement_type = :type', { type: 'transfert' })
      .andWhere('fromCompany.name LIKE :ooredoo', { ooredoo: '%Ooredoo%' })
      .andWhere('toCompany.name LIKE :ooredoo', { ooredoo: '%Ooredoo%' })
      .orderBy('movement.date_dpm', 'DESC');

    if (companyId) {
      query.andWhere(
        '(fromCompany.id = :companyId OR toCompany.id = :companyId)',
        {
          companyId,
        },
      );
    }

    return query.getMany();
  }

  async findById(id: string): Promise<StockMovement> {
    const movement = await this.stockMovementRepository.findOne({
      where: { id: Number(id) },
      relations: ['product'],
    });
    if (!movement) {
      throw new NotFoundException(
        `Mouvement de stock avec l'id ${id} introuvable.`,
      );
    }
    return movement;
  }

  async calculateStockMovementStatus(
    movement: StockMovement,
    preleveeQty: number,
  ): Promise<void> {
    if (preleveeQty === movement.quantity) {
      console.log(
        `✅ Quantité exacte prélevée pour ${movement.product.name} : ${preleveeQty}`,
      );
      movement.taux_deficit = 0;
      movement.taux_exces = 0;
    } else if (preleveeQty > movement.quantity) {
      const surplus = preleveeQty - movement.quantity;
      const tauxExces = (surplus / movement.quantity) * 100;
      movement.taux_exces = surplus;
      movement.taux_deficit = 0;
      console.log(
        `⚠️ Excès pour ${movement.product.name} : ${surplus} (${tauxExces.toFixed(2)}%)`,
      );
    } else {
      const deficit = movement.quantity - preleveeQty;
      movement.taux_exces = 0;
      const tauxDeficit = (deficit / movement.quantity) * 100;
      movement.taux_deficit = deficit;
      console.log(
        `⚠️ Déficit pour ${movement.product.name} : ${deficit} (${tauxDeficit.toFixed(2)}%)`,
      );
    }

    movement.stockPrelv_stt = true;
    await this.stockMovementRepository.save(movement);
  }

  async confirmPrelevementGroup(
    bon: string,
    datePrelev: Date,
    pdfPath?: string,
  ): Promise<void> {
    const movements = await this.stockMovementRepository.find({
      where: { N_Bon_Enlévement_DPM: bon, etat: 1 },
      relations: ['product', 'fromCompany', 'toCompany'],
    });

    if (movements.length === 0) {
      throw new NotFoundException(
        `Aucun mouvement en RDV trouvé pour le bon ${bon}`,
      );
    }

    await Promise.all(
      movements.map((movement) => this.validMovement(movement.id, datePrelev)),
    );

    if (movements.length > 0) {
      await this.sendPrelevementConfirmationEmail(
        movements[0],
        datePrelev,
        pdfPath,
      );
    }
  }

  private async sendPrelevementConfirmationEmail(
    movement: StockMovement,
    datePrelev: Date,
    pdfPath?: string,
  ): Promise<void> {
    try {
      // 1. Récupérer l'entreprise émettrice avec ses utilisateurs
      const fromCompanyWithUsers = await this.companyRepository.findOne({
        where: { id: movement.fromCompany.id },
        relations: ['users'],
      });

      if (!fromCompanyWithUsers?.users?.length) {
        this.logger.warn(
          `Aucun utilisateur trouvé pour ${movement.fromCompany.name}`,
        );
        return;
      }

      const recipientEmails = fromCompanyWithUsers.users
        .filter((user) => user.email?.includes('@'))
        .map((user) => user.email);

      if (!recipientEmails.length) {
        this.logger.warn(
          `Aucun email valide pour ${movement.fromCompany.name}`,
        );
        return;
      }

      const products = await this.getMovementProducts(
        movement.N_Bon_Enlévement_DPM,
      );

      const formattedDate = datePrelev.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const attachments: Array<{
        filename: string;
        path: string;
        contentType?: string;
      }> = [];

      if (pdfPath) {
        try {
          const fullPath = path.isAbsolute(pdfPath)
            ? pdfPath
            : path.join(process.cwd(), pdfPath);

          await fs.access(fullPath);
          attachments.push({
            filename: `Confirmation_Prelevement_${movement.N_Bon_Enlévement_DPM}.pdf`,
            path: fullPath,
            contentType: 'application/pdf',
          });
        } catch (fileError) {
          this.logger.error(`Erreur fichier PDF: ${pdfPath}`, fileError);
        }
      }

      // 6. Envoi de l'email
      await this.mailerService.sendMail({
        to: recipientEmails,
        subject: `[Ooredoo] Confirmation de prélèvement - Bon ${movement.N_Bon_Enlévement_DPM}`,
        template: 'prelevement-confirmation',
        context: {
          bonNumber: movement.N_Bon_Enlévement_DPM,
          date: formattedDate,
          fromCompany: movement.fromCompany.name,
          toCompany: movement.toCompany.name,
          products,
          hasAttachment: attachments.length > 0,
        },
        attachments, // Maintenant correctement typé
      });
      this.logger.log(
        `Email de confirmation envoyé pour le prélèvement ${movement.N_Bon_Enlévement_DPM}`,
      );
    } catch (error) {
      this.logger.error("Échec d'envoi d'email de confirmation", error);
      // Ne pas bloquer le processus si l'email échoue
    }
  }
}
