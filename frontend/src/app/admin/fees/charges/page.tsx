'use client';
import React, { useEffect, useState } from 'react';
import PermissionGate from '@/components/auth/PermissionGate';
import StudentSelector from '@/components/ui/StudentSelector';
import { feeService, ChargeDefinition } from '@/api/services/fee.service';
import { Eye, Power, PowerOff } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}
interface Student {
  id: string;
  rollNumber: string;
  email: string;
  user: { fullName: string };
}

const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(message: string, type: 'success' | 'error') {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }
  const view = (
    <div className='fixed top-2 right-2 space-y-2 z-50'>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-3 py-2 rounded text-sm shadow ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { push, view };
};

const ChargesPage: React.FC = () => {
  const { push, view } = useToasts();
  const [list, setList] = useState<ChargeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState<ChargeDefinition | null>(null);
  const [showDetails, setShowDetails] = useState<ChargeDefinition | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    valueType: 'FIXED',
    value: 25,
  });
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [applyForm, setApplyForm] = useState({ appliedMonth: '', reason: '' });

  async function load() {
    setLoading(true);
    try {
      const data = await feeService.listCharges();
      setList(data);
    } catch (err) {
      push((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // initial load

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      if (!createForm.name) throw new Error('Name required');
      if (!createForm.value) throw new Error('Value required');
      await feeService.createCharge({
        name: createForm.name,
        valueType: createForm.valueType as 'FIXED' | 'PERCENTAGE',
        value: createForm.value,
      });
      push('Charge created', 'success');
      setCreateForm({ name: '', valueType: 'FIXED', value: 25 });
      load();
    } catch (err) {
      push((err as Error).message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function submitApply(e: React.FormEvent) {
    e.preventDefault();
    if (!showApply) return;
    setApplying(true);
    try {
      if (selectedStudents.length === 0)
        throw new Error('Select at least one student');
      if (!applyForm.appliedMonth) throw new Error('Month required (YYYY-MM)');

      await feeService.applyCharge({
        chargeId: showApply.id,
        studentIds: selectedStudents.map(s => s.id),
        appliedMonth: applyForm.appliedMonth,
        reason: applyForm.reason || undefined,
      });
      push(
        `Charge applied to ${selectedStudents.length} student(s)`,
        'success',
      );
      setShowApply(null);
      setSelectedStudents([]);
      setApplyForm({ appliedMonth: '', reason: '' });
    } catch (err) {
      push((err as Error).message, 'error');
    } finally {
      setApplying(false);
    }
  }

  async function toggleStatus(charge: ChargeDefinition, newStatus: boolean) {
    try {
      if (!newStatus) {
        await feeService.deactivateCharge(charge.id);
        push(`${charge.name} deactivated`, 'success');
      } else {
        // Reactivation would need a separate endpoint - for now just show message
        push('Reactivation not implemented yet', 'error');
        return;
      }
      load();
    } catch (err) {
      push((err as Error).message, 'error');
    }
  }

  return (
    <PermissionGate required={['FINANCE_MANAGE_CHARGES']}>
      <div className='p-4 space-y-6'>
        {view}

        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <h1 className='text-xl font-semibold'>Dues & Fines</h1>
          <div className='flex gap-2 text-xs'>
            <a
              href='/admin/fees'
              className='px-2 py-1 rounded border hover:bg-gray-50'
            >
              Fee Structures
            </a>
            <a
              href='/admin/fees/scholarships'
              className='px-2 py-1 rounded border hover:bg-gray-50'
            >
              Scholarships
            </a>
          </div>
        </div>

        {/* Create Form */}
        <form
          onSubmit={submitCreate}
          className='flex flex-wrap gap-3 items-end bg-white p-4 rounded shadow'
        >
          <div>
            <label className='block text-xs font-medium mb-1'>Name</label>
            <input
              className='border px-3 py-2 rounded w-48'
              value={createForm.name}
              onChange={e =>
                setCreateForm(f => ({ ...f, name: e.target.value }))
              }
              placeholder='Enter charge name'
            />
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Value Type</label>
            <select
              className='border px-3 py-2 rounded'
              value={createForm.valueType}
              onChange={e =>
                setCreateForm(f => ({ ...f, valueType: e.target.value }))
              }
            >
              <option value='FIXED'>Fixed Amount</option>
              <option value='PERCENTAGE'>Percentage</option>
            </select>
          </div>
          <div>
            <label className='block text-xs font-medium mb-1'>Value</label>
            <input
              type='number'
              className='border px-3 py-2 rounded w-24'
              value={createForm.value}
              onChange={e =>
                setCreateForm(f => ({
                  ...f,
                  value: parseFloat(e.target.value) || 0,
                }))
              }
              min='0'
              step='0.01'
            />
          </div>
          <button
            disabled={creating}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors'
          >
            {creating ? 'Creating...' : 'Create Charge'}
          </button>
        </form>

        {/* Charges List */}
        <div className='bg-white rounded shadow divide-y'>
          <div className='p-4 font-medium text-sm flex justify-between items-center'>
            <span>Existing Charges ({list.length})</span>
            <button
              onClick={load}
              className='text-xs text-blue-600 hover:text-blue-800'
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className='p-4 text-sm text-gray-500'>Loading...</div>
          )}
          {!loading && list.length === 0 && (
            <div className='p-4 text-sm text-gray-500'>
              No charges created yet
            </div>
          )}

          {list.map(c => (
            <div
              key={c.id}
              className='p-4 flex justify-between items-center text-sm hover:bg-gray-50'
            >
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{c.name}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {c.isRecurring && (
                    <span className='px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800'>
                      Recurring
                    </span>
                  )}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {c.valueType} • {c.value}
                  {c.valueType === 'PERCENTAGE' ? '%' : ''}{' '}
                  {c.type?.toLowerCase() || 'charge'}
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => setShowDetails(c)}
                  className='text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1'
                >
                  <Eye className='h-3 w-3' />
                  View
                </button>
                {c.isActive && (
                  <button
                    onClick={() => setShowApply(c)}
                    className='text-xs text-orange-600 hover:text-orange-800'
                  >
                    Apply
                  </button>
                )}
                <button
                  onClick={() => toggleStatus(c, !c.isActive)}
                  className={`text-xs flex items-center gap-1 ${c.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                >
                  {c.isActive ? (
                    <PowerOff className='h-3 w-3' />
                  ) : (
                    <Power className='h-3 w-3' />
                  )}
                  {c.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Apply Modal */}
        {showApply && (
          <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className='p-6 space-y-6'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-xl font-semibold'>
                    Apply {showApply.name}
                  </h2>
                  <button
                    onClick={() => setShowApply(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={submitApply} className='space-y-6'>
                  <div>
                    <label className='block text-sm font-medium mb-3'>
                      Select Students
                    </label>
                    <StudentSelector
                      selectedStudents={selectedStudents}
                      onStudentsChange={setSelectedStudents}
                      placeholder='Search students by name, roll number, or email...'
                      multiple={true}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium mb-2'>
                        Applied Month (YYYY-MM)
                      </label>
                      <input
                        type='month'
                        className='border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={applyForm.appliedMonth}
                        onChange={e =>
                          setApplyForm(f => ({
                            ...f,
                            appliedMonth: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium mb-2'>
                        Reason (Optional)
                      </label>
                      <input
                        className='border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                        value={applyForm.reason}
                        onChange={e =>
                          setApplyForm(f => ({ ...f, reason: e.target.value }))
                        }
                        placeholder='Enter reason for charge'
                      />
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setShowApply(null)}
                      className='px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                    <button
                      disabled={applying || selectedStudents.length === 0}
                      className='bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors'
                    >
                      {applying
                        ? 'Applying...'
                        : `Apply to ${selectedStudents.length} Student(s)`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && (
          <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-lg'>
              <div className='p-6 space-y-4'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-xl font-semibold'>Charge Details</h2>
                  <button
                    onClick={() => setShowDetails(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    ✕
                  </button>
                </div>

                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Name:</span>
                    <span>{showDetails.name}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Type:</span>
                    <span>{showDetails.type || 'CHARGE'}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Value Type:</span>
                    <span>{showDetails.valueType}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Value:</span>
                    <span>
                      {showDetails.value}
                      {showDetails.valueType === 'PERCENTAGE' ? '%' : ''}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Recurring:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${showDetails.isRecurring ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {showDetails.isRecurring ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Status:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${showDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {showDetails.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Created:</span>
                    <span>
                      {new Date(showDetails.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end pt-4'>
                  <button
                    onClick={() => setShowDetails(null)}
                    className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded'
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
};

export default ChargesPage;
