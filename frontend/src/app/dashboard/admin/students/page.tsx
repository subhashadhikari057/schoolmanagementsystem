'use client';

import React, { useState, useEffect } from 'react';
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
// Commented out until these services are implemented
// import { classService } from '@/api/services/class.service';
// import { studentService } from '@/api/services/student.service';
import { toast } from 'sonner';

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
  });

  // State for class and section options
  const classOptions = [
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

  const sectionOptions = [
    { value: 'section-a', label: 'Section A' },
    { value: 'section-b', label: 'Section B' },
    { value: 'section-c', label: 'Section C' },
    { value: 'section-d', label: 'Section D' },
  ];

  // Student-specific stats data
  const studentStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: totalItems.toString(),
      label: 'Total Students',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '152',
      label: 'Active Students',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '3',
      label: 'Students on Warning',
      change: '5.2%',
      isPositive: false,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '1',
      label: 'Suspended Students',
      change: '2.1%',
      isPositive: false,
    },
  ];

  // Load classes and sections for filter options
  useEffect(() => {
    const loadClassesAndSections = async () => {
      try {
        // In a real application, we would fetch classes and sections from the API
        // For now, we'll use the hardcoded options
        // const response = await classService.getAllClasses();
        // if (response.success && response.data) {
        //   const classes = response.data.map(cls => ({
        //     value: cls.id.toString(),
        //     label: cls.name
        //   }));
        //   setClassOptions(classes);
        // }
      } catch (err) {
        console.error('Error loading classes and sections:', err);
      }
    };

    loadClassesAndSections();
  }, []);

  // Load students data
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // In a real application, we would fetch students from the API
        // For now, we'll use mock data
        // const response = await studentService.getAllStudents();
        // if (response.success && response.data) {
        //   setStudents(response.data);
        //   setFilteredStudents(response.data);
        //   setTotalItems(response.data.length);
        //   setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        // }

        // Mock data for now
        const mockStudents: Student[] = [
          {
            id: 1,
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
          {
            id: 2,
            name: 'Michael Brown',
            rollNo: '2024002',
            class: 'Grade 9 Section B',
            parent: '2',
            status: 'Active',
            email: 'michael.brown@student.edu',
            attendance: { present: 150, total: 160 },
            grade: 'Grade 9',
            section: 'Section B',
          },
          {
            id: 3,
            name: 'Sarah Davis',
            rollNo: '2024003',
            class: 'Grade 11 Section A',
            parent: '3',
            status: 'Warning',
            email: 'sarah.davis@student.edu',
            attendance: { present: 130, total: 160 },
            grade: 'Grade 11',
            section: 'Section A',
          },
          {
            id: 4,
            name: 'David Wilson',
            rollNo: '2024004',
            class: 'Grade 10 Section C',
            parent: '4',
            status: 'Active',
            email: 'david.wilson@student.edu',
            attendance: { present: 155, total: 160 },
            grade: 'Grade 10',
            section: 'Section C',
          },
          {
            id: 5,
            name: 'Jessica Martinez',
            rollNo: '2024005',
            class: 'Grade 12 Section A',
            parent: '5',
            status: 'Suspended',
            email: 'jessica.martinez@student.edu',
            attendance: { present: 120, total: 160 },
            grade: 'Grade 12',
            section: 'Section A',
          },
        ];

        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
        setTotalItems(mockStudents.length);
        setTotalPages(Math.ceil(mockStudents.length / itemsPerPage));
      } catch (err) {
        console.error('Error loading students:', err);
        setError('Failed to load students data. Please try again later.');
        toast.error('Failed to load students', {
          description:
            'There was a problem loading the students data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Apply filters to students data
  const applyFilters = (filters: StudentFilters) => {
    let result = [...students];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        student =>
          student.name.toLowerCase().includes(searchTerm) ||
          student.rollNo.toLowerCase().includes(searchTerm) ||
          student.email?.toLowerCase().includes(searchTerm),
      );
    }

    // Apply class filter
    if (filters.class) {
      result = result.filter(student => {
        const studentClass =
          student.grade?.toLowerCase() || student.class?.toLowerCase();
        return studentClass?.includes(filters.class.toLowerCase());
      });
    }

    // Apply section filter
    if (filters.section) {
      result = result.filter(student => {
        const studentSection = student.section?.toLowerCase();
        return studentSection?.includes(filters.section.toLowerCase());
      });
    }

    setFilteredStudents(result);
    setTotalItems(result.length);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

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
          <Statsgrid stats={studentStats} />
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
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-800'>
                Student Directory
              </h2>
              <ActionButtons pageType='students' onRefresh={() => {}} />
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
                emptyMessage='No students found matching your filters'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;
