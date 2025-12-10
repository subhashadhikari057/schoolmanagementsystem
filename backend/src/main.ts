import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { json, static as expressStatic } from 'express';
import * as cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import { Express } from 'express';
import { join } from 'path';
export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js default port
      'http://localhost:3001', // Alternative frontend port
      'http://127.0.0.1:3000', // Alternative localhost format
      'http://127.0.0.1:3001', // Alternative localhost format
      'https://sms.navneetverma.com', // Production domain
      'https://www.sms.navneetverma.com', // Production domain with www
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Version',
      'X-Trace-ID',
      'X-CSRF-Token',
      'x-csrf-token',
    ],
    credentials: true, // Allow cookies and credentials
  });

  // ✅ Enable JSON body parsing with increased limit for file uploads
  app.use(json({ limit: '10mb' }));

  // ✅ Enable cookie parsing middleware
  app.use(cookieParser());

  // ✅ Add test route here
  const expressApp: Express = app.getHttpAdapter().getInstance();
  // Serve /uploads statically so files can be accessed directly
  expressApp.use('/uploads', expressStatic(join(process.cwd(), 'uploads')));
  expressApp.get('/test', (req, res) => {
    // eslint-disable-next-line no-console
    console.log('✅ /test route hit');
    res.send({ message: 'Main test route working' });
  });

  // ✅ Enable Zod-based DTO validation globally
  app.useGlobalPipes(new ZodValidationPipe());

  // ✅ Connect Prisma DB and confirm
  const prisma = app.get(PrismaService);
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log('✅ DB connected');

  return app;
}

async function bootstrap(): Promise<void> {
  try {
    // Validate environment variables before starting the app
    const { validateEnvironment } =
      await import('./shared/config/env.validation');
    const envConfig = validateEnvironment();

    const app = await createApp();
    await app.listen(envConfig.PORT);
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://localhost:${envConfig.PORT}`);
    // eslint-disable-next-line no-console
    console.log('📚 School Management System Backend Started');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      '❌ Failed to start server:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

void bootstrap();
