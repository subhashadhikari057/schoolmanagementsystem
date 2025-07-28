import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,  // ✅ Directly imported
    AdminModule, // ✅ Directly imported
  ],
})
export class AppModule {}
