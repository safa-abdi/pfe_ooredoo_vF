/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Votre adresse e-mail Gmail
        pass: process.env.EMAIL_PASSWORD, // Votre mot de passe d'application
      },
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Code de validation',
      text: `Votre code de validation est : ${code}`,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await this.transporter.sendMail(mailOptions);
  }
}
