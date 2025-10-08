import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IDCardService, GenerateIDCardDto } from './id-card.service';
import { QRVerificationService } from './qr-verification.service';

@ApiTags('ID Cards')
@Controller('api/id-cards')
export class IDCardController {
  constructor(
    private readonly idCardService: IDCardService,
    private readonly qrVerificationService: QRVerificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ID cards with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'ID cards retrieved successfully' })
  async getAllIDCards(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.idCardService.getAllIDCards({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      type,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate an individual ID card from template' })
  @ApiResponse({ status: 201, description: 'ID card generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Template or user not found' })
  async generateIDCard(@Body() dto: GenerateIDCardDto) {
    return this.idCardService.generateIDCard(dto);
  }

  @Post('generate-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate ID cards in bulk' })
  @ApiResponse({ status: 201, description: 'ID cards generated successfully' })
  async generateBulkIDCards(
    @Body() dto: { templateId: string; userIds: string[]; batchName?: string },
  ) {
    return this.idCardService.generateBulkIDCards(
      dto.templateId,
      dto.userIds,
      dto.batchName,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all ID cards for a user' })
  @ApiResponse({ status: 200, description: 'ID cards retrieved successfully' })
  async getUserIDCards(@Param('userId') userId: string) {
    return this.idCardService.getUserIDCards(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific ID card with rendered data' })
  @ApiResponse({ status: 200, description: 'ID card retrieved successfully' })
  @ApiResponse({ status: 404, description: 'ID card not found' })
  async getIDCard(@Param('id') id: string) {
    return this.idCardService.getIDCard(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an ID card' })
  @ApiResponse({ status: 204, description: 'ID card deleted successfully' })
  @ApiResponse({ status: 404, description: 'ID card not found' })
  async deleteIDCard(@Param('id') id: string) {
    return this.idCardService.deleteIDCard(id);
  }

  @Post('verify-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify QR code and get user information' })
  @ApiResponse({ status: 200, description: 'QR code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid QR code' })
  async verifyQRCode(@Body() dto: { qrData: string }) {
    return this.qrVerificationService.verifyQRCode(dto.qrData);
  }
}
