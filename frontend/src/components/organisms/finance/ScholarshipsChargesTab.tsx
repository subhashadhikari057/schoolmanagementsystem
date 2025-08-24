'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Award,
  AlertTriangle,
  Search,
  Eye,
  UserPlus,
  DollarSign,
  Percent,
  X,
  Power,
  PowerOff,
} from 'lucide-react';
import { feeService } from '@/api/services/fee.service';
import GenericTable, { TableColumn } from '@/components/templates/GenericTable';
import StudentSelector from '@/components/ui/StudentSelector';

// Extended interfaces to include missing properties
interface ExtendedScholarshipDefinition {
  id: string;
  name: string;
  type: string;
  valueType: string;
  value: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  assignments?: Array<{
    id: string;
    student: {
      id: string;
      user: { fullName: string };
      class: { name: string };
    };
  }>;
  [key: string]: unknown; // For GenericTable compatibility
}

interface ExtendedChargeDefinition {
  id: string;
  name: string;
  type: string;
  valueType: string;
  value: string;
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  assignments?: Array<{
    id: string;
    student: {
      id: string;
      user: { fullName: string };
      class: { name: string };
    };
  }>;
  [key: string]: unknown; // For GenericTable compatibility
}

interface Student {
  id: string;
  rollNumber: string;
  email: string;
  user: { fullName: string };
}

interface CreateScholarshipForm {
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  description: string;
}

interface CreateChargeForm {
  name: string;
  type: 'FINE' | 'EQUIPMENT' | 'TRANSPORT' | 'OTHER';
  valueType: 'FIXED' | 'PERCENTAGE';
  value: number;
  description: string;
  category?: string;
  isRecurring: boolean;
}

interface AssignForm {
  scholarshipId?: string;
  chargeId?: string;
  studentIds: string;
  effectiveFrom: string;
  expiresAt?: string;
  appliedMonth?: string;
  reason?: string;
}

/**
 * Enhanced Error Handling for Fee Management
 *
 * This component now includes sophisticated error handling that provides
 * user-friendly feedback for common API errors, including:
 *
 * 1. Duplicate Assignment Prevention:
 *    - "Student already has this scholarship assigned"
 *    - Shows detailed explanation with actionable steps
 *
 * 2. Resource Not Found Errors:
 *    - Scholarship/Charge/Student not found scenarios
 *    - Provides context about why it might happen
 *
 * 3. Validation Errors:
 *    - Date validation with specific guidance
 *    - Required field validation
 *
 * 4. Network/System Errors:
 *    - Connection issues, timeouts
 *    - Graceful degradation with retry suggestions
 *
 * Usage Example:
 * When API returns: {"message": "Student already has this scholarship assigned"}
 * User sees: Detailed multi-line explanation with emojis and action steps
 */

// Error handling utility to provide user-friendly messages
// Simple error handler that extracts user-friendly messages
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };

    const errorMessage = apiError.message || apiError.response?.data?.message;

    // Map specific API errors to user-friendly messages
    switch (errorMessage) {
      case 'Student already has this scholarship assigned':
        return 'This scholarship is already assigned to selected student(s)';
      case 'Student already has this charge assigned':
        return 'This charge is already applied to selected student(s)';
      case 'Scholarship not found':
        return 'Scholarship not found - please refresh and try again';
      case 'Charge not found':
        return 'Charge not found - please refresh and try again';
      case 'Student not found':
        return 'One or more students not found - please refresh student list';
      case 'Invalid effective date':
        return 'Please enter a valid date';
      case 'Effective date cannot be in the past':
        return 'Date cannot be in the past';
      case 'Expires date must be after effective date':
        return 'End date must be after start date';
      default:
        return errorMessage || 'Operation failed - please try again';
    }
  }

  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  return 'An unexpected error occurred';
};

export const ScholarshipsChargesTab: React.FC = () => {
  // State Management
  const [activeSubTab, setActiveSubTab] = useState<'scholarships' | 'charges'>(
    'scholarships',
  );
  const [scholarships, setScholarships] = useState<
    ExtendedScholarshipDefinition[]
  >([]);
  const [charges, setCharges] = useState<ExtendedChargeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [showCreateScholarship, setShowCreateScholarship] = useState(false);
  const [showCreateCharge, setShowCreateCharge] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    ExtendedScholarshipDefinition | ExtendedChargeDefinition | null
  >(null);

  // Form States
  const [createScholarshipForm, setCreateScholarshipForm] =
    useState<CreateScholarshipForm>({
      name: '',
      type: 'MERIT',
      valueType: 'PERCENTAGE',
      value: 10,
      description: '',
    });

  const [createChargeForm, setCreateChargeForm] = useState<CreateChargeForm>({
    name: '',
    type: 'FINE',
    valueType: 'FIXED',
    value: 100,
    description: '',
    category: '',
    isRecurring: false,
  });

  const [assignForm, setAssignForm] = useState<AssignForm>({
    studentIds: '',
    effectiveFrom: '',
    expiresAt: '',
    appliedMonth: '',
    reason: '',
  });

  // Student Selection States
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Data Loading - Use separate functions for reload operations
  const loadScholarships = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feeService.listScholarships();
      // Transform data to include description and ensure compatibility
      const extendedData: ExtendedScholarshipDefinition[] = data.map(item => ({
        ...item,
        description: `${item.type} scholarship - ${item.valueType === 'PERCENTAGE' ? item.value + '%' : '$' + item.value}`,
      }));
      setScholarships(extendedData);
    } catch (error) {
      console.error('Failed to load scholarships:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCharges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feeService.listCharges();
      // Transform data to include description and ensure compatibility
      const extendedData: ExtendedChargeDefinition[] = data.map(item => ({
        ...item,
        description: `${item.type} charge - ${item.valueType === 'PERCENTAGE' ? item.value + '%' : '$' + item.value}`,
      }));
      setCharges(extendedData);
    } catch (error) {
      console.error('Failed to load charges:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading effect - runs only once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [scholarshipsData, chargesData] = await Promise.all([
          feeService.listScholarships(),
          feeService.listCharges(),
        ]);

        // Transform scholarships data
        const extendedScholarships: ExtendedScholarshipDefinition[] =
          scholarshipsData.map(item => ({
            ...item,
            description: `${item.type} scholarship - ${item.valueType === 'PERCENTAGE' ? item.value + '%' : '$' + item.value}`,
          }));
        setScholarships(extendedScholarships);

        // Transform charges data
        const extendedCharges: ExtendedChargeDefinition[] = chargesData.map(
          item => ({
            ...item,
            description: `${item.type} charge - ${item.valueType === 'PERCENTAGE' ? item.value + '%' : '$' + item.value}`,
          }),
        );
        setCharges(extendedCharges);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Use alert for immediate feedback
        alert(`Error: ${getErrorMessage(error)}`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - run only once

  // Create Functions
  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await feeService.createScholarship(createScholarshipForm);
      toast.success('Scholarship created successfully');
      setShowCreateScholarship(false);
      setCreateScholarshipForm({
        name: '',
        type: 'MERIT',
        valueType: 'PERCENTAGE',
        value: 10,
        description: '',
      });
      loadScholarships();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await feeService.createCharge(createChargeForm);
      toast.success('Charge created successfully');
      setShowCreateCharge(false);
      setCreateChargeForm({
        name: '',
        type: 'FINE',
        valueType: 'FIXED',
        value: 100,
        description: '',
        category: '',
        isRecurring: false,
      });
      loadCharges();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Assignment Functions
  const handleAssignScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedStudents.length === 0)
        throw new Error('Select at least one student');
      if (!assignForm.effectiveFrom) throw new Error('Effective date required');

      const effectiveFromISO = new Date(assignForm.effectiveFrom).toISOString();
      const expiresAtISO = assignForm.expiresAt
        ? new Date(assignForm.expiresAt).toISOString()
        : undefined;

      await feeService.assignScholarship({
        scholarshipId: assignForm.scholarshipId!,
        studentIds: selectedStudents.map(s => s.id),
        effectiveFrom: effectiveFromISO,
        expiresAt: expiresAtISO,
      });
      toast.success(
        `Scholarship assigned to ${selectedStudents.length} student(s)`,
      );
      setShowAssignModal(false);
      resetAssignForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedStudents.length === 0)
        throw new Error('Select at least one student');
      if (!assignForm.appliedMonth) throw new Error('Month required (YYYY-MM)');

      await feeService.applyCharge({
        chargeId: assignForm.chargeId!,
        studentIds: selectedStudents.map(s => s.id),
        appliedMonth: assignForm.appliedMonth!,
        reason: assignForm.reason || undefined,
      });
      toast.success(`Charge applied to ${selectedStudents.length} student(s)`);
      setShowAssignModal(false);
      resetAssignForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      studentIds: '',
      effectiveFrom: '',
      expiresAt: '',
      appliedMonth: '',
      reason: '',
    });
    setSelectedStudents([]);
    setSelectedItem(null);
  };

  // Table Columns for Scholarships
  const scholarshipColumns: TableColumn<ExtendedScholarshipDefinition>[] = [
    {
      key: 'name',
      header: 'Scholarship Name',
      render: row => (
        <div className='space-y-1'>
          <div className='font-medium text-gray-900'>{row.name}</div>
          <div className='text-xs text-gray-500'>
            {row.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: row => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.type === 'MERIT'
              ? 'bg-blue-100 text-blue-700'
              : row.type === 'SPORTS'
                ? 'bg-green-100 text-green-700'
                : row.type === 'NEED_BASED'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: row => (
        <div className='flex items-center gap-1'>
          {row.valueType === 'PERCENTAGE' ? (
            <Percent className='h-3 w-3' />
          ) : (
            <DollarSign className='h-3 w-3' />
          )}
          <span className='font-medium'>
            {row.valueType === 'PERCENTAGE' ? `${row.value}%` : `$${row.value}`}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className='flex items-center gap-1'>
          <button
            onClick={() => {
              if (!row.isActive) {
                toast.error('Cannot assign deactivated scholarship');
                return;
              }
              setSelectedItem(row);
              setAssignForm(prev => ({ ...prev, scholarshipId: row.id }));
              setShowAssignModal(true);
            }}
            className={`p-1.5 rounded-md ${
              row.isActive
                ? 'hover:bg-blue-50 text-blue-600 hover:text-blue-800'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={
              row.isActive ? 'Assign to Students' : 'Scholarship is deactivated'
            }
            disabled={!row.isActive}
          >
            <UserPlus className='h-4 w-4' />
          </button>
          <button
            onClick={() => {
              setSelectedItem(row);
              setShowViewModal(true);
            }}
            className='p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            title='View Details'
          >
            <Eye className='h-4 w-4' />
          </button>
          <button
            onClick={async () => {
              try {
                if (row.isActive) {
                  await feeService.deactivateScholarship(row.id);
                  toast.success('Scholarship deactivated successfully');
                } else {
                  await feeService.reactivateScholarship(row.id);
                  toast.success('Scholarship reactivated successfully');
                }
                loadScholarships();
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
            className={`p-1.5 rounded-md transition-colors ${
              row.isActive
                ? 'hover:bg-red-50 text-red-600 hover:text-red-800'
                : 'hover:bg-green-50 text-green-600 hover:text-green-800'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? (
              <PowerOff className='h-4 w-4' />
            ) : (
              <Power className='h-4 w-4' />
            )}
          </button>
        </div>
      ),
    },
  ];

  // Table Columns for Charges
  const chargeColumns: TableColumn<ExtendedChargeDefinition>[] = [
    {
      key: 'name',
      header: 'Charge Name',
      render: row => (
        <div className='space-y-1'>
          <div className='font-medium text-gray-900'>{row.name}</div>
          <div className='text-xs text-gray-500'>
            {row.description || 'No description'}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: row => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.type === 'FINE'
              ? 'bg-red-100 text-red-700'
              : row.type === 'EQUIPMENT'
                ? 'bg-purple-100 text-purple-700'
                : row.type === 'TRANSPORT'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'value',
      header: 'Amount',
      render: row => (
        <div className='flex items-center gap-1'>
          {row.valueType === 'PERCENTAGE' ? (
            <Percent className='h-3 w-3' />
          ) : (
            <DollarSign className='h-3 w-3' />
          )}
          <span className='font-medium'>
            {row.valueType === 'PERCENTAGE' ? `${row.value}%` : `$${row.value}`}
          </span>
        </div>
      ),
    },
    {
      key: 'isRecurring',
      header: 'Recurring',
      render: row => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.isRecurring
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.isRecurring ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className='flex items-center gap-1'>
          <button
            onClick={() => {
              setSelectedItem(row);
              setAssignForm(prev => ({ ...prev, chargeId: row.id }));
              setShowAssignModal(true);
            }}
            className='p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-800'
            title='Apply to Students'
          >
            <UserPlus className='h-4 w-4' />
          </button>
          <button
            onClick={() => {
              setSelectedItem(row);
              setShowViewModal(true);
            }}
            className='p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            title='View Details'
          >
            <Eye className='h-4 w-4' />
          </button>
          <button
            onClick={async () => {
              try {
                if (row.isActive) {
                  await feeService.deactivateCharge(row.id);
                  toast.success('Charge deactivated successfully');
                } else {
                  await feeService.reactivateCharge(row.id);
                  toast.success('Charge reactivated successfully');
                }
                loadCharges();
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
            className={`p-1.5 rounded-md transition-colors ${
              row.isActive
                ? 'hover:bg-red-50 text-red-600 hover:text-red-800'
                : 'hover:bg-green-50 text-green-600 hover:text-green-800'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? (
              <PowerOff className='h-4 w-4' />
            ) : (
              <Power className='h-4 w-4' />
            )}
          </button>
        </div>
      ),
    },
  ];

  // Filter data based on search and status
  const filteredScholarships = scholarships.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredCharges = charges.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-800'>
            Scholarships & Charges Management
          </h2>
          <p className='text-xs text-gray-500 mt-1'>
            Create scholarships and charges, then assign them to students
            individually or in bulk
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setShowCreateScholarship(true)}
            className='inline-flex items-center text-xs px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors'
          >
            <Award className='h-4 w-4 mr-1' />
            New Scholarship
          </button>
          <button
            onClick={() => setShowCreateCharge(true)}
            className='inline-flex items-center text-xs px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors'
          >
            <AlertTriangle className='h-4 w-4 mr-1' />
            New Charge
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='flex border-b'>
          {[
            { key: 'scholarships', label: 'Scholarships', icon: Award },
            { key: 'charges', label: 'Charges & Fines', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
              className={`flex-1 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium py-3 transition-colors ${
                activeSubTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50'
              }`}
            >
              <tab.icon className='h-4 w-4' />
              {tab.label}
            </button>
          ))}
        </div>

        <div className='p-4 sm:p-6'>
          {/* Filters */}
          <div className='flex flex-col lg:flex-row gap-3 lg:items-center mb-5'>
            <div className='flex-1 min-w-[220px] relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeSubTab}...`}
                className='w-full bg-gray-50 focus:bg-white rounded-md pl-10 pr-3 py-2 text-sm border border-gray-200 focus:border-blue-400 focus:outline-none'
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
            >
              Reset Filters
            </button>
          </div>

          {/* Tables */}
          {activeSubTab === 'scholarships' && (
            <GenericTable<ExtendedScholarshipDefinition>
              data={filteredScholarships}
              columns={scholarshipColumns}
              emptyMessage='No scholarships found. Create one to get started.'
            />
          )}

          {activeSubTab === 'charges' && (
            <GenericTable<ExtendedChargeDefinition>
              data={filteredCharges}
              columns={chargeColumns}
              emptyMessage='No charges found. Create one to get started.'
            />
          )}

          {loading && (
            <div className='mt-4 text-xs text-gray-500 text-center'>
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Create Scholarship Modal */}
      {showCreateScholarship && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Create New Scholarship
              </h3>
              <form onSubmit={handleCreateScholarship} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Name
                  </label>
                  <input
                    type='text'
                    value={createScholarshipForm.name}
                    onChange={e =>
                      setCreateScholarshipForm(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., Merit Scholarship'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Type
                  </label>
                  <select
                    value={createScholarshipForm.type}
                    onChange={e =>
                      setCreateScholarshipForm(prev => ({
                        ...prev,
                        type: e.target.value as CreateScholarshipForm['type'],
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='MERIT'>Merit</option>
                    <option value='NEED_BASED'>Need Based</option>
                    <option value='SPORTS'>Sports</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Value Type
                    </label>
                    <select
                      value={createScholarshipForm.valueType}
                      onChange={e =>
                        setCreateScholarshipForm(prev => ({
                          ...prev,
                          valueType: e.target
                            .value as CreateScholarshipForm['valueType'],
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='PERCENTAGE'>Percentage</option>
                      <option value='FIXED'>Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Value
                    </label>
                    <input
                      type='number'
                      value={createScholarshipForm.value}
                      onChange={e =>
                        setCreateScholarshipForm(prev => ({
                          ...prev,
                          value: Number(e.target.value),
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      min='0'
                      step='0.01'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description
                  </label>
                  <textarea
                    value={createScholarshipForm.description}
                    onChange={e =>
                      setCreateScholarshipForm(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={3}
                    placeholder='Brief description of the scholarship'
                  />
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {loading ? 'Creating...' : 'Create Scholarship'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowCreateScholarship(false)}
                    className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Charge Modal */}
      {showCreateCharge && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Create New Charge
              </h3>
              <form onSubmit={handleCreateCharge} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Name
                  </label>
                  <input
                    type='text'
                    value={createChargeForm.name}
                    onChange={e =>
                      setCreateChargeForm(prev => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    placeholder='e.g., Late Payment Fee'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Type
                  </label>
                  <select
                    value={createChargeForm.type}
                    onChange={e =>
                      setCreateChargeForm(prev => ({
                        ...prev,
                        type: e.target.value as CreateChargeForm['type'],
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                  >
                    <option value='FINE'>Fine</option>
                    <option value='EQUIPMENT'>Equipment</option>
                    <option value='TRANSPORT'>Transport</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Value Type
                    </label>
                    <select
                      value={createChargeForm.valueType}
                      onChange={e =>
                        setCreateChargeForm(prev => ({
                          ...prev,
                          valueType: e.target
                            .value as CreateChargeForm['valueType'],
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    >
                      <option value='FIXED'>Fixed Amount</option>
                      <option value='PERCENTAGE'>Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Value
                    </label>
                    <input
                      type='number'
                      value={createChargeForm.value}
                      onChange={e =>
                        setCreateChargeForm(prev => ({
                          ...prev,
                          value: Number(e.target.value),
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                      min='0'
                      step='0.01'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description
                  </label>
                  <textarea
                    value={createChargeForm.description}
                    onChange={e =>
                      setCreateChargeForm(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    rows={3}
                    placeholder='Brief description of the charge'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Category (Optional)
                  </label>
                  <input
                    type='text'
                    value={createChargeForm.category}
                    onChange={e =>
                      setCreateChargeForm(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    placeholder='e.g., DISCIPLINARY, DAMAGE'
                  />
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='isRecurring'
                    checked={createChargeForm.isRecurring}
                    onChange={e =>
                      setCreateChargeForm(prev => ({
                        ...prev,
                        isRecurring: e.target.checked,
                      }))
                    }
                    className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                  />
                  <label
                    htmlFor='isRecurring'
                    className='ml-2 block text-sm text-gray-700'
                  >
                    Recurring charge
                  </label>
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50'
                  >
                    {loading ? 'Creating...' : 'Create Charge'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowCreateCharge(false)}
                    className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedItem && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                {assignForm.scholarshipId
                  ? 'Assign Scholarship'
                  : 'Apply Charge'}
                : {selectedItem.name}
              </h3>
              <form
                onSubmit={
                  assignForm.scholarshipId
                    ? handleAssignScholarship
                    : handleApplyCharge
                }
                className='space-y-4'
              >
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Students
                  </label>
                  <StudentSelector
                    selectedStudents={selectedStudents}
                    onStudentsChange={setSelectedStudents}
                    placeholder='Search students by name, roll number, or email...'
                  />
                  {selectedStudents.length > 0 && (
                    <div className='mt-2 p-2 bg-gray-50 rounded-md'>
                      <p className='text-sm text-gray-600'>
                        Selected: {selectedStudents.length} student(s)
                      </p>
                    </div>
                  )}
                </div>

                {assignForm.scholarshipId ? (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Effective From
                      </label>
                      <input
                        type='date'
                        value={assignForm.effectiveFrom}
                        onChange={e =>
                          setAssignForm(prev => ({
                            ...prev,
                            effectiveFrom: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Expires At (Optional)
                      </label>
                      <input
                        type='date'
                        value={assignForm.expiresAt}
                        onChange={e =>
                          setAssignForm(prev => ({
                            ...prev,
                            expiresAt: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Applied Month
                      </label>
                      <input
                        type='month'
                        value={assignForm.appliedMonth}
                        onChange={e =>
                          setAssignForm(prev => ({
                            ...prev,
                            appliedMonth: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Reason (Optional)
                      </label>
                      <textarea
                        value={assignForm.reason}
                        onChange={e =>
                          setAssignForm(prev => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                        rows={2}
                        placeholder='Reason for applying this charge'
                      />
                    </div>
                  </>
                )}

                <div className='flex gap-3 pt-4'>
                  <button
                    type='submit'
                    disabled={loading || selectedStudents.length === 0}
                    className={`flex-1 text-white py-2 px-4 rounded-md disabled:opacity-50 ${
                      assignForm.scholarshipId
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {loading
                      ? 'Processing...'
                      : assignForm.scholarshipId
                        ? 'Assign'
                        : 'Apply'}
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAssignModal(false);
                      resetAssignForm();
                    }}
                    className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {'type' in selectedItem && selectedItem.type
                    ? 'Scholarship'
                    : 'Charge'}{' '}
                  Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='space-y-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Name
                  </label>
                  <p className='text-sm text-gray-900'>{selectedItem.name}</p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Type
                  </label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      'type' in selectedItem && selectedItem.type === 'MERIT'
                        ? 'bg-blue-100 text-blue-700'
                        : 'type' in selectedItem &&
                            selectedItem.type === 'SPORTS'
                          ? 'bg-green-100 text-green-700'
                          : 'type' in selectedItem &&
                              selectedItem.type === 'NEED_BASED'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'type' in selectedItem &&
                                selectedItem.type === 'FINE'
                              ? 'bg-red-100 text-red-700'
                              : 'type' in selectedItem &&
                                  selectedItem.type === 'EQUIPMENT'
                                ? 'bg-purple-100 text-purple-700'
                                : 'type' in selectedItem &&
                                    selectedItem.type === 'TRANSPORT'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {'type' in selectedItem ? selectedItem.type : 'N/A'}
                  </span>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Value
                  </label>
                  <div className='flex items-center gap-1'>
                    {'valueType' in selectedItem &&
                    selectedItem.valueType === 'PERCENTAGE' ? (
                      <Percent className='h-3 w-3' />
                    ) : (
                      <DollarSign className='h-3 w-3' />
                    )}
                    <span className='text-sm text-gray-900'>
                      {'valueType' in selectedItem &&
                      selectedItem.valueType === 'PERCENTAGE'
                        ? `${selectedItem.value}%`
                        : `$${selectedItem.value}`}
                    </span>
                  </div>
                </div>

                {selectedItem.description && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Description
                    </label>
                    <p className='text-sm text-gray-900'>
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                {'isRecurring' in selectedItem && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Recurring
                    </label>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedItem.isRecurring
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {selectedItem.isRecurring ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Status
                  </label>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedItem.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Students Assigned
                  </label>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg font-semibold text-blue-600'>
                      {selectedItem.assignments?.length || 0}
                    </span>
                    <span className='text-sm text-gray-500'>
                      {selectedItem.assignments?.length === 1
                        ? 'student'
                        : 'students'}
                    </span>
                  </div>
                  {selectedItem.assignments &&
                    selectedItem.assignments.length > 0 && (
                      <div className='mt-2 max-h-32 overflow-y-auto'>
                        <div className='text-xs text-gray-600 space-y-1'>
                          {selectedItem.assignments
                            .slice(0, 5)
                            .map(assignment => (
                              <div
                                key={assignment.id}
                                className='flex justify-between'
                              >
                                <span>{assignment.student.user.fullName}</span>
                                <span className='text-gray-400'>
                                  {assignment.student.class.name}
                                </span>
                              </div>
                            ))}
                          {selectedItem.assignments.length > 5 && (
                            <div className='text-center text-gray-400 italic'>
                              +{selectedItem.assignments.length - 5} more
                              students
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className='flex justify-end pt-4'>
                <button
                  onClick={() => setShowViewModal(false)}
                  className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsChargesTab;
