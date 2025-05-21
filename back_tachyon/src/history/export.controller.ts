import { Controller, Post, Body, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('demandes')
  async exportExcel(@Body() body: { data: any[] }, @Res() res: Response) {
    const buffer = await this.exportService.generateExcel(body.data);

    res.set({
      'Content-Disposition': 'attachment; filename="demandes.xlsx"',
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    res.send(buffer);
  }
}
