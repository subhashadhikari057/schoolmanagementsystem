'use client';

import React, { useState } from 'react';
import {
  X,
  DollarSign,
  FileText,
  Calendar,
  Tag,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExpenseFormData {
  category: string;
  description: string;
  amount: number | '';
  date: string;
  vendor?: string;
  reference?: string;
  notes?: string;
  status: 'Pending' | 'Paid';
}

const initialFormData: ExpenseFormData = {
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  reference: '',
  notes: '',
  status: 'Pending',
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

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'transport', label: 'Transport' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'software', label: 'Software' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Paid', label: 'Paid' },
  ];

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      // For amount field, allow empty string or valid numbers
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

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';

    const amount =
      typeof formData.amount === 'number'
        ? formData.amount
        : parseFloat(formData.amount) || 0;
    // Remove validation that requires amount > 0 - accept any number

    if (!formData.date) newErrors.date = 'Date is required';

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

      toast.success('Expense added successfully', {
        description: `${formData.category} expense of $${formData.amount} has been recorded.`,
      });

      // Reset form
      setFormData(initialFormData);
      setErrors({});

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense', {
        description:
          'There was a problem adding the expense. Please try again.',
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
        <div className='sticky top-0 bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Add New Expense
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Record a new expense for the school
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 sm:p-6'>
          <div className='space-y-6'>
            {/* Basic Information */}
            <FormSection title='Expense Details' icon={DollarSign}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledSelect
                  label='Category'
                  name='category'
                  value={formData.category}
                  onChange={handleInputChange}
                  options={categoryOptions}
                  placeholder='Select expense category'
                  required
                  error={errors.category}
                />

                <LabeledInput
                  label='Amount'
                  name='amount'
                  type='number'
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder='Enter amount'
                  error={errors.amount}
                />

                <LabeledInput
                  label='Date'
                  name='date'
                  type='date'
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  error={errors.date}
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

              <LabeledInput
                label='Description'
                name='description'
                value={formData.description}
                onChange={handleInputChange}
                placeholder='Enter expense description'
                required
                error={errors.description}
              />
            </FormSection>

            {/* Additional Information */}
            <FormSection title='Additional Details' icon={FileText}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <LabeledInput
                  label='Vendor/Supplier'
                  name='vendor'
                  value={formData.vendor || ''}
                  onChange={handleInputChange}
                  placeholder='Enter vendor name (optional)'
                />

                <LabeledInput
                  label='Reference/Invoice No.'
                  name='reference'
                  value={formData.reference || ''}
                  onChange={handleInputChange}
                  placeholder='Enter reference number (optional)'
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
              className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center'
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Adding...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
