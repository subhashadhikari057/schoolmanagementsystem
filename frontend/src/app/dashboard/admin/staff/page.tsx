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
const mockStaff = [
  {
    id: 1,
    name: 'John Smith',
    department: 'Administration',
    designation: 'Office Manager',
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
      const joinDate = new Date(s.joinedDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return joinDate >= threeMonthsAgo;
    }).length;

    return [
      {
        icon: Users,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        value: total.toString(),
        label: 'Total Staff',
        change: '2.5%',
        isPositive: true,
      },
      {
        icon: Briefcase,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        value: active.toString(),
        label: 'Active Staff',
        change: '1.2%',
        isPositive: true,
      },
      {
        icon: Calendar,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        value: onLeave.toString(),
        label: 'On Leave',
        change: '3.8%',
        isPositive: false,
      },
      {
        icon: Building,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
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
        setIsLoading(false);
      }, 500); // Simulate network delay
      return;
    }

    try {
      const response = await staffService.getAllStaff();
      if (response.success && response.data) {
        const mappedStaff: Staff[] = response.data.map(
          (staff, index) =>
            ({
              id: staff.id || index + 1,
              name: staff.fullName,
              department: staff.department || 'General',
              designation: staff.designation || 'Staff',
              status:
                staff.employmentStatus === 'active'
                  ? 'Active'
                  : staff.employmentStatus === 'on_leave'
                    ? 'On Leave'
                    : 'Inactive',
              email: staff.email,
              phone: staff.phone,
              employeeId: staff.employeeId || '',
              joinedDate: staff.employmentDate
                ? staff.employmentDate.split('T')[0]
                : undefined,
              experienceYears: staff.experienceYears,
              qualification: staff.qualification,
              address: staff.address,
              basicSalary: staff.basicSalary,
              allowances: staff.allowances,
              totalSalary: staff.totalSalary,
              hasLoginAccount: !!staff.userId,
              // Add more fields as needed for filtering
            }) as Staff,
        );
        setStaff(mappedStaff);
        setFilteredStaff(mappedStaff);
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

  // Load data on component mount
  useEffect(() => {
    loadStaff();
  }, []);

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
          staff.designation?.toLowerCase().includes(searchTerm) ||
          // Add search by employee ID - use non-strict comparison to handle both string and number types
          (staff.employeeId &&
            staff.employeeId.toString().toLowerCase().includes(searchTerm)),
      );
    }

    // Apply designation filter
    if (filters.designation) {
      result = result.filter(staff => {
        if (!staff.designation) return false;
        // Check if the designation value matches the option value or label
        return designationOptions.some(
          option =>
            (option.value === filters.designation &&
              staff.designation?.toLowerCase() ===
                option.label.toLowerCase()) ||
            staff.designation?.toLowerCase() ===
              filters.designation.toLowerCase(),
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
  const handleStaffAction = async (action: string, staff: Staff) => {
    // View action
    if (action === 'view') {
      setSelectedStaff(staff);
      setViewModalOpen(true);
      return;
    }

    // Edit action
    if (action === 'edit') {
      setSelectedStaff(staff);
      setEditModalOpen(true);
      return;
    }

    // Toggle status action
    if (action === 'toggle-status') {
      try {
        const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';

        // Optimistically update UI first for better UX
        const updatedStaff = {
          ...staff,
          status: newStatus as
            | 'Active'
            | 'Inactive'
            | 'On Leave'
            | 'Suspended'
            | 'Transferred',
        };
        const updatedStaffList = staff.map(s =>
          s.id === staff.id ? updatedStaff : s,
        );
        setStaff(updatedStaffList);

        // Also update filtered staff to reflect change immediately
        const updatedFilteredStaff = filteredStaff.map(s =>
          s.id === staff.id ? updatedStaff : s,
        );
        setFilteredStaff(updatedFilteredStaff);

        // Call API to update status
        const response = await staffService.updateEmploymentStatus(
          String(staff.id),
          newStatus.toLowerCase(),
        );

        if (response.success) {
          toast.success(`Staff ${newStatus.toLowerCase()}`, {
            description: `${staff.name} has been ${newStatus.toLowerCase()}.`,
          });
        } else {
          // Revert changes if API call fails
          const revertedStaffList = staff.map(s =>
            s.id === staff.id ? staff : s,
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
      setSelectedStaff(staff);
      setDeleteModalOpen(true);
      return;
    }

    // Default case
    console.log('Unhandled action:', action, 'for staff:', staff.id);
  };

  // Handle successful edit
  const handleEditSuccess = (updatedStaff: any) => {
    // Update the staff in the local state
    const updatedStaffList = staff.map(s => {
      if (s.id === updatedStaff.id) {
        // Create updated staff object with new data
        return {
          ...s,
          name: `${updatedStaff.firstName} ${updatedStaff.middleName ? updatedStaff.middleName + ' ' : ''}${updatedStaff.lastName}`,
          email: updatedStaff.email,
          phone: updatedStaff.phone,
          designation: updatedStaff.designation,
          department: updatedStaff.department,
          qualification: updatedStaff.qualification,
          experienceYears: updatedStaff.experienceYears,
          joinedDate: updatedStaff.joinedDate,
          status: updatedStaff.status,
          // Add address fields for display
          street: updatedStaff.street,
          city: updatedStaff.city,
          state: updatedStaff.state,
          pinCode: updatedStaff.pinCode,
          gender: updatedStaff.gender,
          bloodGroup: updatedStaff.bloodGroup,
          maritalStatus: updatedStaff.maritalStatus,
          hasLoginAccount: updatedStaff.hasLoginAccount,
        };
      }
      return s;
    });

    setStaff(updatedStaffList);

    // Also update filtered staff
    const updatedFilteredStaffList = filteredStaff.map(s => {
      if (s.id === updatedStaff.id) {
        // Create updated staff object with new data
        return {
          ...s,
          name: `${updatedStaff.firstName} ${updatedStaff.middleName ? updatedStaff.middleName + ' ' : ''}${updatedStaff.lastName}`,
          email: updatedStaff.email,
          phone: updatedStaff.phone,
          designation: updatedStaff.designation,
          department: updatedStaff.department,
          qualification: updatedStaff.qualification,
          experienceYears: updatedStaff.experienceYears,
          joinedDate: updatedStaff.joinedDate,
          status: updatedStaff.status,
          // Add address fields for display
          street: updatedStaff.street,
          city: updatedStaff.city,
          state: updatedStaff.state,
          pinCode: updatedStaff.pinCode,
          gender: updatedStaff.gender,
          bloodGroup: updatedStaff.bloodGroup,
          maritalStatus: updatedStaff.maritalStatus,
          hasLoginAccount: updatedStaff.hasLoginAccount,
        };
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaffList = filteredStaff.slice(startIndex, endIndex);

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Staff Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
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
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Staff Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
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
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Staff Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Staff Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={staffStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Action Buttons */}
          <div className='flex justify-end mb-4'>
            <ActionButtons pageType='staff' onRefresh={loadStaff} />
          </div>

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
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>
              Staff Directory
            </h2>
            <GenericTable
              data={currentStaffList}
              columns={getStaffColumns((action, staff) =>
                handleStaffAction(action, staff),
              )}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStaff.length}
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
