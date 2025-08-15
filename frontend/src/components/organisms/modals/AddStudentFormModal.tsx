'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Users,
  Mail,
  Phone,
  Camera,
  BookOpen,
  Plus,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { classService } from '@/api/services/class.service';
import { studentService } from '@/api/services/student.service';
import { parentService } from '@/api/services/parent.service';

interface AddStudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StudentFormData {
  // User Information
  fullName: string;
  email: string;
  phone: string;

  // Parent Mode Selection
  parentMode: 'new' | 'existing';

  // Student Specific Information
  classId: string;
  rollNumber: string;
  admissionDate: string;
  dob: string;
  gender: string;
  bloodGroup?: string;

  // Parent Information
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  fatherEmail: string;
  motherEmail: string;
  fatherOccupation?: string;
  motherOccupation?: string;

  // Address Information
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Additional Parents/Guardians
  guardians: Array<{
    fullName: string;
    phone: string;
    email: string;
    relation: string;
  }>;

  // Profile Photo
  photo?: File | null;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;

  // Additional Information
  interests?: string;
  medicalConditions?: string;
  allergies?: string;
}

const initialFormData: StudentFormData = {
  fullName: '',
  email: '',
  phone: '',
  parentMode: 'new',
  classId: '',
  rollNumber: '',
  admissionDate: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  fatherName: '',
  motherName: '',
  fatherPhone: '',
  motherPhone: '',
  fatherEmail: '',
  motherEmail: '',
  fatherOccupation: '',
  motherOccupation: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  guardians: [],
  photo: null,
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  interests: '',
  medicalConditions: '',
  allergies: '',
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200`}
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200`}
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200 resize-vertical`}
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
    className={`bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
      <Icon size={20} className='mr-3 text-orange-600' />
      {title}
    </h3>
    {children}
  </div>
);

export default function AddStudentFormModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStudentFormModalProps) {
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load classes
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    try {
      const response = await classService.getAllClasses();
      if (response.success) {
        setAvailableClasses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

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

  // Handle guardian changes
  const addGuardian = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      guardians: [
        ...prev.guardians,
        { fullName: '', phone: '', email: '', relation: '' },
      ],
    }));
  }, []);

  const removeGuardian = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));
  }, []);

  const handleGuardianChange = useCallback(
    (index: number, field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        guardians: prev.guardians.map((guardian, i) =>
          i === index ? { ...guardian, [field]: value } : guardian,
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
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.rollNumber.trim())
      newErrors.rollNumber = 'Roll number is required';
    if (!formData.admissionDate)
      newErrors.admissionDate = 'Admission date is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.fatherName.trim())
      newErrors.fatherName = 'Father name is required';
    if (!formData.motherName.trim())
      newErrors.motherName = 'Mother name is required';
    if (!formData.fatherEmail.trim())
      newErrors.fatherEmail = 'Father email is required';
    if (!formData.motherEmail.trim())
      newErrors.motherEmail = 'Mother email is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.fatherEmail && !emailRegex.test(formData.fatherEmail)) {
      newErrors.fatherEmail = 'Please enter a valid father email address';
    }
    if (formData.motherEmail && !emailRegex.test(formData.motherEmail)) {
      newErrors.motherEmail = 'Please enter a valid mother email address';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (
      formData.fatherPhone &&
      !phoneRegex.test(formData.fatherPhone.replace(/\D/g, ''))
    ) {
      newErrors.fatherPhone = 'Please enter a valid 10-digit phone number';
    }
    if (
      formData.motherPhone &&
      !phoneRegex.test(formData.motherPhone.replace(/\D/g, ''))
    ) {
      newErrors.motherPhone = 'Please enter a valid 10-digit phone number';
    }

    // Date validation
    const today = new Date();
    const dobDate = new Date(formData.dob);
    const admissionDate = new Date(formData.admissionDate);

    if (dobDate >= today) {
      newErrors.dob = 'Date of birth must be in the past';
    }
    if (admissionDate > today) {
      newErrors.admissionDate = 'Admission date cannot be in the future';
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
      const studentData = {
        user: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        classId: formData.classId,
        rollNumber: formData.rollNumber,
        admissionDate: formData.admissionDate,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender as 'male' | 'female' | 'other',
        bloodGroup: formData.bloodGroup,
        imageUrl: undefined, // Will be set after photo upload

        // Parent information
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        fatherPhone: formData.fatherPhone,
        motherPhone: formData.motherPhone,
        fatherEmail: formData.fatherEmail,
        motherEmail: formData.motherEmail,
        fatherOccupation: formData.fatherOccupation,
        motherOccupation: formData.motherOccupation,

        // Address
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
        },

        // Guardians
        guardians: formData.guardians.filter(
          g => g.fullName && g.phone && g.email,
        ),

        // Parents for user account creation
        parents: [
          {
            fullName: formData.fatherName,
            email: formData.fatherEmail,
            phone: formData.fatherPhone,
            relationship: 'father',
            isPrimary: true,
            createUserAccount: true,
          },
          {
            fullName: formData.motherName,
            email: formData.motherEmail,
            phone: formData.motherPhone,
            relationship: 'mother',
            isPrimary: false,
            createUserAccount: false,
          },
        ],

        // Profile
        profile: {
          emergencyContact: formData.emergencyContactName
            ? {
                name: formData.emergencyContactName,
                phone: formData.emergencyContactPhone,
                relationship: formData.emergencyContactRelation,
              }
            : undefined,
          interests: formData.interests
            ? { interests: formData.interests }
            : undefined,
          additionalData: {
            medicalConditions: formData.medicalConditions,
            allergies: formData.allergies,
          },
        },
      };

      const response = await studentService.createStudentWithNewParents(
        studentData,
        formData.photo || undefined,
      );

      if (response.success) {
        // Log any generated passwords to console for testing purposes
        if (
          response.data?.temporaryPassword ||
          response.data?.parentCredentials
        ) {
          console.log('🎓 STUDENT CREATED SUCCESSFULLY! 🎓');

          // Log student credentials if available
          if (response.data?.temporaryPassword) {
            console.table({
              'Student Email': response.data.student?.email || formData.email,
              'Generated Password': response.data.temporaryPassword,
              'Student Name':
                response.data.student?.fullName ||
                `${formData.firstName} ${formData.lastName}`,
              'Student ID': response.data.student?.id || 'Not available',
              'Roll Number': formData.rollNumber,
              Class: formData.classId || 'Not assigned',
            });
          }

          // Log parent credentials if available
          if (
            response.data?.parentCredentials &&
            Array.isArray(response.data.parentCredentials)
          ) {
            console.log('👨‍👩‍👧‍👦 PARENT ACCOUNTS CREATED:');
            response.data.parentCredentials.forEach(
              (parent: any, index: number) => {
                console.table({
                  [`Parent ${index + 1} Email`]: parent.email,
                  [`Parent ${index + 1} Password`]: parent.temporaryPassword,
                  [`Parent ${index + 1} Name`]: parent.fullName,
                  [`Parent ${index + 1} ID`]: parent.id,
                });
              },
            );
          }

          console.log('💡 Use these credentials to test login functionality');
          console.log(
            '⚠️  These passwords will be shown only once for security reasons',
          );
          console.log('🔗 Go to login page to test these credentials');
        }

        toast.success('Student created successfully!');
        setFormData(initialFormData);
        setImagePreview(null);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to create student');
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(error.message || 'Failed to create student');
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
        <div className='bg-gradient-to-br from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <User size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Student</h2>
              <p className='text-orange-100 text-sm'>
                Enter student information and academic details
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
            {/* Student Information */}
            <FormSection title='Student Information' icon={User}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Full Name'
                  name='fullName'
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder='Enter student full name'
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
                />
                <LabeledInput
                  label='Date of Birth'
                  name='dob'
                  type='date'
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  error={errors.dob}
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder='Select gender'
                  required
                  error={errors.gender}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledSelect
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup || ''}
                  onChange={handleInputChange}
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                  ]}
                  placeholder='Select blood group'
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

            {/* Academic Information */}
            <FormSection title='Academic Information' icon={BookOpen}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledSelect
                  label='Class'
                  name='classId'
                  value={formData.classId}
                  onChange={handleInputChange}
                  options={availableClasses.map(cls => ({
                    value: cls.id,
                    label: `${cls.name} - ${cls.section || 'A'}`,
                  }))}
                  placeholder='Select class'
                  required
                  error={errors.classId}
                />
                <LabeledInput
                  label='Roll Number'
                  name='rollNumber'
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder='Enter roll number'
                  required
                  error={errors.rollNumber}
                />
                <LabeledInput
                  label='Admission Date'
                  name='admissionDate'
                  type='date'
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  required
                  error={errors.admissionDate}
                />
              </div>
            </FormSection>

            {/* Parent Information */}
            <FormSection title='Parent Information' icon={Users}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Father Information */}
                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900 border-b pb-2'>
                    Father Details
                  </h4>
                  <LabeledInput
                    label='Father Name'
                    name='fatherName'
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder='Enter father name'
                    required
                    error={errors.fatherName}
                  />
                  <LabeledInput
                    label='Father Email'
                    name='fatherEmail'
                    type='email'
                    value={formData.fatherEmail}
                    onChange={handleInputChange}
                    placeholder='Enter father email'
                    required
                    error={errors.fatherEmail}
                  />
                  <LabeledInput
                    label='Father Phone'
                    name='fatherPhone'
                    value={formData.fatherPhone}
                    onChange={handleInputChange}
                    placeholder='Enter father phone'
                    error={errors.fatherPhone}
                  />
                  <LabeledInput
                    label='Father Occupation'
                    name='fatherOccupation'
                    value={formData.fatherOccupation || ''}
                    onChange={handleInputChange}
                    placeholder='Enter father occupation'
                  />
                </div>

                {/* Mother Information */}
                <div className='space-y-4'>
                  <h4 className='font-medium text-gray-900 border-b pb-2'>
                    Mother Details
                  </h4>
                  <LabeledInput
                    label='Mother Name'
                    name='motherName'
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder='Enter mother name'
                    required
                    error={errors.motherName}
                  />
                  <LabeledInput
                    label='Mother Email'
                    name='motherEmail'
                    type='email'
                    value={formData.motherEmail}
                    onChange={handleInputChange}
                    placeholder='Enter mother email'
                    required
                    error={errors.motherEmail}
                  />
                  <LabeledInput
                    label='Mother Phone'
                    name='motherPhone'
                    value={formData.motherPhone}
                    onChange={handleInputChange}
                    placeholder='Enter mother phone'
                    error={errors.motherPhone}
                  />
                  <LabeledInput
                    label='Mother Occupation'
                    name='motherOccupation'
                    value={formData.motherOccupation || ''}
                    onChange={handleInputChange}
                    placeholder='Enter mother occupation'
                  />
                </div>
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
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
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
              </div>
            </FormSection>

            {/* Additional Guardians */}
            <FormSection title='Additional Guardians' icon={UserPlus}>
              <div className='space-y-4'>
                {formData.guardians.map((guardian, index) => (
                  <div key={index} className='border rounded-lg p-4 bg-white'>
                    <div className='flex justify-between items-center mb-4'>
                      <h5 className='font-medium text-gray-900'>
                        Guardian {index + 1}
                      </h5>
                      <button
                        type='button'
                        onClick={() => removeGuardian(index)}
                        className='text-red-600 hover:text-red-800 text-sm'
                      >
                        Remove
                      </button>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <LabeledInput
                        label='Full Name'
                        name={`guardian-${index}-fullName`}
                        value={guardian.fullName}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'fullName',
                            e.target.value,
                          )
                        }
                        placeholder='Enter guardian name'
                      />
                      <LabeledInput
                        label='Relation'
                        name={`guardian-${index}-relation`}
                        value={guardian.relation}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'relation',
                            e.target.value,
                          )
                        }
                        placeholder='Enter relation'
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                      <LabeledInput
                        label='Phone'
                        name={`guardian-${index}-phone`}
                        value={guardian.phone}
                        onChange={e =>
                          handleGuardianChange(index, 'phone', e.target.value)
                        }
                        placeholder='Enter phone number'
                      />
                      <LabeledInput
                        label='Email'
                        name={`guardian-${index}-email`}
                        type='email'
                        value={guardian.email}
                        onChange={e =>
                          handleGuardianChange(index, 'email', e.target.value)
                        }
                        placeholder='Enter email address'
                      />
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  onClick={addGuardian}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors duration-200 flex items-center justify-center'
                >
                  <Plus size={20} className='mr-2' />
                  Add Guardian
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
                  label='Interests'
                  name='interests'
                  value={formData.interests || ''}
                  onChange={handleInputChange}
                  placeholder='Enter student interests and hobbies'
                  rows={3}
                />
                <LabeledTextarea
                  label='Medical Conditions'
                  name='medicalConditions'
                  value={formData.medicalConditions || ''}
                  onChange={handleInputChange}
                  placeholder='Enter any medical conditions'
                  rows={3}
                />
                <LabeledTextarea
                  label='Allergies'
                  name='allergies'
                  value={formData.allergies || ''}
                  onChange={handleInputChange}
                  placeholder='Enter any known allergies'
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
                className='px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Create Student
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
