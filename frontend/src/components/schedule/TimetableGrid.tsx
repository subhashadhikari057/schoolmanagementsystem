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
        <div className='flex items-center justify-center h-full text-orange-700 bg-orange-50 rounded-lg border border-orange-200'>
          <div className='text-center py-2'>
            <div className='flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-2 mx-auto'>
              <Coffee className='w-5 h-5 text-orange-700' />
            </div>
            <span className='text-sm font-semibold'>Break Time</span>
          </div>
        </div>
      );
    }

    if (isLunchTime) {
      return (
        <div className='flex items-center justify-center h-full text-green-700 bg-green-50 rounded-lg border border-green-200'>
          <div className='text-center py-2'>
            <div className='flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2 mx-auto'>
              <Utensils className='w-5 h-5 text-green-700' />
            </div>
            <span className='text-sm font-semibold'>Lunch Break</span>
          </div>
        </div>
      );
    }

    if (!hasAssignment && isRegular) {
      return (
        <div className='flex items-center justify-center h-full text-gray-400 transition-all duration-300 group-hover:text-blue-600'>
          <div className='text-center py-4'>
            <div className='flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full mb-2 mx-auto border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-all duration-300'>
              <BookOpen className='w-6 h-6 opacity-50 group-hover:opacity-70 transition-all duration-300 text-gray-500 group-hover:text-blue-500' />
            </div>
            <p className='text-xs font-medium group-hover:text-blue-600 transition-colors'>
              Drop subject here
            </p>
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
      <div className='p-4 h-full flex flex-col justify-between bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200'>
        {/* Subject Info */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900 truncate mb-1'>
              {assignment.subject?.name || 'Unknown Subject'}
            </h4>
            <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100'>
              {assignment.subject?.code || 'N/A'}
            </span>
          </div>

          {/* Conflict Warning */}
          {assignment.hasConflict && (
            <div className='flex-shrink-0 ml-2'>
              <div className='flex items-center justify-center w-6 h-6 bg-amber-50 rounded-full border border-amber-200'>
                <AlertTriangle className='w-4 h-4 text-amber-600' />
              </div>
            </div>
          )}
        </div>

        {/* Teacher Info */}
        <div className='mb-3'>
          {assignment.teacher ? (
            <div className='flex items-center text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-md border border-blue-100'>
              <div className='flex items-center justify-center w-4 h-4 bg-blue-100 rounded-full mr-2'>
                <User className='w-2.5 h-2.5 text-blue-600' />
              </div>
              <span className='truncate font-medium'>
                {assignment.teacher.user.fullName}
              </span>
            </div>
          ) : isEditMode ? (
            <button
              onClick={() =>
                assignment && isEditMode && onAssignTeacher(assignment)
              }
              className='flex items-center text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md transition-all w-full border border-gray-200 hover:border-blue-300'
            >
              <div className='flex items-center justify-center w-4 h-4 bg-gray-50 rounded-full mr-2'>
                <User className='w-2.5 h-2.5' />
              </div>
              <span className='font-medium'>Assign Teacher</span>
            </button>
          ) : (
            <div className='text-xs text-gray-500 italic flex items-center px-3 py-2 bg-gray-50 rounded-md border border-gray-200'>
              <div className='flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full mr-2'>
                <User className='w-2.5 h-2.5 text-gray-400' />
              </div>
              <span>No teacher</span>
            </div>
          )}
        </div>

        {/* Room Info */}
        {assignment.room && (
          <div className='flex items-center text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 mb-2'>
            <div className='flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full mr-2'>
              <span className='text-xs font-bold text-gray-600'>R</span>
            </div>
            <span className='font-medium'>Room {assignment.room.roomNo}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isEditMode && (
          <div className='flex items-center justify-end space-x-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300'>
            <button
              onClick={() => assignment && onAssignTeacher(assignment)}
              className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200'
              title='Edit assignment'
            >
              <Edit3 className='w-3 h-3' />
            </button>
            <button
              onClick={() => assignment && onRemoveAssignment(assignment.id)}
              className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200'
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
      relative border border-gray-200 transition-all duration-300 group
      min-h-[120px] flex flex-col rounded-lg
    `;

    if (isBreakTime || isLunchTime) {
      return `${baseClasses} bg-orange-50 border-orange-200`;
    }

    if (isHighlighted) {
      return `${baseClasses} bg-blue-50 border-blue-400 border-2 shadow-md transform scale-[1.01] z-10`;
    }

    if (hasAssignment) {
      const conflictClasses = assignment?.hasConflict
        ? 'bg-amber-50 border-amber-300 shadow-sm'
        : 'bg-green-50 border-green-300 shadow-sm';
      return `${baseClasses} ${conflictClasses} hover:shadow-md hover:scale-[1.01]`;
    }
    if (isRegular) {
      return `${baseClasses} bg-white hover:bg-blue-50 border-dashed hover:border-blue-300 hover:shadow-sm`;
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

      {/* Professional Timetable Grid */}
      <div className='overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200'>
        <table className='w-full table-fixed min-w-[1300px]'>
          {/* Blue Table Header to Match Tab Color */}
          <thead className='bg-blue-600 text-white'>
            <tr>
              <th className='w-36 px-6 py-4 text-left text-sm font-semibold border-r border-blue-500'>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-blue-200' />
                  <span>Time Slot</span>
                </div>
              </th>
              {availableDays.map(day => (
                <th
                  key={day}
                  className='px-4 py-4 text-center text-sm font-semibold border-r border-blue-500 last:border-r-0 min-w-[200px]'
                >
                  <div>
                    <div className='font-semibold'>{day}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Clean Table Body */}
          <tbody className='bg-white divide-y divide-gray-200'>
            {/* We now iterate through our unique time periods list */}
            {uniqueTimePeriods.map(period => {
              const [startTime, endTime] = period.split('-');

              return (
                <tr
                  key={`period-${period}`}
                  className='hover:bg-gray-50 transition-colors duration-200'
                >
                  {/* Clean Time Column */}
                  <td className='w-36 px-6 py-4 border-r border-gray-200 bg-gray-50'>
                    <div className='text-center'>
                      <div className='text-sm font-semibold text-gray-900 mb-1'>
                        {startTime.slice(0, 5)}
                      </div>
                      <div className='text-xs text-gray-600'>
                        to {endTime.slice(0, 5)}
                      </div>
                      <div className='mt-2 h-px w-8 bg-gray-300 mx-auto'></div>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {availableDays.map(day => {
                    // Check if this day has this specific time period
                    const hasPeriod = !!periodToDaySlots[period]?.[day];

                    // If this day doesn't have this period, render a clean empty cell
                    if (!hasPeriod) {
                      return (
                        <td
                          key={`${day}-empty-${period}`}
                          className='border-r border-gray-200 last:border-r-0 bg-gray-50 min-h-[120px] p-3'
                        >
                          <div className='flex items-center justify-center h-24 text-gray-400 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors duration-300'>
                            <div className='text-center'>
                              <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1'>
                                <span className='text-sm text-gray-400'>∅</span>
                              </div>
                              <span className='text-xs font-medium text-gray-500'>
                                No Slot
                              </span>
                            </div>
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

                    // If we found a timeslot, render an enhanced droppable cell
                    if (timeSlot) {
                      return (
                        <td
                          key={`${day}-${timeSlot.id}`}
                          className='border-r border-gray-200 last:border-r-0 p-2 min-h-[120px] w-full'
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

                    // Clean fallback - should not happen but just in case
                    return (
                      <td
                        key={`${day}-fallback-${period}`}
                        className='border-r border-gray-200 last:border-r-0 bg-gray-50 min-h-[120px] p-3'
                      >
                        <div className='flex items-center justify-center h-24 text-gray-400 border border-dashed border-gray-300 rounded-md'>
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

      {/* Clean Professional Instructions */}
      <div className='px-6 py-3 bg-gray-50 border-t border-gray-200'>
        <div className='flex items-center justify-center space-x-6 text-sm'>
          {isEditMode ? (
            <>
              <div className='flex items-center space-x-2 text-blue-600'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <span className='font-medium'>
                  💡 Drag subjects into time slots
                </span>
              </div>
              <div className='flex items-center space-x-2 text-slate-600'>
                <div className='w-2 h-2 bg-slate-500 rounded-full'></div>
                <span className='font-medium'>
                  📝 Click assignments to manage teachers
                </span>
              </div>
            </>
          ) : (
            <div className='flex items-center space-x-2 text-gray-600'>
              <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
              <span className='font-medium'>
                👁️ Viewing timetable (switch to Edit Mode to modify)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
