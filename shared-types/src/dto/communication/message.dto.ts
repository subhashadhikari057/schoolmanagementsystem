import { MessageStatus } from '../../enums/communication/message-status.enum';

export interface MessageDto {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: MessageStatus;
  created_at: Date;
}