// pv.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivationService } from './activation.service';
import { Response } from 'express';

@Controller('activations/:crmCase/pdf')
export class PdfController {
  constructor(private readonly activationService: ActivationService) {}

  @Post('/:metrageCable')
  @UseInterceptors(FileInterceptor('pdf'))
  async uploadPdf(
    @Param('crmCase') crmCase: string,
    @Param('metrageCable') metrageCable: number,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      imeiOdu: string;
      snIdu: string;
    },
  ) {
    await this.activationService.savePdf(
      crmCase,
      file.buffer,
      metrageCable,
      body.imeiOdu,
      body.snIdu,
      file.mimetype,
    );
    return { message: 'PDF et informations IMEI sauvegardés avec succès' };
  }

  @Get()
  async downloadPdf(@Param('crmCase') crmCase: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.activationService.getPdf(crmCase);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapport_${crmCase}.pdf"`,
    );
    res.send(buffer);
  }
}
