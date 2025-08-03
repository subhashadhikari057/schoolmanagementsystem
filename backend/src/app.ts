import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { json } from 'express';

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.use(json()); // Enable JSON body parser


  const prisma = app.get(PrismaService);
  await prisma.$connect();
  console.log('✅ DB connected');

  return app;
}
