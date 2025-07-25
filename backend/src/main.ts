import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8080;
  
  await app.listen(port);
  
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`📚 School Management System Backend Started`);
}
bootstrap();
