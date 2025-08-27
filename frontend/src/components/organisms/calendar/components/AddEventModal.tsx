/**
 * =============================================================================
 * Add Event Modal Component
 * =============================================================================
 * Reusable modal component for creating calendar events
 * =============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';
import {
  AddEventModalProps,
  EventFormData,
  CalendarEntryType,
  HolidayType,
  ExamType,
  EventScope,
  CreateCalendarEntryDto,
} from '../types/calendar.types';
import {
  EmergencyClosureType,
  EmergencyClosureTypeLabels,
  EmergencyClosureIcons,
  EventScopeLabels,
  EventScopeDescriptions,
} from '@sms/shared-types';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { toast } from 'sonner';

export default function AddEventModal({
  isOpen,
  onClose,
  onEventCreated,
  initialDate: _initialDate,
}: AddEventModalProps) {
  const { createEvent } = useCalendarEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startBsDate, setStartBsDate] = useState({
    year: 0,
    month: 0,
    day: 0,
  });
  const [endBsDate, setEndBsDate] = useState({ year: 0, month: 0, day: 0 });
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: CalendarEntryType.EVENT,
    eventScope: undefined,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    venue: '',
    holidayType: undefined,
    examType: undefined,
    examDetails: '',
    emergencyClosureType: undefined,
    emergencyReason: '',
    affectedAreas: '',
  });

  // Nepali month names
  const nepaliMonths = [
    'बैशाख',
    'जेठ',
    'असार',
    'साउन',
    'भदौ',
    'असोज',
    'कार्तिक',
    'मंसिर',
    'पुष',
    'माघ',
    'फागुन',
    'चैत',
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        type: CalendarEntryType.EVENT,
        eventScope: undefined,
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        venue: '',
        holidayType: undefined,
        examType: undefined,
        examDetails: '',
        emergencyClosureType: undefined,
        emergencyReason: '',
        affectedAreas: '',
      });

      // Reset BS dates to empty state
      setStartBsDate({
        year: 0,
        month: 0,
        day: 0,
      });
      setEndBsDate({
        year: 0,
        month: 0,
        day: 0,
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a name for the event.',
        duration: 3000,
      });
      return;
    }

    if (!formData.startDate) {
      toast.error('Validation Error', {
        description: 'Please select a start date.',
        duration: 3000,
      });
      return;
    }

    if (!formData.endDate) {
      toast.error('Validation Error', {
        description: 'Please select an end date.',
        duration: 3000,
      });
      return;
    }

    if (formData.type === CalendarEntryType.EVENT && !formData.venue?.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a venue for the event.',
        duration: 3000,
      });
      return;
    }

    if (formData.type === CalendarEntryType.EVENT && !formData.eventScope) {
      toast.error('Validation Error', {
        description: 'Please select an event type (Partial or School-wide).',
        duration: 3000,
      });
      return;
    }

    if (formData.type === CalendarEntryType.HOLIDAY && !formData.holidayType) {
      toast.error('Validation Error', {
        description: 'Please select a holiday type.',
        duration: 3000,
      });
      return;
    }

    if (formData.type === CalendarEntryType.EXAM && !formData.examType) {
      toast.error('Validation Error', {
        description: 'Please select an exam type.',
        duration: 3000,
      });
      return;
    }

    if (
      formData.type === CalendarEntryType.EMERGENCY_CLOSURE &&
      !formData.emergencyClosureType
    ) {
      toast.error('Validation Error', {
        description: 'Please select an emergency closure type.',
        duration: 3000,
      });
      return;
    }

    if (
      formData.type === CalendarEntryType.EMERGENCY_CLOSURE &&
      !formData.emergencyReason?.trim()
    ) {
      toast.error('Validation Error', {
        description: 'Please provide a reason for the emergency closure.',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create proper datetime strings based on event type (force UTC to avoid timezone issues)
      const startDateTime =
        (formData.type === CalendarEntryType.EVENT ||
          formData.type === CalendarEntryType.EXAM) &&
        formData.startTime
          ? new Date(
              `${formData.startDate}T${formData.startTime}:00.000Z`,
            ).toISOString()
          : new Date(`${formData.startDate}T00:00:00.000Z`).toISOString();

      const endDateTime =
        (formData.type === CalendarEntryType.EVENT ||
          formData.type === CalendarEntryType.EXAM) &&
        formData.endTime
          ? new Date(
              `${formData.endDate}T${formData.endTime}:00.000Z`,
            ).toISOString()
          : new Date(`${formData.endDate}T23:59:59.000Z`).toISOString();

      const createDto: CreateCalendarEntryDto = {
        name: formData.name.trim(),
        type: formData.type,
        startDate: startDateTime,
        endDate: endDateTime,
        ...(formData.type === CalendarEntryType.EVENT && {
          venue: formData.venue?.trim(),
          eventScope: formData.eventScope,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
        ...(formData.type === CalendarEntryType.HOLIDAY && {
          holidayType: formData.holidayType,
        }),
        ...(formData.type === CalendarEntryType.EXAM && {
          examType: formData.examType,
          examDetails: formData.examDetails?.trim(),
          venue: formData.venue?.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
        ...(formData.type === CalendarEntryType.EMERGENCY_CLOSURE && {
          emergencyClosureType: formData.emergencyClosureType,
          emergencyReason: formData.emergencyReason?.trim(),
          affectedAreas: formData.affectedAreas?.trim(),
        }),
      };

      await createEvent(createDto);

      toast.success('Event created successfully!', {
        description: `${formData.name} has been added to the calendar.`,
        duration: 3000,
      });

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create calendar entry:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create calendar entry. Please try again.';
      toast.error('Failed to create event', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset type-specific fields when type changes
      ...(field === 'type' &&
        value === CalendarEntryType.EVENT && {
          holidayType: undefined,
          examType: undefined,
          examDetails: '',
          emergencyClosureType: undefined,
          emergencyReason: '',
          affectedAreas: '',
          startTime: '09:00',
          endTime: '17:00',
        }),
      ...(field === 'type' &&
        value === CalendarEntryType.HOLIDAY && {
          venue: '',
          eventScope: undefined,
          examType: undefined,
          examDetails: '',
          emergencyClosureType: undefined,
          emergencyReason: '',
          affectedAreas: '',
          startTime: undefined,
          endTime: undefined,
        }),
      ...(field === 'type' &&
        value === CalendarEntryType.EXAM && {
          venue: '',
          eventScope: undefined,
          holidayType: undefined,
          emergencyClosureType: undefined,
          emergencyReason: '',
          affectedAreas: '',
          startTime: '09:00',
          endTime: '17:00',
        }),
      ...(field === 'type' &&
        value === CalendarEntryType.EMERGENCY_CLOSURE && {
          venue: '',
          eventScope: undefined,
          holidayType: undefined,
          examType: undefined,
          examDetails: '',
          startTime: undefined,
          endTime: undefined,
        }),
    }));
  };

  // Convert BS date to AD date for form submission
  const convertBsToAdDate = (bsDateObj: {
    year: number;
    month: number;
    day: number;
  }) => {
    try {
      const adDate = bs2ad(bsDateObj.year, bsDateObj.month, bsDateObj.day);
      const adDateString = `${adDate.year}-${adDate.month.toString().padStart(2, '0')}-${adDate.date.toString().padStart(2, '0')}`;
      return adDateString;
    } catch (error) {
      console.error('BS to AD conversion error:', error);
      return '';
    }
  };

  // Handle BS date changes for start date
  const handleStartBsDateChange = (
    field: 'year' | 'month' | 'day',
    value: number,
  ) => {
    setStartBsDate(prev => {
      const newBsDate = { ...prev, [field]: value };

      // Only convert if all fields have valid values
      if (
        newBsDate.year === 0 ||
        newBsDate.month === 0 ||
        newBsDate.day === 0
      ) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
        }));
        return newBsDate;
      }

      // Validate BS date ranges
      if (newBsDate.year < 2070 || newBsDate.year > 2100) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.month < 1 || newBsDate.month > 12) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.day < 1 || newBsDate.day > 32) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
        }));
        return newBsDate;
      }

      // Convert to AD and update form data
      try {
        const adDate = bs2ad(newBsDate.year, newBsDate.month, newBsDate.day);

        if (
          adDate &&
          typeof adDate === 'object' &&
          adDate.year &&
          adDate.month &&
          adDate.date
        ) {
          const adDateString = `${adDate.year}-${adDate.month.toString().padStart(2, '0')}-${adDate.date.toString().padStart(2, '0')}`;

          // Validate the resulting AD date
          const testDate = new Date(adDateString);
          if (!isNaN(testDate.getTime())) {
            setFormData(prevForm => ({
              ...prevForm,
              startDate: adDateString,
            }));
          } else {
            setFormData(prevForm => ({
              ...prevForm,
              startDate: '',
            }));
          }
        } else {
          setFormData(prevForm => ({
            ...prevForm,
            startDate: '',
          }));
        }
      } catch (error) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
        }));
      }

      return newBsDate;
    });
  };

  // Handle BS date changes for end date
  const handleEndBsDateChange = (
    field: 'year' | 'month' | 'day',
    value: number,
  ) => {
    setEndBsDate(prev => {
      const newBsDate = { ...prev, [field]: value };

      // Only convert if all fields have valid values
      if (
        newBsDate.year === 0 ||
        newBsDate.month === 0 ||
        newBsDate.day === 0
      ) {
        setFormData(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      // Validate BS date ranges
      if (newBsDate.year < 2070 || newBsDate.year > 2100) {
        setFormData(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.month < 1 || newBsDate.month > 12) {
        setFormData(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.day < 1 || newBsDate.day > 32) {
        setFormData(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      // Convert to AD and update form data
      try {
        const adDate = bs2ad(newBsDate.year, newBsDate.month, newBsDate.day);

        if (
          adDate &&
          typeof adDate === 'object' &&
          adDate.year &&
          adDate.month &&
          adDate.date
        ) {
          const adDateString = `${adDate.year}-${adDate.month.toString().padStart(2, '0')}-${adDate.date.toString().padStart(2, '0')}`;

          // Validate the resulting AD date
          const testDate = new Date(adDateString);
          if (!isNaN(testDate.getTime())) {
            setFormData(prevForm => ({
              ...prevForm,
              endDate: adDateString,
            }));
          } else {
            setFormData(prevForm => ({
              ...prevForm,
              endDate: '',
            }));
          }
        } else {
          setFormData(prevForm => ({
            ...prevForm,
            endDate: '',
          }));
        }
      } catch (error) {
        setFormData(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
      }

      return newBsDate;
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Add Calendar Entry
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            disabled={isSubmitting}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          {/* Entry Type */}
          <div>
            <label
              htmlFor='type'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Type <span className='text-red-500'>*</span>
            </label>
            <select
              id='type'
              value={formData.type}
              onChange={e =>
                handleInputChange('type', e.target.value as CalendarEntryType)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={isSubmitting}
              required
            >
              <option value={CalendarEntryType.EVENT}>Event</option>
              <option value={CalendarEntryType.HOLIDAY}>Holiday</option>
              <option value={CalendarEntryType.EXAM}>Exam</option>
              <option value={CalendarEntryType.EMERGENCY_CLOSURE}>
                Emergency Closure
              </option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              id='name'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter event/holiday name'
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Start Date (BS) */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Start Date (BS - Bikram Sambat){' '}
              <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {/* Year */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Year</label>
                <input
                  type='number'
                  value={startBsDate.year || ''}
                  onChange={e =>
                    handleStartBsDateChange(
                      'year',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='2070'
                  max='2100'
                  disabled={isSubmitting}
                  placeholder='2082'
                />
              </div>

              {/* Month */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>
                  Month
                </label>
                <select
                  value={startBsDate.month || ''}
                  onChange={e =>
                    handleStartBsDateChange(
                      'month',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  disabled={isSubmitting}
                >
                  <option value=''>Select Month</option>
                  {nepaliMonths.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}. {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Day</label>
                <input
                  type='number'
                  value={startBsDate.day || ''}
                  onChange={e =>
                    handleStartBsDateChange(
                      'day',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='1'
                  max='32'
                  disabled={isSubmitting}
                  placeholder='1'
                />
              </div>
            </div>

            {/* Start Date Display - Only show when valid date is selected */}
            {startBsDate.year > 0 &&
              startBsDate.month > 0 &&
              startBsDate.day > 0 && (
                <div className='mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg'>
                  <div className='text-sm text-blue-800 font-medium'>
                    <strong>Start BS Date:</strong>{' '}
                    {nepaliMonths[startBsDate.month - 1] || 'Invalid'}{' '}
                    {startBsDate.day}, {startBsDate.year}
                  </div>
                  <div className='text-xs text-blue-600 mt-1'>
                    <strong>Equivalent AD Date:</strong>{' '}
                    {formData.startDate
                      ? new Date(formData.startDate).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )
                      : 'Calculating...'}
                  </div>
                  {!formData.startDate && (
                    <div className='text-xs text-red-600 mt-1'>
                      ⚠️ Please select a valid BS date (Year: 2070-2100)
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* End Date (BS) */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              End Date (BS - Bikram Sambat){' '}
              <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {/* Year */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Year</label>
                <input
                  type='number'
                  value={endBsDate.year || ''}
                  onChange={e =>
                    handleEndBsDateChange('year', parseInt(e.target.value) || 0)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='2070'
                  max='2100'
                  disabled={isSubmitting}
                  placeholder='2082'
                />
              </div>

              {/* Month */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>
                  Month
                </label>
                <select
                  value={endBsDate.month || ''}
                  onChange={e =>
                    handleEndBsDateChange(
                      'month',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  disabled={isSubmitting}
                >
                  <option value=''>Select Month</option>
                  {nepaliMonths.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}. {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Day</label>
                <input
                  type='number'
                  value={endBsDate.day || ''}
                  onChange={e =>
                    handleEndBsDateChange('day', parseInt(e.target.value) || 0)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='1'
                  max='32'
                  disabled={isSubmitting}
                  placeholder='1'
                />
              </div>
            </div>

            {/* End Date Display - Only show when valid date is selected */}
            {endBsDate.year > 0 && endBsDate.month > 0 && endBsDate.day > 0 && (
              <div className='mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                <div className='text-sm text-green-800 font-medium'>
                  <strong>End BS Date:</strong>{' '}
                  {nepaliMonths[endBsDate.month - 1] || 'Invalid'}{' '}
                  {endBsDate.day}, {endBsDate.year}
                </div>
                <div className='text-xs text-green-600 mt-1'>
                  <strong>Equivalent AD Date:</strong>{' '}
                  {formData.endDate
                    ? new Date(formData.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Calculating...'}
                </div>
                {!formData.endDate && (
                  <div className='text-xs text-red-600 mt-1'>
                    ⚠️ Please select a valid BS date (Year: 2070-2100)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Fields (for Events and Exams) */}
          {(formData.type === CalendarEntryType.EVENT ||
            formData.type === CalendarEntryType.EXAM) && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='startTime'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Start Time
                </label>
                <input
                  type='time'
                  id='startTime'
                  value={formData.startTime || ''}
                  onChange={e => handleInputChange('startTime', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label
                  htmlFor='endTime'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  End Time
                </label>
                <input
                  type='time'
                  id='endTime'
                  value={formData.endTime || ''}
                  onChange={e => handleInputChange('endTime', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Event-specific fields */}
          {formData.type === CalendarEntryType.EVENT && (
            <>
              <div>
                <label
                  htmlFor='venue'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Venue <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  id='venue'
                  value={formData.venue || ''}
                  onChange={e => handleInputChange('venue', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter event venue'
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor='eventScope'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Event Type <span className='text-red-500'>*</span>
                </label>
                <select
                  id='eventScope'
                  value={formData.eventScope || ''}
                  onChange={e =>
                    handleInputChange('eventScope', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  disabled={isSubmitting}
                  required
                >
                  <option value=''>Select event type</option>
                  <option value='PARTIAL'>
                    Partial Event (Normal Attendance)
                  </option>
                  <option value='SCHOOL_WIDE'>
                    School-wide Event (No Attendance)
                  </option>
                </select>
                <p className='text-sm text-gray-500 mt-1'>
                  {formData.eventScope === 'PARTIAL' &&
                    'This event affects only some classes/students. School remains open and attendance is taken normally.'}
                  {formData.eventScope === 'SCHOOL_WIDE' &&
                    'This event affects the entire school. School is closed and this day is excluded from attendance calculations.'}
                </p>
              </div>
            </>
          )}

          {/* Holiday-specific fields */}
          {formData.type === CalendarEntryType.HOLIDAY && (
            <div>
              <label
                htmlFor='holidayType'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Holiday Type <span className='text-red-500'>*</span>
              </label>
              <select
                id='holidayType'
                value={formData.holidayType || ''}
                onChange={e =>
                  handleInputChange(
                    'holidayType',
                    e.target.value as HolidayType,
                  )
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                disabled={isSubmitting}
                required
              >
                <option value=''>Select holiday type</option>
                <option value={HolidayType.NATIONAL}>National Holiday</option>
                <option value={HolidayType.SCHOOL}>School Holiday</option>
              </select>
            </div>
          )}

          {/* Exam-specific fields */}
          {formData.type === CalendarEntryType.EXAM && (
            <>
              <div>
                <label
                  htmlFor='examType'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Exam Type <span className='text-red-500'>*</span>
                </label>
                <select
                  id='examType'
                  value={formData.examType || ''}
                  onChange={e =>
                    handleInputChange('examType', e.target.value as ExamType)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  disabled={isSubmitting}
                  required
                >
                  <option value=''>Select exam type</option>
                  <option value={ExamType.FIRST_TERM}>First Term</option>
                  <option value={ExamType.SECOND_TERM}>Second Term</option>
                  <option value={ExamType.THIRD_TERM}>Third Term</option>
                  <option value={ExamType.FINAL}>Final</option>
                  <option value={ExamType.UNIT_TEST}>Unit Test</option>
                  <option value={ExamType.OTHER}>Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='examDetails'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Exam Details (Optional)
                </label>
                <textarea
                  id='examDetails'
                  value={formData.examDetails || ''}
                  onChange={e =>
                    handleInputChange('examDetails', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter additional exam details, subjects, or instructions...'
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* Emergency Closure-specific fields */}
          {formData.type === CalendarEntryType.EMERGENCY_CLOSURE && (
            <>
              <div>
                <label
                  htmlFor='emergencyClosureType'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Emergency Type <span className='text-red-500'>*</span>
                </label>
                <select
                  id='emergencyClosureType'
                  value={formData.emergencyClosureType || ''}
                  onChange={e =>
                    handleInputChange(
                      'emergencyClosureType',
                      e.target.value as EmergencyClosureType,
                    )
                  }
                  className='w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  disabled={isSubmitting}
                  required
                >
                  <option value=''>Select emergency type</option>
                  {Object.values(EmergencyClosureType).map(type => (
                    <option key={type} value={type}>
                      {EmergencyClosureIcons[type]}{' '}
                      {EmergencyClosureTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor='emergencyReason'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Emergency Reason <span className='text-red-500'>*</span>
                </label>
                <textarea
                  id='emergencyReason'
                  value={formData.emergencyReason || ''}
                  onChange={e =>
                    handleInputChange('emergencyReason', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  placeholder='Describe the emergency situation and reason for closure...'
                  rows={3}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor='affectedAreas'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Affected Areas (Optional)
                </label>
                <textarea
                  id='affectedAreas'
                  value={formData.affectedAreas || ''}
                  onChange={e =>
                    handleInputChange('affectedAreas', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  placeholder='Specify areas/departments affected (e.g., "All classrooms", "Library and Labs", etc.)'
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-start space-x-2'>
                  <span className='text-red-600 text-lg'>⚠️</span>
                  <div className='text-sm text-red-800'>
                    <p className='font-medium'>Important Note:</p>
                    <p>
                      Emergency closures automatically mark the affected days as
                      non-working days for attendance calculation. Students and
                      staff will not be required to attend during this period.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isSubmitting}
            >
              <Save className='w-4 h-4' />
              <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
