import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  examScheduleService,
  examTimetableService,
} from '@/api/services/exam-timetable.service';
import { ExamDateslotType } from '@sms/shared-types';

// Enhanced interfaces based on backend DTOs
interface CalendarEntry {
  id: string;
  name: string;
  type: string;
  examType?: string;
  startDate: Date;
  endDate: Date;
}

interface Class {
  id: string;
  name?: string;
  grade: number;
  section: string;
  classTeacherId?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxMarks?: number;
  passMarks?: number;
}

interface ExamDateslot {
  id: string;
  calendarEntryId: string;
  examDate: Date;
  startTime?: string;
  endTime?: string;
  label?: string;
  type: ExamDateslotType;
}

interface ExamSchedule {
  id: string;
  classId: string;
  calendarEntryId: string;
  name: string;
  academicYear: string;
  status: string;
  class?: Class;
  calendarEntry?: CalendarEntry;
}

interface ExamTimetableSlot {
  id: string;
  examScheduleId: string;
  dateslotId: string;
  subjectId?: string;
  roomId?: string;
  duration?: number;
  instructions?: string;
  // Enhanced with relation data
  dateslot?: {
    id: string;
    examDate: Date;
    startTime?: string;
    endTime?: string;
    label?: string;
    type: ExamDateslotType;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string;
    maxMarks: number;
    passMarks: number;
  };
  room?: {
    id: string;
    roomNo: string;
    name?: string;
    capacity: number;
    floor: number;
    building?: string;
  };
}

interface ExamTimetableState {
  // Current selections
  selectedCalendarEntryId: string;
  selectedCalendarEntry: CalendarEntry | null;
  selectedClassId: string;
  selectedClass: Class | null;
  selectedExamScheduleId: string;
  selectedExamSchedule: ExamSchedule | null;

  // Active tab management
  activeTab: number;

  // Data states
  examDateslots: ExamDateslot[];
  examTimetableSlots: ExamTimetableSlot[];
  availableClasses: Class[];
  availableSubjects: Subject[];

  // UI states
  isEditMode: boolean;
  draggedSubject: Subject | null;
  dropZoneHighlight: string | null;
  isLoadingTimetable: boolean;
  hasLoadedTimetable: boolean;

  // Validation states
  validationErrors: string[];
  validationWarnings: string[];

  // Actions for selections
  setSelectedCalendarEntry: (
    calendarEntryId: string,
    calendarEntry?: CalendarEntry,
  ) => void;
  setSelectedClass: (classId: string, classData?: Class) => void;
  setSelectedExamSchedule: (
    examScheduleId: string,
    examSchedule?: ExamSchedule,
  ) => void;
  setActiveTab: (tab: number) => void;

  // Actions for data management
  setExamDateslots: (dateslots: ExamDateslot[]) => void;
  addExamDateslot: (dateslot: ExamDateslot) => void;
  removeExamDateslot: (dateslotId: string) => void;
  updateExamDateslot: (
    dateslotId: string,
    updates: Partial<ExamDateslot>,
  ) => void;

  setExamTimetableSlots: (slots: ExamTimetableSlot[]) => void;
  updateExamTimetableSlot: (
    slotId: string,
    updates: Partial<ExamTimetableSlot>,
  ) => void;

  setAvailableClasses: (classes: Class[]) => void;
  setAvailableSubjects: (subjects: Subject[]) => void;

  // Actions for UI states
  setIsEditMode: (isEditMode: boolean) => void;
  setDraggedSubject: (subject: Subject | null) => void;
  setDropZoneHighlight: (highlight: string | null) => void;
  setIsLoadingTimetable: (loading: boolean) => void;
  setHasLoadedTimetable: (loaded: boolean) => void;

  // Actions for validation
  setValidationErrors: (errors: string[]) => void;
  setValidationWarnings: (warnings: string[]) => void;
  validateExamTimetable: () => Promise<void>;

  // Complex actions
  assignSubjectToDateslot: (
    dateslotId: string,
    subjectId: string,
    roomId?: string,
    duration?: number,
    instructions?: string,
  ) => Promise<void>;
  removeSubjectFromDateslot: (slotId: string) => Promise<void>;
  resetExamTimetable: () => void;

  // Bulk operations
  bulkCreateExamSchedules: (
    calendarEntryId: string,
    classIds: string[],
    name: string,
    academicYear: string,
  ) => Promise<void>;
  copyExamTimetable: (
    sourceScheduleId: string,
    targetClassIds: string[],
  ) => Promise<void>;

  // Utility actions
  clearInvalidState: () => void;
}

export const useExamTimetableStore = create<ExamTimetableState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedCalendarEntryId: '',
      selectedCalendarEntry: null,
      selectedClassId: '',
      selectedClass: null,
      selectedExamScheduleId: '',
      selectedExamSchedule: null,
      activeTab: 0,
      examDateslots: [],
      examTimetableSlots: [],
      availableClasses: [],
      availableSubjects: [],
      isEditMode: false,
      draggedSubject: null,
      dropZoneHighlight: null,
      isLoadingTimetable: false,
      hasLoadedTimetable: false,
      validationErrors: [],
      validationWarnings: [],

      // Selection actions
      setSelectedCalendarEntry: (
        calendarEntryId: string,
        calendarEntry?: CalendarEntry,
      ) => {
        set({
          selectedCalendarEntryId: calendarEntryId,
          selectedCalendarEntry: calendarEntry || null,
          // Reset dependent states
          selectedExamScheduleId: '',
          selectedExamSchedule: null,
          examDateslots: [],
          examTimetableSlots: [],
          hasLoadedTimetable: false,
        });
      },

      setSelectedClass: (classId: string, classData?: Class) => {
        set({
          selectedClassId: classId,
          selectedClass: classData || null,
          // Reset dependent states
          selectedExamScheduleId: '',
          selectedExamSchedule: null,
          examTimetableSlots: [],
          hasLoadedTimetable: false,
        });
      },

      setSelectedExamSchedule: (
        examScheduleId: string,
        examSchedule?: ExamSchedule,
      ) => {
        set({
          selectedExamScheduleId: examScheduleId,
          selectedExamSchedule: examSchedule || null,
          hasLoadedTimetable: false,
        });
      },

      setActiveTab: (tab: number) => set({ activeTab: tab }),

      // Data management actions
      setExamDateslots: (dateslots: ExamDateslot[]) =>
        set({ examDateslots: dateslots }),

      addExamDateslot: (dateslot: ExamDateslot) => {
        set(state => ({
          examDateslots: [...state.examDateslots, dateslot],
        }));
      },

      removeExamDateslot: (dateslotId: string) => {
        set(state => ({
          examDateslots: state.examDateslots.filter(d => d.id !== dateslotId),
        }));
      },

      updateExamDateslot: (
        dateslotId: string,
        updates: Partial<ExamDateslot>,
      ) => {
        set(state => ({
          examDateslots: state.examDateslots.map(d =>
            d.id === dateslotId ? { ...d, ...updates } : d,
          ),
        }));
      },

      setExamTimetableSlots: (slots: ExamTimetableSlot[]) =>
        set({ examTimetableSlots: slots }),

      updateExamTimetableSlot: (
        slotId: string,
        updates: Partial<ExamTimetableSlot>,
      ) => {
        set(state => ({
          examTimetableSlots: state.examTimetableSlots.map(slot =>
            slot.id === slotId ? { ...slot, ...updates } : slot,
          ),
        }));
      },

      setAvailableClasses: (classes: Class[]) =>
        set({ availableClasses: classes }),
      setAvailableSubjects: (subjects: Subject[]) =>
        set({ availableSubjects: subjects }),

      // UI state actions
      setIsEditMode: (isEditMode: boolean) => set({ isEditMode }),
      setDraggedSubject: (subject: Subject | null) =>
        set({ draggedSubject: subject }),
      setDropZoneHighlight: (highlight: string | null) =>
        set({ dropZoneHighlight: highlight }),
      setIsLoadingTimetable: (loading: boolean) =>
        set({ isLoadingTimetable: loading }),
      setHasLoadedTimetable: (loaded: boolean) =>
        set({ hasLoadedTimetable: loaded }),

      // Validation actions
      setValidationErrors: (errors: string[]) =>
        set({ validationErrors: errors }),
      setValidationWarnings: (warnings: string[]) =>
        set({ validationWarnings: warnings }),

      validateExamTimetable: async () => {
        const { selectedExamScheduleId } = get();
        if (!selectedExamScheduleId) return;

        try {
          const response = await examTimetableService.validateExamTimetable(
            selectedExamScheduleId,
          );
          if (response.success && response.data) {
            set({
              validationErrors: response.data.errors,
              validationWarnings: response.data.warnings,
            });
          }
        } catch (error) {
          console.error('Error validating exam timetable:', error);
        }
      },

      // Complex actions
      assignSubjectToDateslot: async (
        dateslotId: string,
        subjectId: string,
        roomId?: string,
        duration?: number,
        instructions?: string,
      ) => {
        const { selectedExamScheduleId } = get();
        if (!selectedExamScheduleId) return;

        try {
          const response = await examTimetableService.assignSubjectToDateslot({
            examScheduleId: selectedExamScheduleId,
            dateslotId,
            subjectId,
            roomId,
            duration,
            instructions,
          });

          if (response.success && response.data) {
            // Update the slot in the store
            set(state => {
              const existingSlotIndex = state.examTimetableSlots.findIndex(
                slot => slot.dateslotId === dateslotId,
              );

              if (existingSlotIndex >= 0) {
                // Update existing slot
                const updatedSlots = [...state.examTimetableSlots];
                updatedSlots[existingSlotIndex] =
                  response.data as ExamTimetableSlot;
                return { examTimetableSlots: updatedSlots };
              } else {
                // Add new slot
                return {
                  examTimetableSlots: [
                    ...state.examTimetableSlots,
                    response.data as ExamTimetableSlot,
                  ],
                };
              }
            });
          }
        } catch (error) {
          console.error('Error assigning subject to dateslot:', error);
          throw error;
        }
      },

      removeSubjectFromDateslot: async (slotId: string) => {
        try {
          const response =
            await examTimetableService.removeSubjectFromDateslot(slotId);
          if (response.success) {
            // Remove subject assignment from the slot
            set(state => ({
              examTimetableSlots: state.examTimetableSlots.map(slot =>
                slot.id === slotId
                  ? {
                      ...slot,
                      subjectId: undefined,
                      subject: undefined,
                      roomId: undefined,
                      room: undefined,
                    }
                  : slot,
              ),
            }));
          }
        } catch (error) {
          console.error('Error removing subject from dateslot:', error);
          throw error;
        }
      },

      resetExamTimetable: () => {
        set({
          selectedCalendarEntryId: '',
          selectedCalendarEntry: null,
          selectedClassId: '',
          selectedClass: null,
          selectedExamScheduleId: '',
          selectedExamSchedule: null,
          examDateslots: [],
          examTimetableSlots: [],
          isEditMode: false,
          draggedSubject: null,
          dropZoneHighlight: null,
          isLoadingTimetable: false,
          hasLoadedTimetable: false,
          validationErrors: [],
          validationWarnings: [],
        });
      },

      // Bulk operations
      bulkCreateExamSchedules: async (
        calendarEntryId: string,
        classIds: string[],
        name: string,
        academicYear: string,
      ) => {
        try {
          const response = await examScheduleService.bulkCreateExamSchedules({
            calendarEntryId,
            classIds,
            name,
            academicYear,
          });

          if (response.success && response.data) {
            // If current class is in the created schedules, update the selected schedule
            const { selectedClassId } = get();
            const currentClassSchedule = response.data.find(
              schedule => schedule.classId === selectedClassId,
            );

            if (currentClassSchedule) {
              set({
                selectedExamScheduleId: currentClassSchedule.id,
                selectedExamSchedule: currentClassSchedule,
              });
            }
          }
        } catch (error) {
          console.error('Error bulk creating exam schedules:', error);
          throw error;
        }
      },

      copyExamTimetable: async (
        sourceScheduleId: string,
        targetClassIds: string[],
      ) => {
        try {
          const response = await examTimetableService.copyExamTimetable({
            sourceExamScheduleId: sourceScheduleId,
            targetClassIds,
            copySubjects: true,
            copyRooms: false,
            copyInstructions: true,
          });

          if (response.success) {
            // Refresh timetable if current class is in target classes
            const { selectedClassId, selectedCalendarEntryId } = get();
            if (targetClassIds.includes(selectedClassId)) {
              // Reload exam timetable for current class
              const timetableResponse =
                await examTimetableService.getExamTimetable(
                  selectedClassId,
                  selectedCalendarEntryId,
                );
              if (timetableResponse.success && timetableResponse.data) {
                set({ examTimetableSlots: timetableResponse.data });
              }
            }
          }
        } catch (error) {
          console.error('Error copying exam timetable:', error);
          throw error;
        }
      },

      // Clear invalid mock data from persistent storage
      clearInvalidState: () => {
        const { selectedCalendarEntryId } = get();
        // Clear mock IDs that are not valid UUIDs
        if (
          selectedCalendarEntryId &&
          !selectedCalendarEntryId.match(/^[0-9a-fA-F-]{36}$/)
        ) {
          console.log(
            'Clearing invalid calendar entry ID:',
            selectedCalendarEntryId,
          );
          set({
            selectedCalendarEntryId: '',
            selectedCalendarEntry: null,
            selectedClassId: '',
            selectedClass: null,
            selectedExamScheduleId: '',
            selectedExamSchedule: null,
            examDateslots: [],
            examTimetableSlots: [],
            hasLoadedTimetable: false,
          });
        }
      },
    }),
    {
      name: 'exam-timetable-storage',
      partialize: state => ({
        selectedCalendarEntryId: state.selectedCalendarEntryId,
        selectedClassId: state.selectedClassId,
        selectedExamScheduleId: state.selectedExamScheduleId,
        activeTab: state.activeTab,
      }),
    },
  ),
);
