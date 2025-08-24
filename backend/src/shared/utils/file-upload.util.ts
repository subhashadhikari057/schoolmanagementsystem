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
      // Accept document and image files
      if (
        (file.mimetype as string).match(
          /\/(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|jpg|jpeg|png|gif|webp)$/,
        )
      ) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            'Only document and image files (pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, jpg, jpeg, png, gif, webp) are allowed!',
          ),
          false,
        );
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
