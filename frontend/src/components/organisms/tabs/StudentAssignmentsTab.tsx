'use client';

import React, { useMemo, useState } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { Users, Calendar, AlertCircle } from 'lucide-react';

// Mock data for student assignments
const mockAssignments = [
  {
    id: '1',
    title: 'Math Homework 1',
    class: 'Grade 10 - Section A',
    subject: 'Mathematics',
    dueDate: '2025-08-20',
    status: 'active',
    priority: 'medium',
    submissions: 1, // student's own submission status
    graded: 1,
    totalStudents: 1,
  },
  {
    id: '2',
    title: 'Science Project',
    class: 'Grade 10 - Section A',
    subject: 'Science',
    dueDate: '2025-08-25',
    status: 'completed',
    priority: 'high',
    submissions: 1,
    graded: 1,
    totalStudents: 1,
  },
  {
    id: '3',
    title: 'History Essay',
    class: 'Grade 10 - Section A',
    subject: 'History',
    dueDate: '2025-08-22',
    status: 'overdue',
    priority: 'low',
    submissions: 0,
    graded: 0,
    totalStudents: 1,
  },
];

interface StudentAssignment {
  id: string;
  title: string;
  class: string;
  subject: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  submissions: number;
  graded: number;
  totalStudents: number;
}

interface StudentAssignmentsTabProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export default function StudentAssignmentsTab({
  statusFilter,
  setStatusFilter,
}: StudentAssignmentsTabProps) {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Extract unique subjects for filter
  const subjects = useMemo(() => {
    return [...new Set(mockAssignments.map(a => a.subject))];
  }, []);

  const filteredAssignments = useMemo(() => {
    return mockAssignments.filter(assignment => {
      const matchesQuery =
        assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.class.toLowerCase().includes(query.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && assignment.status === 'active') ||
        (statusFilter === 'submitted' && assignment.submissions === 1) ||
        (statusFilter === 'rejected' && assignment.status === 'rejected') ||
        (statusFilter === 'overdue' && assignment.status === 'overdue');

      const matchesSubject =
        subjectFilter === 'all' || assignment.subject === subjectFilter;

      return matchesQuery && matchesStatus && matchesSubject;
    });
  }, [query, statusFilter, subjectFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-row gap-3 items-center w-full'>
          <div className='flex-1'>
            <LabeledInputField
              label=''
              placeholder='Search assignments...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full hidden sm:block'
            />
          </div>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            className='max-w-xs'
          />
          <Dropdown
            type='filter'
            title='Filter Subject'
            options={[
              { value: 'all', label: 'All Subjects' },
              ...subjects.map(subject => ({
                value: subject,
                label: subject,
              })),
            ]}
            selectedValue={subjectFilter}
            onSelect={value => setSubjectFilter(value)}
            className='max-w-xs'
          />
        </div>
      </div>
      {/* Assignments List */}
      <div className='space-y-4'>
        {filteredAssignments.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                No assignments match your current filters.
              </p>
            </div>
          </div>
        ) : (
          filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}
                    >
                      {assignment.status}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priority)}`}
                    >
                      {assignment.priority} priority
                    </span>
                    <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                      {assignment.subject}
                    </span>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {assignment.title}
                  </h3>
                  <div className='flex items-center gap-6 text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <Users className='w-4 h-4' />
                      <span>{assignment.class}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>Due: {assignment.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Submission Status */}
              <div className='space-y-3'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-600'>Submission</span>
                    <span className='text-gray-900'>
                      {assignment.submissions === 1
                        ? 'Submitted'
                        : 'Not Submitted'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${assignment.submissions === 1 ? 'bg-blue-600' : 'bg-gray-400'}`}
                      style={{
                        width: assignment.submissions === 1 ? '100%' : '0%',
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-600'>Graded</span>
                    <span className='text-gray-900'>
                      {assignment.graded === 1 ? 'Graded' : 'Not Graded'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${assignment.graded === 1 ? 'bg-green-600' : 'bg-gray-400'}`}
                      style={{ width: assignment.graded === 1 ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
              {/* Overdue Notice */}
              {assignment.status === 'overdue' && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <span className='text-red-600 text-sm font-medium'>
                    Overdue
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
