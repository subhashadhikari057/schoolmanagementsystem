'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Plus,
  User,
  BookOpen,
  Users,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Camera,
  DollarSign,
  Upload,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { teacherService } from '@/api/services/teacher.service';
import { subjectService } from '@/api/services/subject.service';
import { classService } from '@/api/services/class.service';
import { staffService } from '@/api/services/staff.service';

/**
 * NOTE:
 * - No external UI components used (buttons/inputs are local).
 * - Tailwind classes are NOT built from dynamic strings (JIT-safe).
 * - Stable handlers, safe outside-click close, ESC to close, body scroll lock.
 * - Same UX + sections as your original.
 */

export type UserType = 'teacher' | 'parent' | 'staff' | 'student';

interface AddUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userType: UserType;
}

interface FormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  address: string;
  photo?: File | null;

  employeeId?: string;
  joiningDate?: string;
  experience?: string;
  highestQualification?: string;
  specialization?: string;
  designation?: string;
  department?: string;

  subjects?: string[];
  isClassTeacher?: boolean;

  basicSalary?: string;
  allowances?: string;
  totalSalary?: string;

  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;

  occupation?: string;
  relation?: string;

  studentId?: string;
  class?: string;
  section?: string;
  rollNo?: string;
  parentName?: string;
}

const initialFormData: FormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  address: '',
  photo: null,

  employeeId: '',
  joiningDate: '',
  experience: '',
  highestQualification: '',
  specialization: '',
  designation: '',
  department: '',

  subjects: [],
  isClassTeacher: false,

  basicSalary: '',
  allowances: '',
  totalSalary: '',

  languagesKnown: [],
  certifications: '',
  previousExperience: '',

  occupation: '',
  relation: '',

  studentId: '',
  class: '',
  section: '',
  rollNo: '',
  parentName: '',
};

const LANGUAGES = [
  'English',
  'Hindi',
  'Sanskrit',
  'Spanish',
  'French',
  'German',
];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const RELATIONS = [
  'Father',
  'Mother',
  'Guardian',
  'Uncle',
  'Aunt',
  'Grandparent',
];

type SubjectItem = { id: string; name: string; code: string };
type ClassItem = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

interface BackendData {
  subjects: SubjectItem[];
  classes: ClassItem[];
}

// Local Button component (no external UI lib)
const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'solid' | 'outline';
    leftIcon?: React.ReactNode;
    loading?: boolean;
  }
> = ({
  variant = 'solid',
  className = '',
  leftIcon,
  loading,
  children,
  ...rest
}) => {
  const base =
    'px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const solid = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
  const outline =
    'border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 focus:ring-gray-400';
  const style = variant === 'solid' ? solid : outline;

  return (
    <button
      {...rest}
      className={`${base} ${style} ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={loading || rest.disabled}
    >
      <span className='inline-flex items-center gap-2'>
        {leftIcon ? <span className='inline-flex'>{leftIcon}</span> : null}
        {loading ? 'Please wait…' : children}
      </span>
    </button>
  );
};

// Local Input (label + input)
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  icon: Icon,
  onBlur,
  disabled,
  className = '',
}) => {
  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        {Icon && (
          <Icon
            size={16}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          />
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 ${Icon ? 'pl-10' : ''} ${className}`}
          autoComplete='off'
        />
      </div>
    </div>
  );
};

// Local Select (label + select)
const LabeledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required,
  disabled,
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
      className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
    >
      <option value=''>{placeholder}</option>
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// Section wrapper with icon + header
const FormSection: React.FC<{
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg?: 'gray' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  children: React.ReactNode;
}> = ({ title, icon: Icon, bg = 'gray', children }) => {
  const bgMap: Record<string, string> = {
    gray: 'bg-gradient-to-br from-gray-50 to-white',
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50',
    yellow: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    purple: 'bg-gradient-to-br from-purple-50 to-violet-50',
    orange: 'bg-gradient-to-br from-orange-50 to-red-50',
  };
  return (
    <div
      className={`${bgMap[bg]} rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
        <Icon size={20} className='mr-3 text-blue-600' />
        {title}
      </h3>
      {children}
    </div>
  );
};

const HEADER_STYLES: Record<
  UserType,
  {
    title: string;
    subtitle: string;
    icon: any;
    headerCard: string;
    headerBadge: string;
    gradientBlock: string;
  }
> = {
  teacher: {
    title: 'Add New Teacher',
    subtitle: 'Enter teacher information and professional details',
    icon: GraduationCap,
    headerCard: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    headerBadge: 'text-blue-600',
    gradientBlock: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  },
  parent: {
    title: 'Add New Parent',
    subtitle: 'Enter parent information and contact details',
    icon: Users,
    headerCard: 'bg-gradient-to-br from-green-500 to-emerald-600',
    headerBadge: 'text-green-600',
    gradientBlock: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
  },
  staff: {
    title: 'Add New Staff',
    subtitle: 'Enter staff member information and role details',
    icon: Briefcase,
    headerCard: 'bg-gradient-to-br from-purple-500 to-violet-600',
    headerBadge: 'text-purple-600',
    gradientBlock:
      'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50',
  },
  student: {
    title: 'Add New Student',
    subtitle: 'Enter student information and academic details',
    icon: User,
    headerCard: 'bg-gradient-to-br from-orange-500 to-red-600',
    headerBadge: 'text-orange-600',
    gradientBlock: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
  },
};

export default function AddUserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userType,
}: AddUserFormModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [backendData, setBackendData] = useState<BackendData>({
    subjects: [],
    classes: [],
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  const cfg = useMemo(() => HEADER_STYLES[userType], [userType]);
  const IconComponent = cfg.icon;

  // Load backend data (subjects/classes) for teachers
  useEffect(() => {
    const load = async () => {
      if (!isOpen || userType !== 'teacher') return;
      setIsLoadingData(true);
      try {
        const [subjectsRes, classesRes] = await Promise.all([
          subjectService.getAllSubjects(),
          classService.getAllClasses(),
        ]);
        if (subjectsRes?.success && classesRes?.success) {
          setBackendData({
            subjects: subjectsRes.data || [],
            classes: (classesRes.data || []).map((cls: any) => ({
              ...cls,
              sections: cls.sections || [],
            })),
          });
        } else {
          toast.error('Failed to load form data', {
            description:
              'Unable to load subjects and classes. Please refresh and try again.',
          });
        }
      } catch (e) {
        toast.error('Failed to load form data', {
          description:
            'Unable to load subjects and classes. Please refresh and try again.',
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    load();
  }, [isOpen, userType]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setPhotoPreview(null);
    setError(null);
  }, []);

  const onBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !isLoading) onClose();
    },
    [isLoading, onClose],
  );

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? target.checked : value,
      }));
      if (error) setError(null);
    },
    [error],
  );

  const handleMultiSelectChange = useCallback(
    (name: keyof FormData, value: string) => {
      setFormData(prev => {
        const arr = (prev[name] as string[]) || [];
        const next = arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value];
        return { ...prev, [name]: next };
      });
    },
    [],
  );

  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size too large', {
          description: 'Please select a file smaller than 5MB',
        });
        return;
      }
      setFormData(p => ({ ...p, photo: file }));
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const calculateTotalSalary = useCallback(() => {
    setFormData(prev => {
      const basic = parseFloat(prev.basicSalary || '0') || 0;
      const allowances = parseFloat(prev.allowances || '0') || 0;
      const total = basic + allowances;
      return { ...prev, totalSalary: String(total) };
    });
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!formData.firstName.trim() || !formData.lastName.trim())
      return 'First name and last name are required';
    if (!formData.email.trim() || !formData.phone.trim())
      return 'Email and phone number are required';

    // Validate PIN code if provided
    if (formData.pinCode && !/^\d{4}$/.test(formData.pinCode.trim()))
      return 'PIN code must be a 4-digit number';

    if (userType === 'teacher') {
      if (!formData.subjects || formData.subjects.length === 0)
        return 'Please select at least one subject for the teacher';
      if (formData.isClassTeacher && (!formData.class || !formData.section))
        return 'Please select both class and section when assigning as class teacher';
    }

    if (userType === 'staff') {
      // Department and designation are now optional
      if (
        !formData.highestQualification ||
        formData.highestQualification.trim() === ''
      )
        return 'Please provide highest qualification for the staff member';
    }
    return null;
  }, [formData, userType]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const v = validateForm();
      if (v) {
        setError(v);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        let response: any;
        switch (userType) {
          case 'teacher': {
            // If you need to send multipart/form-data (due to photo), build FormData here.
            // For now we send raw formData expecting your service to handle it.
            response = await teacherService.createTeacher(formData);
            break;
          }
          case 'staff': {
            // Map formData to backend DTO
            const staffPayload = {
              user: {
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                phone: formData.phone,
                // password: (optional, not collected in form)
              },
              profile: {
                qualification: formData.highestQualification || '',
                designation: formData.designation || '',
                department: formData.department as any,
                experienceYears: formData.experience
                  ? parseInt(formData.experience)
                  : undefined,
                employmentDate: formData.joiningDate || '',
                salary: formData.basicSalary
                  ? parseFloat(formData.basicSalary)
                  : undefined,
                bio: formData.previousExperience || '',
                emergencyContact: undefined, // Not collected in form
                address: {
                  street: formData.street || '',
                  city: formData.city || '',
                  state: formData.state || '',
                  zipCode: formData.pinCode || '',
                  country: '',
                },
                socialLinks: undefined, // Not collected in form
                profilePhotoUrl: undefined, // Not sent
              },
            };
            response = await staffService.createStaff(staffPayload);
            break;
          }
          case 'parent':
          case 'student':
            throw new Error(`${userType} creation not yet implemented`);
          default:
            throw new Error('Invalid user type');
        }

        if (response?.success) {
          toast.success(`${cfg.title.split(' ')[2]} Added Successfully`, {
            description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
            duration: 4000,
          });

          if (response.data?.temporaryPassword) {
            toast.info('Temporary Password Generated', {
              description: `Temporary password: ${response.data.temporaryPassword}`,
              duration: 10000,
            });
          }

          onSuccess();
          onClose();
          resetForm();
        } else {
          throw new Error(response?.message || `Failed to add ${userType}`);
        }
      } catch (err: any) {
        const apiMsg =
          err?.response?.data?.message ||
          (Array.isArray(err?.response?.data?.errors)
            ? `Validation failed: ${err.response.data.errors.map((e: any) => e.message).join(', ')}`
            : err?.message) ||
          `Failed to add ${userType}. Please try again.`;

        toast.error(`Failed to add ${userType}`, {
          description: apiMsg,
          duration: 6000,
        });
        setError(apiMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [
      cfg.title,
      formData,
      onClose,
      onSuccess,
      resetForm,
      userType,
      validateForm,
    ],
  );

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto'
      onMouseDown={onBackdropClick}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl animate-in slide-in-from-bottom-4'
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`relative overflow-hidden rounded-t-2xl ${cfg.gradientBlock} p-6 border-b border-gray-100`}
        >
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl' />
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl' />
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className={`p-2 ${cfg.headerCard} rounded-xl shadow-lg`}>
                <IconComponent size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>{cfg.title}</h2>
                <p className='text-sm text-gray-600 mt-1'>{cfg.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => !isLoading && onClose()}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 max-h-[calc(90vh-8rem)] overflow-y-auto'>
          <form
            onSubmit={handleSubmit}
            className='space-y-8'
            autoComplete='off'
          >
            {/* Photo */}
            <div className='flex items-center justify-center mb-2'>
              <div className='relative group'>
                <div className='w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-lg'>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt='Profile Preview'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='text-gray-400 text-center transition-colors duration-300 group-hover:text-blue-500'>
                      <Camera size={28} className='mx-auto mb-2' />
                      <span className='text-xs font-medium'>
                        Professional Photo
                      </span>
                    </div>
                  )}
                </div>
                <label className='absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl'>
                  <Upload size={14} />
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handlePhotoChange}
                    className='hidden'
                  />
                </label>
              </div>
            </div>
            <div className='text-center mb-8'>
              <span className={`text-xs font-semibold ${cfg.headerBadge}`}>
                Choose Photo
              </span>
              <p className='text-xs text-gray-500 mt-1'>
                Max 5MB • JPG, PNG, WEBP
              </p>
            </div>

            {/* Personal Info */}
            <FormSection title='Personal Information' icon={User} bg='gray'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <LabeledInput
                  label='First Name'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter first name'
                  icon={User}
                />
                <LabeledInput
                  label='Middle Name'
                  name='middleName'
                  value={formData.middleName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter middle name (optional)'
                  icon={User}
                />
                <LabeledInput
                  label='Last Name'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter last name'
                  icon={User}
                />
                <LabeledInput
                  label='Email Address'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter email address'
                  icon={Mail}
                />
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter phone number'
                  icon={Phone}
                />
                <LabeledInput
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  placeholder=''
                  icon={Calendar}
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={GENDERS}
                  placeholder='Select gender'
                />
                <LabeledSelect
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  options={BLOOD_GROUPS}
                  placeholder='Select blood group'
                />
                <LabeledSelect
                  label='Marital Status'
                  name='maritalStatus'
                  value={formData.maritalStatus || ''}
                  onChange={handleInputChange}
                  options={MARITAL_STATUS}
                  placeholder='Select marital status'
                />
                <div className='md:col-span-3'>
                  <h4 className='text-sm font-medium mb-3 text-gray-700'>
                    Address Details
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='md:col-span-2'>
                      <LabeledInput
                        label='Street Address'
                        name='street'
                        value={formData.street || ''}
                        onChange={handleInputChange}
                        placeholder='Street address, house/apartment number'
                      />
                    </div>
                    <LabeledInput
                      label='City'
                      name='city'
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      placeholder='City'
                    />
                    <LabeledInput
                      label='State/Province'
                      name='state'
                      value={formData.state || ''}
                      onChange={handleInputChange}
                      placeholder='State or province'
                    />
                    <LabeledInput
                      label='PIN/ZIP Code'
                      name='pinCode'
                      value={formData.pinCode || ''}
                      onChange={handleInputChange}
                      placeholder='PIN or ZIP code'
                    />
                    {/* <div className='md:col-span-2'>
                      <label className='text-sm font-medium leading-none mb-2 block'>
                        Full Address (Legacy)
                      </label>
                      <textarea
                        name='address'
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder='Enter complete address (for backward compatibility)'
                        rows={2}
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none'
                      />
                    </div> */}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Professional Info */}
            {(userType === 'teacher' || userType === 'staff') && (
              <FormSection
                title='Professional Information'
                icon={Briefcase}
                bg='blue'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <LabeledInput
                    label='Employee ID'
                    name='employeeId'
                    value={formData.employeeId || ''}
                    onChange={handleInputChange}
                    placeholder='Auto-generated or enter ID'
                  />
                  <LabeledInput
                    label='Joining Date'
                    name='joiningDate'
                    type='date'
                    value={formData.joiningDate || ''}
                    onChange={handleInputChange}
                  />
                  <LabeledInput
                    label={`Experience (${userType === 'teacher' ? 'Teaching' : 'Total'})`}
                    name='experience'
                    value={formData.experience || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., 5 years'
                  />
                  <LabeledInput
                    label='Highest Qualification'
                    name='highestQualification'
                    value={formData.highestQualification || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., M.Sc. Mathematics, B.E.'
                  />
                  <LabeledInput
                    label='Designation'
                    name='designation'
                    type='text'
                    value={formData.designation || ''}
                    onChange={handleInputChange}
                    placeholder='Enter designation (e.g., Administrative Officer, Finance Manager)'
                  />
                  <LabeledInput
                    label='Department'
                    name='department'
                    type='text'
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    placeholder='Enter department (e.g., Administration, Finance, HR)'
                  />
                </div>
              </FormSection>
            )}

            {/* Subject Assignment */}
            {userType === 'teacher' && (
              <FormSection
                title='Subject Assignment'
                icon={BookOpen}
                bg='green'
              >
                <div className='space-y-6'>
                  <div>
                    <label className='text-sm font-medium leading-none mb-3 block'>
                      Subjects <span className='text-red-500'>*</span>
                    </label>
                    {isLoadingData ? (
                      <div className='text-center py-4'>
                        <span className='text-sm text-gray-500'>
                          Loading subjects...
                        </span>
                      </div>
                    ) : backendData.subjects.length === 0 ? (
                      <div className='text-center py-4'>
                        <span className='text-sm text-gray-500'>
                          No subjects available. Please contact admin.
                        </span>
                      </div>
                    ) : (
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                        {backendData.subjects.map(subject => (
                          <label
                            key={subject.id}
                            className='flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/70 transition-colors duration-200'
                          >
                            <input
                              type='checkbox'
                              checked={
                                formData.subjects?.includes(subject.id) || false
                              }
                              onChange={() =>
                                handleMultiSelectChange('subjects', subject.id)
                              }
                              className='rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2'
                            />
                            <span className='text-sm font-medium text-gray-700'>
                              {subject.name}
                              <span className='text-xs text-gray-500 block'>
                                {subject.code}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='pt-4 border-t border-green-200'>
                    <label className='flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200'>
                      <input
                        type='checkbox'
                        name='isClassTeacher'
                        checked={formData.isClassTeacher || false}
                        onChange={handleInputChange}
                        className='rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2'
                      />
                      <div>
                        <span className='text-sm font-semibold text-gray-900'>
                          Assign as Class Teacher
                        </span>
                        <p className='text-xs text-gray-600 mt-1'>
                          This teacher will be responsible for a specific class
                        </p>
                      </div>
                    </label>

                    {formData.isClassTeacher && (
                      <div className='mt-4 p-4 bg-green-50 rounded-lg border border-green-200'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='text-sm font-medium leading-none mb-2 block'>
                              Class <span className='text-red-500'>*</span>
                            </label>
                            <select
                              name='class'
                              value={formData.class || ''}
                              onChange={handleInputChange}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                            >
                              <option value=''>Select class</option>
                              {backendData.classes.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='text-sm font-medium leading-none mb-2 block'>
                              Section <span className='text-red-500'>*</span>
                            </label>
                            <select
                              name='section'
                              value={formData.section || ''}
                              onChange={handleInputChange}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                              disabled={!formData.class}
                            >
                              <option value=''>Select section</option>
                              {formData.class &&
                                backendData.classes
                                  .find(c => c.id === formData.class)
                                  ?.sections.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                            </select>
                          </div>
                        </div>
                        <p className='text-xs text-green-700 mt-2'>
                          Select the class and section this teacher will be
                          responsible for.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </FormSection>
            )}

            {/* Salary */}
            {(userType === 'teacher' || userType === 'staff') && (
              <FormSection
                title='Salary Information'
                icon={DollarSign}
                bg='yellow'
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <LabeledInput
                    label='Basic Salary'
                    name='basicSalary'
                    type='number'
                    value={formData.basicSalary || ''}
                    onChange={handleInputChange}
                    onBlur={calculateTotalSalary}
                    placeholder='Enter basic salary'
                  />
                  <LabeledInput
                    label='Allowances'
                    name='allowances'
                    type='number'
                    value={formData.allowances || ''}
                    onChange={handleInputChange}
                    onBlur={calculateTotalSalary}
                    placeholder='Enter allowances'
                  />
                  <LabeledInput
                    label='Total Salary'
                    name='totalSalary'
                    type='number'
                    value={formData.totalSalary || ''}
                    onChange={handleInputChange}
                    placeholder='Calculated automatically'
                    className='bg-amber-50 font-semibold'
                  />
                </div>
                <div className='mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200'>
                  <p className='text-xs text-yellow-800'>
                    <strong>Note:</strong> Total salary is calculated
                    automatically when you enter basic salary and allowances.
                  </p>
                </div>
              </FormSection>
            )}

            {/* Parent */}
            {userType === 'parent' && (
              <FormSection title='Parent Information' icon={Users} bg='purple'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <LabeledInput
                    label='Occupation'
                    name='occupation'
                    value={formData.occupation || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., Software Engineer, Doctor'
                  />
                  <LabeledSelect
                    label='Relation'
                    name='relation'
                    value={formData.relation || ''}
                    onChange={handleInputChange as any}
                    options={RELATIONS}
                    placeholder='Select relation'
                  />
                </div>
              </FormSection>
            )}

            {/* Student */}
            {userType === 'student' && (
              <FormSection
                title='Academic Information'
                icon={GraduationCap}
                bg='orange'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <LabeledInput
                    label='Student ID'
                    name='studentId'
                    value={formData.studentId || ''}
                    onChange={handleInputChange}
                    placeholder='Auto-generated or enter ID'
                  />
                  <LabeledInput
                    label='Roll Number'
                    name='rollNo'
                    value={formData.rollNo || ''}
                    onChange={handleInputChange}
                    placeholder='Enter roll number'
                  />
                  <LabeledInput
                    label='Class'
                    name='class'
                    value={formData.class || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., Grade 10'
                  />
                  <LabeledInput
                    label='Section'
                    name='section'
                    value={formData.section || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., A, B, C'
                  />
                  <div className='md:col-span-2'>
                    <LabeledInput
                      label='Parent/Guardian Name'
                      name='parentName'
                      value={formData.parentName || ''}
                      onChange={handleInputChange}
                      placeholder='Enter parent name'
                    />
                  </div>
                </div>
              </FormSection>
            )}

            {/* Additional */}
            <FormSection title='Additional Information' icon={Plus} bg='gray'>
              <div className='space-y-6'>
                <div>
                  <label className='text-sm font-medium leading-none mb-3 block'>
                    Languages Known
                  </label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {LANGUAGES.map(language => (
                      <label
                        key={language}
                        className='flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200'
                      >
                        <input
                          type='checkbox'
                          checked={
                            formData.languagesKnown?.includes(language) || false
                          }
                          onChange={() =>
                            handleMultiSelectChange('languagesKnown', language)
                          }
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2'
                        />
                        <span className='text-sm font-medium text-gray-700'>
                          {language}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Certifications & Awards
                    </label>
                    <textarea
                      name='certifications'
                      value={formData.certifications || ''}
                      onChange={handleInputChange}
                      placeholder='List any additional certifications, awards or achievements'
                      rows={4}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Previous Experience
                    </label>
                    <textarea
                      name='previousExperience'
                      value={formData.previousExperience || ''}
                      onChange={handleInputChange}
                      placeholder='Brief description of previous teaching/work experience'
                      rows={4}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none'
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Errors */}
            {error && (
              <div className='bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm'>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2' />
                  <div>
                    <p className='text-red-800 text-sm font-semibold'>
                      Validation Error
                    </p>
                    <p className='text-red-700 text-sm mt-1'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex items-center justify-between pt-8 border-t border-gray-200'>
              <div className='text-sm text-gray-500'>
                All fields marked with <span className='text-red-500'>*</span>{' '}
                are required
              </div>
              <div className='flex items-center gap-3'>
                <Btn
                  type='button'
                  variant='outline'
                  onClick={() => !isLoading && onClose()}
                  disabled={isLoading}
                >
                  Cancel
                </Btn>
                <Btn
                  type='button'
                  variant='outline'
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Reset Form
                </Btn>
                <Btn
                  type='submit'
                  leftIcon={<Plus size={16} />}
                  loading={isLoading}
                  className='shadow-lg hover:shadow-xl'
                >
                  {isLoading
                    ? `Creating ${cfg.title.split(' ')[2]}...`
                    : `Create ${cfg.title.split(' ')[2]} Record`}
                </Btn>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
