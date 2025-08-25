import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChargeService } from '../services/charge.service';
import {
  applyChargeSchema,
  createChargeDefinitionSchema,
} from '@sms/shared-types';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  Permissions,
  RolesGuard,
} from '../../../shared/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/fees/charges')
export class ChargeController {
  constructor(private readonly service: ChargeService) {}

  @Post()
  @Permissions('FINANCE_MANAGE_CHARGES')
  async create(@Body() body: unknown) {
    const dto = createChargeDefinitionSchema.parse(body);
    return await this.service.createDefinition(dto);
  }

  @Post('apply')
  @Permissions('FINANCE_MANAGE_CHARGES')
  async apply(@Body() body: unknown) {
    const dto = applyChargeSchema.parse(body);
    return await this.service.apply(dto);
  }

  @Get('')
  @Permissions('FINANCE_MANAGE_CHARGES')
  async listRoot() {
    return this.service.list();
  }

  @Get('list')
  @Permissions('FINANCE_MANAGE_CHARGES')
  async list() {
    return this.service.list();
  }

  @Get(':id')
  @Permissions('FINANCE_MANAGE_CHARGES')
  async get(@Param('id') id: string) {
    return await this.service.getDefinition(id);
  }
}
