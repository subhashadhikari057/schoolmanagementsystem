'use client';

import React, { useState } from 'react';
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
  MapPin,
  GraduationCap,
  DollarSign,
  Upload,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type UserType = 'teacher' | 'parent' | 'staff' | 'student';

interface AddUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userType: UserType;
}

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  photo?: File | null;

  // Professional Information (Teacher/Staff)
  employeeId?: string;
  joiningDate?: string;
  experience?: string;
  highestQualification?: string;
  specialization?: string;
  designation?: string;
  department?: string;

  // Subject Assignment (Teacher)
  subjects?: string[];
  isClassTeacher?: boolean;

  // Salary Information (Teacher/Staff)
  basicSalary?: string;
  allowances?: string;
  totalSalary?: string;

  // Additional Information
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;

  // Parent specific
  occupation?: string;
  relation?: string;

  // Student specific
  studentId?: string;
  class?: string;
  section?: string;
  rollNo?: string;
  parentName?: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
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

const USER_CONFIG = {
  teacher: {
    title: 'Add New Teacher',
    subtitle: 'Enter teacher information and professional details',
    icon: GraduationCap,
    color: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
    accent: 'blue',
  },
  parent: {
    title: 'Add New Parent',
    subtitle: 'Enter parent information and contact details',
    icon: Users,
    color: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
    accent: 'green',
  },
  staff: {
    title: 'Add New Staff',
    subtitle: 'Enter staff member information and role details',
    icon: Briefcase,
    color: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50 via-violet-50 to-indigo-50',
    accent: 'purple',
  },
  student: {
    title: 'Add New Student',
    subtitle: 'Enter student information and academic details',
    icon: User,
    color: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 via-red-50 to-pink-50',
    accent: 'orange',
  },
} as const;

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Social Science',
  'Computer Science',
  'Art & Craft',
  'Music',
  'Sanskrit',
];
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
const RELATIONS = [
  'Father',
  'Mother',
  'Guardian',
  'Uncle',
  'Aunt',
  'Grandparent',
];

export default function AddUserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userType,
}: AddUserFormModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const config = USER_CONFIG[userType];
  const IconComponent = config.icon;

  const handleInputChange = (
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
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = (prev[name as keyof FormData] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return { ...prev, [name]: newValues };
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      // 5MB limit
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file) {
      toast.error('File size too large', {
        description: 'Please select a file smaller than 5MB',
      });
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return 'First name and last name are required';
    }
    if (!formData.email.trim() || !formData.phone.trim()) {
      return 'Email and phone number are required';
    }
    if (
      userType === 'teacher' &&
      (!formData.subjects || formData.subjects.length === 0)
    ) {
      return 'Please select at least one subject for the teacher';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`${config.title.split(' ')[2]} Added Successfully`, {
        description: `${formData.firstName} ${formData.lastName} has been added to the system.`,
        duration: 4000,
      });

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = `Failed to add ${userType}. Please try again.`;
      toast.error(`Failed to add ${userType}`, {
        description: errorMessage,
        duration: 6000,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setPhotoPreview(null);
    setError(null);
  };

  const calculateTotalSalary = () => {
    const basic = parseFloat(formData.basicSalary || '0');
    const allowances = parseFloat(formData.allowances || '0');
    const total = basic + allowances;
    setFormData(prev => ({ ...prev, totalSalary: total.toString() }));
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Reusable form section component
  const FormSection = ({
    title,
    icon: Icon,
    bgColor = 'bg-gray-50',
    iconColor = 'text-blue-500',
    children,
  }: {
    title: string;
    icon: any;
    bgColor?: string;
    iconColor?: string;
    children: React.ReactNode;
  }) => (
    <div
      className={`${bgColor} rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
        <Icon size={20} className={`mr-3 ${iconColor}`} />
        {title}
      </h3>
      {children}
    </div>
  );

  // Reusable select component
  const SelectField = ({
    label,
    name,
    value,
    options,
    placeholder = 'Select option',
    required = false,
  }: {
    label: string;
    name: string;
    value: string;
    options: string[];
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={handleInputChange}
        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors duration-200'
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

  return (
    <div className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'>
      <div className='modal-scroll-blend modal-sidebar-blend rounded-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'>
        {/* Decorative Header */}
        <div
          className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-br ${config.bgGradient} p-6 border-b border-gray-100 sticky top-0 z-10`}
        >
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div
                className={`p-2 bg-gradient-to-br ${config.color} rounded-xl shadow-lg`}
              >
                <IconComponent size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {config.title}
                </h2>
                <p className='text-sm text-gray-600 mt-1'>{config.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-8'>
            {/* Photo Upload Section */}
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
                <label
                  className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${config.color} text-white p-2.5 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl`}
                >
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
              <span
                className={`text-xs font-semibold text-${config.accent}-600`}
              >
                Choose Photo
              </span>
              <p className='text-xs text-gray-500 mt-1'>
                Max 5MB • JPG, PNG, WEBP
              </p>
            </div>

            {/* Personal Information */}
            <FormSection
              title='Personal Information'
              icon={User}
              bgColor='bg-gradient-to-br from-gray-50 to-white'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input
                  label='First Name'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter first name'
                />
                <Input
                  label='Last Name'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter last name'
                />
                <Input
                  label='Email Address'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter email address'
                  leftIcon={<Mail size={16} />}
                />
                <Input
                  label='Phone Number'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter phone number'
                  leftIcon={<Phone size={16} />}
                />
                <Input
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  leftIcon={<Calendar size={16} />}
                />
                <SelectField
                  label='Gender'
                  name='gender'
                  value={formData.gender}
                  options={GENDERS}
                  placeholder='Select gender'
                />
                <SelectField
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup}
                  options={BLOOD_GROUPS}
                  placeholder='Select blood group'
                />
                <div className='md:col-span-1'>
                  <label className='text-sm font-medium leading-none mb-2 block'>
                    Address
                  </label>
                  <textarea
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder='Enter complete address'
                    rows={3}
                    className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors duration-200 resize-none'
                  />
                </div>
              </div>
            </FormSection>

            {/* Professional Information (Teacher/Staff) */}
            {(userType === 'teacher' || userType === 'staff') && (
              <FormSection
                title='Professional Information'
                icon={Briefcase}
                bgColor='bg-gradient-to-br from-blue-50 to-indigo-50'
                iconColor='text-blue-600'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Input
                    label='Employee ID'
                    name='employeeId'
                    value={formData.employeeId || ''}
                    onChange={handleInputChange}
                    placeholder='Auto-generated or enter ID'
                  />
                  <Input
                    label='Joining Date'
                    name='joiningDate'
                    type='date'
                    value={formData.joiningDate || ''}
                    onChange={handleInputChange}
                    leftIcon={<Calendar size={16} />}
                  />
                  <Input
                    label={`Experience (${userType === 'teacher' ? 'Teaching' : 'Total'})`}
                    name='experience'
                    value={formData.experience || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., 5 years'
                  />
                  <Input
                    label='Highest Qualification'
                    name='highestQualification'
                    value={formData.highestQualification || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., M.Sc. Mathematics, B.E.'
                  />
                  <SelectField
                    label='Designation'
                    name='designation'
                    value={formData.designation || ''}
                    options={
                      userType === 'teacher'
                        ? [
                            'Senior Teacher',
                            'Assistant Teacher',
                            'Head of Department',
                            'Principal',
                            'Vice Principal',
                          ]
                        : [
                            'Administrative Officer',
                            'Accountant',
                            'Librarian',
                            'Lab Assistant',
                            'Security Guard',
                          ]
                    }
                    placeholder='Select designation'
                  />
                  <Input
                    label='Department'
                    name='department'
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., Science, Administration'
                  />
                </div>
              </FormSection>
            )}

            {/* Subject Assignment (Teacher only) */}
            {userType === 'teacher' && (
              <FormSection
                title='Subject Assignment'
                icon={BookOpen}
                bgColor='bg-gradient-to-br from-green-50 to-emerald-50'
                iconColor='text-green-600'
              >
                <div className='space-y-6'>
                  <div>
                    <label className='text-sm font-medium leading-none mb-3 block'>
                      Subjects <span className='text-red-500'>*</span>
                    </label>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                      {SUBJECTS.map(subject => (
                        <label
                          key={subject}
                          className='flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/70 transition-colors duration-200'
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMultiSelectChange('subjects', subject);
                          }}
                        >
                          <input
                            type='checkbox'
                            checked={
                              formData.subjects?.includes(subject) || false
                            }
                            onChange={e => {
                              e.stopPropagation();
                              // Don't call handleMultiSelectChange here since label handles it
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            className='rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2'
                          />
                          <span className='text-sm font-medium text-gray-700'>
                            {subject}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className='pt-4 border-t border-green-200'>
                    <label
                      className='flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200'
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Manually toggle the checkbox
                        const syntheticEvent = {
                          target: {
                            name: 'isClassTeacher',
                            type: 'checkbox',
                            checked: !formData.isClassTeacher,
                          },
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(syntheticEvent);
                      }}
                    >
                      <input
                        type='checkbox'
                        name='isClassTeacher'
                        checked={formData.isClassTeacher || false}
                        onChange={e => {
                          e.stopPropagation();
                          // Don't call handleInputChange here since label handles it
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
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
                  </div>
                </div>
              </FormSection>
            )}

            {/* Salary Information (Teacher/Staff) */}
            {(userType === 'teacher' || userType === 'staff') && (
              <FormSection
                title='Salary Information'
                icon={DollarSign}
                bgColor='bg-gradient-to-br from-yellow-50 to-amber-50'
                iconColor='text-yellow-600'
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <Input
                    label='Basic Salary'
                    name='basicSalary'
                    type='number'
                    value={formData.basicSalary || ''}
                    onChange={handleInputChange}
                    onBlur={calculateTotalSalary}
                    placeholder='Enter basic salary'
                    leftIcon={<DollarSign size={16} />}
                  />
                  <Input
                    label='Allowances'
                    name='allowances'
                    type='number'
                    value={formData.allowances || ''}
                    onChange={handleInputChange}
                    onBlur={calculateTotalSalary}
                    placeholder='Enter allowances'
                    leftIcon={<Plus size={16} />}
                  />
                  <Input
                    label='Total Salary'
                    name='totalSalary'
                    type='number'
                    value={formData.totalSalary || ''}
                    onChange={handleInputChange}
                    placeholder='Calculated automatically'
                    className='bg-amber-50 font-semibold'
                    leftIcon={<DollarSign size={16} />}
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

            {/* Parent Specific Information */}
            {userType === 'parent' && (
              <FormSection
                title='Parent Information'
                icon={Users}
                bgColor='bg-gradient-to-br from-purple-50 to-violet-50'
                iconColor='text-purple-600'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Input
                    label='Occupation'
                    name='occupation'
                    value={formData.occupation || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., Software Engineer, Doctor'
                  />
                  <SelectField
                    label='Relation'
                    name='relation'
                    value={formData.relation || ''}
                    options={RELATIONS}
                    placeholder='Select relation'
                  />
                </div>
              </FormSection>
            )}

            {/* Student Specific Information */}
            {userType === 'student' && (
              <FormSection
                title='Academic Information'
                icon={GraduationCap}
                bgColor='bg-gradient-to-br from-orange-50 to-red-50'
                iconColor='text-orange-600'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Input
                    label='Student ID'
                    name='studentId'
                    value={formData.studentId || ''}
                    onChange={handleInputChange}
                    placeholder='Auto-generated or enter ID'
                  />
                  <Input
                    label='Roll Number'
                    name='rollNo'
                    value={formData.rollNo || ''}
                    onChange={handleInputChange}
                    placeholder='Enter roll number'
                  />
                  <Input
                    label='Class'
                    name='class'
                    value={formData.class || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., Grade 10'
                  />
                  <Input
                    label='Section'
                    name='section'
                    value={formData.section || ''}
                    onChange={handleInputChange}
                    placeholder='e.g., A, B, C'
                  />
                  <div className='md:col-span-2'>
                    <Input
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

            {/* Additional Information */}
            <FormSection title='Additional Information' icon={Plus}>
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
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMultiSelectChange('languagesKnown', language);
                        }}
                      >
                        <input
                          type='checkbox'
                          checked={
                            formData.languagesKnown?.includes(language) || false
                          }
                          onChange={e => {
                            e.stopPropagation();
                            // Don't call handleMultiSelectChange here since label handles it
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
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
                      className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors duration-200 resize-none'
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
                      className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors duration-200 resize-none'
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Error Display */}
            {error && (
              <div className='bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm'>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2'></div>
                  <div>
                    <p className='text-red-800 text-sm font-semibold'>
                      Validation Error
                    </p>
                    <p className='text-red-700 text-sm mt-1'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex items-center justify-between pt-8 border-t border-gray-200'>
              <div className='text-sm text-gray-500'>
                All fields marked with <span className='text-red-500'>*</span>{' '}
                are required
              </div>
              <div className='flex items-center space-x-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={isLoading}
                  className='px-6 py-2 hover:bg-gray-50 transition-colors duration-200'
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isLoading}
                  className='px-6 py-2 hover:bg-gray-50 transition-colors duration-200'
                  onClick={resetForm}
                >
                  Reset Form
                </Button>
                <Button
                  type='submit'
                  loading={isLoading}
                  className={`px-8 py-2 bg-gradient-to-r ${config.color} text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
                  leftIcon={<Plus size={16} />}
                >
                  {isLoading
                    ? `Creating ${config.title.split(' ')[2]}...`
                    : `Create ${config.title.split(' ')[2]} Record`}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
