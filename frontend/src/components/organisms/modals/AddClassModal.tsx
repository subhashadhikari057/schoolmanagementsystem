'use client';

import React, { useState } from 'react';
import { X, Plus, GraduationCap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  classService,
  type CreateClassRequest,
  type ClassResponse,
} from '@/api/services/class.service';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingClasses?: ClassResponse[];
}

export default function AddClassModal({
  isOpen,
  onClose,
  onSuccess,
  existingClasses = [],
}: AddClassModalProps) {
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Basic validation
    if (!formData.name.trim()) {
      setError('Class name is required');
      return;
    }

    // Check for duplicate class names (client-side validation)
    const trimmedName = formData.name.trim();
    const isDuplicate = existingClasses.some(
      existingClass =>
        existingClass.name.toLowerCase() === trimmedName.toLowerCase(),
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
    const loadingToast = toast.loading('Creating class...', {
      description: `Adding "${trimmedName}" to your school system`,
    });

    try {
      const response = await classService.createClass({
        name: trimmedName,
      });

      if (response.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Class created successfully!', {
          description: `"${trimmedName}" has been added to your classes`,
          duration: 5000,
        });

        // Reset form
        setFormData({ name: '' });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error creating class:', err);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      const errorMessage =
        err.message || 'Failed to create class. Please try again.';
      toast.error('Failed to create class', {
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
      setFormData({ name: '' });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'>
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                <GraduationCap size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  Create New Class
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Add a new class to your academic system
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
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 placeholder-gray-400'
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <Sparkles size={16} className='text-gray-300' />
                </div>
              </div>
              <p className='text-xs text-gray-500'>
                Enter a descriptive name for your class
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
              className='px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
