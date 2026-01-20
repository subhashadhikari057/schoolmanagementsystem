import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { StudentFeeApiService } from '../services/student-fee-api.service';

@Controller('api/v1/fees/parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentFeeController {
  constructor(private readonly studentFeeApiService: StudentFeeApiService) {}

  /**
   * Get current month fees for a child (parent-authenticated)
   */
  @Get('children/:studentId/current')
  async getCurrentChildFees(
    @Param('studentId') studentId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.studentFeeApiService.getCurrentStudentFeesForParent(
      user.id,
      studentId,
    );
  }
}
