'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, Check, User, Clock } from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { scheduleService } from '@/api/services/schedule.service';
import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';

export default function TeacherAssignmentModal() {
  const {
    isTeacherModalOpen,
    closeTeacherModal,
    selectedSlotForTeacher,
    assignTeacherToSlot,
    timeSlots,
    selectedClassId,
  } = useScheduleStore();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selections when modal opens with a new slot
  useEffect(() => {
    if (selectedSlotForTeacher) {
      setSelectedTeacherId(selectedSlotForTeacher.teacherId || '');
    }
  }, [selectedSlotForTeacher]);

  // State for subject data
  const [subject, setSubject] = useState<{
    id: string;
    name: string;
    code: string;
    color: string;
  } | null>(null);

  // Fetch subject data when subjectId changes
  useEffect(() => {
    const fetchSubject = async () => {
      if (!selectedSlotForTeacher?.subjectId) return;

      try {
        // Use the subject service to get subject by ID
        const response = await scheduleService.getSubjectById(
          selectedSlotForTeacher.subjectId,
        );
        if (response.success && response.data) {
          setSubject({
            id: response.data.id,
            name: response.data.name,
            code: response.data.code,
            color: '#3b82f6', // Default blue color if not provided by API
          });
        }
      } catch (error) {
        console.error('Error fetching subject:', error);
      }
    };

    fetchSubject();
  }, [selectedSlotForTeacher?.subjectId]);

  // Get the time slot for the current slot
  const timeSlot = useMemo(() => {
    if (!selectedSlotForTeacher?.timeSlotId) return null;
    return timeSlots.find(ts => ts.id === selectedSlotForTeacher.timeSlotId);
  }, [selectedSlotForTeacher, timeSlots]);

  // State for available teachers
  const [availableTeachers, setAvailableTeachers] = useState<
    Array<{
      id: string;
      fullName: string;
      employeeId: string;
    }>
  >([]);

  // Fetch teachers for the subject and class
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!selectedSlotForTeacher?.subjectId || !selectedClassId) return;

      try {
        // Get teachers who can teach this subject for this class
        const response = await teacherService.getAllTeachers();
        if (response.success && response.data) {
          // Filter teachers who can teach this subject (simplified logic)
          // In a real implementation, you would use a specific endpoint to get teachers for a subject
          setAvailableTeachers(
            response.data.map(teacher => ({
              id: teacher.id,
              fullName:
                teacher.firstName +
                  (teacher.middleName ? ` ${teacher.middleName} ` : ' ') +
                  teacher.lastName || 'Unknown Teacher',
              employeeId: teacher.employeeId || 'N/A',
            })),
          );
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setAvailableTeachers([]);
      }
    };

    fetchTeachers();
  }, [selectedSlotForTeacher?.subjectId, selectedClassId]);

  // State for teacher availability
  const [teacherAvailability, setTeacherAvailability] = useState<
    Record<string, boolean>
  >({});

  // Check teacher availability using the backend API
  useEffect(() => {
    const checkAvailability = async () => {
      if (
        !timeSlot ||
        !selectedSlotForTeacher ||
        availableTeachers.length === 0
      )
        return;

      const result: Record<string, boolean> = {};

      // For each teacher, check availability
      for (const teacher of availableTeachers) {
        try {
          const response = await scheduleService.checkTeacherConflict({
            teacherId: teacher.id,
            day: selectedSlotForTeacher.day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            excludeSlotId: selectedSlotForTeacher.id,
          });

          // Teacher is available if there's no conflict
          result[teacher.id] = response.success && !response.data?.hasConflict;
        } catch (error) {
          console.error(
            `Error checking availability for teacher ${teacher.id}:`,
            error,
          );
          // Default to available if API call fails
          result[teacher.id] = true;
        }
      }

      setTeacherAvailability(result);
    };

    checkAvailability();
  }, [availableTeachers, timeSlot, selectedSlotForTeacher]);

  // Function removed as it's now handled by the useEffect above

  // Handle teacher selection
  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
  };

  // No longer needed as we're not using rooms

  // Handle save
  const handleSave = async () => {
    if (!selectedSlotForTeacher?.id) return;

    setIsLoading(true);

    try {
      // If we have a backend slot ID, update it
      if (selectedSlotForTeacher.id.startsWith('backend-')) {
        // This is a placeholder for the actual API call
        // const response = await scheduleService.updateScheduleSlot(
        //   selectedSlotForTeacher.id.replace('backend-', ''),
        //   { teacherId: selectedTeacherId }
        // );

        // For now, just update the local state
        if (selectedTeacherId) {
          assignTeacherToSlot(selectedSlotForTeacher.id, selectedTeacherId);
        }

        toast.success('Teacher assigned successfully');
      } else {
        // Just update local state for now
        if (selectedTeacherId) {
          assignTeacherToSlot(selectedSlotForTeacher.id, selectedTeacherId);
        }

        toast.success('Teacher assigned successfully');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeTeacherModal();
      }, 1000);
    } catch (error) {
      console.error('Error saving teacher assignment:', error);
      toast.error('Failed to assign teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display (e.g., "08:30" to "8:30 AM")
  const formatTime = (time?: string): string => {
    if (!time) return '';
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

  if (!isTeacherModalOpen || !selectedSlotForTeacher || !subject || !timeSlot) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='text-lg font-semibold text-gray-800'>
            Assign Teacher
          </h2>
          <button
            onClick={closeTeacherModal}
            className='p-1 rounded-full hover:bg-gray-100'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4'>
          {/* Subject and Time Info */}
          <div
            className='mb-4 p-3 rounded-md'
            style={{
              backgroundColor: `${subject.color}15`,
              borderLeft: `4px solid ${subject.color}`,
            }}
          >
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='font-medium'>{subject.name}</h3>
                <div className='text-sm text-gray-600'>
                  {timeSlot.day.charAt(0).toUpperCase() + timeSlot.day.slice(1)}
                </div>
              </div>
              <div className='text-right'>
                <div className='text-sm font-medium'>
                  {formatTime(timeSlot.startTime)} -{' '}
                  {formatTime(timeSlot.endTime)}
                </div>
                <div className='text-xs text-gray-500'>
                  {timeSlot.type.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {showSuccess ? (
            <div className='flex items-center justify-center p-6'>
              <div className='bg-green-100 text-green-800 p-3 rounded-full'>
                <Check className='w-8 h-8' />
              </div>
              <div className='ml-4'>
                <h3 className='font-medium'>Assignment Saved!</h3>
                <p className='text-sm text-gray-600'>
                  Teacher has been assigned successfully.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Available Teachers */}
              <div className='mb-4'>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>
                  Available Teachers
                </h3>

                {availableTeachers.length === 0 ? (
                  <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center'>
                    <AlertTriangle className='w-5 h-5 text-yellow-500 mr-2' />
                    <span className='text-sm text-yellow-700'>
                      No teachers available who can teach this subject for this
                      class.
                    </span>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-2 max-h-48 overflow-y-auto'>
                    {availableTeachers.map(teacher => {
                      const isAvailable = teacherAvailability[teacher.id];
                      const currentTeacher =
                        selectedSlotForTeacher.teacherId === teacher.id;

                      return (
                        <div
                          key={teacher.id}
                          onClick={() =>
                            isAvailable && handleTeacherSelect(teacher.id)
                          }
                          className={`p-3 rounded-md border flex items-center justify-between cursor-pointer ${
                            isAvailable
                              ? currentTeacher
                                ? 'bg-blue-50 border-blue-300'
                                : 'hover:bg-gray-50 border-gray-200'
                              : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className='flex items-center'>
                            <User className='w-5 h-5 text-gray-500 mr-2' />
                            <div>
                              <div className='font-medium text-sm'>
                                {teacher.fullName}
                              </div>
                              <div className='text-xs text-gray-500'>
                                ID: {teacher.employeeId}
                              </div>
                            </div>
                          </div>

                          <div className='flex items-center'>
                            {!isAvailable && (
                              <div className='mr-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center'>
                                <Clock className='w-3 h-3 mr-1' />
                                Conflict
                              </div>
                            )}

                            {currentTeacher && (
                              <div className='w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                                <Check className='w-3 h-3 text-white' />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Room Selection */}
              {/* Room selection removed as per requirements */}

              {/* Warning for conflicts */}
              {selectedTeacherId && !teacherAvailability[selectedTeacherId] && (
                <div className='mb-4 bg-red-50 border border-red-200 rounded-md p-3'>
                  <div className='flex'>
                    <AlertTriangle className='w-5 h-5 text-red-500 mr-2' />
                    <div>
                      <h4 className='text-sm font-medium text-red-800'>
                        Scheduling Conflict
                      </h4>
                      <p className='text-xs text-red-700 mt-1'>
                        This teacher is already assigned to another class during
                        this time slot. Assigning them here will create a
                        conflict.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className='flex justify-end p-4 border-t bg-gray-50'>
            <button
              onClick={closeTeacherModal}
              className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-100'
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedTeacherId || isLoading}
              className={`px-4 py-2 rounded-md text-white ${
                selectedTeacherId && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <span className='flex items-center'>
                  <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2'></span>
                  Saving...
                </span>
              ) : (
                'Save Assignment'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
