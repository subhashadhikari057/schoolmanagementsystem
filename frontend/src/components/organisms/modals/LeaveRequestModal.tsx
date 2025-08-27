// LeaveRequestModal.tsx
// Modal for creating a new leave request (Student Leave Management)

import React, { useState, useEffect } from 'react';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { toast } from 'sonner';
import {
  CalendarIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Types based on DTO structure
type FormState = {
  title: string;
  description: string;
  type: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  start_date: string;
  end_date: string;
  attachments: File[];
};

type LeaveTypeOption = {
  value: string;
  label: string;
  description: string;
};

const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  {
    value: 'SICK',
    label: 'Sick Leave',
    description: 'Medical illness or health-related issues',
  },
  {
    value: 'PERSONAL',
    label: 'Personal Leave',
    description: 'Personal matters or family events',
  },
  {
    value: 'VACATION',
    label: 'Vacation',
    description: 'Holiday or recreational time off',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency Leave',
    description: 'Urgent unforeseen circumstances',
  },
  {
    value: 'MEDICAL',
    label: 'Medical Leave',
    description: 'Medical appointments or procedures',
  },
  {
    value: 'FAMILY',
    label: 'Family Leave',
    description: 'Family-related events or emergencies',
  },
];

export default function LeaveRequestModal({
  open,
  onClose,
  onSuccess,
  role = 'student',
  leaveRequest = null,
  onApprove,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  role?: 'student' | 'parent';
  leaveRequest?: any | null;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}) {
  const { createLeaveRequest } = useLeaveRequests();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    type: 'PERSONAL',
    start_date: '',
    end_date: '',
    attachments: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [parentActionLoading, setParentActionLoading] = useState(false);

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      type: 'PERSONAL',
      start_date: '',
      end_date: '',
      attachments: [],
    });
    setErrors({});
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Calculate days between start and end date
  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;

    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    return daysDiff > 0 ? daysDiff : 0;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!form.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (form.start_date && form.end_date) {
      const startDate = new Date(form.start_date);
      const endDate = new Date(form.end_date);

      if (startDate > endDate) {
        newErrors.end_date = 'End date must be after start date';
      }

      // Check if dates are in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.start_date = 'Start date cannot be in the past';
      }
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    for (const file of form.attachments) {
      if (file.size > maxSize) {
        newErrors.attachments = `File ${file.name} exceeds 5MB limit`;
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await createLeaveRequest(form);

      toast.success('Leave request submitted successfully!');
      onClose();
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit leave request',
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Check file size limit
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => file.size <= maxSize);

    if (validFiles.length !== files.length) {
      toast.error('Some files exceed 5MB limit and were not added');
    }

    setForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles],
    }));
  };

  // Remove file
  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!open) return null;

  const days = calculateDays();

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 backdrop-blur-sm bg-white/30 transition-opacity'
          onClick={onClose}
        />

        {/* Modal */}
        <div className='relative w-full max-w-lg bg-white rounded-lg shadow-xl'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <CalendarIcon className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Request Leave
                </h2>
                <p className='text-sm text-gray-500'>
                  Submit a new leave request
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <XMarkIcon className='h-6 w-6' />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-4 space-y-4'>
            {/* Title */}
            <div>
              <Label>Leave Request Title *</Label>
              <Input
                id='title'
                type='text'
                placeholder='Enter leave request title'
                value={form.title}
                onChange={e =>
                  setForm(prev => ({ ...prev, title: e.target.value }))
                }
                className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600'>{errors.title}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <Label>Leave Type *</Label>
              <select
                value={form.type}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    type: e.target.value as FormState['type'],
                  }))
                }
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1'
              >
                {LEAVE_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.type && (
                <p className='mt-1 text-sm text-gray-600'>
                  {
                    LEAVE_TYPE_OPTIONS.find(opt => opt.value === form.type)
                      ?.description
                  }
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label>Start Date *</Label>
                <Input
                  id='start_date'
                  type='date'
                  value={form.start_date}
                  onChange={e =>
                    setForm(prev => ({ ...prev, start_date: e.target.value }))
                  }
                  className={`mt-1 ${errors.start_date ? 'border-red-500' : ''}`}
                />
                {errors.start_date && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.start_date}
                  </p>
                )}
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  id='end_date'
                  type='date'
                  value={form.end_date}
                  onChange={e =>
                    setForm(prev => ({ ...prev, end_date: e.target.value }))
                  }
                  className={`mt-1 ${errors.end_date ? 'border-red-500' : ''}`}
                />
                {errors.end_date && (
                  <p className='mt-1 text-sm text-red-600'>{errors.end_date}</p>
                )}
              </div>
            </div>

            {/* Days Calculation */}
            {days > 0 && (
              <div className='p-3 bg-blue-50 rounded-lg'>
                <p className='text-sm text-blue-800'>
                  <span className='font-medium'>Duration:</span> {days} day
                  {days !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                id='description'
                placeholder='Provide additional details about your leave request...'
                value={form.description}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                rows={4}
                className='mt-1'
              />
            </div>

            {/* File Attachments */}
            <div>
              <Label>Attachments (Optional)</Label>
              <div className='mt-1'>
                <div className='flex items-center justify-center w-full'>
                  <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors'>
                    <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                      <PaperClipIcon className='w-8 h-8 mb-2 text-gray-400' />
                      <p className='mb-2 text-sm text-gray-500'>
                        <span className='font-semibold'>Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className='text-xs text-gray-500'>
                        PDF, DOC, Images (Max 5MB each)
                      </p>
                    </div>
                    <input
                      id='attachments'
                      type='file'
                      multiple
                      className='hidden'
                      onChange={handleFileUpload}
                      accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
                    />
                  </label>
                </div>
              </div>

              {/* File List */}
              {form.attachments.length > 0 && (
                <div className='mt-3 space-y-2'>
                  {form.attachments.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <PaperClipIcon className='h-5 w-5 text-gray-400' />
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {file.name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeFile(index)}
                        className='text-red-500 hover:text-red-700 transition-colors'
                      >
                        <XMarkIcon className='h-5 w-5' />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.attachments && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.attachments}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end space-x-3 pt-4 border-t border-gray-200'>
              <Button
                type='button'
                onClick={onClose}
                disabled={loading}
                className='bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  !form.title || !form.start_date || !form.end_date || loading
                }
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
