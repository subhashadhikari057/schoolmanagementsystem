/**
 * =============================================================================
 * Assignment API Types
 * =============================================================================
 * TypeScript type definitions for assignment-related API operations
 * =============================================================================
 */

// ============================================================================
// Assignment Request Types
// ============================================================================

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  dueDate?: string; // ISO date string
  additionalMetadata?: Record<string, unknown>;
  attachments?: File[]; // Frontend file uploads
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  dueDate?: string; // ISO date string
  additionalMetadata?: Record<string, unknown>;
}

export interface AssignmentFilters {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
}

// ============================================================================
// Assignment Response Types
// ============================================================================

export interface AssignmentClassInfo {
  id: string;
  grade: string;
  section: string;
  students?: Array<{
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
    };
  }>;
}

export interface AssignmentSubjectInfo {
  name: string;
  code: string;
}

export interface AssignmentTeacherInfo {
  user: {
    fullName: string;
    email?: string;
  };
}

export interface AssignmentResponse {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  additionalMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  // Relations
  class: AssignmentClassInfo;
  subject: AssignmentSubjectInfo;
  teacher: AssignmentTeacherInfo;

  // Submission count
  _count?: {
    submissions: number;
  };

  // Submissions (when detailed)
  submissions?: SubmissionResponse[];

  // Attachments
  attachments?: AssignmentAttachment[];
}

export interface CreateAssignmentResponse {
  message: string;
  assignment: AssignmentResponse;
}

export interface UpdateAssignmentResponse {
  message: string;
  assignment: AssignmentResponse;
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface AssignmentAttachment {
  id: string;
  assignmentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface SubmissionAttachment {
  id: string;
  submissionId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// ============================================================================
// Submission Request Types
// ============================================================================

export interface CreateSubmissionRequest {
  assignmentId: string;
  studentId: string;
  submittedAt?: string; // ISO date string
  isCompleted?: boolean;
  feedback?: string;
  fileLinks?: string[];
  attachments?: File[]; // Frontend file uploads
}

export interface UpdateSubmissionRequest {
  isCompleted?: boolean;
  feedback?: string;
  fileLinks?: string[];
}

// ============================================================================
// Submission Response Types
// ============================================================================

export interface SubmissionStudentInfo {
  id: string;
  rollNumber: string;
  user: {
    fullName: string;
    email?: string;
  };
}

export interface SubmissionAssignmentInfo {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  subject: {
    name: string;
  };
  class: {
    grade: string;
    section: string;
  };
}

export interface SubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt?: string;
  isCompleted: boolean;
  feedback?: string;
  fileLinks: string[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  // Relations
  student: SubmissionStudentInfo;
  assignment?: SubmissionAssignmentInfo;

  // Attachments
  attachments?: SubmissionAttachment[];
}

export interface CreateSubmissionResponse {
  message: string;
  submission: SubmissionResponse;
}

export interface UpdateSubmissionResponse {
  message: string;
  submission: SubmissionResponse;
}

// ============================================================================
// Form Data Types (for frontend components)
// ============================================================================

export interface AssignmentFormData {
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  dueDate: string;
  additionalMetadata?: Record<string, unknown>;
}

export interface SubmissionFormData {
  assignmentId: string;
  studentId: string;
  submittedAt?: string;
  isCompleted: boolean;
  feedback: string;
  fileLinks: string[];
  files?: FileList;
  attachments?: File[]; // Frontend file uploads
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface AssignmentApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// Statistics and Overview Types
// ============================================================================

export interface AssignmentStats {
  totalAssignments: number;
  completedAssignments: number;
  upcomingAssignments: number;
  overdueAssignments: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  gradedSubmissions: number;
}

export interface TeacherAssignmentOverview {
  assignments: AssignmentResponse[];
  stats: AssignmentStats;
}

export interface StudentAssignmentOverview {
  assignments: Array<{
    assignment: AssignmentResponse;
    submission?: SubmissionResponse;
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'overdue';
  }>;
  stats: {
    totalAssignments: number;
    submittedAssignments: number;
    pendingAssignments: number;
    overdueAssignments: number;
  };
}
