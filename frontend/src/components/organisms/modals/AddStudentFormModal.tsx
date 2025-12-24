'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Users,
  BookOpen,
  Mail,
  Camera,
  Plus,
  UserPlus,
  Heart,
  Shield,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { classService } from '@/api/services/class.service';
import { studentService } from '@/api/services/student.service';
import EthnicitySelect from '@/components/molecules/form/EthnicitySelect';
import ParentSearchSelect from '@/components/molecules/form/ParentSearchSelect';
import {
  DISABILITY_TYPE_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
} from '@/constants/studentEnums';

interface AddStudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GuardianInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  relation: string;
  createUserAccount: boolean;
  occupation?: string;
}

interface ParentAccountInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createUserAccount: boolean;
  occupation?: string;
}

interface ExistingParentInfo {
  parentId: string;
  relationship: string;
  isPrimary: boolean;
}

interface StudentFormData {
  // User Information
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;

  // Personal Information
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  ethnicity?: string;
  motherTongue?: string;
  disabilityType?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Academic Information
  classId: string;
  rollNumber?: string; // Auto-generated
  admissionDate: string;
  studentId?: string;
  academicStatus?: string;
  transportMode?: string;

  // Parent Information (basic info stored in student record)
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  fatherPhone?: string;
  fatherEmail: string;
  fatherOccupation?: string;

  motherFirstName: string;
  motherMiddleName?: string;
  motherLastName: string;
  motherPhone?: string;
  motherEmail: string;
  motherOccupation?: string;

  // Parent User Accounts to Create
  parents: ParentAccountInfo[];

  // Existing Parents to Link
  existingParents: ExistingParentInfo[];

  // Parent Selection Mode
  parentSelectionMode: 'create' | 'existing';

  // Additional Guardians (non-user accounts)
  guardians: GuardianInfo[];

  // Medical Information
  medicalConditions?: string;
  allergies?: string;

  // Additional Information
  interests?: string;
  specialNeeds?: string;
  bio?: string;

  // Emergency Contact
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  // Profile Photo
  photo?: File | null;
}

const initialFormData: StudentFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  ethnicity: '',
  motherTongue: '',
  disabilityType: '',
  address: '',
  street: '',
  city: '',
  state: '',
  pinCode: '',
  classId: '',
  rollNumber: '',
  admissionDate: '',
  studentId: '',
  academicStatus: 'active',
  transportMode: '',
  fatherFirstName: '',
  fatherMiddleName: '',
  fatherLastName: '',
  fatherPhone: '',
  fatherEmail: '',
  fatherOccupation: '',
  motherFirstName: '',
  motherMiddleName: '',
  motherLastName: '',
  motherPhone: '',
  motherEmail: '',
  motherOccupation: '',
  parents: [],
  existingParents: [],
  parentSelectionMode: 'create',
  guardians: [],
  medicalConditions: '',
  allergies: '',
  interests: '',
  specialNeeds: '',
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
  options: Array<{ value: string; label: string }> | string[];
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
      {options.map((option, index) => {
        if (typeof option === 'string') {
          return (
            <option key={index} value={option}>
              {option}
            </option>
          );
        }
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
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

  // Auto-generation states
  const [autoStudentId, setAutoStudentId] = useState<string>('');
  const [studentIdLoading, setStudentIdLoading] = useState(false);

  const loadNextStudentId = useCallback(async () => {
    try {
      setStudentIdLoading(true);
      // Generate student ID based on current year and count
      const currentYear = new Date().getFullYear();
      const response = await studentService.getStudentCount();
      const count = response.success ? response.data.count : 0;
      const studentId = `S-${currentYear}-${(count + 1).toString().padStart(4, '0')}`;

      setAutoStudentId(studentId);
      setFormData(prev => {
        if (!prev.studentId) {
          return { ...prev, studentId };
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to generate student ID:', error);
    } finally {
      setStudentIdLoading(false);
    }
  }, []);

  // Load classes and generate student ID
  useEffect(() => {
    if (isOpen) {
      loadClasses();
      loadNextStudentId();
    }
  }, [isOpen, loadNextStudentId]);

  const loadClasses = async () => {
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setAvailableClasses(response.data);
        console.log('Loaded classes:', response.data.length, 'classes');
      } else {
        console.warn('Failed to load classes:', response.message);
        toast.error('Failed to load classes. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Error loading classes. Please check your connection.');
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

  // Handle checkbox changes
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    },
    [],
  );

  // Handle file upload
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
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

  // Handle parent account changes
  const addParentAccount = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      parents: [
        ...prev.parents,
        {
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          phone: '',
          relationship: 'father',
          isPrimary: prev.parents.length === 0, // First parent is primary
          createUserAccount: true,
          occupation: '',
        },
      ],
    }));
  }, []);

  const removeParentAccount = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index),
    }));
  }, []);

  const handleParentAccountChange = useCallback(
    (index: number, field: string, value: string | boolean) => {
      setFormData(prev => ({
        ...prev,
        parents: prev.parents.map((parent, i) =>
          i === index ? { ...parent, [field]: value } : parent,
        ),
      }));
    },
    [],
  );

  // Handle guardian changes
  const addGuardian = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      guardians: [
        ...prev.guardians,
        {
          firstName: '',
          middleName: '',
          lastName: '',
          phone: '',
          email: '',
          relation: '',
          createUserAccount: false,
          occupation: '',
        },
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
    (index: number, field: string, value: string | boolean) => {
      setFormData(prev => ({
        ...prev,
        guardians: prev.guardians.map((guardian, i) =>
          i === index ? { ...guardian, [field]: value } : guardian,
        ),
      }));
    },
    [],
  );

  // Auto-populate parent accounts from basic parent info
  const populateParentAccounts = useCallback(() => {
    const newParents: ParentAccountInfo[] = [];

    if (
      formData.fatherFirstName &&
      formData.fatherLastName &&
      formData.fatherEmail
    ) {
      newParents.push({
        firstName: formData.fatherFirstName,
        middleName: formData.fatherMiddleName || '',
        lastName: formData.fatherLastName,
        email: formData.fatherEmail,
        phone: formData.fatherPhone || '',
        relationship: 'father',
        isPrimary: true,
        createUserAccount: true,
        occupation: formData.fatherOccupation,
      });
    }

    if (
      formData.motherFirstName &&
      formData.motherLastName &&
      formData.motherEmail
    ) {
      newParents.push({
        firstName: formData.motherFirstName,
        middleName: formData.motherMiddleName || '',
        lastName: formData.motherLastName,
        email: formData.motherEmail,
        phone: formData.motherPhone || '',
        relationship: 'mother',
        isPrimary: false,
        createUserAccount: true,
        occupation: formData.motherOccupation,
      });
    }

    setFormData(prev => ({ ...prev, parents: newParents }));
  }, [
    formData.fatherFirstName,
    formData.fatherMiddleName,
    formData.fatherLastName,
    formData.fatherEmail,
    formData.fatherPhone,
    formData.fatherOccupation,
    formData.motherFirstName,
    formData.motherMiddleName,
    formData.motherLastName,
    formData.motherEmail,
    formData.motherPhone,
    formData.motherOccupation,
  ]);

  // Scroll to first error field
  const scrollToError = (fieldName: string) => {
    const element = document.querySelector(
      `[name="${fieldName}"]`,
    ) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.classId) newErrors.classId = 'Class is required';
    // Roll number is optional - will be auto-generated if not provided
    // if (!formData.rollNumber?.trim())
    //   newErrors.rollNumber = 'Roll number is required';
    if (!formData.admissionDate)
      newErrors.admissionDate = 'Admission date is required';

    // Parent validation - only required when creating new parent accounts
    if (formData.parentSelectionMode === 'create') {
      if (!formData.fatherFirstName.trim())
        newErrors.fatherFirstName = 'Father first name is required';
      if (!formData.fatherLastName.trim())
        newErrors.fatherLastName = 'Father last name is required';
      if (!formData.motherFirstName.trim())
        newErrors.motherFirstName = 'Mother first name is required';
      if (!formData.motherLastName.trim())
        newErrors.motherLastName = 'Mother last name is required';
      if (!formData.fatherEmail.trim())
        newErrors.fatherEmail = 'Father email is required';
      if (!formData.motherEmail.trim())
        newErrors.motherEmail = 'Mother email is required';
    } else if (formData.parentSelectionMode === 'existing') {
      // Validate that at least one parent is selected when linking existing parents
      if (formData.existingParents.length === 0) {
        newErrors.existingParents = 'Please select at least one parent to link';
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Parent email validation - only when creating new parent accounts
    if (formData.parentSelectionMode === 'create') {
      if (formData.fatherEmail && !emailRegex.test(formData.fatherEmail)) {
        newErrors.fatherEmail = 'Please enter a valid father email address';
      }
      if (formData.motherEmail && !emailRegex.test(formData.motherEmail)) {
        newErrors.motherEmail = 'Please enter a valid mother email address';
      }
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Parent phone validation - only when creating new parent accounts
    if (formData.parentSelectionMode === 'create') {
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
    }

    // Date validation
    const today = new Date();
    const dobDate = new Date(formData.dateOfBirth);
    const admissionDate = new Date(formData.admissionDate);

    if (dobDate >= today) {
      newErrors.dateOfBirth = 'Date of birth must be in the past';
    }
    if (admissionDate > today) {
      newErrors.admissionDate = 'Admission date cannot be in the future';
    }

    // Parent account validation
    formData.parents.forEach((parent, index) => {
      if (!parent.firstName.trim()) {
        newErrors[`parent-${index}-firstName`] =
          'Parent first name is required';
      }
      if (!parent.lastName.trim()) {
        newErrors[`parent-${index}-lastName`] = 'Parent last name is required';
      }
      if (!parent.email.trim()) {
        newErrors[`parent-${index}-email`] = 'Parent email is required';
      } else if (!emailRegex.test(parent.email)) {
        newErrors[`parent-${index}-email`] = 'Invalid email format';
      }
      if (!parent.relationship) {
        newErrors[`parent-${index}-relationship`] = 'Relationship is required';
      }
    });

    // Guardian validation
    formData.guardians.forEach((guardian, index) => {
      if (guardian.firstName && (!guardian.phone || !guardian.email)) {
        if (!guardian.phone) {
          newErrors[`guardian-${index}-phone`] = 'Guardian phone is required';
        }
        if (!guardian.email) {
          newErrors[`guardian-${index}-email`] = 'Guardian email is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Find first error field and scroll to it
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        scrollToError(errorFields[0]);
      }

      // Show specific validation errors
      const missingFields: string[] = [];
      const fieldLabels: { [key: string]: string } = {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        classId: 'Class',
        admissionDate: 'Admission Date',
        fatherFirstName: 'Father First Name',
        fatherLastName: 'Father Last Name',
        fatherEmail: 'Father Email',
        motherFirstName: 'Mother First Name',
        motherLastName: 'Mother Last Name',
        motherEmail: 'Mother Email',
      };

      errorFields.forEach(field => {
        const label = fieldLabels[field] || field;
        missingFields.push(label);
      });

      if (missingFields.length > 0) {
        if (missingFields.length <= 3) {
          toast.error(`Please fix: ${missingFields.join(', ')}`);
        } else {
          toast.error(
            `Please fix ${missingFields.length} validation errors. First: ${missingFields[0]}`,
          );
        }
      } else {
        toast.error('Please fix the validation errors and try again');
      }
      return;
    }

    setLoading(true);

    try {
      // Transform form data to match backend DTO structure
      const studentData = {
        // User fields
        user: {
          firstName: formData.firstName.trim(),
          middleName: formData.middleName?.trim() || undefined,
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
        },

        // Personal fields
        personal: {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as 'male' | 'female' | 'other',
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
          ethnicity: formData.ethnicity?.trim() || undefined,
          motherTongue: formData.motherTongue || undefined,
          disabilityType: formData.disabilityType || undefined,
          address: formData.address?.trim() || undefined,
          street: formData.street?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          state: formData.state?.trim() || undefined,
          pinCode: formData.pinCode?.trim() || undefined,
        },

        // Academic fields
        academic: {
          classId: formData.classId,
          rollNumber: formData.rollNumber?.trim() || undefined, // Will be auto-generated by backend
          admissionDate: formData.admissionDate,
          studentId: formData.studentId?.trim() || undefined,
          academicStatus:
            (formData.academicStatus as
              | 'active'
              | 'suspended'
              | 'graduated'
              | 'transferred') || 'active',
          transportMode: formData.transportMode?.trim() || undefined,
        },

        // Parent info (basic info stored in student record) - only when creating new parents
        ...(formData.parentSelectionMode === 'create' && {
          parentInfo: {
            fatherFirstName: formData.fatherFirstName.trim(),
            fatherMiddleName: formData.fatherMiddleName?.trim() || undefined,
            fatherLastName: formData.fatherLastName.trim(),
            motherFirstName: formData.motherFirstName.trim(),
            motherMiddleName: formData.motherMiddleName?.trim() || undefined,
            motherLastName: formData.motherLastName.trim(),
            fatherPhone: formData.fatherPhone?.trim() || undefined,
            motherPhone: formData.motherPhone?.trim() || undefined,
            fatherEmail: formData.fatherEmail.trim(),
            motherEmail: formData.motherEmail.trim(),
            fatherOccupation: formData.fatherOccupation?.trim() || undefined,
            motherOccupation: formData.motherOccupation?.trim() || undefined,
          },
        }),

        // Parent user accounts to create (only if in create mode)
        parents:
          formData.parentSelectionMode === 'create'
            ? formData.parents.filter(
                parent => parent.firstName && parent.lastName && parent.email,
              )
            : [],

        // Existing parents to link (only if in existing mode)
        existingParents:
          formData.parentSelectionMode === 'existing'
            ? formData.existingParents
            : [],

        // Guardians (ALL guardians - both with and without user accounts)
        guardians: formData.guardians
          .filter(
            guardian =>
              guardian.firstName &&
              guardian.lastName &&
              guardian.phone &&
              guardian.email,
          )
          .map(guardian => ({
            firstName: guardian.firstName,
            middleName: guardian.middleName || undefined,
            lastName: guardian.lastName,
            phone: guardian.phone,
            email: guardian.email,
            relation: guardian.relation,
            occupation: guardian.occupation || undefined,
            createUserAccount: guardian.createUserAccount, // Include the checkbox state
          })),

        // Additional information
        additional: {
          medicalConditions: formData.medicalConditions?.trim() || undefined,
          allergies: formData.allergies?.trim() || undefined,
          interests: formData.interests?.trim() || undefined,
          specialNeeds: formData.specialNeeds?.trim() || undefined,
          bio: formData.bio?.trim() || undefined,
          emergencyContact: formData.emergencyContact || undefined,
        },

        // Profile information
        profile: {
          emergencyContact: formData.emergencyContact || undefined,
          interests: formData.interests
            ? { interests: formData.interests }
            : undefined,
          additionalData: {
            medicalConditions: formData.medicalConditions?.trim() || undefined,
            allergies: formData.allergies?.trim() || undefined,
            specialNeeds: formData.specialNeeds?.trim() || undefined,
          },
        },
      };

      console.log('Student data being sent:', studentData);
      console.log('🛡️ Form guardians count:', formData.guardians.length);
      console.log('🛡️ Form guardians details:', formData.guardians);
      console.log('📋 Guardians being sent:', studentData.guardians);
      console.log('📋 Guardians count:', studentData.guardians?.length || 0);
      if (studentData.guardians && studentData.guardians.length > 0) {
        console.log(
          '🛡️ Guardians with user accounts:',
          studentData.guardians.filter(g => g.createUserAccount).length,
        );
        console.log(
          '📝 Guardians without user accounts:',
          studentData.guardians.filter(g => !g.createUserAccount).length,
        );
      }

      const response = await studentService.createStudent(
        studentData,
        formData.photo || undefined,
      );

      if (response.success) {
        // Log generated credentials to console for testing purposes
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

              Class: formData.classId || 'Not assigned',
            });
          }

          // Log parent credentials if available
          if (
            response.data?.parentCredentials &&
            Array.isArray(response.data.parentCredentials)
          ) {
            // Separate regular parents from guardians
            const regularParents = response.data.parentCredentials.filter(
              (parent: any) =>
                ![
                  'guardian',
                  'uncle',
                  'aunt',
                  'grandfather',
                  'grandmother',
                  'stepfather',
                  'stepmother',
                ].includes(parent.relationship?.toLowerCase()),
            );
            const guardianParents = response.data.parentCredentials.filter(
              (parent: any) =>
                [
                  'guardian',
                  'uncle',
                  'aunt',
                  'grandfather',
                  'grandmother',
                  'stepfather',
                  'stepmother',
                ].includes(parent.relationship?.toLowerCase()),
            );

            if (regularParents.length > 0) {
              console.log('👨‍👩‍👧‍👦 PARENT ACCOUNTS CREATED:');
              regularParents.forEach((parent: any, index: number) => {
                console.table({
                  [`Parent ${index + 1} Email`]: parent.email,
                  [`Parent ${index + 1} Password`]: parent.temporaryPassword,
                  [`Parent ${index + 1} Name`]: parent.fullName,
                  [`Parent ${index + 1} ID`]: parent.id,
                  [`Parent ${index + 1} Relationship`]: parent.relationship,
                });
              });
            }

            if (guardianParents.length > 0) {
              console.log('🛡️ GUARDIAN ACCOUNTS CREATED:');
              guardianParents.forEach((guardian: any, index: number) => {
                console.table({
                  [`Guardian ${index + 1} Email`]: guardian.email,
                  [`Guardian ${index + 1} Password`]:
                    guardian.temporaryPassword,
                  [`Guardian ${index + 1} Name`]: guardian.fullName,
                  [`Guardian ${index + 1} ID`]: guardian.id,
                  [`Guardian ${index + 1} Relationship`]: guardian.relationship,
                });
              });
            }
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

      // Handle conflict errors (409)
      if (error.statusCode === 409) {
        const conflictMessage = error.message || 'A conflict occurred';
        let userFriendlyMessage = '';
        let fieldToScroll = '';

        // Convert technical error messages to user-friendly ones
        if (conflictMessage.toLowerCase().includes('email')) {
          userFriendlyMessage =
            'This email address is already registered in the system. Please use a different email address.';
          fieldToScroll = 'email';
        } else if (conflictMessage.toLowerCase().includes('phone')) {
          userFriendlyMessage =
            'This phone number is already registered in the system. Please use a different phone number.';
          fieldToScroll = 'phone';
        } else if (conflictMessage.toLowerCase().includes('student id')) {
          userFriendlyMessage =
            'This Student ID is already in use. Please use a different Student ID or leave it blank for auto-generation.';
          fieldToScroll = 'studentId';
        } else if (conflictMessage.toLowerCase().includes('roll number')) {
          userFriendlyMessage =
            'This Roll Number is already assigned in the selected class. Please use a different roll number.';
          fieldToScroll = 'rollNumber';
        } else {
          userFriendlyMessage =
            'Some information you entered already exists in our system. Please check and modify the highlighted fields.';
        }

        toast.error(userFriendlyMessage, { duration: 10000 });

        // Scroll to the problematic field
        if (fieldToScroll) {
          scrollToError(fieldToScroll);
        }

        setLoading(false);
        return;
      }

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
            'academic.classId': 'Class',

            'academic.admissionDate': 'Admission Date',
            'personal.dateOfBirth': 'Date of Birth',
            'personal.gender': 'Gender',
            'parentInfo.fatherName': 'Father Name',
            'parentInfo.motherName': 'Mother Name',
            'parentInfo.fatherEmail': 'Father Email',
            'parentInfo.motherEmail': 'Mother Email',
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
            'Failed to create student. Please check all required fields.',
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
      <div className='relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-br from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <GraduationCap size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Add New Student</h2>
              <p className='text-orange-100 text-sm'>
                Enter student information, academic details, and parent
                information
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
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-6'>
                <div className='flex'>
                  <AlertCircle className='h-5 w-5 text-red-400 mt-0.5' />
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800'>
                      Please fix the following errors:
                    </h3>
                    <div className='mt-2 text-sm text-red-700'>
                      <ul className='list-disc pl-5 space-y-1'>
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Basic Information */}
            <FormSection title='Student Information' icon={User}>
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
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  error={errors.phone}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <LabeledInput
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  error={errors.dateOfBirth}
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
                <LabeledSelect
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup || ''}
                  onChange={handleInputChange}
                  options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                  placeholder='Select blood group'
                />
                <EthnicitySelect
                  label='Ethnicity'
                  value={formData.ethnicity || ''}
                  onChange={value =>
                    setFormData(prev => ({ ...prev, ethnicity: value }))
                  }
                  placeholder='Select ethnicity'
                  className='mt-4'
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledSelect
                  label='Mother Tongue'
                  name='motherTongue'
                  value={formData.motherTongue || ''}
                  onChange={handleInputChange}
                  options={MOTHER_TONGUE_OPTIONS}
                  placeholder='Select mother tongue'
                />
                <LabeledSelect
                  label='Disability Type'
                  name='disabilityType'
                  value={formData.disabilityType || ''}
                  onChange={handleInputChange}
                  options={DISABILITY_TYPE_OPTIONS}
                  placeholder='Select disability type'
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

            {/* Address Information */}
            <FormSection title='Address Information' icon={Mail}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledTextarea
                  label='Full Address'
                  name='address'
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder='Enter complete address'
                  rows={3}
                />
                <div className='space-y-4'>
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
                </div>
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
                    label: `Grade ${cls.grade} ${cls.section || ''}`,
                  }))}
                  placeholder={
                    availableClasses.length === 0
                      ? 'Loading classes...'
                      : 'Select class'
                  }
                  required
                  error={errors.classId}
                  disabled={availableClasses.length === 0}
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

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mt-4'>
                <div className='relative'>
                  <LabeledInput
                    label='Student ID'
                    name='studentId'
                    value={formData.studentId || ''}
                    onChange={handleInputChange}
                    placeholder={
                      autoStudentId
                        ? `Auto: ${autoStudentId}`
                        : 'Auto-generated'
                    }
                  />
                  {autoStudentId && (
                    <div className='flex items-center mt-1'>
                      <span className='text-xs text-orange-600 flex items-center'>
                        ✨ Auto-generated:{' '}
                        <strong className='ml-1'>{autoStudentId}</strong>
                      </span>
                      {studentIdLoading && (
                        <div className='ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600'></div>
                      )}
                    </div>
                  )}
                </div>
                <LabeledSelect
                  label='Academic Status'
                  name='academicStatus'
                  value={formData.academicStatus || ''}
                  onChange={handleInputChange}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'graduated', label: 'Graduated' },
                    { value: 'transferred', label: 'Transferred' },
                  ]}
                  placeholder='Select status'
                />
                <LabeledSelect
                  label='Transport Mode (Optional)'
                  name='transportMode'
                  value={formData.transportMode || ''}
                  onChange={handleInputChange}
                  options={[
                    'school_bus',
                    'private_vehicle',
                    'walking',
                    'cycling',
                    'public_transport',
                    'other',
                  ]}
                  placeholder='Select transport (optional)'
                />
              </div>
            </FormSection>

            {/* Parent Information */}
            <FormSection title='Parent Information' icon={Users}>
              {/* Parent Selection Mode */}
              <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-3'>
                  Parent Account Options
                </h4>
                <div className='space-y-3'>
                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='parentSelectionMode'
                      value='create'
                      checked={formData.parentSelectionMode === 'create'}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          parentSelectionMode: e.target.value as
                            | 'create'
                            | 'existing',
                          existingParents: [], // Clear existing parents when switching to create mode
                        }))
                      }
                      className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                    />
                    <span className='ml-2 text-sm font-medium text-gray-900'>
                      Create new parent accounts
                    </span>
                  </label>
                  <p className='ml-6 text-sm text-gray-600'>
                    Create new user accounts for parents with login credentials
                  </p>

                  <label className='flex items-center'>
                    <input
                      type='radio'
                      name='parentSelectionMode'
                      value='existing'
                      checked={formData.parentSelectionMode === 'existing'}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          parentSelectionMode: e.target.value as
                            | 'create'
                            | 'existing',
                          parents: [], // Clear new parents when switching to existing mode
                        }))
                      }
                      className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                    />
                    <span className='ml-2 text-sm font-medium text-gray-900'>
                      Link to existing parent accounts
                    </span>
                  </label>
                  <p className='ml-6 text-sm text-gray-600'>
                    Link this student to parents who already have accounts (for
                    siblings)
                  </p>
                </div>
              </div>

              {formData.parentSelectionMode === 'create' ? (
                <>
                  {/* Create New Parents Mode */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {/* Father Information */}
                    <div className='space-y-4'>
                      <h4 className='font-medium text-gray-900 border-b pb-2'>
                        Father Details
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <LabeledInput
                          label='First Name'
                          name='fatherFirstName'
                          value={formData.fatherFirstName}
                          onChange={handleInputChange}
                          placeholder='Enter first name'
                          required
                          error={errors.fatherFirstName}
                        />
                        <LabeledInput
                          label='Middle Name'
                          name='fatherMiddleName'
                          value={formData.fatherMiddleName || ''}
                          onChange={handleInputChange}
                          placeholder='Enter middle name'
                        />
                        <LabeledInput
                          label='Last Name'
                          name='fatherLastName'
                          value={formData.fatherLastName}
                          onChange={handleInputChange}
                          placeholder='Enter last name'
                          required
                          error={errors.fatherLastName}
                        />
                      </div>
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
                        value={formData.fatherPhone || ''}
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
                  </div>

                  {/* Mother Information */}
                  <div className='space-y-4'>
                    <h4 className='font-medium text-gray-900 border-b pb-2'>
                      Mother Details
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <LabeledInput
                        label='First Name'
                        name='motherFirstName'
                        value={formData.motherFirstName}
                        onChange={handleInputChange}
                        placeholder='Enter first name'
                        required
                        error={errors.motherFirstName}
                      />
                      <LabeledInput
                        label='Middle Name'
                        name='motherMiddleName'
                        value={formData.motherMiddleName || ''}
                        onChange={handleInputChange}
                        placeholder='Enter middle name'
                      />
                      <LabeledInput
                        label='Last Name'
                        name='motherLastName'
                        value={formData.motherLastName}
                        onChange={handleInputChange}
                        placeholder='Enter last name'
                        required
                        error={errors.motherLastName}
                      />
                    </div>
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
                      value={formData.motherPhone || ''}
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

                  {/* Auto-populate button */}
                  <div className='mt-4 flex justify-center'>
                    <button
                      type='button'
                      onClick={populateParentAccounts}
                      className='px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors duration-200 flex items-center'
                    >
                      <UserPlus size={16} className='mr-2' />
                      Create Parent User Accounts
                    </button>
                  </div>

                  {/* Parent User Accounts */}
                  {formData.parents.length > 0 && (
                    <FormSection title='Parent User Accounts' icon={Users}>
                      <div className='space-y-4'>
                        {formData.parents.map((parent, index) => (
                          <div
                            key={index}
                            className='border rounded-lg p-4 bg-white'
                          >
                            <div className='flex justify-between items-center mb-4'>
                              <h5 className='font-medium text-gray-900'>
                                Parent Account {index + 1}
                              </h5>
                              <button
                                type='button'
                                onClick={() => removeParentAccount(index)}
                                className='text-red-600 hover:text-red-800 text-sm'
                              >
                                Remove
                              </button>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                              <LabeledInput
                                label='First Name'
                                name={`parent-${index}-firstName`}
                                value={parent.firstName}
                                onChange={e =>
                                  handleParentAccountChange(
                                    index,
                                    'firstName',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter first name'
                                error={errors[`parent-${index}-firstName`]}
                              />
                              <LabeledInput
                                label='Last Name'
                                name={`parent-${index}-lastName`}
                                value={parent.lastName}
                                onChange={e =>
                                  handleParentAccountChange(
                                    index,
                                    'lastName',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter last name'
                                error={errors[`parent-${index}-lastName`]}
                              />
                              <LabeledInput
                                label='Email'
                                name={`parent-${index}-email`}
                                type='email'
                                value={parent.email}
                                onChange={e =>
                                  handleParentAccountChange(
                                    index,
                                    'email',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter email address'
                                error={errors[`parent-${index}-email`]}
                              />
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                              <LabeledInput
                                label='Phone'
                                name={`parent-${index}-phone`}
                                value={parent.phone}
                                onChange={e =>
                                  handleParentAccountChange(
                                    index,
                                    'phone',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter phone number'
                              />
                              <LabeledSelect
                                label='Relationship'
                                name={`parent-${index}-relationship`}
                                value={parent.relationship}
                                onChange={e =>
                                  handleParentAccountChange(
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
                                  {
                                    value: 'grandfather',
                                    label: 'Grandfather',
                                  },
                                  {
                                    value: 'grandmother',
                                    label: 'Grandmother',
                                  },
                                  { value: 'uncle', label: 'Uncle' },
                                  { value: 'aunt', label: 'Aunt' },
                                  { value: 'other', label: 'Other' },
                                ]}
                                placeholder='Select relationship'
                                error={errors[`parent-${index}-relationship`]}
                              />
                              <LabeledInput
                                label='Occupation'
                                name={`parent-${index}-occupation`}
                                value={parent.occupation || ''}
                                onChange={e =>
                                  handleParentAccountChange(
                                    index,
                                    'occupation',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter occupation'
                              />
                            </div>
                            <div className='flex items-center space-x-4 mt-4'>
                              <label className='flex items-center'>
                                <input
                                  type='checkbox'
                                  checked={parent.isPrimary}
                                  onChange={e =>
                                    handleParentAccountChange(
                                      index,
                                      'isPrimary',
                                      e.target.checked,
                                    )
                                  }
                                  className='rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                                />
                                <span className='ml-2 text-sm'>
                                  Primary Contact
                                </span>
                              </label>
                              <label className='flex items-center'>
                                <input
                                  type='checkbox'
                                  checked={parent.createUserAccount}
                                  onChange={e =>
                                    handleParentAccountChange(
                                      index,
                                      'createUserAccount',
                                      e.target.checked,
                                    )
                                  }
                                  className='rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                                />
                                <span className='ml-2 text-sm'>
                                  Create Login Account
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}

                        <button
                          type='button'
                          onClick={addParentAccount}
                          className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors duration-200 flex items-center justify-center'
                        >
                          <Plus size={20} className='mr-2' />
                          Add Parent Account
                        </button>
                      </div>
                    </FormSection>
                  )}
                </>
              ) : (
                // Link Existing Parents Mode
                <div className='space-y-6'>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <div className='flex items-start'>
                      <Users className='w-5 h-5 text-blue-600 mt-0.5 mr-2' />
                      <div>
                        <h4 className='font-medium text-blue-900 mb-1'>
                          Link Existing Parents
                        </h4>
                        <p className='text-sm text-blue-700'>
                          Search and select parents who already have accounts in
                          the system. This is perfect for adding siblings to
                          existing parent accounts.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Father Selection */}
                  <div className='space-y-4'>
                    <h4 className='font-medium text-gray-900 border-b pb-2 flex items-center'>
                      <Users className='w-4 h-4 mr-2' />
                      Select Father/Guardian
                    </h4>
                    <ParentSearchSelect
                      value={
                        formData.existingParents.find(
                          p => p.relationship === 'father',
                        )?.parentId
                      }
                      onChange={parentId => {
                        setFormData(prev => ({
                          ...prev,
                          existingParents: parentId
                            ? [
                                ...prev.existingParents.filter(
                                  p => p.relationship !== 'father',
                                ),
                                {
                                  parentId,
                                  relationship: 'father',
                                  isPrimary: true,
                                },
                              ]
                            : prev.existingParents.filter(
                                p => p.relationship !== 'father',
                              ),
                        }));
                      }}
                      placeholder='Search for father by name, email, or phone...'
                      label='Father'
                    />
                  </div>

                  {/* Mother Selection */}
                  <div className='space-y-4'>
                    <h4 className='font-medium text-gray-900 border-b pb-2 flex items-center'>
                      <Users className='w-4 h-4 mr-2' />
                      Select Mother/Guardian
                    </h4>
                    <ParentSearchSelect
                      value={
                        formData.existingParents.find(
                          p => p.relationship === 'mother',
                        )?.parentId
                      }
                      onChange={parentId => {
                        setFormData(prev => ({
                          ...prev,
                          existingParents: parentId
                            ? [
                                ...prev.existingParents.filter(
                                  p => p.relationship !== 'mother',
                                ),
                                {
                                  parentId,
                                  relationship: 'mother',
                                  isPrimary: false,
                                },
                              ]
                            : prev.existingParents.filter(
                                p => p.relationship !== 'mother',
                              ),
                        }));
                      }}
                      placeholder='Search for mother by name, email, or phone...'
                      label='Mother'
                    />
                  </div>

                  {/* Selected Parents Summary */}
                  {formData.existingParents.length > 0 && (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <h4 className='font-medium text-green-900 mb-2'>
                        Selected Parents
                      </h4>
                      <div className='space-y-2'>
                        {formData.existingParents.map((parent, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between bg-white rounded p-2 border border-green-200'
                          >
                            <span className='text-sm text-gray-700'>
                              {parent.relationship.charAt(0).toUpperCase() +
                                parent.relationship.slice(1)}{' '}
                              - ID: {parent.parentId}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${parent.isPrimary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {parent.isPrimary ? 'Primary' : 'Secondary'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing Parents Validation Error */}
                  {errors.existingParents && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                      <p className='text-sm text-red-600'>
                        {errors.existingParents}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            {/* Additional Guardians */}
            <FormSection
              title='🛡️ Additional Guardians (Optional)'
              icon={Shield}
            >
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
                <p className='text-sm text-blue-800'>
                  <strong>Add guardians</strong> like grandparents, uncles,
                  aunts, or other family members who should have access to
                  student information. Check "Create Guardian User Account" to
                  give them login access to the parent portal.
                </p>
                {formData.guardians.length > 0 && (
                  <p className='text-xs text-green-700 mt-2 font-medium'>
                    ✅ {formData.guardians.length} guardian(s) added
                  </p>
                )}
              </div>
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
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <LabeledInput
                        label='First Name'
                        name={`guardian-${index}-firstName`}
                        value={guardian.firstName}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'firstName',
                            e.target.value,
                          )
                        }
                        placeholder='Enter first name'
                        required
                      />
                      <LabeledInput
                        label='Middle Name'
                        name={`guardian-${index}-middleName`}
                        value={guardian.middleName || ''}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'middleName',
                            e.target.value,
                          )
                        }
                        placeholder='Enter middle name (optional)'
                      />
                      <LabeledInput
                        label='Last Name'
                        name={`guardian-${index}-lastName`}
                        value={guardian.lastName}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'lastName',
                            e.target.value,
                          )
                        }
                        placeholder='Enter last name'
                        required
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
                        error={errors[`guardian-${index}-phone`]}
                        required
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
                        error={errors[`guardian-${index}-email`]}
                        required
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
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
                        placeholder='Enter relation (e.g., Uncle, Aunt, Grandfather)'
                        required
                      />
                      <LabeledInput
                        label='Occupation'
                        name={`guardian-${index}-occupation`}
                        value={guardian.occupation || ''}
                        onChange={e =>
                          handleGuardianChange(
                            index,
                            'occupation',
                            e.target.value,
                          )
                        }
                        placeholder='Enter occupation (optional)'
                      />
                    </div>

                    {/* User Account Creation Checkbox */}
                    <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                      <div className='flex items-start space-x-3'>
                        <input
                          type='checkbox'
                          id={`guardian-${index}-createAccount`}
                          checked={guardian.createUserAccount}
                          onChange={e =>
                            handleGuardianChange(
                              index,
                              'createUserAccount',
                              e.target.checked,
                            )
                          }
                          className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                        <div className='flex-1'>
                          <label
                            htmlFor={`guardian-${index}-createAccount`}
                            className='text-sm font-medium text-blue-800 cursor-pointer'
                          >
                            Create Guardian User Account
                          </label>
                          <p className='text-xs text-blue-600 mt-1'>
                            Check this to create a login account for this
                            guardian, allowing them to access the parent portal
                            and view student information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  onClick={() => {
                    console.log('🛡️ Add Guardian button clicked');
                    console.log(
                      '🛡️ Current guardians before add:',
                      formData.guardians,
                    );
                    addGuardian();
                  }}
                  className='w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors duration-200 flex items-center justify-center'
                >
                  <Plus size={20} className='mr-2' />
                  Add Guardian ({formData.guardians.length})
                </button>
              </div>
            </FormSection>

            {/* Medical & Health Information */}
            <FormSection title='Medical & Health Information' icon={Heart}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
              <div className='mt-4'>
                <LabeledTextarea
                  label='Special Needs'
                  name='specialNeeds'
                  value={formData.specialNeeds || ''}
                  onChange={handleInputChange}
                  placeholder='Enter any special needs or requirements'
                  rows={3}
                />
              </div>
            </FormSection>

            {/* Additional Information */}
            <FormSection title='Additional Information' icon={Plus}>
              <div className='space-y-4'>
                <LabeledTextarea
                  label='Interests & Hobbies'
                  name='interests'
                  value={formData.interests || ''}
                  onChange={handleInputChange}
                  placeholder='Enter student interests and hobbies'
                  rows={3}
                />
                <LabeledTextarea
                  label='Bio'
                  name='bio'
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  placeholder='Enter a brief bio about the student'
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
