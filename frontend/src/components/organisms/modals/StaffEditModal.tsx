'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, Camera } from 'lucide-react';
import { Staff } from '@/components/templates/listConfigurations';
import { staffService } from '@/api/services/staff.service';
import { toast } from 'sonner';
import Avatar from '@/components/atoms/display/Avatar';

// Use local components instead of importing from molecules/forms

interface StaffEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStaff: Record<string, unknown>) => void;
  staff: Staff | null;
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
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className='block text-sm font-medium text-gray-700 mb-1'
      >
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>
      <div className='relative rounded-md shadow-sm'>
        {icon && (
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            icon ? 'pl-10' : 'pl-3'
          } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
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
  options: { value: string; label: string }[];
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
      <label
        htmlFor={name}
        className='block text-sm font-medium text-gray-700 mb-1'
      >
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>
      <select
        id={name}
        name={name}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          disabled ? 'bg-gray-100 text-gray-500' : ''
        }`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value=''>{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Local Checkbox component
const LabeledCheckbox: React.FC<{
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ label, name, checked, onChange, disabled }) => {
  return (
    <div className='flex items-center'>
      <input
        id={name}
        name={name}
        type='checkbox'
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
      />
      <label htmlFor={name} className='ml-2 block text-sm text-gray-700'>
        {label}
      </label>
    </div>
  );
};

// Local FileUpload component
const FileUploadField: React.FC<{
  label: string;
  onChange: (file: File | null) => void;
  accept?: string;
}> = ({ label, onChange, accept }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || '');
    onChange(file);
  };

  return (
    <div>
      <label className='block text-sm font-medium text-gray-700 mb-1'>
        {label}
      </label>
      <div className='mt-1 flex items-center'>
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className='sr-only'
        />
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Choose File
        </button>
        <span className='ml-3 text-sm text-gray-500'>
          {fileName || 'No file selected'}
        </span>
      </div>
    </div>
  );
};

const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    qualification: '',
    experienceYears: '',
    joiningDate: '',
    employmentDate: '',
    status: 'Active',
    gender: '',
    bloodGroup: '',
    maritalStatus: '',
    address: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    panNumber: '',
    citizenshipNumber: '',
    basicSalary: '',
    allowances: '',
    totalSalary: '',
    employeeId: '',
    hasLoginAccount: false,
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  // Options for dropdown selects
  const departmentOptions = [
    { value: 'administration', label: 'Administration' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'library', label: 'Library' },
    { value: 'canteen', label: 'Canteen' },
    { value: 'transport', label: 'Transport' },
    { value: 'it_support', label: 'IT Support' },
  ];

  const designationOptions = [
    { value: 'office-manager', label: 'Office Manager' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'security-officer', label: 'Security Officer' },
    { value: 'it-support', label: 'IT Support' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'canteen-staff', label: 'Canteen Staff' },
    { value: 'driver', label: 'Driver' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'Terminated', label: 'Terminated' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  const maritalStatusOptions = [
    { value: 'Single', label: 'Single' },
    { value: 'Married', label: 'Married' },
    { value: 'Divorced', label: 'Divorced' },
    { value: 'Widowed', label: 'Widowed' },
  ];

  // Load staff data when modal opens
  useEffect(() => {
    if (isOpen && staff && staff.id) {
      setLoading(true);
      setError(null);

      // Validate staff ID before making API call
      const staffId = String(staff.id);
      if (!staffId || staffId === 'undefined' || staffId === 'null') {
        setError('Invalid staff ID');
        setLoading(false);
        return;
      }

      // Fetch detailed staff data from API
      staffService
        .getStaffById(staffId)
        .then(response => {
          if (response.success && response.data) {
            console.log('API Response for edit:', response.data);

            // Extract name parts from API response or use defaults
            const nameParts = staff.name ? staff.name.split(' ') : ['', '', ''];
            const firstName = response.data.firstName || nameParts[0] || '';
            const lastName =
              response.data.lastName || nameParts[nameParts.length - 1] || '';
            let middleName = '';
            if (response.data.middleName) {
              middleName = response.data.middleName;
            } else if (nameParts.length > 2) {
              middleName = nameParts.slice(1, -1).join(' ');
            }

            // Update form data with API response
            setFormData(() => ({
              firstName,
              middleName,
              lastName,
              email: response.data.email || staff.email || '',
              phone: response.data.phone || staff.phone || '',
              designation: response.data.designation || staff.designation || '',
              department: response.data.department || staff.department || '',
              qualification:
                response.data.qualification || staff.qualification || '',
              experienceYears: response.data.experienceYears?.toString() || '',
              joiningDate: response.data.joiningDate
                ? response.data.joiningDate.split('T')[0]
                : staff.joinedDate || '',
              employmentDate: response.data.employmentDate
                ? response.data.employmentDate.split('T')[0]
                : staff.joinedDate || '',
              status:
                response.data.employmentStatus === 'active'
                  ? 'Active'
                  : response.data.employmentStatus === 'on_leave'
                    ? 'On Leave'
                    : staff.status || 'Active',
              gender: response.data.gender || '',
              bloodGroup: response.data.bloodGroup || '',
              maritalStatus: response.data.maritalStatus || '',
              address: response.data.address || '',
              street: response.data.street || '',
              city: response.data.city || '',
              state: response.data.state || '',
              pinCode: response.data.pinCode || '',
              bankName: response.data.bankName || '',
              bankAccountNumber: response.data.bankAccountNumber || '',
              bankBranch: response.data.bankBranch || '',
              panNumber: response.data.panNumber || '',
              citizenshipNumber: response.data.citizenshipNumber || '',
              basicSalary: response.data.basicSalary?.toString() || '',
              allowances: response.data.allowances?.toString() || '',
              totalSalary: response.data.totalSalary?.toString() || '',
              employeeId: response.data.employeeId || staff.employeeId || '',
              hasLoginAccount: !!response.data.userId,
            }));
          } else {
            setError('Failed to load staff details');
            // Fallback to basic staff data
            const nameParts = staff.name ? staff.name.split(' ') : ['', '', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';
            let middleName = '';
            if (nameParts.length > 2) {
              middleName = nameParts.slice(1, -1).join(' ');
            }

            setFormData({
              ...formData,
              firstName,
              middleName,
              lastName,
              email: staff.email || '',
              phone: staff.phone || '',
              designation: (staff.designation as string) || '',
              department: (staff.department as string) || '',
              qualification: (staff.qualification as string) || '',
              experienceYears: staff.experienceYears?.toString() || '',
              joiningDate: (staff.joinedDate as string) || '',
              employmentDate: (staff.joinedDate as string) || '',
              status: staff.status || 'Active',
              employeeId: (staff.employeeId as string) || '',
              basicSalary: staff.basicSalary?.toString() || '',
              allowances: staff.allowances?.toString() || '',
              totalSalary: staff.totalSalary?.toString() || '',
              hasLoginAccount: (staff.hasLoginAccount as boolean) || false,
            });
          }
        })
        .catch(err => {
          console.error('Error fetching staff details:', err);
          setError('Failed to load staff details');
          // Fallback to basic staff data
          const nameParts = staff.name ? staff.name.split(' ') : ['', '', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts[nameParts.length - 1] || '';
          let middleName = '';
          if (nameParts.length > 2) {
            middleName = nameParts.slice(1, -1).join(' ');
          }

          setFormData({
            ...formData,
            firstName,
            middleName,
            lastName,
            email: staff.email || '',
            phone: staff.phone || '',
            designation: (staff.designation as string) || '',
            department: (staff.department as string) || '',
            qualification: (staff.qualification as string) || '',
            experienceYears: staff.experienceYears?.toString() || '',
            joiningDate: (staff.joinedDate as string) || '',
            employmentDate: (staff.joinedDate as string) || '',
            status: staff.status || 'Active',
            employeeId: (staff.employeeId as string) || '',
            basicSalary: staff.basicSalary?.toString() || '',
            allowances: staff.allowances?.toString() || '',
            totalSalary: staff.totalSalary?.toString() || '',
            hasLoginAccount: (staff.hasLoginAccount as boolean) || false,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Reset form when modal closes
      setFormData(() => ({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        qualification: '',
        experienceYears: '',
        joiningDate: '',
        employmentDate: '',
        status: 'Active',
        gender: '',
        bloodGroup: '',
        maritalStatus: '',
        address: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        bankName: '',
        bankAccountNumber: '',
        bankBranch: '',
        panNumber: '',
        citizenshipNumber: '',
        basicSalary: '',
        allowances: '',
        totalSalary: '',
        employeeId: '',
        hasLoginAccount: false,
      }));
      setProfilePicture(null);
    }
  }, [isOpen, staff]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-calculate total salary when basic salary or allowances change
    if (name === 'basicSalary' || name === 'allowances') {
      const basicSalary =
        name === 'basicSalary'
          ? parseFloat(value) || 0
          : parseFloat(formData.basicSalary) || 0;
      const allowances =
        name === 'allowances'
          ? parseFloat(value) || 0
          : parseFloat(formData.allowances) || 0;
      setFormData(prev => ({
        ...prev,
        totalSalary: (basicSalary + allowances).toString(),
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle file upload
  const handleFileChange = (file: File | null) => {
    setProfilePicture(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare data for API call
      const updateData = {
        user: {
          firstName: formData.firstName,
          middleName: formData.middleName || undefined,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
        },
        profile: {
          designation: formData.designation || undefined,
          department: formData.department || undefined,
          qualification: formData.qualification || undefined,
          experienceYears: formData.experienceYears
            ? parseInt(formData.experienceYears, 10)
            : undefined,
          employmentDate: formData.employmentDate || undefined,
          joiningDate: formData.joiningDate || undefined,
          employmentStatus:
            formData.status === 'Active'
              ? 'active'
              : formData.status === 'On Leave'
                ? 'on_leave'
                : formData.status.toLowerCase(),
          gender: formData.gender || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          maritalStatus: formData.maritalStatus || undefined,
          address: {
            street: formData.street || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            pinCode: formData.pinCode || undefined,
          },
        },
        bankDetails: {
          bankName: formData.bankName || undefined,
          bankAccountNumber: formData.bankAccountNumber || undefined,
          bankBranch: formData.bankBranch || undefined,
          panNumber: formData.panNumber || undefined,
          citizenshipNumber: formData.citizenshipNumber || undefined,
        },
        salary: {
          basicSalary: formData.basicSalary
            ? parseFloat(formData.basicSalary)
            : undefined,
          allowances: formData.allowances
            ? parseFloat(formData.allowances)
            : undefined,
          totalSalary: formData.totalSalary
            ? parseFloat(formData.totalSalary)
            : undefined,
        },
      };

      // Create FormData for file upload if needed
      let response;
      if (profilePicture) {
        const formDataObj = new FormData();
        formDataObj.append('photo', profilePicture);
        formDataObj.append('data', JSON.stringify(updateData));
        response = await staffService.updateStaffByAdmin(
          String(staff.id),
          formDataObj,
        );
      } else {
        response = await staffService.updateStaffByAdmin(
          String(staff.id),
          updateData,
        );
      }

      if (response.success) {
        toast.success('Staff updated successfully', {
          description: `${formData.firstName} ${formData.lastName}'s information has been updated.`,
        });

        // Pass updated data to parent component
        onSuccess({
          id: staff.id,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
          department: formData.department,
          qualification: formData.qualification,
          experienceYears: formData.experienceYears
            ? parseInt(formData.experienceYears, 10)
            : undefined,
          employmentDate: formData.employmentDate,
          joiningDate: formData.joiningDate,
          status: formData.status,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          maritalStatus: formData.maritalStatus,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          bankName: formData.bankName,
          bankAccountNumber: formData.bankAccountNumber,
          bankBranch: formData.bankBranch,
          panNumber: formData.panNumber,
          citizenshipNumber: formData.citizenshipNumber,
          basicSalary: formData.basicSalary
            ? parseFloat(formData.basicSalary)
            : undefined,
          allowances: formData.allowances
            ? parseFloat(formData.allowances)
            : undefined,
          totalSalary: formData.totalSalary
            ? parseFloat(formData.totalSalary)
            : undefined,
          hasLoginAccount: formData.hasLoginAccount,
        });

        onClose();
      } else {
        throw new Error(response.message || 'Failed to update staff');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error updating staff:', error);
      setError(error.message || 'Failed to update staff');
      toast.error('Update failed', {
        description: error.message || 'There was a problem updating the staff.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading staff details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-3xl lg:max-w-4xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Edit Staff
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Update staff information
          </p>
        </div>

        {/* Profile Photo Section */}
        {staff && (
          <div className='px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200'>
            <div className='flex items-center space-x-4'>
              <div className='flex-shrink-0'>
                <Avatar
                  src={staff.avatar}
                  name={staff.name}
                  role='staff'
                  className='w-16 h-16 rounded-full'
                />
              </div>
              <div className='flex-1'>
                <h3 className='text-lg font-medium text-gray-900'>
                  {staff.name}
                </h3>
                <p className='text-sm text-gray-600'>
                  {staff.position || staff.designation || 'Staff'}
                </p>
                <p className='text-sm text-gray-600'>
                  {staff.department || 'General'}
                </p>
              </div>
              <div className='flex-shrink-0'>
                <div className='flex items-center text-sm text-gray-500'>
                  <Camera className='h-4 w-4 mr-1' />
                  {staff.avatar ? 'Profile Photo' : 'No Photo'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 sm:p-6'>
          {/* Error message */}
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Form sections */}
          <div className='space-y-6'>
            {/* Personal Information */}
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold text-gray-900 mb-3'>
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
                <LabeledInput
                  label='Email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder='Enter email address'
                />
                <LabeledInput
                  label='Phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter phone number'
                />
                <LabeledSelect
                  label='Gender'
                  name='gender'
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={genderOptions}
                  placeholder='Select gender'
                />
                <LabeledSelect
                  label='Blood Group'
                  name='bloodGroup'
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  options={bloodGroupOptions}
                  placeholder='Select blood group'
                />
                <LabeledSelect
                  label='Marital Status'
                  name='maritalStatus'
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  options={maritalStatusOptions}
                  placeholder='Select marital status'
                />
                <div className='md:col-span-3'>
                  <FileUploadField
                    label='Profile Picture'
                    onChange={handleFileChange}
                    accept='image/*'
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold text-gray-900 mb-3'>
                Professional Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Employee ID'
                  name='employeeId'
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder='Enter employee ID'
                />
                <LabeledSelect
                  label='Department'
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  options={departmentOptions}
                  placeholder='Select department'
                />
                <LabeledSelect
                  label='Designation'
                  name='designation'
                  value={formData.designation}
                  onChange={handleInputChange}
                  options={designationOptions}
                  placeholder='Select designation'
                />
                <LabeledInput
                  label='Qualification'
                  name='qualification'
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder='Enter qualification'
                />
                <LabeledInput
                  label='Experience (Years)'
                  name='experienceYears'
                  type='number'
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  placeholder='Enter years of experience'
                />
                <LabeledInput
                  label='Joining Date'
                  name='joiningDate'
                  type='date'
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                />
                <LabeledInput
                  label='Employment Date'
                  name='employmentDate'
                  type='date'
                  value={formData.employmentDate}
                  onChange={handleInputChange}
                />
                <LabeledSelect
                  label='Status'
                  name='status'
                  value={formData.status}
                  onChange={handleInputChange}
                  options={statusOptions}
                  placeholder='Select status'
                />
                <div className='flex items-center'>
                  <LabeledCheckbox
                    label='Has Login Account'
                    name='hasLoginAccount'
                    checked={formData.hasLoginAccount}
                    onChange={handleCheckboxChange}
                    disabled={true} // Cannot change login status after creation
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold text-gray-900 mb-3'>
                Address Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Street'
                  name='street'
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder='Enter street address'
                />
                <LabeledInput
                  label='City'
                  name='city'
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder='Enter city'
                />
                <LabeledInput
                  label='State/Province'
                  name='state'
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder='Enter state or province'
                />
                <LabeledInput
                  label='PIN/ZIP Code'
                  name='pinCode'
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  placeholder='Enter postal code'
                />
              </div>
            </div>

            {/* Salary Information */}
            <div className='bg-yellow-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold text-gray-900 mb-3'>
                Salary Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Basic Salary'
                  name='basicSalary'
                  type='number'
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  placeholder='Enter basic salary'
                />
                <LabeledInput
                  label='Allowances'
                  name='allowances'
                  type='number'
                  value={formData.allowances}
                  onChange={handleInputChange}
                  placeholder='Enter allowances'
                />
                <LabeledInput
                  label='Total Salary'
                  name='totalSalary'
                  type='number'
                  value={formData.totalSalary}
                  onChange={handleInputChange}
                  disabled
                  placeholder='Calculated automatically'
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className='bg-purple-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold text-gray-900 mb-3'>
                Bank & Legal Information
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Bank Name'
                  name='bankName'
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder='Enter bank name'
                />
                <LabeledInput
                  label='Account Number'
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
                  placeholder='Enter bank branch'
                />
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
          </div>

          {/* Footer */}
          <div className='bg-gray-50 px-4 py-4 rounded-lg mt-6 flex justify-end sticky bottom-0'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors mr-2'
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center'
            >
              {saving ? (
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
        </form>
      </div>
    </div>
  );
};

export default StaffEditModal;
