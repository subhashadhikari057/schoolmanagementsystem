import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('api/v1/files')
export class FileController {
  @Get(':folder/:filename')
  async getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Validate folder to prevent directory traversal
    const allowedFolders = ['teachers', 'students', 'staff', 'documents'];
    if (!allowedFolders.includes(folder)) {
      throw new NotFoundException('Invalid folder');
    }

    const filePath = join(
      process.cwd(),
      'uploads',
      folder,
      'profiles',
      filename,
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
