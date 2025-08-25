'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  classService,
  type UpdateClassRequest,
  type ClassResponse,
} from '@/api/services/class.service';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData: ClassResponse | null;
  existingClasses?: ClassResponse[];
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
  classData,
  existingClasses = [],
}: EditClassModalProps) {
  const [formData, setFormData] = useState<{ name: string }>({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when classData changes
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
      });
    }
  }, [classData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classData) return;

    // Basic validation
    if (!formData.name.trim()) {
      setError('Class name is required');
      return;
    }

    // Check if data has changed
    const trimmedName = formData.name.trim();
    if (trimmedName === classData.name) {
      onClose();
      return;
    }

    // Check for duplicate class names (client-side validation)
    const isDuplicate = existingClasses.some(
      existingClass =>
        existingClass.id !== classData.id &&
        existingClass.name?.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      const errorMessage = `A class named "${trimmedName}" already exists. Please choose a different name.`;
      setError(errorMessage);

      // Show duplicate warning toast
      toast.warning('Duplicate class name', {
        description: errorMessage,
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);

    // Show loading toast
    const loadingToast = toast.loading('Updating class...', {
      description: `Changing "${classData.name}" to "${trimmedName}"`,
    });

    try {
      const updateData: UpdateClassRequest = {
        name: trimmedName,
      };

      const response = await classService.updateClass(classData.id, updateData);

      if (response.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Class updated successfully!', {
          description: `Class renamed to "${trimmedName}"`,
          duration: 5000,
        });

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error updating class:', err);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      const errorMessage =
        err.message || 'Failed to update class. Please try again.';
      toast.error('Failed to update class', {
        description: errorMessage,
        duration: 6000,
      });

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'>
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg'>
                <Save size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>Edit Class</h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Update class information
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className='p-6'>
          <div className='space-y-6'>
            {/* Current Class Info */}
            <div className='bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100'>
              <div className='flex items-center space-x-2'>
                <Edit3 size={16} className='text-orange-600' />
                <span className='text-sm font-medium text-orange-800'>
                  Editing: {classData.name}
                </span>
              </div>
            </div>

            {/* Class Name Field */}
            <div className='space-y-2'>
              <label
                htmlFor='name'
                className='block text-sm font-semibold text-gray-700'
              >
                Class Name <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='e.g., Grade 10, Class 5, Form 2...'
                  disabled={isLoading}
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 placeholder-gray-400'
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <Sparkles size={16} className='text-gray-300' />
                </div>
              </div>
              <p className='text-xs text-gray-500'>
                Update the class name as needed
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <p className='text-sm text-red-700 font-medium'>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isLoading}
              className='px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading || !formData.name.trim()}
              className='px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
