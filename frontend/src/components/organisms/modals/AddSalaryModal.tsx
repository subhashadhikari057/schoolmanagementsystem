'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  User,
  Calendar,
  Building,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SalaryFormData {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  basicSalary: number | '';
  allowances: number | '';
  deductions: number | '';
  totalSalary: number;
  payDate: string;
  payPeriod: string;
  status: 'Pending' | 'Paid' | 'Processing';
  notes?: string;
}

const initialFormData: SalaryFormData = {
  employeeId: '',
  employeeName: '',
  role: '',
  department: '',
  basicSalary: '',
  allowances: '',
  deductions: '',
  totalSalary: 0,
  payDate: new Date().toISOString().split('T')[0],
  payPeriod: new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
  }), // YYYY-MM format
  status: 'Pending',
  notes: '',
};

// Reusable labeled input component
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
      className={`flex h-10 w-full rounded-md border ${
        error ? 'border-red-500' : 'border-gray-300'
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${disabled ? 'bg-gray-50' : ''}`}
      aria-invalid={error ? 'true' : 'false'}
    />
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Reusable labeled select component
const LabeledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${disabled ? 'bg-gray-50' : ''}`}
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

// Reusable labeled textarea component
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
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none ${disabled ? 'bg-gray-50' : ''}`}
      aria-invalid={error ? 'true' : 'false'}
    />
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Form section wrapper
const FormSection: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className='bg-gray-50 p-4 rounded-lg'>
    <div className='flex items-center gap-2 mb-3'>
      <Icon className='h-5 w-5 text-gray-600' />
      <h3 className='text-md font-semibold text-gray-900'>{title}</h3>
    </div>
    <div className='space-y-4'>{children}</div>
  </div>
);

const AddSalaryModal: React.FC<AddSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<SalaryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'staff', label: 'Staff' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'principal', label: 'Principal' },
    { value: 'vice-principal', label: 'Vice Principal' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'security', label: 'Security' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  const departmentOptions = [
    { value: 'academic', label: 'Academic' },
    { value: 'administration', label: 'Administration' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'library', label: 'Library' },
    { value: 'canteen', label: 'Canteen' },
    { value: 'transport', label: 'Transport' },
    { value: 'it', label: 'IT Support' },
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Paid', label: 'Paid' },
  ];

  // Auto-calculate total salary when components change
  useEffect(() => {
    const basic =
      typeof formData.basicSalary === 'number'
        ? formData.basicSalary
        : parseFloat(formData.basicSalary) || 0;
    const allowances =
      typeof formData.allowances === 'number'
        ? formData.allowances
        : parseFloat(formData.allowances) || 0;
    const deductions =
      typeof formData.deductions === 'number'
        ? formData.deductions
        : parseFloat(formData.deductions) || 0;

    const total = basic + allowances - deductions;
    setFormData(prev => ({ ...prev, totalSalary: Math.max(0, total) }));
  }, [formData.basicSalary, formData.allowances, formData.deductions]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (['basicSalary', 'allowances', 'deductions'].includes(name)) {
      // For number fields, allow empty string or valid numbers
      const numValue = value === '' ? '' : parseFloat(value) || '';
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId.trim())
      newErrors.employeeId = 'Employee ID is required';
    if (!formData.employeeName.trim())
      newErrors.employeeName = 'Employee name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';

    const basicSalary =
      typeof formData.basicSalary === 'number'
        ? formData.basicSalary
        : parseFloat(formData.basicSalary) || 0;
    // Remove validation that requires basicSalary > 0 - accept any number

    if (!formData.payDate) newErrors.payDate = 'Pay date is required';
    if (!formData.payPeriod) newErrors.payPeriod = 'Pay period is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);

    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Salary record added successfully', {
        description: `Salary for ${formData.employeeName} (${formData.role}) has been recorded.`,
      });

      // Reset form
      setFormData(initialFormData);
      setErrors({});

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding salary record:', error);
      toast.error('Failed to add salary record', {
        description:
          'There was a problem adding the salary record. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-2xl lg:max-w-3xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Add Salary Record
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Record salary payment for an employee
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 sm:p-6'>
          <div className='space-y-6'>
            {/* Employee Information */}
            <FormSection title='Employee Information' icon={User}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Employee ID'
                  name='employeeId'
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder='Enter employee ID'
                  required
                  error={errors.employeeId}
                />

                <LabeledInput
                  label='Employee Name'
                  name='employeeName'
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  placeholder='Enter employee name'
                  required
                  error={errors.employeeName}
                />

                <LabeledSelect
                  label='Role'
                  name='role'
                  value={formData.role}
                  onChange={handleInputChange}
                  options={roleOptions}
                  placeholder='Select employee role'
                  required
                  error={errors.role}
                />

                <LabeledSelect
                  label='Department'
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  options={departmentOptions}
                  placeholder='Select department'
                  required
                  error={errors.department}
                />
              </div>
            </FormSection>

            {/* Salary Details */}
            <FormSection title='Salary Breakdown' icon={DollarSign}>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <LabeledInput
                  label='Basic Salary'
                  name='basicSalary'
                  type='number'
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  placeholder='Enter basic salary'
                  error={errors.basicSalary}
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
                  label='Deductions'
                  name='deductions'
                  type='number'
                  value={formData.deductions}
                  onChange={handleInputChange}
                  placeholder='Enter deductions'
                />

                <div className='relative'>
                  <LabeledInput
                    label='Total Salary'
                    name='totalSalary'
                    type='number'
                    value={formData.totalSalary}
                    onChange={handleInputChange}
                    placeholder='Auto-calculated'
                    disabled
                  />
                  <div className='mt-1'>
                    <span className='text-xs text-blue-600 flex items-center'>
                      🧮 Auto-calculated:{' '}
                      <strong className='ml-1'>
                        ${formData.totalSalary.toLocaleString()}
                      </strong>
                    </span>
                    {(formData.basicSalary ||
                      formData.allowances ||
                      formData.deductions) && (
                      <span className='text-xs text-gray-500'>
                        ($
                        {(typeof formData.basicSalary === 'number'
                          ? formData.basicSalary
                          : parseFloat(formData.basicSalary) || 0
                        ).toLocaleString()}{' '}
                        + $
                        {(typeof formData.allowances === 'number'
                          ? formData.allowances
                          : parseFloat(formData.allowances) || 0
                        ).toLocaleString()}{' '}
                        - $
                        {(typeof formData.deductions === 'number'
                          ? formData.deductions
                          : parseFloat(formData.deductions) || 0
                        ).toLocaleString()}
                        )
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Payment Information */}
            <FormSection title='Payment Details' icon={Calendar}>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <LabeledInput
                  label='Pay Date'
                  name='payDate'
                  type='date'
                  value={formData.payDate}
                  onChange={handleInputChange}
                  required
                  error={errors.payDate}
                />

                <LabeledInput
                  label='Pay Period (YYYY-MM)'
                  name='payPeriod'
                  type='month'
                  value={formData.payPeriod}
                  onChange={handleInputChange}
                  placeholder='Select pay period'
                  required
                  error={errors.payPeriod}
                />

                <LabeledSelect
                  label='Status'
                  name='status'
                  value={formData.status}
                  onChange={handleInputChange}
                  options={statusOptions}
                  placeholder='Select status'
                  required
                  error={errors.status}
                />
              </div>

              <LabeledTextarea
                label='Notes'
                name='notes'
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder='Additional notes or comments (optional)'
                rows={3}
              />
            </FormSection>
          </div>

          {/* Footer */}
          <div className='bg-gray-50 px-4 py-4 rounded-lg mt-6 flex justify-end gap-2 sticky bottom-0'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center'
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Adding...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Add Salary Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalaryModal;
