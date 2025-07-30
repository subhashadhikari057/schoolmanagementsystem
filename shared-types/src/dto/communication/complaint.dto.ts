import { ComplaintStatus } from '../../enums/communication/complaint-status.enum';

export interface ComplaintDto {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  created_at: Date;
}