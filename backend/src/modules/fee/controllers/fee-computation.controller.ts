import { Body, Controller, Post } from '@nestjs/common';
import { FeeComputationService } from '../services/fee-computation.service';
import { computeMonthlyFeesSchema } from '@sms/shared-types';

@Controller('api/v1/fees/compute')
export class FeeComputationController {
  constructor(private readonly service: FeeComputationService) {}

  @Post('month')
  async computeMonth(@Body() body: unknown) {
    const dto = computeMonthlyFeesSchema.parse(body);
    return this.service.computeForMonth(dto);
  }
}
