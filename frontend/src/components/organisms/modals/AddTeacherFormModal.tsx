'use client';

import { classService } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { teacherService } from '@/api/services/teacher.service';
import {
  BookOpen,
  Briefcase,
  Camera,
  DollarSign,
  GraduationCap,
  Landmark,
  Plus,
  User,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AddTeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeacherFormData {
  // User Information
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Professional Information
  employeeId?: string;
  joiningDate: string;
  experienceYears?: number;
  highestQualification: string;
  specialization?: string;
  designation?: string;
  department?: string;

  // Subject Assignment
  subjects?: string[];

  // Salary Information
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;

  // Bank Details
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;

  // Additional Information
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;
  bio?: string;

  // Profile Photo
  photo?: File | null;
}

const initialFormData: TeacherFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  address: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  employeeId: '',
  joiningDate: '',
  experienceYears: 0,
  highestQualification: '',
  specialization: '',
  designation: '',
  department: '',
  subjects: [],
  basicSalary: 0,
  allowances: 0,
  totalSalary: 0,
  bankName: '',
  bankAccountNumber: '',
  bankBranch: '',
  panNumber: '',
  citizenshipNumber: '',
  languagesKnown: [],
  certifications: '',
  previousExperience: '',
  bio: '',
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
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
  options: string[];
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
      aria-invalid={error ? 'true' : 'false'}
    >
      <option value=''>{placeholder}</option>
      {options.map(option => (
        <option key={option} value={option}>
          {option}
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-vertical`}
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
    className={`bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
      <Icon size={20} className='mr-3 text-blue-600' />
      {title}
    </h3>
    {children}
  </div>
);

export default function AddTeacherFormModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTeacherFormModalProps) {
  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-generation states
  const [autoEmployeeId, setAutoEmployeeId] = useState<string>('');
  const [calculatedSalary, setCalculatedSalary] = useState<number>(0);
  const [employeeIdLoading, setEmployeeIdLoading] = useState(false);

  // Define loadNextEmployeeId function first
  const loadNextEmployeeId = useCallback(async () => {
    try {
      setEmployeeIdLoading(true);
      const response = await teacherService.getNextEmployeeId();
      if (response.success) {
        setAutoEmployeeId(response.data.employeeId);
        // Set employee ID if not already filled
        setFormData(prev => {
          if (!prev.employeeId) {
            return {
              ...prev,
              employeeId: response.data.employeeId,
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to load next employee ID:', error);
    } finally {
      setEmployeeIdLoading(false);
    }
  }, []);

  // Load subjects and classes
  useEffect(() => {
    if (isOpen) {
      loadSubjects();
      loadClasses();
      loadNextEmployeeId();
    }
  }, [isOpen, loadNextEmployeeId]);

  // Auto-calculate salary when basic salary or allowances change
  useEffect(() => {
    const calculateSalary = async () => {
      if (
        (formData.basicSalary && formData.basicSalary > 0) ||
        (formData.allowances && formData.allowances > 0)
      ) {
        try {
          const response = await teacherService.calculateSalary(
            formData.basicSalary || 0,
            formData.allowances || 0,
          );
          if (response.success) {
            setCalculatedSalary(response.data.totalSalary);
            setFormData(prev => ({
              ...prev,
              totalSalary: response.data.totalSalary,
            }));
          }
        } catch (error) {
          console.error('Error calculating salary:', error);
        }
      } else {
        setCalculatedSalary(0);
        setFormData(prev => ({
          ...prev,
          totalSalary: 0,
        }));
      }
    };

    const timeoutId = setTimeout(calculateSalary, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.basicSalary, formData.allowances]);

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      if (response.success) {
        setAvailableSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

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
      const { name, value, type } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
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

  // Handle subject selection
  const handleSubjectChange = useCallback(
    (subjectId: string, checked: boolean) => {
      setFormData(prev => ({
        ...prev,
        subjects: checked
          ? [...(prev.subjects || []), subjectId]
          : (prev.subjects || []).filter(id => id !== subjectId),
      }));
    },
    [],
  );

  // Handle languages known
  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const languages = e.target.value
        .split(',')
        .map(lang => lang.trim())
        .filter(lang => lang);
      setFormData(prev => ({ ...prev, languagesKnown: languages }));
    },
    [],
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.joiningDate)
      newErrors.joiningDate = 'Joining date is required';
    if (!formData.highestQualification.trim())
      newErrors.highestQualification = 'Qualification is required';

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
      console.log('Form data before transformation:', formData);

      // Validate required fields are not empty
      if (!formData.firstName?.trim()) {
        toast.error('First name is required');
        setLoading(false);
        return;
      }
      if (!formData.lastName?.trim()) {
        toast.error('Last name is required');
        setLoading(false);
        return;
      }
      if (!formData.email?.trim()) {
        toast.error('Email is required');
        setLoading(false);
        return;
      }
      if (!formData.phone?.trim()) {
        toast.error('Phone number is required');
        setLoading(false);
        return;
      }
      if (!formData.highestQualification?.trim()) {
        toast.error('Highest qualification is required');
        setLoading(false);
        return;
      }

      // Transform form data to match teacher service expectations (flat structure)
      const teacherData = {
        // User fields (flat)
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),

        // Personal fields (flat)
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        address: formData.address?.trim() || undefined,
        street: formData.street?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        pinCode: formData.pinCode?.trim() || undefined,

        // Professional fields (flat)
        employeeId: formData.employeeId?.trim() || undefined,
        joiningDate:
          formData.joiningDate || new Date().toISOString().split('T')[0],
        experienceYears:
          formData.experienceYears && formData.experienceYears > 0
            ? Number(formData.experienceYears)
            : undefined,
        highestQualification: formData.highestQualification.trim(),
        specialization: formData.specialization?.trim() || undefined,
        designation: formData.designation?.trim() || undefined,
        department: formData.department?.trim() || undefined,

        // Subject fields (flat)
        subjects:
          Array.isArray(formData.subjects) && formData.subjects.length > 0
            ? formData.subjects.filter(subject => subject && subject.trim())
            : [],

        // Salary fields (flat)
        basicSalary: formData.basicSalary || undefined,
        allowances: formData.allowances || undefined,
        totalSalary: formData.totalSalary || undefined,

        // Bank details (flat)
        bankName: formData.bankName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankBranch: formData.bankBranch?.trim() || undefined,
        panNumber: formData.panNumber?.trim() || undefined,
        citizenshipNumber: formData.citizenshipNumber?.trim() || undefined,

        // Additional fields (flat)
        languagesKnown: Array.isArray(formData.languagesKnown)
          ? formData.languagesKnown
          : [],
        certifications: formData.certifications?.trim() || undefined,
        previousExperience: formData.previousExperience?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,

        // Photo
        photo: formData.photo || undefined,
      };

      console.log('Transformed teacher data:', teacherData);
      console.log('User fields:', {
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        phone: teacherData.phone,
      });
      console.log('Subjects data:', teacherData.subjects);
      console.log('Professional data:', {
        highestQualification: teacherData.highestQualification,
        joiningDate: teacherData.joiningDate,
      });

      const response = await teacherService.createTeacher(teacherData as any);

      if (response.success) {
        // Log the generated password to console for testing purposes
        if (response.data.temporaryPassword) {
          console.log('🔐 TEACHER CREATED SUCCESSFULLY! 🔐');
          console.table({
            Email: response.data.teacher.email,
            'Generated Password': response.data.temporaryPassword,
            'Teacher Name': response.data.teacher.fullName,
            'Teacher ID': response.data.teacher.id,
            'Employee ID': response.data.teacher.employeeId || 'Not set',
          });
          console.log('💡 Use these credentials to test login functionality');
          console.log(
            '⚠️  This password will be shown only once for security reasons',
          );
          console.log('🔗 Go to login page to test these credentials');
        }

        toast.success('Teacher created successfully!');
        setFormData(initialFormData);
        setImagePreview(null);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to create teacher');
      }
    } catch (error: any) {
      console.error('Error creating teacher:', error);

      // Handle validation errors with user-friendly messages
      if (error.statusCode === 400 && error.details) {
        const fieldErrors: { [key: string]: string } = {};
        const friendlyMessages: string[] = [];

        error.details.forEach((detail: any) => {
          const field = detail.field;
          let friendlyMessage = detail.message;

          // Convert technical field names to user-friendly names
          const fieldNames: { [key: string]: string } = {
            'user.firstName': 'First Name',
            'user.lastName': 'Last Name',
            'user.email': 'Email Address',
            'user.phone': 'Phone Number',
            'professional.joiningDate': 'Joining Date',
            'professional.highestQualification': 'Highest Qualification',
            'personal.dateOfBirth': 'Date of Birth',
            'personal.gender': 'Gender',
            'salary.basicSalary': 'Basic Salary',
            'salary.allowances': 'Allowances',
          };

          const displayField = fieldNames[field] || field;
          friendlyMessage = friendlyMessage.replace(field, displayField);

          fieldErrors[field] = friendlyMessage;
          friendlyMessages.push(`${displayField}: ${friendlyMessage}`);
        });

        setErrors(fieldErrors);

        // Show user-friendly toast with specific issues
        if (friendlyMessages.length <= 3) {
          friendlyMessages.forEach(msg => toast.error(msg, { duration: 5000 }));
        } else {
          toast.error(
            `Please check the following fields: ${friendlyMessages.slice(0, 3).join(', ')} and ${friendlyMessages.length - 3} more`,
            { duration: 6000 },
          );
        }
      } else {
        toast.error(
          error.message ||
            'Failed to create teacher. Please check all required fields.',
        );
      }
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
        <div className='bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <GraduationCap size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Teacher</h2>
              <p className='text-blue-100 text-sm'>
                Enter teacher information and professional details
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
            {/* User Information */}
            <FormSection title='Basic Information' icon={User}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='First Name'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder='Enter first name'
                  required
                  error={errors.firstName}
                />
                <LabeledInput
                  label='Middle Name'
                  name='middleName'
                  value={formData.middleName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter middle name'
                />
                <LabeledInput
                  label='Last Name'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder='Enter last name'
                  required
                  error={errors.lastName}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
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
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  required
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

            {/* Personal Information */}
            <FormSection title='Personal Information' icon={User}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth || ''}
                  onChange={handleInputChange}
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  options={['Male', 'Female', 'Other']}
                  placeholder='Select gender'
                />
                <LabeledSelect
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup || ''}
                  onChange={handleInputChange}
                  options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                  placeholder='Select blood group'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledSelect
                  label='Marital Status'
                  name='maritalStatus'
                  value={formData.maritalStatus || ''}
                  onChange={handleInputChange}
                  options={['Single', 'Married', 'Divorced', 'Widowed']}
                  placeholder='Select marital status'
                />
              </div>

              <div className='mt-4'>
                <LabeledTextarea
                  label='Address'
                  name='address'
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder='Enter complete address'
                  rows={3}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <LabeledInput
                  label='Street'
                  name='street'
                  value={formData.street || ''}
                  onChange={handleInputChange}
                  placeholder='Enter street'
                />
                <LabeledInput
                  label='City'
                  name='city'
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder='Enter city'
                />
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

            {/* Professional Information */}
            <FormSection title='Professional Information' icon={Briefcase}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='relative'>
                  <LabeledInput
                    label='Employee ID'
                    name='employeeId'
                    value={formData.employeeId || ''}
                    onChange={handleInputChange}
                    placeholder={
                      autoEmployeeId
                        ? `Auto: ${autoEmployeeId}`
                        : 'Auto-generated'
                    }
                  />
                  {autoEmployeeId && (
                    <div className='flex items-center mt-1'>
                      <span className='text-xs text-green-600 flex items-center'>
                        ✨ Auto-generated:{' '}
                        <strong className='ml-1'>{autoEmployeeId}</strong>
                      </span>
                      {employeeIdLoading && (
                        <div className='ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-green-600'></div>
                      )}
                    </div>
                  )}
                </div>
                <LabeledInput
                  label='Joining Date'
                  name='joiningDate'
                  type='date'
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  required
                  error={errors.joiningDate}
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
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='Highest Qualification'
                  name='highestQualification'
                  value={formData.highestQualification}
                  onChange={handleInputChange}
                  placeholder='Enter highest qualification'
                  required
                  error={errors.highestQualification}
                />
                <LabeledInput
                  label='Specialization'
                  name='specialization'
                  value={formData.specialization || ''}
                  onChange={handleInputChange}
                  placeholder='Enter specialization'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Designation
                  </label>
                  <select
                    name='designation'
                    value={formData.designation || ''}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value=''>Select designation</option>
                    <option value='Senior Teacher'>Senior Teacher</option>
                    <option value='Assistant Teacher'>Assistant Teacher</option>
                    <option value='Head of Department'>
                      Head of Department
                    </option>
                    <option value='Principal'>Principal</option>
                    <option value='Vice Principal'>Vice Principal</option>
                  </select>
                </div>
                <LabeledInput
                  label='Department'
                  name='department'
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  placeholder='Enter department'
                />
              </div>
            </FormSection>

            {/* Subject Assignment */}
            <FormSection title='Subject Assignment' icon={BookOpen}>
              <div className='space-y-4'>
                {availableSubjects.length > 0 && (
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Subjects to Teach
                    </label>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3'>
                      {availableSubjects.map(subject => (
                        <div
                          key={subject.id}
                          className='flex items-center space-x-2'
                        >
                          <input
                            type='checkbox'
                            id={`subject-${subject.id}`}
                            checked={(formData.subjects || []).includes(
                              subject.id,
                            )}
                            onChange={e =>
                              handleSubjectChange(subject.id, e.target.checked)
                            }
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                          <label
                            htmlFor={`subject-${subject.id}`}
                            className='text-sm'
                          >
                            {subject.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Salary Information */}
            <FormSection title='Salary Information' icon={DollarSign}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Basic Salary'
                  name='basicSalary'
                  type='number'
                  value={formData.basicSalary || ''}
                  onChange={handleInputChange}
                  placeholder='Enter basic salary'
                  min='0'
                />
                <LabeledInput
                  label='Allowances'
                  name='allowances'
                  type='number'
                  value={formData.allowances || ''}
                  onChange={handleInputChange}
                  placeholder='Enter allowances'
                  min='0'
                />
                <div className='relative'>
                  <LabeledInput
                    label='Total Salary'
                    name='totalSalary'
                    type='number'
                    value={formData.totalSalary || ''}
                    onChange={handleInputChange}
                    placeholder='Auto-calculated'
                    min='0'
                    disabled
                  />
                  <div className='flex items-center justify-between mt-1'>
                    <span className='text-xs text-blue-600 flex items-center'>
                      🧮 Auto-calculated:{' '}
                      <strong className='ml-1'>
                        ₹{calculatedSalary.toLocaleString()}
                      </strong>
                    </span>
                    {(formData.basicSalary || formData.allowances) && (
                      <span className='text-xs text-gray-500'>
                        ({(formData.basicSalary || 0).toLocaleString()} +{' '}
                        {(formData.allowances || 0).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Bank Details */}
            <FormSection title='Bank Details' icon={Landmark}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Bank Name'
                  name='bankName'
                  value={formData.bankName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter bank name'
                />
                <LabeledInput
                  label='Account Number'
                  name='bankAccountNumber'
                  value={formData.bankAccountNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter account number'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='Branch'
                  name='bankBranch'
                  value={formData.bankBranch || ''}
                  onChange={handleInputChange}
                  placeholder='Enter branch'
                />
                <LabeledInput
                  label='PAN Number'
                  name='panNumber'
                  value={formData.panNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter PAN number'
                />
                <LabeledInput
                  label='Citizenship Number'
                  name='citizenshipNumber'
                  value={formData.citizenshipNumber || ''}
                  onChange={handleInputChange}
                  placeholder='Enter citizenship number'
                />
              </div>
            </FormSection>

            {/* Additional Information */}
            <FormSection title='Additional Information' icon={Plus}>
              <div className='space-y-4'>
                <LabeledInput
                  label='Languages Known'
                  name='languagesKnown'
                  value={(formData.languagesKnown || []).join(', ')}
                  onChange={handleLanguageChange}
                  placeholder='Enter languages separated by commas'
                />

                <LabeledTextarea
                  label='Certifications'
                  name='certifications'
                  value={formData.certifications || ''}
                  onChange={handleInputChange}
                  placeholder='Enter certifications'
                  rows={3}
                />

                <LabeledTextarea
                  label='Previous Experience'
                  name='previousExperience'
                  value={formData.previousExperience || ''}
                  onChange={handleInputChange}
                  placeholder='Enter previous work experience'
                  rows={3}
                />

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
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Create Teacher
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
