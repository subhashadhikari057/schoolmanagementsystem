/**
 * =============================================================================
 * Asset Management Types
 * =============================================================================
 * Type definitions for asset management system
 * =============================================================================
 */

export type AssetStatus =
  | 'IN_SERVICE'
  | 'DAMAGED'
  | 'UNDER_REPAIR'
  | 'REPLACED'
  | 'DISPOSED';
export type LocationType =
  | 'ROOM'
  | 'STORAGE'
  | 'VENDOR'
  | 'IN_TRANSIT'
  | 'UNKNOWN';
export type AssetCategory =
  | 'electronics'
  | 'furniture'
  | 'books'
  | 'sports'
  | 'laboratory'
  | 'other';

export interface Room {
  id: string;
  name?: string;
  roomNo: string;
  type?: string;
  building?: string;
  floor?: string | number;
  capacity?: number;
  assets?: any[];
  totalAssets?: number;
  totalDamaged?: number;
  totalValue?: number;
  createdAt?: string;
  updatedAt?: string;
  assignedClasses?: Array<{
    id: string;
    name?: string;
    grade: number;
    section: string;
    shift: 'morning' | 'day';
    currentEnrollment?: number;
  }>;
}

export interface Acquisition {
  id: string;
  assetName: string;
  brand?: string;
  modelNo?: string;
  category: string;
  serials?: string[];
  warrantyMonths?: number;
  quantity: number;
  unitCost?: number;
  totalValue?: number;
  vendor: {
    name: string;
    panVat?: string;
    address?: string;
    contact?: string;
    paymentTiming?: 'INSTALLMENT' | 'FULL';
    paymentMode?: 'CASH' | 'BANK';
    invoiceDate?: string;
    settlementDate?: string;
  };
  management: {
    roomId: string;
    assignedDate?: string;
    status?: AssetStatus;
    hsCode?: string;
    notes?: string;
  };
  attachments?: string[];
  createdAt: string;
}

export interface AssetModel {
  id: string;
  name: string;
  brand?: string;
  modelNo?: string;
  modelNumber?: string;
  manufacturer?: string;
  category: string;
}

export interface AssetEvent {
  id?: string;
  type: string;
  at: string;
  date?: string;
  note?: string;
  reportedBy?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cost?: number;
  attachments?: string[];
}

export interface AssetItem {
  id: string;
  modelId: string;
  roomId?: string;
  serial?: string;
  serialNumber?: string;
  tag: string;
  tagNumber?: string;
  status: AssetStatus;
  warrantyExpiry?: string;
  warranty?: string;
  location: {
    type: LocationType;
    roomId?: string;
    vendorId?: string;
    note?: string;
    assignedTo?: string;
    expectedCompletionDate?: string;
  };
  acquisitionId?: string;
  lastEvent?: AssetEvent;
  eventHistory?: AssetEvent[]; // Full history of asset events
  notes?: string;
  // Purchase/Financial information
  purchaseDate?: string;
  cost?: number;
  vendor?: string;
  assignedTo?: {
    id: string;
    name?: string;
  };
}

// Extended types for room management
export interface RoomWithAssets extends Room {
  roomNo: string;
  capacity?: number;
  assets: AssetModelWithItems[];
  totalAssets: number;
  totalDamaged: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  assignedClasses?: Array<{
    id: string;
    name?: string;
    grade: number;
    section: string;
    shift: 'morning' | 'day';
    currentEnrollment?: number;
  }>;
}

export interface AssetModelWithItems extends AssetModel {
  items: AssetItem[];
  totalQuantity: number;
  okCount: number;
  damagedCount: number;
  underRepairCount: number;
  replacedCount: number;
  disposedCount: number;
  totalValue: number;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
}

// Forms and requests
export interface QuickAddUnitsRequest {
  modelId: string;
  quantity: number;
  purchaseDate?: string;
  costPerUnit?: number;
  vendor?: string;
  warrantyMonths?: number;
  targetRoomId: string;
}

export interface RecordAcquisitionRequest {
  assetName: string;
  brand?: string;
  modelNo?: string;
  category: string;
  serials?: string[];
  warrantyMonths?: number;
  quantity: number;
  unitCost?: number;
  attachments?: string[];
  vendor: {
    name: string;
    panVat?: string;
    address?: string;
    contact?: string;
    paymentTiming?: 'INSTALLMENT' | 'FULL';
    paymentMode?: 'CASH' | 'BANK';
    invoiceDate?: string;
    settlementDate?: string;
  };
  management: {
    roomId: string;
    assignedDate?: string;
    status?: AssetStatus;
    hsCode?: string;
    notes?: string;
  };
}

export interface DamageReportRequest {
  assetId: string;
  type: string;
  description: string;
  reportedDate: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedBy?: string;
  photos: File[]; // Changed from optional to required with empty array as default
}

export interface StartRepairRequest {
  itemId: string;
  faultDescription: string;
  assignedTo?: string;
  expectedCompletionDate?: string;
  sla?: string;
  attachment?: string;
  vendorId?: string; // For external repairs
  estimatedCost?: number;
}

export interface MarkRepairedRequest {
  itemId: string;
  workDoneNotes: string;
  cost?: number;
  warrantyUpdate?: string;
  completedDate: string;
  repairType?: 'INHOUSE' | 'EXTERNAL';
  technicianName?: string;
  partReplaced?: boolean;
  qualityCheckPassed?: boolean;
}

export interface ImportAssetData {
  modelName: string;
  category: string;
  serialNumber: string;
  tagNumber: string;
  purchaseDate: string;
  cost?: number;
  vendor: string;
  warranty: string;
  roomNo: string;
  status?: AssetStatus;
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
}

export interface AssetSearchFilters {
  status?: AssetStatus;
  category?: AssetCategory;
  roomId?: string;
  search?: string;
}
