import { apiClient } from '../client';
import {
  BulkTimetableOperationDto,
  GetTimetableDto,
  ValidateTimetableDto,
  AssignSubjectToTimeslotDto,
  AssignTeacherToSlotDto,
  TimetableSlotDto,
} from '@sms/shared-types';

export const timetableService = {
  /**
   * Get complete timetable for a class
   */
  async getTimetable(params: GetTimetableDto) {
    try {
      const response = await apiClient.get('/api/v1/timetable', {
        params: {
          classId: params.classId,
          scheduleId: params.scheduleId,
          includeConflicts: params.includeConflicts,
        },
      });
      return {
        success: true,
        data: response.data as TimetableSlotDto[],
      };
    } catch (error: unknown) {
      console.error('Error fetching timetable:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to fetch timetable',
      };
    }
  },

  /**
   * Assign subject to a timeslot
   */
  async assignSubjectToTimeslot(assignmentData: AssignSubjectToTimeslotDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/timetable/assign-subject',
        assignmentData,
      );
      return {
        success: true,
        data: response.data as TimetableSlotDto,
      };
    } catch (error: unknown) {
      console.error('Error assigning subject to timeslot:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to assign subject to timeslot',
      };
    }
  },

  /**
   * Assign teacher to a schedule slot
   */
  async assignTeacherToSlot(assignmentData: AssignTeacherToSlotDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/timetable/assign-teacher',
        assignmentData,
      );
      return {
        success: true,
        data: response.data as TimetableSlotDto,
      };
    } catch (error: unknown) {
      console.error('Error assigning teacher to slot:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to assign teacher to slot',
      };
    }
  },

  /**
   * Remove assignment from slot
   */
  async removeSlotAssignment(slotId: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/timetable/slot/${slotId}`,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error('Error removing slot assignment:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to remove slot assignment',
      };
    }
  },

  /**
   * Perform bulk timetable operations
   */
  async bulkTimetableOperations(bulkData: BulkTimetableOperationDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/timetable/bulk-operations',
        bulkData,
      );
      return {
        success: true,
        data: response.data as TimetableSlotDto[],
      };
    } catch (error: unknown) {
      console.error('Error performing bulk timetable operations:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to perform bulk timetable operations',
      };
    }
  },

  /**
   * Validate timetable for conflicts and completeness
   */
  async validateTimetable(validateData: ValidateTimetableDto) {
    try {
      const response = await apiClient.post(
        '/api/v1/timetable/validate',
        validateData,
      );
      return {
        success: true,
        data: response.data as {
          valid: boolean;
          errors: string[];
          warnings: string[];
        },
      };
    } catch (error: unknown) {
      console.error('Error validating timetable:', error);
      return {
        success: false,
        error:
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Failed to validate timetable',
      };
    }
  },

  /**
   * Export timetable(s)
   */
  async exportTimetables(params: {
    format: 'csv' | 'xlsx' | 'pdf';
    scope?: 'all' | 'class';
    classId?: string;
  }) {
    try {
      const format = params.format;
      const scope = params.scope || (params.classId ? 'class' : 'all');
      const query = new URLSearchParams();
      query.set('format', format);
      query.set('scope', scope);
      if (scope === 'class' && params.classId)
        query.set('classId', params.classId);
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '');
      const res = await fetch(
        `${baseURL}/api/v1/timetable/export?${query.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        },
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || `Export failed (${res.status})`);
      }
      const json = await res.json();
      if (!json || typeof json.data !== 'string') {
        throw new Error('Malformed export response');
      }
      return {
        success: true,
        data: {
          filename:
            json.filename ||
            (scope === 'all'
              ? `all-classes-${Date.now()}.zip`
              : `timetable-${Date.now()}.${format}`),
          mime:
            json.mime ||
            (scope === 'all'
              ? 'application/zip'
              : format === 'csv'
                ? 'text/csv'
                : format === 'xlsx'
                  ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  : 'application/pdf'),
          data: json.data as string,
        },
      };
    } catch (error: unknown) {
      console.error('Error exporting timetable(s):', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to export timetables',
      };
    }
  },
};
