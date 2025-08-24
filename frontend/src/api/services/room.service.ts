/**
 * =============================================================================
 * Room Service
 * =============================================================================
 * Service for managing room-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import type { ApiResponse } from '../types/common';

// ============================================================================
// Types based on backend DTOs
// ============================================================================

export interface CreateRoomRequest {
  roomNo: string;
  name?: string;
  capacity?: number;
  floor?: number;
  building?: string;
  note?: string;
  isAvailable?: boolean;
}

export interface UpdateRoomRequest {
  roomNo?: string;
  name?: string;
  capacity?: number;
  floor?: number;
  building?: string;
  note?: string;
  isAvailable?: boolean;
}

export interface RoomResponse {
  id: string;
  roomNo: string;
  name?: string;
  capacity: number;
  floor: number;
  building?: string;
  note?: string;
  status: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  classes?: Array<{
    id: string;
    grade: number;
    section: string;
  }>;
}

export interface RoomQueryParams {
  page?: number;
  limit?: number;
  floor?: number;
  building?: string;
  isAvailable?: boolean;
  search?: string;
}

export interface RoomPaginatedResponse {
  rooms: RoomResponse[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// ============================================================================
// Room Service
// ============================================================================

const ROOM_ENDPOINTS = {
  CREATE: 'api/v1/rooms',
  LIST: 'api/v1/rooms',
  AVAILABLE: 'api/v1/rooms/available',
  BY_FLOOR: (floor: number) => `api/v1/rooms/floor/${floor}`,
  GET_BY_ID: (id: string) => `api/v1/rooms/${id}`,
  UPDATE: (id: string) => `api/v1/rooms/${id}`,
  DELETE: (id: string) => `api/v1/rooms/${id}`,
} as const;

export class RoomService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Room Operations
  // ========================================================================

  /**
   * Create a new room
   */
  async createRoom(
    data: CreateRoomRequest,
  ): Promise<ApiResponse<RoomResponse>> {
    return this.httpClient.post<RoomResponse>(ROOM_ENDPOINTS.CREATE, data, {
      requiresAuth: true,
    });
  }

  /**
   * Get all rooms with optional filtering
   */
  async getAllRooms(
    params?: RoomQueryParams,
  ): Promise<ApiResponse<RoomPaginatedResponse>> {
    return this.httpClient.get<RoomPaginatedResponse>(
      ROOM_ENDPOINTS.LIST,
      params as Record<string, unknown>,
      { requiresAuth: true },
    );
  }

  /**
   * Get available rooms (not assigned to any class)
   */
  async getAvailableRooms(): Promise<ApiResponse<RoomResponse[]>> {
    return this.httpClient.get<RoomResponse[]>(
      ROOM_ENDPOINTS.AVAILABLE,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get rooms by floor
   */
  async getRoomsByFloor(floor: number): Promise<ApiResponse<RoomResponse[]>> {
    return this.httpClient.get<RoomResponse[]>(
      ROOM_ENDPOINTS.BY_FLOOR(floor),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get a specific room by ID
   */
  async getRoomById(id: string): Promise<ApiResponse<RoomResponse>> {
    return this.httpClient.get<RoomResponse>(
      ROOM_ENDPOINTS.GET_BY_ID(id),
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update a room
   */
  async updateRoom(
    id: string,
    data: UpdateRoomRequest,
  ): Promise<ApiResponse<RoomResponse>> {
    return this.httpClient.patch<RoomResponse>(
      ROOM_ENDPOINTS.UPDATE(id),
      data,
      { requiresAuth: true },
    );
  }

  /**
   * Delete a room
   */
  async deleteRoom(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.httpClient.delete<{ message: string }>(
      ROOM_ENDPOINTS.DELETE(id),
      { requiresAuth: true },
    );
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const roomService = new RoomService();
