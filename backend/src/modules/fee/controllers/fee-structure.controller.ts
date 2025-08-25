import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ZodError } from 'zod';

interface ListQuery {
  classId?: string;
  academicYear?: string;
  page?: string;
  pageSize?: string;
}
import { FeeStructureService } from '../services/fee-structure.service';
import {
  createFeeStructureSchema,
  reviseFeeStructureSchema,
} from '@sms/shared-types';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  Permissions,
  RolesGuard,
} from '../../../shared/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/fees/structures')
export class FeeStructureController {
  constructor(private readonly feeService: FeeStructureService) {}

  @Post()
  @Permissions('FINANCE_MANAGE_FEES')
  async create(@Body() body: unknown) {
    try {
      // Debug log raw body for multi-class issues
      // eslint-disable-next-line no-console
      console.log('[FeeStructureController] Incoming create payload', body);
      const dto = createFeeStructureSchema.parse(body);
      const result = await this.feeService.createStructure(dto);
      return result; // can be single structure or array when multiple classes selected
    } catch (err) {
      if (err instanceof ZodError) {
        // eslint-disable-next-line no-console
        console.error('[FeeStructureController] Validation errors', err.issues);
        throw new BadRequestException({
          message: 'Request validation failed',
          validationErrors: err.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      throw err;
    }
  }

  @Post(':id/revise')
  @Permissions('FINANCE_MANAGE_FEES')
  async revise(@Param('id') id: string, @Body() body: unknown) {
    const dto = reviseFeeStructureSchema.parse({
      feeStructureId: id,
      ...(body as object),
    });
    return await this.feeService.reviseStructure(dto);
  }

  @Get(':id/history')
  @Permissions('FINANCE_MANAGE_FEES')
  async history(@Param('id') id: string) {
    return await this.feeService.getStructureHistory(id);
  }

  @Get('')
  @Permissions('FINANCE_MANAGE_FEES')
  async rootList(@Query() q: ListQuery) {
    // fallback for clients hitting base
    const { classId, academicYear, page, pageSize } = q;
    return this.feeService.listStructures({
      classId,
      academicYear,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('list')
  @Permissions('FINANCE_MANAGE_FEES')
  async list(@Query() q: ListQuery) {
    const { classId, academicYear, page, pageSize } = q;
    return this.feeService.listStructures({
      classId,
      academicYear,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Patch(':id/status/:status')
  @Permissions('FINANCE_MANAGE_FEES')
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT',
  ) {
    return this.feeService.updateStatus(id, status);
  }
}
