/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  HttpStatus,
  Query,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { CreateStockMovementByPackDto } from './dto/create-stock-movement-pack.dto';
import { diskStorage } from 'multer';
import path, { extname, join } from 'path';
import * as fs from 'fs';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateBulkStockMovementDto } from './dto/create-bulk-stock-movement.dto';

@Controller('stock-movements')
export class StockMovementsController {
  private readonly logger = new Logger(StockMovementsService.name);

  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(@Body() createStockMovementDto: CreateStockMovementDto) {
    return this.stockMovementsService.create(createStockMovementDto);
  }

  @Get('grouped-by-bon-optimized')
  async getGroupedByBonOptimized() {
    return this.stockMovementsService.getMovementsGroupedByBonOptimized();
  }

  @Get()
  findAll() {
    return this.stockMovementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockMovementsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateStockMovementDto: UpdateStockMovementDto,
  ) {
    return this.stockMovementsService.update(+id, updateStockMovementDto);
  }
  @Patch(':id/cancel')
  async cancel(@Param('id') id: number) {
    return this.stockMovementsService.cancelMovement(id);
  }

  @Patch(':id/valid')
  async valid(@Param('id') id: number) {
    return this.stockMovementsService.validMovement(id);
  }

  // @Patch(':id/rdvDPM')
  // async RDV_DPM(@Param('id') id: number) {
  //   return this.stockMovementsService.RDV_DPM(id);
  // }

  @Patch('validate-group')
  async validateGroup(
    @Body() body: { date_prelevement: string; movements_ids: number[] },
  ) {
    // Validation des données
    if (!body.date_prelevement || !body.movements_ids?.length) {
      throw new BadRequestException('Date et IDs des mouvements requis');
    }

    const datePrelevement = new Date(body.date_prelevement);
    if (isNaN(datePrelevement.getTime())) {
      throw new BadRequestException('Format de date invalide');
    }

    // Valider chaque mouvement
    const results = await Promise.all(
      body.movements_ids.map((id) =>
        this.stockMovementsService.validMovement(id, datePrelevement),
      ),
    );

    return {
      success: true,
      message: `${results.length} mouvements validés`,
      date_prelevement: datePrelevement,
    };
  }
  @Get('/getDpmRdv_Comp/:id/:CompId')
  find_DPM_RDVCompany(
    @Param('id') id: string,
    @Param('CompId') CompId: number,
  ) {
    return this.stockMovementsService.RDV_DPMCompany(+id, CompId);
  }
  @Put('updateEtat/:id')
  updateEtat(@Param('id') id: string) {
    return this.stockMovementsService.updateEtat(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockMovementsService.remove(+id);
  }

  @Post('create')
  createPack(
    @Body() createStockMovementByPackDto: CreateStockMovementByPackDto,
  ) {
    return this.stockMovementsService.createByPack(
      createStockMovementByPackDto,
    );
  }
  @Patch(':id/rdvDPM')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: diskStorage({
        destination: './uploads/rdv-pdfs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(
            new BadRequestException('Seuls les fichiers PDF sont autorisés'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async setRDV(
    @Param('id') id: number,
    @Body() body: { date_rdv: string },
    @UploadedFile() pdf?: Express.Multer.File,
  ) {
    // Validation de la date
    if (!body.date_rdv) {
      throw new BadRequestException('La date de RDV est obligatoire');
    }

    const dateRdv = new Date(body.date_rdv);
    if (isNaN(dateRdv.getTime())) {
      throw new BadRequestException('Format de date invalide');
    }

    // Vérification que la date est dans le futur
    if (dateRdv < new Date()) {
      throw new BadRequestException('La date de RDV doit être dans le futur');
    }

    try {
      // Construction du chemin absolu si PDF fourni
      const fullPdfPath = pdf ? path.join(process.cwd(), pdf.path) : undefined;

      await this.stockMovementsService.RDV_DPM(id, dateRdv, fullPdfPath);

      return {
        success: true,
        message: 'RDV programmé avec succès',
        pdfUploaded: !!pdf,
        pdfPath: fullPdfPath,
      };
    } catch (error) {
      // Nettoyage du fichier en cas d'erreur
      if (pdf?.path && fs.existsSync(pdf.path)) {
        fs.unlinkSync(pdf.path);
      }
      throw error;
    }
  }

  @Patch('rdv-dpm-group/:bon')
  @UseInterceptors(FileInterceptor('pdf'))
  async setGroupRDV(
    @Param('bon') bon: string,
    @Body() body: { date_rdv: string },
    @UploadedFile() pdfFile: Express.Multer.File,
  ) {
    try {
      // 1. Create temp directory if it doesn't exist
      const tempDir = join(process.cwd(), 'temp-uploads');
      await fs.promises.mkdir(tempDir, { recursive: true });

      // 2. Save PDF temporarily
      const tempPdfPath = join(tempDir, `${bon}-${Date.now()}.pdf`);
      await fs.promises.writeFile(tempPdfPath, pdfFile.buffer);

      // 3. Process RDV and send emails
      await this.stockMovementsService.processGroupRDV(
        bon,
        new Date(body.date_rdv),
        tempPdfPath, // Pass the temporary file path
      );

      // 4. Clean up the temp file
      await fs.promises.unlink(tempPdfPath);

      return { success: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error processing RDV',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Get('company/:to_company_id/dpm')
  async getDPMByCompany(@Param('to_company_id') to_company_id: number) {
    return this.stockMovementsService.getDPMByToCompanyGroupedByBon(
      to_company_id,
    );
  }
  @Post('transfert/stt')
  async createTransfer(
    @Body()
    createStockMovementDto: CreateStockMovementDto | CreateBulkStockMovementDto,
  ): Promise<StockMovement | StockMovement[]> {
    return this.stockMovementsService.createTransferBetweenSTT(
      createStockMovementDto,
    );
  }
  @Post('valider_qte_prisStock/:id')
  async valider_StockPris(
    @Param('id') id: string,
    @Body('preleveeQty') preleveeQty: number,
  ) {
    const movement = await this.stockMovementsService.findById(id);
    if (!movement) {
      throw new NotFoundException(`Mouvement de stock ${id} introuvable`);
    }

    await this.stockMovementsService.calculateStockMovementStatus(
      movement,
      preleveeQty,
    );
    return { message: 'Statut mis à jour avec succès.' };
  }

  @Put('transfert/:id/validate')
  async validateTransfer(@Param('id') id: string) {
    return this.stockMovementsService.validateTransfer(parseInt(id));
  }

  @Put('transfert/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return this.stockMovementsService.cancelTransfer(parseInt(id));
  }

  @Get('transfert/stt')
  async getSTTTransfers(@Query('companyId') companyId?: string) {
    return this.stockMovementsService.getSTTTransfers(
      companyId ? parseInt(companyId) : undefined,
    );
  }

  @Get('transfert/stt/all')
  async getAllSTTTransfers() {
    return this.stockMovementsService.getSTTTransfers();
  }

  @Get('transfert/stt/company/:companyId')
  async getSTTTransfersByCompany(@Param('companyId') companyId: string) {
    return this.stockMovementsService.getSTTTransfers(parseInt(companyId));
  }
  @Patch('confirm-prelevement/:bon')
  @UseInterceptors(
    FileInterceptor('pdf', {
      storage: diskStorage({
        destination: './uploads/prelevements-temp',
        filename: (req, file, cb) => {
          const bonNumber = req.params.bon;
          cb(null, `prelevement-${bonNumber}-${Date.now()}.pdf`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(
            new BadRequestException('Seuls les fichiers PDF sont autorisés'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async confirmPrelevement(
    @Param('bon') bon: string,
    @Body() body: { date_prelev: string },
    @UploadedFile() pdf?: Express.Multer.File,
  ) {
    try {
      if (!body.date_prelev) {
        throw new BadRequestException('La date de prélèvement est obligatoire');
      }

      const datePrelev = new Date(body.date_prelev);
      if (isNaN(datePrelev.getTime())) {
        throw new BadRequestException('Format de date invalide');
      }

      const pdfPath = pdf?.path;
      await this.stockMovementsService.confirmPrelevementGroup(
        bon,
        datePrelev,
        pdfPath,
      );

      if (pdfPath) {
        setTimeout(() => {
          fs.unlink(pdfPath, (err) => {
            if (err)
              this.logger.error(`Erreur suppression fichier: ${pdfPath}`, err);
          });
        }, 30000);
      }

      return { success: true };
    } catch (error) {
      if (pdf?.path) {
        fs.unlinkSync(pdf.path);
      }
      throw error;
    }
  }
}
