import { AssignmentStatus } from '../../enums/academic/assignment-status.enum';

export interface AssignmentDto {
  id: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  due_date: Date;
}