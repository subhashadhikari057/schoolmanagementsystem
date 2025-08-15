'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  User,
  Mail,
  Phone,
  Camera,
  Plus,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { parentService } from '@/api/services/parent.service';

interface AddParentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChildInfo {
  fullName: string;
  classId: string;
  rollNumber: string;
  relationship: string;
}

interface ParentFormData {
  // Basic Information
  fullName: string;
  email: string;
  phone: string;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  workPlace?: string;
  workPhone?: string;

  // Address Information
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Children Information
  children: ChildInfo[];

  // Additional Information
  notes?: string;
  specialInstructions?: string;

  // Profile Photo
  photo?: File | null;
}

const initialFormData: ParentFormData = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  occupation: '',
  workPlace: '',
  workPhone: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  country: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  children: [],
  notes: '',
  specialInstructions: '',
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200`}
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200`}
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 resize-vertical`}
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
    className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
      <Icon size={20} className='mr-3 text-green-600' />
      {title}
    </h3>
    {children}
  </div>
);

export default function AddParentFormModal({
  isOpen,
  onClose,
  onSuccess,
}: AddParentFormModalProps) {
  const [formData, setFormData] = useState<ParentFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));

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

  // Handle child information changes
  const addChild = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      children: [
        ...prev.children,
        { fullName: '', classId: '', rollNumber: '', relationship: 'father' },
      ],
    }));
  }, []);

  const removeChild = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  }, []);

  const handleChildChange = useCallback(
    (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        children: prev.children.map((child, i) =>
          i === index ? { ...child, [field]: value } : child,
        ),
      }));
    },
    [],
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (
      formData.workPhone &&
      !phoneRegex.test(formData.workPhone.replace(/\D/g, ''))
    ) {
      newErrors.workPhone = 'Please enter a valid 10-digit work phone number';
    }

    // Date validation
    if (formData.dateOfBirth) {
      const today = new Date();
      const dobDate = new Date(formData.dateOfBirth);
      if (dobDate >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    // Children validation
    formData.children.forEach((child, index) => {
      if (!child.fullName.trim()) {
        newErrors[`child-${index}-fullName`] = 'Child name is required';
      }
      if (!child.relationship.trim()) {
        newErrors[`child-${index}-relationship`] = 'Relationship is required';
      }
    });

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
      // Transform form data to match backend requirements
      const parentData = {
        user: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        profile: {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          occupation: formData.occupation,
          workPlace: formData.workPlace,
          workPhone: formData.workPhone,
          emergencyContact: formData.emergencyContactName
            ? {
                name: formData.emergencyContactName,
                phone: formData.emergencyContactPhone,
                relationship: formData.emergencyContactRelation,
              }
            : undefined,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pinCode: formData.pinCode,
            country: formData.country,
          },
          notes: formData.notes,
          specialInstructions: formData.specialInstructions,
        },
        children: formData.children.filter(
          child => child.fullName && child.relationship,
        ),
      };

      const response = await parentService.createParent(
        parentData,
        formData.photo || undefined,
      );

      if (response.success) {
        // Log the generated password to console for testing purposes
        // Note: Parent creation might return password in different structure
        const tempPassword = (response.data as any)?.temporaryPassword;
        if (tempPassword) {
          console.log('👨‍👩‍👧‍👦 PARENT ACCOUNT CREATED SUCCESSFULLY! 👨‍👩‍👧‍👦');
          console.table({
            Email: response.data.email || formData.email,
            'Generated Password': tempPassword,
            'Parent Name': response.data.fullName || formData.fullName,
            'Parent ID': response.data.id || 'Not available',
            Phone: formData.phone,
            'Children Count': formData.children.filter(child => child.fullName)
              .length,
          });
          console.log('💡 Use these credentials to test login functionality');
          console.log(
            '⚠️  This password will be shown only once for security reasons',
          );
          console.log('🔗 Go to login page to test these credentials');
        }

        toast.success('Parent account created successfully!');
        setFormData(initialFormData);
        setImagePreview(null);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to create parent account');
      }
    } catch (error: any) {
      console.error('Error creating parent:', error);
      toast.error(error.message || 'Failed to create parent account');
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
        <div className='bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <Users size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Parent</h2>
              <p className='text-green-100 text-sm'>
                Enter parent information and contact details
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

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  required
                  error={errors.phone}
                />
                <LabeledInput
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth || ''}
                  onChange={handleInputChange}
                  error={errors.dateOfBirth}
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder='Select gender'
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
                  label='Occupation'
                  name='occupation'
                  value={formData.occupation || ''}
                  onChange={handleInputChange}
                  placeholder='Enter occupation'
                />
                <LabeledInput
                  label='Workplace'
                  name='workPlace'
                  value={formData.workPlace || ''}
                  onChange={handleInputChange}
                  placeholder='Enter workplace'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='Work Phone'
                  name='workPhone'
                  value={formData.workPhone || ''}
                  onChange={handleInputChange}
                  placeholder='Enter work phone number'
                  error={errors.workPhone}
                />
              </div>
            </FormSection>

            {/* Address Information */}
            <FormSection title='Address Information' icon={Mail}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Street'
                  name='street'
                  value={formData.street || ''}
                  onChange={handleInputChange}
                  placeholder='Enter street address'
                />
                <LabeledInput
                  label='City'
                  name='city'
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder='Enter city'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='State'
                  name='state'
                  value={formData.state || ''}
                  onChange={handleInputChange}
                  placeholder='Enter state'
                />
                <LabeledInput
                  label='PIN Code'
                  name='pinCode'
                  value={formData.pinCode || ''}
                  onChange={handleInputChange}
                  placeholder='Enter PIN code'
                />
                <LabeledInput
                  label='Country'
                  name='country'
                  value={formData.country || ''}
                  onChange={handleInputChange}
                  placeholder='Enter country'
                />
              </div>
            </FormSection>

            {/* Children Information */}
            <FormSection title='Children Information' icon={Users}>
              <div className='space-y-4'>
                {formData.children.map((child, index) => (
                  <div key={index} className='border rounded-lg p-4 bg-white'>
                    <div className='flex justify-between items-center mb-4'>
                      <h5 className='font-medium text-gray-900'>
                        Child {index + 1}
                      </h5>
                      <button
                        type='button'
                        onClick={() => removeChild(index)}
                        className='text-red-600 hover:text-red-800 text-sm'
                      >
                        Remove
                      </button>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <LabeledInput
                        label='Child Name'
                        name={`child-${index}-fullName`}
                        value={child.fullName}
                        onChange={e =>
                          handleChildChange(index, 'fullName', e.target.value)
                        }
                        placeholder='Enter child name'
                        error={errors[`child-${index}-fullName`]}
                      />
                      <LabeledSelect
                        label='Relationship'
                        name={`child-${index}-relationship`}
                        value={child.relationship}
                        onChange={e =>
                          handleChildChange(
                            index,
                            'relationship',
                            e.target.value,
                          )
                        }
                        options={[
                          { value: 'father', label: 'Father' },
                          { value: 'mother', label: 'Mother' },
                          { value: 'guardian', label: 'Guardian' },
                          { value: 'stepfather', label: 'Step Father' },
                          { value: 'stepmother', label: 'Step Mother' },
                          { value: 'grandfather', label: 'Grandfather' },
                          { value: 'grandmother', label: 'Grandmother' },
                          { value: 'uncle', label: 'Uncle' },
                          { value: 'aunt', label: 'Aunt' },
                          { value: 'other', label: 'Other' },
                        ]}
                        placeholder='Select relationship'
                        error={errors[`child-${index}-relationship`]}
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                      <LabeledInput
                        label='Class ID'
                        name={`child-${index}-classId`}
                        value={child.classId}
                        onChange={e =>
                          handleChildChange(index, 'classId', e.target.value)
                        }
                        placeholder='Enter class ID (optional)'
                      />
                      <LabeledInput
                        label='Roll Number'
                        name={`child-${index}-rollNumber`}
                        value={child.rollNumber}
                        onChange={e =>
                          handleChildChange(index, 'rollNumber', e.target.value)
                        }
                        placeholder='Enter roll number (optional)'
                      />
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  onClick={addChild}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors duration-200 flex items-center justify-center'
                >
                  <Plus size={20} className='mr-2' />
                  Add Child
                </button>
              </div>
            </FormSection>

            {/* Emergency Contact */}
            <FormSection title='Emergency Contact' icon={Phone}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Contact Name'
                  name='emergencyContactName'
                  value={formData.emergencyContactName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter contact name'
                />
                <LabeledInput
                  label='Contact Phone'
                  name='emergencyContactPhone'
                  value={formData.emergencyContactPhone || ''}
                  onChange={handleInputChange}
                  placeholder='Enter contact phone'
                />
                <LabeledInput
                  label='Relation'
                  name='emergencyContactRelation'
                  value={formData.emergencyContactRelation || ''}
                  onChange={handleInputChange}
                  placeholder='Enter relation'
                />
              </div>
            </FormSection>

            {/* Additional Information */}
            <FormSection title='Additional Information' icon={Plus}>
              <div className='space-y-4'>
                <LabeledTextarea
                  label='Notes'
                  name='notes'
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  placeholder='Enter any additional notes'
                  rows={3}
                />
                <LabeledTextarea
                  label='Special Instructions'
                  name='specialInstructions'
                  value={formData.specialInstructions || ''}
                  onChange={handleInputChange}
                  placeholder='Enter any special instructions'
                  rows={3}
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
                className='px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Create Parent
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
