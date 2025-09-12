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
  GraduationCap,
  Users,
  Heart,
  Loader2,
  Camera,
} from 'lucide-react';
import { Student } from '@/components/templates/listConfigurations';
import {
  studentService,
  StudentResponse,
} from '@/api/services/student.service';
import { classService } from '@/api/services/class.service';
import { toast } from 'sonner';
import EthnicitySelect from '@/components/molecules/form/EthnicitySelect';
import Avatar from '@/components/atoms/display/Avatar';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null;
}

// Local Input Component (label + input)
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
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

// Local Select Component (label + select)
const LabeledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[] | { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
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
        <option value=''>{placeholder || `Select ${label}`}</option>
        {options.map(option => (
          <option
            key={typeof option === 'string' ? option : option.value}
            value={typeof option === 'string' ? option : option.value}
          >
            {typeof option === 'string' ? option : option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Local Textarea Component (label + textarea)
const LabeledTextarea: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = ({ label, name, value, onChange, placeholder, required, rows = 3 }) => {
  return (
    <div>
      <label className='text-sm font-medium leading-none mb-2 block'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className='border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-3 resize-vertical'
      />
    </div>
  );
};

interface EditStudentForm {
  // User Information
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;

  // Personal Information
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  ethnicity: string;
  address: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;

  // Academic Information
  classId: string;
  rollNumber: string;
  admissionDate: string;
  studentId: string;
  academicStatus: string;
  transportMode: string;

  // Parent Information
  fatherFirstName: string;
  fatherMiddleName: string;
  fatherLastName: string;
  fatherEmail: string;
  fatherPhone: string;
  fatherOccupation: string;

  motherFirstName: string;
  motherMiddleName: string;
  motherLastName: string;
  motherEmail: string;
  motherPhone: string;
  motherOccupation: string;

  // Additional Information
  medicalConditions: string;
  allergies: string;
  specialNeeds: string;
  interests: string;
  bio: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];
const ACADEMIC_STATUSES = ['active', 'suspended', 'graduated', 'transferred'];
const TRANSPORT_MODES = ['bus', 'private', 'walk', 'bicycle', 'other'];

const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  student,
}) => {
  const [formData, setFormData] = useState<EditStudentForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    ethnicity: '',
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
    fatherEmail: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherFirstName: '',
    motherMiddleName: '',
    motherLastName: '',
    motherEmail: '',
    motherPhone: '',
    motherOccupation: '',
    medicalConditions: '',
    allergies: '',
    specialNeeds: '',
    interests: '',
    bio: '',
  });

  const [availableClasses, setAvailableClasses] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detailed student data and guardians
  const [studentDetails, setStudentDetails] = useState<StudentResponse | null>(
    null,
  );
  const [existingGuardians, setExistingGuardians] = useState<
    Array<{
      id: string;
      fullName: string;
      phone: string;
      email: string;
      relation: string;
      hasUserAccount?: boolean;
    }>
  >([]);

  // Guardian form state for adding new guardians
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    relation: '',
    occupation: '',
    createUserAccount: false,
  });

  // Guardian editing state
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(
    null,
  );
  const [editingGuardian, setEditingGuardian] = useState({
    fullName: '',
    phone: '',
    email: '',
    relation: '',
    occupation: '',
  });

  // Load available classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await classService.getAllClasses();
        if (response.success && response.data) {
          const classOptions = response.data.map(
            (cls: { id: string; grade: number; section?: string }) => ({
              value: cls.id,
              label: `Grade ${cls.grade} ${cls.section || 'A'}`,
            }),
          );
          setAvailableClasses(classOptions);
        }
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };

    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Load detailed student data including guardians
  useEffect(() => {
    const loadStudentDetails = async () => {
      if (!student?.id) return;

      try {
        const response = await studentService.getStudentById(
          String(student.id),
        );
        if (response.success && response.data) {
          setStudentDetails(response.data);
          setExistingGuardians(response.data.guardians || []);
        }
      } catch (error) {
        console.error('Failed to load student details:', error);
      }
    };

    if (isOpen && student) {
      loadStudentDetails();
    }
  }, [isOpen, student]);

  // Load student data when modal opens
  useEffect(() => {
    if (isOpen && student) {
      const loadStudentDetails = async () => {
        try {
          const response = await studentService.getStudentById(
            String(student.id),
          );
          if (response.success && response.data) {
            const details = response.data;

            // Parse name from full name
            const nameParts = student.name?.split(' ') || [];
            const firstName = nameParts[0] || '';
            const lastName =
              nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            const middleName =
              nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

            // Format date for input
            const formatDateForInput = (
              dateStr: string | undefined,
            ): string => {
              if (!dateStr) return '';
              try {
                const date = new Date(dateStr);
                return date.toISOString().split('T')[0];
              } catch {
                return '';
              }
            };

            setFormData({
              firstName,
              middleName,
              lastName,
              email: details.email || '',
              phone: details.phone || '',
              dateOfBirth: formatDateForInput(details.dateOfBirth),
              gender: details.gender || '',
              bloodGroup: details.bloodGroup || '',
              ethnicity: details.ethnicity || '',
              address: details.address || '',
              street: details.street || '',
              city: details.city || '',
              state: details.state || '',
              pinCode: details.pinCode || '',
              classId: String(details.classId || ''),
              rollNumber: String(details.rollNumber || ''),
              admissionDate: formatDateForInput(details.admissionDate),
              studentId: details.studentId || '',
              academicStatus: details.academicStatus || 'active',
              transportMode: details.transportMode || '',
              fatherFirstName: details.fatherFirstName || '',
              fatherMiddleName: details.fatherMiddleName || '',
              fatherLastName: details.fatherLastName || '',
              fatherEmail: details.fatherEmail || '',
              fatherPhone: details.fatherPhone || '',
              fatherOccupation: details.fatherOccupation || '',
              motherFirstName: details.motherFirstName || '',
              motherMiddleName: details.motherMiddleName || '',
              motherLastName: details.motherLastName || '',
              motherEmail: details.motherEmail || '',
              motherPhone: details.motherPhone || '',
              motherOccupation: details.motherOccupation || '',
              medicalConditions: details.medicalConditions || '',
              allergies: details.allergies || '',
              specialNeeds: details.specialNeeds || '',
              interests: details.interests || '',
              bio: details.bio || '',
            });
          }
        } catch (err) {
          console.error('Error loading student details:', err);
          setError('Failed to load student details');
        }
      };

      loadStudentDetails();
    }
  }, [isOpen, student?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewGuardianChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setNewGuardian(prev => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddGuardian = async () => {
    try {
      if (!student?.id) {
        toast.error('Student ID not found');
        return;
      }

      // Validate required fields
      if (
        !newGuardian.firstName ||
        !newGuardian.lastName ||
        !newGuardian.phone ||
        !newGuardian.email ||
        !newGuardian.relation
      ) {
        toast.error('Please fill in all required guardian fields');
        return;
      }

      setIsLoading(true);

      // Prepare guardian data for API call
      const guardianData = {
        guardians: [
          {
            firstName: newGuardian.firstName,
            middleName: newGuardian.middleName || undefined,
            lastName: newGuardian.lastName,
            phone: newGuardian.phone,
            email: newGuardian.email,
            relation: newGuardian.relation,
            occupation: newGuardian.occupation || undefined,
            createUserAccount: newGuardian.createUserAccount,
          },
        ],
      };

      console.log('Adding guardian to student:', guardianData);

      // Call API to add guardian
      const response = await studentService.addGuardianToStudent(
        String(student.id),
        guardianData,
      );

      if (response.success) {
        toast.success('Guardian added successfully!');

        // Display credentials if account was created
        if (
          newGuardian.createUserAccount &&
          response.data?.guardianCredentials
        ) {
          const credentials = response.data.guardianCredentials[0];
          console.log('🛡️ GUARDIAN ACCOUNT CREATED:');
          console.log(`Guardian Email: ${credentials.email}`);
          console.log(`Guardian Password: ${credentials.temporaryPassword}`);
          console.log(`Guardian Name: ${credentials.fullName}`);
          console.log(`Guardian ID: ${credentials.id}`);

          toast.success(
            `Guardian account created! Email: ${credentials.email}`,
          );
        }

        // Reset form and reload data
        setNewGuardian({
          firstName: '',
          middleName: '',
          lastName: '',
          phone: '',
          email: '',
          relation: '',
          occupation: '',
          createUserAccount: false,
        });
        setIsAddingGuardian(false);

        // Reload student details
        const updatedResponse = await studentService.getStudentById(
          String(student.id),
        );
        if (updatedResponse.success && updatedResponse.data) {
          setStudentDetails(updatedResponse.data);
          setExistingGuardians(updatedResponse.data.guardians || []);
        }

        onSuccess(); // Refresh parent component
      } else {
        toast.error(response.message || 'Failed to add guardian');
      }
    } catch (error) {
      console.error('Error adding guardian:', error);
      toast.error('Failed to add guardian');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGuardian = (guardian: any) => {
    setEditingGuardianId(guardian.id);
    setEditingGuardian({
      fullName: guardian.fullName,
      phone: guardian.phone,
      email: guardian.email,
      relation: guardian.relation,
      occupation: guardian.occupation || '',
    });
  };

  const handleEditingGuardianChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setEditingGuardian(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateGuardian = async () => {
    try {
      if (!student?.id || !editingGuardianId) {
        toast.error('Student or Guardian ID not found');
        return;
      }

      // Validate required fields
      if (
        !editingGuardian.fullName ||
        !editingGuardian.phone ||
        !editingGuardian.email ||
        !editingGuardian.relation
      ) {
        toast.error('Please fill in all required guardian fields');
        return;
      }

      setIsLoading(true);

      console.log('Updating guardian:', editingGuardian);

      // Call API to update guardian
      const response = await studentService.updateGuardian(
        String(student.id),
        editingGuardianId,
        editingGuardian,
      );

      if (response.success) {
        toast.success('Guardian updated successfully!');

        // Reset editing state
        setEditingGuardianId(null);
        setEditingGuardian({
          fullName: '',
          phone: '',
          email: '',
          relation: '',
          occupation: '',
        });

        // Reload student details
        const updatedResponse = await studentService.getStudentById(
          String(student.id),
        );
        if (updatedResponse.success && updatedResponse.data) {
          setStudentDetails(updatedResponse.data);
          setExistingGuardians(updatedResponse.data.guardians || []);
        }

        onSuccess(); // Refresh parent component
      } else {
        toast.error(response.message || 'Failed to update guardian');
      }
    } catch (error) {
      console.error('Error updating guardian:', error);
      toast.error('Failed to update guardian');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditGuardian = () => {
    setEditingGuardianId(null);
    setEditingGuardian({
      fullName: '',
      phone: '',
      email: '',
      relation: '',
      occupation: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading || !student?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API following the teacher modal pattern
      // User data - always include phone field, filter others
      const userEntries = Object.entries({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone, // Always include phone even if empty
      });

      const userData = Object.fromEntries(
        userEntries.filter(([key, value]) => {
          // Always include phone field
          if (key === 'phone') return true;
          // Filter out other empty fields
          return value && value.trim() !== '';
        }),
      );

      // Personal data - filter out empty strings
      const personalData = Object.fromEntries(
        Object.entries({
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          ethnicity: formData.ethnicity,
          address: formData.address,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Academic data - filter out empty strings
      const academicData = Object.fromEntries(
        Object.entries({
          classId: formData.classId,
          rollNumber: formData.rollNumber,
          admissionDate: formData.admissionDate,
          studentId: formData.studentId,
          academicStatus: formData.academicStatus,
          transportMode: formData.transportMode,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Parent data - always include phone fields, filter others
      const parentEntries = Object.entries({
        fatherFirstName: formData.fatherFirstName,
        fatherMiddleName: formData.fatherMiddleName,
        fatherLastName: formData.fatherLastName,
        fatherEmail: formData.fatherEmail,
        fatherPhone: formData.fatherPhone,
        fatherOccupation: formData.fatherOccupation,
        motherFirstName: formData.motherFirstName,
        motherMiddleName: formData.motherMiddleName,
        motherLastName: formData.motherLastName,
        motherEmail: formData.motherEmail,
        motherPhone: formData.motherPhone,
        motherOccupation: formData.motherOccupation,
      });

      const parentData = Object.fromEntries(
        parentEntries.filter(([key, value]) => {
          // Always include phone fields
          if (key === 'fatherPhone' || key === 'motherPhone') return true;
          // Filter out other empty fields
          return value && value.trim() !== '';
        }),
      );

      // Additional data - filter out empty strings
      const additionalData = Object.fromEntries(
        Object.entries({
          medicalConditions: formData.medicalConditions,
          allergies: formData.allergies,
          specialNeeds: formData.specialNeeds,
          interests: formData.interests,
          bio: formData.bio,
        }).filter(([_, value]) => value && value.trim() !== ''),
      );

      // Build the update payload
      const studentData: Record<
        string,
        Record<string, string | undefined>
      > = {};

      // Only include sections with data - always include user section if phone is present
      if (Object.values(userData).some(val => val) || 'phone' in userData) {
        studentData.user = userData;
      }

      if (Object.values(personalData).some(val => val)) {
        studentData.personal = personalData;
      }

      if (Object.values(academicData).some(val => val)) {
        studentData.academic = academicData;
      }

      if (
        Object.values(parentData).some(val => val) ||
        'fatherPhone' in parentData ||
        'motherPhone' in parentData
      ) {
        studentData.parentInfo = parentData;
      }

      if (Object.values(additionalData).some(val => val)) {
        studentData.additional = additionalData;
      }

      console.log('Sending student update data:', studentData);
      console.log(
        'User data contains phone:',
        'phone' in (studentData.user || {}),
      );
      console.log('Phone value being sent:', studentData.user?.phone);
      console.log('Original form data phone:', formData.phone);
      console.log('User data object:', studentData.user);

      const response = await studentService.updateStudentByAdmin(
        String(student.id),
        studentData,
      );

      if (response.success) {
        toast.success('Student updated successfully', {
          description: `${formData.firstName} ${formData.lastName}'s information has been updated.`,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update student');
      }
    } catch (err: unknown) {
      console.error('Error updating student:', err);
      const errorMessage = (err as Error).message || 'Failed to update student';
      setError(errorMessage);
      toast.error('Update failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    // Backdrop wrapper: uses backdrop-filter blur and a semi-opaque overlay to blur the page behind the modal
    <div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
      {/* Semi transparent dark overlay with backdrop blur */}
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-sm'
        aria-hidden='true'
      />

      <div className='relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Edit Student
            </h2>
            <p className='text-gray-600 mt-1'>Update student information</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            disabled={isLoading}
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Profile Photo Section */}
        <div className='px-6 py-4 bg-gray-50 border-b border-gray-200'>
          <div className='flex items-center space-x-4'>
            <div className='flex-shrink-0'>
              <Avatar
                src={student.avatar}
                name={student.name}
                role='student'
                className='w-16 h-16 rounded-full'
                context='student-edit-modal'
              />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-medium text-gray-900'>
                {student.name}
              </h3>
              <p className='text-sm text-gray-600'>
                Student ID: {student.studentId || student.rollNo}
              </p>
              <p className='text-sm text-gray-600'>
                {typeof student.class === 'string'
                  ? student.class
                  : 'Class not assigned'}
              </p>
            </div>
            <div className='flex-shrink-0'>
              <div className='flex items-center text-sm text-gray-500'>
                <Camera className='h-4 w-4 mr-1' />
                {student.avatar ? 'Profile Photo' : 'No Photo'}
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
                  type='tel'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                  icon={<Phone className='h-4 w-4' />}
                />

                <LabeledInput
                  label='Date of Birth'
                  name='dateOfBirth'
                  type='date'
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  icon={<Calendar className='h-4 w-4' />}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
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

                <EthnicitySelect
                  label='Ethnicity'
                  value={formData.ethnicity}
                  onChange={value =>
                    setFormData(prev => ({ ...prev, ethnicity: value }))
                  }
                  placeholder='Select ethnicity'
                  className='mt-4'
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <MapPin className='mr-2 h-5 w-5 text-blue-600' />
                Address Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledTextarea
                  label='Full Address'
                  name='address'
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder='Enter complete address'
                  rows={3}
                />

                <div className='space-y-4'>
                  <LabeledInput
                    label='Street'
                    name='street'
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder='Enter street'
                  />
                  <LabeledInput
                    label='City'
                    name='city'
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder='Enter city'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledInput
                  label='State'
                  name='state'
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder='Enter state'
                />
                <LabeledInput
                  label='PIN Code'
                  name='pinCode'
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  placeholder='Enter PIN code'
                />
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <GraduationCap className='mr-2 h-5 w-5 text-blue-600' />
                Academic Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledSelect
                  label='Class'
                  name='classId'
                  value={formData.classId}
                  onChange={handleInputChange}
                  options={availableClasses}
                  placeholder='Select class'
                  required
                />

                <LabeledInput
                  label='Roll Number'
                  name='rollNumber'
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder='Enter roll number'
                />

                <LabeledInput
                  label='Student ID'
                  name='studentId'
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder='Enter student ID'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <LabeledInput
                  label='Admission Date'
                  name='admissionDate'
                  type='date'
                  value={formData.admissionDate}
                  onChange={handleInputChange}
                  icon={<Calendar className='h-4 w-4' />}
                />

                <LabeledSelect
                  label='Academic Status'
                  name='academicStatus'
                  value={formData.academicStatus}
                  onChange={handleInputChange}
                  options={ACADEMIC_STATUSES}
                  placeholder='Select status'
                />

                <LabeledSelect
                  label='Transport Mode'
                  name='transportMode'
                  value={formData.transportMode}
                  onChange={handleInputChange}
                  options={TRANSPORT_MODES}
                  placeholder='Select transport mode'
                />
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Users className='mr-2 h-5 w-5 text-blue-600' />
                Parent Information
              </h3>

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
                    />
                    <LabeledInput
                      label='Middle Name'
                      name='fatherMiddleName'
                      value={formData.fatherMiddleName}
                      onChange={handleInputChange}
                      placeholder='Enter middle name'
                    />
                    <LabeledInput
                      label='Last Name'
                      name='fatherLastName'
                      value={formData.fatherLastName}
                      onChange={handleInputChange}
                      placeholder='Enter last name'
                    />
                  </div>
                  <LabeledInput
                    label='Father Email'
                    name='fatherEmail'
                    type='email'
                    value={formData.fatherEmail}
                    onChange={handleInputChange}
                    placeholder='Enter father email'
                    icon={<Mail className='h-4 w-4' />}
                  />
                  <LabeledInput
                    label='Father Phone'
                    name='fatherPhone'
                    type='tel'
                    value={formData.fatherPhone}
                    onChange={handleInputChange}
                    placeholder='Enter father phone'
                    icon={<Phone className='h-4 w-4' />}
                  />
                  <LabeledInput
                    label='Father Occupation'
                    name='fatherOccupation'
                    value={formData.fatherOccupation}
                    onChange={handleInputChange}
                    placeholder='Enter father occupation'
                  />
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
                    />
                    <LabeledInput
                      label='Middle Name'
                      name='motherMiddleName'
                      value={formData.motherMiddleName}
                      onChange={handleInputChange}
                      placeholder='Enter middle name'
                    />
                    <LabeledInput
                      label='Last Name'
                      name='motherLastName'
                      value={formData.motherLastName}
                      onChange={handleInputChange}
                      placeholder='Enter last name'
                    />
                  </div>
                  <LabeledInput
                    label='Mother Email'
                    name='motherEmail'
                    type='email'
                    value={formData.motherEmail}
                    onChange={handleInputChange}
                    placeholder='Enter mother email'
                    icon={<Mail className='h-4 w-4' />}
                  />
                  <LabeledInput
                    label='Mother Phone'
                    name='motherPhone'
                    type='tel'
                    value={formData.motherPhone}
                    onChange={handleInputChange}
                    placeholder='Enter mother phone'
                    icon={<Phone className='h-4 w-4' />}
                  />
                  <LabeledInput
                    label='Mother Occupation'
                    name='motherOccupation'
                    value={formData.motherOccupation}
                    onChange={handleInputChange}
                    placeholder='Enter mother occupation'
                  />
                </div>
              </div>
            </div>

            {/* Medical & Additional Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Heart className='mr-2 h-5 w-5 text-blue-600' />
                Medical & Additional Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledTextarea
                  label='Medical Conditions'
                  name='medicalConditions'
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  placeholder='Enter any medical conditions'
                />

                <LabeledTextarea
                  label='Allergies'
                  name='allergies'
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder='Enter any allergies'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                <LabeledTextarea
                  label='Special Needs'
                  name='specialNeeds'
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  placeholder='Enter any special needs'
                />

                <LabeledTextarea
                  label='Interests & Hobbies'
                  name='interests'
                  value={formData.interests}
                  onChange={handleInputChange}
                  placeholder='Enter interests and hobbies'
                />
              </div>

              <div className='mt-4'>
                <LabeledTextarea
                  label='Bio / Additional Notes'
                  name='bio'
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder='Enter additional notes about the student'
                  rows={4}
                />
              </div>
            </div>

            {/* Guardian Information */}
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Users className='mr-2 h-5 w-5 text-green-600' />
                Guardian Information
              </h3>

              {existingGuardians && existingGuardians.length > 0 ? (
                <div className='space-y-4'>
                  <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
                    <p className='text-sm text-green-800'>
                      <strong>Existing Guardians:</strong> This student has{' '}
                      {existingGuardians.length} guardian(s) on record.
                    </p>
                  </div>

                  {existingGuardians.map((guardian, index) => (
                    <div
                      key={guardian.id || index}
                      className='bg-white border-l-4 border-green-400 p-4 rounded-r-lg shadow-sm'
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <h5 className='font-medium text-gray-900 flex items-center'>
                          <span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2'>
                            Guardian {index + 1}
                          </span>
                          <span className='text-gray-600'>
                            ({guardian.relation})
                          </span>
                          {guardian.hasUserAccount && (
                            <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs ml-2'>
                              Has Login Account
                            </span>
                          )}
                        </h5>
                        {editingGuardianId !== guardian.id && (
                          <button
                            type='button'
                            onClick={() => handleEditGuardian(guardian)}
                            className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {editingGuardianId === guardian.id ? (
                        // Edit Form
                        <div className='space-y-4'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <LabeledInput
                              label='Full Name'
                              name='fullName'
                              value={editingGuardian.fullName}
                              onChange={handleEditingGuardianChange}
                              required
                              placeholder='Enter full name'
                            />
                            <LabeledInput
                              label='Phone'
                              name='phone'
                              value={editingGuardian.phone}
                              onChange={handleEditingGuardianChange}
                              required
                              placeholder='Enter phone number'
                              icon={<Phone className='h-4 w-4' />}
                            />
                          </div>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <LabeledInput
                              label='Email'
                              name='email'
                              type='email'
                              value={editingGuardian.email}
                              onChange={handleEditingGuardianChange}
                              required
                              placeholder='Enter email address'
                              icon={<Mail className='h-4 w-4' />}
                            />
                            <LabeledInput
                              label='Relation'
                              name='relation'
                              value={editingGuardian.relation}
                              onChange={handleEditingGuardianChange}
                              required
                              placeholder='e.g., Uncle, Aunt, Grandfather'
                            />
                          </div>
                          {guardian.hasUserAccount && (
                            <LabeledInput
                              label='Occupation'
                              name='occupation'
                              value={editingGuardian.occupation}
                              onChange={handleEditingGuardianChange}
                              placeholder='Enter occupation'
                            />
                          )}
                          <div className='flex justify-end space-x-3'>
                            <button
                              type='button'
                              onClick={handleCancelEditGuardian}
                              className='px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50'
                            >
                              Cancel
                            </button>
                            <button
                              type='button'
                              onClick={handleUpdateGuardian}
                              disabled={isLoading}
                              className='inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50'
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className='mr-1 h-3 w-3' />
                                  Save
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display View
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                          <div>
                            <span className='text-gray-600'>Name:</span>
                            <p className='font-medium'>{guardian.fullName}</p>
                          </div>
                          <div>
                            <span className='text-gray-600'>Email:</span>
                            <p className='font-medium'>{guardian.email}</p>
                          </div>
                          <div>
                            <span className='text-gray-600'>Phone:</span>
                            <p className='font-medium'>{guardian.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <p className='text-sm text-gray-600 mb-2'>
                    <strong>No Guardians:</strong> This student doesn't have any
                    guardians on record.
                  </p>
                </div>
              )}

              {/* Add New Guardian Section */}
              <div className='mt-6'>
                {!isAddingGuardian ? (
                  <button
                    type='button'
                    onClick={() => setIsAddingGuardian(true)}
                    className='inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  >
                    <Users className='mr-2 h-4 w-4' />
                    Add New Guardian
                  </button>
                ) : (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                    <h4 className='text-sm font-semibold text-gray-900 mb-4 flex items-center'>
                      <Users className='mr-2 h-4 w-4 text-green-600' />
                      Add New Guardian
                    </h4>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                      <LabeledInput
                        label='First Name'
                        name='firstName'
                        value={newGuardian.firstName}
                        onChange={handleNewGuardianChange}
                        required
                        placeholder='Enter first name'
                      />
                      <LabeledInput
                        label='Middle Name'
                        name='middleName'
                        value={newGuardian.middleName}
                        onChange={handleNewGuardianChange}
                        placeholder='Enter middle name'
                      />
                      <LabeledInput
                        label='Last Name'
                        name='lastName'
                        value={newGuardian.lastName}
                        onChange={handleNewGuardianChange}
                        required
                        placeholder='Enter last name'
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <LabeledInput
                        label='Email'
                        name='email'
                        type='email'
                        value={newGuardian.email}
                        onChange={handleNewGuardianChange}
                        required
                        placeholder='Enter email address'
                        icon={<Mail className='h-4 w-4' />}
                      />
                      <LabeledInput
                        label='Phone'
                        name='phone'
                        value={newGuardian.phone}
                        onChange={handleNewGuardianChange}
                        required
                        placeholder='Enter phone number'
                        icon={<Phone className='h-4 w-4' />}
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <LabeledInput
                        label='Relation'
                        name='relation'
                        value={newGuardian.relation}
                        onChange={handleNewGuardianChange}
                        required
                        placeholder='e.g., Uncle, Aunt, Grandfather'
                      />
                      <LabeledInput
                        label='Occupation'
                        name='occupation'
                        value={newGuardian.occupation}
                        onChange={handleNewGuardianChange}
                        placeholder='Enter occupation'
                      />
                    </div>

                    <div className='mb-4'>
                      <label className='flex items-center text-sm'>
                        <input
                          type='checkbox'
                          name='createUserAccount'
                          checked={newGuardian.createUserAccount}
                          onChange={handleNewGuardianChange}
                          className='mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                        />
                        <span className='font-medium'>
                          Create Guardian User Account
                        </span>
                      </label>
                      <p className='text-xs text-gray-500 mt-1 ml-6'>
                        Check this box to create a login account for the
                        guardian with generated credentials.
                      </p>
                    </div>

                    <div className='flex justify-end space-x-3'>
                      <button
                        type='button'
                        onClick={() => {
                          setIsAddingGuardian(false);
                          setNewGuardian({
                            firstName: '',
                            middleName: '',
                            lastName: '',
                            phone: '',
                            email: '',
                            relation: '',
                            occupation: '',
                            createUserAccount: false,
                          });
                        }}
                        className='px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={handleAddGuardian}
                        disabled={isLoading}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Save className='mr-2 h-4 w-4' />
                            Add Guardian
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className='flex justify-end space-x-3 p-6 border-t border-gray-200'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type='submit'
            onClick={handleSubmit}
            disabled={isLoading}
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center'
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Saving...
              </>
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEditModal;
