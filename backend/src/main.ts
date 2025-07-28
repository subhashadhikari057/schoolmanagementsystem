// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { json } from 'express';
import * as cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // Enable JSON body parsing
  app.use(json());

  // ✅ Enable cookie parsing middleware
  app.use(cookieParser());

  // ✅ Set global API prefix
  app.setGlobalPrefix('api');

  // ✅ Enable global DTO validation with Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // ✅ Connect Prisma DB
  const prisma = app.get(PrismaService);
  await prisma.$connect();
  console.log('✅ DB connected');

  return app;
}

async function bootstrap(): Promise<void> {
  try {
    // Validate environment variables before starting the app
    const { validateEnvironment } = await import(
      './shared/config/env.validation'
    );
    const envConfig = validateEnvironment();

    const app = await createApp();
    await app.listen(envConfig.PORT);
    console.log(`🚀 Server ready at http://localhost:${envConfig.PORT}`);
    console.log('📚 School Management System Backend Started');
  } catch (error) {
    console.error(
      '❌ Failed to start server:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

void bootstrap();
