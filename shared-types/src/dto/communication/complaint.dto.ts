import { ComplaintStatus } from "../../enums/communication/complaint-status.enum";
import { ComplaintType } from "../../enums/communication/complaint-type.enum";
import { ComplaintPriority } from "../../enums/communication/complaint-priority.enum";
import { ComplaintRecipientType } from "../../enums/communication/complaint-recipient-type.enum";

export interface ComplaintDto {
  id: string;
  title: string;
  description: string;
  type: ComplaintType;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  recipientType: ComplaintRecipientType;
  recipientId?: string;
  complainantId: string;
  complainantType: string;
  assignedToId?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateComplaintDto {
  title: string;
  description: string;
  type: ComplaintType;
  priority?: ComplaintPriority;
  recipientType: ComplaintRecipientType;
  recipientId?: string;
}

export interface UpdateComplaintDto {
  title?: string;
  description?: string;
  type?: ComplaintType;
  priority?: ComplaintPriority;
  recipientType?: ComplaintRecipientType;
  recipientId?: string;
  assignedToId?: string;
  resolution?: string;
  status?: ComplaintStatus;
}

export interface ComplaintResponseDto {
  id: string;
  complaintId: string;
  responderId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateComplaintResponseDto {
  content: string;
  isInternal?: boolean;
}

export interface ComplaintAttachmentDto {
  id: string;
  complaintId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface UploadAttachmentResponseDto {
  message: string;
  attachments: ComplaintAttachmentDto[];
}
