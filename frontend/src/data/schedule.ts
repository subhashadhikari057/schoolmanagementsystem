// Mock data types for the schedule builder
export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  employeeId: string;
  subjects: string[]; // IDs of subjects they can teach
  classes: string[]; // IDs of classes they can teach
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  gradeLevel: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  section: string;
  classTeacherId?: string;
}

export interface TimeSlot {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  startTime: string;
  endTime: string;
  type:
    | 'regular'
    | 'break'
    | 'lunch'
    | 'activity'
    | 'study_hall'
    | 'free_period';
  label?: string;
}

export interface TimetableSlot {
  id: string;
  timeSlotId: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  type:
    | 'regular'
    | 'break'
    | 'lunch'
    | 'activity'
    | 'study_hall'
    | 'free_period';
  hasConflict?: boolean;
}

export interface Room {
  id: string;
  roomNo: string;
  name?: string;
  floor: number;
  building?: string;
  capacity: number;
}

// Mock data for teachers
export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    fullName: 'Emma Thompson',
    email: 'emma.thompson@school.edu',
    employeeId: 'T001',
    subjects: ['subject-1', 'subject-2'],
    classes: ['class-1', 'class-2', 'class-3'],
  },
  {
    id: 'teacher-2',
    fullName: 'John Chen',
    email: 'john.chen@school.edu',
    employeeId: 'T002',
    subjects: ['subject-3', 'subject-4'],
    classes: ['class-1', 'class-2', 'class-4'],
  },
  {
    id: 'teacher-3',
    fullName: 'Sarah Wilson',
    email: 'sarah.wilson@school.edu',
    employeeId: 'T003',
    subjects: ['subject-2', 'subject-5'],
    classes: ['class-3', 'class-4', 'class-5'],
  },
  {
    id: 'teacher-4',
    fullName: 'Michael Rodriguez',
    email: 'michael.rodriguez@school.edu',
    employeeId: 'T004',
    subjects: ['subject-6', 'subject-7'],
    classes: ['class-1', 'class-5'],
  },
  {
    id: 'teacher-5',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@school.edu',
    employeeId: 'T005',
    subjects: ['subject-8', 'subject-9'],
    classes: ['class-2', 'class-3'],
  },
];

// Mock data for subjects
export const mockSubjects: Subject[] = [
  {
    id: 'subject-1',
    name: 'Mathematics',
    code: 'MATH',
    color: '#4F46E5',
    gradeLevel: 10,
  },
  {
    id: 'subject-2',
    name: 'English Literature',
    code: 'ENG',
    color: '#10B981',
    gradeLevel: 10,
  },
  {
    id: 'subject-3',
    name: 'Physics',
    code: 'PHY',
    color: '#F59E0B',
    gradeLevel: 10,
  },
  {
    id: 'subject-4',
    name: 'Chemistry',
    code: 'CHEM',
    color: '#EC4899',
    gradeLevel: 10,
  },
  {
    id: 'subject-5',
    name: 'Biology',
    code: 'BIO',
    color: '#06B6D4',
    gradeLevel: 10,
  },
  {
    id: 'subject-6',
    name: 'History',
    code: 'HIST',
    color: '#8B5CF6',
    gradeLevel: 10,
  },
  {
    id: 'subject-7',
    name: 'Geography',
    code: 'GEO',
    color: '#F97316',
    gradeLevel: 10,
  },
  {
    id: 'subject-8',
    name: 'Computer Science',
    code: 'CS',
    color: '#0EA5E9',
    gradeLevel: 10,
  },
  {
    id: 'subject-9',
    name: 'Physical Education',
    code: 'PE',
    color: '#84CC16',
    gradeLevel: 10,
  },
];

// Mock data for classes
export const mockClasses: ClassInfo[] = [
  {
    id: 'class-1',
    name: 'Grade 10 Section A',
    grade: 10,
    section: 'A',
    classTeacherId: 'teacher-1',
  },
  {
    id: 'class-2',
    name: 'Grade 10 Section B',
    grade: 10,
    section: 'B',
    classTeacherId: 'teacher-2',
  },
  {
    id: 'class-3',
    name: 'Grade 10 Section C',
    grade: 10,
    section: 'C',
    classTeacherId: 'teacher-3',
  },
  {
    id: 'class-4',
    name: 'Grade 11 Section A',
    grade: 11,
    section: 'A',
    classTeacherId: 'teacher-4',
  },
  {
    id: 'class-5',
    name: 'Grade 11 Section B',
    grade: 11,
    section: 'B',
    classTeacherId: 'teacher-5',
  },
];

// Mock data for rooms
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    roomNo: '101',
    name: 'Primary Wing',
    floor: 1,
    building: 'Main Building',
    capacity: 30,
  },
  {
    id: 'room-2',
    roomNo: '102',
    floor: 1,
    building: 'Main Building',
    capacity: 35,
  },
  {
    id: 'room-3',
    roomNo: '201',
    name: 'Math Lab',
    floor: 2,
    building: 'Main Building',
    capacity: 25,
  },
  {
    id: 'room-4',
    roomNo: '202',
    name: 'Science Lab',
    floor: 2,
    building: 'Science Wing',
    capacity: 30,
  },
  {
    id: 'room-5',
    roomNo: '301',
    name: 'Computer Lab',
    floor: 3,
    building: 'Tech Wing',
    capacity: 25,
  },
];

// Default time slots for each day
export const defaultTimeSlots: TimeSlot[] = [
  // Monday
  {
    id: 'timeslot-mon-1',
    day: 'monday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-mon-2',
    day: 'monday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-mon-3',
    day: 'monday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-mon-4',
    day: 'monday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-mon-5',
    day: 'monday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-mon-6',
    day: 'monday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'lunch',
    label: 'Lunch Break',
  },
  {
    id: 'timeslot-mon-7',
    day: 'monday',
    startTime: '12:30',
    endTime: '13:20',
    type: 'regular',
  },
  {
    id: 'timeslot-mon-8',
    day: 'monday',
    startTime: '13:20',
    endTime: '14:10',
    type: 'regular',
  },

  // Tuesday
  {
    id: 'timeslot-tue-1',
    day: 'tuesday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-tue-2',
    day: 'tuesday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-tue-3',
    day: 'tuesday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-tue-4',
    day: 'tuesday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-tue-5',
    day: 'tuesday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-tue-6',
    day: 'tuesday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'lunch',
    label: 'Lunch Break',
  },
  {
    id: 'timeslot-tue-7',
    day: 'tuesday',
    startTime: '12:30',
    endTime: '13:20',
    type: 'regular',
  },
  {
    id: 'timeslot-tue-8',
    day: 'tuesday',
    startTime: '13:20',
    endTime: '14:10',
    type: 'regular',
  },

  // Wednesday
  {
    id: 'timeslot-wed-1',
    day: 'wednesday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-wed-2',
    day: 'wednesday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-wed-3',
    day: 'wednesday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-wed-4',
    day: 'wednesday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-wed-5',
    day: 'wednesday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-wed-6',
    day: 'wednesday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'lunch',
    label: 'Lunch Break',
  },
  {
    id: 'timeslot-wed-7',
    day: 'wednesday',
    startTime: '12:30',
    endTime: '13:20',
    type: 'regular',
  },
  {
    id: 'timeslot-wed-8',
    day: 'wednesday',
    startTime: '13:20',
    endTime: '14:10',
    type: 'regular',
  },

  // Thursday
  {
    id: 'timeslot-thu-1',
    day: 'thursday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-thu-2',
    day: 'thursday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-thu-3',
    day: 'thursday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-thu-4',
    day: 'thursday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-thu-5',
    day: 'thursday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-thu-6',
    day: 'thursday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'lunch',
    label: 'Lunch Break',
  },
  {
    id: 'timeslot-thu-7',
    day: 'thursday',
    startTime: '12:30',
    endTime: '13:20',
    type: 'regular',
  },
  {
    id: 'timeslot-thu-8',
    day: 'thursday',
    startTime: '13:20',
    endTime: '14:10',
    type: 'regular',
  },

  // Friday
  {
    id: 'timeslot-fri-1',
    day: 'friday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-fri-2',
    day: 'friday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-fri-3',
    day: 'friday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-fri-4',
    day: 'friday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-fri-5',
    day: 'friday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-fri-6',
    day: 'friday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'lunch',
    label: 'Lunch Break',
  },
  {
    id: 'timeslot-fri-7',
    day: 'friday',
    startTime: '12:30',
    endTime: '13:20',
    type: 'regular',
  },
  {
    id: 'timeslot-fri-8',
    day: 'friday',
    startTime: '13:20',
    endTime: '14:10',
    type: 'activity',
    label: 'Assembly',
  },

  // Saturday (shorter day)
  {
    id: 'timeslot-sat-1',
    day: 'saturday',
    startTime: '08:00',
    endTime: '08:50',
    type: 'regular',
  },
  {
    id: 'timeslot-sat-2',
    day: 'saturday',
    startTime: '08:50',
    endTime: '09:40',
    type: 'regular',
  },
  {
    id: 'timeslot-sat-3',
    day: 'saturday',
    startTime: '09:40',
    endTime: '10:00',
    type: 'break',
    label: 'Morning Break',
  },
  {
    id: 'timeslot-sat-4',
    day: 'saturday',
    startTime: '10:00',
    endTime: '10:50',
    type: 'regular',
  },
  {
    id: 'timeslot-sat-5',
    day: 'saturday',
    startTime: '10:50',
    endTime: '11:40',
    type: 'regular',
  },
  {
    id: 'timeslot-sat-6',
    day: 'saturday',
    startTime: '11:40',
    endTime: '12:30',
    type: 'activity',
    label: 'Club Activities',
  },
];

// Initial empty timetable slots
export const initialTimetableSlots: TimetableSlot[] = [];

// Helper function to get a teacher by ID
export const getTeacherById = (id: string): Teacher | undefined => {
  return mockTeachers.find(teacher => teacher.id === id);
};

// Helper function to get a subject by ID
export const getSubjectById = (id: string): Subject | undefined => {
  return mockSubjects.find(subject => subject.id === id);
};

// Helper function to get a class by ID
export const getClassById = (id: string): ClassInfo | undefined => {
  return mockClasses.find(classInfo => classInfo.id === id);
};

// Helper function to get a room by ID
export const getRoomById = (id: string): Room | undefined => {
  return mockRooms.find(room => room.id === id);
};

// Helper function to get teachers who can teach a specific subject and class
export const getTeachersForSubjectAndClass = (
  subjectId: string,
  classId: string,
): Teacher[] => {
  return mockTeachers.filter(
    teacher =>
      teacher.subjects.includes(subjectId) && teacher.classes.includes(classId),
  );
};

// Helper function to check if a teacher is available at a specific time slot
export const isTeacherAvailable = (
  teacherId: string,
  day: string,
  startTime: string,
  endTime: string,
  currentTimetableSlots: TimetableSlot[],
  excludeSlotId?: string,
): boolean => {
  // Find all slots where this teacher is assigned
  const teacherSlots = currentTimetableSlots.filter(
    slot => slot.teacherId === teacherId && slot.id !== excludeSlotId,
  );

  // Check if any of those slots overlap with the current time
  for (const slot of teacherSlots) {
    if (slot.day === day) {
      const slotTimeSlot = defaultTimeSlots.find(
        ts => ts.id === slot.timeSlotId,
      );
      if (slotTimeSlot) {
        // Check for time overlap
        if (
          (startTime >= slotTimeSlot.startTime &&
            startTime < slotTimeSlot.endTime) ||
          (endTime > slotTimeSlot.startTime &&
            endTime <= slotTimeSlot.endTime) ||
          (startTime <= slotTimeSlot.startTime &&
            endTime >= slotTimeSlot.endTime)
        ) {
          return false; // Teacher is not available
        }
      }
    }
  }

  return true; // Teacher is available
};
