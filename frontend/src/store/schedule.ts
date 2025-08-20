import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Real data types from backend
interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: string;
  label?: string;
  classId?: string;
}

interface TimetableSlot {
  id: string;
  timeSlotId: string;
  day: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  type: string;
  hasConflict?: boolean;
  // Additional fields for display
  subjectName?: string;
  subjectCode?: string;
  teacherName?: string;
  roomName?: string;
}

interface ScheduleState {
  // Selected class and filters
  selectedClassId: string | null;
  selectedClass: any | null;
  selectedGrade: number;
  selectedSection: string;

  // Timetable state
  currentSchedule: any | null;
  hasExistingTimetable: boolean;
  isLoadingTimetable: boolean;

  // Timeslots for the schedule
  timeSlots: TimeSlot[];

  // Timetable data
  timetableSlots: TimetableSlot[];

  // Subject library filters
  subjectFilter: string;
  teacherFilter: string;

  // UI state
  activeTab: number;
  isTeacherModalOpen: boolean;
  selectedSlotForTeacher: TimetableSlot | null;

  // Actions
  setSelectedClass: (classId: string) => void;
  setSelectedClassData: (classData: any) => void;
  setCurrentSchedule: (schedule: any) => void;
  setHasExistingTimetable: (hasTimetable: boolean) => void;
  setIsLoadingTimetable: (loading: boolean) => void;
  setActiveTab: (tabIndex: number) => void;

  // Timeslot management
  addTimeSlot: (timeSlot: TimeSlot) => void;
  updateTimeSlot: (id: string, timeSlot: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: string) => void;
  setTimeSlots: (timeSlots: TimeSlot[]) => void;

  // Timetable management
  assignSubjectToSlot: (
    timeSlotId: string,
    day: string,
    subjectId: string,
  ) => void;
  assignTeacherToSlot: (slotId: string, teacherId: string) => void;
  assignRoomToSlot: (slotId: string, roomId: string) => void;
  removeAssignmentFromSlot: (slotId: string) => void;
  setTimetableSlots: (slots: TimetableSlot[]) => void;

  // Teacher modal
  openTeacherModal: (slot: TimetableSlot) => void;
  closeTeacherModal: () => void;

  // Filters
  setSubjectFilter: (filter: string) => void;
  setTeacherFilter: (filter: string) => void;

  // Reset and save
  resetTimetable: () => void;
  resetAll: () => void;

  // Validation
  validateSchedule: () => { valid: boolean; errors: string[] };
}

// Default time slots
const defaultTimeSlots: TimeSlot[] = [
  {
    id: 'ts-1',
    day: 'monday',
    startTime: '08:00',
    endTime: '08:45',
    type: 'regular',
  },
  {
    id: 'ts-2',
    day: 'monday',
    startTime: '08:45',
    endTime: '09:30',
    type: 'regular',
  },
  {
    id: 'ts-3',
    day: 'monday',
    startTime: '09:30',
    endTime: '10:00',
    type: 'break',
  },
  {
    id: 'ts-4',
    day: 'monday',
    startTime: '10:00',
    endTime: '10:45',
    type: 'regular',
  },
  {
    id: 'ts-5',
    day: 'monday',
    startTime: '10:45',
    endTime: '11:30',
    type: 'regular',
  },
  {
    id: 'ts-6',
    day: 'monday',
    startTime: '11:30',
    endTime: '12:15',
    type: 'regular',
  },
  {
    id: 'ts-7',
    day: 'monday',
    startTime: '12:15',
    endTime: '13:00',
    type: 'lunch',
  },
  {
    id: 'ts-8',
    day: 'monday',
    startTime: '13:00',
    endTime: '13:45',
    type: 'regular',
  },
  {
    id: 'ts-9',
    day: 'monday',
    startTime: '13:45',
    endTime: '14:30',
    type: 'regular',
  },
  {
    id: 'ts-10',
    day: 'monday',
    startTime: '14:30',
    endTime: '15:15',
    type: 'regular',
  },
  {
    id: 'ts-11',
    day: 'monday',
    startTime: '15:15',
    endTime: '16:00',
    type: 'regular',
  },
];

const initialTimetableSlots: TimetableSlot[] = [];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedClassId: null,
      selectedClass: null,
      selectedGrade: 0,
      selectedSection: '',
      currentSchedule: null,
      hasExistingTimetable: false,
      isLoadingTimetable: false,
      timeSlots: [], // Start with empty timeslots, not defaultTimeSlots
      timetableSlots: initialTimetableSlots,
      subjectFilter: '',
      teacherFilter: '',
      activeTab: 0,
      isTeacherModalOpen: false,
      selectedSlotForTeacher: null,

      // Class selection
      setSelectedClass: (classId: string) => {
        set({ selectedClassId: classId, timeSlots: [] }); // Clear timeslots when changing class
      },

      setSelectedClassData: (classData: any) => {
        if (classData) {
          set({
            selectedClass: classData,
            selectedGrade: classData.grade,
            selectedSection: classData.section,
          });
        }
      },

      setCurrentSchedule: (schedule: any) => {
        set({ currentSchedule: schedule });
      },

      setHasExistingTimetable: (hasTimetable: boolean) => {
        set({ hasExistingTimetable: hasTimetable });
      },

      setIsLoadingTimetable: (loading: boolean) => {
        set({ isLoadingTimetable: loading });
      },

      // Tab management
      setActiveTab: (tabIndex: number) => set({ activeTab: tabIndex }),

      // Timeslot management
      addTimeSlot: (timeSlot: TimeSlot) => {
        set(state => ({
          timeSlots: [...state.timeSlots, timeSlot],
        }));
      },

      updateTimeSlot: (id, updatedTimeSlot) => {
        set(state => ({
          timeSlots: state.timeSlots.map(slot =>
            slot.id === id ? { ...slot, ...updatedTimeSlot } : slot,
          ),
        }));
      },

      removeTimeSlot: id => {
        set(state => ({
          timeSlots: state.timeSlots.filter(slot => slot.id !== id),
          // Also remove any timetable slots that reference this timeslot
          timetableSlots: state.timetableSlots.filter(
            slot => slot.timeSlotId !== id,
          ),
        }));
      },

      setTimeSlots: (timeSlots: TimeSlot[]) => {
        set({ timeSlots });
      },

      // Timetable management
      assignSubjectToSlot: (timeSlotId, day, subjectId) => {
        const state = get();
        const timeSlot = state.timeSlots.find(ts => ts.id === timeSlotId);

        if (!timeSlot) return;

        // Check if a slot already exists for this timeslot and day
        const existingSlotIndex = state.timetableSlots.findIndex(
          slot => slot.timeSlotId === timeSlotId && slot.day === day,
        );

        if (existingSlotIndex >= 0) {
          // Update existing slot
          set(state => ({
            timetableSlots: state.timetableSlots.map((slot, index) =>
              index === existingSlotIndex
                ? {
                    ...slot,
                    subjectId,
                    teacherId: undefined,
                    roomId: undefined,
                  }
                : slot,
            ),
          }));
        } else {
          // Create new slot
          const newSlot: TimetableSlot = {
            id: `tt-${timeSlotId}-${day}-${Date.now()}`,
            timeSlotId,
            day,
            subjectId,
            type: timeSlot.type,
          };

          set(state => ({
            timetableSlots: [...state.timetableSlots, newSlot],
          }));
        }
      },

      assignTeacherToSlot: (slotId, teacherId) => {
        const state = get();
        const slot = state.timetableSlots.find(s => s.id === slotId);

        if (!slot) return;

        const timeSlot = state.timeSlots.find(ts => ts.id === slot.timeSlotId);
        if (!timeSlot) return;

        // Check for teacher conflicts (simplified for now)
        const hasConflict = false; // TODO: Implement proper conflict checking

        set(state => ({
          timetableSlots: state.timetableSlots.map(s =>
            s.id === slotId ? { ...s, teacherId, hasConflict } : s,
          ),
        }));
      },

      // Room assignment removed as per requirements
      assignRoomToSlot: (slotId, roomId) => {
        // No-op function to maintain API compatibility
        console.info('Room assignment is disabled as per requirements');
      },

      removeAssignmentFromSlot: slotId => {
        set(state => ({
          timetableSlots: state.timetableSlots.filter(
            slot => slot.id !== slotId,
          ),
        }));
      },

      setTimetableSlots: (slots: TimetableSlot[]) => {
        set({ timetableSlots: slots });
      },

      // Teacher modal
      openTeacherModal: slot =>
        set({
          isTeacherModalOpen: true,
          selectedSlotForTeacher: slot,
        }),

      closeTeacherModal: () =>
        set({
          isTeacherModalOpen: false,
          selectedSlotForTeacher: null,
        }),

      // Filters
      setSubjectFilter: filter => set({ subjectFilter: filter }),
      setTeacherFilter: filter => set({ teacherFilter: filter }),

      // Reset functions
      resetTimetable: () => set({ timetableSlots: initialTimetableSlots }),

      resetAll: () =>
        set({
          selectedClassId: null,
          selectedClass: null,
          selectedGrade: 0,
          selectedSection: '',
          currentSchedule: null,
          hasExistingTimetable: false,
          isLoadingTimetable: false,
          timeSlots: [], // Empty array, not defaultTimeSlots
          timetableSlots: initialTimetableSlots,
          subjectFilter: '',
          teacherFilter: '',
          activeTab: 0,
        }),

      // Validation
      validateSchedule: () => {
        const state = get();
        const errors: string[] = [];

        // Check for teacher conflicts
        const teacherConflicts = state.timetableSlots.filter(
          slot => slot.hasConflict,
        );
        if (teacherConflicts.length > 0) {
          errors.push(
            `Found ${teacherConflicts.length} teacher scheduling conflicts`,
          );
        }

        // Check for incomplete assignments (slots with subjects but no teachers)
        const incompleteAssignments = state.timetableSlots.filter(
          slot => slot.type === 'regular' && slot.subjectId && !slot.teacherId,
        );
        if (incompleteAssignments.length > 0) {
          errors.push(
            `Found ${incompleteAssignments.length} subjects without assigned teachers`,
          );
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      },
    }),
    {
      name: 'school-schedule-storage',
      partialize: state => ({
        selectedClassId: state.selectedClassId,
        selectedClass: state.selectedClass,
        currentSchedule: state.currentSchedule,
        hasExistingTimetable: state.hasExistingTimetable,
        timeSlots: state.timeSlots,
        timetableSlots: state.timetableSlots,
      }),
    },
  ),
);
