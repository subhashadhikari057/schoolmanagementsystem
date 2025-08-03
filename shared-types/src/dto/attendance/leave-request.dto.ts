import { LeaveStatus } from '../../enums/attendance/leave-status.enum';
import { LeaveType } from '../../enums/attendance/leave-type.enum';

export interface LeaveRequestDto {
  id: string;
  user_id: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: Date;
  end_date: Date;
}