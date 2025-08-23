import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserRole } from '@sms/shared-types';

@Injectable()
export class ComplaintAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const complaintId = req.params.id || req.params.complaintId;
    if (!complaintId) return true;
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });
    if (!complaint) return true;
    if (
      [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.roles[0]) ||
      complaint.complainantId === user.id ||
      complaint.recipientId === user.id ||
      complaint.assignedToId === user.id
    ) {
      return true;
    }
    throw new ForbiddenException('You do not have access to this complaint');
  }
}
