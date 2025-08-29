'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Layers,
  DollarSign,
  Save,
  Loader2,
} from 'lucide-react';
import { csrfService } from '@/api/services/csrf.service';
import { httpClient } from '@/api/client/http-client';
import { toast } from 'sonner';

export interface FeeStructureItemDraft {
  label: string;
  amount: number;
  category?: string;
  frequency?: string;
  isOptional?: boolean;
}

export interface EditFeeStructurePayload {
  effectiveFrom: string;
  changeReason?: string;
  items: FeeStructureItemDraft[];
}

interface FeeComponentDraft {
  id: string;
  label: string;
  amount: string; // keep as string for inputs then parse
}

interface FormState {
  effectiveFrom: string;
  changeReason: string;
  components: FeeComponentDraft[];
}

interface FeeStructureDetailed {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  effectiveFrom: string;
  classId: string;
  grade?: number;
  section?: string;
  assignedClasses: Array<{
    id: string;
    grade: number | null;
    section: string | null;
  }>;
  items: Array<{ id: string; label: string; amount: string | number }>;
}

interface EditFeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: EditFeeStructurePayload) => void;
  structure: FeeStructureDetailed | null;
}

// Reusable labeled input
const LabeledInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}> = ({
  label,
  name,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  error,
  disabled,
}) => (
  <div className='w-full'>
    <label className='text-sm font-medium leading-none mb-1 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <input
      name={name}
      value={value}
      type={type}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
    />
    {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}
  </div>
);

const LabeledTextarea: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  rows?: number;
}> = ({ label, name, value, onChange, placeholder, error, rows = 3 }) => (
  <div className='w-full'>
    <label className='text-sm font-medium leading-none mb-1 block'>
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`flex w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none`}
    />
    {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}
  </div>
);

const EditFeeStructureModal: React.FC<EditFeeStructureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  structure,
}) => {
  const [form, setForm] = useState<FormState>({
    effectiveFrom: '',
    changeReason: '',
    components: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form when structure changes
  useEffect(() => {
    if (isOpen && structure) {
      const effectiveDate = structure.effectiveFrom
        ? new Date(structure.effectiveFrom).toISOString().split('T')[0]
        : '';
      setForm({
        effectiveFrom: effectiveDate,
        changeReason: '',
        components: structure.items.map(item => ({
          id: item.id || crypto.randomUUID(),
          label: item.label || '',
          amount: String(item.amount || '0'),
        })),
      });
      setErrors({});
    } else if (!isOpen) {
      setForm({
        effectiveFrom: '',
        changeReason: '',
        components: [],
      });
      setErrors({});
    }
  }, [isOpen, structure]);

  const updateField = (
    name: keyof FormState,
    value: string | FeeComponentDraft[],
  ) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name])
      setErrors(e => {
        const c = { ...e };
        delete c[name];
        return c;
      });
  };

  const addComponent = () => {
    setForm(f => ({
      ...f,
      components: [
        ...f.components,
        {
          id: crypto.randomUUID(),
          label: '',
          amount: '',
        },
      ],
    }));
  };

  const updateComponent = (id: string, patch: Partial<FeeComponentDraft>) => {
    setForm(f => ({
      ...f,
      components: f.components.map(c => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const removeComponent = (id: string) => {
    setForm(f => ({ ...f, components: f.components.filter(c => c.id !== id) }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.effectiveFrom) next.effectiveFrom = 'Effective date required';
    if (form.components.length === 0)
      next.components = 'Add at least one component';

    form.components.forEach((c, i) => {
      if (!c.label.trim()) next[`comp-${i}-label`] = 'Label required';
      if (!c.amount || isNaN(Number(c.amount)) || Number(c.amount) <= 0)
        next[`comp-${i}-amount`] = 'Valid positive amount required';
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !structure) return;

    setSaving(true);
    try {
      const payload: EditFeeStructurePayload = {
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        changeReason: form.changeReason.trim() || undefined,
        items: form.components.map(c => ({
          label: c.label.trim(),
          amount: Number(c.amount),
          category: 'General',
          frequency: 'MONTHLY',
          isOptional: false,
        })),
      };

      const headersWithCsrf = await csrfService.addTokenToHeaders({
        'Content-Type': 'application/json',
      });
      const res = await httpClient.post<{
        version: number;
        totalAnnual: string;
      }>(`api/v1/fees/structures/${structure.id}/revise`, payload, {
        headers: headersWithCsrf,
      });

      if (!res.success) throw new Error('Failed to update structure');

      toast.success(
        `Fee structure updated successfully (Version ${res.data?.version || 'latest'})`,
        {
          description: 'The fee structure has been revised and is now active.',
          duration: 4000,
        },
      );
      onSuccess(payload);
      onClose();
    } catch (err) {
      console.error(err);
      const errorObj = err as unknown as {
        error?: { message?: string };
        message?: string;
      };
      let msg =
        errorObj?.error?.message ||
        errorObj?.message ||
        'Failed to update structure';

      // Handle specific database precision errors with user-friendly messages
      if (
        msg.includes('numeric field overflow') ||
        msg.includes('precision 10, scale 2')
      ) {
        msg =
          'One or more amounts are too large. Please ensure amounts are less than 100,000,000 (100 million).';
      } else if (msg.includes('A field with precision')) {
        msg =
          'Amount value is too large for the database. Please use a smaller amount.';
      } else if (msg.includes('Network Error') || msg.includes('ERR_NETWORK')) {
        msg =
          'Network connection failed. Please check your internet connection and try again.';
      } else if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
        msg = 'Request timed out. Please try again in a few moments.';
      } else if (
        msg.includes('Unauthorized') ||
        msg.includes('Authentication failed')
      ) {
        msg =
          'Your session has expired. Please refresh the page and log in again.';
      } else if (msg.includes('Forbidden') || msg.includes('Access denied')) {
        msg = 'You do not have permission to update this fee structure.';
      } else if (msg.includes('Fee structure not found')) {
        msg = 'This fee structure no longer exists. It may have been deleted.';
      } else if (msg.includes('Invalid date')) {
        msg = 'Please enter a valid effective date.';
      } else if (msg.includes('Date in the past')) {
        msg =
          'The effective date cannot be in the past. Please select a future date.';
      } else if (msg.includes('Duplicate')) {
        msg =
          'A conflicting fee structure already exists for this configuration.';
      } else if (
        msg.includes('Server error') ||
        msg.includes('Internal server error')
      ) {
        msg =
          'Server error occurred. Please try again later or contact support.';
      }

      toast.error('Failed to Update Fee Structure', {
        description: msg,
        duration: 6000,
      });

      // Prevent error from propagating to Next.js error boundary
      return;
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 overflow-y-auto'>
      <div className='relative w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-200 animate-in fade-in zoom-in duration-150'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <Layers className='h-5 w-5 text-blue-600' /> Edit Fee Structure
            </h2>
            <p className='text-xs text-gray-500 mt-0.5'>
              Update structure details and components • Class assignment cannot
              be changed
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-md hover:bg-white/60 text-gray-500 hover:text-gray-700'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[80vh] flex flex-col'>
          <div className='px-5 py-4 space-y-6 overflow-y-auto'>
            {/* Structure Info */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='text-sm font-semibold text-gray-800 mb-3'>
                Structure Information
              </h3>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='w-full'>
                  <label className='text-sm font-medium leading-none mb-1 block'>
                    Structure Name
                  </label>
                  <div className='flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600'>
                    {structure?.name || 'N/A'}
                  </div>
                  <p className='mt-1 text-xs text-gray-500'>
                    Name cannot be changed during revision
                  </p>
                </div>
                <LabeledInput
                  label='Effective From'
                  name='effectiveFrom'
                  type='date'
                  required
                  value={form.effectiveFrom}
                  onChange={e => updateField('effectiveFrom', e.target.value)}
                  error={errors.effectiveFrom}
                />
              </div>
              <div className='mt-4'>
                <LabeledTextarea
                  label='Change Reason (Optional)'
                  name='changeReason'
                  value={form.changeReason}
                  onChange={e => updateField('changeReason', e.target.value)}
                  placeholder='Describe the changes made...'
                  rows={2}
                />
              </div>
            </div>

            {/* Assigned Class (Read-only) */}
            {structure && (
              <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                <h3 className='text-sm font-semibold text-blue-800 mb-3'>
                  Assigned Class
                </h3>
                <div className='flex items-center space-x-4'>
                  {structure.assignedClasses.map(cls => (
                    <div
                      key={cls.id}
                      className='flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-md'
                    >
                      <span className='text-sm font-medium text-blue-800'>
                        Grade {cls.grade} - {cls.section}
                      </span>
                    </div>
                  ))}
                </div>
                <p className='text-xs text-blue-600 mt-2'>
                  Class assignment cannot be modified. Create a new structure to
                  assign to different classes.
                </p>
              </div>
            )}

            {/* Fee Components */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-green-600' /> Fee
                  Components
                </h3>
                <button
                  type='button'
                  onClick={addComponent}
                  className='inline-flex items-center gap-1.5 rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700'
                >
                  <Plus className='h-3.5 w-3.5' /> Add Component
                </button>
              </div>
              {errors.components && form.components.length === 0 && (
                <p className='mb-2 text-xs text-red-600'>{errors.components}</p>
              )}

              <div className='space-y-3'>
                {form.components.map((c, idx) => {
                  const labelErr = errors[`comp-${idx}-label`];
                  const amtErr = errors[`comp-${idx}-amount`];
                  return (
                    <div
                      key={c.id}
                      className='p-4 rounded-lg border border-gray-200 bg-gray-50/80 relative'
                    >
                      <div className='grid md:grid-cols-3 gap-3 items-start'>
                        <div className='md:col-span-2'>
                          <LabeledInput
                            label='Label'
                            name={`comp-${idx}-label`}
                            value={c.label}
                            onChange={e =>
                              updateComponent(c.id, { label: e.target.value })
                            }
                            error={labelErr}
                            placeholder='e.g. Tuition Fee, Lab Fee, etc.'
                          />
                        </div>
                        <div className='md:col-span-1'>
                          <LabeledInput
                            label='Amount'
                            name={`comp-${idx}-amount`}
                            type='number'
                            value={c.amount}
                            onChange={e =>
                              updateComponent(c.id, { amount: e.target.value })
                            }
                            error={amtErr}
                            placeholder='0.00'
                          />
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeComponent(c.id)}
                        className='absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-full p-1 shadow'
                        aria-label='Delete component'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  );
                })}
                {form.components.length === 0 && (
                  <div className='text-xs text-gray-500 border border-dashed rounded-md p-4 text-center'>
                    No components added yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-xl'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-4 py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {saving ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <Save className='h-3 w-3' />
              )}
              Update Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeeStructureModal;
