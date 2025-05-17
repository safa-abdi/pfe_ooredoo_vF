/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// extract.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ExtractService } from './extract.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('extract')
export class ExtractController {
  constructor(private readonly imageService: ExtractService) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('file'))
  async extractText(@UploadedFile() file: Express.Multer.File) {
    const result = await this.imageService.extractText(file);
    return result;
  }
  @Post('extract-IDU')
  @UseInterceptors(FileInterceptor('file'))
  async extractTextIDU(@UploadedFile() file: Express.Multer.File) {
    const result = await this.imageService.extractTextIDU(file);
    return result;
  }
  @Post('extract-speed-test')
  @UseInterceptors(FileInterceptor('file'))
  async extractSpeedTest(@UploadedFile() file: Express.Multer.File) {
    const result = await this.imageService.extractSpeedTest(file);
    return result;
  }
}
