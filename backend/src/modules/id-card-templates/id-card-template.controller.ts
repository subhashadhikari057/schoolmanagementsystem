import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IDCardTemplateService } from './id-card-template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilterDto,
} from './dto/template.dto';

@ApiTags('ID Card Templates')
@Controller('api/id-card-templates')
export class IDCardTemplateController {
  constructor(private readonly templateService: IDCardTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ID card template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Template name already exists' })
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
    @Request() req: { user?: { id: string } },
  ) {
    // Get user ID from auth context
    const userId = req.user?.id || null; // Allow null for system operations
    return this.templateService.createTemplate(createTemplateDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ID card templates with filtering' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(@Query() filters: TemplateFilterDto) {
    return this.templateService.getTemplates(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getTemplateStats() {
    return this.templateService.getTemplateStats();
  }

  @Get('fields')
  @ApiOperation({ summary: 'Get available database fields' })
  @ApiResponse({ status: 200, description: 'Fields retrieved successfully' })
  async getAvailableFields() {
    return this.templateService.getAvailableFields();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateById(@Param('id') id: string) {
    return this.templateService.getTemplateById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 409, description: 'Template name already exists' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Request() req: { user?: { id: string } },
  ) {
    const userId = req.user?.id || null;
    return this.templateService.updateTemplate(id, updateTemplateDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({
    status: 400,
    description: 'Template is being used and cannot be deleted',
  })
  async deleteTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.deleteTemplate(id, userId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate template' })
  @ApiResponse({ status: 201, description: 'Template duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async duplicateTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.duplicateTemplate(id, userId);
  }

  @Put(':id/set-default')
  @ApiOperation({ summary: 'Set template as default for its type' })
  @ApiResponse({
    status: 200,
    description: 'Default template updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async setDefaultTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.setDefaultTemplate(id, userId);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish template (set status to ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Template published successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async publishTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.publishTemplate(id, userId);
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish template (set status to INACTIVE)' })
  @ApiResponse({
    status: 200,
    description: 'Template unpublished successfully',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async unpublishTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.unpublishTemplate(id, userId);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate template for ID generation' })
  @ApiResponse({ status: 200, description: 'Template activated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Template not ready for activation',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async activateTemplate(@Param('id') id: string) {
    // TODO: Get user ID from auth context
    const userId = 'system'; // Temporary
    return this.templateService.activateTemplate(id, userId);
  }

  @Get(':id/validate-for-generation')
  @ApiOperation({ summary: 'Check if template is ready for ID generation' })
  @ApiResponse({ status: 200, description: 'Validation result returned' })
  async validateForGeneration(@Param('id') id: string) {
    const isValid =
      await this.templateService.validateTemplateForGeneration(id);
    return { valid: isValid };
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(
            process.cwd(),
            'uploads',
            'templates',
            'logos',
          );
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload logo for template' })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const logoUrl = `/api/v1/files/templates/${file.filename}`;
    return {
      success: true,
      logoUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
