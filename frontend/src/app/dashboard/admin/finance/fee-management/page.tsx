'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import PermissionGate from '@/components/auth/PermissionGate';
import GenericTable, { TableColumn } from '@/components/templates/GenericTable';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import ViewFeeStructureModal from '@/components/organisms/modals/ViewFeeStructureModal';
import EditFeeStructureModal from '@/components/organisms/modals/EditFeeStructureModal';
import FeeStructureHistoryModal from '@/components/organisms/modals/FeeStructureHistoryModal';
import ScholarshipsChargesTab from '@/components/organisms/finance/ScholarshipsChargesTab';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { feeService, FeeStructure } from '@/api/services';
import { toast } from 'sonner';
import {
  Layers,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Clock,
  X,
} from 'lucide-react';

interface FeeStructureDetailed {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  effectiveFrom: string;
  createdAt: string;
  classId: string;
  grade?: number;
  section?: string;
  assignedClasses: Array<{
    id: string;
    grade: number | null;
    section: string | null;
  }>;
  studentCount: number;
  items: Array<{ id: string; label: string; amount: string | number }>;
  totalAnnual?: string | number;
  latestVersion: number;
}

interface FeeStructureRow extends Record<string, unknown> {
  id: string;
  name: string;
  academicYear: string;
  components: { label: string; amount: number }[];
  totalComponents: number;
  assignedClasses: { id: string; label: string }[];
  totalStudents: number;
  // Added for modal compatibility
  status: string;
  effectiveFrom: string;
  createdAt: string;
  classId: string;
  grade?: number;
  section?: string;
  items: { id: string; label: string; amount: string | number }[];
  studentCount: number;
  latestVersion: number;
  totalAnnual?: string | number;
}

// Enhanced error handling utility for user-friendly messages
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      response?: { data?: { message?: string } };
      error?: { message?: string };
    };

    const errorMessage =
      apiError.message ||
      apiError.response?.data?.message ||
      apiError.error?.message;

    // Map specific API errors to user-friendly messages
    switch (errorMessage) {
      case 'Network Error':
      case 'ERR_NETWORK':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'Request timeout':
      case 'TIMEOUT':
        return 'Request timed out. The server is taking too long to respond. Please try again.';
      case 'Unauthorized':
      case 'Authentication failed':
        return 'Your session has expired. Please refresh the page and log in again.';
      case 'Forbidden':
      case 'Access denied':
        return 'You do not have permission to perform this action. Contact your administrator.';
      case 'Fee structure not found':
        return 'The fee structure could not be found. It may have been deleted or moved.';
      case 'Class not found':
        return 'The selected class could not be found. Please refresh and try again.';
      case 'Academic year invalid':
        return 'Invalid academic year selected. Please choose a valid academic year.';
      case 'Duplicate fee structure':
        return 'A fee structure already exists for this class and academic year.';
      case 'Invalid date format':
        return 'Please enter a valid date in the correct format.';
      case 'Date in the past':
        return 'The effective date cannot be in the past. Please select a future date.';
      case 'Missing required fields':
        return 'Please fill in all required fields before submitting.';
      case 'Invalid amount':
        return 'Please enter valid amounts for all fee components.';
      case 'Database connection failed':
        return 'Database connection error. Please try again in a few moments.';
      case 'Server error':
      case 'Internal server error':
        return 'Server error occurred. Our technical team has been notified. Please try again later.';
      default:
        // Handle numeric field overflow errors specifically
        if (
          errorMessage?.includes('numeric field overflow') ||
          errorMessage?.includes('precision 10, scale 2')
        ) {
          return 'One or more amounts are too large. Please ensure amounts are less than 100,000,000 (100 million).';
        }
        if (errorMessage?.includes('A field with precision')) {
          return 'Amount value is too large for the database. Please use a smaller amount.';
        }
        return (
          errorMessage ||
          'An unexpected error occurred. Please try again or contact support if the problem persists.'
        );
    }
  }

  if (error instanceof Error) {
    return error.message || 'An error occurred while processing your request.';
  }

  return 'An unexpected error occurred. Please try again.';
};

function mapApiToRow(structure: FeeStructure): FeeStructureRow {
  const assignedClasses = structure.assignedClasses || [];

  return {
    id: structure.id,
    name: structure.name,
    academicYear: structure.academicYear,
    components: structure.items.map(item => ({
      label: item.label,
      amount: Number(item.amount),
    })),
    totalComponents: structure.items.length,
    assignedClasses: assignedClasses.map(classItem => ({
      id: classItem.id,
      label: `${classItem.grade}${classItem.section || ''}`,
    })),
    totalStudents: structure.studentCount,
    // Added for modal compatibility
    status: (structure.status as 'ACTIVE' | 'ARCHIVED' | 'DRAFT') || 'ACTIVE',
    effectiveFrom: structure.effectiveFrom || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    classId: assignedClasses[0]?.id || '',
    grade: assignedClasses[0]?.grade || undefined,
    section: assignedClasses[0]?.section || undefined,
    items: structure.items.map(item => ({
      id: item.id || crypto.randomUUID(),
      label: item.label,
      amount: item.amount,
    })),
    studentCount: structure.studentCount,
    latestVersion: structure.latestVersion || 1,
    totalAnnual: structure.totalAnnual || 0,
  };
}
const FeeManagementPage = () => {
  // Tab management using index instead of string
  const [activeTab, setActiveTab] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<FeeStructureRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [viewTarget, setViewTarget] = useState<FeeStructureRow | null>(null);
  const [editTarget, setEditTarget] = useState<FeeStructureRow | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FeeStructureRow | null>(
    null,
  );

  const fetchStructures = useCallback(
    async (forceAll = false) => {
      setLoading(true);
      setError(null);
      try {
        const params: { academicYear?: string } = {};
        // If forceAll is true, don't apply year filter to ensure new structures are visible
        if (!forceAll && yearFilter !== 'all') params.academicYear = yearFilter;

        console.log(
          'Fetching fee structures with params:',
          params,
          'forceAll:',
          forceAll,
        );
        const result = await feeService.listStructures(params);
        console.log('Fee structures API response:', result); // Temporary debug
        console.log('Response structure - data:', result.data);
        console.log('Response structure - success:', result.success);

        // Handle different response structures
        let structuresData: FeeStructure[] = [];
        if (result.success && result.data) {
          // Check if result.data is paginated or direct array
          if (Array.isArray(result.data)) {
            structuresData = result.data;
          } else if (result.data.data && Array.isArray(result.data.data)) {
            structuresData = result.data.data;
          }
        }

        console.log('Structures data to process:', structuresData);

        // Convert service response to expected format
        const rows: FeeStructureRow[] = structuresData.map((s: FeeStructure) =>
          mapApiToRow(s),
        );
        console.log('Converted rows:', rows.length);
        setApiData(rows);
      } catch (err) {
        console.error('Error fetching structures:', err);

        // Enhanced error handling with user-friendly messages
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);

        // Show popup instead of just setting error state
        toast.error('Failed to Load Fee Structures', {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    },
    [yearFilter],
  );

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Update view modal data when apiData changes (after edit)
  useEffect(() => {
    if (viewTarget && apiData.length > 0) {
      const updatedStructure = apiData.find(s => s.id === viewTarget.id);
      if (
        updatedStructure &&
        updatedStructure.effectiveFrom !== viewTarget.effectiveFrom
      ) {
        console.log('Main page: Updating view modal with fresh data', {
          old: viewTarget.effectiveFrom,
          new: updatedStructure.effectiveFrom,
        });
        setViewTarget(updatedStructure);
      }
    }
  }, [apiData, viewTarget]);

  const filteredData = useMemo(() => {
    return apiData.filter(fs => {
      // Search filter - case insensitive across multiple fields
      const searchLower = search.toLowerCase();
      const matchesSearch =
        fs.name.toLowerCase().includes(searchLower) ||
        fs.academicYear.toLowerCase().includes(searchLower) ||
        fs.assignedClasses.some(cls =>
          cls.label.toLowerCase().includes(searchLower),
        ) ||
        fs.items.some(item => item.label.toLowerCase().includes(searchLower));

      // Year filter
      const matchesYear =
        yearFilter === 'all' || fs.academicYear === yearFilter;

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        fs.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [apiData, search, yearFilter, statusFilter]);

  // Stats (placeholder – adapt to real aggregates later)
  const stats = [
    {
      icon: Layers,
      bgColor: 'bg-blue-500',
      iconColor: 'text-white',
      value: apiData.length.toString(),
      label: 'Fee Structures',
      change: '',
      isPositive: true,
    },
    {
      icon: Users,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: apiData.reduce((a, c) => a + c.totalStudents, 0).toString(),
      label: 'Students Covered',
      change: '',
      isPositive: true,
    },
    {
      icon: DollarSign,
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      value: apiData.reduce((a, c) => a + c.totalComponents, 0).toString(),
      label: 'Total Components',
      change: '',
      isPositive: true,
    },
    {
      icon: TrendingUp,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      value: '—',
      label: 'Collection Rate',
      change: '',
      isPositive: true,
    },
  ];

  // Columns (status removed per requirement)
  const columns: TableColumn<FeeStructureRow>[] = [
    {
      key: 'name',
      header: 'Structure',
      render: row => (
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>{row.name}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                row.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className='text-[10px] text-gray-500'>{row.academicYear}</div>
        </div>
      ),
    },
    {
      key: 'totalComponents',
      header: 'Components',
      render: row => (
        <div className='text-xs font-medium'>{row.totalComponents}</div>
      ),
    },
    {
      key: 'assignedClasses',
      header: 'Assignments',
      render: item => (
        <div className='text-xs flex flex-wrap gap-1 max-w-[240px]'>
          {item.assignedClasses.slice(0, 6).map(c => (
            <span
              key={c.id}
              className='px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-medium'
            >
              {c.label}
            </span>
          ))}
          {item.assignedClasses.length > 6 && (
            <span className='text-[10px] text-gray-500'>
              +{item.assignedClasses.length - 6} more
            </span>
          )}
          <span className='ml-auto text-[10px] text-gray-600'>
            Students: {item.totalStudents}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: item => (
        <div className='flex items-center gap-1'>
          <button
            onClick={() => {
              try {
                setViewTarget(item);
              } catch (err) {
                console.error('Error opening view modal:', err);
                toast.error('Failed to open details view', {
                  description:
                    'Unable to load fee structure details. Please try again.',
                });
              }
            }}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-blue-600 hover:text-blue-800'
            title='View Details'
          >
            <Eye className='h-4 w-4' />
          </button>
          <button
            onClick={() => {
              try {
                setEditTarget(item);
              } catch (err) {
                console.error('Error opening edit modal:', err);
                toast.error('Failed to open edit form', {
                  description:
                    'Unable to load fee structure for editing. Please try again.',
                });
              }
            }}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-green-600 hover:text-green-800'
            title='Edit Structure'
          >
            <Edit className='h-4 w-4' />
          </button>
          <button
            onClick={() => {
              try {
                setHistoryTarget(item);
              } catch (err) {
                console.error('Error opening history modal:', err);
                toast.error('Failed to open history view', {
                  description:
                    'Unable to load fee structure history. Please try again.',
                });
              }
            }}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-purple-600 hover:text-purple-800'
            title='View History'
          >
            <Clock className='h-4 w-4' />
          </button>
          <button
            onClick={async () => {
              try {
                // Toggle status between ACTIVE and ARCHIVED
                const newStatus =
                  item.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';

                // For now, update the local state immediately to show the change
                setApiData(prevData =>
                  prevData.map(structure =>
                    structure.id === item.id
                      ? { ...structure, status: newStatus }
                      : structure,
                  ),
                );

                // TODO: Uncomment when API is ready
                // await feeService.updateStatus(item.id, newStatus);

                toast.success(
                  `Fee structure ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
                );

                // Optionally, refresh data from server
                // await fetchStructures(true);
              } catch (err) {
                toast.error('Failed to update status');
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              item.status === 'ACTIVE'
                ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
                : 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800'
            }`}
            title={
              item.status === 'ACTIVE'
                ? 'Deactivate Structure'
                : 'Activate Structure'
            }
          >
            {item.status === 'ACTIVE' ? (
              <>
                <svg
                  className='w-3.5 h-3.5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
                    clipRule='evenodd'
                  />
                </svg>
                Deactivate
              </>
            ) : (
              <>
                <svg
                  className='w-3.5 h-3.5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.107 10.5a.75.75 0 00-1.214 1.029l2.357 2.786a.75.75 0 001.214-.094l3.857-5.09z'
                    clipRule='evenodd'
                  />
                </svg>
                Activate
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  // Tab content components - Memoized to prevent unnecessary re-renders
  const FeeStructuresTabContent = useMemo(
    () => (
      <div className='p-4 sm:p-6'>
        {/* Top Bar */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5'>
          <div>
            <h2 className='text-lg font-semibold text-gray-800'>
              Fee Structure Management
            </h2>
            <p className='text-xs text-gray-500 mt-1'>
              Create and manage fee structures for different grades and academic
              years
            </p>
          </div>
          <div className='flex justify-end'>
            <ActionButtons
              pageType='fee-management'
              onRefresh={() => {
                try {
                  // Reset year filter to 'all' and force fetch all to show new structures
                  setYearFilter('all');
                  fetchStructures(true);
                  toast.success('Data refreshed successfully');
                } catch (err) {
                  console.error('Error during refresh:', err);
                  toast.error('Failed to refresh data', {
                    description:
                      'Unable to reload fee structures. Please try again.',
                  });
                }
              }}
              onAddNew={undefined}
            />
          </div>
        </div>

        {/* Filters */}
        <div className='flex flex-col lg:flex-row gap-3 lg:items-center mb-5'>
          <div className='flex-1 min-w-[220px] relative'>
            <input
              id='fee-structure-search'
              key='fee-structure-search-input'
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setSearch('');
                  e.currentTarget.blur();
                }
              }}
              placeholder='Search fee structures by name, year, class, or components...'
              className='w-full bg-gray-50 focus:bg-white rounded-md px-3 py-2 pr-10 text-sm border border-gray-200 focus:border-blue-400 focus:outline-none transition-colors'
              autoComplete='off'
            />
            {search && (
              <button
                type='button'
                onClick={() => {
                  try {
                    setSearch('');
                    toast.success('Search cleared');
                  } catch (err) {
                    console.error('Error clearing search:', err);
                  }
                }}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                title='Clear search (ESC)'
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700'
          >
            <option value='all'>All Years</option>
            <option value='2080'>2080 BS</option>
            <option value='2081'>2081 BS</option>
            <option value='2082'>2082 BS</option>
            <option value='2083'>2083 BS</option>
            <option value='2084'>2084 BS</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700'
          >
            <option value='all'>All Status</option>
            <option value='ACTIVE'>Active</option>
            <option value='DRAFT'>Draft</option>
            <option value='ARCHIVED'>Archived</option>
          </select>
          <button
            onClick={() => {
              try {
                setSearch('');
                setYearFilter('all');
                setStatusFilter('all');
                toast.success('Filters reset successfully');
              } catch (err) {
                console.error('Error resetting filters:', err);
                toast.error('Failed to reset filters', {
                  description:
                    'Unable to clear current filters. Please refresh the page.',
                });
              }
            }}
            className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
          >
            Reset Filters
          </button>
          <button
            onClick={() => {
              try {
                console.log('Manual refresh clicked');
                setYearFilter('all');
                fetchStructures(true);
                toast.success('Data refreshed manually');
              } catch (err) {
                console.error('Error during manual refresh:', err);
                toast.error('Manual refresh failed', {
                  description:
                    'Unable to reload data manually. Please try again.',
                });
              }
            }}
            className='text-xs px-3 py-2 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600'
          >
            🔄 Manual Refresh
          </button>
        </div>

        {/* Results Summary */}
        <div className='mb-4'>
          <p className='text-xs text-gray-500'>
            Showing {filteredData.length} of {apiData.length} fee structures
            {search && ` matching "${search}"`}
            {yearFilter !== 'all' && ` for year "${yearFilter}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </p>
        </div>

        {/* Table */}
        <GenericTable<FeeStructureRow>
          data={filteredData as FeeStructureRow[]}
          columns={columns as TableColumn<FeeStructureRow>[]}
          emptyMessage={
            search || yearFilter !== 'all' || statusFilter !== 'all'
              ? 'No fee structures match your current filters. Try adjusting your search criteria.'
              : 'No fee structures found. Create one to get started.'
          }
        />
        {loading && (
          <div className='mt-4 text-xs text-blue-600'>
            Loading structures...
          </div>
        )}
        {error && <div className='mt-4 text-xs text-red-600'>{error}</div>}
        {!loading && !error && (
          <div className='mt-4 text-xs text-gray-500 space-y-1'>
            <div>
              Total structures: {apiData.length} | Filtered:{' '}
              {filteredData.length}
            </div>
            <div>
              Active: {apiData.filter(s => s.status === 'ACTIVE').length} |
              Draft: {apiData.filter(s => s.status === 'DRAFT').length} |
              Archived: {apiData.filter(s => s.status === 'ARCHIVED').length}
            </div>
            <div>
              Total students covered:{' '}
              {apiData.reduce((acc, s) => acc + s.totalStudents, 0)} | Total
              components:{' '}
              {apiData.reduce((acc, s) => acc + s.totalComponents, 0)}
            </div>
          </div>
        )}
      </div>
    ),
    [
      apiData,
      filteredData,
      search,
      yearFilter,
      statusFilter,
      loading,
      error,
      setYearFilter,
      fetchStructures,
    ],
  );

  // Tab configuration for GenericTabs
  const tabs = useMemo(
    () => [
      {
        name: 'Fee Structures',
        content: FeeStructuresTabContent,
      },
      {
        name: 'Scholarships & Charges',
        content: <ScholarshipsChargesTab />,
      },
    ],
    [FeeStructuresTabContent],
  );

  // Convert FeeStructureRow to FeeStructureDetailed for modals
  const convertToDetailed = (row: FeeStructureRow): FeeStructureDetailed => ({
    ...row,
    assignedClasses: row.assignedClasses.map(cls => ({
      id: cls.id,
      grade: row.grade || null,
      section: row.section || null,
    })),
  });

  return (
    <PermissionGate required={['FINANCE_MANAGE_FEES']}>
      <div className='min-h-screen bg-background'>
        {/* Header */}
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Fee Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage fee structures, assignments and financial reports
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
          <div className='max-w-7xl mx-auto'>
            <Statsgrid stats={stats} />
          </div>
        </div>

        {/* Tabs */}
        <div className='px-1 sm:px-2 lg:px-4 mt-2 sm:mt-4 lg:mt-6'>
          <div className='max-w-7xl mx-auto'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
              <GenericTabs
                tabs={tabs}
                selectedIndex={activeTab}
                onChange={index => setActiveTab(index)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewTarget && (
        <ViewFeeStructureModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          structure={convertToDetailed(viewTarget)}
        />
      )}

      {editTarget && (
        <EditFeeStructureModal
          isOpen={!!editTarget}
          onClose={() => {
            try {
              setEditTarget(null);
            } catch (err) {
              console.error('Error closing edit modal:', err);
              // Force close anyway
              setEditTarget(null);
            }
          }}
          onSuccess={async () => {
            try {
              const editedStructureId = editTarget.id;
              setEditTarget(null);

              // Refresh the data
              await fetchStructures(true);

              // If view modal is open for the same structure, we'll update it in a useEffect
              // since fetchStructures updates apiData asynchronously

              toast.success('Fee structure updated successfully');
            } catch (err) {
              console.error('Error after successful edit:', err);
              setEditTarget(null);
              toast.error('Update completed but failed to refresh data', {
                description: 'Please manually refresh to see the changes.',
              });
            }
          }}
          structure={convertToDetailed(editTarget)}
        />
      )}

      {historyTarget && (
        <FeeStructureHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          structureId={historyTarget?.id || null}
          structureName={historyTarget?.name}
        />
      )}
    </PermissionGate>
  );
};

export default FeeManagementPage;
