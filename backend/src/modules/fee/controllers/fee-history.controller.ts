import { Controller, Get, Query } from '@nestjs/common';
import { FeeStructureService } from '../services/fee-structure.service';

@Controller('api/v1/fees/structures')
export class FeeHistoryController {
  constructor(private readonly service: FeeStructureService) {}

  @Get('list')
  list(
    @Query('classId') classId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listStructures({
      classId,
      academicYear,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}
