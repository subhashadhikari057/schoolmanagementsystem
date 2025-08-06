'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Code,
  FileText,
  Tag,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddSubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  category: string;
  maxMarks: string;
  minMarks: string;
  assignedGrades: string[];
  assignedTeachers: string[];
}

// Mock data - replace with actual API calls
const CATEGORIES = [
  'Core',
  'Science',
  'Mathematics',
  'Language',
  'Social Studies',
  'Arts',
  'Physical Education',
  'Computer Science',
  'Vocational',
  'Elective',
];

const GRADES = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const TEACHERS = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'David Wilson',
  'Lisa Anderson',
  'James Taylor',
  'Jennifer Martinez',
];

export const AddSubjectFormModal: React.FC<AddSubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    description: '',
    category: '',
    maxMarks: '',
    minMarks: '',
    assignedGrades: [],
    assignedTeachers: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof SubjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMultiSelectChange = (
    field: 'assignedGrades' | 'assignedTeachers',
    value: string,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Subject name is required';
    if (!formData.code.trim()) return 'Subject code is required';
    if (!formData.category) return 'Category is required';
    if (
      !formData.maxMarks ||
      isNaN(Number(formData.maxMarks)) ||
      Number(formData.maxMarks) <= 0
    ) {
      return 'Valid maximum marks are required';
    }
    if (
      !formData.minMarks ||
      isNaN(Number(formData.minMarks)) ||
      Number(formData.minMarks) < 0
    ) {
      return 'Valid minimum marks are required';
    }
    if (Number(formData.minMarks) >= Number(formData.maxMarks)) {
      return 'Minimum marks must be less than maximum marks';
    }
    if (formData.assignedGrades.length === 0)
      return 'Please assign at least one grade';
    if (formData.assignedTeachers.length === 0)
      return 'Please assign at least one teacher';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(
        `Subject "${formData.name}" has been created successfully!`,
      );
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        name: '',
        code: '',
        description: '',
        category: '',
        maxMarks: '',
        minMarks: '',
        assignedGrades: [],
        assignedTeachers: [],
      });
    } catch (error) {
      toast.error('Failed to create subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='modal-scroll-blend modal-sidebar-blend rounded-2xl w-full max-w-2xl max-h-[85vh] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-500 to-red-600 p-4 border-b border-gray-100 sticky top-0 z-10'>
          <div className='absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-orange-200/40 to-red-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-1.5 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg'>
                <BookOpen className='text-white' size={20} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  Add New Subject
                </h2>
                <p className='text-orange-100 text-xs mt-1'>
                  Create comprehensive subject profiles
                </p>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='p-2 text-orange-100 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50'
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className='p-4' onClick={e => e.stopPropagation()}>
          <form
            onSubmit={handleSubmit}
            className='space-y-6'
            onClick={e => e.stopPropagation()}
          >
            {/* Basic Information */}
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <FileText size={20} className='mr-3 text-blue-500' />
                Basic Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='text'
                    value={formData.name}
                    onChange={e => {
                      e.stopPropagation();
                      handleInputChange('name', e.target.value);
                    }}
                    placeholder='Enter subject name'
                    className='w-full'
                    disabled={isSubmitting}
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject Code <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Code className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      type='text'
                      value={formData.code}
                      onChange={e => {
                        e.stopPropagation();
                        handleInputChange('code', e.target.value.toUpperCase());
                      }}
                      placeholder='Enter subject code'
                      className='w-full pl-10'
                      disabled={isSubmitting}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => {
                      e.stopPropagation();
                      handleInputChange('description', e.target.value);
                    }}
                    placeholder='Enter subject description'
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                    rows={3}
                    disabled={isSubmitting}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
            {/* Grade Assignment */}
            <div className='bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <GraduationCap size={20} className='mr-3 text-purple-500' />
                Grade Assignment
              </h3>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>
                  Assigned to Grades <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {GRADES.map(grade => (
                    <label
                      key={grade}
                      className='flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer'
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type='checkbox'
                        checked={formData.assignedGrades.includes(grade)}
                        onChange={e => {
                          e.stopPropagation();
                          handleMultiSelectChange('assignedGrades', grade);
                        }}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        disabled={isSubmitting}
                      />
                      <span className='text-sm text-gray-700'>{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className='sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6 -mx-6 -mb-6'>
              <div className='flex items-center justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={e => {
                    e.stopPropagation();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className='px-6 py-2 hover:bg-gray-50 transition-colors duration-200'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-8 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  {isSubmitting ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      Creating...
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <BookOpen className='h-4 w-4' />
                      Create Subject
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSubjectFormModal;
