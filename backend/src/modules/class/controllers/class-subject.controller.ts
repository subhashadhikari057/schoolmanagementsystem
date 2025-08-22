import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../shared/guards/jwt-auth.guard';
import { ClassSubjectService } from '../services/class-subject.service';
import {
  CreateClassSubjectDto,
  UpdateClassSubjectDto,
  GetClassSubjectsDto,
  BulkAssignClassSubjectsDto,
} from '@sms/shared-types';

@ApiTags('Class Subjects')
@Controller('api/v1/class-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSubjectController {
  constructor(private readonly classSubjectService: ClassSubjectService) {}

  @Get()
  @RoleAccess.Authenticated()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all subjects assigned to a class' })
  async getClassSubjects(@Query() query: Record<string, unknown>) {
    // Handle both direct query params and nested params object
    let params: GetClassSubjectsDto;

    if (query.params) {
      // If params are nested (coming from axios serialization)
      try {
        params =
          typeof query.params === 'string'
            ? JSON.parse(query.params)
            : (query.params as GetClassSubjectsDto);
      } catch {
        params = query as GetClassSubjectsDto;
      }
    } else {
      // Direct query parameters
      params = query as GetClassSubjectsDto;
    }

    return this.classSubjectService.getClassSubjects(params);
  }

  @Get('available/:classId')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available subjects for a class (not yet assigned)',
  })
  async getAvailableSubjectsForClass(@Param('classId') classId: string) {
    return this.classSubjectService.getAvailableSubjectsForClass(classId);
  }

  @Post()
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a subject to a class' })
  async assignSubjectToClass(
    @Body() createDto: CreateClassSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classSubjectService.assignSubjectToClass(createDto, user.id);
  }

  @Post('bulk')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk assign multiple subjects to a class' })
  async bulkAssignSubjects(
    @Body() bulkDto: BulkAssignClassSubjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classSubjectService.bulkAssignSubjects(bulkDto, user.id);
  }

  @Put(':id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a class subject assignment' })
  async updateClassSubject(
    @Param('id') id: string,
    @Body() updateDto: UpdateClassSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.classSubjectService.updateClassSubject(id, updateDto, user.id);
  }

  @Delete(':id')
  @RoleAccess.Academic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a subject from a class' })
  async removeSubjectFromClass(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.classSubjectService.removeSubjectFromClass(id, user.id);
    return { message: 'Subject removed from class successfully' };
  }
}
