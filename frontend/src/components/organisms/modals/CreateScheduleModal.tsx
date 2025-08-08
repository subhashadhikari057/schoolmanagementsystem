'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ToggleButton from '@/components/atoms/form-controls/ToggleButton';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import {
  basicInfoSchema,
  timeSlotsSchema,
  type BasicInfo,
  type TimeSlot,
} from '@/lib/validations/schedule';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEditMode?: boolean;
  initialData?: {
    basicInfo: BasicInfo;
    timeSlots: TimeSlot[];
  };
}

const gradeOptions = [
  { value: 'Grade 10', label: 'Grade 10' },
  { value: 'Grade 11', label: 'Grade 11' },
  { value: 'Grade 12', label: 'Grade 12' },
];

const sectionOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

const academicYearOptions = [
  { value: '2024-25', label: '2024-25' },
  { value: '2025-26', label: '2025-26' },
  { value: '2026-27', label: '2026-27' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const periodTypeOptions = [
  { value: 'regular', label: 'Regular' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'activity', label: 'Activity' },
  { value: 'study_hall', label: 'Study Hall' },
];

export default function CreateScheduleModal({
  isOpen,
  onClose,
  onSuccess,
  isEditMode = false,
  initialData,
}: CreateScheduleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [basicInfo, setBasicInfo] = useState<BasicInfo>(
    initialData?.basicInfo || {
      scheduleName: '',
      grade: '',
      section: '',
      academicYear: '2024-25',
      startDate: '',
      endDate: '',
      effectiveFrom: '',
      status: 'draft',
    },
  );

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(
    initialData?.timeSlots || [
      { startTime: '08:00', endTime: '08:50', type: 'regular' },
      { startTime: '08:50', endTime: '09:40', type: 'regular' },
      { startTime: '09:40', endTime: '10:00', type: 'break' },
      { startTime: '10:00', endTime: '10:50', type: 'regular' },
      { startTime: '10:50', endTime: '11:40', type: 'regular' },
    ],
  );

  const steps = useMemo(
    () => [
      { number: 1, title: 'Basic Information' },
      { number: 2, title: 'Configure Time Slots' },
      { number: 3, title: 'Schedule Preview & Confirmation' },
    ],
    [],
  );

  const validateStep = useCallback(
    (step: number) => {
      setErrors({});
      try {
        if (step === 1) basicInfoSchema.parse(basicInfo);
        else if (step === 2) timeSlotsSchema.parse({ timeSlots });
        return true;
      } catch (e: any) {
        e.errors?.forEach((err: any) => {
          if (err.path?.[0])
            setErrors(prev => ({ ...prev, [err.path[0]]: err.message }));
        });
        return false;
      }
    },
    [basicInfo, timeSlots],
  );

  const totalDuration = useMemo(
    () =>
      timeSlots.reduce((sum, slot) => {
        if (!slot.startTime || !slot.endTime) return sum;
        const diff =
          new Date(`2000-01-01T${slot.endTime}`).getTime() -
          new Date(`2000-01-01T${slot.startTime}`).getTime();
        return sum + Math.round(diff / 60000);
      }, 0),
    [timeSlots],
  );

  const regularPeriods = useMemo(
    () => timeSlots.filter(s => s.type === 'regular').length,
    [timeSlots],
  );
  const breaks = useMemo(
    () => timeSlots.filter(s => s.type === 'break').length,
    [timeSlots],
  );

  const handleFieldChange = useCallback(
    (field: keyof BasicInfo, value: string) =>
      setBasicInfo(prev => ({ ...prev, [field]: value })),
    [],
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) setCurrentStep(step => step + 1);
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(step => step - 1);
  }, []);

  const handleSubmit = useCallback(() => {
    if (validateStep(currentStep)) {
      console.log('Schedule created:', { basicInfo, timeSlots });
      onSuccess();
      onClose();
    }
  }, [currentStep, validateStep, basicInfo, timeSlots, onClose, onSuccess]);

  const addTimeSlot = useCallback(
    () =>
      setTimeSlots(prev => [
        ...prev,
        { startTime: '', endTime: '', type: 'regular' },
      ]),
    [],
  );

  const removeTimeSlot = useCallback(
    (idx: number) => setTimeSlots(prev => prev.filter((_, i) => i !== idx)),
    [],
  );

  const updateTimeSlot = useCallback(
    (idx: number, field: keyof TimeSlot, value: string) =>
      setTimeSlots(prev => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      }),
    [],
  );

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-visible relative'>
        {/* HEADER */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center gap-3'>
            <Calendar className='w-6 h-6 text-blue-600' />
            <h2 className='text-xl font-semibold'>
              {isEditMode ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* STEPS */}
        <div className='p-6 border-b'>
          <div className='flex items-center justify-center gap-8'>
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= s.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s.number}
                  </div>
                  <span
                    className={`text-sm ${
                      currentStep >= s.number
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 ${
                      currentStep > s.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className='p-6 overflow-auto h-[calc(70vh-240px)]'>
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h3 className='text-lg font-semibold'>
                Step 1: Basic Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <LabeledInputField
                  label='Schedule Name *'
                  value={basicInfo.scheduleName}
                  onChange={e =>
                    handleFieldChange('scheduleName', e.target.value)
                  }
                  placeholder='e.g., Grade 10A Weekly Schedule'
                  error={errors.scheduleName}
                />
                {/* Grade */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Grade *
                  </label>
                  <Dropdown
                    type='filter'
                    options={gradeOptions}
                    selectedValue={basicInfo.grade}
                    onSelect={v => handleFieldChange('grade', v)}
                    placeholder='Select grade'
                    className={`w-full ${errors.grade ? 'border-red-500' : ''}`}
                  />
                  {errors.grade && (
                    <p className='text-red-500 text-sm mt-1'>{errors.grade}</p>
                  )}
                </div>
                {/* Section */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section *
                  </label>
                  <Dropdown
                    type='filter'
                    options={sectionOptions}
                    selectedValue={basicInfo.section}
                    onSelect={v => handleFieldChange('section', v)}
                    placeholder='Select section'
                    className={`w-full ${errors.section ? 'border-red-500' : ''}`}
                  />
                  {errors.section && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.section}
                    </p>
                  )}
                </div>
                {/* Academic Year */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Academic Year
                  </label>
                  <Dropdown
                    type='filter'
                    options={academicYearOptions}
                    selectedValue={basicInfo.academicYear}
                    onSelect={v => handleFieldChange('academicYear', v)}
                    placeholder='Select academic year'
                    className='w-full'
                  />
                </div>

                <LabeledInputField
                  label='Schedule Start Date *'
                  type='date'
                  value={basicInfo.startDate}
                  onChange={e => handleFieldChange('startDate', e.target.value)}
                  error={errors.startDate}
                  icon={<Calendar className='w-4 h-4 text-gray-400' />}
                />

                <LabeledInputField
                  label='Schedule End Date *'
                  type='date'
                  value={basicInfo.endDate}
                  onChange={e => handleFieldChange('endDate', e.target.value)}
                  error={errors.endDate}
                  icon={<Calendar className='w-4 h-4 text-gray-400' />}
                />

                <LabeledInputField
                  label='Effective From *'
                  type='date'
                  value={basicInfo.effectiveFrom}
                  onChange={e =>
                    handleFieldChange('effectiveFrom', e.target.value)
                  }
                  error={errors.effectiveFrom}
                  icon={<Calendar className='w-4 h-4 text-gray-400' />}
                />

                {/* Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status
                  </label>
                  <Dropdown
                    type='filter'
                    options={statusOptions}
                    selectedValue={basicInfo.status}
                    onSelect={v => handleFieldChange('status', v)}
                    placeholder='Select status'
                    className='w-full'
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  Step 2: Configure Time Slots
                </h3>
                <ToggleButton
                  onClick={addTimeSlot}
                  className='bg-blue-600 text-white hover:bg-blue-700'
                >
                  + Add Time Slot
                </ToggleButton>
              </div>
              <div className='space-y-4'>
                {timeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className='flex items-center gap-4 p-4 border rounded-lg'
                  >
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-gray-500' />
                      <span className='text-sm font-medium'>
                        Slot {idx + 1}
                      </span>
                    </div>
                    <LabeledInputField
                      label='Start Time'
                      type='time'
                      value={slot.startTime}
                      onChange={e =>
                        updateTimeSlot(idx, 'startTime', e.target.value)
                      }
                      className='min-w-[150px]'
                    />
                    <span className='text-gray-500'>to</span>
                    <LabeledInputField
                      label='End Time'
                      type='time'
                      value={slot.endTime}
                      onChange={e =>
                        updateTimeSlot(idx, 'endTime', e.target.value)
                      }
                      className='min-w-[150px]'
                    />
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Type
                      </label>
                      <Dropdown
                        type='filter'
                        options={periodTypeOptions}
                        selectedValue={slot.type}
                        onSelect={v => updateTimeSlot(idx, 'type', v)}
                        placeholder='Select type'
                        className='min-w-[120px]'
                      />
                    </div>
                    <div className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                      {slot.startTime && slot.endTime
                        ? `${(
                            (new Date(`2000-01-01T${slot.endTime}`).getTime() -
                              new Date(
                                `2000-01-01T${slot.startTime}`,
                              ).getTime()) /
                            60000
                          ).toFixed(0)} min`
                        : ''}
                    </div>
                    <button
                      onClick={() => removeTimeSlot(idx)}
                      className='p-1 text-red-500 hover:bg-red-50 rounded'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <div className='flex items-center gap-2 mb-3'>
                  <Clock className='w-5 h-5 text-gray-600' />
                  <h4 className='font-medium'>Schedule Summary</h4>
                </div>
                <div className='grid grid-cols-3 gap-4 text-sm'>
                  <div>
                    Total Periods:{' '}
                    <span className='font-medium'>{regularPeriods}</span>
                  </div>
                  <div>
                    Breaks: <span className='font-medium'>{breaks}</span>
                  </div>
                  <div>
                    Total Duration:{' '}
                    <span className='font-medium'>{totalDuration} minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className='space-y-6'>
              <h3 className='text-lg font-semibold'>
                Step 3: Schedule Preview & Confirmation
              </h3>
              <div className='bg-white border rounded-lg p-6 space-y-4'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-blue-600' />
                  <h4 className='font-medium'>
                    {basicInfo.scheduleName || 'Schedule Name'}
                  </h4>
                </div>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>Class:</span>{' '}
                    {basicInfo.grade} - Section {basicInfo.section}
                  </div>
                  <div>
                    <span className='font-medium'>Academic Year:</span>{' '}
                    {basicInfo.academicYear}
                  </div>
                  <div>
                    <span className='font-medium'>Duration:</span>{' '}
                    {basicInfo.startDate} to {basicInfo.endDate}
                  </div>
                  <div>
                    <span className='font-medium'>Status:</span>{' '}
                    <span className='ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>
                      {basicInfo.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className='bg-white border rounded-lg p-6'>
                <h4 className='font-medium mb-4'>Time Slots Configuration</h4>
                <div className='space-y-2'>
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between py-2 text-sm'
                    >
                      <span>Period {idx + 1}</span>
                      <span>
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          slot.type === 'regular'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {slot.type}
                      </span>
                      <span className='text-gray-600'>
                        {slot.startTime && slot.endTime
                          ? `${(
                              (new Date(
                                `2000-01-01T${slot.endTime}`,
                              ).getTime() -
                                new Date(
                                  `2000-01-01T${slot.startTime}`,
                                ).getTime()) /
                              60000
                            ).toFixed(0)} min`
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-1 text-yellow-800'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5 text-yellow-600' />
                  <h4 className='font-medium'>Next Steps</h4>
                </div>
                <ul className='text-sm list-disc list-inside'>
                  <li>Schedule structure will be created</li>
                  <li>
                    You can assign subjects and teachers in the Schedule Builder
                  </li>
                  <li>
                    Schedule will be effective from {basicInfo.effectiveFrom}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className='flex items-center justify-between p-6 border-t'>
          <div className='flex gap-3'>
            {currentStep > 1 && (
              <ToggleButton
                onClick={handleBack}
                className='flex border border-gray-300 text-gray-700'
              >
                <ChevronLeft className='w-4 h-4 mr-2' />
                Back
              </ToggleButton>
            )}
            <ToggleButton
              onClick={onClose}
              className='border border-gray-300 text-gray-700'
            >
              Cancel
            </ToggleButton>
          </div>
          <ToggleButton
            onClick={currentStep < 3 ? handleNext : handleSubmit}
            className='bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center rounded-lg'
          >
            {currentStep < 3 && (
              <>
                Next
                <ChevronRight className='w-4 h-4 ml-2' />
              </>
            )}
            {currentStep === 3 &&
              (isEditMode ? 'Save Changes' : 'Create Schedule')}
          </ToggleButton>
        </div>
      </div>
    </div>
  );
}
