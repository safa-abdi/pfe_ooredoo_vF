/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "Twilio configuration manquante dans les variables d'environnement.",
      );
    }

    this.twilioClient = new Twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  // Méthode pour valider le numéro Twilio
  async validateFromNumber(): Promise<void> {
    try {
      const validationRequest =
        await this.twilioClient.validationRequests.create({
          friendlyName: 'Mon numéro perso',
          phoneNumber: this.fromNumber,
        });

      console.log('✅ Validation demandée. SID:', validationRequest.accountSid);
      console.log(
        '📞 Twilio va appeler le numéro pour le valider (code vocal).',
      );
    } catch (error) {
      console.error('❌ Erreur de validation du numéro:', error);
      throw new Error('Échec de la validation du numéro: ' + error.message);
    }
  }

  // Méthode pour envoyer un SMS (affiche seulement le code OTP en console)
  async sendSms(to: string, message: string): Promise<void> {
    console.log('Numéro de téléphone reçu:', to);

    // Génération du code OTP (par exemple, un code à 6 chiffres)
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Affichage du message dans la console au lieu d'envoi via Twilio
    console.log(`📲 Code OTP pour ${to}: ${otpCode}`);
    console.log(
      `📩 Message simulé: ${message.replace('{{CODE}}', otpCode.toString())}`,
    );
  }
}
