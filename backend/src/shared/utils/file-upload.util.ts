import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

export const UPLOAD_PATHS = {
  TEACHER_PROFILES: 'uploads/teachers/profiles',
  STUDENT_PROFILES: 'uploads/students/profiles',
  STAFF_PROFILES: 'uploads/staff/profiles',
  PARENT_PROFILES: 'uploads/parents/profiles',
  DOCUMENTS: 'uploads/documents',
} as const;

// Ensure upload directories exist
Object.values(UPLOAD_PATHS).forEach(path => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
});

export const createMulterConfig = (destinationPath: string) => ({
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (!existsSync(destinationPath)) {
        mkdirSync(destinationPath, { recursive: true });
      }
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtension = extname(file.originalname);
      const filename = `profile-${uniqueSuffix}${fileExtension}`;
      cb(null, filename);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    // Accept only image files
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Only image files (jpg, jpeg, png, gif, webp) are allowed!',
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const getFileUrl = (filename: string, folder: string): string => {
  return `/api/v1/files/${folder}/${filename}`;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const fs = await import('fs/promises');
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
