import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { NoticeService } from '../application/notice.service';
import {
  CreateNoticeSchema,
  UpdateNoticeSchema,
  UpdateNoticeDtoType,
  NoticeQuerySchema,
  NoticeQueryDtoType,
} from '../dto/notice.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';

@Controller('api/v1/notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      createMulterConfig(UPLOAD_PATHS.NOTICE_ATTACHMENTS, 'document'),
    ),
  )
  async create(
    @Body() body: Record<string, unknown>, // We'll parse and validate this manually due to multipart form data
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: Record<string, unknown>,
    @Req() req: Request,
  ) {
    try {
      // Parse the JSON data from form-data
      const noticeData =
        typeof body.notice === 'string' ? JSON.parse(body.notice) : body.notice;

      // Validate using Zod
      const validatedData = CreateNoticeSchema.parse(noticeData);

      const result = await this.noticeService.create(
        validatedData,
        user.id as string,
        files,
        req.ip,
        req.headers['user-agent'] as string,
      );

      return {
        message: 'Notice created successfully',
        notice: result,
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async findAll(
    @Query(new ZodValidationPipe(NoticeQuerySchema)) query: NoticeQueryDtoType,
  ) {
    return this.noticeService.findAll(query);
  }

  @Get('my-notices')
  async getMyNotices(
    @Query(new ZodValidationPipe(NoticeQuerySchema)) query: NoticeQueryDtoType,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.noticeService.getNoticesForUser(user.id as string, query);
  }

  @Get('classes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async getAvailableClasses() {
    return this.noticeService.getAvailableClasses();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // No role checks here - simply retrieve the notice by ID
    return await this.noticeService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateNoticeSchema)) body: UpdateNoticeDtoType,
    @CurrentUser() user: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const result = await this.noticeService.update(
      id,
      body,
      user.id as string,
      req.ip,
      req.headers['user-agent'] as string,
    );

    return {
      message: 'Notice updated successfully',
      notice: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.noticeService.remove(
      id,
      user.id as string,
      req.ip,
      req.headers['user-agent'] as string,
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const result = await this.noticeService.markAsRead(id, user.id as string);

    return {
      message: 'Notice marked as read',
      readAt: result.readAt,
    };
  }
}
