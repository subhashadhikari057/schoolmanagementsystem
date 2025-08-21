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
  GraduationCap,
  MapPin,
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
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  createLoginAccount: boolean;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Professional Information
  employeeId?: string;
  joiningDate: string;
  experienceYears?: number;
  qualification: string;
  designation?: string;
  department?: string;

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

  // Profile Photo
  photo?: File | null;
}

const initialFormData: StaffFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  createLoginAccount: false,
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  employeeId: '',
  joiningDate: '',
  experienceYears: 0,
  qualification: '',
  designation: '',
  department: '',
  basicSalary: 0,
  allowances: 0,
  totalSalary: 0,
  bankName: '',
  bankAccountNumber: '',
  bankBranch: '',
  panNumber: '',
  citizenshipNumber: '',
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
  icon?: React.ReactNode;
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
  icon,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <div className='relative'>
      {icon && (
        <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
          {icon}
        </div>
      )}
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
        } bg-white ${icon ? 'pl-10' : 'px-3'} py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
        aria-invalid={error ? 'true' : 'false'}
      />
    </div>
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

  // Auto-generation states
  const [autoEmployeeId, setAutoEmployeeId] = useState<string>('');
  const [calculatedSalary, setCalculatedSalary] = useState<number>(0);
  const [employeeIdLoading, setEmployeeIdLoading] = useState(false);

  // Define loadNextEmployeeId function
  const loadNextEmployeeId = useCallback(async () => {
    try {
      setEmployeeIdLoading(true);
      const response = await staffService.getNextEmployeeId();
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
      } else {
        // Fallback: Generate a simple employee ID if API fails
        const currentYear = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        const fallbackId = `S-${currentYear}-${randomNum}`;

        setAutoEmployeeId(fallbackId);
        setFormData(prev => {
          if (!prev.employeeId) {
            return {
              ...prev,
              employeeId: fallbackId,
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to load next employee ID:', error);

      // Fallback: Generate a simple employee ID if API fails
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const fallbackId = `S-${currentYear}-${randomNum}`;

      setAutoEmployeeId(fallbackId);
      setFormData(prev => {
        if (!prev.employeeId) {
          return {
            ...prev,
            employeeId: fallbackId,
          };
        }
        return prev;
      });
    } finally {
      setEmployeeIdLoading(false);
    }
  }, []);

  // Load employee ID when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNextEmployeeId();
    }
  }, [isOpen, loadNextEmployeeId]);

  // Auto-calculate salary when basic salary or allowances change
  useEffect(() => {
    const calculateSalary = () => {
      if (
        (formData.basicSalary && formData.basicSalary > 0) ||
        (formData.allowances && formData.allowances > 0)
      ) {
        const basic = Number(formData.basicSalary) || 0;
        const allowances = Number(formData.allowances) || 0;
        const total = basic + allowances;

        setCalculatedSalary(total);
        setFormData(prev => ({
          ...prev,
          totalSalary: total,
        }));
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

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.qualification.trim())
      newErrors.qualification = 'Qualification is required';
    if (!formData.joiningDate)
      newErrors.joiningDate = 'Joining date is required';

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

    // Date validation
    const today = new Date();
    const joiningDate = new Date(formData.joiningDate);
    if (joiningDate > today) {
      newErrors.joiningDate = 'Joining date cannot be in the future';
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
          firstName: formData.firstName.trim(),
          middleName: formData.middleName?.trim() || undefined,
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          createLoginAccount: formData.createLoginAccount,
        },
        profile: {
          dateOfBirth: formData.dateOfBirth || undefined,
          gender:
            (formData.gender?.trim() as 'Male' | 'Female' | 'Other') ||
            undefined,
          bloodGroup:
            (formData.bloodGroup as
              | 'A+'
              | 'A-'
              | 'B+'
              | 'B-'
              | 'AB+'
              | 'AB-'
              | 'O+'
              | 'O-') || undefined,
          maritalStatus: formData.maritalStatus || undefined,
          street: formData.street?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          pinCode: formData.pinCode?.trim() || undefined,
          employeeId: formData.employeeId?.trim() || undefined,
          joiningDate:
            formData.joiningDate || new Date().toISOString().split('T')[0],
          employmentDate:
            formData.joiningDate || new Date().toISOString().split('T')[0],
          experienceYears:
            formData.experienceYears && formData.experienceYears > 0
              ? Number(formData.experienceYears)
              : undefined,
          qualification: formData.qualification.trim(),
          designation: formData.designation?.trim() || 'Staff',
          department: (formData.department?.trim() as any) || 'administration',
        },
        bankDetails: {
          bankName: formData.bankName?.trim() || undefined,
          bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
          bankBranch: formData.bankBranch?.trim() || undefined,
          panNumber: formData.panNumber?.trim() || undefined,
          citizenshipNumber: formData.citizenshipNumber?.trim() || undefined,
        },
        salary: {
          basicSalary: formData.basicSalary || undefined,
          allowances: formData.allowances || undefined,
          totalSalary: formData.totalSalary || undefined,
        },
        photo: formData.photo || undefined,
      };

      // Directly pass structured data; the service will build FormData
      const response = await staffService.createStaff(staffData);

      if (response.success) {
        // Log the generated password to console for testing purposes
        if (response.data?.temporaryPassword) {
          console.log('👥 STAFF MEMBER CREATED SUCCESSFULLY! 👥');
          console.table({
            Email: response.data.staff?.email || formData.email,
            'Generated Password': response.data.temporaryPassword,
            'Staff Name': `${formData.firstName} ${formData.lastName}`,
            'Staff ID': response.data.staff?.id || 'Not available',
            'Employee ID': response.data.staff?.employeeId || 'Not available',
            Department: formData.department,
            Designation: formData.designation,
            'Has Login Account': formData.createLoginAccount ? 'Yes' : 'No',
          });
          console.log('💡 Use these credentials to test login functionality');
          console.log(
            '⚠️  This password will be shown only once for security reasons',
          );
          console.log('🔗 Go to login page to test these credentials');
        }

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
            'profile.joiningDate': 'Joining Date',
            'profile.qualification': 'Qualification',
            'profile.dateOfBirth': 'Date of Birth',
            'profile.gender': 'Gender',
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
        toast.error(error.message || 'Failed to create staff member');
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
            <Briefcase size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Staff</h2>
              <p className='text-blue-100 text-sm'>
                Enter staff information and professional details
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
                  icon={<Mail className='h-4 w-4' />}
                />
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  required
                  error={errors.phone}
                  icon={<Phone className='h-4 w-4' />}
                />
              </div>

              {/* Create Login Account Checkbox */}
              <div className='mt-4'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    name='createLoginAccount'
                    checked={formData.createLoginAccount}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        createLoginAccount: e.target.checked,
                      }))
                    }
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2'
                  />
                  <span className='text-sm font-medium text-gray-700'>
                    Create Login Account
                  </span>
                </label>
                <p className='text-xs text-gray-500 mt-1'>
                  {formData.createLoginAccount
                    ? 'A user account will be created with a temporary password'
                    : 'Staff will not have access to the system'}
                </p>
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
                        <div
                          style={{
                            backgroundImage: `url(${imagePreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            width: '100%',
                            height: '100%',
                            borderRadius: '0.5rem',
                          }}
                          aria-label='Profile photo preview'
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
                  icon={<Calendar className='h-4 w-4' />}
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  placeholder='Select gender'
                />
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

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledSelect
                  label='Marital Status'
                  name='maritalStatus'
                  value={formData.maritalStatus || ''}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' },
                  ]}
                  placeholder='Select marital status'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <LabeledInput
                  label='Street'
                  name='street'
                  value={formData.street || ''}
                  onChange={handleInputChange}
                  placeholder='Enter street'
                  icon={<MapPin className='h-4 w-4' />}
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
                  icon={<Calendar className='h-4 w-4' />}
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
                  label='Qualification'
                  name='qualification'
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder='Enter qualification'
                  required
                  error={errors.qualification}
                  icon={<GraduationCap className='h-4 w-4' />}
                />
                <LabeledInput
                  label='Designation'
                  name='designation'
                  value={formData.designation || ''}
                  onChange={handleInputChange}
                  placeholder='Enter designation'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-1 gap-4 mt-4'>
                <LabeledSelect
                  label='Department'
                  name='department'
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  options={departmentOptions}
                  placeholder='Select department'
                />
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
