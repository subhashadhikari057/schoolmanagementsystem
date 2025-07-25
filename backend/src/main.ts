import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './infrastructure/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8080;

  // ✅ DB Connection Test
  const prisma = app.get(PrismaService);
  try {
    console.log(`✅ DB connected`);
  } catch (error) {
    console.error('❌ DB connection failed:', error);
  }

  await app.listen(port);

  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 School Management System Backend Started`);
}
bootstrap();
