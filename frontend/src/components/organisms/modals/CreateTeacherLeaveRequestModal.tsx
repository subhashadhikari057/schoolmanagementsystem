'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  FileText,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import LabeledTextareaField from '@/components/molecules/forms/LabeledTextareaField';
import {
  teacherLeaveService,
  CreateTeacherLeaveRequestDto,
} from '@/api/services/teacher-leave.service';
import { toast } from 'sonner';

interface CreateTeacherLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  isPaid: boolean;
}

interface FormData {
  title: string;
  description: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  attachments: File[];
}

export default function CreateTeacherLeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTeacherLeaveRequestModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0], // Pre-fill with current date
    endDate: '',
    days: 0,
    attachments: [],
  });

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  // Load leave types on mount
  useEffect(() => {
    if (isOpen) {
      loadLeaveTypes();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      try {
        // Validate date format first
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (
          datePattern.test(formData.startDate) &&
          datePattern.test(formData.endDate)
        ) {
          const days = teacherLeaveService.calculateDays(
            formData.startDate,
            formData.endDate,
          );

          // Only update if the calculated days are different from current days
          if (days !== formData.days) {
            setFormData(prev => ({ ...prev, days }));
          }
        } else {
          // Invalid date format, reset days
          setFormData(prev => ({ ...prev, days: 0 }));
        }
      } catch (error) {
        console.error('Error calculating days:', error);
        // Clear any existing date-related errors and reset days
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.days;
          delete newErrors.startDate;
          delete newErrors.endDate;
          return newErrors;
        });
        setFormData(prev => ({ ...prev, days: 0 }));
      }
    } else {
      // Reset days when dates are cleared
      setFormData(prev => ({ ...prev, days: 0 }));
    }
  }, [formData.startDate, formData.endDate]);

  const loadLeaveTypes = async () => {
    try {
      const response = await teacherLeaveService.getLeaveTypes();
      if (response && response.leaveTypes) {
        setLeaveTypes(response.leaveTypes);
      } else {
        setLeaveTypes([]);
        console.warn('No leave types returned from API');
      }
    } catch (error) {
      console.error('Failed to load leave types:', error);
      toast.error('Failed to load leave types');
      setLeaveTypes([]); // Set empty array to prevent undefined errors
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      leaveTypeId: '',
      startDate: new Date().toISOString().split('T')[0], // Pre-fill with current date
      endDate: '',
      days: 0,
      attachments: [],
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.leaveTypeId) {
      newErrors.leaveTypeId = 'Please select a leave type';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (start > end) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Validate days calculation consistency
      const calculatedDays = teacherLeaveService.calculateDays(
        formData.startDate,
        formData.endDate,
      );
      if (calculatedDays <= 0) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (formData.days <= 0) {
      newErrors.days = 'Duration must be at least 1 day';
    }

    // Validate file attachments
    formData.attachments.forEach((file, index) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        newErrors[`attachment-${index}`] = 'File size must be less than 5MB';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have the most up-to-date days calculation
    let finalFormData = { ...formData };
    if (formData.startDate && formData.endDate) {
      try {
        const calculatedDays = teacherLeaveService.calculateDays(
          formData.startDate,
          formData.endDate,
        );
        finalFormData = { ...finalFormData, days: calculatedDays };

        // Update state with final calculated days
        setFormData(finalFormData);
      } catch (error) {
        console.error('Error calculating days during submission:', error);
        toast.error(
          'Error calculating leave duration. Please check your dates.',
        );
        return;
      }
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateTeacherLeaveRequestDto = {
        title: finalFormData.title.trim(),
        description: finalFormData.description.trim() || undefined,
        leaveTypeId: finalFormData.leaveTypeId,
        startDate: finalFormData.startDate,
        endDate: finalFormData.endDate,
        days: finalFormData.days,
        attachments:
          finalFormData.attachments.length > 0
            ? finalFormData.attachments
            : undefined,
      };

      // Validate the request data using the service's robust validation
      const validation = teacherLeaveService.validateLeaveRequest(requestData);
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return;
      }

      await teacherLeaveService.createTeacherLeaveRequest(requestData);

      toast.success('Leave request created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      const errorMessage =
        error?.response?.data?.message || 'Failed to create leave request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles],
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            disabled={loading}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Calendar className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>
                Create Leave Request
              </h2>
              <p className='text-gray-600 mt-1'>
                Submit a new leave request with details and attachments
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Title */}
          <LabeledInputField
            label='Title'
            type='text'
            value={formData.title}
            onChange={e =>
              setFormData(prev => ({ ...prev, title: e.target.value }))
            }
            placeholder='Enter leave request title'
            error={errors.title}
            required
          />

          {/* Description */}
          <LabeledTextareaField
            label='Description'
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            placeholder='Provide details about your leave request'
            rows={3}
            error={errors.description}
          />

          {/* Leave Type */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Leave Type <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.leaveTypeId}
              onChange={e =>
                setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.leaveTypeId
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              }`}
              required
            >
              <option value=''>Select leave type</option>
              {leaveTypes && leaveTypes.length > 0 ? (
                leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.isPaid && '(Paid)'}
                  </option>
                ))
              ) : (
                <option value='' disabled>
                  Loading leave types...
                </option>
              )}
            </select>
            {errors.leaveTypeId && (
              <p className='text-sm text-red-600'>{errors.leaveTypeId}</p>
            )}
          </div>

          {/* Date Range */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Start Date <span className='text-red-500'>*</span>
              </label>
              <input
                type='date'
                value={formData.startDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1 ${
                  errors.startDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              {errors.startDate && (
                <p className='mt-1 text-sm text-red-600'>{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                End Date <span className='text-red-500'>*</span>
              </label>
              <input
                type='date'
                value={formData.endDate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1 ${
                  errors.endDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              {errors.endDate && (
                <p className='mt-1 text-sm text-red-600'>{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {formData.days > 0 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-blue-800'>
                <Calendar className='h-4 w-4' />
                <span className='font-medium'>
                  Duration: {formData.days} day{formData.days !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>
              Attachments (Optional)
            </label>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className='mx-auto h-12 w-12 text-gray-400' />
              <div className='mt-4'>
                <label htmlFor='file-upload' className='cursor-pointer'>
                  <span className='mt-2 block text-sm font-medium text-gray-900'>
                    Drop files here or click to upload
                  </span>
                  <span className='mt-1 block text-xs text-gray-500'>
                    PDF, DOC, DOCX, JPG, PNG up to 5MB each
                  </span>
                </label>
                <input
                  id='file-upload'
                  type='file'
                  multiple
                  accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                  onChange={e => handleFileUpload(e.target.files)}
                  className='sr-only'
                />
              </div>
            </div>

            {/* File List */}
            {formData.attachments.length > 0 && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-gray-700'>
                  Uploaded Files:
                </h4>
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between bg-gray-50 rounded-lg p-3'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-gray-500' />
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
                      className='p-1 text-red-500 hover:text-red-700 transition-colors'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
            <Button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2'
            >
              {loading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className='h-4 w-4' />
                  Create Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
