'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { X, Plus, Trash2, Layers, DollarSign, Lock } from 'lucide-react';
import { classService, type ClassResponse } from '@/api/services/class.service';
import { csrfService } from '@/api/services/csrf.service';
import { httpClient } from '@/api/client/http-client';
import { toast } from 'sonner';
import LabeledNepaliDatePicker from './LabeledNepaliDatePicker';
import NepaliYearPicker from '@/components/ui/NepaliYearPicker';
import { ad2bs } from 'hamro-nepali-patro';

export interface FeeStructureDraftItem {
  label: string;
  amount: number;
}

export interface FeeStructureDraftPayload {
  name: string;
  academicYear: string;
  classId?: string; // single selection
  classIds?: string[]; // multi selection
  effectiveFrom: string;
  items: FeeStructureDraftItem[];
}

export interface CreateFeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: FeeStructureDraftPayload) => void; // payload for future integration
}

interface FeeComponentDraft {
  id: string;
  label: string;
  amount: string; // keep as string for inputs then parse
}

interface FormState {
  structureName: string;
  academicYear: string;
  selectedClassIds: string[]; // support multi selection
  effectiveFrom: string; // ISO date
  components: FeeComponentDraft[];
}

const initialState: FormState = {
  structureName: '',
  academicYear: '',
  selectedClassIds: [],
  effectiveFrom: '',
  components: [],
};

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
}> = ({
  label,
  name,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
  error,
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
      className={`flex h-10 w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
    />
    {error && <p className='mt-1 text-xs text-red-600'>{error}</p>}
  </div>
);

// Academic year options generator
const generateAcademicYears = (count = 6): string[] => {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = -1; i < count - 1; i++) {
    // include previous year
    const start = currentYear + i;
    const end = (start + 1).toString().slice(-2);
    years.push(`${start}-${end}`);
  }
  return years;
};

const CreateFeeStructureModal: React.FC<CreateFeeStructureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [yearQuery, setYearQuery] = useState('');
  const [debouncedYearQuery, setDebouncedYearQuery] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement | null>(null);
  const [existingYearStructures, setExistingYearStructures] = useState<
    Record<string, string>
  >({}); // classId -> structureId
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [removedConflicts, setRemovedConflicts] = useState<string[]>([]);

  // Debounce academic year search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedYearQuery(yearQuery), 300);
    return () => clearTimeout(t);
  }, [yearQuery]);

  // Outside click + ESC to close year dropdown
  useEffect(() => {
    if (!showYearDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target as Node)
      ) {
        setShowYearDropdown(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowYearDropdown(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [showYearDropdown]);

  // Initialize form with today's date when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayBS = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
      const todayBSString = `${todayBS.year}-${todayBS.month.toString().padStart(2, '0')}-${todayBS.day.toString().padStart(2, '0')}`;

      setForm(prev => ({
        ...prev,
        effectiveFrom: todayBSString,
      }));
    }
  }, [isOpen]);

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    } else {
      setForm(initialState);
      setErrors({});
      setYearQuery('');
      setShowYearDropdown(false);
      setExistingYearStructures({});
      setRemovedConflicts([]);
    }
  }, [isOpen]);

  // Fetch existing fee structures for selected academic year to disable duplicates
  useEffect(() => {
    if (!isOpen) return;
    const year = form.academicYear.trim();
    if (!year) {
      setExistingYearStructures({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingStructures(true);
        // Pull large page size to cover all classes (adjust if backend caps)
        const qp = new URLSearchParams({ academicYear: year, pageSize: '500' });
        const res = await fetch(
          `/api/v1/fees/structures/list?${qp.toString()}`,
          { credentials: 'include' },
        );
        if (!res.ok) throw new Error('Failed structures list');
        const data = await res.json();
        if (cancelled) return;
        interface ExistingStructureLite {
          id: string;
          classId?: string;
        }
        const map: Record<string, string> = {};
        ((data?.data as ExistingStructureLite[]) || []).forEach(s => {
          if (s.classId) map[s.classId] = s.id;
        });
        setExistingYearStructures(map);
        // Detect conflicts inside current selection
        setForm(f => {
          const conflicts = f.selectedClassIds.filter(id => map[id]);
          if (conflicts.length > 0) {
            setRemovedConflicts(conflicts);
            toast.warning(
              `${conflicts.length} class${conflicts.length > 1 ? 'es' : ''} removed because they already have a fee structure for ${year}`,
            );
            return {
              ...f,
              selectedClassIds: f.selectedClassIds.filter(id => !map[id]),
            };
          }
          setRemovedConflicts([]);
          return f;
        });
      } catch (err) {
        if (!cancelled) {
          console.warn('Fee structures fetch failed', err);
          setExistingYearStructures({});
        }
      } finally {
        if (!cancelled) setLoadingStructures(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.academicYear, isOpen]);

  const loadClasses = async () => {
    try {
      const res = await classService.getAllClasses();
      if (res.success && res.data) {
        setClasses(res.data);
      } else toast.error('Failed to load classes');
    } catch (err) {
      console.error(err);
      const errorObj = err as unknown as {
        error?: { message?: string };
        message?: string;
      };
      let msg =
        errorObj?.error?.message ||
        errorObj?.message ||
        'Failed to load classes';

      if (msg.includes('Network Error') || msg.includes('ERR_NETWORK')) {
        msg =
          'Network connection failed. Please check your internet connection.';
      } else if (msg.includes('Unauthorized')) {
        msg = 'Your session has expired. Please refresh the page.';
      } else if (msg.includes('Forbidden')) {
        msg = 'You do not have permission to view classes.';
      }

      toast.error('Failed to Load Classes', {
        description: msg,
        duration: 5000,
      });
    }
  };

  const yearOptions = useMemo(() => {
    const all = generateAcademicYears();
    if (!debouncedYearQuery.trim()) return all.slice(0, 8);
    return all.filter(y =>
      y.toLowerCase().includes(debouncedYearQuery.toLowerCase()),
    );
  }, [debouncedYearQuery]);

  const updateField = (
    name: keyof FormState,
    value: string | string[] | FeeComponentDraft[],
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
        { id: crypto.randomUUID(), label: '', amount: '' },
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
    if (!form.structureName.trim())
      next.structureName = 'Structure name required';
    if (!form.academicYear.trim()) next.academicYear = 'Academic year required';
    if (form.selectedClassIds.length === 0)
      next.selectedClassIds = 'Select at least one class';
    if (form.components.length === 0)
      next.components = 'Add at least one component';
    if (!form.effectiveFrom) next.effectiveFrom = 'Effective date required';
    form.components.forEach((c, i) => {
      if (!c.label.trim()) next[`comp-${i}-label`] = 'Label required';
      if (!c.amount || isNaN(Number(c.amount)))
        next[`comp-${i}-amount`] = 'Valid amount required';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // Ensure academicYear fallback from typed query
      const academicYear = form.academicYear.trim() || yearQuery.trim();
      // Clean & validate class ids
      const uuidRegex = /^[0-9a-fA-F-]{10,}$/; // loose check (backend enforces real uuid)
      const cleanedIds = Array.from(
        new Set(form.selectedClassIds.filter(id => uuidRegex.test(id))),
      );
      if (cleanedIds.length === 0) {
        toast.error('No valid classes selected');
        setSaving(false);
        return;
      }
      // Prepare payload (mock for now)
      const payload: FeeStructureDraftPayload = {
        name: form.structureName.trim(),
        academicYear,
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        items: form.components.map(c => ({
          label: c.label.trim(),
          amount: Number(c.amount),
        })),
      };
      // For multiple classes create structures individually to avoid multi-assignment coupling
      const headersWithCsrf = await csrfService.addTokenToHeaders({
        'Content-Type': 'application/json',
      });
      if (cleanedIds.length === 1) {
        payload.classId = cleanedIds[0];
        console.log('Submitting single fee structure payload', payload);
        const res = await httpClient.post<unknown>(
          'api/v1/fees/structures',
          payload,
          { headers: headersWithCsrf },
        );
        if (!res.success) throw new Error('Failed to create');
      } else {
        for (const cid of cleanedIds) {
          const base = payload as Omit<FeeStructureDraftPayload, 'classId'>;
          const singlePayload: FeeStructureDraftPayload = {
            ...base,
            classId: cid,
          };
          console.log(
            'Submitting multi -> individual fee structure payload',
            singlePayload,
          );
          const res = await httpClient.post<unknown>(
            'api/v1/fees/structures',
            singlePayload,
            { headers: headersWithCsrf },
          );
          if (!res.success)
            throw new Error('Failed to create for class ' + cid);
        }
      }
      toast.success(
        `Created fee structure for ${cleanedIds.length} class${cleanedIds.length > 1 ? 'es' : ''}`,
        {
          description: `Successfully created fee structure "${payload.name}" for ${cleanedIds.length} class${cleanedIds.length > 1 ? 'es' : ''} in academic year ${payload.academicYear}.`,
          duration: 4000,
        },
      );
      onSuccess(payload); // pass original for parent refresh logic
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
        'Failed to create structure';

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
        msg = 'You do not have permission to create fee structures.';
      } else if (msg.includes('Duplicate')) {
        msg =
          'A fee structure already exists for one or more selected classes in this academic year.';
      } else if (msg.includes('Class not found')) {
        msg =
          'One or more selected classes could not be found. Please refresh and try again.';
      } else if (msg.includes('Invalid academic year')) {
        msg =
          'The selected academic year is invalid. Please choose a valid year.';
      } else if (msg.includes('Invalid date')) {
        msg = 'Please enter a valid effective date.';
      } else if (msg.includes('Date in the past')) {
        msg =
          'The effective date cannot be in the past. Please select a future date.';
      } else if (
        msg.includes('Server error') ||
        msg.includes('Internal server error')
      ) {
        msg =
          'Server error occurred. Please try again later or contact support.';
      }

      toast.error('Failed to Create Fee Structure', {
        description: msg,
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4 overflow-y-auto'>
      <div className='relative w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 animate-in fade-in zoom-in duration-150'>
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <Layers className='h-5 w-5 text-blue-600' /> Create Fee Structure
            </h2>
            <p className='text-xs text-gray-500 mt-0.5'>
              Monthly itemized structure (draft)
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
            {/* Basic Info */}
            <div className='grid gap-4 md:grid-cols-2'>
              <LabeledInput
                label='Structure Name'
                name='structureName'
                required
                value={form.structureName}
                onChange={e => updateField('structureName', e.target.value)}
                error={errors.structureName}
                placeholder='e.g. Grade 10 Annual Fee'
              />
              {/* Academic Year Nepali Year Picker */}
              <div>
                <NepaliYearPicker
                  label='Academic Year'
                  value={form.academicYear}
                  onChange={(val: string) => updateField('academicYear', val)}
                  error={errors.academicYear}
                />
              </div>
            </div>

            {/* Effective From */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <LabeledNepaliDatePicker
                  label='Effective From (Nepali Date)'
                  name='effectiveFrom'
                  value={form.effectiveFrom}
                  onChange={val => updateField('effectiveFrom', val)}
                  error={errors.effectiveFrom}
                />
              </div>
            </div>

            {/* Class Multi Selection */}
            <div>
              <label className='text-sm font-medium leading-none mb-2 block'>
                Assign To Classes / Sections
                <span className='text-red-500 ml-1'>*</span>
              </label>
              <ClassMultiSelect
                classes={classes}
                selected={form.selectedClassIds}
                onChange={ids => updateField('selectedClassIds', ids)}
                error={errors.selectedClassIds}
                disabledClassIds={existingYearStructures}
                loading={loadingStructures}
                requireYear={!form.academicYear}
              />
              {Object.keys(existingYearStructures).length > 0 && (
                <p className='mt-1 text-[10px] text-gray-500 flex items-center gap-1'>
                  <Lock className='h-3 w-3' />{' '}
                  {Object.keys(existingYearStructures).length} class
                  {Object.keys(existingYearStructures).length !== 1 &&
                    'es'}{' '}
                  already have a structure for{' '}
                  {form.academicYear || 'this year'} and are disabled.
                </p>
              )}
              {removedConflicts.length > 0 && (
                <p className='mt-1 text-[10px] text-amber-600'>
                  Removed {removedConflicts.length} conflicting selection
                  {removedConflicts.length > 1 ? 's' : ''}. They already have
                  structures.
                </p>
              )}
              {errors.selectedClassIds && (
                <p className='mt-1 text-xs text-red-600'>
                  {errors.selectedClassIds}
                </p>
              )}
            </div>

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
                      className='p-3 rounded-lg border border-gray-200 bg-gray-50/80 relative'
                    >
                      <div className='grid md:grid-cols-3 gap-3 items-start'>
                        <div className='md:col-span-2'>
                          <input
                            value={c.label}
                            onChange={e =>
                              updateComponent(c.id, { label: e.target.value })
                            }
                            placeholder='Label (e.g., Tuition Fee, Lab Fee) *'
                            className={`h-9 w-full rounded-md border ${labelErr ? 'border-red-500' : 'border-gray-300'} bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          {labelErr && (
                            <p className='mt-0.5 text-[10px] text-red-600'>
                              {labelErr}
                            </p>
                          )}
                        </div>
                        <div className='md:col-span-1'>
                          <input
                            value={c.amount}
                            onChange={e =>
                              updateComponent(c.id, { amount: e.target.value })
                            }
                            placeholder='Amount *'
                            type='number'
                            className={`h-9 w-full rounded-md border ${amtErr ? 'border-red-500' : 'border-gray-300'} bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                          {amtErr && (
                            <p className='mt-0.5 text-[10px] text-red-600'>
                              {amtErr}
                            </p>
                          )}
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
              {saving && (
                <span className='h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin' />
              )}
              Create Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Multi-select component for classes grouped by grade with select-all per grade
const ClassMultiSelect: React.FC<{
  classes: ClassResponse[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  disabledClassIds?: Record<string, string>; // classId -> structureId (presence means disable)
  loading?: boolean;
  requireYear?: boolean;
}> = ({
  classes,
  selected,
  onChange,
  disabledClassIds = {},
  loading,
  requireYear,
}) => {
  const [open, setOpen] = useState(false);
  // group by grade
  const grouped = useMemo(() => {
    const map = new Map<number, ClassResponse[]>();
    classes.forEach(c => {
      if (!map.has(c.grade)) map.set(c.grade, []);
      map.get(c.grade)!.push(c);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [classes]);

  const toggle = (id: string) => {
    if (disabledClassIds[id]) return; // disabled
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  };
  const toggleGrade = (grade: number, allIds: string[]) => {
    const allSelected = allIds.every(id => selected.includes(id));
    if (allSelected) onChange(selected.filter(id => !allIds.includes(id)));
    else
      onChange([...selected, ...allIds.filter(id => !selected.includes(id))]);
  };
  return (
    <div className='relative'>
      <button
        type='button'
        disabled={loading || requireYear}
        onClick={() => setOpen(o => !o)}
        className={`w-full justify-between flex h-10 rounded-md border ${loading || requireYear ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 bg-white text-gray-700'} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed`}
      >
        <span className='truncate text-left'>
          {requireYear && 'Select academic year first'}
          {!requireYear && loading && 'Loading classes...'}
          {!requireYear &&
            !loading &&
            selected.length === 0 &&
            'Select classes'}
          {!loading && selected.length === 1 && '1 class selected'}
          {!loading &&
            selected.length > 1 &&
            `${selected.length} classes selected`}
        </span>
        <span className='text-gray-400'>{open ? '▴' : '▾'}</span>
      </button>
      {open && !requireYear && (
        <div className='absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-white shadow text-xs p-2 space-y-3'>
          {grouped.map(([grade, cls]) => {
            const ids = cls.map(c => c.id);
            const allSelected = ids.every(id => selected.includes(id));
            const partially =
              !allSelected && ids.some(id => selected.includes(id));
            return (
              <div key={grade} className='border rounded-md p-2'>
                <div className='flex items-center justify-between mb-1'>
                  <button
                    type='button'
                    onClick={() => toggleGrade(grade, ids)}
                    className='font-semibold text-gray-800 hover:text-blue-600'
                  >
                    Grade {grade}{' '}
                    {allSelected ? '(All)' : partially ? '(Partial)' : ''}
                  </button>
                  <span className='text-[10px] text-gray-500'>
                    {cls.length} sections
                  </span>
                </div>
                <div className='flex flex-wrap gap-1'>
                  {cls
                    .sort((a, b) => a.section.localeCompare(b.section))
                    .map(c => {
                      const active = selected.includes(c.id);
                      const disabled = !!disabledClassIds[c.id];
                      return (
                        <button
                          type='button'
                          key={c.id}
                          onClick={() => toggle(c.id)}
                          disabled={disabled}
                          title={
                            disabled
                              ? 'Existing structure ID ' +
                                disabledClassIds[c.id]
                              : ''
                          }
                          className={`px-2 py-0.5 rounded border text-[10px] relative ${disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'} ${active && !disabled ? 'bg-blue-600 text-white border-blue-600' : ''}`}
                        >
                          {c.section}
                          {disabled && (
                            <Lock className='h-2.5 w-2.5 inline ml-1' />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className='text-gray-500 text-center py-4'>
              No classes loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateFeeStructureModal;
