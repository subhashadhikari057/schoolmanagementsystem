/**
 * Asset Management Service
 *
 * This service handles asset operations including:
 * - Damage reporting
 * - Repair workflows
 * - Asset status changes
 * - Asset events
 */

import type {
  AssetItem,
  AssetStatus,
  StartRepairRequest,
  MarkRepairedRequest,
} from '@/types/asset.types';

/**
 * Report damage for an asset
 */
interface ReportDamageRequest {
  assetId: string;
  type: string;
  description: string;
  reportedDate: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedBy?: string;
  photos?: File[];
}

/**
 * Reports damage for an asset and updates its status
 * @param data Damage report information
 * @returns Updated asset
 */
export async function reportAssetDamage(
  data: ReportDamageRequest,
): Promise<AssetItem> {
  // In a real implementation, this would make an API call

  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response
  // In a real implementation, this would come from the backend
  return {
    id: data.assetId,
    modelId: 'mock-model-id',
    status: 'DAMAGED',
    tag: 'MOCK-TAG',
    serial: 'MOCK-SERIAL',
    location: {
      type: 'ROOM',
    },
    lastEvent: {
      type: data.type,
      at: data.reportedDate || new Date().toISOString(),
      note: data.description,
      severity: data.severity,
      reportedBy: data.reportedBy,
      // We don't include the actual File objects in the response
      // In a real app, these would be uploaded and we'd get back URLs
      attachments:
        data.photos && data.photos.length > 0
          ? Array(data.photos.length).fill('mock-photo-url.jpg')
          : undefined,
    },
  };
}

/**
 * Starts repair process for a damaged asset
 * @param data Repair initiation data
 * @returns Updated asset
 */
export async function startAssetRepair(
  data: StartRepairRequest,
): Promise<AssetItem> {
  // In a real implementation, this would make an API call

  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response
  // In a real implementation, this would come from the backend
  return {
    id: data.itemId,
    modelId: 'mock-model-id',
    status: 'UNDER_REPAIR',
    tag: 'MOCK-TAG',
    serial: 'MOCK-SERIAL',
    location: {
      type: 'VENDOR',
      note: data.faultDescription,
    },
    lastEvent: {
      type: 'REPAIR_STARTED',
      at: new Date().toISOString(),
      note: data.faultDescription,
    },
  };
}

/**
 * Completes repair process for an asset
 * @param data Repair completion data
 * @returns Updated asset
 */
export async function markAssetRepaired(
  data: MarkRepairedRequest,
): Promise<AssetItem> {
  // In a real implementation, this would make an API call

  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response
  // In a real implementation, this would come from the backend
  return {
    id: data.itemId,
    modelId: 'mock-model-id',
    status: 'IN_SERVICE',
    tag: 'MOCK-TAG',
    serial: 'MOCK-SERIAL',
    location: {
      type: 'ROOM',
    },
    lastEvent: {
      type: 'REPAIR_COMPLETED',
      at: data.completedDate || new Date().toISOString(),
      note: data.workDoneNotes,
    },
  };
}

/**
 * Updates an asset's status
 * @param assetId Asset ID
 * @param status New status
 * @param note Optional note about the status change
 * @returns Updated asset
 */
export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  note?: string,
): Promise<AssetItem> {
  // In a real implementation, this would make an API call

  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response
  // In a real implementation, this would come from the backend
  return {
    id: assetId,
    modelId: 'mock-model-id',
    status: status,
    tag: 'MOCK-TAG',
    serial: 'MOCK-SERIAL',
    location: {
      type: 'ROOM',
    },
    lastEvent: {
      type: `STATUS_CHANGED_TO_${status}`,
      at: new Date().toISOString(),
      note: note || `Status changed to ${status}`,
    },
  };
}

/**
 * Loads damaged and under repair assets for a room
 * @param roomId Room ID
 * @returns List of damaged and under repair assets
 */
export async function loadDamagedAssets(roomId: string): Promise<AssetItem[]> {
  // In a real implementation, this would make an API call

  // For now, simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success response with empty array
  // In a real implementation, this would come from the backend
  return [];
}
