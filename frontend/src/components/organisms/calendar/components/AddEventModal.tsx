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
  CreateCalendarEntryDto,
} from '../types/calendar.types';
import { useCalendarEvents } from '../hooks/useCalendarEvents';

export default function AddEventModal({
  isOpen,
  onClose,
  onEventCreated,
  initialDate,
}: AddEventModalProps) {
  const { createEvent } = useCalendarEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bsDate, setBsDate] = useState({ year: 2081, month: 1, day: 1 });
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: CalendarEntryType.EVENT,
    startDate: initialDate || '',
    endDate: initialDate || '',
    startTime: '09:00',
    endTime: '17:00',
    venue: '',
    holidayType: undefined,
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
        startDate: initialDate || '',
        endDate: initialDate || '',
        startTime: '09:00',
        endTime: '17:00',
        venue: '',
        holidayType: undefined,
      });

      // Set BS date based on initialDate or current date
      if (initialDate) {
        // Convert the provided initialDate (AD) to BS
        try {
          const selectedDate = new Date(initialDate);
          const selectedBS = ad2bs(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            selectedDate.getDate(),
          );
          if (
            selectedBS &&
            selectedBS.year &&
            selectedBS.month &&
            selectedBS.date
          ) {
            setBsDate({
              year: selectedBS.year,
              month: selectedBS.month,
              day: selectedBS.date,
            });
          } else {
            throw new Error('Invalid selected BS date');
          }
        } catch (error) {
          console.error('Failed to convert initialDate to BS:', error);
          // Fallback to current date
          const today = new Date();
          const currentBS = ad2bs(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          );
          setBsDate({
            year: currentBS.year,
            month: currentBS.month,
            day: currentBS.date,
          });
        }
      } else {
        // Use current date if no initialDate provided
        try {
          const today = new Date();
          const currentBS = ad2bs(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          );
          if (
            currentBS &&
            currentBS.year &&
            currentBS.month &&
            currentBS.date
          ) {
            setBsDate({
              year: currentBS.year,
              month: currentBS.month,
              day: currentBS.date,
            });
          } else {
            throw new Error('Invalid current BS date');
          }
        } catch (error) {
          setBsDate({ year: 2081, month: 9, day: 15 }); // Default to a safe date
        }
      }
    }
  }, [isOpen, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    if (!formData.startDate) {
      alert('Please select a start date');
      return;
    }

    if (!formData.endDate) {
      alert('Please select an end date');
      return;
    }

    if (formData.type === CalendarEntryType.EVENT && !formData.venue?.trim()) {
      alert('Please enter a venue for the event');
      return;
    }

    if (formData.type === CalendarEntryType.HOLIDAY && !formData.holidayType) {
      alert('Please select a holiday type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create proper datetime strings based on event type (force UTC to avoid timezone issues)
      const startDateTime =
        formData.type === CalendarEntryType.EVENT && formData.startTime
          ? new Date(
              `${formData.startDate}T${formData.startTime}:00.000Z`,
            ).toISOString()
          : new Date(`${formData.startDate}T00:00:00.000Z`).toISOString();

      const endDateTime =
        formData.type === CalendarEntryType.EVENT && formData.endTime
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
        }),
        ...(formData.type === CalendarEntryType.HOLIDAY && {
          holidayType: formData.holidayType,
        }),
      };

      await createEvent(createDto);

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create calendar entry:', error);
      alert('Failed to create calendar entry. Please try again.');
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
          startTime: '09:00',
          endTime: '17:00',
        }),
      ...(field === 'type' &&
        value === CalendarEntryType.HOLIDAY && {
          venue: '',
          startTime: undefined,
          endTime: undefined,
        }),
    }));
  };

  // Convert BS date to AD date for form submission
  const convertBsToAdDate = () => {
    try {
      const adDate = bs2ad(bsDate.year, bsDate.month, bsDate.day);
      const adDateString = `${adDate.year}-${adDate.month.toString().padStart(2, '0')}-${adDate.date.toString().padStart(2, '0')}`;
      return adDateString;
    } catch (error) {
      console.error('BS to AD conversion error:', error);
      return '';
    }
  };

  // Handle BS date changes
  const handleBsDateChange = (
    field: 'year' | 'month' | 'day',
    value: number,
  ) => {
    setBsDate(prev => {
      const newBsDate = { ...prev, [field]: value };

      // Validate BS date ranges
      if (newBsDate.year < 2070 || newBsDate.year > 2090) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.month < 1 || newBsDate.month > 12) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.day < 1 || newBsDate.day > 32) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
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
              startDate: adDateString,
              endDate: adDateString,
            }));
          } else {
            setFormData(prevForm => ({
              ...prevForm,
              startDate: '',
              endDate: '',
            }));
          }
        } else {
          setFormData(prevForm => ({
            ...prevForm,
            startDate: '',
            endDate: '',
          }));
        }
      } catch (error) {
        setFormData(prevForm => ({
          ...prevForm,
          startDate: '',
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

          {/* BS Date Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date (BS - Bikram Sambat) <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {/* Year */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Year</label>
                <input
                  type='number'
                  value={bsDate.year}
                  onChange={e =>
                    handleBsDateChange('year', parseInt(e.target.value) || 2081)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='2070'
                  max='2090'
                  disabled={isSubmitting}
                  placeholder='2081'
                />
              </div>

              {/* Month */}
              <div>
                <label className='block text-xs text-gray-500 mb-1'>
                  Month
                </label>
                <select
                  value={bsDate.month}
                  onChange={e =>
                    handleBsDateChange('month', parseInt(e.target.value))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  disabled={isSubmitting}
                >
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
                  value={bsDate.day}
                  onChange={e =>
                    handleBsDateChange('day', parseInt(e.target.value) || 1)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  min='1'
                  max='32'
                  disabled={isSubmitting}
                  placeholder='1'
                />
              </div>
            </div>

            {/* BS Date Display */}
            <div className='mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg'>
              <div className='text-sm text-blue-800 font-medium'>
                <strong>Selected BS Date:</strong>{' '}
                {nepaliMonths[bsDate.month - 1] || 'Invalid'} {bsDate.day},{' '}
                {bsDate.year}
              </div>
              <div className='text-xs text-blue-600 mt-1'>
                <strong>Equivalent AD Date:</strong>{' '}
                {formData.startDate
                  ? new Date(formData.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Calculating...'}
              </div>
              {!formData.startDate && (
                <div className='text-xs text-red-600 mt-1'>
                  ⚠️ Please select a valid BS date (Year: 2070-2090)
                </div>
              )}
            </div>
          </div>

          {/* Time Fields (only for Events) */}
          {formData.type === CalendarEntryType.EVENT && (
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
