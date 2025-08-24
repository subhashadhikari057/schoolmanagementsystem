import { httpClient } from '../client';
import { ApiResponse } from '../types/common';
import {
  BulkCreateTimeslotsDto,
  CheckTeacherConflictDto,
  CreateScheduleDto,
  CreateScheduleSlotDto,
  CreateTimeslotDto,
  ScheduleResponseDto,
  ScheduleSlotResponseDto,
  TimeslotResponseDto,
  UpdateScheduleDto,
  UpdateScheduleSlotDto,
  UpdateTimeslotDto,
} from '@sms/shared-types';

const BASE_URL = '/api/v1';

// Timeslot API
export const timeslotService = {
  // Create a new timeslot
  createTimeslot: async (
    data: CreateTimeslotDto,
  ): Promise<ApiResponse<TimeslotResponseDto>> => {
    // Use class-timeslots endpoint instead since timeslots endpoint is not available
    return await httpClient.post<TimeslotResponseDto>(
      `${BASE_URL}/class-timeslots`,
      data,
      { requiresAuth: true },
    );
  },

  // Create multiple timeslots at once
  bulkCreateTimeslots: async (
    data: BulkCreateTimeslotsDto,
  ): Promise<
    ApiResponse<{ count: number; timeslots: TimeslotResponseDto[] }>
  > => {
    // Use class-timeslots/bulk endpoint instead since timeslots endpoint is not available
    return await httpClient.post<{
      count: number;
      timeslots: TimeslotResponseDto[];
    }>(`${BASE_URL}/class-timeslots/bulk`, data, { requiresAuth: true });
  },

  // Get timeslots by class ID
  getTimeslotsByClass: async (
    classId: string,
  ): Promise<ApiResponse<TimeslotResponseDto[]>> => {
    // Use class-timeslots endpoint instead since timeslots endpoint is not available
    return await httpClient.get<TimeslotResponseDto[]>(
      `${BASE_URL}/class-timeslots?classId=${classId}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Get a timeslot by ID
  getTimeslotById: async (
    id: string,
  ): Promise<ApiResponse<TimeslotResponseDto>> => {
    // Use class-timeslots endpoint instead since timeslots endpoint is not available
    return await httpClient.get<TimeslotResponseDto>(
      `${BASE_URL}/class-timeslots/${id}`,
      undefined,
      { requiresAuth: true },
    );
  },

  // Update a timeslot
  updateTimeslot: async (
    id: string,
    data: UpdateTimeslotDto,
  ): Promise<ApiResponse<TimeslotResponseDto>> => {
    // Use class-timeslots endpoint instead since timeslots endpoint is not available
    return await httpClient.put<TimeslotResponseDto>(
      `${BASE_URL}/class-timeslots/${id}`,
      data,
      { requiresAuth: true },
    );
  },

  // Delete a timeslot
  deleteTimeslot: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    // Use class-timeslots endpoint instead since timeslots endpoint is not available
    return await httpClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/class-timeslots/${id}`,
      { requiresAuth: true },
    );
  },
};

// Schedule API
export const scheduleService = {
  // Create a new schedule
  createSchedule: async (
    data: CreateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> => {
    return await httpClient.post<ScheduleResponseDto>(
      `${BASE_URL}/schedules`,
      data,
    );
  },

  // Get schedules by class ID
  getSchedulesByClass: async (
    classId: string,
  ): Promise<ApiResponse<ScheduleResponseDto[]>> => {
    return await httpClient.get<ScheduleResponseDto[]>(
      `${BASE_URL}/schedules?classId=${classId}`,
    );
  },

  // Get a schedule by ID with its slots
  getScheduleById: async (
    id: string,
  ): Promise<
    ApiResponse<ScheduleResponseDto & { slots: ScheduleSlotResponseDto[] }>
  > => {
    return await httpClient.get<
      ScheduleResponseDto & { slots: ScheduleSlotResponseDto[] }
    >(`${BASE_URL}/schedules/${id}`);
  },

  // Update a schedule
  updateSchedule: async (
    id: string,
    data: UpdateScheduleDto,
  ): Promise<ApiResponse<ScheduleResponseDto>> => {
    return await httpClient.put<ScheduleResponseDto>(
      `${BASE_URL}/schedules/${id}`,
      data,
    );
  },

  // Delete a schedule
  deleteSchedule: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return await httpClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/schedules/${id}`,
    );
  },

  // Activate a schedule
  activateSchedule: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return await httpClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/schedules/${id}/activate`,
    );
  },

  // Create a schedule slot
  createScheduleSlot: async (
    data: CreateScheduleSlotDto,
  ): Promise<ApiResponse<ScheduleSlotResponseDto>> => {
    return await httpClient.post<ScheduleSlotResponseDto>(
      `${BASE_URL}/schedules/slots`,
      data,
    );
  },

  // Get schedule slots by schedule ID
  getScheduleSlotsBySchedule: async (
    scheduleId: string,
  ): Promise<ApiResponse<ScheduleSlotResponseDto[]>> => {
    return await httpClient.get<ScheduleSlotResponseDto[]>(
      `${BASE_URL}/schedules/slots?scheduleId=${scheduleId}`,
    );
  },

  // Update a schedule slot
  updateScheduleSlot: async (
    id: string,
    data: UpdateScheduleSlotDto,
  ): Promise<ApiResponse<ScheduleSlotResponseDto>> => {
    return await httpClient.put<ScheduleSlotResponseDto>(
      `${BASE_URL}/schedules/slots/${id}`,
      data,
    );
  },

  // Delete a schedule slot
  deleteScheduleSlot: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return await httpClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/schedules/slots/${id}`,
    );
  },

  // Check for teacher conflicts
  checkTeacherConflict: async (
    data: CheckTeacherConflictDto,
  ): Promise<
    ApiResponse<{ hasConflict: boolean; conflictingSlots?: unknown[] }>
  > => {
    return await httpClient.post<{
      hasConflict: boolean;
      conflictingSlots?: unknown[];
    }>(`${BASE_URL}/schedules/check-teacher-conflict`, data);
  },

  // Get a subject by ID
  getSubjectById: async (id: string): Promise<ApiResponse<unknown>> => {
    return await httpClient.get<unknown>(`${BASE_URL}/subjects/${id}`);
  },
};
