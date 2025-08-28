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
import { feeService, FeeStructure } from '@/api/services';
import {
  Layers,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Clock,
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
  // Tabs
  const [activeTab, setActiveTab] = useState<
    'structures' | 'scholarships-charges'
  >('structures');
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

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { academicYear?: string } = {};
      if (yearFilter !== 'all') params.academicYear = yearFilter;

      const result = await feeService.listStructures(params);
      console.log('Fee structures API response:', result); // Temporary debug

      // Convert service response to expected format - result is Paginated<FeeStructure>
      const rows: FeeStructureRow[] = (result?.data?.data || []).map(
        (s: FeeStructure) => mapApiToRow(s),
      );
      setApiData(rows);
    } catch (err) {
      console.error(err);
      setError('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const filteredData = useMemo(() => {
    return apiData.filter(fs => {
      const matchesSearch = fs.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesYear =
        yearFilter === 'all' || fs.academicYear === yearFilter;
      return matchesSearch && matchesYear;
    });
  }, [apiData, search, yearFilter]);

  // Stats (placeholder – adapt to real aggregates later)
  const stats = [
    {
      icon: Layers,
      bgColor: 'bg-blue-50',
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
          <div className='font-medium text-gray-900'>{row.name}</div>
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
            onClick={() => setViewTarget(item)}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-blue-600 hover:text-blue-800'
            title='View Details'
          >
            <Eye className='h-4 w-4' />
          </button>
          <button
            onClick={() => setEditTarget(item)}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-green-600 hover:text-green-800'
            title='Edit Structure'
          >
            <Edit className='h-4 w-4' />
          </button>
          <button
            onClick={() => setHistoryTarget(item)}
            className='p-1.5 rounded-md hover:bg-gray-100 transition-colors text-purple-600 hover:text-purple-800'
            title='View History'
          >
            <Clock className='h-4 w-4' />
          </button>
        </div>
      ),
    },
  ];

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
              <div className='flex border-b'>
                {[
                  { key: 'structures', label: 'Fee Structures' },
                  {
                    key: 'scholarships-charges',
                    label: 'Scholarships & Charges',
                  },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex-1 text-xs sm:text-sm font-medium py-3 transition-colors ${activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 bg-gray-50'} `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'structures' && (
                <div className='p-4 sm:p-6'>
                  {/* Top Bar */}
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5'>
                    <div>
                      <h2 className='text-lg font-semibold text-gray-800'>
                        Fee Structure Management
                      </h2>
                      <p className='text-xs text-gray-500 mt-1'>
                        Create and manage fee structures for different grades
                        and academic years
                      </p>
                    </div>
                    <ActionButtons
                      pageType='fee-management'
                      onRefresh={fetchStructures}
                      onAddNew={undefined}
                    />
                  </div>

                  {/* Filters */}
                  <div className='flex flex-col lg:flex-row gap-3 lg:items-center mb-5'>
                    <div className='flex-1 min-w-[220px]'>
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder='Search fee structures...'
                        className='w-full bg-gray-50 focus:bg-white rounded-md px-3 py-2 text-sm border border-gray-200 focus:border-blue-400 focus:outline-none'
                      />
                    </div>
                    <select
                      value={yearFilter}
                      onChange={e => setYearFilter(e.target.value)}
                      className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700'
                    >
                      <option value='all'>All Years</option>
                      <option value='2024-25'>2024-25</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700'
                    >
                      <option value='all'>All Status</option>
                      <option value='Active'>Active</option>
                      <option value='Draft'>Draft</option>
                    </select>
                    <button
                      onClick={() => {
                        setSearch('');
                        setYearFilter('all');
                        setStatusFilter('all');
                      }}
                      className='text-xs px-3 py-2 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
                    >
                      Reset Filters
                    </button>
                  </div>

                  {/* Table */}
                  <GenericTable<FeeStructureRow>
                    data={filteredData as FeeStructureRow[]}
                    columns={columns as TableColumn<FeeStructureRow>[]}
                    emptyMessage='No fee structures match your filters'
                  />
                  {loading && (
                    <div className='mt-4 text-xs text-gray-500'>Loading...</div>
                  )}
                  {error && (
                    <div className='mt-4 text-xs text-red-600'>{error}</div>
                  )}
                </div>
              )}

              {activeTab === 'scholarships-charges' && (
                <ScholarshipsChargesTab />
              )}
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
          onClose={() => setEditTarget(null)}
          onSuccess={async () => {
            setEditTarget(null);
            await fetchStructures(); // Refresh data
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
