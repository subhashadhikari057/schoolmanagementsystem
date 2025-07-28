// backend/src/routes.ts
import { INestApplication } from '@nestjs/common';

export function registerRoutes(app: INestApplication): void {
  // No manual routes needed for now.
  // Routes are handled by NestJS decorators
  console.log('Routes registered for app:', app.constructor.name);
}
