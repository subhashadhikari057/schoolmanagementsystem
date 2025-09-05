/**
 * =============================================================================
 * Asset Management Types
 * =============================================================================
 * Type definitions for asset management system
 * =============================================================================
 */

export type AssetStatus = 'ok' | 'damaged' | 'under_repair' | 'retired';
export type AssetCategory =
  | 'electronics'
  | 'furniture'
  | 'books'
  | 'sports'
  | 'laboratory'
  | 'other';

export interface AssetItem {
  id: string;
  serialNumber: string;
  tagNumber: string;
  status: AssetStatus;
  purchaseDate: string;
  cost: number;
  warranty: string;
  vendor: string;
  lastEvent?: {
    type: string;
    date: string;
    description: string;
  };
  assignedTo?: {
    type: 'room' | 'person';
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetModel {
  id: string;
  name: string;
  category: AssetCategory;
  description?: string;
  manufacturer?: string;
  modelNumber?: string;
  items: AssetItem[];
  totalQuantity: number;
  okCount: number;
  damagedCount: number;
  underRepairCount: number;
  retiredCount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  roomNo: string;
  name?: string;
  floor: number;
  building?: string;
  capacity?: number;
  type?: string;
  assets: AssetModel[];
  totalAssets: number;
  totalDamaged: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  // Optional: classes assigned to this room (for display in Asset tab)
  assignedClasses?: Array<{
    id: string;
    name?: string;
    grade: number;
    section: string;
    shift: 'morning' | 'day';
    currentEnrollment?: number;
  }>;
}

export interface CreateAssetRequest {
  modelName: string;
  category: AssetCategory;
  quantity: number;
  purchaseDate: string;
  costPerUnit: number;
  vendor: string;
  warranty: string;
  targetRoomId: string;
  description?: string;
  manufacturer?: string;
  modelNumber?: string;
}

export interface ReplaceAssetRequest {
  oldItemId: string;
  reason: string;
  newModelName: string;
  newSerialNumber: string;
  purchaseDate: string;
  cost: number;
  vendor: string;
  warranty: string;
  retireOldItem: boolean;
}

export interface ImportAssetData {
  modelName: string;
  category: AssetCategory;
  serialNumber: string;
  tagNumber: string;
  purchaseDate: string;
  cost: number;
  vendor: string;
  warranty: string;
  roomNo: string;
  status?: AssetStatus;
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
}

export interface AssetSearchFilters {
  query?: string;
  category?: AssetCategory;
  status?: AssetStatus;
  roomId?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}
