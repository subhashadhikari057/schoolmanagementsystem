import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { json } from 'express';
import * as cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import { Express } from 'express';
export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js dev server
      'http://localhost:3001', // Backend server
      'https://localhost:3000', // HTTPS variants
      'https://localhost:3001',
    ],
    credentials: true, // Allow cookies and auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Version',
      'X-Trace-ID',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // ✅ Enable JSON body parsing
  app.use(json());

  // ✅ Enable cookie parsing middleware
  app.use(cookieParser());

  // ✅ Add test route here
  const expressApp: Express = app.getHttpAdapter().getInstance() as Express;
  expressApp.get('/test', (req, res) => {
    console.log('✅ /test route hit');
    res.send({ message: 'Main test route working' });
  });

  // ✅ Enable Zod-based DTO validation globally
  app.useGlobalPipes(new ZodValidationPipe());

  // ✅ Connect Prisma DB and confirm
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
