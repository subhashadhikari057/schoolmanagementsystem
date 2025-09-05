import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scheduleService } from '@/api/services/schedule.service';
import { timetableService } from '@/api/services/timetable.service';

// Enhanced interfaces based on backend DTOs
interface Class {
  id: string;
  classId: string;
  gradeLevel: number;
  grade: number; // Add for backward compatibility
  section: string;
  academicYearId: string;
  teacherId?: string;
}

interface Schedule {
  id: string;
  classId: string;
  academicYearId: string;
  isActive: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxMarks: number;
  passMarks: number;
}

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  subject: Subject;
  teacher?: {
    id: string;
    userId: string;
    employeeId?: string;
    designation: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

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
  scheduleId: string;
  timeSlotId: string;
  timeslotId: string; // Keep both for compatibility
  day: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  type: string;
  hasConflict?: boolean;
  // Enhanced with relation data
  timeslot?: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    type: string;
    label?: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  teacher?: {
    id: string;
    userId: string;
    employeeId?: string;
    designation: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
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

interface Teacher {
  id: string;
  userId: string;
  employeeId?: string;
  designation: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ScheduleState {
  // Tracking state
  hasLoadedTimetable: boolean;

  // Selected class and filters
  selectedClassId: string | null;
  selectedClass: Class | null;
  selectedGrade: number;
  selectedSection: string;

  // Schedule state
  currentSchedule: Schedule | null;
  hasExistingTimetable: boolean;
  isLoadingTimetable: boolean;

  // Subjects for the selected class
  classSubjects: ClassSubject[];
  availableSubjects: Subject[];
  isLoadingSubjects: boolean;

  // Teachers for assignments
  availableTeachers: Teacher[];
  isLoadingTeachers: boolean;

  // Edit mode for timetable builder
  isEditMode: boolean;

  // Timeslots for the schedule
  timeSlots: TimeSlot[];

  // Timetable data
  timetableSlots: TimetableSlot[];

  // Drag and drop state
  draggedSubject: Subject | null;
  dropZoneHighlight: string | null; // Format: "day-timeslotId"

  // Subject library filters
  subjectFilter: string;
  teacherFilter: string;

  // UI state
  activeTab: number;
  isTeacherModalOpen: boolean;
  selectedSlotForTeacher: TimetableSlot | null;

  // Validation state
  validationErrors: string[];
  validationWarnings: string[];

  // Actions
  setSelectedClass: (classId: string) => void;
  setSelectedClassData: (classData: Class) => void;
  setCurrentSchedule: (schedule: Schedule) => void;
  setHasExistingTimetable: (hasTimetable: boolean) => void;
  setIsLoadingTimetable: (loading: boolean) => void;
  setHasLoadedTimetable: (loaded: boolean) => void;
  setActiveTab: (tabIndex: number) => void;

  // Subject management
  setClassSubjects: (subjects: ClassSubject[]) => void;
  setAvailableSubjects: (subjects: Subject[]) => void;
  setIsLoadingSubjects: (loading: boolean) => void;

  // Teacher management
  setAvailableTeachers: (teachers: Teacher[]) => void;
  setIsLoadingTeachers: (loading: boolean) => void;

  // Edit mode toggle
  setIsEditMode: (isEditMode: boolean) => void;

  // Timeslot management
  addTimeSlot: (timeSlot: TimeSlot) => void;
  updateTimeSlot: (id: string, timeSlot: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: string) => void;
  setTimeSlots: (timeSlots: TimeSlot[]) => void;
  triggerTimetableReload: () => void;

  // Timetable management
  assignSubjectToSlot: (
    timeSlotId: string,
    day: string,
    subject: Subject,
  ) => void;
  assignTeacherToSlot: (slotId: string, teacher: Teacher) => void;
  removeAssignmentFromSlot: (slotId: string) => void;
  setTimetableSlots: (slots: TimetableSlot[]) => void;

  // Drag and drop
  setDraggedSubject: (subject: Subject | null) => void;
  setDropZoneHighlight: (zone: string | null) => void;

  // Teacher modal
  openTeacherModal: (slot: TimetableSlot) => void;
  closeTeacherModal: () => void;

  // Filters
  setSubjectFilter: (filter: string) => void;
  setTeacherFilter: (filter: string) => void;

  // Validation
  setValidationErrors: (errors: string[]) => void;
  setValidationWarnings: (warnings: string[]) => void;

  // Reset and save
  resetTimetable: () => void;
  resetAll: () => void;

  // Validation
  validateSchedule: () => { valid: boolean; errors: string[] };
}

// Default timeslots for schedule initialization
const defaultTimeSlots: TimeSlot[] = [
  {
    id: '1',
    day: 'Sunday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '2',
    day: 'Sunday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '3',
    day: 'Sunday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '4',
    day: 'Sunday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '5',
    day: 'Sunday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '6',
    day: 'Sunday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },

  {
    id: '7',
    day: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '8',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '9',
    day: 'Monday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '10',
    day: 'Monday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '11',
    day: 'Monday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '12',
    day: 'Monday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },

  {
    id: '13',
    day: 'Tuesday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '14',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '15',
    day: 'Tuesday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '16',
    day: 'Tuesday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '17',
    day: 'Tuesday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '18',
    day: 'Tuesday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },

  {
    id: '19',
    day: 'Wednesday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '20',
    day: 'Wednesday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '21',
    day: 'Wednesday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '22',
    day: 'Wednesday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '23',
    day: 'Wednesday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '24',
    day: 'Wednesday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },

  {
    id: '25',
    day: 'Thursday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '26',
    day: 'Thursday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '27',
    day: 'Thursday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '28',
    day: 'Thursday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '29',
    day: 'Thursday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '30',
    day: 'Thursday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },

  {
    id: '31',
    day: 'Friday',
    startTime: '08:00',
    endTime: '09:00',
    type: 'period',
  },
  {
    id: '32',
    day: 'Friday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'period',
  },
  {
    id: '33',
    day: 'Friday',
    startTime: '10:15',
    endTime: '11:15',
    type: 'period',
  },
  {
    id: '34',
    day: 'Friday',
    startTime: '11:15',
    endTime: '12:15',
    type: 'period',
  },
  {
    id: '35',
    day: 'Friday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'period',
  },
  {
    id: '36',
    day: 'Friday',
    startTime: '14:00',
    endTime: '15:00',
    type: 'period',
  },
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasLoadedTimetable: false,
      selectedClassId: null,
      selectedClass: null,
      selectedGrade: 0,
      selectedSection: '',
      currentSchedule: null,
      hasExistingTimetable: false,
      isLoadingTimetable: false,
      classSubjects: [],
      availableSubjects: [],
      isLoadingSubjects: false,
      availableTeachers: [],
      isLoadingTeachers: false,
      isEditMode: false,
      timeSlots: defaultTimeSlots,
      timetableSlots: [],
      draggedSubject: null,
      dropZoneHighlight: null,
      subjectFilter: '',
      teacherFilter: '',
      activeTab: 0,
      isTeacherModalOpen: false,
      selectedSlotForTeacher: null,
      validationErrors: [],
      validationWarnings: [],

      // Actions
      setSelectedClass: (classId: string) => {
        const normalized = classId && classId.trim().length ? classId : null;
        set({
          selectedClassId: normalized,
          // Clear any previously persisted class meta so TimetableBuilder won't treat stale data as valid
          selectedClass: null,
          classSubjects: [],
          availableSubjects: [],
          timetableSlots: [],
          validationErrors: [],
          validationWarnings: [],
          currentSchedule: null,
          hasLoadedTimetable: false,
        });
      },

      setSelectedClassData: (classData: Class) => {
        set({ selectedClass: classData });
      },

      setCurrentSchedule: (schedule: Schedule) => {
        set({ currentSchedule: schedule });
      },

      setHasExistingTimetable: (hasTimetable: boolean) => {
        set({ hasExistingTimetable: hasTimetable });
      },

      setIsLoadingTimetable: (loading: boolean) => {
        set({ isLoadingTimetable: loading });
      },

      setHasLoadedTimetable: (loaded: boolean) => {
        set({ hasLoadedTimetable: loaded });
      },

      setActiveTab: (tabIndex: number) => {
        // Preserve class selection when switching tabs
        set({ activeTab: tabIndex });
      },

      // Subject management
      setClassSubjects: (subjects: ClassSubject[]) => {
        set({ classSubjects: subjects });
      },

      setAvailableSubjects: (subjects: Subject[]) => {
        set({ availableSubjects: subjects });
      },

      setIsLoadingSubjects: (loading: boolean) => {
        set({ isLoadingSubjects: loading });
      },

      // Teacher management
      setAvailableTeachers: (teachers: Teacher[]) => {
        set({ availableTeachers: teachers });
      },

      setIsLoadingTeachers: (loading: boolean) => {
        set({ isLoadingTeachers: loading });
      },

      // Edit mode toggle
      setIsEditMode: (isEditMode: boolean) => {
        set({ isEditMode });
      },

      // Timeslot management
      addTimeSlot: (timeSlot: TimeSlot) => {
        set(state => ({
          timeSlots: [...state.timeSlots, timeSlot],
        }));
      },

      updateTimeSlot: (id: string, updatedSlot: Partial<TimeSlot>) => {
        set(state => ({
          timeSlots: state.timeSlots.map(slot =>
            slot.id === id ? { ...slot, ...updatedSlot } : slot,
          ),
        }));
      },

      removeTimeSlot: (id: string) => {
        set(state => ({
          timeSlots: state.timeSlots.filter(slot => slot.id !== id),
        }));
      },

      setTimeSlots: (timeSlots: TimeSlot[]) => {
        set({ timeSlots });
      },

      triggerTimetableReload: () => {
        set({ hasLoadedTimetable: false });
      },

      // Timetable management
      assignSubjectToSlot: (
        timeSlotId: string,
        day: string,
        subject: Subject,
      ) => {
        const baseTs = get().timeSlots.find(t => t.id === timeSlotId);
        const normalizedType = baseTs
          ? baseTs.type?.toLowerCase() === 'regular'
            ? 'regular'
            : baseTs.type?.toLowerCase() === 'period'
              ? 'regular'
              : baseTs.type?.toLowerCase()
          : 'regular';
        const existingSlotIndex = get().timetableSlots.findIndex(
          slot => slot.timeSlotId === timeSlotId && slot.day === day,
        );

        if (existingSlotIndex >= 0) {
          // Update existing slot
          set(state => ({
            timetableSlots: state.timetableSlots.map((slot, index) =>
              index === existingSlotIndex
                ? {
                    ...slot,
                    subjectId: subject.id,
                    teacherId: undefined,
                    roomId: undefined,
                    subject: {
                      id: subject.id,
                      name: subject.name,
                      code: subject.code,
                      description: subject.description,
                    },
                    teacher: undefined,
                    room: undefined,
                  }
                : slot,
            ),
          }));
        } else {
          // Create new slot
          const newSlot: TimetableSlot = {
            id: `temp-${Date.now()}`,
            scheduleId: get().currentSchedule?.id || '',
            timeSlotId,
            timeslotId: timeSlotId,
            day,
            subjectId: subject.id,
            teacherId: undefined,
            roomId: undefined,
            type: normalizedType || 'regular',
            hasConflict: false,
            subject: {
              id: subject.id,
              name: subject.name,
              code: subject.code,
              description: subject.description,
            },
          };

          set(state => ({
            timetableSlots: [...state.timetableSlots, newSlot],
          }));
        }
      },

      assignTeacherToSlot: async (slotId: string, teacher: Teacher) => {
        const state = get();
        const slot = state.timetableSlots.find(s => s.id === slotId);
        if (!slot) return;

        // Determine timeslot boundaries either from embedded timeslot or timeSlots list
        let startTime = slot.timeslot?.startTime;
        let endTime = slot.timeslot?.endTime;
        if (!startTime || !endTime) {
          const ts = state.timeSlots.find(t => t.id === slot.timeSlotId);
          startTime = ts?.startTime || '00:00';
          endTime = ts?.endTime || '00:00';
        }

        let hasConflict = false;
        try {
          const resp = await scheduleService.checkTeacherConflict({
            teacherId: teacher.id,
            day: slot.day,
            startTime,
            endTime,
            excludeSlotId: slot.id.startsWith('temp-') ? undefined : slot.id,
          });
          if (resp.success && resp.data) {
            hasConflict = resp.data.hasConflict;
          }
        } catch (e) {
          // Fallback: keep hasConflict false
          console.warn('Conflict check failed', e);
        }

        // If slot already persisted (not temp-) then call backend to persist teacher assignment
        if (!slot.id.startsWith('temp-')) {
          try {
            const resp = await timetableService.assignTeacherToSlot({
              slotId: slot.id,
              teacherId: teacher.id,
            });
            if (resp.success && resp.data) {
              const updated = resp.data;
              set(state2 => ({
                timetableSlots: state2.timetableSlots.map(s =>
                  s.id === slotId
                    ? {
                        ...s,
                        teacherId: updated.teacherId || teacher.id,
                        hasConflict: hasConflict || updated.hasConflict,
                        teacher: updated.teacher
                          ? {
                              id: updated.teacher.id,
                              userId: updated.teacher.userId,
                              employeeId:
                                updated.teacher.employeeId || undefined,
                              designation: updated.teacher.designation,
                              user: updated.teacher.user,
                            }
                          : {
                              id: teacher.id,
                              userId: teacher.userId,
                              employeeId: teacher.employeeId || undefined,
                              designation: teacher.designation,
                              user: teacher.user,
                            },
                      }
                    : s,
                ),
              }));
            } else {
              // Fallback local update if API fails
              set(state2 => ({
                timetableSlots: state2.timetableSlots.map(s =>
                  s.id === slotId
                    ? {
                        ...s,
                        teacherId: teacher.id,
                        hasConflict,
                        teacher: {
                          id: teacher.id,
                          userId: teacher.userId,
                          employeeId: teacher.employeeId || undefined,
                          designation: teacher.designation,
                          user: teacher.user,
                        },
                      }
                    : s,
                ),
              }));
            }
          } catch {
            set(state2 => ({
              timetableSlots: state2.timetableSlots.map(s =>
                s.id === slotId
                  ? {
                      ...s,
                      teacherId: teacher.id,
                      hasConflict,
                      teacher: {
                        id: teacher.id,
                        userId: teacher.userId,
                        employeeId: teacher.employeeId || undefined,
                        designation: teacher.designation,
                        user: teacher.user,
                      },
                    }
                  : s,
              ),
            }));
          }
        } else {
          // Temp slot: just update locally (will be persisted on bulk save)
          set(state2 => ({
            timetableSlots: state2.timetableSlots.map(s =>
              s.id === slotId
                ? {
                    ...s,
                    teacherId: teacher.id,
                    hasConflict,
                    teacher: {
                      id: teacher.id,
                      userId: teacher.userId,
                      employeeId: teacher.employeeId || undefined,
                      designation: teacher.designation,
                      user: teacher.user,
                    },
                  }
                : s,
            ),
          }));
        }
      },

      removeAssignmentFromSlot: (slotId: string) => {
        set(state => ({
          timetableSlots: state.timetableSlots.filter(
            slot => slot.id !== slotId,
          ),
        }));
      },

      setTimetableSlots: (slots: TimetableSlot[]) => {
        set({ timetableSlots: slots });
      },

      // Drag and drop
      setDraggedSubject: (subject: Subject | null) => {
        set({ draggedSubject: subject });
      },

      setDropZoneHighlight: (zone: string | null) => {
        set({ dropZoneHighlight: zone });
      },

      // Teacher modal
      openTeacherModal: (slot: TimetableSlot) => {
        set({
          isTeacherModalOpen: true,
          selectedSlotForTeacher: slot,
        });
      },

      closeTeacherModal: () => {
        set({
          isTeacherModalOpen: false,
          selectedSlotForTeacher: null,
        });
      },

      // Filters
      setSubjectFilter: (filter: string) => {
        set({ subjectFilter: filter });
      },

      setTeacherFilter: (filter: string) => {
        set({ teacherFilter: filter });
      },

      // Validation
      setValidationErrors: (errors: string[]) => {
        set({ validationErrors: errors });
      },

      setValidationWarnings: (warnings: string[]) => {
        set({ validationWarnings: warnings });
      },

      // Reset and save
      resetTimetable: () => {
        set({
          timetableSlots: [],
          validationErrors: [],
          validationWarnings: [],
        });
      },

      resetAll: () => {
        set({
          selectedClassId: null,
          selectedClass: null,
          classSubjects: [],
          availableSubjects: [],
          currentSchedule: null,
          hasExistingTimetable: false,
          timetableSlots: [],
          validationErrors: [],
          validationWarnings: [],
          activeTab: 0,
        });
      },

      // Validation
      validateSchedule: () => {
        const state = get();
        const errors: string[] = [];

        // Check for missing required assignments
        if (state.timetableSlots.length === 0) {
          errors.push('No subjects have been assigned to the timetable');
        }

        // Check for teacher conflicts (same teacher, same time, different classes)
        const teacherConflicts = new Map<string, TimetableSlot[]>();
        state.timetableSlots.forEach(slot => {
          if (slot.teacherId) {
            const key = `${slot.teacherId}-${slot.day}-${slot.timeSlotId}`;
            if (!teacherConflicts.has(key)) {
              teacherConflicts.set(key, []);
            }
            teacherConflicts.get(key)?.push(slot);
          }
        });

        teacherConflicts.forEach(slots => {
          if (slots.length > 1) {
            errors.push(
              `Teacher conflict detected on ${slots[0].day} at the same time`,
            );
          }
        });

        return {
          valid: errors.length === 0,
          errors,
        };
      },
    }),
    {
      name: 'schedule-store',
      partialize: state => ({
        selectedClassId: state.selectedClassId,
        selectedGrade: state.selectedGrade,
        selectedSection: state.selectedSection,
        currentSchedule: state.currentSchedule,
        hasExistingTimetable: state.hasExistingTimetable,
        timeSlots: state.timeSlots,
        timetableSlots: state.timetableSlots,
        activeTab: state.activeTab,
      }),
    },
  ),
);
