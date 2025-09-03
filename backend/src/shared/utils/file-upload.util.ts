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
  NOTICE_ATTACHMENTS: 'uploads/notices/attachments',
  COMPLAINT_ATTACHMENTS: 'uploads/complaints/attachments',
  LEAVE_REQUEST_ATTACHMENTS: 'uploads/leave-requests/attachments',
  TEACHER_LEAVE_REQUEST_ATTACHMENTS:
    'uploads/teacher-leave-requests/attachments',
  ASSIGNMENT_ATTACHMENTS: 'uploads/assignments/attachments',
  SUBMISSION_ATTACHMENTS: 'uploads/submissions/attachments',
} as const;

// Ensure upload directories exist
Object.values(UPLOAD_PATHS).forEach(path => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
});

export const createMulterConfig = (
  destinationPath: string,
  fileType: 'image' | 'document' = 'image',
) => ({
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
      const prefix = fileType === 'image' ? 'profile' : 'attachment';
      const filename = `${prefix}-${uniqueSuffix}${fileExtension}`;
      cb(null, filename);
    },
  }),
  fileFilter: (
    req: Record<string, unknown>,
    file: Record<string, unknown>,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (fileType === 'image') {
      // Accept only image files
      if ((file.mimetype as string).match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Only image files (jpg, jpeg, png, gif, webp) are allowed!',
          ),
          false,
        );
      }
    } else {
      // Accept document, image, and CSV files
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/rtf',
        'text/csv',
        'application/csv',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      if (allowedMimeTypes.includes(file.mimetype as string)) {
        cb(null, true);
      } else {
        // Fallback: check file extension for CSV files
        const fileExtension = (file.originalname as string).toLowerCase();
        if (fileExtension.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only document, image, and CSV files (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, csv, jpg, jpeg, png, gif, webp) are allowed!',
            ),
            false,
          );
        }
      }
    }
  },
  limits: {
    fileSize: fileType === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024, // 5MB for images, 10MB for documents
  },
});

export const getFileUrl = (filename: string, folder: string): string => {
  const base =
    process.env.PUBLIC_BACKEND_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:8080';
  return `${base.replace(/\/$/, '')}/api/v1/files/${folder}/${filename}`;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const fs = await import('fs/promises');
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting file:', error);
  }
};
