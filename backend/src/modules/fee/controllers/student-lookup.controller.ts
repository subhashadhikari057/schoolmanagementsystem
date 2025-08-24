import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  Permissions,
  RolesGuard,
} from '../../../shared/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/fees/students')
export class StudentLookupController {
  constructor(private prisma: PrismaService) {}

  @Get('search')
  @Permissions(
    'FINANCE_MANAGE_FEES',
    'FINANCE_MANAGE_SCHOLARSHIPS',
    'FINANCE_MANAGE_CHARGES',
  )
  async search(@Query('q') q: string = '', @Query('limit') limit = '10') {
    const take = Math.min(parseInt(limit, 10) || 10, 50);
    if (!q.trim()) return [];
    return this.prisma.student.findMany({
      where: {
        OR: [
          { rollNumber: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { user: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        rollNumber: true,
        email: true,
        user: { select: { fullName: true } },
      },
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
