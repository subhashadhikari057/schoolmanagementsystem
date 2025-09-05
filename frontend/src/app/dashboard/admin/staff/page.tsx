'use client';

import React, { useState, useEffect } from 'react';
import GenericTable from '@/components/templates/GenericTable';
import { Staff } from '@/components/templates/listConfigurations';
import { getStaffColumns } from '@/components/templates/StaffColumns';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  Briefcase,
  Calendar,
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
const mockStaff: Staff[] = [
  {
    id: 1,
    name: 'John Smith',
    department: 'Administration',
    position: 'Office Manager',
    status: 'Active' as const,
    email: 'john.smith@example.com',
    phone: '+1234567890',
    employeeId: 'S-2025-001',
    joinedDate: '2025-05-01',
  },
];

// Define filter options
const designationOptions = [
  { value: 'office-manager', label: 'Office Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'security-officer', label: 'Security Officer' },
  { value: 'it-support', label: 'IT Support' },
];

const departmentOptions = [
  { value: 'administration', label: 'Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'it_support', label: 'IT Support' },
];

const StaffPage = () => {
  // State for managing real data
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<StaffFilters>({
    search: '',
    designation: '',
    department: '',
  });

  // State for modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  // Calculate stats from real data
  const calculateStats = (staffData: Staff[]) => {
    const total = staffData.length;
    const active = staffData.filter(s => s.status === 'Active').length;
    const onLeave = staffData.filter(s => s.status === 'On Leave').length;
    const newHires = staffData.filter(s => {
      if (!s.joinedDate) return false;
      const joinDate = new Date(s.joinedDate as string);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return joinDate >= threeMonthsAgo;
    }).length;

    return [
      {
        icon: Users,
        bgColor: 'bg-blue-600',
        iconColor: 'text-white',
        value: total.toString(),
        label: 'Total Staff',
        change: '2.5%',
        isPositive: true,
      },
      {
        icon: Briefcase,
        bgColor: 'bg-green-600',
        iconColor: 'text-white',
        value: active.toString(),
        label: 'Active Staff',
        change: '1.2%',
        isPositive: true,
      },
      {
        icon: Calendar,
        bgColor: 'bg-yellow-600',
        iconColor: 'text-white',
        value: onLeave.toString(),
        label: 'On Leave',
        change: '3.8%',
        isPositive: false,
      },
      {
        icon: Building,
        bgColor: 'bg-purple-600',
        iconColor: 'text-white',
        value: newHires.toString(),
        label: 'New Hires',
        change: '12.7%',
        isPositive: true,
      },
    ];
  };

  const staffStats = calculateStats(staff);

  // Load staff from backend or use mock in dev mode
  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);

    // Close all modals and clear selected staff to prevent stale state
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedStaff(null);

    if (isDevMockEnabled()) {
      // Use mock data
      setTimeout(() => {
        setStaff(mockStaff);
        setFilteredStaff(mockStaff);
        setTotalItems(mockStaff.length);
        setTotalPages(Math.max(1, Math.ceil(mockStaff.length / itemsPerPage)));
        setIsLoading(false);
      }, 500); // Simulate network delay
      return;
    }

    try {
      const response = await staffService.getAllStaff({
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        department: filters.department || undefined,
        // employmentStatus filter not in UI; designation handled client-side
      });
      if (response.success && response.data) {
        const payload: any = response.data as any;
        const staffArray: any[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const mappedStaff: Staff[] = staffArray.map(
          (s: Record<string, unknown>, index: number): Staff =>
            ({
              id: (s.id as number) || index + 1,
              name: (s.fullName as string) || ((s as any).name as string),
              department: (s.department as string) || 'General',
              position:
                (s.position as string) || (s.designation as string) || 'Staff',
              status:
                (s.employmentStatus as string) === 'active'
                  ? 'Active'
                  : (s.employmentStatus as string) === 'on_leave'
                    ? 'On Leave'
                    : 'Inactive',
              email: s.email as string,
              phone: s.phone as string,
              employeeId: (s.employeeId as string) || '',
              joinedDate: s.employmentDate
                ? (s.employmentDate as string).split('T')[0]
                : undefined,
              salary: (s as any).totalSalary as number,
              lastActivity: (s as any).lastActivity as string,
              avatar: (s as any).avatar as string,
              staffId: (s as any).staffId as string,
              isOnline:
                (s.employmentStatus as string) === 'active' &&
                (s as any).lastActivity &&
                new Date((s as any).lastActivity as string) >
                  new Date(Date.now() - 10 * 60 * 1000),
            }) as Staff,
        );

        setStaff(mappedStaff);

        // Apply client-only designation filter if provided
        if (filters.designation) {
          const filtered = mappedStaff.filter(st => {
            if (!st.position) return false;
            return designationOptions.some(
              option =>
                (option.value === filters.designation &&
                  st.position?.toLowerCase() === option.label.toLowerCase()) ||
                st.position?.toLowerCase() ===
                  filters.designation.toLowerCase(),
            );
          });
          setFilteredStaff(filtered);
        } else {
          setFilteredStaff(mappedStaff);
        }

        const totalFromResponse: number | undefined =
          typeof payload?.total === 'number'
            ? payload.total
            : typeof payload?.count === 'number'
              ? payload.count
              : typeof payload?.pagination?.total === 'number'
                ? payload.pagination.total
                : undefined;
        const computedTotal = totalFromResponse ?? mappedStaff.length;
        setTotalItems(computedTotal);

        const pagesFromResponse: number | undefined =
          typeof payload?.totalPages === 'number'
            ? payload.totalPages
            : typeof payload?.pagination?.totalPages === 'number'
              ? payload.pagination.totalPages
              : undefined;
        setTotalPages(
          pagesFromResponse ??
            Math.max(1, Math.ceil(computedTotal / itemsPerPage)),
        );
      } else {
        throw new Error(response.message || 'Failed to load staff');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading staff:', error);
      setError(error.message || 'Failed to load staff');
      toast.error('Failed to load staff', {
        description: 'Unable to fetch staff data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when page or server-applied filters change
  useEffect(() => {
    loadStaff();
  }, [currentPage, filters.search, filters.department]);

  // Apply filters to staff
  const applyFilters = (filters: StaffFilters) => {
    setFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change

    let result = [...staff];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        staff =>
          staff.name?.toLowerCase().includes(searchTerm) ||
          staff.email?.toLowerCase().includes(searchTerm) ||
          staff.department?.toLowerCase().includes(searchTerm) ||
          staff.position?.toLowerCase().includes(searchTerm) ||
          // Add search by employee ID - use non-strict comparison to handle both string and number types
          (staff.employeeId &&
            staff.employeeId.toString().toLowerCase().includes(searchTerm)),
      );
    }

    // Apply designation filter
    if (filters.designation) {
      result = result.filter(staff => {
        if (!staff.position) return false;
        // Check if the position value matches the option value or label
        return designationOptions.some(
          option =>
            (option.value === filters.designation &&
              staff.position?.toLowerCase() === option.label.toLowerCase()) ||
            staff.position?.toLowerCase() === filters.designation.toLowerCase(),
        );
      });
    }

    // Apply department filter
    if (filters.department) {
      result = result.filter(staff => {
        if (!staff.department) return false;
        return departmentOptions.some(
          option =>
            (option.value === filters.department &&
              staff.department?.toLowerCase() === option.label.toLowerCase()) ||
            staff.department?.toLowerCase() ===
              filters.department.toLowerCase(),
        );
      });
    }

    setFilteredStaff(result);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: StaffFilters) => {
    applyFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle staff actions
  const handleStaffAction = async (action: string, staffMember: Staff) => {
    // View action
    if (action === 'view') {
      setSelectedStaff(staffMember);
      setViewModalOpen(true);
      return;
    }

    // Edit action
    if (action === 'edit') {
      setSelectedStaff(staffMember);
      setEditModalOpen(true);
      return;
    }

    // Toggle status action
    if (action === 'toggle-status') {
      try {
        const newStatus =
          staffMember.status === 'Active' ? 'Inactive' : 'Active';

        // Optimistically update UI first for better UX
        const updatedStaff = {
          ...staffMember,
          status: newStatus as
            | 'Active'
            | 'Inactive'
            | 'On Leave'
            | 'Suspended'
            | 'Transferred',
        };
        const updatedStaffList = staff.map((s: Staff) =>
          s.id === staffMember.id ? updatedStaff : s,
        );
        setStaff(updatedStaffList);

        // Also update filtered staff to reflect change immediately
        const updatedFilteredStaff = filteredStaff.map((s: Staff) =>
          s.id === staffMember.id ? updatedStaff : s,
        );
        setFilteredStaff(updatedFilteredStaff);

        // Call API to update status
        const response = await staffService.updateEmploymentStatus(
          String(staffMember.id),
          newStatus.toLowerCase(),
        );

        if (response.success) {
          toast.success(`Staff ${newStatus.toLowerCase()}`, {
            description: `${staffMember.name} has been ${newStatus.toLowerCase()}.`,
          });
        } else {
          // Revert changes if API call fails
          const revertedStaffList = staff.map((s: Staff) =>
            s.id === staffMember.id ? staffMember : s,
          );
          setStaff(revertedStaffList);
          applyFilters(filters); // Re-apply filters
          throw new Error(response.message || 'Failed to update status');
        }
      } catch (err) {
        const error = err as Error;
        console.error('Error updating staff status:', error);
        toast.error('Status update failed', {
          description:
            error.message || 'There was a problem updating the staff status.',
        });
      }
      return;
    }

    // Delete action
    if (action === 'delete') {
      setSelectedStaff(staffMember);
      setDeleteModalOpen(true);
      return;
    }

    // Default case
    console.log('Unhandled action:', action, 'for staff:', staffMember.id);
  };

  // Handle successful edit
  const handleEditSuccess = (updatedStaff: Record<string, unknown>) => {
    // Update the staff in the local state
    const updatedStaffList = staff.map((s: Staff) => {
      if (s.id === updatedStaff.id) {
        // Create updated staff object with new data
        return {
          ...s,
          name: `${updatedStaff.firstName} ${updatedStaff.middleName ? updatedStaff.middleName + ' ' : ''}${updatedStaff.lastName}`,
          email: updatedStaff.email as string,
          phone: updatedStaff.phone as string,
          position:
            (updatedStaff.designation as string) ||
            (updatedStaff.position as string),
          department: updatedStaff.department as string,
          // Additional fields for compatibility
          salary: updatedStaff.totalSalary as number,
          employeeId: updatedStaff.employeeId as string,
          isOnline: false,
        } as Staff;
      }
      return s;
    });

    setStaff(updatedStaffList);

    // Also update filtered staff
    const updatedFilteredStaffList = filteredStaff.map((s: Staff) => {
      if (s.id === updatedStaff.id) {
        // Create updated staff object with new data
        return {
          ...s,
          name: `${updatedStaff.firstName} ${updatedStaff.middleName ? updatedStaff.middleName + ' ' : ''}${updatedStaff.lastName}`,
          email: updatedStaff.email as string,
          phone: updatedStaff.phone as string,
          position:
            (updatedStaff.designation as string) ||
            (updatedStaff.position as string),
          department: updatedStaff.department as string,
          // Additional fields for compatibility
          salary: updatedStaff.totalSalary as number,
          employeeId: updatedStaff.employeeId as string,
          isOnline: false,
        } as Staff;
      }
      return s;
    });

    setFilteredStaff(updatedFilteredStaffList);

    // Don't reload from server to avoid flickering
    // The local state update is sufficient
  };

  // Handle staff deletion
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setIsDeleting(true);
    try {
      // Call API to delete staff
      const response = await staffService.deleteStaff(String(selectedStaff.id));

      if (response.success) {
        // Update local state immediately
        const remainingStaff = staff.filter(s => s.id !== selectedStaff.id);
        setStaff(remainingStaff);

        // Also update filtered staff to reflect change immediately
        const updatedFilteredStaff = filteredStaff.filter(
          s => s.id !== selectedStaff.id,
        );
        setFilteredStaff(updatedFilteredStaff);

        toast.success('Staff deleted', {
          description: `${selectedStaff.name} has been removed from the system.`,
        });
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.message || 'Failed to delete staff');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting staff:', error);
      toast.error('Delete failed', {
        description: error.message || 'There was a problem deleting the staff.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Current page items are provided by server; apply optional client-only filters
  const currentStaffList = filteredStaff;

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='pt-3'>
          <div className='w-full'>
            <h1 className='text-xl font-bold text-gray-900'>
              Staff Management
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Manage All Staff Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading staff...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && staff.length === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='pt-3'>
          <div className='w-full'>
            <h1 className='text-xl font-bold text-gray-900'>
              Staff Management
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Manage All Staff Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-4' />
            <p className='text-gray-900 font-semibold mb-2'>
              Failed to load staff
            </p>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={loadStaff}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='pt-3'>
        <div className='w-full'>
          <h1 className='text-xl font-bold text-gray-900'>Staff Management</h1>
          <p className='text-sm text-gray-600 mt-1'>
            Manage All Staff Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='mt-3'>
        <div className='w-full'>
          <Statsgrid stats={staffStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='mt-4 mb-6'>
        <div className='w-full'>
          {/* Enhanced Search & Filter Component */}
          <StaffSearchFilter
            onFilterChange={handleFilterChange}
            designations={designationOptions}
            departments={departmentOptions}
            initialFilters={filters}
            className='mb-6'
          />

          {/* Staff Directory */}
          <div className='bg-white p-4 rounded-lg shadow'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>
                Staff Directory
              </h2>
              <div className='flex gap-2'>
                <ActionButtons pageType='staff' onRefresh={loadStaff} />
              </div>
            </div>
            <GenericTable
              data={currentStaffList}
              columns={getStaffColumns((action, staff) =>
                handleStaffAction(action, staff),
              )}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              emptyMessage='No staff found matching your criteria'
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* View Modal */}
      <StaffViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        staff={selectedStaff}
      />

      {/* Edit Modal */}
      <StaffEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        staff={selectedStaff}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStaff}
        title='Delete Staff'
        message='Are you sure you want to delete this staff member?'
        itemName={selectedStaff?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StaffPage;
