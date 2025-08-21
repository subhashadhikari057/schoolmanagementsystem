import { NoticeStatus } from "../../enums/communication/notice-status.enum";
import { NoticePriority } from "../../enums/communication/notice-priority.enum";
import { NoticeRecipientType } from "../../enums/communication/notice-recipient-type.enum";
import { NoticeCategory } from "../../enums/communication/notice-category.enum";

export interface NoticeDto {
  id: string;
  title: string;
  content: string;
  priority: NoticePriority;
  recipientType: NoticeRecipientType;
  selectedClassId?: string; // Only when recipientType is CLASS
  category?: NoticeCategory;
  publishDate: Date;
  expiryDate: Date;
  status: NoticeStatus;
  sendEmailNotification: boolean;
  attachments?: NoticeAttachmentDto[];
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface NoticeAttachmentDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface CreateNoticeDto {
  title: string;
  content: string;
  priority: NoticePriority;
  recipientType: NoticeRecipientType;
  selectedClassId?: string;
  category?: NoticeCategory;
  publishDate: Date;
  expiryDate: Date;
  status?: NoticeStatus;
  sendEmailNotification: boolean;
}

export interface UpdateNoticeDto {
  title?: string;
  content?: string;
  priority?: NoticePriority;
  recipientType?: NoticeRecipientType;
  selectedClassId?: string;
  category?: NoticeCategory;
  publishDate?: Date;
  expiryDate?: Date;
  status?: NoticeStatus;
  sendEmailNotification?: boolean;
}

export interface NoticeListDto {
  id: string;
  title: string;
  priority: NoticePriority;
  recipientType: NoticeRecipientType;
  category?: NoticeCategory;
  publishDate: Date;
  expiryDate: Date;
  status: NoticeStatus;
  createdAt: Date;
  createdBy: string;
  creatorName: string;
  recipientCount: number;
}
