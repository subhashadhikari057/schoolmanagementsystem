import React, { useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  Clock,
  User,
  BookOpen,
  Edit3,
  Trash2,
  AlertTriangle,
  Coffee,
  Utensils,
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  type: string; // 'regular' | 'period' | 'REGULAR' | 'break' | 'BREAK' | 'lunch' | 'LUNCH'
  label?: string;
  classId?: string;
}

interface TimetableSlot {
  id: string;
  scheduleId: string;
  timeSlotId: string;
  timeslotId: string;
  day: string;
  subjectId?: string;
  teacherId?: string;
  roomId?: string;
  type: string;
  hasConflict?: boolean;
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

interface DroppableCellProps {
  timeSlot: TimeSlot;
  assignment?: TimetableSlot;
  isEditMode: boolean;
  onAssignTeacher: (slot: TimetableSlot) => void;
  onRemoveAssignment: (slotId: string) => void;
}

const DroppableCell: React.FC<DroppableCellProps> = ({
  timeSlot,
  assignment,
  isEditMode,
  onAssignTeacher,
  onRemoveAssignment,
}) => {
  const { dropZoneHighlight } = useScheduleStore();
  // Ensure the day is properly normalized for consistent dropId generation
  const normalizedDay =
    timeSlot.day.charAt(0).toUpperCase() + timeSlot.day.slice(1).toLowerCase();
  const dropId = `${normalizedDay}-${timeSlot.id}`;

  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    disabled: !isEditMode, // Only allow drops in edit mode
    data: {
      type: 'timeslot',
      timeSlot: {
        ...timeSlot,
        day: normalizedDay, // Ensure consistent day format
      },
      day: normalizedDay,
      timeSlotId: timeSlot.id,
    },
  });

  const isHighlighted = dropZoneHighlight === dropId || isOver;

  // Determine cell type and styling
  // Normalize type casing
  const slotType = timeSlot.type?.toLowerCase();
  const isBreakTime = slotType === 'break';
  const isLunchTime = slotType === 'lunch';
  const isRegular = slotType === 'regular' || slotType === 'period';
  const hasAssignment = !!assignment;

  const getCellContent = () => {
    if (isBreakTime) {
      return (
        <div className='flex items-center justify-center h-full text-orange-600'>
          <Coffee className='w-4 h-4 mr-2' />
          <span className='text-sm font-medium'>Break</span>
        </div>
      );
    }

    if (isLunchTime) {
      return (
        <div className='flex items-center justify-center h-full text-green-600'>
          <Utensils className='w-4 h-4 mr-2' />
          <span className='text-sm font-medium'>Lunch</span>
        </div>
      );
    }

    if (!hasAssignment && isRegular) {
      return (
        <div className='flex items-center justify-center h-full text-gray-400'>
          <div className='text-center'>
            <BookOpen className='w-6 h-6 mx-auto mb-1 opacity-50' />
            <p className='text-xs'>Drop subject here</p>
          </div>
        </div>
      );
    }

    if (!hasAssignment && !isRegular) {
      return (
        <div className='flex items-center justify-center h-full text-gray-300'>
          <p className='text-[10px] uppercase tracking-wide'>
            {timeSlot.label || slotType}
          </p>
        </div>
      );
    }

    return assignment ? (
      <div className='p-3 h-full'>
        {/* Subject Info */}
        <div className='flex items-center justify-between mb-2'>
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900 truncate'>
              {assignment.subject?.name || 'Unknown Subject'}
            </h4>
            <p className='text-xs text-gray-600'>
              {assignment.subject?.code || 'N/A'}
            </p>
          </div>

          {/* Conflict Warning */}
          {assignment.hasConflict && (
            <AlertTriangle className='w-4 h-4 text-amber-500 flex-shrink-0' />
          )}
        </div>

        {/* Teacher Info */}
        <div className='mb-2'>
          {assignment.teacher ? (
            <div className='flex items-center text-xs text-blue-600'>
              <User className='w-3 h-3 mr-1 flex-shrink-0' />
              <span className='truncate'>
                {assignment.teacher.user.fullName}
              </span>
            </div>
          ) : isEditMode ? (
            <button
              onClick={() =>
                assignment && isEditMode && onAssignTeacher(assignment)
              }
              className='flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors'
            >
              <User className='w-3 h-3 mr-1' />
              <span>Assign Teacher</span>
            </button>
          ) : (
            <div className='text-xs text-gray-400 italic flex items-center'>
              <User className='w-3 h-3 mr-1' />
              <span>No teacher</span>
            </div>
          )}
        </div>

        {/* Room Info */}
        {assignment.room && (
          <div className='flex items-center text-xs text-gray-600 mb-2'>
            <span>Room: {assignment.room.roomNo}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isEditMode && (
          <div className='flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button
              onClick={() => assignment && onAssignTeacher(assignment)}
              className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
              title='Edit assignment'
            >
              <Edit3 className='w-3 h-3' />
            </button>
            <button
              onClick={() => assignment && onRemoveAssignment(assignment.id)}
              className='p-1 text-gray-400 hover:text-red-600 transition-colors'
              title='Remove assignment'
            >
              <Trash2 className='w-3 h-3' />
            </button>
          </div>
        )}
      </div>
    ) : null;
  };

  const getCellClassName = () => {
    const baseClasses = `
      relative border border-gray-200 transition-all duration-200 group
      min-h-[80px] flex flex-col
    `;

    if (isBreakTime || isLunchTime) {
      return `${baseClasses} bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300`;
    }

    if (isHighlighted) {
      return `${baseClasses} bg-blue-50 border-blue-300 border-2 shadow-sm`;
    }

    if (hasAssignment) {
      const conflictClasses = assignment?.hasConflict
        ? 'bg-amber-50 border-amber-200'
        : 'bg-green-50 border-green-200';
      return `${baseClasses} ${conflictClasses} hover:shadow-sm`;
    }
    if (isRegular) {
      return `${baseClasses} bg-white hover:bg-blue-50 border-dashed`;
    }
    return `${baseClasses} bg-gray-50`;
  };

  return (
    <td ref={setNodeRef} className={getCellClassName()}>
      {getCellContent()}
    </td>
  );
};

export const TimetableGrid: React.FC = () => {
  const {
    timeSlots,
    timetableSlots,
    isEditMode,
    openTeacherModal,
    removeAssignmentFromSlot,
  } = useScheduleStore();

  const [groupedTimeSlots, setGroupedTimeSlots] = useState<
    Record<string, TimeSlot[]>
  >({});

  // Helpers: normalize day/time for robust comparisons
  const normalizeDayName = (d: string) => {
    if (!d) return d;
    const lower = d.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };
  const normalizeTime = (t?: string) => {
    if (!t) return '';
    const trimmed = t.trim();
    // Match H:mm, HH:mm, H:mm:ss, HH:mm:ss
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const hour = match[1].padStart(2, '0');
      const minute = match[2];
      return `${hour}:${minute}`;
    }
    // Fallback: if in ISO or other format, try first 5 chars if it resembles time
    if (/^\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 5);
    return trimmed;
  };

  // Group time slots by day (normalize casing)
  useEffect(() => {
    // Fallback: derive synthetic timeslots from timetableSlots if backend timeslots not loaded
    let source = timeSlots;
    if (source.length === 0 && timetableSlots.length > 0) {
      const synthetic: TimeSlot[] = timetableSlots
        .filter(s => s.timeslot)
        .map(s => {
          // CRITICAL FIX: Use schedule slot's day first, then fall back to timeslot's day
          // This ensures Monday slots don't get overridden by Sunday timeslot day
          const correctDay = s.day || s.timeslot?.day || 'Monday';
          const normalizedDay =
            correctDay.charAt(0).toUpperCase() +
            correctDay.slice(1).toLowerCase();

          return {
            id: s.timeSlotId,
            day: normalizedDay,
            startTime: s.timeslot?.startTime || '00:00',
            endTime: s.timeslot?.endTime || '00:00',
            type:
              (s.timeslot?.type?.toLowerCase() === 'regular'
                ? 'regular'
                : s.timeslot?.type?.toLowerCase()) || 'regular',
            label: s.timeslot?.label || undefined,
            classId: s.timeslot?.id,
          };
        });

      // Deduplicate by day + time only (ID-independent) to preserve identical periods on different days
      const seen = new Set<string>();
      source = synthetic.filter(ts => {
        const compositeKey = `${ts.day}-${normalizeTime(ts.startTime)}-${normalizeTime(ts.endTime)}`;
        if (seen.has(compositeKey)) return false;
        seen.add(compositeKey);
        return true;
      });
    }

    const normalizeDay = normalizeDayName;

    // Completely revamped grouping logic to ensure day-specific timeslots
    const grouped = source.reduce(
      (acc, slot) => {
        // Ensure we have a valid day - this is critical
        if (!slot.day) {
          console.warn('Timeslot missing day information:', slot);
          return acc;
        }

        // Normalize day name for consistent lookup
        const dayKey = normalizeDay(slot.day);

        // Normalize slot type for consistent display
        const normalizedType =
          slot.type?.toLowerCase() === 'regular' || slot.type === 'REGULAR'
            ? 'regular'
            : slot.type?.toLowerCase() === 'period'
              ? 'regular'
              : slot.type?.toLowerCase();

        // Create a normalized timeslot with proper day and type values
        const normalized: TimeSlot = {
          ...slot,
          day: dayKey,
          // Persist times in HH:mm to avoid HH:mm:ss mismatches
          startTime: normalizeTime(slot.startTime),
          endTime: normalizeTime(slot.endTime),
          type: normalizedType || slot.type,
        };

        // Initialize array for this day if it doesn't exist
        if (!acc[dayKey]) acc[dayKey] = [];

        // Check if this exact timeslot already exists for this day
        const existingSlotIndex = acc[dayKey].findIndex(
          existing =>
            existing.id === slot.id &&
            existing.startTime === normalizeTime(slot.startTime) &&
            existing.endTime === normalizeTime(slot.endTime),
        );

        // Replace if exists, otherwise add
        if (existingSlotIndex >= 0) {
          acc[dayKey][existingSlotIndex] = normalized;
        } else {
          // Add the timeslot to its specific day
          acc[dayKey].push(normalized);
        }

        return acc;
      },
      {} as Record<string, TimeSlot[]>,
    );

    // Sort timeslots by start time within each day
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    setGroupedTimeSlots(grouped);
  }, [timeSlots, timetableSlots]);

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  // CRITICAL FIX: Ensure availableDays maintains the predefined order regardless of groupedTimeSlots key order
  const availableDays = days.filter(
    day => (groupedTimeSlots[day]?.length || 0) > 0,
  );

  // Build a simple lookup: period -> day -> timeslot
  // CRITICAL: Use availableDays order to ensure consistent column ordering
  const periodToDaySlots: Record<string, Record<string, TimeSlot>> = {};
  availableDays.forEach(day => {
    const daySlots = groupedTimeSlots[day] || [];
    daySlots.forEach(slot => {
      const period = `${normalizeTime(slot.startTime)}-${normalizeTime(slot.endTime)}`;
      if (!periodToDaySlots[period]) periodToDaySlots[period] = {};
      periodToDaySlots[period][day] = slot;
    });
  });

  // All unique periods across days
  const uniqueTimePeriods = Object.keys(periodToDaySlots).sort();

  const getAssignmentForSlot = (
    day: string,
    timeSlotId: string,
  ): TimetableSlot | undefined => {
    // Ensure we only match slots that have an actual subject assigned
    // This prevents "Unknown Subject" placeholders from appearing
    return timetableSlots.find(slot => {
      // Use the day from the timeslot data, not from the schedule slot
      // This ensures we get the correct day information
      const correctDay = slot.timeslot?.day || slot.day;
      return (
        correctDay.toLowerCase() === day.toLowerCase() &&
        slot.timeSlotId === timeSlotId &&
        slot.subjectId
      ); // Only return slots with an actual subject assigned
    });
  };

  // Modified to ensure we only return timeslots that exactly match the day and time period
  const getTimeSlotForPeriod = (
    day: string,
    period: string,
  ): TimeSlot | undefined => {
    const normalizedDay = normalizeDayName(day);
    return periodToDaySlots[period]?.[normalizedDay];
  };

  if (availableDays.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-8'>
        <div className='text-center'>
          <Clock className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-4 text-sm font-medium text-gray-900'>
            No Schedule Template
          </h3>
          <p className='mt-2 text-sm text-gray-500'>
            Create time slots to start building your timetable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Weekly Timetable
          </h2>
          <div className='flex items-center space-x-2'>
            {isEditMode && (
              <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800'>
                Edit Mode
              </span>
            )}
            <span className='text-sm text-gray-500'>
              {availableDays.length} days
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className='overflow-x-auto'>
        <table className='w-full'>
          {/* Table Header */}
          <thead className='bg-gray-50'>
            <tr>
              <th className='w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Time
              </th>
              {availableDays.map(day => (
                <th
                  key={day}
                  className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0'
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body - Simplified and Fixed */}
          <tbody className='bg-white divide-y divide-gray-200'>
            {/* We now iterate through our unique time periods list */}
            {uniqueTimePeriods.map(period => {
              const [startTime, endTime] = period.split('-');

              return (
                <tr key={`period-${period}`} className='hover:bg-gray-50'>
                  {/* Time Column */}
                  <td className='w-24 px-4 py-2 border-r border-gray-200 bg-gray-50'>
                    <div className='text-center'>
                      <div className='text-xs font-medium text-gray-900'>
                        {startTime.slice(0, 5)}
                      </div>
                      <div className='text-xs text-gray-700'>
                        {endTime.slice(0, 5)}
                      </div>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {availableDays.map(day => {
                    // Check if this day has this specific time period
                    const hasPeriod = !!periodToDaySlots[period]?.[day];

                    // If this day doesn't have this period, render an empty cell
                    if (!hasPeriod) {
                      return (
                        <td
                          key={`${day}-empty-${period}`}
                          className='border-r border-gray-200 last:border-r-0 bg-gray-100 min-h-[80px]'
                        >
                          <div className='flex items-center justify-center h-20 text-gray-400'>
                            <span className='text-xs'>No Slot</span>
                          </div>
                        </td>
                      );
                    }

                    // Find the timeslot for this day and period
                    const timeSlot = getTimeSlotForPeriod(day, period);

                    // Get assignment for this specific timeslot
                    const assignment = timeSlot
                      ? getAssignmentForSlot(day, timeSlot.id)
                      : undefined;

                    // If we found a timeslot, render a droppable cell
                    if (timeSlot) {
                      return (
                        <td
                          key={`${day}-${timeSlot.id}`}
                          className='border-r border-gray-200 last:border-r-0'
                        >
                          <DroppableCell
                            timeSlot={timeSlot}
                            assignment={assignment}
                            isEditMode={isEditMode}
                            onAssignTeacher={openTeacherModal}
                            onRemoveAssignment={removeAssignmentFromSlot}
                          />
                        </td>
                      );
                    }

                    // Fallback - should not happen but just in case
                    return (
                      <td
                        key={`${day}-fallback-${period}`}
                        className='border-r border-gray-200 last:border-r-0 bg-gray-100 min-h-[80px]'
                      >
                        <div className='flex items-center justify-center h-20 text-gray-400'>
                          <span className='text-xs'>No Slot</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div className='px-6 py-3 bg-gray-50 border-t border-gray-200'>
        <p className='text-xs text-gray-600 text-center'>
          {isEditMode
            ? '💡 Drag subjects into time slots • Click an assignment to manage teachers'
            : 'Viewing timetable (switch to Edit Mode to modify)'}
        </p>
      </div>
    </div>
  );
};
