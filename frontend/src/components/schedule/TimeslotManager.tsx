'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Edit,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import {
  TimeslotResponseDto as TimeSlot,
  TimeslotType,
} from '@sms/shared-types';
import { timeslotService } from '@/api/services/schedule.service';
import { toast } from 'sonner';

const days = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const;
const dayLabels: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};

// Map TimeslotType enum to UI-friendly values
const periodTypes = [
  { value: TimeslotType.REGULAR, label: 'Regular Period' },
  { value: TimeslotType.BREAK, label: 'Break' },
  { value: TimeslotType.LUNCH, label: 'Lunch' },
  { value: TimeslotType.ACTIVITY, label: 'Activity' },
  { value: TimeslotType.STUDY_HALL, label: 'Study Hall' },
  { value: TimeslotType.FREE_PERIOD, label: 'Free Period' },
] as const;

const periodTypeColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  [TimeslotType.REGULAR.toLowerCase()]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  [TimeslotType.BREAK.toLowerCase()]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
  },
  [TimeslotType.LUNCH.toLowerCase()]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  [TimeslotType.ACTIVITY.toLowerCase()]: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
  [TimeslotType.STUDY_HALL.toLowerCase()]: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  [TimeslotType.FREE_PERIOD.toLowerCase()]: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
  },
};

export default function TimeslotManager() {
  const {
    timeSlots,
    setTimeSlots,
    addTimeSlot,
    removeTimeSlot,
    selectedClassId,
    selectedClass,
    triggerTimetableReload,
  } = useScheduleStore();
  const [selectedDay, setSelectedDay] =
    useState<(typeof days)[number]>('sunday');
  const [newTimeSlot, setNewTimeSlot] = useState<Partial<TimeSlot>>({
    day: selectedDay,
    startTime: '',
    endTime: '',
    type: TimeslotType.REGULAR,
    label: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true);

  // Load timeslots from the backend
  const loadTimeslots = React.useCallback(async () => {
    if (!selectedClassId) return;

    // Verify the classId isn't a mock ID (like "class-3")
    if (selectedClassId.startsWith('class-')) {
      console.info('Skipping API call for mock class ID:', selectedClassId);
      setTimeSlots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response =
        await timeslotService.getTimeslotsByClass(selectedClassId);
      if (response.success && response.data) {
        setTimeSlots(
          response.data.map(ts => ({
            id: ts.id,
            day: ts.day.charAt(0).toUpperCase() + ts.day.slice(1).toLowerCase(),
            startTime: ts.startTime,
            endTime: ts.endTime,
            type: ts.type,
            label: ts.label,
            classId: ts.classId,
            createdAt: ts.createdAt,
            updatedAt: ts.updatedAt,
            deletedAt: ts.deletedAt,
          })),
        );
      } else {
        setTimeSlots([]);
      }
    } catch {
      console.info('Could not load timeslots, using empty array');
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, setTimeSlots]);

  // Load timeslots for the selected class when component mounts or class changes
  React.useEffect(() => {
    if (selectedClassId) {
      loadTimeslots();
    }
  }, [selectedClassId, loadTimeslots]);

  // Normalize selected day for consistent comparison
  const normalizedSelectedDay =
    selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1).toLowerCase();

  // Filter timeslots for the selected day and remove duplicates
  const dayTimeSlots = timeSlots.filter(
    slot => slot.day === normalizedSelectedDay,
  );

  // Remove duplicate timeslots (same day, startTime, endTime, type)
  const uniqueTimeSlots = dayTimeSlots.reduce(
    (acc, current) => {
      const isDuplicate = acc.some(
        item =>
          item.day === current.day &&
          item.startTime === current.startTime &&
          item.endTime === current.endTime &&
          item.type === current.type,
      );
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    },
    [] as typeof dayTimeSlots,
  );

  // Sort by start time
  const sortedTimeSlots = [...uniqueTimeSlots].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  // Format time for display (e.g., "08:30" to "8:30 AM")
  const formatTime = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      // Return the original time if parsing fails
      return time;
    }
  };

  // Check for overlapping timeslots
  const checkForOverlaps = () => {
    const overlaps: string[] = [];

    // Sort timeslots by start time
    const sorted = [...sortedTimeSlots];

    // Check each timeslot against the next one
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // If current end time is after next start time, they overlap
      if (current.endTime > next.startTime) {
        overlaps.push(
          `${formatTime(current.startTime)}-${formatTime(current.endTime)} overlaps with ${formatTime(next.startTime)}-${formatTime(next.endTime)}`,
        );
      }
    }

    return overlaps;
  };

  // Check for overlaps
  const overlappingTimeslots = checkForOverlaps();

  // Function to auto-sort timeslots
  const handleAutoSort = () => {
    if (timeSlots.length === 0) return;

    // Create a copy of all timeslots
    const allTimeSlots = [...timeSlots];

    // Group by day
    const timeslotsByDay = days.reduce(
      (acc, day) => {
        const normalizedDay =
          day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        // @ts-ignore - local TimeSlot interface omits persistence metadata not needed here
        acc[day] = allTimeSlots
          .filter(slot => slot.day === normalizedDay)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return acc;
      },
      {} as Record<string, TimeSlot[]>,
    );

    // Flatten back to array
    const sortedSlots = Object.values(timeslotsByDay).flat();

    // Update the store
    setTimeSlots(sortedSlots);
    toast.success('Timeslots sorted by start time');
  };

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setNewTimeSlot(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validate and add new timeslot
  const handleAddTimeSlot = async () => {
    const validationErrors: Record<string, string> = {};

    // Required fields
    if (!newTimeSlot.startTime)
      validationErrors.startTime = 'Start time is required';
    if (!newTimeSlot.endTime) validationErrors.endTime = 'End time is required';

    // Time format validation is handled by the input type="time"

    // Check that end time is after start time
    if (
      newTimeSlot.startTime &&
      newTimeSlot.endTime &&
      newTimeSlot.startTime >= newTimeSlot.endTime
    ) {
      validationErrors.endTime = 'End time must be after start time';
    }

    // Check for overlapping with existing timeslots
    if (newTimeSlot.startTime && newTimeSlot.endTime) {
      const existingSlots = timeSlots.filter(
        slot => slot.day === normalizedSelectedDay,
      );

      for (const slot of existingSlots) {
        // Check if new timeslot overlaps with existing one
        const newStartOverlaps =
          newTimeSlot.startTime >= slot.startTime &&
          newTimeSlot.startTime < slot.endTime;
        const newEndOverlaps =
          newTimeSlot.endTime > slot.startTime &&
          newTimeSlot.endTime <= slot.endTime;
        const newEncompasses =
          newTimeSlot.startTime <= slot.startTime &&
          newTimeSlot.endTime >= slot.endTime;

        if (newStartOverlaps || newEndOverlaps || newEncompasses) {
          validationErrors.startTime = `Overlaps with existing timeslot (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`;
          break;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!selectedClassId) {
      toast.error('No class selected');
      return;
    }

    setIsLoading(true);

    try {
      // Save to backend
      const response = await timeslotService.createTimeslot({
        classId: selectedClassId,
        day: selectedDay,
        startTime: newTimeSlot.startTime!,
        endTime: newTimeSlot.endTime!,
        type: newTimeSlot.type!, // Already using the correct enum
        label: newTimeSlot.label,
      });

      if (response.success && response.data) {
        // Add to local state with normalized day
        addTimeSlot({
          id: response.data.id,
          day: normalizedSelectedDay,
          startTime: newTimeSlot.startTime!,
          endTime: newTimeSlot.endTime!,
          type: newTimeSlot.type as TimeSlot['type'],
          label: newTimeSlot.label,
        } as TimeSlot);

        // Reset form
        setNewTimeSlot({
          day: selectedDay,
          startTime: '',
          endTime: '',
          type: TimeslotType.REGULAR,
          label: '',
        });

        // Show success message with auto-schedule creation info
        toast.success(
          `${dayLabels[selectedDay]} timeslot saved successfully!`,
          {
            description:
              'The new timeslot is now available in the Timetable Builder for subject assignments.',
            duration: 3000,
          },
        );
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Trigger timetable reload to refresh TimetableBuilder
        triggerTimetableReload();
      } else {
        toast.error(response.message || 'Failed to save timeslot');
      }
    } catch (error) {
      console.error('Error saving timeslot:', error);
      toast.error('Failed to save timeslot');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle day change
  const handleDayChange = (day: (typeof days)[number]) => {
    setSelectedDay(day);
    // Reset the entire form when switching days to prevent wrong day assignment
    setNewTimeSlot({
      day: day,
      startTime: '',
      endTime: '',
      type: TimeslotType.REGULAR,
      label: '',
    });
    // Clear any errors when switching days
    setErrors({});
  };

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string): number => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='p-6'>
        {selectedClassId ? (
          <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4'>
            <h3 className='text-md font-medium text-blue-800'>
              Creating timeslots for:{' '}
              {selectedClass
                ? `Grade ${selectedClass.grade} Section ${selectedClass.section}`
                : 'Selected Class'}
            </h3>
          </div>
        ) : (
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4'>
            <h3 className='text-md font-medium text-yellow-800 flex items-center'>
              <AlertTriangle className='w-4 h-4 mr-2' />
              Please select a class to manage timeslots
            </h3>
          </div>
        )}
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-semibold text-gray-800 flex items-center'>
            <Clock className='w-5 h-5 mr-2' />
            Timeslot Manager
          </h2>
          <div className='flex space-x-2'>
            <button
              className='px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center mr-2'
              onClick={() => setIsViewMode(!isViewMode)}
              disabled={isLoading}
            >
              {isViewMode ? (
                <>
                  <Edit className='w-4 h-4 mr-2' />
                  Edit Timeslots
                </>
              ) : (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  View Mode
                </>
              )}
            </button>
            <button
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center'
              onClick={handleAutoSort}
              disabled={isLoading || timeSlots.length === 0}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4 mr-2'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path d='M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z' />
              </svg>
              Auto Sort
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-6'>
            {days.map(day => {
              const normalizedDay =
                day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
              const dayTimeSlots = timeSlots.filter(
                slot => slot.day === normalizedDay,
              );
              const hasTimeslots = dayTimeSlots.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDayChange(day)}
                  className={`py-2 px-3 border-b-2 font-medium text-sm relative ${
                    selectedDay === day
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {dayLabels[day]}
                  {hasTimeslots && (
                    <span className='ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full'>
                      {dayTimeSlots.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center'>
            <div className='mr-2 flex-shrink-0 h-5 w-5 text-green-500'>
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
            Timeslots updated successfully!
          </div>
        )}

        {/* Add new timeslot form - only show in edit mode */}
        {!isViewMode && (
          <div className='bg-gray-50 p-4 rounded-lg mb-6 border-2 border-green-200'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-md font-medium text-gray-700'>
                Add Time Slot for {dayLabels[selectedDay]}
              </h3>
              <div className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium'>
                Currently editing: {dayLabels[selectedDay]}
              </div>
            </div>
            {!selectedClassId && (
              <div className='bg-red-50 border border-red-200 rounded-md p-3 mb-4'>
                <p className='text-sm text-red-700'>
                  You must select a class before adding timeslots.
                </p>
              </div>
            )}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Start Time
                </label>
                <input
                  type='time'
                  value={newTimeSlot.startTime}
                  onChange={e => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.startTime}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  End Time
                </label>
                <input
                  type='time'
                  value={newTimeSlot.endTime}
                  onChange={e => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && (
                  <p className='mt-1 text-sm text-red-600'>{errors.endTime}</p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Type
                </label>
                <select
                  value={newTimeSlot.type}
                  onChange={e => handleInputChange('type', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  {periodTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Label (Optional)
                </label>
                <input
                  type='text'
                  value={newTimeSlot.label || ''}
                  onChange={e => handleInputChange('label', e.target.value)}
                  placeholder='e.g., Morning Break'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              <div>
                <button
                  onClick={handleAddTimeSlot}
                  disabled={isLoading || !selectedClassId}
                  className='w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-green-300'
                >
                  {isLoading ? (
                    <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2'></span>
                  ) : (
                    <Plus className='w-4 h-4 mr-2' />
                  )}
                  {isLoading ? 'Adding...' : 'Add Time Slot'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeslots list */}
        <div>
          <h3 className='text-md font-medium text-gray-700 mb-4'>
            {dayLabels[selectedDay]} Timeslots
          </h3>

          {sortedTimeSlots.length === 0 ? (
            <div className='text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
              <Clock className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No timeslots
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Get started by adding a new time slot for{' '}
                {dayLabels[selectedDay]}.
              </p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Start Time
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      End Time
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Duration
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Type
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Label
                    </th>
                    {!isViewMode && (
                      <th
                        scope='col'
                        className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {sortedTimeSlots.map((slot, index) => {
                    const typeStyle =
                      periodTypeColors[slot.type] || periodTypeColors.regular;

                    return (
                      <tr
                        key={slot.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatTime(slot.startTime)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatTime(slot.endTime)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {calculateDuration(slot.startTime, slot.endTime)}{' '}
                          minutes
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border} border`}
                          >
                            {slot.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {slot.label || '-'}
                        </td>
                        {!isViewMode && (
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <div className='flex space-x-2 justify-end'>
                              {/* Up/down arrows removed as they're not needed with auto-sort */}
                              <button
                                onClick={async () => {
                                  if (!slot.id) return;

                                  // Show warning about schedule impact
                                  const confirmed = window.confirm(
                                    `⚠️ Delete Timeslot Warning\n\n` +
                                      `Deleting this timeslot (${slot.startTime} - ${slot.endTime}) will:\n` +
                                      `• Remove all schedule slots for this time period\n` +
                                      `• Delete any subject assignments in this slot (assigned slot will be deleted from schedule too)\n` +
                                      `• Affect all active schedules for this class\n\n` +
                                      `This action cannot be undone. Are you sure you want to continue?`,
                                  );

                                  if (!confirmed) return;

                                  try {
                                    // Delete from backend
                                    const response =
                                      await timeslotService.deleteTimeslot(
                                        slot.id,
                                      );

                                    if (response.success) {
                                      // Remove from local state
                                      removeTimeSlot(slot.id);
                                      toast.success(
                                        'Timeslot and all related schedule slots deleted successfully',
                                        {
                                          description:
                                            'All subject assignments in this time slot have been removed.',
                                          duration: 5000,
                                        },
                                      );
                                    } else {
                                      toast.error(
                                        response.message ||
                                          'Failed to delete timeslot',
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      'Error deleting timeslot:',
                                      error,
                                    );
                                    toast.error('Failed to delete timeslot');
                                  }
                                }}
                                className='text-red-600 hover:text-red-900'
                                title='Delete Timeslot'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warning about overlapping timeslots */}
        {overlappingTimeslots.length > 0 && !isViewMode && (
          <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-md'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <AlertTriangle className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Overlapping Timeslots Detected
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>
                    <strong>Warning:</strong> The following timeslots overlap
                    and may cause scheduling conflicts:
                  </p>
                  <ul className='list-disc pl-5 mt-2'>
                    {overlappingTimeslots.map((overlap, index) => (
                      <li key={index}>{overlap}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning about existing assignments */}
        {sortedTimeSlots.length > 0 && !isViewMode && (
          <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <AlertTriangle className='h-5 w-5 text-yellow-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-yellow-800'>
                  Important Note
                </h3>
                <div className='mt-2 text-sm text-yellow-700'>
                  <p>
                    <strong>Warning:</strong> Modifying or removing timeslots
                    will affect any existing timetable assignments. Schedules
                    using these timeslots may need to be recreated.
                  </p>
                  <p className='mt-2'>
                    Please review your timetable after making changes here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions for using timeslots */}
        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md'>
          <div className='flex mb-4'>
            <div className='flex-shrink-0'>
              <AlertCircle className='h-5 w-5 text-blue-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                How to Use Timeslots
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  <strong>1. Select a day:</strong> Use the day tabs to choose
                  which day you want to configure.
                </p>
                <p className='mt-1'>
                  <strong>2. Add timeslots:</strong> Fill in the form and click
                  "Add Time Slot" to save each timeslot immediately.
                </p>
                <p className='mt-1'>
                  <strong>3. Switch days:</strong> Each day maintains its own
                  timeslots independently. Changes are saved automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Information about timeslot types */}
          <div className='flex'>
            <div className='flex-shrink-0'>
              <AlertCircle className='h-5 w-5 text-blue-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                Timeslot Types
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  <strong>Regular Periods:</strong> Can be assigned subjects,
                  teachers, and rooms in the timetable builder.
                </p>
                <p className='mt-1'>
                  <strong>Special Periods:</strong> Break, Lunch, Activity,
                  Study Hall, and Free Period are displayed differently and do
                  not require teacher assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
