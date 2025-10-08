'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Landmark,
  Camera,
} from 'lucide-react';
import { Teacher } from '@/components/templates/listConfigurations';
import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';
import Avatar from '@/components/atoms/display/Avatar';
import Dropdown from '@/components/molecules/interactive/Dropdown';
// Use local components instead of importing from molecules/forms
// We'll define these components locally in this file

interface TeacherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Simplified - no parameters needed
  teacher: Teacher | null;
}

// Local Input (label + input)
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  icon,
  onBlur,
  disabled,
  className = '',
  min,
  max,
}) => {
  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          className={`border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 ${icon ? 'pl-10' : ''} ${className}`}
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
  placeholder = 'Select...',
  required,
  disabled,
}) => {
  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className='border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3'
      >
        <option value=''>{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

// Local DatePicker (label + date input)
const LabeledDatePicker: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ label, name, value, onChange, icon, disabled }) => {
  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label}
      </label>
      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
            {icon}
          </div>
        )}
        <input
          type='date'
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
};

interface EditTeacherForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;
  street: string;
  city: string;
  state: string;
  province: string;
  pinCode: string;

  designation: string;
  department: string;
  qualification: string;
  experienceYears: number;
  joinedDate: string;

  // Bank and Legal Information
  bankName: string;
  bankAccountNumber: string;
  bankBranch: string;
  panNumber: string;
  citizenshipNumber: string;

  photo: File | null;
  status: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const STATUSES = ['Active', 'On Leave', 'Inactive', 'Suspended', 'Transferred'];

const DESIGNATION_OPTIONS = [
  { value: '', label: 'Select designation' },
  { value: 'Senior Teacher', label: 'Senior Teacher' },
  { value: 'Assistant Teacher', label: 'Assistant Teacher' },
  { value: 'Head of Department', label: 'Head of Department' },
  { value: 'Principal', label: 'Principal' },
  { value: 'Vice Principal', label: 'Vice Principal' },
];

const TeacherEditModal: React.FC<TeacherEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teacher,
}) => {
  const [formData, setFormData] = useState<EditTeacherForm>({
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
    province: '',
    pinCode: '',

    designation: '',
    department: '',
    qualification: '',
    experienceYears: 0,
    joinedDate: '',

    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    panNumber: '',
    citizenshipNumber: '',

    photo: null,
    status: 'Active',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Populate form when teacher data changes
  useEffect(() => {
    if (teacher && teacher.id) {
      // Validate teacher ID
      const teacherId = String(teacher.id);
      if (!teacherId || teacherId === 'undefined' || teacherId === 'null') {
        console.error('Invalid teacher ID:', teacherId);
        return;
      }

      // Split name into first, middle and last name
      const nameParts = teacher.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName =
        nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      // Get detailed teacher data
      const fetchTeacherDetails = async () => {
        try {
          const response = await teacherService.getTeacherById(teacherId);
          if (response.success && response.data) {
            const teacherData = response.data;

            console.log('API Response for edit:', teacherData);

            // Extract nested data from response
            // These fields are now directly available in the teacher response
            const bankDetails = {
              bankName: teacherData.bankName,
              accountNumber: teacherData.bankAccountNumber,
              branch: teacherData.bankBranch,
              panNumber: teacherData.panNumber,
              citizenshipNumber: teacherData.citizenshipNumber,
            };

            // Address fields are now directly available in the teacher response
            const personalDetails = {
              middleName: teacherData.middleName,
              dateOfBirth: teacherData.dateOfBirth,
              gender: teacherData.gender,
              bloodGroup: teacherData.bloodGroup,
              maritalStatus: teacherData.maritalStatus,
              street: teacherData.street,
              city: teacherData.city,
              state: teacherData.state,
              province: teacherData.province,
              pinCode: teacherData.pinCode,
            };

            const professionalDetails = (teacherData as any).professional || {};

            // Helper function to convert ISO date to yyyy-MM-dd format
            const formatDateForInput = (
              dateString: string | null | undefined,
            ): string => {
              if (!dateString) return '';
              try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0]; // Extract yyyy-MM-dd part
              } catch {
                return '';
              }
            };

            // Use the name parts directly from the API response if available
            setFormData({
              firstName: teacherData.firstName || firstName,
              middleName: teacherData.middleName || middleName || '',
              lastName: teacherData.lastName || lastName,
              email: teacher.email || teacherData.email || '',
              phone: teacherData.phone || teacher.phone || '',
              dateOfBirth: formatDateForInput(
                teacherData.dateOfBirth ||
                  personalDetails.dateOfBirth ||
                  (teacher.dateOfBirth as string),
              ),
              gender:
                teacherData.gender ||
                personalDetails.gender ||
                (teacher.gender as string) ||
                '',
              bloodGroup:
                teacherData.bloodGroup ||
                personalDetails.bloodGroup ||
                (teacher.bloodGroup as string) ||
                '',
              maritalStatus:
                teacherData.maritalStatus ||
                personalDetails.maritalStatus ||
                (teacher.maritalStatus as string) ||
                '',
              street:
                teacherData.street ||
                personalDetails.street ||
                (teacher.street as string) ||
                '',
              city:
                teacherData.city ||
                personalDetails.city ||
                (teacher.city as string) ||
                '',
              state:
                teacherData.state ||
                personalDetails.state ||
                (teacher.state as string) ||
                '',
              province:
                teacherData.province ||
                personalDetails.province ||
                teacherData.state ||
                personalDetails.state ||
                (teacher.province as string) ||
                (teacher.state as string) ||
                '',
              pinCode:
                teacherData.pinCode ||
                personalDetails.pinCode ||
                (teacher.pinCode as string) ||
                '',

              designation:
                teacherData.designation ||
                professionalDetails.designation ||
                teacher.designation ||
                '',
              department:
                teacherData.department ||
                professionalDetails.department ||
                teacher.department ||
                teacher.faculty ||
                '',
              qualification:
                teacherData.qualification ||
                professionalDetails.qualification ||
                teacher.qualification ||
                '',
              // Removed specialization field as requested
              experienceYears:
                teacherData.experienceYears ||
                professionalDetails.experienceYears ||
                teacher.experienceYears ||
                0,
              joinedDate: formatDateForInput(
                teacherData.employmentDate ||
                  (teacherData as any).joiningDate ||
                  professionalDetails.joiningDate ||
                  teacher.joinedDate,
              ),

              // Bank and Legal Information - fix property names from API
              bankName:
                teacherData.bankName ||
                bankDetails.bankName ||
                (teacher.bankName as string) ||
                '',
              bankAccountNumber:
                teacherData.bankAccountNumber ||
                bankDetails.accountNumber ||
                (teacher.bankAccountNumber as string) ||
                '',
              bankBranch:
                teacherData.bankBranch ||
                bankDetails.branch ||
                (teacher.bankBranch as string) ||
                '',
              panNumber:
                teacherData.panNumber ||
                bankDetails.panNumber ||
                (teacher.panNumber as string) ||
                '',
              citizenshipNumber:
                teacherData.citizenshipNumber ||
                bankDetails.citizenshipNumber ||
                (teacher.citizenshipNumber as string) ||
                '',

              photo: null,
              status: teacher.status || 'Active',
            });

            // Set photo preview if available
            if (teacherData.profilePhotoUrl) {
              setPhotoPreview(teacherData.profilePhotoUrl);
            }
          }
        } catch (err) {
          console.error('Error fetching teacher details:', err);

          // Helper function for fallback formatting
          const formatDateForInputFallback = (
            dateString: string | null | undefined,
          ): string => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return '';
              return date.toISOString().split('T')[0];
            } catch {
              return '';
            }
          };

          // Fallback to basic data
          setFormData({
            firstName,
            middleName: middleName || '',
            lastName,
            email: teacher.email || '',
            phone: teacher.phone || '',
            dateOfBirth: formatDateForInputFallback(teacher.dateOfBirth),
            gender: teacher.gender || '',
            bloodGroup: teacher.bloodGroup || '',
            maritalStatus: teacher.maritalStatus || '',
            street: teacher.street || '',
            city: teacher.city || '',
            state: teacher.state || '',
            province: teacher.province || teacher.state || '',
            pinCode: teacher.pinCode || '',

            designation: teacher.designation || '',
            department: teacher.department || teacher.faculty || '',
            qualification: teacher.qualification || '',
            // Removed specialization field as requested
            experienceYears: teacher.experienceYears || 0,
            joinedDate: formatDateForInputFallback(teacher.joinedDate),

            // Bank and Legal Information
            bankName: teacher.bankName || '',
            bankAccountNumber: teacher.bankAccountNumber || '',
            bankBranch: teacher.bankBranch || '',
            panNumber: teacher.panNumber || '',
            citizenshipNumber: teacher.citizenshipNumber || '',

            photo: null,
            status: teacher.status || 'Active',
          });
        }
      };

      fetchTeacherDetails();
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDesignationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      designation: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API - send as JSON, not FormData
      // User data - filter out empty strings
      const userData = Object.fromEntries(
        Object.entries({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Personal data - filter out empty strings
      const personalData = Object.fromEntries(
        Object.entries({
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Professional data - filter out empty strings and ensure proper types
      const professionalData = Object.fromEntries(
        Object.entries({
          designation: formData.designation,
          department: formData.department,
          highestQualification: formData.qualification, // Backend expects 'highestQualification'
          experienceYears:
            formData.experienceYears > 0
              ? Number(formData.experienceYears)
              : undefined, // Ensure it's a number
          joiningDate: formData.joinedDate, // Ensure proper date format YYYY-MM-DD
        }).filter(([key, value]) => {
          if (key === 'experienceYears') return value !== undefined;
          return value && typeof value === 'string' && value.trim() !== '';
        }),
      );

      // Bank details - filter out empty strings
      const bankData = Object.fromEntries(
        Object.entries({
          bankName: formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankBranch: formData.bankBranch,
          panNumber: formData.panNumber,
          citizenshipNumber: formData.citizenshipNumber,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Build the update payload matching UpdateTeacherByAdminDto structure
      const teacherData: any = {};

      // Only include sections with actual data (not empty objects)
      const hasUserData = Object.values(userData).some(
        val => val !== undefined && val !== '',
      );
      const hasPersonalData = Object.values(personalData).some(
        val => val !== undefined && val !== '',
      );
      const hasProfessionalData = Object.values(professionalData).some(
        val => val !== undefined && val !== '',
      );
      const hasBankData = Object.values(bankData).some(
        val => val !== undefined && val !== '',
      );

      if (hasUserData) {
        teacherData.user = userData;
      }

      if (hasPersonalData) {
        teacherData.personal = personalData;
      }

      if (hasProfessionalData) {
        teacherData.professional = professionalData;
      }

      if (hasBankData) {
        teacherData.bankDetails = bankData;
      }

      // Ensure we always have at least one section to update
      if (Object.keys(teacherData).length === 0) {
        throw new Error(
          'No valid data to update. Please make sure to fill in at least one field.',
        );
      }

      const response = await teacherService.updateTeacherByAdmin(
        String(teacher.id),
        teacherData,
      );

      if (response.success) {
        toast.success('Teacher updated successfully', {
          description: `${formData.firstName} ${formData.lastName}'s information has been updated.`,
        });
        // Just notify success - let parent component reload from server
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update teacher');
      }
    } catch (err) {
      const error = err as any;
      console.error('Error updating teacher:', error);

      setError(error?.message || 'Failed to update teacher');
      toast.error('Update failed', {
        description:
          error?.message ||
          'There was a problem updating the teacher information.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto'>
      <div
        className='bg-white rounded-xl w-full max-w-5xl shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-2xl font-bold text-gray-800'>Edit Teacher</h2>
          <p className='text-gray-600 mt-1'>Update teacher information</p>
        </div>

        {/* Profile Photo Section */}
        <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
          <div className='flex items-center space-x-4'>
            <div className='flex-shrink-0'>
              <Avatar
                src={teacher.avatar}
                name={teacher.name}
                role='teacher'
                className='w-16 h-16 rounded-full'
              />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-medium text-gray-900'>
                {teacher.name}
              </h3>
              <p className='text-sm text-gray-600'>
                {teacher.designation || 'Teacher'}
              </p>
              <p className='text-sm text-gray-600'>
                {teacher.department || 'General'}
              </p>
            </div>
            <div className='flex-shrink-0'>
              <div className='flex items-center text-sm text-gray-500'>
                <Camera className='h-4 w-4 mr-1' />
                {teacher.avatar ? 'Profile Photo' : 'No Photo'}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className='p-6 max-h-[70vh] overflow-y-auto'
        >
          <div className='space-y-8'>
            {/* Personal Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <User className='mr-2 h-5 w-5 text-blue-600' />
                Personal Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='First Name'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter first name'
                />

                <LabeledInput
                  label='Middle Name'
                  name='middleName'
                  value={formData.middleName}
                  onChange={handleInputChange}
                  placeholder='Enter middle name (optional)'
                />

                <LabeledInput
                  label='Last Name'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter last name'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='Email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter email address'
                  icon={<Mail className='h-4 w-4' />}
                />

                <LabeledInput
                  label='Phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter phone number'
                  icon={<Phone className='h-4 w-4' />}
                />

                <LabeledDatePicker
                  label='Date of Birth'
                  name='dateOfBirth'
                  value={formData.dateOfBirth}
                  onChange={value => handleDateChange('dateOfBirth', value)}
                  icon={<Calendar className='h-4 w-4' />}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
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
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  options={MARITAL_STATUS}
                  placeholder='Select marital status'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <div>
                  <h4 className='text-sm font-medium mb-3 text-gray-700'>
                    Address Details
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='md:col-span-2'>
                      <LabeledInput
                        label='Street Address'
                        name='street'
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder='Enter street address'
                        icon={<MapPin className='h-4 w-4' />}
                      />
                    </div>
                    <LabeledInput
                      label='City'
                      name='city'
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder='Enter city'
                    />
                    <LabeledInput
                      label='State'
                      name='state'
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder='Enter state'
                    />
                    <LabeledInput
                      label='Province'
                      name='province'
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder='Enter province'
                    />
                    <LabeledInput
                      label='PIN/ZIP Code'
                      name='pinCode'
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      placeholder='Enter PIN code'
                    />
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-medium mb-3 text-gray-700'>
                    Profile Photo
                  </h4>
                  <div className='flex items-center gap-4'>
                    <div className='w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden'>
                      {photoPreview ? (
                        <div
                          style={{
                            backgroundImage: `url(${photoPreview})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            width: '100%',
                            height: '100%',
                          }}
                          aria-label='Teacher photo'
                        />
                      ) : (
                        <User className='h-10 w-10 text-gray-400' />
                      )}
                    </div>
                    <div>
                      <label className='block mb-2'>
                        <span className='sr-only'>Choose photo</span>
                        <input
                          type='file'
                          className='block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100'
                          accept='image/*'
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className='text-xs text-gray-500'>
                        JPG, PNG or GIF up to 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Briefcase className='mr-2 h-5 w-5 text-blue-600' />
                Professional Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium leading-none mb-2 block'>
                    Designation
                  </label>
                  <Dropdown
                    type='filter'
                    options={DESIGNATION_OPTIONS}
                    selectedValue={formData.designation}
                    onSelect={handleDesignationChange}
                    placeholder='Select designation'
                    className='w-full'
                  />
                </div>

                <LabeledInput
                  label='Department'
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder='Enter department'
                />

                <LabeledDatePicker
                  label='Joining Date'
                  name='joinedDate'
                  value={formData.joinedDate}
                  onChange={value => handleDateChange('joinedDate', value)}
                  icon={<Calendar className='h-4 w-4' />}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='Qualification'
                  name='qualification'
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder='Enter qualification'
                  icon={<GraduationCap className='h-4 w-4' />}
                />

                <LabeledInput
                  label='Experience (Years)'
                  name='experienceYears'
                  type='number'
                  value={formData.experienceYears.toString()}
                  onChange={handleInputChange}
                  min='0'
                  placeholder='Enter years of experience'
                />
              </div>

              {/* Bank and Legal Information */}
              <div className='mt-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                  <Landmark className='mr-2 h-5 w-5 text-blue-600' />
                  Bank & Legal Information
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <LabeledInput
                    label='Bank Name'
                    name='bankName'
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder='Enter bank name'
                  />

                  <LabeledInput
                    label='Bank Account Number'
                    name='bankAccountNumber'
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    placeholder='Enter account number'
                  />

                  <LabeledInput
                    label='Bank Branch'
                    name='bankBranch'
                    value={formData.bankBranch}
                    onChange={handleInputChange}
                    placeholder='Enter branch name'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                  <LabeledInput
                    label='PAN Number'
                    name='panNumber'
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder='Enter PAN number'
                  />

                  <LabeledInput
                    label='Citizenship Number'
                    name='citizenshipNumber'
                    value={formData.citizenshipNumber}
                    onChange={handleInputChange}
                    placeholder='Enter citizenship number'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-1 gap-4 mt-4'>
                <LabeledSelect
                  label='Status'
                  name='status'
                  value={formData.status}
                  onChange={handleInputChange}
                  options={STATUSES}
                  placeholder='Select status'
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <svg
                    className='animate-spin h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherEditModal;
