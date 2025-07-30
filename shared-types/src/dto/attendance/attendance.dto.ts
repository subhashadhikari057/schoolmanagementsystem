import { AttendanceStatus } from '../../enums/attendance/attendance-status.enum';

export interface AttendanceDto {
  id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
}