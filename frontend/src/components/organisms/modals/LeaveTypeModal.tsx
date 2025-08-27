'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/atoms/form-controls/Button';
import {
  LeaveType,
  CreateLeaveTypeRequest,
  UpdateLeaveTypeRequest,
} from '@/api/services/leave-type.service';

interface LeaveTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveType?: LeaveType | null;
  mode: 'create' | 'edit';
  onCreateLeaveType: (data: CreateLeaveTypeRequest) => Promise<LeaveType>;
  onUpdateLeaveType: (
    id: string,
    data: UpdateLeaveTypeRequest,
  ) => Promise<LeaveType>;
}

export default function LeaveTypeModal({
  open,
  onClose,
  onSuccess,
  leaveType,
  mode,
  onCreateLeaveType,
  onUpdateLeaveType,
}: LeaveTypeModalProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxDays: 1,
    isPaid: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or leaveType changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && leaveType) {
        setForm({
          name: leaveType.name,
          description: leaveType.description || '',
          maxDays: leaveType.maxDays,
          isPaid: leaveType.isPaid,
        });
      } else {
        setForm({
          name: '',
          description: '',
          maxDays: 1,
          isPaid: false,
        });
      }
      setErrors({});
    }
  }, [open, leaveType, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Leave type name is required';
    } else if (form.name.length < 2) {
      newErrors.name = 'Leave type name must be at least 2 characters';
    }

    if (form.maxDays < 1) {
      newErrors.maxDays = 'Maximum days must be at least 1';
    } else if (form.maxDays > 365) {
      newErrors.maxDays = 'Maximum days cannot exceed 365';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await onCreateLeaveType(form);
      } else if (leaveType) {
        await onUpdateLeaveType(leaveType.id, form);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving leave type:', error);
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              {mode === 'create' ? 'Add New Leave Type' : 'Edit Leave Type'}
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              {mode === 'create'
                ? 'Create a new leave type that teachers can use for their requests.'
                : 'Update the leave type details.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Name */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Leave Type Name
            </label>
            <input
              type='text'
              value={form.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder='e.g., Annual Leave, Sick Leave'
              className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              required
            />
            {errors.name && (
              <p className='text-sm text-red-600'>{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Brief description of this leave type...'
              rows={3}
              className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            />
            {errors.description && (
              <p className='text-sm text-red-600'>{errors.description}</p>
            )}
          </div>

          {/* Max Days */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Maximum Days
            </label>
            <input
              type='number'
              value={form.maxDays}
              onChange={e =>
                handleInputChange('maxDays', parseInt(e.target.value) || 1)
              }
              placeholder='e.g., 21'
              min={1}
              max={365}
              className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                errors.maxDays
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              required
            />
            {errors.maxDays && (
              <p className='text-sm text-red-600'>{errors.maxDays}</p>
            )}
          </div>

          {/* Payment Status */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Payment Status
            </label>
            <select
              value={form.isPaid ? 'paid' : 'unpaid'}
              onChange={e =>
                handleInputChange('isPaid', e.target.value === 'paid')
              }
              className='w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-all duration-200'
            >
              <option value='paid'>Paid</option>
              <option value='unpaid'>Unpaid</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-6'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {mode === 'create' ? 'Create Leave Type' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
