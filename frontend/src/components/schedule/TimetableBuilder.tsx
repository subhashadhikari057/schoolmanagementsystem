'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  User,
  Clock,
  Save,
  RotateCcw,
  AlertTriangle,
  UserPlus,
  Trash2,
  Plus,
  BookOpen,
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { scheduleService } from '@/api/services/schedule.service';
import { classService } from '@/api/services/class.service';
import { timeslotService } from '@/api/services/schedule.service';
import { toast } from 'sonner';

// Day labels for display
const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

// Period type colors
const periodTypeColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  regular: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  break: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
  },
  lunch: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  activity: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
  study_hall: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  free_period: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
  },
};

// Class Selection Component
function ClassSelector({
  onClassSelect,
}: {
  onClassSelect: (classId: string) => void;
}) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      } else {
        toast.error('Failed to load classes');
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4'></div>
        <p className='text-gray-600'>Loading classes...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <div className='text-center'>
          <BookOpen className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>
            No Classes Available
          </h2>
          <p className='text-gray-600 mb-6'>
            No classes have been created yet.
          </p>
          <button
            onClick={loadClasses}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center h-64'>
      <div className='text-center'>
        <BookOpen className='w-12 h-12 text-gray-400 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>
          Select a Class
        </h2>
        <p className='text-gray-600 mb-6'>
          Choose a class to view or create its timetable
        </p>

        {/* <select 
          onChange={(e) => onClassSelect(e.target.value)}
          className="w-80 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue=""
        >
          <option value="" disabled>Choose a class...</option>
          {classes.map(classItem => (
            <option key={classItem.id} value={classItem.id}>
              Grade {classItem.grade} Section {classItem.section}
            </option>
          ))}
        </select> */}
      </div>
    </div>
  );
}

// Create Timetable Prompt Component
function CreateTimetablePrompt({
  selectedClass,
  onCreate,
}: {
  selectedClass: any;
  onCreate: () => void;
}) {
  return (
    <div className='flex flex-col items-center justify-center h-64'>
      <div className='text-center'>
        <Plus className='w-12 h-12 text-blue-500 mx-auto mb-4' />
        <h2 className='text-xl font-semibold text-gray-800 mb-2'>
          No Timetable Found
        </h2>
        <p className='text-gray-600 mb-6'>
          Grade {selectedClass.grade} Section {selectedClass.section} doesn't
          have a timetable yet.
        </p>

        <button
          onClick={onCreate}
          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto'
        >
          <Plus className='w-4 h-4 mr-2' />
          Create Timetable
        </button>
      </div>
    </div>
  );
}

// Loading Component
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center h-64'>
      <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4'></div>
      <p className='text-gray-600'>{message}</p>
    </div>
  );
}

// Subject card component for drag overlay
function SubjectDragOverlay({ subject }: { subject: any }) {
  return (
    <div
      className='p-3 rounded-md border shadow-md'
      style={{
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        width: '150px',
      }}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='w-3 h-3 rounded-full mr-2 bg-blue-500'></div>
          <span className='font-medium text-sm'>{subject.name}</span>
        </div>
        <span className='text-xs text-gray-500 font-mono'>{subject.code}</span>
      </div>
    </div>
  );
}

// Timetable slot component
interface TimetableSlotProps {
  timeSlotId: string;
  day: string;
  timeSlot: any;
}

function TimetableSlotComponent({
  timeSlotId,
  day,
  timeSlot,
}: TimetableSlotProps) {
  const { timetableSlots, openTeacherModal, removeAssignmentFromSlot } =
    useScheduleStore();

  // Find if this slot has an assignment
  const slotAssignment = timetableSlots.find(
    slot => slot.timeSlotId === timeSlotId && slot.day === day,
  );

  // Determine if this is a special period type (break, lunch, etc.)
  const isSpecialPeriod = timeSlot.type !== 'regular';

  // Get styling based on period type
  const typeStyle = periodTypeColors[timeSlot.type] || periodTypeColors.regular;

  // Handle teacher assignment
  const handleAssignTeacher = () => {
    if (slotAssignment) {
      openTeacherModal(slotAssignment);
    }
  };

  // Handle removing assignment
  const handleRemoveAssignment = () => {
    if (slotAssignment) {
      removeAssignmentFromSlot(slotAssignment.id);
    }
  };

  // For special periods like breaks and lunch
  if (isSpecialPeriod) {
    return (
      <div
        className={`h-full w-full rounded-md border ${typeStyle.bg} ${typeStyle.border} flex flex-col justify-between p-2`}
      >
        <div className='font-medium text-sm'>
          {timeSlot.label || timeSlot.type.replace('_', ' ')}
        </div>
        <div className='text-xs text-gray-500 mt-auto'>
          {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
        </div>
      </div>
    );
  }

  // For regular periods - either empty or with subject assignment
  return (
    <div
      className={`h-full w-full rounded-md border ${
        slotAssignment?.subjectId
          ? 'border-gray-200'
          : 'border-dashed border-gray-300 bg-gray-50'
      } flex flex-col justify-between p-2`}
      data-timeslot-id={timeSlotId}
      data-day={day}
    >
      {slotAssignment?.subjectId ? (
        // Subject is assigned
        <>
          <div className='flex justify-between items-start'>
            <div className='font-medium text-sm text-blue-700'>
              {slotAssignment.subjectName || 'Subject'}
            </div>
            <span className='text-xs bg-gray-100 px-1 rounded'>
              {slotAssignment.subjectCode || 'SUB'}
            </span>
          </div>

          <div className='mt-2 text-xs text-gray-600 flex items-center'>
            {slotAssignment.teacherId ? (
              <>
                <User className='w-3 h-3 mr-1' />
                {slotAssignment.teacherName || 'Teacher'}
              </>
            ) : (
              <button
                onClick={handleAssignTeacher}
                className='flex items-center text-blue-600 hover:text-blue-800'
              >
                <UserPlus className='w-3 h-3 mr-1' />
                Assign Teacher
              </button>
            )}
          </div>

          <div className='mt-1 text-xs text-gray-500'>
            {slotAssignment.roomId
              ? `Room ${slotAssignment.roomName || slotAssignment.roomId}`
              : 'No room assigned'}
          </div>

          <div className='flex justify-between items-center mt-2 pt-1 border-t border-gray-100'>
            {slotAssignment?.hasConflict && (
              <div className='text-xs text-red-600 flex items-center'>
                <AlertTriangle className='w-3 h-3 mr-1' />
                Conflict
              </div>
            )}

            <button
              onClick={handleRemoveAssignment}
              className='ml-auto text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50'
            >
              <Trash2 className='w-3 h-3' />
            </button>
          </div>
        </>
      ) : (
        // Empty slot
        <div className='text-xs text-gray-400 flex flex-col items-center justify-center h-full'>
          <div>Drop subject here</div>
          <div className='mt-1'>
            {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
          </div>
        </div>
      )}
    </div>
  );
}

// Format time for display (e.g., "08:30" to "8:30 AM")
function formatTime(time?: string): string {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch (e) {
    return time;
  }
}

export default function TimetableBuilder() {
  const {
    timeSlots,
    timetableSlots,
    assignSubjectToSlot,
    resetTimetable,
    validateSchedule,
    selectedClassId,
    selectedClass,
    currentSchedule,
    hasExistingTimetable,
    isLoadingTimetable,
    setSelectedClass,
    setSelectedClassData,
    setCurrentSchedule,
    setHasExistingTimetable,
    setIsLoadingTimetable,
    setTimeSlots,
    setTimetableSlots,
  } = useScheduleStore();

  // Component state
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isCreatingTimetable, setIsCreatingTimetable] = useState(false);
  const [hasLoadedTimetable, setHasLoadedTimetable] = useState(false);

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<any | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load timetable when class is selected
  useEffect(() => {
    if (selectedClassId && !isLoadingTimetable && !hasLoadedTimetable) {
      loadTimetableForClass(selectedClassId);
    }
  }, [selectedClassId, hasLoadedTimetable]);

  // Load available classes
  const loadClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setAvailableClasses(response.data);
      } else {
        toast.error('Failed to load classes');
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Handle class selection
  const handleClassSelect = (classId: string) => {
    const classData = availableClasses.find(c => c.id === classId);
    if (classData) {
      setSelectedClassData(classData);
      setSelectedClass(classId);
      setHasExistingTimetable(false);
      setCurrentSchedule(null);
      setHasLoadedTimetable(false);
    }
  };

  // Load timetable for selected class
  const loadTimetableForClass = async (classId: string) => {
    if (!classId) return; // Don't proceed if no class ID

    setIsLoadingTimetable(true);
    try {
      // Check if timetable exists
      const schedulesResponse =
        await scheduleService.getSchedulesByClass(classId);
      if (
        schedulesResponse.success &&
        schedulesResponse.data &&
        schedulesResponse.data.length > 0
      ) {
        const activeSchedule = schedulesResponse.data.find(
          s => s.status === 'active',
        );
        if (activeSchedule) {
          // Load existing timetable
          const timetableResponse = await scheduleService.getScheduleById(
            activeSchedule.id,
          );
          if (timetableResponse.success && timetableResponse.data) {
            setCurrentSchedule(activeSchedule);
            // Update store with timetable slots
            if (timetableResponse.data.slots) {
              // Transform backend data to match our interface
              const transformedSlots = timetableResponse.data.slots.map(
                (slot: any) => ({
                  id: slot.id,
                  timeSlotId: slot.timeslotId || slot.timeSlotId,
                  day: slot.day,
                  subjectId: slot.subjectId,
                  teacherId: slot.teacherId,
                  roomId: slot.roomId,
                  type: slot.type,
                  hasConflict: slot.hasConflict,
                  subjectName: slot.subject?.name,
                  subjectCode: slot.subject?.code,
                  teacherName: slot.teacher?.fullName,
                  roomName: slot.room?.roomNo,
                }),
              );
              setTimetableSlots(transformedSlots);
            }
            setHasExistingTimetable(true);
            toast.success('Timetable loaded successfully');
          }
        }
      }

      // Try to load timeslots with proper error handling
      // Verify the classId isn't a mock ID (like "class-3")
      if (classId.startsWith('class-')) {
        console.info('Skipping API call for mock class ID:', classId);
        setTimeSlots([]);
      } else {
        try {
          const timeslotsResponse =
            await timeslotService.getTimeslotsByClass(classId);
          if (timeslotsResponse.success && timeslotsResponse.data) {
            // Transform backend data to match our interface
            const transformedTimeSlots = timeslotsResponse.data.map(
              (slot: any) => ({
                id: slot.id,
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                type: slot.type,
                label: slot.label,
                classId: slot.classId,
              }),
            );
            setTimeSlots(transformedTimeSlots);
          } else {
            // If response is not successful, set empty array
            setTimeSlots([]);
          }
        } catch (timeslotError: any) {
          // For any error, just set empty timeslots and continue
          console.info('Could not load timeslots, using empty array');
          setTimeSlots([]);
        }
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      toast.error('Failed to load timetable');
    } finally {
      setIsLoadingTimetable(false);
      setHasLoadedTimetable(true);
    }
  };

  // Create new timetable
  const handleCreateTimetable = async () => {
    if (!selectedClassId) return;

    setIsCreatingTimetable(true);
    try {
      const today = new Date();
      const endOfYear = new Date(today.getFullYear() + 1, 11, 31);

      const createResponse = await scheduleService.createSchedule({
        classId: selectedClassId,
        name: `Grade ${selectedClass?.grade} Section ${selectedClass?.section} Schedule`,
        academicYear: `${today.getFullYear()}-${today.getFullYear() + 1}`,
        startDate: today.toISOString(),
        endDate: endOfYear.toISOString(),
        effectiveFrom: today.toISOString(),
        status: 'draft',
      });

      if (createResponse.success && createResponse.data) {
        setCurrentSchedule(createResponse.data);
        setHasExistingTimetable(true);
        toast.success('Timetable created successfully');
      } else {
        toast.error(createResponse.message || 'Failed to create timetable');
      }
    } catch (error) {
      console.error('Error creating timetable:', error);
      toast.error('Failed to create timetable');
    } finally {
      setIsCreatingTimetable(false);
    }
  };

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Group timeslots by day for the timetable grid
  const timeSlotsByDay = useMemo(() => {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    const result: Record<string, any[]> = {};

    // Initialize empty arrays for each day
    days.forEach(day => {
      result[day] = [];
    });

    // Group timeslots by day
    timeSlots.forEach(slot => {
      if (result[slot.day]) {
        result[slot.day].push(slot);
      }
    });

    // Sort timeslots by start time for each day
    Object.keys(result).forEach(day => {
      result[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return result;
  }, [timeSlots]);

  // Get unique timeslots across all days (for column headers)
  const uniqueTimeSlots = useMemo(() => {
    const slots = new Map<string, any>();

    // Collect all unique time ranges
    timeSlots.forEach(slot => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!slots.has(key)) {
        slots.set(key, slot);
      }
    });

    // Convert to array and sort by start time
    return Array.from(slots.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [timeSlots]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);

    // If dragging a subject from the library
    if (active.id.toString().startsWith('subject-')) {
      const subjectId = active.id.toString().replace('subject-', '');
      // Use data from the active element
      const subject = active.data.current?.subject || {
        id: subjectId,
        name: 'Subject',
        code: 'SUB',
      };
      setActiveSubject(subject);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveSubject(null);

    // Only process if we have a valid drop target
    if (over && over.data.current) {
      // If dragging a subject from the library
      if (active.id.toString().startsWith('subject-')) {
        const subjectId = active.id.toString().replace('subject-', '');
        const timeSlotId = over.data.current.timeSlotId as string;
        const day = over.data.current.day as string;

        if (subjectId && timeSlotId && day) {
          assignSubjectToSlot(timeSlotId, day, subjectId);
        }
      }
    }
  };

  // Run validation
  const handleValidate = () => {
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 5000);
  };

  // Get validation results
  const validationResults = validateSchedule();

  // Render based on state
  if (isLoadingClasses) {
    return (
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6'>
          <LoadingSpinner message='Loading classes...' />
        </div>
      </div>
    );
  }

  if (!selectedClassId) {
    return (
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6'>
          <ClassSelector onClassSelect={handleClassSelect} />
        </div>
      </div>
    );
  }

  if (isLoadingTimetable) {
    return (
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6'>
          <LoadingSpinner message='Loading timetable...' />
        </div>
      </div>
    );
  }

  if (!hasExistingTimetable) {
    return (
      <div className='bg-white rounded-lg shadow'>
        <div className='p-6'>
          <CreateTimetablePrompt
            selectedClass={selectedClass}
            onCreate={handleCreateTimetable}
          />
        </div>
      </div>
    );
  }

  // Main timetable builder interface
  return (
    <div className='bg-white rounded-lg shadow'>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-xl font-semibold text-gray-800 flex items-center'>
                <Clock className='w-5 h-5 mr-2' />
                Timetable Builder
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                Grade {selectedClass?.grade} Section {selectedClass?.section}
              </p>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={handleValidate}
                className='px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center'
                disabled={isCreatingTimetable || isSaving}
              >
                <AlertTriangle className='w-4 h-4 mr-2' />
                Validate
              </button>
              <button
                onClick={resetTimetable}
                className='px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors flex items-center'
                disabled={isCreatingTimetable || isSaving}
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                Reset
              </button>
              <button
                onClick={async () => {
                  if (!selectedClassId) {
                    toast.error('No class selected');
                    return;
                  }

                  // Validate the schedule first
                  const validation = validateSchedule();
                  if (!validation.valid) {
                    toast.error(
                      'Schedule has conflicts. Please resolve them before saving.',
                    );
                    setShowValidation(true);
                    return;
                  }

                  setIsSaving(true);
                  try {
                    // If we have a current schedule, update it
                    if (currentSchedule) {
                      // TODO: Implement saving existing schedule
                      toast.success('Schedule updated successfully');
                    } else {
                      // Create a new schedule
                      const today = new Date();
                      const endOfYear = new Date(
                        today.getFullYear() + 1,
                        11,
                        31,
                      );

                      const createResponse =
                        await scheduleService.createSchedule({
                          classId: selectedClassId,
                          name: `${selectedClassId} Schedule`,
                          academicYear: `${today.getFullYear()}-${today.getFullYear() + 1}`,
                          startDate: today.toISOString(),
                          endDate: endOfYear.toISOString(),
                          effectiveFrom: today.toISOString(),
                          status: 'draft',
                        });

                      if (createResponse.success && createResponse.data) {
                        setCurrentSchedule(createResponse.data);
                        toast.success('Schedule created successfully');

                        // TODO: Save all the timetable slots
                      } else {
                        toast.error(
                          createResponse.message || 'Failed to create schedule',
                        );
                      }
                    }
                  } catch (error) {
                    console.error('Error saving schedule:', error);
                    toast.error('Failed to save schedule');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center'
                disabled={isCreatingTimetable || isSaving}
              >
                {isSaving ? (
                  <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2'></span>
                ) : (
                  <Save className='w-4 h-4 mr-2' />
                )}
                {isSaving ? 'Saving...' : 'Save Timetable'}
              </button>
            </div>
          </div>

          {/* Validation Messages */}
          {showValidation && (
            <div
              className={`mb-6 p-4 rounded-md ${
                validationResults.valid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className='flex'>
                <div className='flex-shrink-0'>
                  {validationResults.valid ? (
                    <div className='h-5 w-5 text-green-400'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  ) : (
                    <AlertTriangle className='h-5 w-5 text-yellow-400' />
                  )}
                </div>
                <div className='ml-3'>
                  <h3
                    className={`text-sm font-medium ${
                      validationResults.valid
                        ? 'text-green-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {validationResults.valid
                      ? 'Timetable validation passed!'
                      : 'Timetable has validation issues'}
                  </h3>
                  {!validationResults.valid &&
                    validationResults.errors.length > 0 && (
                      <div className='mt-2 text-sm text-yellow-700'>
                        <ul className='list-disc pl-5 space-y-1'>
                          {validationResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Timetable Grid */}
          <div className='overflow-x-auto'>
            <table className='min-w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='p-2 border border-gray-200 w-24'>
                    Day / Time
                  </th>
                  {uniqueTimeSlots.map(slot => (
                    <th
                      key={`${slot.startTime}-${slot.endTime}`}
                      className='p-2 border border-gray-200 min-w-[180px]'
                    >
                      <div className='font-medium text-sm'>
                        {formatTime(slot.startTime)} -{' '}
                        {formatTime(slot.endTime)}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {slot.type !== 'regular' &&
                          (slot.label || slot.type.replace('_', ' '))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(timeSlotsByDay).map(([day, slots]) => {
                  // Skip days with no timeslots
                  if (slots.length === 0) return null;

                  return (
                    <tr key={day}>
                      <td className='p-2 border border-gray-200 font-medium'>
                        {dayLabels[day]}
                      </td>
                      {uniqueTimeSlots.map(uniqueSlot => {
                        // Find matching slot for this day and time
                        const matchingSlot = slots.find(
                          s =>
                            s.startTime === uniqueSlot.startTime &&
                            s.endTime === uniqueSlot.endTime,
                        );

                        // If no matching slot for this day, render empty cell
                        if (!matchingSlot) {
                          return (
                            <td
                              key={`${day}-${uniqueSlot.startTime}`}
                              className='border border-gray-200'
                            ></td>
                          );
                        }

                        return (
                          <td
                            key={`${day}-${matchingSlot.id}`}
                            className='border border-gray-200 p-1 h-24'
                          >
                            <TimetableSlotComponent
                              timeSlotId={matchingSlot.id}
                              day={day}
                              timeSlot={matchingSlot}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>Legend</h3>
            <div className='flex flex-wrap gap-4'>
              {Object.entries(periodTypeColors).map(([type, colors]) => (
                <div key={type} className='flex items-center'>
                  <div
                    className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border mr-1`}
                  ></div>
                  <span className='text-xs text-gray-600 capitalize'>
                    {type.replace('_', ' ')}
                  </span>
                </div>
              ))}
              <div className='flex items-center'>
                <AlertTriangle className='w-3 h-3 text-red-500 mr-1' />
                <span className='text-xs text-gray-600'>Conflict</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeSubject && <SubjectDragOverlay subject={activeSubject} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
