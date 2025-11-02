import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { Public } from 'src/shared/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  GetAllStudentsDto,
  GetAllStudentsDtoType,
} from '../student/dto/student.dto';
import { StudentService } from '../student/application/student.service';
import { FeeStructureService } from '../fee/services/fee-structure.service';

@Controller('api/v1/accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly studentService: StudentService,
    private readonly feeService: FeeStructureService,
  ) {}

  @Public()
  @Get('class')
  async findAllClasses() {
    return this.accountingService.findAllClasses();
  }

  // @Public()
  // @Get('fee-structure/:classId')
  // async feeStructureForClass(
  //   @Param('classId') classId: string,
  //   @Query() query: { for: string },
  // ) {
  //   const forDate = new Date(query.for ?? new Date().toISOString());
  //   const result = await this.accountingService.feeStructureForClass(
  //     forDate,
  //     classId,
  //   );
  //   console.log(result);
  //   return result;
  // }

  @Public()
  @Get('fee-structure/:classId')
  async feeStructureForClass(
    @Param('classId') classId: string,
    @Query() query: { academicYear: string },
  ) {
    const { academicYear } = query;
    return this.feeService.listStructures({
      classId,
      academicYear,
    });
  }

  @Public()
  @Get('student')
  async findAllStudents(
    @Query(new ZodValidationPipe(GetAllStudentsDto))
    query: GetAllStudentsDtoType,
  ) {
    return this.studentService.findAll(query);
  }

  @Public()
  @Get('student/:id')
  async findOneStudent(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Public()
  @Get('scholarships/:studentId')
  async getScholarshipsForStudent(
    @Param('studentId') studentId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    return this.accountingService.getScholarshipsForStudent(
      studentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Public()
  @Get('charges-and-fines/:studentId')
  async getChargesAndFinesForStudent(
    @Param('studentId') studentId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    return this.accountingService.getChargesAndFinesForStudent(
      studentId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
