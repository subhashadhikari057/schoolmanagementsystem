import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ParentService } from '../application/parent.service';
import {
  CreateParentDto,
  CreateParentDtoType,
  UpdateParentByAdminDto,
  UpdateParentByAdminDtoType,
  UpdateParentSelfDto,
  UpdateParentSelfDtoType,
  LinkChildDto,
  LinkChildDtoType,
  UnlinkChildDto,
  UnlinkChildDtoType,
  SetPrimaryParentDto,
  SetPrimaryParentDtoType,
  GetAllParentsDto,
  GetAllParentsDtoType,
} from '../dto/parent.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  createMulterConfig,
  UPLOAD_PATHS,
} from '../../../shared/utils/file-upload.util';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@Controller('api/v1/parents')
@UseGuards(JwtAuthGuard)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', createMulterConfig(UPLOAD_PATHS.PARENT_PROFILES)),
  )
  async create(
    @Body() body: any, // We'll parse and validate this manually due to multipart form data
    @UploadedFile() profilePicture: Express.Multer.File,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    try {
      // Helper function to safely parse JSON or return object if already parsed
      const safeJsonParse = (value: any) => {
        if (!value) return undefined;
        if (typeof value === 'object') return value; // Already parsed
        if (typeof value === 'string') return JSON.parse(value); // Parse string
        return value;
      };

      // Parse the nested JSON data from form-data or use directly if JSON
      const parsedData = {
        user: body.user ? safeJsonParse(body.user) : {},
        profile: body.profile ? safeJsonParse(body.profile) : undefined,
        children: body.children ? safeJsonParse(body.children) : undefined,
      };

      // Validate using Zod
      const validatedData = CreateParentDto.parse(parsedData);

      const result = await this.parentService.create(
        validatedData,
        user.id,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        profilePicture,
      );

      return {
        message: 'Parent created successfully',
        parent: result.parent,
        ...(result.temporaryPassword && {
          temporaryPassword: result.temporaryPassword,
        }),
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
    @Query(new ZodValidationPipe(GetAllParentsDto)) query: GetAllParentsDtoType,
  ) {
    return this.parentService.findAll(query);
  }

  @Get('search-for-linking')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async searchParentsForLinking(
    @Query('search') searchTerm: string,
    @Query('limit') limit?: string,
  ) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new BadRequestException(
        'Search term must be at least 2 characters',
      );
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;
    if (limitNum > 50) {
      throw new BadRequestException('Limit cannot exceed 50');
    }

    return this.parentService.searchForLinking(searchTerm.trim(), limitNum);
  }

  @Get('available-students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAvailableStudents() {
    return this.parentService.getAvailableStudents();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.PARENT,
  )
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    // If user is a parent, they can only access their own data
    if (user.role === UserRole.PARENT) {
      const parent = await this.parentService.findById(id);
      if (parent.userId !== user.id) {
        throw new BadRequestException('You can only access your own data');
      }
    }

    return this.parentService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateByAdmin(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateParentByAdminDto))
    body: UpdateParentByAdminDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.parentService.updateByAdmin(
      id,
      body,
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Patch(':id/self')
  @Roles(UserRole.PARENT)
  async updateSelf(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateParentSelfDto))
    body: UpdateParentSelfDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    // Verify the parent can only update their own data
    const parent = await this.parentService.findById(id);
    if (parent.userId !== user.id) {
      throw new BadRequestException('You can only update your own data');
    }

    return this.parentService.updateByAdmin(
      id,
      body as UpdateParentByAdminDtoType,
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Post(':id/children')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async linkChild(
    @Param('id') parentId: string,
    @Body(new ZodValidationPipe(LinkChildDto)) body: LinkChildDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.parentService.linkChild(
      parentId,
      body,
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Delete(':id/children/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async unlinkChild(
    @Param('id') parentId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.parentService.unlinkChild(
      parentId,
      { studentId },
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Post('set-primary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async setPrimaryParent(
    @Body(new ZodValidationPipe(SetPrimaryParentDto))
    body: SetPrimaryParentDtoType,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.parentService.setPrimaryParent(
      body,
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    return this.parentService.softDelete(
      id,
      user.id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
  }
}
