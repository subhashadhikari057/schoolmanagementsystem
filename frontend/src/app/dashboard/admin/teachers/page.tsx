'use client';

import React, { useState, useEffect } from 'react';
import GenericTable from '@/components/templates/GenericTable';
import { Teacher } from '@/components/templates/listConfigurations';
import { getTeacherColumns } from '@/components/templates/TeacherColumns';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';
import { isDevMockEnabled } from '@/utils';
import TeacherSearchFilter, {
  TeacherFilters,
} from '@/components/molecules/filters/TeacherSearchFilter';
import TeacherViewModal from '@/components/organisms/modals/TeacherViewModal';
import TeacherEditModal from '@/components/organisms/modals/TeacherEditModal';
import DeleteConfirmationModal from '@/components/organisms/modals/DeleteConfirmationModal';

// Minimal mock data for dev mode
const mockTeachers = [
  {
    id: 1,
    name: 'John Doe',
    faculty: 'Science',
    subjects: ['Physics', 'Mathematics'],
    classTeacher: 'Grade 10A',
    status: 'Active' as const,
    email: 'john.doe@example.com',
    designation: 'Senior Teacher',
    department: 'Science',
    joinedDate: '2025-05-01',
  },
];

// Define filter options
const designationOptions = [
  { value: 'senior-teacher', label: 'Senior Teacher' },
  { value: 'assistant-teacher', label: 'Assistant Teacher' },
  { value: 'head-of-department', label: 'Head of Department' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice-principal', label: 'Vice Principal' },
];

const subjectOptions = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'english', label: 'English' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'computer-science', label: 'Computer Science' },
];

const TeachersPage = () => {
  // State for managing real data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TeacherFilters>({
    search: '',
    designation: '',
    subjects: '',
  });

  // State for modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  // Calculate stats from real data
  const calculateStats = (teachersData: Teacher[]) => {
    const total = teachersData.length;
    const active = teachersData.filter(t => t.status === 'Active').length;
    const onLeave = teachersData.filter(t => t.status === 'On Leave').length;
    const newHires = teachersData.filter(t => {
      if (!t.joinedDate) return false;
      const joinDate = new Date(t.joinedDate);
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
        label: 'Total Teachers',
        change: '3.1%',
        isPositive: true,
      },
      {
        icon: GraduationCap,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        value: active.toString(),
        label: 'Active Teachers',
        change: '1.8%',
        isPositive: true,
      },
      {
        icon: Calendar,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        value: onLeave.toString(),
        label: 'On Leave',
        change: '5.2%',
        isPositive: false,
      },
      {
        icon: BookOpen,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        value: newHires.toString(),
        label: 'New Hires',
        change: '15.3%',
        isPositive: true,
      },
    ];
  };

  const teacherStats = calculateStats(teachers);

  // Load teachers from backend or use mock in dev mode
  const loadTeachers = async () => {
    setIsLoading(true);
    setError(null);
    if (isDevMockEnabled()) {
      // Use mock data
      setTimeout(() => {
        setTeachers(mockTeachers);
        setFilteredTeachers(mockTeachers);
        setIsLoading(false);
      }, 500); // Simulate network delay
      return;
    }
    try {
      const response = await teacherService.getAllTeachers();
      if (response.success && response.data) {
        const mappedTeachers: Teacher[] = response.data.map(
          (teacher, index) =>
            ({
              id: teacher.id || index + 1,
              name: teacher.fullName,
              faculty: teacher.department || 'General',
              subjects: teacher.subjects?.map(s => s.name) || [],
              classTeacher:
                teacher.classAssignments
                  ?.map(ca => `${ca.className} ${ca.section}`)
                  .join(', ') || '',
              status:
                teacher.employmentStatus === 'active'
                  ? 'Active'
                  : teacher.employmentStatus === 'on_leave'
                    ? 'On Leave'
                    : 'Inactive',
              email: teacher.email,
              phone: teacher.phone,
              designation: teacher.designation,
              department: teacher.department,
              joinedDate: teacher.employmentDate,
              experienceYears: teacher.experienceYears,
              qualification: teacher.qualification,
              specialization: teacher.specialization,
              contactInfo: teacher.contactInfo,
              address: teacher.address,
              basicSalary: teacher.basicSalary,
              allowances: teacher.allowances,
              salary: teacher.totalSalary,
              teacherId: teacher.employeeId,
              // Add more fields as needed for filtering
            }) as Teacher,
        );
        setTeachers(mappedTeachers);
        setFilteredTeachers(mappedTeachers);
      } else {
        throw new Error(response.message || 'Failed to load teachers');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading teachers:', error);
      setError(error.message || 'Failed to load teachers');
      toast.error('Failed to load teachers', {
        description: 'Unable to fetch teacher data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Apply filters to teachers
  const applyFilters = (filters: TeacherFilters) => {
    setFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change

    let result = [...teachers];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        teacher =>
          teacher.name?.toLowerCase().includes(searchTerm) ||
          teacher.email?.toLowerCase().includes(searchTerm) ||
          teacher.department?.toLowerCase().includes(searchTerm) ||
          teacher.designation?.toLowerCase().includes(searchTerm),
      );
    }

    // Apply designation filter
    if (filters.designation) {
      result = result.filter(teacher => {
        if (!teacher.designation) return false;
        // Check if the designation value matches the option value or label
        return designationOptions.some(
          option =>
            (option.value === filters.designation &&
              teacher.designation?.toLowerCase() ===
                option.label.toLowerCase()) ||
            teacher.designation?.toLowerCase() ===
              filters.designation.toLowerCase(),
        );
      });
    }

    // Apply subject filter
    if (filters.subjects) {
      result = result.filter(teacher =>
        teacher.subjects?.some(subject =>
          subject.toLowerCase().includes(filters.subjects.toLowerCase()),
        ),
      );
    }

    setFilteredTeachers(result);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: TeacherFilters) => {
    applyFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle teacher actions
  const handleTeacherAction = async (action: string, teacher: Teacher) => {
    // View action
    if (action === 'view') {
      setSelectedTeacher(teacher);
      setViewModalOpen(true);
      return;
    }

    // Edit action
    if (action === 'edit') {
      setSelectedTeacher(teacher);
      setEditModalOpen(true);
      return;
    }

    // Toggle status action
    if (action === 'toggle-status') {
      try {
        const newStatus = teacher.status === 'Active' ? 'Inactive' : 'Active';

        // Optimistically update UI first for better UX
        const updatedTeacher = {
          ...teacher,
          status: newStatus as
            | 'Active'
            | 'Inactive'
            | 'On Leave'
            | 'Suspended'
            | 'Transferred',
        };
        const updatedTeachers = teachers.map(t =>
          t.id === teacher.id ? updatedTeacher : t,
        );
        setTeachers(updatedTeachers);

        // Also update filtered teachers to reflect change immediately
        const updatedFilteredTeachers = filteredTeachers.map(t =>
          t.id === teacher.id ? updatedTeacher : t,
        );
        setFilteredTeachers(updatedFilteredTeachers);

        // Call API to update status
        const response = await teacherService.updateTeacherByAdmin(
          String(teacher.id),
          {
            status: newStatus as
              | 'Active'
              | 'Inactive'
              | 'On Leave'
              | 'Suspended'
              | 'Transferred',
          },
        );

        if (response.success) {
          toast.success(`Teacher ${newStatus.toLowerCase()}`, {
            description: `${teacher.name} has been ${newStatus.toLowerCase()}.`,
          });
        } else {
          // Revert changes if API call fails
          const revertedTeachers = teachers.map(t =>
            t.id === teacher.id ? teacher : t,
          );
          setTeachers(revertedTeachers);
          applyFilters(filters); // Re-apply filters
          throw new Error(response.message || 'Failed to update status');
        }
      } catch (err) {
        const error = err as Error;
        console.error('Error updating teacher status:', error);
        toast.error('Status update failed', {
          description:
            error.message || 'There was a problem updating the teacher status.',
        });
      }
      return;
    }

    // Delete action
    if (action === 'delete') {
      setSelectedTeacher(teacher);
      setDeleteModalOpen(true);
      return;
    }

    // Default case
    console.log('Unhandled action:', action, 'for teacher:', teacher.id);
  };

  // Handle successful edit
  const handleEditSuccess = (updatedTeacher: any) => {
    // Update the teacher in the local state
    const updatedTeachers = teachers.map(t => {
      if (t.id === updatedTeacher.id) {
        // Create updated teacher object with new data
        return {
          ...t,
          name: `${updatedTeacher.firstName} ${updatedTeacher.middleName ? updatedTeacher.middleName + ' ' : ''}${updatedTeacher.lastName}`,
          email: updatedTeacher.email,
          phone: updatedTeacher.phone,
          designation: updatedTeacher.designation,
          department: updatedTeacher.department,
          qualification: updatedTeacher.qualification,
          experienceYears: updatedTeacher.experienceYears,
          joinedDate: updatedTeacher.joinedDate,
          status: updatedTeacher.status,
          // Add address fields for display
          street: updatedTeacher.street,
          city: updatedTeacher.city,
          state: updatedTeacher.state,
          pinCode: updatedTeacher.pinCode,
          gender: updatedTeacher.gender,
          bloodGroup: updatedTeacher.bloodGroup,
          maritalStatus: updatedTeacher.maritalStatus,
        };
      }
      return t;
    });

    setTeachers(updatedTeachers);

    // Also update filtered teachers
    const updatedFilteredTeachers = filteredTeachers.map(t => {
      if (t.id === updatedTeacher.id) {
        // Create updated teacher object with new data
        return {
          ...t,
          name: `${updatedTeacher.firstName} ${updatedTeacher.middleName ? updatedTeacher.middleName + ' ' : ''}${updatedTeacher.lastName}`,
          email: updatedTeacher.email,
          phone: updatedTeacher.phone,
          designation: updatedTeacher.designation,
          department: updatedTeacher.department,
          qualification: updatedTeacher.qualification,
          experienceYears: updatedTeacher.experienceYears,
          joinedDate: updatedTeacher.joinedDate,
          status: updatedTeacher.status,
          // Add address fields for display
          street: updatedTeacher.street,
          city: updatedTeacher.city,
          state: updatedTeacher.state,
          pinCode: updatedTeacher.pinCode,
          gender: updatedTeacher.gender,
          bloodGroup: updatedTeacher.bloodGroup,
          maritalStatus: updatedTeacher.maritalStatus,
        };
      }
      return t;
    });

    setFilteredTeachers(updatedFilteredTeachers);

    // Don't reload from server to avoid flickering
    // The local state update is sufficient
  };

  // Handle teacher deletion
  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    setIsDeleting(true);
    try {
      // Call API to delete teacher
      const response = await teacherService.deleteTeacher(
        String(selectedTeacher.id),
      );

      if (response.success) {
        // Update local state immediately
        const remainingTeachers = teachers.filter(
          t => t.id !== selectedTeacher.id,
        );
        setTeachers(remainingTeachers);

        // Also update filtered teachers to reflect change immediately
        const updatedFilteredTeachers = filteredTeachers.filter(
          t => t.id !== selectedTeacher.id,
        );
        setFilteredTeachers(updatedFilteredTeachers);

        toast.success('Teacher deleted', {
          description: `${selectedTeacher.name} has been removed from the system.`,
        });
        setDeleteModalOpen(false);
      } else {
        throw new Error(response.message || 'Failed to delete teacher');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting teacher:', error);
      toast.error('Delete failed', {
        description:
          error.message || 'There was a problem deleting the teacher.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, endIndex);

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Teacher Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Teacher Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && teachers.length === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Teacher Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Teacher Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-4' />
            <p className='text-gray-900 font-semibold mb-2'>
              Failed to load teachers
            </p>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={loadTeachers}
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
            Teacher Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Teacher Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={teacherStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Action Buttons */}
          <div className='flex justify-end mb-4'>
            <ActionButtons pageType='teachers' onRefresh={loadTeachers} />
          </div>

          {/* Enhanced Search & Filter Component */}
          <TeacherSearchFilter
            onFilterChange={handleFilterChange}
            designations={designationOptions}
            subjects={subjectOptions}
            initialFilters={filters}
            className='mb-6'
          />

          {/* Teacher Directory */}
          <div className='bg-white p-4 rounded-lg shadow'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>
              Teacher Directory
            </h2>
            <GenericTable
              data={currentTeachers}
              columns={getTeacherColumns((action, teacher) =>
                handleTeacherAction(action, teacher),
              )}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTeachers.length}
              itemsPerPage={itemsPerPage}
              emptyMessage='No teachers found matching your criteria'
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* View Modal */}
      <TeacherViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        teacher={selectedTeacher}
      />

      {/* Edit Modal */}
      <TeacherEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        teacher={selectedTeacher}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteTeacher}
        title='Delete Teacher'
        message='Are you sure you want to delete this teacher?'
        itemName={selectedTeacher?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TeachersPage;
