import { httpClient } from '../client';
import { ApiResponse } from '../types/common';
import {
  CreateExamDateslotDto,
  UpdateExamDateslotDto,
  ExamDateslotResponseDto,
  BulkCreateExamDateslotsDto,
  GenerateDateslotsFromRangeDto,
  CreateExamScheduleDto,
  UpdateExamScheduleDto,
  ExamScheduleResponseDto,
  BulkCreateExamSchedulesDto,
  CreateExamSlotDto,
  UpdateExamSlotDto,
  ExamSlotResponseDto,
  ExamTimetableSlotDto,
  BulkExamTimetableOperationDto,
  AssignSubjectToExamDateslotDto,
  CopyExamTimetableDto,
  ExamTimetableSummaryDto,
} from '@sms/shared-types';

const BASE_URL = '/api/v1';

// Exam Dateslot API
export const examDateslotService = {
  // Create a new exam dateslot
  createDateslot: async (
    data: CreateExamDateslotDto,
  ): Promise<ApiResponse<ExamDateslotResponseDto>> => {
    return await httpClient.post<ExamDateslotResponseDto>(
      `${BASE_URL}/exam-dateslots`,
      data,
      { requiresAuth: true },
    );
  },

  // Get dateslots by calendar entry
  getDateslotsByCalendarEntry: async (
    calendarEntryId: string,
  ): Promise<ApiResponse<ExamDateslotResponseDto[]>> => {
    return await httpClient.get<ExamDateslotResponseDto[]>(
      `${BASE_URL}/exam-dateslots/calendar-entry/${calendarEntryId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Get a dateslot by ID
  getDateslotById: async (
    id: string,
  ): Promise<ApiResponse<ExamDateslotResponseDto>> => {
    return await httpClient.get<ExamDateslotResponseDto>(
      `${BASE_URL}/exam-dateslots/${id}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Update a dateslot
  updateDateslot: async (
    id: string,
    data: UpdateExamDateslotDto,
  ): Promise<ApiResponse<ExamDateslotResponseDto>> => {
    return await httpClient.put<ExamDateslotResponseDto>(
      `${BASE_URL}/exam-dateslots/${id}`,
      data,
      { requiresAuth: true },
    );
  },

  // Delete a dateslot
  deleteDateslot: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/exam-dateslots/${id}`,
      { requiresAuth: true },
    );
  },

  // Bulk create dateslots
  bulkCreateDateslots: async (
    data: BulkCreateExamDateslotsDto,
  ): Promise<ApiResponse<ExamDateslotResponseDto[]>> => {
    return await httpClient.post<ExamDateslotResponseDto[]>(
      `${BASE_URL}/exam-dateslots/bulk`,
      data,
      { requiresAuth: true },
    );
  },

  // Generate dateslots from date range
  generateDateslotsFromRange: async (
    data: GenerateDateslotsFromRangeDto,
  ): Promise<ApiResponse<ExamDateslotResponseDto[]>> => {
    return await httpClient.post<ExamDateslotResponseDto[]>(
      `${BASE_URL}/exam-dateslots/generate-from-range`,
      data,
      { requiresAuth: true },
    );
  },
};

// Exam Schedule API
export const examScheduleService = {
  // Create a new exam schedule
  createExamSchedule: async (
    data: CreateExamScheduleDto,
  ): Promise<ApiResponse<ExamScheduleResponseDto>> => {
    return await httpClient.post<ExamScheduleResponseDto>(
      `${BASE_URL}/exam-schedules`,
      data,
      { requiresAuth: true },
    );
  },

  // Get exam schedules by class
  getExamSchedulesByClass: async (
    classId: string,
  ): Promise<ApiResponse<ExamScheduleResponseDto[]>> => {
    return await httpClient.get<ExamScheduleResponseDto[]>(
      `${BASE_URL}/exam-schedules/class/${classId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Get exam schedules by calendar entry
  getExamSchedulesByCalendarEntry: async (
    calendarEntryId: string,
  ): Promise<ApiResponse<ExamScheduleResponseDto[]>> => {
    return await httpClient.get<ExamScheduleResponseDto[]>(
      `${BASE_URL}/exam-schedules/calendar-entry/${calendarEntryId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Get exam schedule by ID
  getExamScheduleById: async (
    id: string,
  ): Promise<ApiResponse<ExamScheduleResponseDto>> => {
    return await httpClient.get<ExamScheduleResponseDto>(
      `${BASE_URL}/exam-schedules/${id}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Update exam schedule
  updateExamSchedule: async (
    id: string,
    data: UpdateExamScheduleDto,
  ): Promise<ApiResponse<ExamScheduleResponseDto>> => {
    return await httpClient.put<ExamScheduleResponseDto>(
      `${BASE_URL}/exam-schedules/${id}`,
      data,
      { requiresAuth: true },
    );
  },

  // Delete exam schedule
  deleteExamSchedule: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/exam-schedules/${id}`,
      { requiresAuth: true },
    );
  },

  // Bulk create exam schedules
  bulkCreateExamSchedules: async (
    data: BulkCreateExamSchedulesDto,
  ): Promise<ApiResponse<ExamScheduleResponseDto[]>> => {
    return await httpClient.post<ExamScheduleResponseDto[]>(
      `${BASE_URL}/exam-schedules/bulk`,
      data,
      { requiresAuth: true },
    );
  },

  // Activate exam schedule
  activateExamSchedule: async (
    id: string,
  ): Promise<ApiResponse<ExamScheduleResponseDto>> => {
    return await httpClient.post<ExamScheduleResponseDto>(
      `${BASE_URL}/exam-schedules/${id}/activate`,
      {},
      { requiresAuth: true },
    );
  },

  // Create exam slot
  createExamSlot: async (
    data: CreateExamSlotDto,
  ): Promise<ApiResponse<ExamSlotResponseDto>> => {
    return await httpClient.post<ExamSlotResponseDto>(
      `${BASE_URL}/exam-schedules/slots`,
      data,
      { requiresAuth: true },
    );
  },

  // Get exam slots by schedule
  getExamSlotsBySchedule: async (
    examScheduleId: string,
  ): Promise<ApiResponse<ExamSlotResponseDto[]>> => {
    return await httpClient.get<ExamSlotResponseDto[]>(
      `${BASE_URL}/exam-schedules/${examScheduleId}/slots`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Update exam slot
  updateExamSlot: async (
    id: string,
    data: UpdateExamSlotDto,
  ): Promise<ApiResponse<ExamSlotResponseDto>> => {
    return await httpClient.put<ExamSlotResponseDto>(
      `${BASE_URL}/exam-schedules/slots/${id}`,
      data,
      { requiresAuth: true },
    );
  },

  // Delete exam slot
  deleteExamSlot: async (
    id: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/exam-schedules/slots/${id}`,
      { requiresAuth: true },
    );
  },
};

// Exam Timetable API
export const examTimetableService = {
  // Get complete exam timetable
  getExamTimetable: async (
    classId: string,
    calendarEntryId: string,
    examScheduleId?: string,
  ): Promise<ApiResponse<ExamTimetableSlotDto[]>> => {
    const params = new URLSearchParams({
      classId,
      calendarEntryId,
      ...(examScheduleId && { examScheduleId }),
    });

    return await httpClient.get<ExamTimetableSlotDto[]>(
      `${BASE_URL}/exam-timetables?${params}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Assign subject to exam dateslot
  assignSubjectToDateslot: async (
    data: AssignSubjectToExamDateslotDto,
  ): Promise<ApiResponse<ExamTimetableSlotDto>> => {
    return await httpClient.post<ExamTimetableSlotDto>(
      `${BASE_URL}/exam-timetables/assign-subject`,
      data,
      { requiresAuth: true },
    );
  },

  // Remove subject from dateslot
  removeSubjectFromDateslot: async (
    slotId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return await httpClient.delete<{ message: string }>(
      `${BASE_URL}/exam-timetables/remove-subject/${slotId}`,
      { requiresAuth: true },
    );
  },

  // Bulk exam timetable operations
  bulkExamTimetableOperations: async (
    data: BulkExamTimetableOperationDto,
  ): Promise<ApiResponse<ExamTimetableSlotDto[]>> => {
    return await httpClient.post<ExamTimetableSlotDto[]>(
      `${BASE_URL}/exam-timetables/bulk-operations`,
      data,
      { requiresAuth: true },
    );
  },

  // Validate exam timetable
  validateExamTimetable: async (
    examScheduleId: string,
    checkCompleteness: boolean = true,
  ): Promise<
    ApiResponse<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }>
  > => {
    return await httpClient.post<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }>(
      `${BASE_URL}/exam-timetables/validate`,
      { examScheduleId, checkCompleteness },
      { requiresAuth: true },
    );
  },

  // Copy exam timetable to other classes
  copyExamTimetable: async (
    data: CopyExamTimetableDto,
  ): Promise<ApiResponse<ExamTimetableSlotDto[]>> => {
    return await httpClient.post<ExamTimetableSlotDto[]>(
      `${BASE_URL}/exam-timetables/copy`,
      data,
      { requiresAuth: true },
    );
  },

  // Get exam timetable summary
  getExamTimetableSummary: async (
    examScheduleId: string,
  ): Promise<ApiResponse<ExamTimetableSummaryDto>> => {
    return await httpClient.get<ExamTimetableSummaryDto>(
      `${BASE_URL}/exam-timetables/summary/${examScheduleId}`,
      undefined,
      { requiresAuth: true },
    );
  },
};
