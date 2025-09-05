'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/molecules/filters/SearchBar';
import { Select as NativeSelect } from '@/components/atoms/interactive/Select';
import { type StudentListResponse } from '@/api/services/student.service';
import { Filter, CheckCircle, Users } from 'lucide-react';

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
}: StudentSelectionTabProps) {
  // Filter students based on search and class selection
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return students.filter(student => {
      const matchesSearch =
        (student.fullName || '').toLowerCase().includes(q) ||
        (student.rollNumber || '').toLowerCase().includes(q) ||
        (student.studentId || '').toLowerCase().includes(q);
      const matchesClass =
        selectedClass === 'all' || (student.className || '') === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

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
              Select All Ineligible
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

          {/* Students List */}
          <div className='bg-gray-50 rounded-lg border border-gray-200 overflow-hidden'>
            <div className='max-h-96 overflow-y-auto'>
              {filteredStudents.length > 0 ? (
                <div className='divide-y divide-gray-200'>
                  {filteredStudents.map(student => (
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

                        <div className='flex-1 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center'>
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
                          <div>
                            <Badge
                              variant={
                                student.academicStatus?.toLowerCase?.() ===
                                'active'
                                  ? 'default'
                                  : 'destructive'
                              }
                              className='text-xs'
                            >
                              {student.academicStatus?.toLowerCase?.() ===
                              'active'
                                ? 'Eligible'
                                : 'Not Eligible'}
                            </Badge>
                            <div className='text-xs text-gray-500 mt-1'>
                              Academic Status
                            </div>
                          </div>
                          <div>
                            <Badge
                              variant={
                                student.feeStatus === 'paid'
                                  ? 'default'
                                  : student.feeStatus === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                              className='text-xs'
                            >
                              {student.feeStatus || 'Unknown'}
                            </Badge>
                            <div className='text-xs text-gray-500 mt-1'>
                              Fee Status
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-12 text-center'>
                  <Users className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>
                    {students.length === 0
                      ? 'No students found in the database.'
                      : 'No students found matching your search criteria.'}
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
        </CardContent>
      </Card>
    </div>
  );
}
