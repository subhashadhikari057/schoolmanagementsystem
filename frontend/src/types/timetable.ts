// Enum definitions for timetable management
export enum PeriodType {
  REGULAR = 'regular',
  BREAK = 'break',
  LUNCH = 'lunch',
  STUDY_HALL = 'study_hall',
  ACTIVITY = 'activity',
  FREE_PERIOD = 'free_period',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

export enum SubjectType {
  CORE = 'core',
  ELECTIVE = 'elective',
  LAB = 'lab',
  ACTIVITY = 'activity',
  BREAK = 'break',
}

// Type definitions for timetable data structures
export interface TimetableViewerProps {
  classId: string;
  sectionId: string;
  initialGrade: string;
  initialSection: string;
  onGradeChange?: (grade: string) => void;
  onSectionChange?: (section: string) => void;
  onExport?: (format: 'pdf' | 'excel') => void;
  onCreateSchedule?: () => void;
  onBulkManage?: () => void;
  readOnly?: boolean;
}

export interface TimetableStoreState {
  selectedGrade: string;
  selectedSection: string;
  currentWeek: Date;
  viewMode: 'week' | 'day';
}

export interface TimetableData {
  classId: string;
  sectionId: string;
  grade: string;
  section: string;
  classTeacher: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  room: string;
  weeklyHours: number;
  totalSubjects: number;
  lastUpdated: Date;
  schedule: TimeSlotData[];
}

export interface TimeSlotData {
  timeSlot: string;
  periods: {
    monday?: PeriodData;
    tuesday?: PeriodData;
    wednesday?: PeriodData;
    thursday?: PeriodData;
    friday?: PeriodData;
    saturday?: PeriodData;
  };
}

export interface PeriodData {
  id: string;
  subject: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  room: string;
  type:
    | 'regular'
    | 'break'
    | 'lunch'
    | 'study_hall'
    | 'activity'
    | 'free_period';
}
