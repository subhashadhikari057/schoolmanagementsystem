'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Layers, School } from 'lucide-react';
import { toast } from 'sonner';
import {
  sectionService,
  type UpdateSectionRequest,
  type SectionResponse,
} from '@/api/services/section.service';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sectionData: SectionResponse | null;
}

export default function EditSectionModal({
  isOpen,
  onClose,
  onSuccess,
  sectionData,
}: EditSectionModalProps) {
  const [formData, setFormData] = useState<{ name: string }>({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when sectionData changes
  useEffect(() => {
    if (sectionData) {
      setFormData({
        name: sectionData.name,
      });
    }
  }, [sectionData]);

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

    if (!sectionData) return;

    // Basic validation
    if (!formData.name.trim()) {
      setError('Section name is required');
      return;
    }

    // Check if data has changed
    if (formData.name.trim() === sectionData.name) {
      onClose();
      return;
    }

    setIsLoading(true);

    const trimmedName = formData.name.trim();
    const className = sectionData.class?.name || 'class';

    // Show loading toast
    const loadingToast = toast.loading('Updating section...', {
      description: `Changing "${sectionData.name}" to "${trimmedName}" in ${className}`,
    });

    try {
      const updateData: UpdateSectionRequest = {
        name: trimmedName,
      };

      const response = await sectionService.updateSection(
        sectionData.id,
        updateData,
      );

      if (response.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Section updated successfully!', {
          description: `Section renamed to "${trimmedName}" in ${className}`,
          duration: 5000,
        });

        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error updating section:', err);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      const errorMessage =
        err.message || 'Failed to update section. Please try again.';
      toast.error('Failed to update section', {
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

  if (!isOpen || !sectionData) return null;

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'>
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg'>
                <Save size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  Edit Section
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Update section information
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
            {/* Current Section Info */}
            <div className='bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100'>
              <div className='flex items-center space-x-2'>
                <Edit3 size={16} className='text-purple-600' />
                <span className='text-sm font-medium text-purple-800'>
                  Editing: {sectionData.name}
                </span>
              </div>
            </div>

            {/* Class Info (Read-only) */}
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Class
              </label>
              <div className='relative'>
                <div className='w-full px-4 py-3 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium flex items-center space-x-2'>
                  <School size={16} className='text-gray-500' />
                  <span>{sectionData.class?.name || 'Unknown Class'}</span>
                </div>
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                </div>
              </div>
              <p className='text-xs text-gray-500'>
                This section belongs to the above class
              </p>
            </div>

            {/* Section Name Field */}
            <div className='space-y-2'>
              <label
                htmlFor='name'
                className='block text-sm font-semibold text-gray-700'
              >
                Section Name <span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='e.g., Section A, Alpha, Morning Batch...'
                  disabled={isLoading}
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 placeholder-gray-400'
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <Layers size={16} className='text-gray-300' />
                </div>
              </div>
              <p className='text-xs text-gray-500'>
                Update the section name as needed
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
              className='px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
