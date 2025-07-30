import { ExamStatus } from '../../enums/exam/exam-status.enum';

export interface ExamDto {
  id: string;
  title: string;
  subject: string;
  status: ExamStatus;
  exam_date: Date;
}