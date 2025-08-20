'use client';

import React, { useState, useEffect } from 'react';
import GenericTable, { BaseItem } from '@/components/templates/GenericTable';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  School,
  Building,
  BookOpen,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { classService } from '@/api/services/class.service';
import { isDevMockEnabled } from '@/utils';
import ClassFormModal from '@/components/organisms/modals/ClassFormModal';
import ClassEditModal from '@/components/organisms/modals/ClassEditModal';
import ClassDeleteModal from '@/components/organisms/modals/ClassDeleteModal';
import ClassSearchFilter from '@/components/molecules/filters/ClassSearchFilter';
import ClassViewModal from '@/components/organisms/modals/ClassViewModal';
import SimpleTabs from '@/components/molecules/navigation/SimpleTabs';

// Define the Class type for the component
interface Class extends BaseItem {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  roomId: string;
  classTeacherId?: string;
  shift?: 'morning' | 'day';
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    fullName: string;
    email: string;
    employeeId?: string;
  };
  studentCount?: number;
  status: 'Active' | 'Inactive';
  [key: string]: unknown;
}

// Mock data for development
const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Grade 5 Section A',
    grade: 5,
    section: 'A',
    capacity: 30,
    roomId: 'room-1',
    classTeacherId: 'teacher-1',
    room: {
      roomNo: '101',
      name: 'Primary Wing',
      floor: 1,
      building: 'Main Building',
    },
    classTeacher: {
      id: 'teacher-1',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      employeeId: 'T001',
    },
    studentCount: 28,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Grade 6 Section B',
    grade: 6,
    section: 'B',
    capacity: 35,
    roomId: 'room-2',
    room: {
      roomNo: '102',
      floor: 1,
      building: 'Main Building',
    },
    studentCount: 32,
    status: 'Active',
  },
];

// Define filter options
interface ClassFilters {
  search: string;
  grade: string;
  section: string;
  hasTeacher: string;
}

const ClassesPage = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // State for managing classes data
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ClassFilters>({
    search: '',
    grade: '',
    section: '',
    hasTeacher: '',
  });

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;

  // Calculate stats from real data
  const calculateStats = (classesData: Class[]) => {
    const total = classesData.length;
    const withTeachers = classesData.filter(c => c.classTeacherId).length;
    const totalCapacity = classesData.reduce((sum, c) => sum + c.capacity, 0);
    const totalStudents = classesData.reduce(
      (sum, c) => sum + (c.studentCount || 0),
      0,
    );

    return [
      {
        icon: School,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        value: total.toString(),
        label: 'Total Classes',
        change: '2.5%',
        isPositive: true,
      },
      {
        icon: Users,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        value: totalStudents.toString(),
        label: 'Total Students',
        change: '3.2%',
        isPositive: true,
      },
      {
        icon: Building,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        value: totalCapacity.toString(),
        label: 'Total Capacity',
        change: '1.8%',
        isPositive: true,
      },
      {
        icon: BookOpen,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        value: withTeachers.toString(),
        label: 'With Class Teachers',
        change: '4.3%',
        isPositive: true,
      },
    ];
  };

  const classStats = calculateStats(classes);

  // Load classes from backend or use mock in dev mode
  const loadClasses = async () => {
    setIsLoading(true);
    setError(null);

    if (isDevMockEnabled()) {
      // Use mock data
      setTimeout(() => {
        setClasses(mockClasses);
        setFilteredClasses(mockClasses);
        setIsLoading(false);
      }, 500); // Simulate network delay
      return;
    }

    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        const mappedClasses: Class[] = response.data.map(cls => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          capacity: cls.capacity,
          roomId: cls.roomId,
          classTeacherId: cls.classTeacherId,
          shift: cls.shift,
          room: cls.room,
          classTeacher: cls.classTeacher
            ? {
                id: cls.classTeacher.id,
                fullName: cls.classTeacher.user?.fullName || '',
                email: cls.classTeacher.user?.email || '',
                employeeId: cls.classTeacher.employeeId,
              }
            : undefined,
          studentCount: cls.currentEnrollment || cls.students?.length || 0,
          status: cls.deletedAt ? 'Inactive' : 'Active',
        }));

        setClasses(mappedClasses);
        setFilteredClasses(mappedClasses);
      } else {
        throw new Error(response.message || 'Failed to load classes');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading classes:', error);
      setError(error.message || 'Failed to load classes');
      toast.error('Failed to load classes', {
        description: 'Unable to fetch class data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Apply filters to classes
  const applyFilters = (filters: ClassFilters) => {
    setFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change

    let result = [...classes];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        cls =>
          cls.name?.toLowerCase().includes(searchTerm) ||
          `Grade ${cls.grade} Section ${cls.section}`
            .toLowerCase()
            .includes(searchTerm) ||
          cls.room?.roomNo.toLowerCase().includes(searchTerm) ||
          cls.classTeacher?.fullName.toLowerCase().includes(searchTerm),
      );
    }

    // Apply grade filter
    if (filters.grade) {
      result = result.filter(cls => cls.grade === parseInt(filters.grade, 10));
    }

    // Apply section filter
    if (filters.section) {
      result = result.filter(cls => cls.section === filters.section);
    }

    // Apply has teacher filter
    if (filters.hasTeacher) {
      if (filters.hasTeacher === 'yes') {
        result = result.filter(cls => !!cls.classTeacherId);
      } else if (filters.hasTeacher === 'no') {
        result = result.filter(cls => !cls.classTeacherId);
      }
    }

    setFilteredClasses(result);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: ClassFilters) => {
    applyFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle class actions
  const handleClassAction = (action: string, cls: Class) => {
    // View action
    if (action === 'view') {
      setSelectedClass(cls);
      setIsViewModalOpen(true);
      return;
    }

    // Edit action
    if (action === 'edit') {
      setSelectedClass(cls);
      setIsEditModalOpen(true);
      return;
    }

    // Delete action
    if (action === 'delete') {
      setSelectedClass(cls);
      setIsDeleteModalOpen(true);
      return;
    }

    // Default case
    console.log('Unhandled action:', action, 'for class:', cls.id);
  };

  // Handle class deletion
  const handleDeleteClass = async () => {
    if (!selectedClass) return;

    setIsDeleting(true);
    try {
      // Call API to delete class
      const response = await classService.deleteClass(selectedClass.id);

      if (response.success) {
        // Update local state immediately
        const remainingClasses = classes.filter(c => c.id !== selectedClass.id);
        setClasses(remainingClasses);

        // Also update filtered classes to reflect change immediately
        const updatedFilteredClasses = filteredClasses.filter(
          c => c.id !== selectedClass.id,
        );
        setFilteredClasses(updatedFilteredClasses);

        toast.success('Class deleted', {
          description: `${selectedClass.name || `Grade ${selectedClass.grade} Section ${selectedClass.section}`} has been removed.`,
        });
        setIsDeleteModalOpen(false);
      } else {
        throw new Error(response.message || 'Failed to delete class');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting class:', error);
      toast.error('Delete failed', {
        description: error.message || 'There was a problem deleting the class.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const classColumns = [
    {
      key: 'name',
      header: 'Class',
      render: (row: Class) => (
        <div>
          <div className='font-medium'>
            {row.name || `Grade ${row.grade} Section ${row.section}`}
          </div>
          <div className='text-xs text-gray-500'>
            Grade {row.grade} • Section {row.section} •{' '}
            {row.shift
              ? row.shift.charAt(0).toUpperCase() +
                row.shift.slice(1) +
                ' Shift'
              : 'No Shift'}
          </div>
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (row: Class) => (
        <div>
          <div className='font-medium'>
            {row.room ? `Room ${row.room.roomNo}` : 'Not Assigned'}
          </div>
          {row.room && (
            <div className='text-xs text-gray-500'>
              {row.room.name && `${row.room.name} • `}
              Floor {row.room.floor}
              {row.room.building && ` • ${row.room.building}`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'classTeacher',
      header: 'Class Teacher',
      render: (row: Class) => (
        <div>
          {row.classTeacher ? (
            <>
              <div className='font-medium'>{row.classTeacher.fullName}</div>
              <div className='text-xs text-gray-500'>
                {row.classTeacher.employeeId &&
                  `ID: ${row.classTeacher.employeeId} • `}
                {row.classTeacher.email}
              </div>
            </>
          ) : (
            <span className='text-gray-500'>Not Assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'studentCount',
      header: 'Students',
      render: (row: Class) => (
        <div className='text-center'>
          <div className='font-medium'>
            {row.studentCount || 0} / {row.capacity}
          </div>
          <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
            <div
              className='bg-blue-600 h-1.5 rounded-full'
              style={{
                width: `${Math.min(
                  ((row.studentCount || 0) / row.capacity) * 100,
                  100,
                )}%`,
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Class) => (
        <div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              row.status === 'Active'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {row.status}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Class) => (
        <div className='flex space-x-2 justify-end'>
          <button
            onClick={() => handleClassAction('view', row)}
            className='p-1 text-blue-600 hover:bg-blue-50 rounded'
            title='View Class'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
              />
            </svg>
          </button>
          <button
            onClick={() => handleClassAction('edit', row)}
            className='p-1 text-green-600 hover:bg-green-50 rounded'
            title='Edit Class'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </button>
          <button
            onClick={() => handleClassAction('delete', row)}
            className='p-1 text-red-600 hover:bg-red-50 rounded'
            title='Delete Class'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  // Tab configuration
  const tabs = [
    {
      id: 'classes',
      label: 'Classes',
      icon: <School className='h-4 w-4 mr-2' />,
    },
    {
      id: 'schedule-builder',
      label: 'Schedule Builder',
      icon: <Clock className='h-4 w-4 mr-2' />,
    },
  ];

  // Show loading state
  if (isLoading && activeTab === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Class Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Class Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && classes.length === 0 && activeTab === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Class Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Class Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-4' />
            <p className='text-gray-900 font-semibold mb-2'>
              Failed to load classes
            </p>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={loadClasses}
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
            Class Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Class Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={classStats} />
        </div>
      </div>

      {/* Tabs */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8'>
        <div className='max-w-7xl mx-auto'>
          <SimpleTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {activeTab === 0 && (
            <>
              {/* Action Buttons */}
              <div className='flex justify-end mb-4'>
                <ActionButtons
                  pageType='classes'
                  onRefresh={loadClasses}
                  onAddNew={() => setIsFormModalOpen(true)}
                />
              </div>

              {/* Search & Filter Component */}
              <ClassSearchFilter
                onFilterChange={handleFilterChange}
                initialFilters={filters}
                className='mb-6'
              />

              {/* Class Directory */}
              <div className='bg-white p-4 rounded-lg shadow'>
                <h2 className='text-lg font-semibold text-gray-800 mb-4'>
                  Class Directory
                </h2>
                <GenericTable
                  data={currentClasses}
                  columns={classColumns}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredClasses.length}
                  itemsPerPage={itemsPerPage}
                  emptyMessage='No classes found matching your criteria'
                  onPageChange={handlePageChange}
                  onItemAction={handleClassAction}
                />
              </div>
            </>
          )}

          {activeTab === 1 && (
            <div>
              {/* Integrated Schedule Builder */}
              <div className='bg-white rounded-lg shadow'>
                <div className='p-0'>
                  {/* We're using the custom schedule builder component */}
                  <div className='w-full'>
                    {/* Using dynamic import to avoid server-side rendering issues with Zustand store */}
                    {(() => {
                      const {
                        ScheduleBuilder,
                      } = require('@/components/schedule');
                      return <ScheduleBuilder />;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class Form Modal */}
      <ClassFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadClasses();
          setIsFormModalOpen(false);
        }}
      />

      {/* Edit Modal */}
      <ClassEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          loadClasses();
          setIsEditModalOpen(false);
        }}
        classData={selectedClass}
      />

      {/* View Modal */}
      {selectedClass && (
        <ClassViewModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          classData={selectedClass}
        />
      )}

      {/* Enhanced Delete Modal */}
      <ClassDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteClass}
        classData={selectedClass}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClassesPage;
