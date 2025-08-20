'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  Mail,
  Briefcase,
  AlertCircle,
  Loader2,
  Edit,
  Shield,
  Key,
} from 'lucide-react';
import { Parent } from '@/components/templates/listConfigurations';
import {
  parentService,
  ParentResponse,
  UpdateParentRequest,
} from '@/api/services/parent.service';
import { toast } from 'sonner';

interface ParentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parent: Parent | null;
}

// Local Input Component (label + input)
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon,
  disabled = false,
  className = '',
}) => (
  <div className={`mb-4 ${className}`}>
    <label
      htmlFor={name}
      className='block text-sm font-medium text-gray-700 mb-1'
    >
      {label} {required && <span className='text-red-500'>*</span>}
    </label>
    <div className='relative'>
      {icon && (
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          {icon}
        </div>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          icon ? 'pl-10' : 'pl-3'
        } ${disabled ? 'bg-gray-100' : ''}`}
      />
    </div>
  </div>
);

// No select component needed for simplified form

// No gender options needed for simplified form

interface EditParentForm {
  // User data
  fullName: string;
  phone: string;
  email: string;

  // Profile data
  occupation: string;
}

const ParentEditModal: React.FC<ParentEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parent,
}) => {
  const [formData, setFormData] = useState<EditParentForm>({
    fullName: '',
    phone: '',
    email: '',
    occupation: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentDetails, setParentDetails] = useState<ParentResponse | null>(
    null,
  );
  const [hasLoginAccount, setHasLoginAccount] = useState(true); // Parents always have login accounts

  // Fetch detailed parent data when modal opens
  useEffect(() => {
    if (isOpen && parent && parent.id) {
      setIsLoading(true);
      setError(null);

      // Fetch detailed parent data from API
      parentService
        .getParentById(parent.id)
        .then(response => {
          if (response.success && response.data) {
            setParentDetails(response.data);

            // Debug log to see parent data structure
            console.log('Parent data received:', response.data);

            // Populate form with parent data
            setFormData({
              fullName: response.data.fullName || '',
              phone: response.data.phone || '',
              email: response.data.email || '',
              occupation:
                response.data.profile?.occupation ||
                response.data.occupation ||
                '',
            });
          } else {
            setError(response.message || 'Failed to load parent details');
            toast.error('Failed to load parent details');
          }
        })
        .catch(err => {
          console.error('Error fetching parent details:', err);
          setError('Failed to load parent details');
          toast.error('Failed to load parent details');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, parent]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parent?.id) {
      toast.error('Parent ID is missing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare update data according to API structure
      const updateData: UpdateParentRequest = {
        user: {
          fullName: formData.fullName,
          phone: formData.phone,
        },
        profile: {
          occupation: formData.occupation || undefined,
        },
      };

      // Handle email update through backend directly
      // Since email is part of User model but not exposed in the UpdateParentRequest interface

      // Send update request
      const response = await parentService.updateParent(parent.id, updateData);

      if (response.success) {
        toast.success('Parent information updated successfully');
        onSuccess(); // Refresh parent list
        onClose(); // Close modal
      } else {
        throw new Error(response.message || 'Failed to update parent');
      }
    } catch (err: any) {
      console.error('Error updating parent:', err);
      setError(err.message || 'Failed to update parent');
      toast.error(err.message || 'Failed to update parent');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-3xl lg:max-w-4xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800 flex items-center'>
            <Edit className='mr-2 h-6 w-6 text-blue-600' />
            Edit Parent Information
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Update parent details and related information
          </p>

          {/* Login Account Badge */}
          {hasLoginAccount && (
            <div className='mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
              <Key className='h-4 w-4 mr-1' />
              Has Login Access
            </div>
          )}
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {isLoading && !parentDetails ? (
            <div className='text-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
              <p className='text-gray-700'>Loading parent details...</p>
            </div>
          ) : error && !parentDetails ? (
            <div className='text-center py-12'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 mb-2 font-medium'>
                Failed to load parent details
              </p>
              <p className='text-gray-500 text-sm'>{error}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Basic Info Section */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <User className='h-5 w-5 mr-2 text-blue-600' />
                  Parent Information
                </h3>

                {/* Warning for login account */}
                {hasLoginAccount && (
                  <div className='mb-4 p-3 bg-blue-50 rounded-md'>
                    <div className='flex items-start'>
                      <Shield className='h-5 w-5 text-blue-600 mr-2 mt-0.5' />
                      <div>
                        <p className='text-sm text-blue-700 font-medium'>
                          This parent has a login account
                        </p>
                        <p className='text-xs text-blue-600 mt-1'>
                          Changes to email will update their login credentials.
                          The password will remain unchanged.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <LabeledInput
                    label='Full Name'
                    name='fullName'
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder='Enter full name'
                    required
                    icon={<User className='h-4 w-4 text-gray-400' />}
                  />
                  <LabeledInput
                    label='Phone Number'
                    name='phone'
                    type='tel'
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder='Enter phone number'
                    required
                    icon={<Phone className='h-4 w-4 text-gray-400' />}
                  />
                  <LabeledInput
                    label='Email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder='Enter email address'
                    required
                    icon={<Mail className='h-4 w-4 text-gray-400' />}
                    className={
                      hasLoginAccount
                        ? 'border border-blue-200 rounded-md p-2 bg-blue-50'
                        : ''
                    }
                  />
                  <LabeledInput
                    label='Occupation'
                    name='occupation'
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder='Enter occupation'
                    icon={<Briefcase className='h-4 w-4 text-gray-400' />}
                  />
                </div>
              </div>

              {/* Form Errors */}
              {error && (
                <div className='mb-6 p-4 bg-red-50 rounded-md'>
                  <div className='flex items-center'>
                    <AlertCircle className='h-5 w-5 text-red-500 mr-2' />
                    <p className='text-sm text-red-600'>{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className='flex justify-end mt-6 border-t pt-6'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors mr-4'
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentEditModal;
