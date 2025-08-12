'use client';

import React, { useState, useEffect } from 'react';
import GenericTable from '@/components/templates/GenericTable';
import {
  StaffMember,
  getStaffColumns,
} from '@/components/templates/StaffColumns';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  UserCheck,
  Clock,
  Building,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { staffService } from '@/api/services/staff.service';
import { toast } from 'sonner';
import { isDevMockEnabled } from '@/utils';
import StaffSearchFilter, {
  StaffFilters,
} from '@/components/molecules/filters/StaffSearchFilter';
import StaffViewModal from '@/components/organisms/modals/StaffViewModal';
import StaffEditModal from '@/components/organisms/modals/StaffEditModal';
import DeleteConfirmationModal from '@/components/organisms/modals/DeleteConfirmationModal';

// Minimal mock data for dev mode
const mockStaff: StaffMember[] = [
  {
    id: '1',
    email: 'john.wilson@school.edu',
    fullName: 'John Wilson',
    phone: '+1234567890',
    firstName: 'John',
    lastName: 'Wilson',
    designation: 'Administrative Officer',
    department: 'administration',
    basicSalary: 55000,
    allowances: 5000,
    totalSalary: 60000,
    employmentDate: '2023-01-15',
    experienceYears: 8,
    employmentStatus: 'active',
    createdAt: '2023-01-15T00:00:00Z',
    createdById: 'system',

    // Bank account details
    bankName: 'First National Bank',
    bankAccountNumber: '1234567890123456',
    bankBranch: 'Springfield Downtown Branch',
    panNumber: 'ABCDE1234F',
    citizenshipNumber: '12345678901',

    profile: {
      bio: 'Experienced administrator with focus on educational institutions.',
    },
  },
];

// Define filter options
const departmentOptions = [
  { value: 'administration', label: 'Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'library', label: 'Library' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'transport', label: 'Transport' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'academic_support', label: 'Academic Support' },
];

const employmentStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'terminated', label: 'Terminated' },
];

const StaffPage = () => {
  // State management
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<StaffFilters>({
    search: '',
    department: '',
    employmentStatus: '',
    designation: '',
    experienceRange: '',
    salaryRange: '',
  });

  // Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Stats state
  const [stats, setStats] = useState([
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '0',
      label: 'Total Staff',
      change: '0%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '0',
      label: 'Active Staff',
      change: '0%',
      isPositive: true,
    },
    {
      icon: Clock,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '0',
      label: 'On Leave',
      change: '0%',
      isPositive: false,
    },
    {
      icon: Building,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: '0',
      label: 'Departments',
      change: '0%',
      isPositive: true,
    },
  ]);

  // Load staff data
  const loadStaffData = async (page = 1, searchFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use mock data in development mode
      if (isDevMockEnabled()) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setStaffData(mockStaff);
        setTotalItems(mockStaff.length);
        setTotalPages(Math.ceil(mockStaff.length / itemsPerPage));
        updateStats(mockStaff);
        return;
      }

      const params = {
        page,
        limit: itemsPerPage,
        search: searchFilters.search || undefined,
        department: searchFilters.department || undefined,
        employmentStatus: searchFilters.employmentStatus || undefined,
        sortBy: 'fullName',
        sortOrder: 'asc' as const,
      };

      const response = await staffService.getAllStaff(params);

      if (response?.success && response.data) {
        // Handle the response data structure
        let staffArray = [];
        if (Array.isArray(response.data)) {
          staffArray = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          staffArray = response.data.data;
        }

        setStaffData(staffArray);
        setTotalItems(response.data.pagination?.total || staffArray.length);
        setTotalPages(
          response.data.pagination?.totalPages ||
            Math.ceil(staffArray.length / itemsPerPage),
        );
        updateStats(staffArray);
      } else {
        throw new Error(response?.message || 'Failed to load staff data');
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load staff data';
      setError(errorMessage);
      console.error('Error loading staff:', err);

      // Fallback to mock data on error in development
      if (isDevMockEnabled()) {
        setStaffData(mockStaff);
        setTotalItems(mockStaff.length);
        setTotalPages(Math.ceil(mockStaff.length / itemsPerPage));
        updateStats(mockStaff);
        toast.warning('Using mock data', {
          description: 'API connection failed, using sample data',
        });
      } else {
        toast.error('Failed to load staff', {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update stats based on staff data
  const updateStats = (data: StaffMember[]) => {
    const totalStaff = data.length;
    const activeStaff = data.filter(
      s => s.employmentStatus === 'active' || !s.employmentStatus,
    ).length;
    const onLeaveStaff = data.filter(
      s => s.employmentStatus === 'on_leave',
    ).length;
    const departments = new Set(data.map(s => s.department)).size;

    setStats([
      {
        icon: Users,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        value: totalStaff.toString(),
        label: 'Total Staff',
        change: '1.5%',
        isPositive: true,
      },
      {
        icon: UserCheck,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        value: activeStaff.toString(),
        label: 'Active Staff',
        change: '2.1%',
        isPositive: true,
      },
      {
        icon: Clock,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        value: onLeaveStaff.toString(),
        label: 'On Leave',
        change: '0.5%',
        isPositive: false,
      },
      {
        icon: Building,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        value: departments.toString(),
        label: 'Departments',
        change: '0.3%',
        isPositive: true,
      },
    ]);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: StaffFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadStaffData(1, newFilters);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    const clearedFilters: StaffFilters = {
      search: '',
      department: '',
      employmentStatus: '',
      designation: '',
      experienceRange: '',
      salaryRange: '',
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    loadStaffData(1, clearedFilters);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadStaffData(page, filters);
  };

  // Modal handlers
  const handleViewStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setViewModalOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditModalOpen(true);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDeleteModalOpen(true);
  };

  // Handle staff deletion
  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    try {
      const response = await staffService.deleteStaff(selectedStaff.id);

      if (response?.success) {
        toast.success('Staff Deleted', {
          description: `${selectedStaff.fullName} has been removed from the system.`,
        });
        loadStaffData(currentPage, filters);
      } else {
        throw new Error(response?.message || 'Failed to delete staff');
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete staff';
      toast.error('Delete Failed', {
        description: errorMessage,
      });
    } finally {
      setDeleteModalOpen(false);
      setSelectedStaff(null);
    }
  };

  // Handle successful edit/add
  const handleStaffSuccess = () => {
    loadStaffData(currentPage, filters);
  };

  // Load initial data
  useEffect(() => {
    loadStaffData();
  }, []);

  // Get columns configuration
  const columns = getStaffColumns({
    onView: handleViewStaff,
    onEdit: handleEditStaff,
    onDelete: handleDeleteStaff,
  });

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
                Staff Management
              </h1>
              <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
                Manage all staff members and their information
              </p>
            </div>
            <div className='mt-3 sm:mt-0'>
              <ActionButtons pageType='staff' />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={stats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Search and Filters */}
          <StaffSearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            isLoading={isLoading}
          />

          {/* Error State */}
          {error && !isLoading && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center'>
                <AlertCircle className='h-5 w-5 text-red-600 mr-2' />
                <div>
                  <h3 className='text-sm font-medium text-red-800'>
                    Error Loading Staff Data
                  </h3>
                  <p className='text-sm text-red-700 mt-1'>{error}</p>
                  <button
                    onClick={() => loadStaffData(currentPage, filters)}
                    className='text-sm text-red-800 underline hover:text-red-900 mt-2'
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className='bg-white rounded-lg border border-gray-200 p-8'>
              <div className='flex items-center justify-center'>
                <Loader2 className='h-6 w-6 animate-spin text-blue-600 mr-2' />
                <span className='text-gray-600'>Loading staff data...</span>
              </div>
            </div>
          )}

          {/* Staff Table */}
          {!isLoading && !error && (
            <GenericTable<StaffMember>
              data={staffData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              emptyMessage='No staff members found. Try adjusting your search criteria or add new staff members.'
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <StaffViewModal
        staff={selectedStaff}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedStaff(null);
        }}
      />

      <StaffEditModal
        staff={selectedStaff}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedStaff(null);
        }}
        onSuccess={handleStaffSuccess}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleConfirmDelete}
        title='Delete Staff Member'
        message={`Are you sure you want to delete this staff member? This action cannot be undone.`}
        itemName={selectedStaff?.fullName || 'Staff Member'}
      />
    </div>
  );
};

export default StaffPage;
