import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { Public } from '../../shared/guards/jwt-auth.guard';

@Controller('api/v1/files')
export class FileController {
  @Get(':folder/:filename')
  @Public() // Make file serving public
  async getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Validate folder to prevent directory traversal
    const allowedFolders = [
      'teachers',
      'students',
      'staff',
      'documents',
      'notices',
      'complaints',
      'leave-requests',
      'teacher-leave-requests',
      'templates', // Add templates folder for logo uploads
      'assignments',
      'submissions',
    ];
    if (!allowedFolders.includes(folder)) {
      throw new NotFoundException('Invalid folder');
    }

    const filePath = join(
      process.cwd(),
      'uploads',
      folder,
      folder === 'notices' ||
        folder === 'complaints' ||
        folder === 'leave-requests' ||
        folder === 'teacher-leave-requests' ||
        folder === 'assignments' ||
        folder === 'submissions'
        ? 'attachments'
        : folder === 'templates'
          ? 'logos'
          : 'profiles',
      filename,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
