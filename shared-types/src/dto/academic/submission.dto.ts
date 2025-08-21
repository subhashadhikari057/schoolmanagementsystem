export interface SubmissionDto {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt?: Date;
  isCompleted: boolean;
  feedback?: string;
  fileLinks?: string[];
  createdAt: Date;
  updatedAt?: Date;
}
