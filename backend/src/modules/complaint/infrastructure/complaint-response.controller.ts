import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ComplaintResponseService } from '../application/complaint-response.service';
import { CreateComplaintResponseDto } from '@sms/shared-types';

@Controller('api/v1/complaints/:complaintId/responses')
export class ComplaintResponseController {
  constructor(
    private readonly complaintResponseService: ComplaintResponseService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('complaintId') complaintId: string,
    @Body() body: CreateComplaintResponseDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const response = await this.complaintResponseService.create(
      complaintId,
      body,
      user.id,
      userRole,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Response added', response };
  }

  @Get()
  async findAll(@Param('complaintId') complaintId: string, @Req() req: any) {
    const user = req.user;
    const userRole = Array.isArray(user.roles)
      ? user.roles[0]
      : user.role || user.roles;
    const responses = await this.complaintResponseService.findAll(
      complaintId,
      user.id,
      userRole,
    );
    return { message: 'Responses retrieved', responses };
  }
}
