import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { PersonSearchService } from './person-search.service';
import { IDCardGenerationService } from './id-card-generation.service';
import { PersonSearchDto, PersonSearchResponse } from './dto/person-search.dto';
import {
  GenerateIndividualIDCardDto,
  GenerateBulkIDCardsDto,
  IDCardGenerationResult,
  BulkIDCardGenerationResult,
} from './dto/generate-id-card.dto';

@Controller('api/id-card-generation')
export class IDCardGenerationController {
  constructor(
    private personSearchService: PersonSearchService,
    private idCardGenerationService: IDCardGenerationService,
  ) {}

  /**
   * Search for persons (students, teachers, staff) for ID card generation
   */
  @Get('search-persons')
  async searchPersons(
    @Query(new ValidationPipe({ transform: true })) dto: PersonSearchDto,
  ): Promise<PersonSearchResponse> {
    return this.personSearchService.searchPersons(dto);
  }

  /**
   * Generate an individual ID card
   */
  @Post('generate-individual')
  async generateIndividualIDCard(
    @Body(ValidationPipe) dto: GenerateIndividualIDCardDto,
  ): Promise<IDCardGenerationResult> {
    return this.idCardGenerationService.generateIndividualIDCard(dto);
  }

  /**
   * Generate ID cards in bulk
   */
  @Post('generate-bulk')
  async generateBulkIDCards(
    @Body(ValidationPipe) dto: GenerateBulkIDCardsDto,
  ): Promise<BulkIDCardGenerationResult> {
    return this.idCardGenerationService.generateBulkIDCards(dto);
  }

  /**
   * Get available classes for bulk student ID generation
   */
  @Get('available-classes')
  async getAvailableClasses() {
    // This could be moved to a separate service, but keeping it simple for now
    return this.personSearchService['prisma'].class.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        currentEnrollment: true,
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });
  }

  /**
   * Get statistics for bulk generation
   */
  @Get('bulk-stats')
  async getBulkGenerationStats() {
    const [studentCount, teacherCount, staffCount, classCount] =
      await Promise.all([
        this.personSearchService['prisma'].student.count({
          where: {
            deletedAt: null,
            academicStatus: {
              not: {
                in: ['expelled', 'withdrawn'],
              },
            },
          },
        }),
        this.personSearchService['prisma'].teacher.count({
          where: {
            deletedAt: null,
            employmentStatus: {
              not: 'terminated',
            },
          },
        }),
        this.personSearchService['prisma'].staff.count({
          where: {
            deletedAt: null,
            employmentStatus: {
              not: 'terminated',
            },
          },
        }),
        this.personSearchService['prisma'].class.count({
          where: {
            deletedAt: null,
          },
        }),
      ]);

    return {
      students: studentCount,
      teachers: teacherCount,
      staff: staffCount,
      classes: classCount,
    };
  }

  /**
   * Serve generated PDF files
   */
  @Get('pdf/:filename')
  async servePDF(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'id-cards', filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  }
}
