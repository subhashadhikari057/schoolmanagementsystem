import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { json } from 'express';
import * as cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import { Express } from 'express';
export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable JSON body parsing
  app.use(json());

  // ✅ Enable cookie parsing middleware
  app.use(cookieParser());

  // ✅ Add test route here
  const expressApp: Express = app.getHttpAdapter().getInstance();
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

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  console.log(`🚀 Server ready at http://localhost:${port}`);
  console.log('📚 School Management System Backend Started');
}

bootstrap();
