import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FeeStructureController } from './controllers/fee-structure.controller';
import { FeeHistoryController } from './controllers/fee-history.controller';
import { ScholarshipManagementController } from './controllers/scholarship-management.controller';
import { ChargeController } from './controllers/charge.controller';
import { ChargeManagementController } from './controllers/charge-management.controller';
import { FeeComputationController } from './controllers/fee-computation.controller';
import { StudentFeeApiController } from './controllers/student-fee-api.controller';
import { ParentFeeController } from './controllers/parent-fee.controller';
import { FeeStructureService } from './services/fee-structure.service';
import { ScholarshipManagementService } from './services/scholarship-management.service';
import { ChargeService } from './services/charge.service';
import { ChargeManagementService } from './services/charge-management.service';
import { FeeComputationService } from './services/fee-computation.service';
import { StudentFeeApiService } from './services/student-fee-api.service';
import { StudentLookupController } from './controllers/student-lookup.controller';

@Module({
  controllers: [
    FeeStructureController,
    StudentLookupController,
    FeeHistoryController,
    ScholarshipManagementController,
    ChargeController,
    ChargeManagementController,
    FeeComputationController,
    StudentFeeApiController,
    ParentFeeController,
  ],
  providers: [
    PrismaService,
    FeeStructureService,
    ScholarshipManagementService,
    ChargeService,
    ChargeManagementService,
    FeeComputationService,
    StudentFeeApiService,
  ],
  exports: [
    FeeStructureService,
    ScholarshipManagementService,
    ChargeService,
    ChargeManagementService,
    FeeComputationService,
    StudentFeeApiService,
  ],
})
export class FeeModule {}
