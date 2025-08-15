'use client';

import React, { useMemo, useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { Edit, Eye, Clock, Users, Calendar } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  class: string;
  subject: string;
  dueDate: string;
  totalStudents: number;
  submissions: number;
  graded: number;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export default function AllAssignmentsTab() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'incomplete' | 'completed'
  >('all');
  const [subjectFilter, setSubjectFilter] = useState<
    'all' | 'science' | 'math' | 'physics' | 'chemistry'
  >('all');

  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'An essay about Railway In Nepal (minimum 300 words)',
      class: 'Class 8-A',
      subject: 'Science',
      dueDate: '8/15/2025',
      totalStudents: 50,
      submissions: 12,
      graded: 5,
      status: 'active',
      priority: 'medium',
    },
    {
      id: '2',
      title: 'Complete Coordinate Geometry Problem Set, Page-34',
      class: 'Class 9-A',
      subject: 'Optional Mathematics',
      dueDate: '8/18/2025',
      totalStudents: 30,
      submissions: 25,
      graded: 20,
      status: 'active',
      priority: 'high',
    },
    {
      id: '3',
      title: "Physics Lab Report - Newton's Laws of Motion",
      class: 'Class 11-A',
      subject: 'Physics Lab',
      dueDate: '8/20/2025',
      totalStudents: 18,
      submissions: 8,
      graded: 0,
      status: 'active',
      priority: 'medium',
    },
    {
      id: '4',
      title: 'Chemical Bonding Theory Questions',
      class: 'Class 12-B',
      subject: 'Chemistry Theory',
      dueDate: '8/10/2025',
      totalStudents: 22,
      submissions: 22,
      graded: 22,
      status: 'completed',
      priority: 'low',
    },
    {
      id: '5',
      title: 'Photosynthesis Diagram and Explanation',
      class: 'Class 7-B',
      subject: 'Science',
      dueDate: '8/8/2025',
      totalStudents: 32,
      submissions: 28,
      graded: 15,
      status: 'overdue',
      priority: 'high',
    },
  ];

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesQuery =
        assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.class.toLowerCase().includes(query.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || assignment.status === statusFilter;
      const matchesSubject =
        subjectFilter === 'all' ||
        assignment.subject.toLowerCase().includes(subjectFilter);

      return matchesQuery && matchesStatus && matchesSubject;
    });
  }, [assignments, query, statusFilter, subjectFilter]);

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
        <div className='flex-1'>
          <LabeledInputField
            label=''
            placeholder='Search assignments...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg px-4 py-2'
          />
        </div>
        <div className='flex gap-3'>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'incomplete', label: 'Incomplete' },
            ]}
            selectedValue={statusFilter}
            onSelect={value =>
              setStatusFilter(value as 'all' | 'incomplete' | 'completed')
            }
            className='max-w-xs'
          />
          <Dropdown
            type='filter'
            title='Filter Subject'
            options={[
              { value: 'all', label: 'All Subjects' },
              { value: 'science', label: 'Science' },
              { value: 'math', label: 'Math' },
              { value: 'physics', label: 'Physics' },
              { value: 'chemistry', label: 'Chemistry' },
            ]}
            selectedValue={subjectFilter}
            onSelect={value =>
              setSubjectFilter(
                value as 'all' | 'science' | 'math' | 'physics' | 'chemistry',
              )
            }
            className='max-w-xs'
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className='space-y-4'>
        {filteredAssignments.map(assignment => (
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
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    <span>{assignment.totalStudents} students</span>
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <Button
                  label='Edit'
                  className='bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200'
                />
                <Button
                  label='View Details'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                />
              </div>
            </div>

            {/* Progress Bars */}
            <div className='space-y-3'>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-gray-600'>Submissions</span>
                  <span className='text-gray-900'>
                    {assignment.submissions}/{assignment.totalStudents} (
                    {Math.round(
                      (assignment.submissions / assignment.totalStudents) * 100,
                    )}
                    %)
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(assignment.submissions / assignment.totalStudents) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-gray-600'>Graded</span>
                  <span className='text-gray-900'>
                    {assignment.graded}/{assignment.submissions} (
                    {assignment.submissions > 0
                      ? Math.round(
                          (assignment.graded / assignment.submissions) * 100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${assignment.submissions > 0 ? (assignment.graded / assignment.submissions) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pending Review */}
            {assignment.status === 'active' &&
              assignment.submissions > assignment.graded && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <span className='text-orange-600 text-sm font-medium'>
                    {assignment.submissions - assignment.graded} pending review
                  </span>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
