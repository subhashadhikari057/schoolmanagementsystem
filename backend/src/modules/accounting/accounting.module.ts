import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { StudentService } from '../student/application/student.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController],
  providers: [AccountingService, StudentService],
})
export class AccountingModule {}
