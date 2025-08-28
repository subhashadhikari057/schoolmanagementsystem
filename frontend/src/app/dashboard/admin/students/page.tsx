'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GenericTable from '@/components/templates/GenericTable';
import {
  getListConfig,
  Student,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { Users, UserCheck, AlertCircle, GraduationCap } from 'lucide-react';
import StudentSearchFilter, {
  StudentFilters,
} from '@/components/molecules/filters/StudentSearchFilter';
import { studentService } from '@/api/services/student.service';
import { classService } from '@/api/services/class.service';
import { toast } from 'sonner';
import StudentViewModal from '@/components/organisms/modals/StudentViewModal';
import StudentEditModal from '@/components/organisms/modals/StudentEditModal';
import DeleteConfirmationModal from '@/components/organisms/modals/DeleteConfirmationModal';

const StudentsPage = () => {
  // State for students data
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // State for filters
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    class: '',
    section: '',
    ethnicity: '',
  });

  // State for class and section options (loaded from API)
  const [classOptions, setClassOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [sectionOptions, setSectionOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // State for modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for statistics
  const [studentStats, setStudentStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    warning: 0,
    graduated: 0,
    transferred: 0,
  });

  // Student-specific stats data
  const studentStatsDisplay = [
    {
      icon: Users,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: studentStats.total.toString(),
      label: 'Total Students',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: studentStats.active.toString(),
      label: 'Active Students',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-600',
      iconColor: 'text-white',
      value: studentStats.warning.toString(),
      label: 'Students on Warning',
      change: '5.2%',
      isPositive: false,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
      value: studentStats.suspended.toString(),
      label: 'Suspended Students',
      change: '2.1%',
      isPositive: false,
    },
  ];

  // Load student statistics
  const loadStudentStats = useCallback(async () => {
    try {
      const response = await studentService.getStudentStats();
      if (response.success && response.data) {
        setStudentStats(response.data);
      }
    } catch (error) {
      console.error('Error loading student statistics:', error);
    }
  }, []);

  // Load classes and sections for filter options
  useEffect(() => {
    const loadClassesAndSections = async () => {
      try {
        const response = await classService.getAllClasses();
        if (response.success && response.data) {
          // Transform class data to filter options
          const classOpts = response.data.map(cls => ({
            value: cls.id,
            label: `Grade ${cls.grade} ${cls.section} (${cls.capacity} capacity)`,
          }));
          setClassOptions(classOpts);

          // Extract unique sections
          const sections = [...new Set(response.data.map(cls => cls.section))];
          const sectionOpts = sections.map(section => ({
            value: section.toLowerCase(),
            label: `Section ${section}`,
          }));
          setSectionOptions(sectionOpts);
        } else {
          // Fallback to hardcoded options if API fails
          const fallbackClasses = [
            { value: 'class-1', label: 'Class 1' },
            { value: 'class-2', label: 'Class 2' },
            { value: 'class-3', label: 'Class 3' },
            { value: 'class-4', label: 'Class 4' },
            { value: 'class-5', label: 'Class 5' },
            { value: 'class-6', label: 'Class 6' },
            { value: 'class-7', label: 'Class 7' },
            { value: 'class-8', label: 'Class 8' },
            { value: 'class-9', label: 'Class 9' },
            { value: 'class-10', label: 'Class 10' },
            { value: 'class-11', label: 'Class 11' },
            { value: 'class-12', label: 'Class 12' },
          ];
          const fallbackSections = [
            { value: 'section-a', label: 'Section A' },
            { value: 'section-b', label: 'Section B' },
            { value: 'section-c', label: 'Section C' },
            { value: 'section-d', label: 'Section D' },
          ];
          setClassOptions(fallbackClasses);
          setSectionOptions(fallbackSections);
        }
      } catch (error) {
        console.error('Error loading classes and sections:', error);
        toast.error('Failed to load class options');
      }
    };

    loadClassesAndSections();
    loadStudentStats();
  }, [loadStudentStats]);

  // Extract filter values to avoid dependency array issues
  const classFilter = filters.class || '';
  const searchFilter = filters.search || '';
  const ethnicityFilter = filters.ethnicity || '';

  // Load students data function
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await studentService.getAllStudents({
        page: currentPage,
        limit: itemsPerPage,
        search: searchFilter,
        classId: classFilter,
        ethnicity: ethnicityFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        // Check if response.data has the expected structure
        const studentsData = response.data.data || response.data || [];
        const totalItems = response.data.total || 0;
        const totalPages = response.data.totalPages || 1;

        // Ensure studentsData is an array before mapping
        if (Array.isArray(studentsData)) {
          // Transform backend data to frontend format
          const transformedStudents: Student[] = studentsData.map(
            (student, index) => ({
              id: student.id || `temp-${index}`, // Use original UUID string ID or temporary ID
              name: student.fullName || 'Unknown',
              rollNo: student.rollNumber || '',
              class: student.className || 'No Class',
              parent: '1', // Will be updated when parent data is available
              status: (student.academicStatus === 'active'
                ? 'Active'
                : student.academicStatus === 'suspended'
                  ? 'Suspended'
                  : 'Active') as 'Active' | 'Suspended' | 'Warning',
              email: student.email || '',
              attendance: { present: 0, total: 0 }, // Placeholder until attendance is implemented
              grade: student.className || 'No Grade', // Use actual class data
              section: 'A', // Default section - will be updated when backend provides section data
            }),
          );

          setStudents(transformedStudents);
          setFilteredStudents(transformedStudents);
          setTotalItems(totalItems);
          setTotalPages(totalPages);
        } else {
          console.warn(
            'Expected array of students but received:',
            studentsData,
          );
          // Fallback to empty array if data is not an array
          setStudents([]);
          setFilteredStudents([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } else {
        console.warn('API response not successful or missing data:', response);
        // Fallback to empty array if API fails
        setStudents([]);
        setFilteredStudents([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');

      // Fallback mock data for development
      const mockStudents: Student[] = [
        {
          id: 'mock-1',
          name: 'Emily Johnson',
          rollNo: '2024001',
          class: 'Grade 10 Section A',
          parent: '1',
          status: 'Active',
          email: 'emily.johnson@student.edu',
          attendance: { present: 145, total: 160 },
          grade: 'Grade 10',
          section: 'Section A',
        },
      ];

      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      setTotalItems(mockStudents.length);
      setTotalPages(Math.ceil(mockStudents.length / itemsPerPage));
      setError('API connection failed - using mock data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchFilter, classFilter, ethnicityFilter]);

  // Load students data when page, filters change
  useEffect(() => {
    loadStudents();
  }, [loadStudents, currentPage, classFilter, searchFilter, ethnicityFilter]);

  // Handle filter changes
  const handleFilterChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    // The useEffect with loadStudents will handle the API call with new filters
  };

  // Note: Filters are now handled by backend API in loadStudents function

  // Calculate current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle student actions
  const handleStudentAction = async (action: string, student: Student) => {
    // View action
    if (action === 'view') {
      setSelectedStudent(student);
      setViewModalOpen(true);
      return;
    }

    // Edit action
    if (action === 'edit') {
      setSelectedStudent(student);
      setEditModalOpen(true);
      return;
    }

    // Toggle status action
    if (action === 'toggle-status') {
      try {
        const newStatus = student.status === 'Active' ? 'Suspended' : 'Active';

        // Optimistically update UI first for better UX
        const updatedStudent = {
          ...student,
          status: newStatus as
            | 'Active'
            | 'Suspended'
            | 'Graduated'
            | 'Transferred',
        };
        const updatedStudents = students.map(s =>
          s.id === student.id ? updatedStudent : s,
        );
        setStudents(updatedStudents);

        // Also update filtered students to reflect change immediately
        const updatedFilteredStudents = filteredStudents.map(s =>
          s.id === student.id ? updatedStudent : s,
        );
        setFilteredStudents(updatedFilteredStudents);

        // Call API to update status
        const response = await studentService.updateStudentByAdmin(
          String(student.id),
          {
            academic: {
              academicStatus: newStatus.toLowerCase() as
                | 'active'
                | 'suspended'
                | 'graduated'
                | 'transferred',
            },
          },
        );

        if (response.success) {
          toast.success(`Student status updated to ${newStatus}`);
        } else {
          // Revert the optimistic update if API call failed
          setStudents(students);
          setFilteredStudents(filteredStudents);
          toast.error(response.message || 'Failed to update student status');
        }
      } catch (err) {
        console.error('Error updating student status:', err);
        // Revert the optimistic update if API call failed
        setStudents(students);
        setFilteredStudents(filteredStudents);
        toast.error('Failed to update student status');
      }
      return;
    }

    // Delete action
    if (action === 'delete') {
      setSelectedStudent(student);
      setDeleteModalOpen(true);
      return;
    }

    console.log('Unknown action:', action);
  };

  // Handle student deletion
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setIsDeleting(true);
    try {
      const response = await studentService.deleteStudent(
        String(selectedStudent.id),
      );

      if (response.success) {
        // Reload students data and statistics to get accurate counts from backend
        await Promise.all([loadStudents(), loadStudentStats()]);

        toast.success(`Student ${selectedStudent.name} deleted successfully`);
        setDeleteModalOpen(false);
        setSelectedStudent(null);
      } else {
        toast.error(response.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Student Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Student Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={studentStatsDisplay} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Search and Filter */}
          <div className='mb-6'>
            <StudentSearchFilter
              onFilterChange={handleFilterChange}
              classes={classOptions}
              sections={sectionOptions}
              initialFilters={filters}
            />
          </div>

          {/* Student List */}
          <div className='bg-white p-4 rounded-lg shadow'>
            <div className='flex items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>
                Student Directory
              </h2>
              <div className='flex-1'></div>
              <div className='flex items-center gap-2'>
                <ActionButtons pageType='students' onRefresh={loadStudents} />
              </div>
            </div>

            {isLoading ? (
              <div className='text-center py-8'>
                <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
                <p className='mt-2 text-gray-600'>Loading students...</p>
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <p className='text-red-500'>{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                >
                  Try Again
                </button>
              </div>
            ) : (
              <GenericTable
                data={getCurrentPageItems()}
                columns={getListConfig('students').columns}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemAction={handleStudentAction}
                emptyMessage='No students found matching your filters'
              />
            )}
          </div>
        </div>
      </div>

      {/* View Student Modal */}
      <StudentViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        student={selectedStudent}
      />

      {/* Edit Student Modal */}
      <StudentEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          // Reload students data and statistics to reflect changes
          Promise.all([loadStudents(), loadStudentStats()]);
        }}
        student={selectedStudent}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        title='Delete Student'
        message={`Are you sure you want to delete ${selectedStudent?.name || 'this student'}?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StudentsPage;
