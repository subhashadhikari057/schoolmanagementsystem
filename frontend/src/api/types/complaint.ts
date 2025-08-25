// =============================================================================
// Complaint Types
// =============================================================================

export interface CreateComplaintRequest {
  title: string;
  description: string;
  type: ComplaintType;
  priority?: ComplaintPriority;
  recipientType: ComplaintRecipientType;
  recipientId?: string;
}

export interface UpdateComplaintRequest {
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

export interface ComplaintQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ComplaintType;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  recipientType?: ComplaintRecipientType;
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// Attachment Types
// =============================================================================

export interface ComplaintAttachment {
  id: string;
  complaintId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface UploadAttachmentResponse {
  message: string;
  attachments: ComplaintAttachment[];
}

export interface AttachmentValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// =============================================================================
// Response Types
// =============================================================================

export interface CreateComplaintResponseRequest {
  content: string;
  isInternal?: boolean;
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  responderId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt?: string;
  responder: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ComplaintResponseListResponse {
  responses: ComplaintResponse[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Complaint Entity Types
// =============================================================================

export interface Complaint {
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
  assignedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  // Related data
  complainant: {
    id: string;
    fullName: string;
    email: string;
  };
  recipient?: {
    id: string;
    fullName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  attachments: ComplaintAttachment[];
  responses: ComplaintResponse[];
  _count?: {
    attachments: number;
    responses: number;
  };
}

export interface ComplaintListResponse {
  complaints: Complaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Enums
// =============================================================================

export type ComplaintType =
  | 'ACADEMIC'
  | 'BEHAVIORAL'
  | 'FACILITY'
  | 'SAFETY'
  | 'BULLYING'
  | 'DISCIPLINARY'
  | 'FINANCIAL'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type ComplaintRecipientType =
  | 'CLASS_TEACHER'
  | 'ADMINISTRATION'
  | 'PARENT';

// =============================================================================
// UI Types
// =============================================================================

export interface ComplaintFilters {
  search?: string;
  type?: ComplaintType;
  priority?: ComplaintPriority;
  status?: ComplaintStatus;
  recipientType?: ComplaintRecipientType;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ComplaintSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

export interface ComplaintStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
  byPriority: Record<ComplaintPriority, number>;
  byType: Record<ComplaintType, number>;
  byRecipientType: Record<ComplaintRecipientType, number>;
}

export interface ComplaintTimeline {
  date: string;
  count: number;
  byStatus: Record<ComplaintStatus, number>;
}

// =============================================================================
// Form Types
// =============================================================================

export interface ComplaintFormData {
  title: string;
  description: string;
  type: ComplaintType;
  priority: ComplaintPriority;
  recipientType: ComplaintRecipientType;
  recipientId?: string;
  attachments?: File[];
}

export interface ComplaintFormErrors {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  recipientType?: string;
  recipientId?: string;
  attachments?: string[];
  general?: string;
}

// =============================================================================
// Action Types
// =============================================================================

export interface ComplaintAction {
  id: string;
  type: 'assign' | 'resolve' | 'close' | 'escalate' | 'reopen';
  data?: Record<string, any>;
  timestamp: string;
  performedBy: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AssignComplaintRequest {
  assignedToId: string;
}

export interface ResolveComplaintRequest {
  resolution: string;
}

// =============================================================================
// Notification Types
// =============================================================================

export interface ComplaintNotification {
  id: string;
  complaintId: string;
  type: 'created' | 'assigned' | 'responded' | 'resolved' | 'escalated';
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}
