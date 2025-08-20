import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { Select } from '@/components/atoms/interactive/Select';
import Textarea from '@/components/atoms/form-controls/Textarea';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import { calendarService } from '@/api/services/calendar.service';
import {
  UpdateCalendarEntryDto,
  HolidayType,
  ExamType,
  HolidayTypeLabels,
  ExamTypeLabels,
} from '@sms/shared-types';
import { Save, X, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  event: CalendarEvent | null;
}

export default function EditEventModal({
  isOpen,
  onClose,
  onEventUpdated,
  event,
}: EditEventModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    date: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    type: '',
    // Holiday-specific fields
    holidayType: undefined as HolidayType | undefined,
    // Exam-specific fields
    examType: undefined as ExamType | undefined,
    examDetails: '',
  });

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || '',
        date: event.date || '',
        endDate: event.endDate || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        venue: event.venue || event.location || '',
        type: event.type || '',
        // Holiday-specific fields
        holidayType: event.holidayType as HolidayType | undefined,
        // Exam-specific fields
        examType: event.examType as ExamType | undefined,
        examDetails: event.examDetails || '',
      });
      setError(null);
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build update data based on event type
      const updateData: UpdateCalendarEntryDto = {
        name: form.name,
        startDate: new Date(form.date + 'T00:00:00.000Z').toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate + 'T23:59:59.999Z').toISOString()
          : undefined,
        type: form.type.toUpperCase() as any,
      };

      // Add type-specific fields
      if (form.type === 'holiday') {
        updateData.holidayType =
          form.holidayType && form.holidayType !== ''
            ? form.holidayType
            : undefined;
        // Remove time fields for holidays
        updateData.startTime = undefined;
        updateData.endTime = undefined;
        updateData.venue = undefined;
        updateData.examType = undefined;
        updateData.examDetails = undefined;
      } else if (form.type === 'exam') {
        updateData.examType =
          form.examType && form.examType !== '' ? form.examType : undefined;
        updateData.examDetails = form.examDetails || undefined;
        updateData.startTime = form.startTime || undefined;
        updateData.endTime = form.endTime || undefined;
        updateData.venue = form.venue || undefined;
        // Remove holiday-specific fields
        updateData.holidayType = undefined;
      } else if (form.type === 'event') {
        updateData.venue = form.venue || undefined;
        updateData.startTime = form.startTime || undefined;
        updateData.endTime = form.endTime || undefined;
        // Remove holiday and exam-specific fields
        updateData.holidayType = undefined;
        updateData.examType = undefined;
        updateData.examDetails = undefined;
      }

      await calendarService.updateCalendarEntry(event.id, updateData);

      toast.success('Event updated successfully!', {
        description: `${form.name} has been updated.`,
        duration: 3000,
      });

      onEventUpdated();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      toast.error('Failed to update event', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !event) return null;

  // Get event type specific configuration
  const getEventTypeConfig = (eventType: string) => {
    switch (eventType) {
      case 'holiday':
        return {
          title: 'Edit Holiday',
          icon: '🎉',
          color: 'red',
          showTime: false,
          showLocation: false,
          showEndDate: true,
          nameLabel: 'Holiday Name',
          namePlaceholder: 'e.g., Dashain Holiday',
          descriptionPlaceholder: 'Holiday description or reason',
        };
      case 'exam':
        return {
          title: 'Edit Exam',
          icon: '📝',
          color: 'purple',
          showTime: true,
          showLocation: true,
          showEndDate: false,
          nameLabel: 'Exam Name',
          namePlaceholder: 'e.g., Final Examination',
          descriptionPlaceholder: 'Exam details and instructions',
        };
      case 'event':
        return {
          title: 'Edit Event',
          icon: '🎪',
          color: 'yellow',
          showTime: true,
          showLocation: true,
          showEndDate: true,
          nameLabel: 'Event Name',
          namePlaceholder: 'e.g., Annual Sports Day',
          descriptionPlaceholder: 'Event description',
        };
      case 'meeting':
        return {
          title: 'Edit Meeting',
          icon: '🤝',
          color: 'blue',
          showTime: true,
          showLocation: true,
          showEndDate: false,
          nameLabel: 'Meeting Name',
          namePlaceholder: 'e.g., Parent-Teacher Meeting',
          descriptionPlaceholder: 'Meeting agenda and details',
        };
      default:
        return {
          title: 'Edit Event',
          icon: '📅',
          color: 'gray',
          showTime: true,
          showLocation: true,
          showEndDate: true,
          nameLabel: 'Event Name',
          namePlaceholder: 'e.g., General Event',
          descriptionPlaceholder: 'Event description',
        };
    }
  };

  const config = getEventTypeConfig(form.type);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100'>
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b text-white ${
            config.color === 'red'
              ? 'bg-gradient-to-r from-red-600 to-red-700'
              : config.color === 'purple'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                : config.color === 'yellow'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700'
                  : config.color === 'blue'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}
        >
          <div className='flex items-center gap-3'>
            <span className='text-2xl'>{config.icon}</span>
            <div>
              <SectionTitle
                text={config.title}
                className='text-white text-lg'
              />
              <p className='text-sm text-white/80'>Update event details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/20 transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-xl text-red-700'>
              <p className='font-medium'>Error</p>
              <p className='text-sm'>{error}</p>
            </div>
          )}

          {/* Event Name */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <FileText size={16} className='text-gray-500' />
              {config.nameLabel} *
            </Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={config.namePlaceholder}
              className='w-full'
            />
          </div>

          {/* Date and Time Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Calendar size={16} className='text-gray-500' />
                Start Date *
              </Label>
              <Input
                type='date'
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className='w-full'
              />
            </div>

            {config.showEndDate && (
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Calendar size={16} className='text-gray-500' />
                  End Date
                </Label>
                <Input
                  type='date'
                  value={form.endDate}
                  onChange={e =>
                    setForm(f => ({ ...f, endDate: e.target.value }))
                  }
                  className='w-full'
                />
              </div>
            )}

            {config.showTime && (
              <>
                <div className='space-y-2'>
                  <Label className='flex items-center gap-2'>
                    <Clock size={16} className='text-gray-500' />
                    Start Time
                  </Label>
                  <Input
                    type='time'
                    value={form.startTime}
                    onChange={e =>
                      setForm(f => ({ ...f, startTime: e.target.value }))
                    }
                    className='w-full'
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='flex items-center gap-2'>
                    <Clock size={16} className='text-gray-500' />
                    End Time
                  </Label>
                  <Input
                    type='time'
                    value={form.endTime}
                    onChange={e =>
                      setForm(f => ({ ...f, endTime: e.target.value }))
                    }
                    className='w-full'
                  />
                </div>
              </>
            )}

            {config.showLocation && (
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <MapPin size={16} className='text-gray-500' />
                  {form.type === 'exam' ? 'Exam Hall/Room' : 'Venue'}
                </Label>
                <Input
                  value={form.venue}
                  onChange={e =>
                    setForm(f => ({ ...f, venue: e.target.value }))
                  }
                  placeholder={
                    form.type === 'exam'
                      ? 'e.g., Room 101, Main Hall'
                      : 'e.g., Auditorium, Sports Ground'
                  }
                  className='w-full'
                />
              </div>
            )}
          </div>

          {/* Type-specific fields */}
          {form.type === 'holiday' && (
            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <FileText size={16} className='text-gray-500' />
                Holiday Type *
              </Label>
              <Select
                value={form.holidayType || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    holidayType: e.target.value as HolidayType,
                  }))
                }
                options={[
                  { value: '', label: 'Select holiday type' },
                  {
                    value: HolidayType.NATIONAL,
                    label: HolidayTypeLabels[HolidayType.NATIONAL],
                  },
                  {
                    value: HolidayType.SCHOOL,
                    label: HolidayTypeLabels[HolidayType.SCHOOL],
                  },
                ]}
                className='w-full'
              />
            </div>
          )}

          {form.type === 'exam' && (
            <>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <FileText size={16} className='text-gray-500' />
                  Exam Type *
                </Label>
                <Select
                  value={form.examType || ''}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      examType: e.target.value as ExamType,
                    }))
                  }
                  options={[
                    { value: '', label: 'Select exam type' },
                    {
                      value: ExamType.FIRST_TERM,
                      label: ExamTypeLabels[ExamType.FIRST_TERM],
                    },
                    {
                      value: ExamType.SECOND_TERM,
                      label: ExamTypeLabels[ExamType.SECOND_TERM],
                    },
                    {
                      value: ExamType.THIRD_TERM,
                      label: ExamTypeLabels[ExamType.THIRD_TERM],
                    },
                    {
                      value: ExamType.FINAL,
                      label: ExamTypeLabels[ExamType.FINAL],
                    },
                    {
                      value: ExamType.UNIT_TEST,
                      label: ExamTypeLabels[ExamType.UNIT_TEST],
                    },
                    {
                      value: ExamType.OTHER,
                      label: ExamTypeLabels[ExamType.OTHER],
                    },
                  ]}
                  className='w-full'
                />
              </div>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <FileText size={16} className='text-gray-500' />
                  Exam Details
                </Label>
                <Textarea
                  value={form.examDetails}
                  onChange={e =>
                    setForm(f => ({ ...f, examDetails: e.target.value }))
                  }
                  placeholder='e.g., Subject: Mathematics, Class: Grade 10, Duration: 3 hours, Total Marks: 100'
                  rows={4}
                  className='w-full resize-none'
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t bg-gray-50 flex justify-end gap-3'>
          <Button
            onClick={handleClose}
            variant='secondary'
            disabled={isLoading}
            className='px-6'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isLoading ||
              !form.name ||
              !form.date ||
              (form.type === 'holiday' &&
                (!form.holidayType || form.holidayType === '')) ||
              (form.type === 'exam' && (!form.examType || form.examType === ''))
            }
            className={`px-6 ${
              config.color === 'red'
                ? 'bg-red-600 hover:bg-red-700'
                : config.color === 'purple'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : config.color === 'yellow'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : config.color === 'blue'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
            } text-white`}
          >
            <Save size={16} className='mr-2' />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
