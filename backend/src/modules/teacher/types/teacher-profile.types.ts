import { Prisma } from '@prisma/client';

// Extend the TeacherProfile type to explicitly include additionalData
export interface TeacherProfileWithAdditionalData {
  id: string;
  teacherId: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  contactInfo: Prisma.JsonValue;
  socialLinks: Prisma.JsonValue;
  additionalData: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

// Define the structure of additionalData for better type safety
export interface TeacherAdditionalData {
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  bankDetails?: {
    bankName?: string;
    bankAccountNumber?: string;
    bankBranch?: string;
    panNumber?: string;
    citizenshipNumber?: string;
  };
  [key: string]: any; // Allow for other properties
}
