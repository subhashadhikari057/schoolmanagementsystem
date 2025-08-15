'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Briefcase,
  DollarSign,
  Landmark,
  Plus,
  Camera,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { staffService } from '@/api/services/staff.service';

interface AddStaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StaffFormData {
  // User Information
  fullName: string;
  email: string;
  phone: string;

  // Profile Information
  qualification: string;
  designation?: string;
  department?: string;
  experienceYears?: number;
  employmentDate: string;
  salary?: number;
  bio?: string;

  // Emergency Contact
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };

  // Address Information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Social Links
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };

  // Bank Details
  bankDetails?: {
    bankName?: string;
    bankAccountNumber?: string;
    bankBranch?: string;
    panNumber?: string;
    citizenshipNumber?: string;
  };

  // Profile Photo
  photo?: File | null;
}

const initialFormData: StaffFormData = {
  fullName: '',
  email: '',
  phone: '',
  qualification: '',
  designation: '',
  department: '',
  experienceYears: 0,
  employmentDate: '',
  salary: 0,
  bio: '',
  emergencyContact: {
    name: '',
    phone: '',
    relationship: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  socialLinks: {
    linkedin: '',
    twitter: '',
    website: '',
  },
  bankDetails: {
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    panNumber: '',
    citizenshipNumber: '',
  },
  photo: null,
};

// Form validation errors
interface FormErrors {
  [key: string]: string;
}

// Input field component
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  min?: string | number;
  max?: string | number;
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  min,
  max,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className={`flex h-10 w-full rounded-md border ${
        error ? 'border-red-500' : 'border-gray-300'
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200`}
      aria-invalid={error ? 'true' : 'false'}
    />
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Select field component
const LabeledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required,
  disabled,
  error,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border ${
        error ? 'border-red-500' : 'border-gray-300'
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200`}
      aria-invalid={error ? 'true' : 'false'}
    >
      <option value=''>{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Textarea field component
const LabeledTextarea: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
}> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  rows = 3,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`flex w-full rounded-md border ${
        error ? 'border-red-500' : 'border-gray-300'
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 resize-vertical`}
      aria-invalid={error ? 'true' : 'false'}
    />
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Section wrapper component
const FormSection: React.FC<{
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon: Icon, children, className = '' }) => (
  <div
    className={`bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
      <Icon size={20} className='mr-3 text-purple-600' />
      {title}
    </h3>
    {children}
  </div>
);

export default function AddStaffFormModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStaffFormModalProps) {
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Department options
  const departmentOptions = [
    { value: 'administration', label: 'Administration' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'library', label: 'Library' },
    { value: 'canteen', label: 'Canteen' },
    { value: 'transport', label: 'Transport' },
    { value: 'it_support', label: 'IT Support' },
    { value: 'academic_support', label: 'Academic Support' },
  ];

  // Handle input changes
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = e.target;

      // Handle nested object properties
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof StaffFormData] as any),
            [child]:
              type === 'number' ? (value === '' ? 0 : Number(value)) : value,
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]:
            type === 'number' ? (value === '' ? 0 : Number(value)) : value,
        }));
      }

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: '',
        }));
      }
    },
    [errors],
  );

  // Handle file upload
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          toast.error('File size should be less than 5MB');
          return;
        }

        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file');
          return;
        }

        setFormData(prev => ({ ...prev, photo: file }));

        // Create preview
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [],
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.qualification.trim())
      newErrors.qualification = 'Qualification is required';
    if (!formData.employmentDate)
      newErrors.employmentDate = 'Employment date is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    // URL validation for social links
    const urlRegex = /^https?:\/\/.+/;
    if (
      formData.socialLinks?.linkedin &&
      !urlRegex.test(formData.socialLinks.linkedin)
    ) {
      newErrors['socialLinks.linkedin'] = 'Please enter a valid LinkedIn URL';
    }
    if (
      formData.socialLinks?.twitter &&
      !urlRegex.test(formData.socialLinks.twitter)
    ) {
      newErrors['socialLinks.twitter'] = 'Please enter a valid Twitter URL';
    }
    if (
      formData.socialLinks?.website &&
      !urlRegex.test(formData.socialLinks.website)
    ) {
      newErrors['socialLinks.website'] = 'Please enter a valid website URL';
    }

    // Date validation
    const today = new Date();
    const employmentDate = new Date(formData.employmentDate);
    if (employmentDate > today) {
      newErrors.employmentDate = 'Employment date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      // Transform form data to match backend DTO
      const staffData = {
        user: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        profile: {
          qualification: formData.qualification,
          designation: formData.designation,
          department: formData.department,
          experienceYears: formData.experienceYears,
          employmentDate: formData.employmentDate,
          salary: formData.salary,
          bio: formData.bio,
          emergencyContact: formData.emergencyContact,
          address: formData.address,
          socialLinks: formData.socialLinks,
        },
        bankDetails: formData.bankDetails,
      };

      const response = await staffService.createStaff(staffData);

      if (response.success) {
        toast.success('Staff member created successfully!');
        setFormData(initialFormData);
        setImagePreview(null);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to create staff member');
      }
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = useCallback(() => {
    if (loading) return;
    setFormData(initialFormData);
    setErrors({});
    setImagePreview(null);
    onClose();
  }, [loading, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, handleClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-br from-purple-500 to-violet-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <Briefcase size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Staff</h2>
              <p className='text-purple-100 text-sm'>
                Enter staff member information and role details
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className='p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50'
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information */}
            <FormSection title='Basic Information' icon={User}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Full Name'
                  name='fullName'
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder='Enter full name'
                  required
                  error={errors.fullName}
                />
                <LabeledInput
                  label='Email Address'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='Enter email address'
                  required
                  error={errors.email}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  error={errors.phone}
                />
              </div>

              {/* Profile Photo */}
              <div className='mt-4'>
                <label className='text-sm font-medium leading-none mb-2 block'>
                  Profile Photo
                </label>
                <div className='flex items-center space-x-4'>
                  <div className='relative'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                    />
                    <div className='w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors'>
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt='Preview'
                          className='w-full h-full object-cover rounded-lg'
                        />
                      ) : (
                        <Camera size={24} className='text-gray-400' />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>
                      Upload a profile photo
                    </p>
                    <p className='text-xs text-gray-500'>PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Professional Information */}
            <FormSection title='Professional Information' icon={Briefcase}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Qualification'
                  name='qualification'
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder='Enter qualification'
                  required
                  error={errors.qualification}
                />
                <LabeledInput
                  label='Designation'
                  name='designation'
                  value={formData.designation || ''}
                  onChange={handleInputChange}
                  placeholder='Enter designation'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledSelect
                  label='Department'
                  name='department'
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  options={departmentOptions}
                  placeholder='Select department'
                />
                <LabeledInput
                  label='Experience (Years)'
                  name='experienceYears'
                  type='number'
                  value={formData.experienceYears || ''}
                  onChange={handleInputChange}
                  placeholder='Enter years of experience'
                  min='0'
                />
                <LabeledInput
                  label='Employment Date'
                  name='employmentDate'
                  type='date'
                  value={formData.employmentDate}
                  onChange={handleInputChange}
                  required
                  error={errors.employmentDate}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='Salary'
                  name='salary'
                  type='number'
                  value={formData.salary || ''}
                  onChange={handleInputChange}
                  placeholder='Enter salary amount'
                  min='0'
                />
              </div>

              <div className='mt-4'>
                <LabeledTextarea
                  label='Bio'
                  name='bio'
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  placeholder='Enter a brief bio'
                  rows={3}
                />
              </div>
            </FormSection>

            {/* Emergency Contact */}
            <FormSection title='Emergency Contact' icon={Phone}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Contact Name'
                  name='emergencyContact.name'
                  value={formData.emergencyContact?.name || ''}
                  onChange={handleInputChange}
                  placeholder='Enter contact name'
                />
                <LabeledInput
                  label='Contact Phone'
                  name='emergencyContact.phone'
                  value={formData.emergencyContact?.phone || ''}
                  onChange={handleInputChange}
                  placeholder='Enter contact phone'
                />
                <LabeledInput
                  label='Relationship'
                  name='emergencyContact.relationship'
                  value={formData.emergencyContact?.relationship || ''}
                  onChange={handleInputChange}
                  placeholder='Enter relationship'
                />
              </div>
            </FormSection>

            {/* Address Information */}
            <FormSection title='Address Information' icon={Mail}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Street'
                  name='address.street'
                  value={formData.address?.street || ''}
                  onChange={handleInputChange}
                  placeholder='Enter street address'
                />
                <LabeledInput
                  label='City'
                  name='address.city'
                  value={formData.address?.city || ''}
                  onChange={handleInputChange}
                  placeholder='Enter city'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='State'
                  name='address.state'
                  value={formData.address?.state || ''}
                  onChange={handleInputChange}
                  placeholder='Enter state'
                />
                <LabeledInput
                  label='ZIP Code'
                  name='address.zipCode'
                  value={formData.address?.zipCode || ''}
                  onChange={handleInputChange}
                  placeholder='Enter ZIP code'
                />
                <LabeledInput
                  label='Country'
                  name='address.country'
                  value={formData.address?.country || ''}
                  onChange={handleInputChange}
                  placeholder='Enter country'
                />
              </div>
            </FormSection>

            {/* Social Links */}
            <FormSection title='Social Links' icon={Plus}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='LinkedIn'
                  name='socialLinks.linkedin'
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={handleInputChange}
                  placeholder='Enter LinkedIn URL'
                  error={errors['socialLinks.linkedin']}
                />
                <LabeledInput
                  label='Twitter'
                  name='socialLinks.twitter'
                  value={formData.socialLinks?.twitter || ''}
                  onChange={handleInputChange}
                  placeholder='Enter Twitter URL'
                  error={errors['socialLinks.twitter']}
                />
                <LabeledInput
                  label='Website'
                  name='socialLinks.website'
                  value={formData.socialLinks?.website || ''}
                  onChange={handleInputChange}
                  placeholder='Enter website URL'
                  error={errors['socialLinks.website']}
                />
              </div>
            </FormSection>

            {/* Bank Details */}
            <FormSection title='Bank Details' icon={Landmark}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Bank Name'
                  name='bankDetails.bankName'
                  value={formData.bankDetails?.bankName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter bank name'
                />
                <LabeledInput
                  label='Account Number'
                  name='bankDetails.bankAccountNumber'
                  value={formData.bankDetails?.bankAccountNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter account number'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='Branch'
                  name='bankDetails.bankBranch'
                  value={formData.bankDetails?.bankBranch || ''}
                  onChange={handleInputChange}
                  placeholder='Enter branch'
                />
                <LabeledInput
                  label='PAN Number'
                  name='bankDetails.panNumber'
                  value={formData.bankDetails?.panNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter PAN number'
                />
                <LabeledInput
                  label='Citizenship Number'
                  name='bankDetails.citizenshipNumber'
                  value={formData.bankDetails?.citizenshipNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter citizenship number'
                />
              </div>
            </FormSection>

            {/* Form Actions */}
            <div className='flex justify-end space-x-4 pt-6 border-t'>
              <button
                type='button'
                onClick={handleClose}
                disabled={loading}
                className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Create Staff
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
