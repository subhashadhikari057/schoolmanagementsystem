import { NoticeStatus } from "../../enums/communication/notice-status.enum";

export interface NoticeDto {
  id: string;
  title: string;
  content: string;
  status: NoticeStatus;
  created_at: Date;
}
