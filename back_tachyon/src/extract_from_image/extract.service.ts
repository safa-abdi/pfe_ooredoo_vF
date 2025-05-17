// extract.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
@Injectable()
export class ExtractService {
  async extractText(file: Express.Multer.File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, { filename: file.originalname });

      const response = await axios.post(
        'http://127.0.0.1:8000/extract-text/',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      throw new Error('Could not extract text from image');
    }
  }
  async extractTextIDU(file: Express.Multer.File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, { filename: file.originalname });

      const response = await axios.post(
        'http://127.0.0.1:8000/process-ooredoo-image/',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      throw new Error('Could not extract text from image');
    }
  }
  async extractSpeedTest(file: Express.Multer.File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, { filename: file.originalname });

      const response = await axios.post(
        'http://127.0.0.1:8000/extract-speedtest/',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      throw new Error('Could not extract text from image');
    }
  }
}
