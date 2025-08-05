'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Layers, School, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  sectionService,
  type CreateSectionRequest,
} from '@/api/services/section.service';
import { classService, type ClassResponse } from '@/api/services/class.service';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedClassId?: string;
}

export default function AddSectionModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedClassId,
}: AddSectionModalProps) {
  const [formData, setFormData] = useState<CreateSectionRequest>({
    name: '',
    classId: preSelectedClassId || '',
  });
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen && !preSelectedClassId) {
      loadClasses();
    }
  }, [isOpen, preSelectedClassId]);

  // Update classId when preSelectedClassId changes
  useEffect(() => {
    if (preSelectedClassId) {
      setFormData(prev => ({
        ...prev,
        classId: preSelectedClassId,
      }));
    }
  }, [preSelectedClassId]);

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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
      setError('Section name is required');
      return;
    }
    if (!formData.classId) {
      setError('Please select a class');
      return;
    }

    setIsLoading(true);

    const trimmedName = formData.name.trim();
    const selectedClass = classes.find(c => c.id === formData.classId);
    const className = selectedClass?.name || 'selected class';

    // Show loading toast
    const loadingToast = toast.loading('Creating section...', {
      description: `Adding "${trimmedName}" to ${className}`,
    });

    try {
      const response = await sectionService.createSection({
        name: trimmedName,
        classId: formData.classId,
      });

      if (response.success) {
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Section created successfully!', {
          description: `"${trimmedName}" has been added to ${className}`,
          duration: 5000,
        });

        // Reset form
        setFormData({
          name: '',
          classId: preSelectedClassId || '',
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error creating section:', err);

      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      const errorMessage =
        err.message || 'Failed to create section. Please try again.';
      toast.error('Failed to create section', {
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
      setFormData({
        name: '',
        classId: preSelectedClassId || '',
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedClass = classes.find(c => c.id === preSelectedClassId);

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'>
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-teal-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg'>
                <Layers size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  Create New Section
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Add a section to organize your class
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
            {/* Class Selection */}
            <div className='space-y-2'>
              <label
                htmlFor='classId'
                className='block text-sm font-semibold text-gray-700'
              >
                Class <span className='text-red-500'>*</span>
              </label>
              {preSelectedClassId ? (
                <div className='relative'>
                  <div className='w-full px-4 py-3 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium flex items-center space-x-2'>
                    <School size={16} className='text-gray-500' />
                    <span>{selectedClass?.name || 'Selected Class'}</span>
                  </div>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  </div>
                </div>
              ) : (
                <div className='relative'>
                  <select
                    id='classId'
                    name='classId'
                    value={formData.classId}
                    onChange={handleInputChange}
                    disabled={isLoading || isLoadingClasses}
                    className='w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 appearance-none bg-white'
                  >
                    <option value=''>Choose a class...</option>
                    {classes.map(classItem => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <ChevronDown size={16} className='text-gray-400' />
                  </div>
                </div>
              )}
              <p className='text-xs text-gray-500'>
                Select the class this section belongs to
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
                  className='w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900 placeholder-gray-400'
                />
                <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                  <Layers size={16} className='text-gray-300' />
                </div>
              </div>
              <p className='text-xs text-gray-500'>
                Choose a unique name for this section
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
              disabled={isLoading || !formData.name.trim() || !formData.classId}
              className='px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
