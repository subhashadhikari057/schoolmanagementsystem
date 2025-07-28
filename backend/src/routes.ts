import { Routes } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';

export const routes: Routes = [
  {
    path: 'api/v1/auth', // 🔐 Auth-related routes: login, refresh, logout
    module: AuthModule,
  },
  {
    path: 'api/v1/admin', // 👤 Admin CRUD routes
    module: AdminModule,
  },
];
