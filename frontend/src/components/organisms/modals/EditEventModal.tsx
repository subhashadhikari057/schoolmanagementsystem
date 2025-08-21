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
import { ad2bs, bs2ad } from 'hamro-nepali-patro';

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

  // BS date state
  const [startBsDate, setStartBsDate] = useState({
    year: 2081,
    month: 1,
    day: 1,
  });
  const [endBsDate, setEndBsDate] = useState({
    year: 2081,
    month: 1,
    day: 1,
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

      // Convert AD dates to BS dates
      if (event.date) {
        try {
          const adDate = new Date(event.date);
          const bsDate = ad2bs(
            adDate.getFullYear(),
            adDate.getMonth() + 1,
            adDate.getDate(),
          );
          if (bsDate && typeof bsDate === 'object') {
            setStartBsDate({
              year: bsDate.year,
              month: bsDate.month,
              day: bsDate.date,
            });
          }
        } catch (error) {
          console.error('Error converting start date to BS:', error);
        }
      }

      if (event.endDate) {
        try {
          const adDate = new Date(event.endDate);
          const bsDate = ad2bs(
            adDate.getFullYear(),
            adDate.getMonth() + 1,
            adDate.getDate(),
          );
          if (bsDate && typeof bsDate === 'object') {
            setEndBsDate({
              year: bsDate.year,
              month: bsDate.month,
              day: bsDate.date,
            });
          }
        } catch (error) {
          console.error('Error converting end date to BS:', error);
        }
      }

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

  // Handle BS date changes for start date
  const handleStartBsDateChange = (
    field: 'year' | 'month' | 'day',
    value: number,
  ) => {
    setStartBsDate(prev => {
      const newBsDate = { ...prev, [field]: value };

      // Validate BS date ranges
      if (newBsDate.year < 2070 || newBsDate.year > 2090) {
        setForm(prevForm => ({
          ...prevForm,
          date: '',
        }));
        return newBsDate;
      }

      if (newBsDate.month < 1 || newBsDate.month > 12) {
        setForm(prevForm => ({
          ...prevForm,
          date: '',
        }));
        return newBsDate;
      }

      if (newBsDate.day < 1 || newBsDate.day > 32) {
        setForm(prevForm => ({
          ...prevForm,
          date: '',
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
            setForm(prevForm => ({
              ...prevForm,
              date: adDateString,
            }));
          } else {
            setForm(prevForm => ({
              ...prevForm,
              date: '',
            }));
          }
        } else {
          setForm(prevForm => ({
            ...prevForm,
            date: '',
          }));
        }
      } catch (error) {
        setForm(prevForm => ({
          ...prevForm,
          date: '',
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

      // Validate BS date ranges
      if (newBsDate.year < 2070 || newBsDate.year > 2090) {
        setForm(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.month < 1 || newBsDate.month > 12) {
        setForm(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
        return newBsDate;
      }

      if (newBsDate.day < 1 || newBsDate.day > 32) {
        setForm(prevForm => ({
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
            setForm(prevForm => ({
              ...prevForm,
              endDate: adDateString,
            }));
          } else {
            setForm(prevForm => ({
              ...prevForm,
              endDate: '',
            }));
          }
        } else {
          setForm(prevForm => ({
            ...prevForm,
            endDate: '',
          }));
        }
      } catch (error) {
        setForm(prevForm => ({
          ...prevForm,
          endDate: '',
        }));
      }

      return newBsDate;
    });
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
          showTime: false,
          showLocation: false,
          showEndDate: true,
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
    <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
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
                Start Date (BS) *
              </Label>
              <div className='grid grid-cols-3 gap-2'>
                <div>
                  <Select
                    value={startBsDate.year.toString()}
                    onChange={e =>
                      handleStartBsDateChange('year', parseInt(e.target.value))
                    }
                    options={Array.from({ length: 21 }, (_, i) => ({
                      value: (2070 + i).toString(),
                      label: (2070 + i).toString(),
                    }))}
                    className='w-full'
                  />
                </div>
                <div>
                  <Select
                    value={startBsDate.month.toString()}
                    onChange={e =>
                      handleStartBsDateChange('month', parseInt(e.target.value))
                    }
                    options={nepaliMonths.map((month, index) => ({
                      value: (index + 1).toString(),
                      label: month,
                    }))}
                    className='w-full'
                  />
                </div>
                <div>
                  <Select
                    value={startBsDate.day.toString()}
                    onChange={e =>
                      handleStartBsDateChange('day', parseInt(e.target.value))
                    }
                    options={Array.from({ length: 32 }, (_, i) => ({
                      value: (i + 1).toString(),
                      label: (i + 1).toString(),
                    }))}
                    className='w-full'
                  />
                </div>
              </div>
              {form.date && (
                <p className='text-xs text-gray-500'>
                  AD: {new Date(form.date).toLocaleDateString('en-US')}
                </p>
              )}
            </div>

            {config.showEndDate && (
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Calendar size={16} className='text-gray-500' />
                  End Date (BS)
                </Label>
                <div className='grid grid-cols-3 gap-2'>
                  <div>
                    <Select
                      value={endBsDate.year.toString()}
                      onChange={e =>
                        handleEndBsDateChange('year', parseInt(e.target.value))
                      }
                      options={Array.from({ length: 21 }, (_, i) => ({
                        value: (2070 + i).toString(),
                        label: (2070 + i).toString(),
                      }))}
                      className='w-full'
                    />
                  </div>
                  <div>
                    <Select
                      value={endBsDate.month.toString()}
                      onChange={e =>
                        handleEndBsDateChange('month', parseInt(e.target.value))
                      }
                      options={nepaliMonths.map((month, index) => ({
                        value: (index + 1).toString(),
                        label: month,
                      }))}
                      className='w-full'
                    />
                  </div>
                  <div>
                    <Select
                      value={endBsDate.day.toString()}
                      onChange={e =>
                        handleEndBsDateChange('day', parseInt(e.target.value))
                      }
                      options={Array.from({ length: 32 }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: (i + 1).toString(),
                      }))}
                      className='w-full'
                    />
                  </div>
                </div>
                {form.endDate && (
                  <p className='text-xs text-gray-500'>
                    AD: {new Date(form.endDate).toLocaleDateString('en-US')}
                  </p>
                )}
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
                  {form.type === 'exam' ? 'Exam Venue' : 'Venue'}
                </Label>
                <Input
                  value={form.venue}
                  onChange={e =>
                    setForm(f => ({ ...f, venue: e.target.value }))
                  }
                  placeholder={
                    form.type === 'exam'
                      ? 'e.g., Room 101, Main Hall, Auditorium'
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
                  placeholder='e.g., Subject: Mathematics, Class: Grade 10, Duration: 3 hours, Total Marks: 100, Instructions: Bring calculator and ruler'
                  rows={3}
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
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              config.color === 'red'
                ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                : config.color === 'purple'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  : config.color === 'yellow'
                    ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg hover:shadow-xl'
                    : config.color === 'blue'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-600 hover:bg-gray-700 shadow-lg hover:shadow-xl'
            } text-white transform hover:scale-105`}
          >
            <Save size={16} className='mr-2' />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
