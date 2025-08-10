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
  Landmark,
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

  // Bank details
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;

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

  bankName: '',
  bankAccountNumber: '',
  bankBranch: '',
  panNumber: '',
  citizenshipNumber: '',

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

// Parent data structure
interface ParentData {
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  fatherOccupation: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  motherOccupation: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelation: string;
  primaryContact: 'father' | 'mother' | 'guardian';
}

const initialParentData: ParentData = {
  fatherName: '',
  fatherEmail: '',
  fatherPhone: '',
  fatherOccupation: '',
  motherName: '',
  motherEmail: '',
  motherPhone: '',
  motherOccupation: '',
  guardianName: '',
  guardianEmail: '',
  guardianPhone: '',
  guardianRelation: '',
  primaryContact: 'father',
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
  sections: Array<{ id: string; name: string }>;
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
  error?: string;
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
  error,
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
          className={`border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 ${Icon ? 'pl-10' : ''} ${className}`}
          autoComplete='off'
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
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
      className={`flex h-10 w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
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
  const [parentData, setParentData] = useState<ParentData>(initialParentData);
  const [parentOption, setParentOption] = useState<'new' | 'existing'>('new');
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<
    string | number | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Define a local ClassResponse type for the component
  interface ClassResponse {
    id: string;
    name?: string;
    sections?: Array<{ id: string; name: string }>;
    // Add other fields that might be in the API response
  }

  // Modify the BackendData type to use ClassResponse
  const [backendData, setBackendData] = useState<{
    subjects: SubjectItem[];
    classes: ClassItem[];
  }>({
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
          // Map the API response to match our expected types
          const mappedClasses: ClassItem[] = (classesRes.data || []).map(
            (cls: ClassResponse) => ({
              id: cls.id,
              name: cls.name || '',
              // Add sections with a default empty array
              sections: cls.sections || [],
            }),
          );

          setBackendData({
            subjects: subjectsRes.data || [],

            classes: mappedClasses,

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
    setParentData(initialParentData);
    setParentOption('new');
    setParentSearchTerm('');
    setParentSearchResults([]);
    setSelectedParentId(null);
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

  // Handle parent data changes
  const handleParentChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;
      setParentData(prev => ({ ...prev, [name]: value }));
      if (error) setError(null);
    },
    [error],
  );

  // Handle primary contact selection
  const handlePrimaryContactChange = useCallback(
    (contact: 'father' | 'mother' | 'guardian') => {
      setParentData(prev => ({ ...prev, primaryContact: contact }));
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
    if (!formData.firstName.trim()) return 'Please enter a first name';
    if (!formData.lastName.trim()) return 'Please enter a last name';
    if (!formData.email.trim()) return 'Please enter an email address';
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim()))
      return 'Please enter a valid email address';
    if (!formData.phone.trim()) return 'Please enter a phone number';

    // Validate PIN code if provided
    if (formData.pinCode && !/^\d{5,6}$/.test(formData.pinCode.trim()))
      return 'PIN/ZIP code should be 5-6 digits';

    if (userType === 'teacher') {
      if (!formData.subjects || formData.subjects.length === 0)
        return 'Please select at least one subject for the teacher';
      if (formData.isClassTeacher && (!formData.class || !formData.section))
        return 'Please select both class and section when assigning as class teacher';
    }


    if (userType === 'student') {
      if (!formData.class) return 'Please select a class for the student';
      if (!formData.section) return 'Please select a section for the student';
      if (!formData.rollNo?.trim())
        return 'Please enter a roll number for the student';

      // Parent validations
      if (parentOption === 'new') {
        if (
          !parentData.fatherName &&
          !parentData.motherName &&
          !parentData.guardianName
        ) {
          return 'Please provide at least one parent or guardian information';
        }

        // Primary contact validations
        if (parentData.primaryContact === 'father' && !parentData.fatherName) {
          return 'Father is selected as primary contact but name is missing';
        }

        if (parentData.primaryContact === 'mother' && !parentData.motherName) {
          return 'Mother is selected as primary contact but name is missing';
        }

        if (
          parentData.primaryContact === 'guardian' &&
          !parentData.guardianName
        ) {
          return 'Guardian is selected as primary contact but name is missing';
        }
      } else if (!selectedParentId) {
        return 'Please select an existing parent from the list';
      }
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
  }, [formData, userType, parentOption, parentData, selectedParentId]);

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
        // Clear previous field errors
        setFieldErrors({});

        // Extract error message and make it user-friendly
        let apiMsg = err?.message || `Failed to add ${userType}`;

        // Check for validation errors from our enhanced API error format
        if (
          err?.validationErrors &&
          Object.keys(err.validationErrors).length > 0
        ) {
          // Set field-specific errors
          setFieldErrors(err.validationErrors);

          // Create a user-friendly error message
          apiMsg = 'Please fix the highlighted fields to continue.';
        }
        // Handle traditional error response formats
        else {
          const responseErrors =
            err?.response?.data?.errors || err?.response?.data?.message;

          // Make error messages more user-friendly
          if (
            apiMsg.includes('duplicate key') ||
            apiMsg.includes('already exists')
          ) {
            if (apiMsg.includes('email')) {
              apiMsg =
                'This email address is already registered in the system. Please use a different email.';
              setFieldErrors({ email: 'Email already in use' });
            } else if (apiMsg.includes('phone')) {
              apiMsg =
                'This phone number is already registered in the system. Please use a different number.';
              setFieldErrors({ phone: 'Phone number already in use' });
            } else if (
              apiMsg.includes('employeeId') ||
              apiMsg.includes('studentId')
            ) {
              apiMsg = 'This ID is already in use. Please use a different ID.';
              setFieldErrors({ employeeId: 'ID already in use' });
            } else {
              apiMsg =
                'This record already exists in the system. Please check the details and try again.';
            }
          } else if (apiMsg.includes('validation')) {
            apiMsg =
              'Some information is missing or incorrect. Please check all required fields.';

            // If we have detailed validation errors, show them in a user-friendly way
            if (Array.isArray(responseErrors)) {
              const errors: string[] = [];
              const fieldErrorsMap: Record<string, string> = {};

              responseErrors.forEach((e: any) => {
                // Extract field and message
                const field = e.field || e.path || e.property || '';
                const message = e.message || 'Invalid value';

                // Add to field errors for highlighting
                if (field) {
                  fieldErrorsMap[field] = message;
                }

                // Convert technical field names to user-friendly names
                const friendlyField = field
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str: string) => str.toUpperCase())
                  .trim();

                errors.push(
                  friendlyField ? `${friendlyField}: ${message}` : message,
                );
              });

              // Set field errors for highlighting
              if (Object.keys(fieldErrorsMap).length > 0) {
                setFieldErrors(fieldErrorsMap);
              }

              if (errors.length > 0) {
                apiMsg = `Please fix the following issues:\n• ${errors.join('\n• ')}`;
              }
            }
          } else if (apiMsg.includes('server') || apiMsg.includes('500')) {
            apiMsg =
              'Sorry, we encountered a problem on our end. Please try again later.';
          }
        }

        toast.error(`Unable to add ${userType}`, {
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
                    <div
                      style={{
                        backgroundImage: `url(${photoPreview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '100%',
                        height: '100%',
                      }}
                      aria-label='Profile Preview'
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
                  error={fieldErrors.firstName}
                />
                <LabeledInput
                  label='Middle Name'
                  name='middleName'
                  value={formData.middleName || ''}
                  onChange={handleInputChange}
                  placeholder='Enter middle name (optional)'
                  icon={User}
                  error={fieldErrors.middleName}
                />
                <LabeledInput
                  label='Last Name'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter last name'
                  icon={User}
                  error={fieldErrors.lastName}
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
                  error={fieldErrors.email}
                />
                <LabeledInput
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter phone number'
                  icon={Phone}
                  error={fieldErrors.phone}
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
                {userType !== 'student' && (
                  <LabeledSelect
                    label='Marital Status'
                    name='maritalStatus'
                    value={formData.maritalStatus || ''}
                    onChange={handleInputChange}
                    options={MARITAL_STATUS}
                    placeholder='Select marital status'
                  />
                )}
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

            {/* Bank and Legal Details */}
            {(userType === 'teacher' || userType === 'staff') && (
              <FormSection
                title='Bank & Legal Information'
                icon={Landmark}
                bg='blue'
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <LabeledInput
                    label='Bank Name'
                    name='bankName'
                    value={formData.bankName || ''}
                    onChange={handleInputChange}
                    placeholder='Enter bank name'
                  />
                  <LabeledInput
                    label='Bank Account Number'
                    name='bankAccountNumber'
                    value={formData.bankAccountNumber || ''}
                    onChange={handleInputChange}
                    placeholder='Enter account number'
                  />
                  <LabeledInput
                    label='Bank Branch'
                    name='bankBranch'
                    value={formData.bankBranch || ''}
                    onChange={handleInputChange}
                    placeholder='Enter branch name'
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
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Class
                    </label>
                    <select
                      name='class'
                      value={formData.class || ''}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                    >
                      <option value=''>Select class</option>
                      {backendData.classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Section
                    </label>
                    <select
                      name='section'
                      value={formData.section || ''}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
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
                  <div className='md:col-span-2'>
                    <div className='mb-4'>
                      <div className='flex justify-between items-center mb-2'>
                        <label className='text-sm font-medium leading-none'>
                          Parent/Guardian Information
                        </label>
                        <div className='flex space-x-4'>
                          <label className='flex items-center'>
                            <input
                              type='radio'
                              name='parentOption'
                              value='new'
                              checked={parentOption === 'new'}
                              onChange={() => setParentOption('new')}
                              className='mr-2'
                            />
                            <span className='text-sm'>Add New</span>
                          </label>
                          <label className='flex items-center'>
                            <input
                              type='radio'
                              name='parentOption'
                              value='existing'
                              checked={parentOption === 'existing'}
                              onChange={() => setParentOption('existing')}
                              className='mr-2'
                            />
                            <span className='text-sm'>Select Existing</span>
                          </label>
                        </div>
                      </div>

                      {parentOption === 'new' ? (
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <LabeledInput
                              label="Father's Name"
                              name='fatherName'
                              value={parentData.fatherName || ''}
                              onChange={handleParentChange}
                              placeholder='Enter father name'
                            />
                            <LabeledInput
                              label="Father's Email"
                              name='fatherEmail'
                              type='email'
                              value={parentData.fatherEmail || ''}
                              onChange={handleParentChange}
                              placeholder='Enter father email'
                            />
                            <LabeledInput
                              label="Father's Phone"
                              name='fatherPhone'
                              value={parentData.fatherPhone || ''}
                              onChange={handleParentChange}
                              placeholder='Enter father phone'
                            />
                            <LabeledInput
                              label="Father's Occupation"
                              name='fatherOccupation'
                              value={parentData.fatherOccupation || ''}
                              onChange={handleParentChange}
                              placeholder='Enter father occupation (optional)'
                            />
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <LabeledInput
                              label="Mother's Name"
                              name='motherName'
                              value={parentData.motherName || ''}
                              onChange={handleParentChange}
                              placeholder='Enter mother name'
                            />
                            <LabeledInput
                              label="Mother's Email"
                              name='motherEmail'
                              type='email'
                              value={parentData.motherEmail || ''}
                              onChange={handleParentChange}
                              placeholder='Enter mother email'
                            />
                            <LabeledInput
                              label="Mother's Phone"
                              name='motherPhone'
                              value={parentData.motherPhone || ''}
                              onChange={handleParentChange}
                              placeholder='Enter mother phone'
                            />
                            <LabeledInput
                              label="Mother's Occupation"
                              name='motherOccupation'
                              value={parentData.motherOccupation || ''}
                              onChange={handleParentChange}
                              placeholder='Enter mother occupation (optional)'
                            />
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <LabeledSelect
                              label='Guardian Relation'
                              name='guardianRelation'
                              value={parentData.guardianRelation || ''}
                              onChange={handleParentChange}
                              options={RELATIONS}
                              placeholder='Select relation'
                            />
                            <LabeledInput
                              label="Guardian's Name"
                              name='guardianName'
                              value={parentData.guardianName || ''}
                              onChange={handleParentChange}
                              placeholder='Enter guardian name (if different)'
                            />
                            <LabeledInput
                              label="Guardian's Email"
                              name='guardianEmail'
                              type='email'
                              value={parentData.guardianEmail || ''}
                              onChange={handleParentChange}
                              placeholder='Enter guardian email'
                            />
                          </div>

                          <div className='mt-4'>
                            <p className='text-sm font-medium mb-2'>
                              Primary Contact
                            </p>
                            <div className='flex flex-wrap gap-4'>
                              <label className='flex items-center'>
                                <input
                                  type='radio'
                                  name='primaryContact'
                                  value='father'
                                  checked={
                                    parentData.primaryContact === 'father'
                                  }
                                  onChange={() =>
                                    handlePrimaryContactChange('father')
                                  }
                                  className='mr-2'
                                />
                                <span className='text-sm'>Father</span>
                              </label>
                              <label className='flex items-center'>
                                <input
                                  type='radio'
                                  name='primaryContact'
                                  value='mother'
                                  checked={
                                    parentData.primaryContact === 'mother'
                                  }
                                  onChange={() =>
                                    handlePrimaryContactChange('mother')
                                  }
                                  className='mr-2'
                                />
                                <span className='text-sm'>Mother</span>
                              </label>
                              <label className='flex items-center'>
                                <input
                                  type='radio'
                                  name='primaryContact'
                                  value='guardian'
                                  checked={
                                    parentData.primaryContact === 'guardian'
                                  }
                                  onChange={() =>
                                    handlePrimaryContactChange('guardian')
                                  }
                                  className='mr-2'
                                />
                                <span className='text-sm'>Guardian</span>
                              </label>
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                              The primary contact will be used for login
                              credentials and important communications
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          <div className='relative'>
                            <input
                              type='text'
                              placeholder='Search parents by name, email, or phone...'
                              className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                              value={parentSearchTerm}
                              onChange={e =>
                                setParentSearchTerm(e.target.value)
                              }
                            />
                            <div className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                              <svg
                                className='h-4 w-4 text-gray-400'
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              >
                                <circle cx='11' cy='11' r='8'></circle>
                                <line
                                  x1='21'
                                  y1='21'
                                  x2='16.65'
                                  y2='16.65'
                                ></line>
                              </svg>
                            </div>
                          </div>

                          <div className='max-h-60 overflow-y-auto border border-gray-200 rounded-md'>
                            {parentSearchResults.length > 0 ? (
                              <div className='divide-y divide-gray-200'>
                                {parentSearchResults.map(parent => (
                                  <div
                                    key={parent.id}
                                    className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                      selectedParentId === parent.id
                                        ? 'bg-blue-50'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      setSelectedParentId(parent.id)
                                    }
                                  >
                                    <div className='font-medium'>
                                      {parent.name}
                                    </div>
                                    <div className='text-sm text-gray-500'>
                                      {parent.email} • {parent.phone}
                                    </div>
                                    <div className='text-xs text-gray-400'>
                                      {parent.relation} •{' '}
                                      {parent.children?.length || 0} children
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : parentSearchTerm ? (
                              <div className='p-4 text-center text-gray-500'>
                                No parents found matching "{parentSearchTerm}"
                              </div>
                            ) : (
                              <div className='p-4 text-center text-gray-500'>
                                Type to search for existing parents
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                      {userType === 'student'
                        ? 'Previous Academic Achievements'
                        : 'Previous Experience'}
                    </label>
                    <textarea
                      name='previousExperience'
                      value={formData.previousExperience || ''}
                      onChange={handleInputChange}
                      placeholder={
                        userType === 'student'
                          ? 'Brief description of previous academic achievements'
                          : 'Brief description of previous teaching/work experience'
                      }
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
