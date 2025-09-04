'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/atoms/display/Icon';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import {
  Calendar,
  GraduationCap,
  BookOpen,
  Clock,
  Target,
  Award,
} from 'lucide-react';

interface AcademicYearTabProps {
  isEditing?: boolean;
}

export default function AcademicYearTab({
  isEditing = false,
}: AcademicYearTabProps) {
  const [formData, setFormData] = useState({
    currentAcademicYear: '2024-25',
    academicYearStartDate: '08/01/2024',
    academicYearEndDate: '05/31/2025',
    totalAcademicWeeks: '40',
    examinationWeeks: '4',
    holidayWeeks: '12',
    gradingSystem: 'Letter Grades (A-F)',
    maximumAbsencePercentage: '25',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const InputGroup = ({
    icon,
    label,
    value,
    field,
    placeholder,
    type = 'text',
    suffix,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    field: string;
    placeholder: string;
    type?: string;
    suffix?: string;
  }) => (
    <div className='space-y-3'>
      <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
        {icon}
        {label}
      </label>
      <div className='relative'>
        <Input
          value={value}
          onChange={e => handleInputChange(field, e.target.value)}
          className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm pr-12 ${
            !isEditing ? 'bg-gray-50 cursor-default' : ''
          }`}
          placeholder={placeholder}
          type={type}
          readOnly={!isEditing}
        />
        {suffix && (
          <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500'>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const gradingSystemOptions = [
    { value: 'Letter Grades (A-F)', label: 'Letter Grades (A-F)' },
    { value: 'Percentage (0-100)', label: 'Percentage (0-100)' },
    { value: 'GPA (0-4.0)', label: 'GPA (0-4.0)' },
    { value: 'Pass/Fail', label: 'Pass/Fail' },
  ];

  const weeksSummary = {
    total: parseInt(formData.totalAcademicWeeks) || 0,
    exam: parseInt(formData.examinationWeeks) || 0,
    holiday: parseInt(formData.holidayWeeks) || 0,
    teaching:
      (parseInt(formData.totalAcademicWeeks) || 0) -
      (parseInt(formData.examinationWeeks) || 0),
  };

  return (
    <div className='space-y-8'>
      {/* Grading & Attendance Policies */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl'>
            <GraduationCap className='h-6 w-6 text-orange-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Grading & Attendance Policies
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure grading system and attendance requirements
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-3'>
            <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
              <Award className='h-4 w-4 text-yellow-500' />
              Grading System
            </label>
            {isEditing ? (
              <Dropdown
                type='filter'
                options={gradingSystemOptions}
                selectedValue={formData.gradingSystem}
                onSelect={value => handleInputChange('gradingSystem', value)}
                placeholder='Select grading system'
                className='w-full'
              />
            ) : (
              <div className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700'>
                {formData.gradingSystem}
              </div>
            )}
          </div>

          <InputGroup
            icon={<Target className='h-4 w-4 text-red-500' />}
            label='Maximum Absence Percentage'
            value={formData.maximumAbsencePercentage}
            field='maximumAbsencePercentage'
            placeholder='Enter percentage'
            type='number'
            suffix='%'
          />
        </div>

        <div className='mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
          <div className='flex items-start gap-3'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center'>
                <Target className='h-4 w-4 text-amber-600' />
              </div>
            </div>
            <div>
              <h4 className='text-sm font-semibold text-amber-900'>
                Attendance Policy
              </h4>
              <p className='text-xs text-amber-700 mt-1'>
                Students exceeding {formData.maximumAbsencePercentage}% absence
                rate may face academic consequences. This includes potential
                grade reduction, mandatory counseling, or academic probation.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
