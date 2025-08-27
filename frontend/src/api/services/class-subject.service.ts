import { apiClient } from '../client';
import {
  CreateClassSubjectDto,
  UpdateClassSubjectDto,
  GetClassSubjectsDto,
  BulkAssignClassSubjectsDto,
  ClassSubjectResponseDto,
} from '@sms/shared-types';

export const classSubjectService = {
  /**
   * Get all subjects assigned to a class
   */
  async getClassSubjects(params: GetClassSubjectsDto) {
    try {
      const response = await apiClient.get('/api/v1/class-subjects', {
        params: {
          classId: params.classId,
          includeTeacher: params.includeTeacher,
          includeSubjectDetails: params.includeSubjectDetails,
        },
      });
      return {
        success: true,
        data: response.data as ClassSubjectResponseDto[],
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err?.response?.status === 404) {
        // Treat missing assignments as empty rather than an error (first load / new class)
        return { success: true, data: [] as ClassSubjectResponseDto[] };
      }
      console.error('Error fetching class subjects:', error);
      return {
        success: false,
        error: err?.response?.data?.message || 'Failed to fetch class subjects',
      };
    }
  },

  /**
   * Get available subjects for a class (not yet assigned)
   */
  async getAvailableSubjectsForClass(classId: string) {
    try {
      const response = await apiClient.get(
        `/api/v1/class-subjects/available/${classId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('Error fetching available subjects:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to fetch available subjects',
      };
    }
  },

  /**
   * Assign a subject to a class
   */
  async assignSubjectToClass(assignmentData: CreateClassSubjectDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/class-subjects',
        assignmentData,
      );
      return {
        success: true,
        data: response.data as ClassSubjectResponseDto,
      };
    } catch (error: unknown) {
      console.error('Error assigning subject to class:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to assign subject to class',
      };
    }
  },

  /**
   * Bulk assign multiple subjects to a class
   */
  async bulkAssignSubjects(bulkData: BulkAssignClassSubjectsDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/class-subjects/bulk',
        bulkData,
      );
      return {
        success: true,
        data: response.data as ClassSubjectResponseDto[],
      };
    } catch (error: unknown) {
      console.error('Error bulk assigning subjects:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to bulk assign subjects',
      };
    }
  },

  /**
   * Update a class subject assignment (mainly for teacher changes)
   */
  async updateClassSubject(id: string, updateData: UpdateClassSubjectDto) {
    try {
      const response = await apiClient.put(
        `/api/v1/class-subjects/${id}`,
        updateData,
      );
      return {
        success: true,
        data: response.data as ClassSubjectResponseDto,
      };
    } catch (error: unknown) {
      console.error('Error updating class subject:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to update class subject',
      };
    }
  },

  /**
   * Remove a subject from a class
   */
  async removeSubjectFromClass(id: string) {
    try {
      const response = await apiClient.delete(`/api/v1/class-subjects/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('Error removing subject from class:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to remove subject from class',
      };
    }
  },
};
