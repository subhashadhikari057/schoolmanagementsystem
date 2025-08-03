import { SubmissionStatus } from '../../enums/academic/submission-status.enum';

export interface SubmissionDto {
  id: string;
  assignment_id: string;
  student_id: string;
  status: SubmissionStatus;
  submitted_at?: Date;
}