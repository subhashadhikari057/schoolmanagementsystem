export interface AssignmentDto {
  id: string;
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate?: Date;
  additionalMetadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}