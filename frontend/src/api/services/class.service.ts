/**
 * =============================================================================
 * Class Service
 * =============================================================================
 * Service for managing class-related API calls
 * =============================================================================
 */

import { HttpClient } from '../client/http-client';
import type { ApiResponse } from '../types/common';

// ============================================================================
// Types based on backend DTOs
// ============================================================================

export interface CreateClassRequest {
  name?: string; // e.g. "Grade 10 Section A" - optional
  grade: number; // 1-12
  section: string; // e.g. "A", "B", "C"
  capacity: number;
  shift: 'morning' | 'day'; // Required class shift
  roomId: string;
  classTeacherId: string; // Required class teacher
}

export interface UpdateClassRequest {
  name?: string;
  grade?: number;
  section?: string;
  capacity?: number;
  shift?: 'morning' | 'day';
  roomId?: string;
  classTeacherId?: string;
}

export interface ClassResponse {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment: number;
  shift: 'morning' | 'day';
  roomId: string;
  classTeacherId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  // Additional fields from API response
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
    };
    employeeId?: string;
  };
  students?: Array<{
    id: string;
    rollNumber: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    user: {
      fullName: string;
      email?: string;
      phone?: string;
    };
    parents?: Array<{
      id: string;
      parent: {
        id: string;
        user: {
          fullName: string;
          email: string;
          phone?: string;
        };
      };
      relationship: string;
      isPrimary: boolean;
    }>;
    guardians?: Array<{
      id: string;
      fullName: string;
      phone: string;
      email: string;
      relation: string;
    }>;
  }>;
}

// ============================================================================
// Class Service
// ============================================================================

export class ClassService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // ========================================================================
  // Class Operations
  // ========================================================================

  /**
   * Create a new class
   */
  async createClass(
    data: CreateClassRequest,
  ): Promise<ApiResponse<ClassResponse>> {
    // Convert shift to uppercase for backend
    const requestData = {
      ...data,
      shift: data.shift.toUpperCase() as 'MORNING' | 'DAY',
    };

    return this.httpClient.post<ClassResponse>('api/v1/classes', requestData, {
      requiresAuth: true,
    });
  }

  /**
   * Get all classes
   */
  async getAllClasses(): Promise<ApiResponse<ClassResponse[]>> {
    return this.httpClient.get<ClassResponse[]>('api/v1/classes', undefined, {
      requiresAuth: true,
    });
  }

  /**
   * Get a specific class by ID
   */
  async getClassById(id: string): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.get<ClassResponse>(
      `api/v1/classes/${id}`,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get comprehensive class details with students, parents, and guardians
   */
  async getClassWithStudents(id: string): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.get<ClassResponse>(
      `api/v1/classes/${id}/students`,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Update a class
   */
  async updateClass(
    id: string,
    data: UpdateClassRequest,
  ): Promise<ApiResponse<ClassResponse>> {
    return this.httpClient.patch<ClassResponse>(`api/v1/classes/${id}`, data, {
      requiresAuth: true,
    });
  }

  /**
   * Delete a class
   */
  async deleteClass(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`api/v1/classes/${id}`, {
      requiresAuth: true,
    });
  }

  /**
   * Get available rooms for a specific shift
   */
  async getAvailableRooms(
    shift: 'morning' | 'day',
  ): Promise<ApiResponse<AvailableRoom[]>> {
    const shiftParam = shift.toUpperCase(); // Convert to MORNING/DAY for backend
    return this.httpClient.get<AvailableRoom[]>(
      `api/v1/classes/rooms/available?shift=${shiftParam}`,
      undefined,
      { requiresAuth: true },
    );
  }

  /**
   * Get available teachers (not already assigned as class teachers)
   */
  async getAvailableTeachers(): Promise<ApiResponse<AvailableTeacher[]>> {
    return this.httpClient.get<AvailableTeacher[]>(
      'api/v1/classes/teachers/available',
      undefined,
      { requiresAuth: true },
    );
  }
}

// ============================================================================
// Additional Types for Available Resources
// ============================================================================

export interface AvailableRoom {
  id: string;
  roomNo: string;
  name?: string;
  floor: number;
  building?: string;
  capacity: number;
  assignedClasses: Array<{
    id: string;
    grade: number;
    section: string;
    shift: 'MORNING' | 'DAY';
  }>;
}

export interface AvailableTeacher {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string;
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const classService = new ClassService();
