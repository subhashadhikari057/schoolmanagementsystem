import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import {
  RolesGuard,
  Roles,
  RoleAccess,
} from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { UserRole } from '@sms/shared-types';
import { ZodValidationPipe } from 'nestjs-zod';
import { GradingService } from '../services/grading.service';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  CreateExamResultDto,
  UpdateExamResultDto,
  BulkGradeStudentsDto,
  GetClassGradingDto,
  GetSubjectGradingDto,
  PublishResultsDto,
  GradingPermissionDto,
  BulkGridGradingDto,
  GetGridGradingDataDto,
  GetStudentGradeHistoryDto,
  CreateGradingScaleDtoType,
  UpdateGradingScaleDtoType,
  CreateExamResultDtoType,
  UpdateExamResultDtoType,
  BulkGradeStudentsDtoType,
  BulkGridGradingDtoType,
  GetClassGradingDtoType,
  GetSubjectGradingDtoType,
  PublishResultsDtoType,
  GradingPermissionDtoType,
  GetGridGradingDataDtoType,
  GetStudentGradeHistoryDtoType,
} from '../dto/grading.dto';

@Controller('api/v1/grading')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  // Grading Scale Management
  @Post('scales')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UsePipes(new ZodValidationPipe(CreateGradingScaleDto))
  async createGradingScale(
    @Body() createGradingScaleDto: CreateGradingScaleDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.createGradingScale(
      createGradingScaleDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('scales')
  @RoleAccess.Academic()
  async getGradingScales(@Query('academicYear') academicYear?: string) {
    return this.gradingService.getGradingScales(academicYear);
  }

  @Get('scales/default/:academicYear')
  @RoleAccess.Academic()
  async getDefaultGradingScale(@Param('academicYear') academicYear: string) {
    return this.gradingService.getDefaultGradingScale(academicYear);
  }

  // Class-wise Grading
  @Get('class-data')
  @RoleAccess.Academic()
  async getClassGradingData(
    @Query('classId') classId: string,
    @Query('calendarEntryId') calendarEntryId: string,
    @CurrentUser() user: any,
    @Query('examScheduleId') examScheduleId?: string,
  ) {
    try {
      // Validate the query manually
      const validatedQuery = GetClassGradingDto.parse({
        classId,
        calendarEntryId,
        examScheduleId,
      });
      return this.gradingService.getClassGradingData(
        validatedQuery,
        user.id,
        user.role,
      );
    } catch (error) {
      console.error('Class grading data validation error:', error);
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }
  }

  // Subject-wise Grading
  @Get('subject-data')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(GetSubjectGradingDto))
  async getSubjectGradingData(
    @Query() query: GetSubjectGradingDtoType,
    @CurrentUser() user: any,
  ) {
    return this.gradingService.getSubjectGradingData(query, user.id, user.role);
  }

  // Individual Result Management
  @Post('results')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(CreateExamResultDto))
  async createExamResult(
    @Body() createExamResultDto: CreateExamResultDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.createExamResult(
      createExamResultDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Put('results/:id')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(UpdateExamResultDto))
  async updateExamResult(
    @Param('id', ParseUUIDPipe) resultId: string,
    @Body() updateExamResultDto: UpdateExamResultDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.updateExamResult(
      resultId,
      updateExamResultDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('results/bulk')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(BulkGradeStudentsDto))
  async bulkGradeStudents(
    @Body() bulkGradeStudentsDto: BulkGradeStudentsDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.bulkGradeStudents(
      bulkGradeStudentsDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('grid-bulk')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(BulkGridGradingDto))
  async bulkGridGrading(
    @Body() bulkGridGradingDto: BulkGridGradingDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.bulkGridGrading(
      bulkGridGradingDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('results/publish')
  @RoleAccess.AdminLevel()
  @UsePipes(new ZodValidationPipe(PublishResultsDto))
  @HttpCode(HttpStatus.OK)
  async publishResults(
    @Body() publishResultsDto: PublishResultsDtoType,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.gradingService.publishResults(
      publishResultsDto,
      user.id,
      user.role,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // Permission Management
  @Post('permissions')
  @RoleAccess.AdminLevel()
  @UsePipes(new ZodValidationPipe(GradingPermissionDto))
  async createGradingPermission(
    @Body() gradingPermissionDto: GradingPermissionDtoType,
    @CurrentUser() user: any,
  ) {
    return this.gradingService.createGradingPermission(
      gradingPermissionDto,
      user.id,
      user.role,
    );
  }

  @Get('permissions/teacher/:teacherId')
  @RoleAccess.Academic()
  async getTeacherGradingPermissions(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
  ) {
    return this.gradingService.getTeacherGradingPermissions(teacherId);
  }

  // Get exam results for a specific exam slot
  @Get('results/exam-slot/:examSlotId')
  @RoleAccess.Academic()
  async getExamSlotResults(
    @Param('examSlotId', ParseUUIDPipe) examSlotId: string,
    @CurrentUser() user: any,
  ) {
    return this.gradingService.getExamSlotResults(
      examSlotId,
      user.id,
      user.role,
    );
  }

  // Get student's exam results
  @Get('results/student/:studentId')
  @RoleAccess.Academic()
  async getStudentResults(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('academicYear') academicYear?: string,
    @Query('examSlotId') examSlotId?: string,
  ) {
    return this.gradingService.getStudentResults(
      studentId,
      academicYear,
      examSlotId,
    );
  }

  // Grid Grading Endpoints
  @Get('grid-data')
  @RoleAccess.Academic()
  async getGridGradingData(
    @Query('classId') classId: string,
    @Query('examScheduleId') examScheduleId: string,
    @Query('calendarEntryId') calendarEntryId: string,
    @CurrentUser() user: any,
  ) {
    try {
      // Validate the query manually
      const validatedQuery = GetGridGradingDataDto.parse({
        classId,
        examScheduleId,
        calendarEntryId,
      });
      return this.gradingService.getGridGradingData(
        validatedQuery,
        user.id,
        user.role,
      );
    } catch (error) {
      console.error('Grid grading data validation error:', error);
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }
  }

  // Grade History Endpoints
  @Get('history/student/:studentId')
  @RoleAccess.Academic()
  @UsePipes(new ZodValidationPipe(GetStudentGradeHistoryDto))
  async getStudentGradeHistory(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: Omit<GetStudentGradeHistoryDtoType, 'studentId'>,
    @CurrentUser() user: any,
  ) {
    const fullQuery = { ...query, studentId };
    return this.gradingService.getStudentGradeHistory(
      fullQuery,
      user.id,
      user.role,
    );
  }

  // Report Generation Endpoints
  @Get('reports/student/:studentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async generateStudentReport(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('calendarEntryId', ParseUUIDPipe) calendarEntryId: string,
    @Query('academicYear') academicYear: string,
    @CurrentUser() user: any,
    @Res() res: any,
  ) {
    const pdfBuffer = await this.gradingService.generateStudentReport(
      studentId,
      calendarEntryId,
      academicYear,
      user.id,
      user.role,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="student-report.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('reports/class/:classId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER)
  async generateClassReports(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('calendarEntryId', ParseUUIDPipe) calendarEntryId: string,
    @Query('academicYear') academicYear: string,
    @CurrentUser() user: any,
    @Res() res: any,
  ) {
    const zipBuffer = await this.gradingService.generateClassReports(
      classId,
      calendarEntryId,
      academicYear,
      user.id,
      user.role,
    );

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="class-reports.zip"',
      'Content-Length': zipBuffer.length,
    });

    res.send(zipBuffer);
  }
}
