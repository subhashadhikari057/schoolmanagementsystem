'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Save,
  X,
  AlertCircle,
  Edit,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useExamTimetableStore } from '@/store/exam-timetable';
import { ExamDateslotResponseDto, ExamDateslotType } from '@sms/shared-types';
import { examDateslotService } from '@/api/services/exam-timetable.service';
import { toast } from 'sonner';

// Map ExamDateslotType enum to UI-friendly values
const dateslotTypes = [
  { value: ExamDateslotType.EXAM, label: 'Exam Period' },
  { value: ExamDateslotType.BREAK, label: 'Break' },
  { value: ExamDateslotType.LUNCH, label: 'Lunch Break' },
  { value: ExamDateslotType.PREPARATION, label: 'Preparation Time' },
] as const;

const dateslotTypeColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  [ExamDateslotType.EXAM.toLowerCase()]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  [ExamDateslotType.BREAK.toLowerCase()]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
  },
  [ExamDateslotType.LUNCH.toLowerCase()]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  [ExamDateslotType.PREPARATION.toLowerCase()]: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
};

export default function ExamDateslotManager() {
  const {
    examDateslots,
    setExamDateslots,
    updateExamDateslot,
    selectedCalendarEntryId,
    selectedCalendarEntry,
  } = useExamTimetableStore();

  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isViewMode, setIsViewMode] = useState(true);
  const [editingDateslotId, setEditingDateslotId] = useState<string | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    type: ExamDateslotType.EXAM,
    label: '',
  });

  // Load dateslots from the backend
  const loadDateslots = React.useCallback(async () => {
    // Validate calendar entry ID is a proper UUID before making API call
    if (
      !selectedCalendarEntryId ||
      !selectedCalendarEntryId.match(/^[0-9a-fA-F-]{36}$/)
    ) {
      console.log(
        'Invalid or missing calendar entry ID, skipping dateslot load',
      );
      setExamDateslots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await examDateslotService.getDateslotsByCalendarEntry(
        selectedCalendarEntryId,
      );
      if (response.success && response.data) {
        setExamDateslots(
          response.data.map(ds => ({
            ...ds,
            examDate: new Date(ds.examDate),
          })),
        );
      } else {
        setExamDateslots([]);
      }
    } catch (error) {
      console.error('Error loading dateslots:', error);
      setExamDateslots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCalendarEntryId, setExamDateslots]);

  // Load dateslots when calendar entry changes
  React.useEffect(() => {
    // Clear invalid state on mount
    useExamTimetableStore.getState().clearInvalidState();

    if (selectedCalendarEntryId) {
      loadDateslots();
    }
  }, [selectedCalendarEntryId, loadDateslots]);

  // Sort dateslots by exam date and start time
  const sortedDateslots = [...examDateslots].sort((a, b) => {
    const dateComparison =
      new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    if (dateComparison !== 0) return dateComparison;

    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  };

  // Format time for display (e.g., "08:30" to "8:30 AM")
  const formatTime = (time: string): string => {
    if (!time) return '-';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Start editing a dateslot (using the API response type since that's what we get from the map)
  const startEditing = (dateslot: ExamDateslotResponseDto) => {
    setEditingDateslotId(dateslot.id);
    setEditFormData({
      startTime: dateslot.startTime || '',
      endTime: dateslot.endTime || '',
      type: dateslot.type,
      label: dateslot.label || '',
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDateslotId(null);
    setEditFormData({
      startTime: '',
      endTime: '',
      type: ExamDateslotType.EXAM,
      label: '',
    });
  };

  // Save inline edit
  const saveInlineEdit = async (dateslotId: string) => {
    try {
      const updateData = {
        id: dateslotId,
        startTime: editFormData.startTime || undefined,
        endTime: editFormData.endTime || undefined,
        type: editFormData.type,
        label: editFormData.label || undefined,
      };

      const response = await examDateslotService.updateDateslot(
        dateslotId,
        updateData,
      );

      if (response.success && response.data) {
        // Update the store with the edited dateslot
        updateExamDateslot(response.data.id, {
          startTime: response.data.startTime,
          endTime: response.data.endTime,
          type: response.data.type,
          label: response.data.label,
        });

        toast.success('Dateslot updated successfully');
        setEditingDateslotId(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        toast.error(response.message || 'Failed to update dateslot');
      }
    } catch (error) {
      console.error('Error updating dateslot:', error);
      toast.error('Failed to update dateslot');
    }
  };

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='p-6'>
        {selectedCalendarEntryId ? (
          <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-4'>
            <h3 className='text-md font-medium text-blue-800'>
              Exam Dateslots for:{' '}
              {selectedCalendarEntry
                ? `${selectedCalendarEntry.name} (${selectedCalendarEntry.examType || 'Exam'})`
                : 'Selected Exam'}
            </h3>
            <p className='text-sm text-blue-600 mt-1'>
              Date slots are automatically created for each day of your exam
              period. Add time slots and labels to confirm the exam schedule for
              each date.
            </p>
          </div>
        ) : (
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4'>
            <h3 className='text-md font-medium text-yellow-800 flex items-center'>
              <AlertTriangle className='w-4 h-4 mr-2' />
              Please select an exam period from above to view its dateslots
            </h3>
          </div>
        )}

        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-semibold text-gray-800 flex items-center'>
            <Calendar className='w-5 h-5 mr-2' />
            Exam Dateslot Manager
          </h2>
          <div className='flex space-x-2'>
            <button
              className='px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center mr-2'
              onClick={() => {
                setIsViewMode(!isViewMode);
                // Cancel any ongoing edits when switching modes
                if (!isViewMode) {
                  cancelEditing();
                }
              }}
              disabled={isLoading}
            >
              {isViewMode ? (
                <>
                  <Edit className='w-4 h-4 mr-2' />
                  Edit Dateslots
                </>
              ) : (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  View Mode
                </>
              )}
            </button>
          </div>
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
            Dateslots updated successfully!
          </div>
        )}

        {/* Dateslots list */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-md font-medium text-gray-700'>
              Exam Dateslots
            </h3>
            {sortedDateslots.length > 0 && (
              <div className='flex items-center space-x-4 text-sm'>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-green-400 rounded-full mr-2'></div>
                  <span className='text-gray-600'>
                    {
                      sortedDateslots.filter(d =>
                        d.type === ExamDateslotType.EXAM
                          ? d.startTime && d.endTime && d.label
                          : true,
                      ).length
                    }{' '}
                    Configured
                  </span>
                </div>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-yellow-400 rounded-full mr-2'></div>
                  <span className='text-gray-600'>
                    {
                      sortedDateslots.filter(
                        d =>
                          d.type === ExamDateslotType.EXAM &&
                          (!d.startTime || !d.endTime || !d.label),
                      ).length
                    }{' '}
                    Pending
                  </span>
                </div>
              </div>
            )}
          </div>

          {sortedDateslots.length === 0 ? (
            <div className='text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
              <Calendar className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No dateslots found
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Date slots are automatically created for each day of your exam
                period. Please select an exam period above to configure time
                slots for each exam date.
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
                      Exam Date
                    </th>
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
                  {sortedDateslots.map((dateslot, index) => {
                    const typeStyle =
                      dateslotTypeColors[dateslot.type.toLowerCase()] ||
                      dateslotTypeColors.exam;

                    return (
                      <tr
                        key={dateslot.id}
                        className={`
                          ${
                            editingDateslotId === dateslot.id
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : index % 2 === 0
                                ? 'bg-white'
                                : 'bg-gray-50'
                          }
                          ${
                            editingDateslotId !== dateslot.id &&
                            dateslot.type === ExamDateslotType.EXAM &&
                            (!dateslot.startTime ||
                              !dateslot.endTime ||
                              !dateslot.label)
                              ? 'border-l-4 border-yellow-400 bg-yellow-50'
                              : editingDateslotId !== dateslot.id &&
                                'border-l-4 border-green-400'
                          }
                        `}
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatDate(dateslot.examDate)}
                        </td>
                        {/* Start Time */}
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {editingDateslotId === dateslot.id ? (
                            <input
                              type='time'
                              value={editFormData.startTime}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  startTime: e.target.value,
                                }))
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                          ) : dateslot.startTime ? (
                            <span className='text-gray-900'>
                              {formatTime(dateslot.startTime)}
                            </span>
                          ) : dateslot.type === ExamDateslotType.EXAM ? (
                            <span className='text-yellow-600 font-medium'>
                              Not configured
                            </span>
                          ) : (
                            <span className='text-gray-500'>-</span>
                          )}
                        </td>

                        {/* End Time */}
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {editingDateslotId === dateslot.id ? (
                            <input
                              type='time'
                              value={editFormData.endTime}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  endTime: e.target.value,
                                }))
                              }
                              className='w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                          ) : dateslot.endTime ? (
                            <span className='text-gray-900'>
                              {formatTime(dateslot.endTime)}
                            </span>
                          ) : dateslot.type === ExamDateslotType.EXAM ? (
                            <span className='text-yellow-600 font-medium'>
                              Not configured
                            </span>
                          ) : (
                            <span className='text-gray-500'>-</span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {editingDateslotId === dateslot.id
                            ? editFormData.startTime && editFormData.endTime
                              ? `${calculateDuration(editFormData.startTime, editFormData.endTime)} minutes`
                              : 'Enter times'
                            : dateslot.startTime && dateslot.endTime
                              ? `${calculateDuration(dateslot.startTime, dateslot.endTime)} minutes`
                              : 'Pending configuration'}
                        </td>

                        {/* Type */}
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {editingDateslotId === dateslot.id ? (
                            <select
                              value={editFormData.type}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  type: e.target.value as ExamDateslotType,
                                }))
                              }
                              className='px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            >
                              {dateslotTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border} border`}
                            >
                              {dateslot.type.replace('_', ' ')}
                            </span>
                          )}
                        </td>

                        {/* Label */}
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {editingDateslotId === dateslot.id ? (
                            <input
                              type='text'
                              value={editFormData.label}
                              onChange={e =>
                                setEditFormData(prev => ({
                                  ...prev,
                                  label: e.target.value,
                                }))
                              }
                              placeholder='Enter label'
                              className='w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                          ) : dateslot.label ? (
                            <span className='text-gray-900'>
                              {dateslot.label}
                            </span>
                          ) : dateslot.type === ExamDateslotType.EXAM ? (
                            <span className='text-yellow-600 font-medium'>
                              Not configured
                            </span>
                          ) : (
                            <span className='text-gray-500'>-</span>
                          )}
                        </td>
                        {!isViewMode && (
                          <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                            <div className='flex space-x-2 justify-end'>
                              {editingDateslotId === dateslot.id ? (
                                <>
                                  {/* Save button */}
                                  <button
                                    onClick={() => saveInlineEdit(dateslot.id)}
                                    className='text-green-600 hover:text-green-900'
                                    title='Save Changes'
                                  >
                                    <Save className='w-4 h-4' />
                                  </button>
                                  {/* Cancel button */}
                                  <button
                                    onClick={cancelEditing}
                                    className='text-gray-600 hover:text-gray-900'
                                    title='Cancel Edit'
                                  >
                                    <X className='w-4 h-4' />
                                  </button>
                                </>
                              ) : dateslot.type === ExamDateslotType.EXAM ? (
                                <>
                                  {/* Edit button - only for EXAM type slots */}
                                  <button
                                    onClick={() =>
                                      startEditing(
                                        dateslot as ExamDateslotResponseDto,
                                      )
                                    }
                                    className='text-blue-600 hover:text-blue-900'
                                    title='Edit Exam Slot'
                                  >
                                    <Edit className='w-4 h-4' />
                                  </button>
                                </>
                              ) : (
                                <span className='text-gray-400 text-xs'>
                                  Non-editable
                                </span>
                              )}
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

        {/* Instructions for using dateslots */}
        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md'>
          <div className='flex mb-4'>
            <div className='flex-shrink-0'>
              <AlertCircle className='h-5 w-5 text-blue-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                How Exam Dateslots Work
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  <strong>1. Auto-creation:</strong> Date placeholders are
                  created for each day of your exam period from the Academic
                  Calendar.
                </p>
                <p className='mt-1'>
                  <strong>2. Configure times:</strong> Add start time, end time,
                  and label to each exam date to activate them.
                </p>
                <p className='mt-1'>
                  <strong>3. Build timetable:</strong> Only configured dateslots
                  will be available in the Timetable Builder for subject
                  assignment.
                </p>
              </div>
            </div>
          </div>

          {/* Information about dateslot types */}
          <div className='flex'>
            <div className='flex-shrink-0'>
              <AlertCircle className='h-5 w-5 text-blue-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-blue-800'>
                Dateslot Types
              </h3>
              <div className='mt-2 text-sm text-blue-700'>
                <p>
                  <strong>Exam Periods:</strong> Can be assigned subjects for
                  actual exams.
                </p>
                <p className='mt-1'>
                  <strong>Breaks & Lunch:</strong> Rest periods that cannot have
                  subjects assigned.
                </p>
                <p className='mt-1'>
                  <strong>Preparation Time:</strong> Time allocated for exam
                  preparation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
