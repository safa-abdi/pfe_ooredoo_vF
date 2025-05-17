import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './polyfills';
import { json, urlencoded } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));  // Augmente la limite à 50MB
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: 'http://localhost:3001', // Autoriser uniquement cette origine
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes HTTP autorisées
    credentials: true, // Autoriser les cookies et les en-têtes d'authentification
  });

  await app.listen(3000);
}
bootstrap();