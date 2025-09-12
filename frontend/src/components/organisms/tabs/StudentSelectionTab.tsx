'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SearchBar from '@/components/molecules/filters/SearchBar';
import { Select as NativeSelect } from '@/components/atoms/interactive/Select';
import { type StudentListResponse } from '@/api/services/student.service';
import {
  Filter,
  CheckCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentSelectionTabProps {
  students: StudentListResponse[];
  selectedStudentsToStay: string[];
  searchTerm: string;
  selectedClass: string;
  classOptions: string[];
  onSearchChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onToggleStudent: (studentId: string) => void;
  onSelectAllIneligible: () => void;
  onIndividualPromote?: (studentId: string) => void;
}

export default function StudentSelectionTab({
  students,
  selectedStudentsToStay,
  searchTerm,
  selectedClass,
  classOptions,
  onSearchChange,
  onClassChange,
  onToggleStudent,
  onSelectAllIneligible,
  onIndividualPromote,
}: StudentSelectionTabProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 5-6 students initially as requested
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter students based on search and class selection
  const filteredStudents = useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase();
    return students.filter(student => {
      const matchesSearch =
        (student.fullName || '').toLowerCase().includes(q) ||
        (student.rollNumber || '').toLowerCase().includes(q) ||
        (student.studentId || '').toLowerCase().includes(q);
      const matchesClass =
        selectedClass === 'all' || (student.className || '') === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, debouncedSearchTerm, selectedClass]);

  // Paginate filtered students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Handle individual promotion
  const handleIndividualPromote = useCallback(
    async (studentId: string) => {
      if (!onIndividualPromote) return;

      const student = students.find(s => s.id === studentId);
      if (!student) return;

      try {
        await onIndividualPromote(studentId);
        toast.success(`${student.fullName} has been promoted successfully!`);
      } catch (error) {
        toast.error(`Failed to promote ${student.fullName}. Please try again.`);
        console.error('Individual promotion error:', error);
      }
    },
    [students, onIndividualPromote],
  );

  return (
    <div className='space-y-6'>
      <Card className='border-gray-200 shadow-lg'>
        <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <CardTitle className='text-xl flex items-center gap-2'>
                <Filter className='w-5 h-5' />
                Select Students to Stay in Current Class
              </CardTitle>
              <CardDescription>
                Choose students who should not be promoted this year (
                {selectedStudentsToStay.length} selected)
              </CardDescription>
            </div>
            <Button
              onClick={onSelectAllIneligible}
              variant='outline'
              size='sm'
              className='gap-2 rounded-full hover:bg-gray-50'
            >
              <CheckCircle className='w-4 h-4' />
              Select All Visible
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-6'>
          {/* Search and Filters */}
          <div className='flex flex-col lg:flex-row gap-4 mb-6'>
            <div className='flex-1'>
              <SearchBar
                placeholder='Search students by name, ID, or roll number...'
                value={searchTerm}
                onChange={onSearchChange}
                className='w-full'
                inputClassName='rounded-lg bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white'
              />
            </div>
            <NativeSelect
              className='w-full lg:w-[200px] rounded-lg bg-gray-50 border-gray-200'
              value={selectedClass}
              onChange={e => onClassChange(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                ...classOptions.map(cn => ({ value: cn, label: cn })),
              ]}
            />
          </div>

          {/* Search Status */}
          {debouncedSearchTerm && (
            <div className='flex items-center gap-2 text-sm text-gray-600 mb-4'>
              <Search className='w-4 h-4' />
              <span>
                Found {filteredStudents.length} student
                {filteredStudents.length !== 1 ? 's' : ''}
                {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
              </span>
            </div>
          )}

          {/* Students List */}
          <div className='bg-gray-50 rounded-lg border border-gray-200 overflow-hidden'>
            <div className='overflow-y-auto'>
              {paginatedStudents.length > 0 ? (
                <div className='divide-y divide-gray-200'>
                  {paginatedStudents.map(student => (
                    <div
                      key={student.id}
                      className='p-4 hover:bg-white transition-colors duration-200'
                    >
                      <div className='flex items-center gap-4'>
                        <input
                          type='checkbox'
                          checked={selectedStudentsToStay.includes(student.id)}
                          onChange={() => onToggleStudent(student.id)}
                          className='w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          aria-label={`Select ${student.fullName} to stay`}
                        />

                        <div className='flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center'>
                          <div>
                            <div className='font-medium text-gray-900'>
                              {student.fullName}
                            </div>
                            <div className='text-sm text-gray-500'>
                              Roll: {student.rollNumber}
                            </div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-700 font-medium'>
                              {student.className}
                            </div>
                            <div className='text-xs text-gray-500'>Class</div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-600'>
                              {student.studentId || 'N/A'}
                            </div>
                            <div className='text-xs text-gray-500'>
                              Student ID
                            </div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-600'>
                              {student.email}
                            </div>
                            <div className='text-xs text-gray-500'>Email</div>
                          </div>
                        </div>

                        {/* Individual Promote Button */}
                        {onIndividualPromote && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleIndividualPromote(student.id)}
                            className='gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                            disabled={selectedStudentsToStay.includes(
                              student.id,
                            )}
                          >
                            <UserCheck className='w-4 h-4' />
                            Promote
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-12 text-center'>
                  <Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>
                    {filteredStudents.length === 0 && debouncedSearchTerm
                      ? `No students found matching "${debouncedSearchTerm}"`
                      : students.length === 0
                        ? 'No students found in the database.'
                        : 'No students found matching your criteria.'}
                  </p>
                  {students.length === 0 && (
                    <p className='text-xs text-gray-400 mt-2'>
                      Make sure students are created in the system first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-gray-600'>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)}{' '}
                of {filteredStudents.length} students
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='gap-1'
                >
                  <ChevronLeft className='w-4 h-4' />
                  Previous
                </Button>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      page =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className='px-2 text-gray-400'>...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setCurrentPage(page)}
                          className='w-8 h-8 p-0'
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='gap-1'
                >
                  Next
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
