import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  async generateExcel(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Demandes');

    worksheet.columns = [
      { header: 'Cas crm', key: 'crm_case', width: 25 },
      { header: 'Client', key: 'CLIENT', width: 25 },
      { header: 'MSISDN', key: 'MSISDN', width: 15 },
      { header: 'Contact', key: 'CONTACT_CLIENT', width: 20 },
      { header: 'Gouvernorat', key: 'Gouvernorat', width: 20 },
      { header: 'STT', key: 'NAME_STT', width: 20 },
      {
        header: 'Date affectation STT',
        key: 'DATE_AFFECTATION_STT',
        width: 25,
      },
      { header: 'STATUT', key: 'STATUT', width: 25 },
      { header: 'Réponse travaux STT', key: 'REP_TRAVAUX_STT', width: 25 },
    ];

    data.forEach((item) => worksheet.addRow(item));

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  }
}
