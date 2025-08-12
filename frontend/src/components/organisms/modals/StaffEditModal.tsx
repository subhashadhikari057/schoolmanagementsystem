/**
 * =============================================================================
 * Staff Edit Modal Component
 * =============================================================================
 * Modal for editing staff member information with form validation
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Briefcase,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Landmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { StaffMember } from '@/components/templates/StaffColumns';
import { staffService } from '@/api/services/staff.service';

interface StaffEditModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditStaffFormData {
  // User data
  fullName: string;
  email: string;
  phone: string;

  // Profile data
  designation: string;
  department: string;
  basicSalary: string;
  employmentStatus: string;
  experienceYears: string;
  bio: string;

  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;

  // Bank details
  bankName: string;
  bankAccountNumber: string;
  bankBranch: string;
  panNumber: string;
  citizenshipNumber: string;
}

const DEPARTMENT_OPTIONS = [
  'administration',
  'finance',
  'hr',
  'maintenance',
  'security',
  'library',
  'canteen',
  'transport',
  'it_support',
  'academic_support',
];

const DESIGNATION_OPTIONS = [
  'Administrative Officer',
  'Finance Manager',
  'HR Manager',
  'Accountant',
  'Librarian',
  'Lab Assistant',
  'Security Guard',
  'Maintenance Staff',
  'Canteen Manager',
  'Transport Coordinator',
  'IT Support',
  'Academic Coordinator',
];

const EMPLOYMENT_STATUS_OPTIONS = [
  'active',
  'on_leave',
  'resigned',
  'terminated',
];

const StaffEditModal: React.FC<StaffEditModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<EditStaffFormData>({
    fullName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    basicSalary: '',
    employmentStatus: 'active',
    experienceYears: '',
    bio: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    panNumber: '',
    citizenshipNumber: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when staff data is available
  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        fullName: staff.fullName || '',
        email: staff.email || '',
        phone: staff.phone || '',
        designation: staff.designation || '',
        department: staff.department || '',
        basicSalary: staff.basicSalary?.toString() || '',
        employmentStatus: staff.employmentStatus || 'active',
        experienceYears: staff.experienceYears?.toString() || '',
        bio: staff.profile?.bio || '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        bankName: staff.bankName || '',
        bankAccountNumber: staff.bankAccountNumber || '',
        bankBranch: staff.bankBranch || '',
        panNumber: staff.panNumber || '',
        citizenshipNumber: staff.citizenshipNumber || '',
      });
      setError(null);
    }
  }, [staff, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.designation.trim()) return 'Designation is required';
    if (!formData.department.trim()) return 'Department is required';
    if (formData.basicSalary && isNaN(parseFloat(formData.basicSalary))) {
      return 'Basic salary must be a valid number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staff) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show confirmation toast
    const confirmed = await new Promise<boolean>(resolve => {
      toast('Confirm Changes', {
        description: `Are you sure you want to update ${formData.fullName}'s information?`,
        action: {
          label: 'Update',
          onClick: () => resolve(true),
        },
        cancel: {
          label: 'Cancel',
          onClick: () => resolve(false),
        },
        duration: Infinity,
      });
    });

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        user: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
        },
        profile: {
          designation: formData.designation,
          department: formData.department,
          salary: formData.basicSalary
            ? parseFloat(formData.basicSalary)
            : undefined,
          employmentStatus: formData.employmentStatus,
          experienceYears: formData.experienceYears
            ? parseInt(formData.experienceYears)
            : undefined,
          bio: formData.bio.trim() || undefined,
          address: {
            street: formData.street.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            zipCode: formData.zipCode.trim() || undefined,
            country: formData.country.trim() || undefined,
          },
        },
        bankDetails: {
          bankName: formData.bankName.trim() || undefined,
          bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
          bankBranch: formData.bankBranch.trim() || undefined,
          panNumber: formData.panNumber.trim() || undefined,
          citizenshipNumber: formData.citizenshipNumber.trim() || undefined,
        },
      };

      const response = await staffService.updateStaffByAdmin(
        staff.id,
        updateData,
      );

      if (response?.success) {
        toast.success('Staff Updated Successfully', {
          description: `${formData.fullName} has been updated.`,
          duration: 4000,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response?.message || 'Failed to update staff');
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update staff member';
      setError(errorMessage);
      toast.error('Failed to update staff', {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div className='fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
              <User className='h-5 w-5 text-white' />
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>
                Edit Staff Member
              </h2>
              <p className='text-sm text-gray-600'>Update staff information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Personal Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900 flex items-center'>
              <User className='h-5 w-5 mr-2 text-blue-600' />
              Personal Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Full Name <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='text'
                    name='fullName'
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    placeholder='Enter full name'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    placeholder='Enter email address'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number
                </label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='text'
                    name='phone'
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    placeholder='Enter phone number'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900 flex items-center'>
              <Briefcase className='h-5 w-5 mr-2 text-blue-600' />
              Professional Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Designation <span className='text-red-500'>*</span>
                </label>
                <select
                  name='designation'
                  value={formData.designation}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                >
                  <option value=''>Select designation</option>
                  {DESIGNATION_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Department <span className='text-red-500'>*</span>
                </label>
                <select
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                >
                  <option value=''>Select department</option>
                  {DEPARTMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Employment Status
                </label>
                <select
                  name='employmentStatus'
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                >
                  {EMPLOYMENT_STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Experience (Years)
                </label>
                <input
                  type='number'
                  name='experienceYears'
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                  placeholder='Enter years of experience'
                  min='0'
                  step='1'
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900 flex items-center'>
              <DollarSign className='h-5 w-5 mr-2 text-blue-600' />
              Salary Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Basic Salary
                </label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='number'
                    name='basicSalary'
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    placeholder='Enter basic salary'
                    min='0'
                    step='0.01'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900'>Bio</h3>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                About
              </label>
              <textarea
                name='bio'
                value={formData.bio}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none'
                placeholder='Brief description about the staff member'
              />
            </div>
          </div>

          {/* Bank Account Details */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium text-gray-900 flex items-center'>
              <Landmark className='h-5 w-5 mr-2 text-purple-600' />
              Bank Account Details
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Bank Name
                </label>
                <div className='relative'>
                  <Landmark className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <input
                    type='text'
                    name='bankName'
                    value={formData.bankName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                    placeholder='Enter bank name'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Account Number
                </label>
                <input
                  type='text'
                  name='bankAccountNumber'
                  value={formData.bankAccountNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                  placeholder='Enter account number'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Bank Branch
                </label>
                <input
                  type='text'
                  name='bankBranch'
                  value={formData.bankBranch}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                  placeholder='Enter branch name'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  PAN Number
                </label>
                <input
                  type='text'
                  name='panNumber'
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                  placeholder='Enter PAN number'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Citizenship Number
                </label>
                <input
                  type='text'
                  name='citizenshipNumber'
                  value={formData.citizenshipNumber}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50'
                  placeholder='Enter citizenship number'
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-4'>
              <div className='flex'>
                <div className='text-sm text-red-700'>{error}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50'
            >
              <Save className='h-4 w-4 mr-2' />
              {isLoading ? 'Updating...' : 'Update Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffEditModal;
