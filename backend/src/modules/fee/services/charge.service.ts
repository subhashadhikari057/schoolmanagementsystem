import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CreateChargeDefinitionDto, ApplyChargeDto } from '@sms/shared-types';

@Injectable()
export class ChargeService {
  constructor(private prisma: PrismaService) {}

  async createDefinition(dto: CreateChargeDefinitionDto) {
    return this.prisma.chargeDefinition.create({ data: dto });
  }

  async apply(dto: ApplyChargeDto) {
    const { chargeId, studentIds, appliedMonth, reason } = dto;
    const def = await this.prisma.chargeDefinition.findUnique({
      where: { id: chargeId },
    });
    if (!def) return { count: 0 };
    const applied = new Date(appliedMonth + '-01');
    const results = await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.chargeAssignment.create({
          data: {
            chargeId,
            studentId,
            appliedMonth: applied,
            amount: def.value,
            reason,
          },
        }),
      ),
    );
    return { count: results.length };
  }

  async getDefinition(id: string) {
    return this.prisma.chargeDefinition.findUnique({ where: { id } });
  }

  async list() {
    return this.prisma.chargeDefinition.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
