'use client';

import React, { useMemo, useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { Edit, Eye, Clock, Users, Calendar, BarChart3 } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  class: string;
  subject: string;
  examType: string;
  date: string;
  duration: string;
  maxMarks: number;
  totalStudents: number;
  completed: number;
  graded: number;
  averageScore: number;
  status: 'grading' | 'completed' | 'scheduled';
}

export default function ExamsTab() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'grading' | 'completed' | 'scheduled'
  >('all');

  const exams: Exam[] = [
    {
      id: '1',
      title: 'Mid-term Science Examination',
      class: 'Class 7-B, Class 8-A',
      subject: 'Science',
      examType: 'written',
      date: '8/25/2025',
      duration: '2 hours',
      maxMarks: 100,
      totalStudents: 60,
      completed: 45,
      graded: 40,
      averageScore: 78.5,
      status: 'grading',
    },
    {
      id: '2',
      title: 'Optional Mathematics Unit Test',
      class: 'Class 9-A',
      subject: 'Optional Mathematics',
      examType: 'written',
      date: '8/20/2025',
      duration: '1.5 hours',
      maxMarks: 80,
      totalStudents: 25,
      completed: 25,
      graded: 25,
      averageScore: 82.3,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Physics Lab Practical Exam',
      class: 'Class 11-A',
      subject: 'Physics Lab',
      examType: 'practical',
      date: '8/30/2025',
      duration: '3 hours',
      maxMarks: 50,
      totalStudents: 18,
      completed: 0,
      graded: 0,
      averageScore: 0,
      status: 'scheduled',
    },
    {
      id: '4',
      title: 'Chemistry Theory Final',
      class: 'Class 12-B',
      subject: 'Chemistry Theory',
      examType: 'written',
      date: '7/15/2025',
      duration: '2.5 hours',
      maxMarks: 100,
      totalStudents: 22,
      completed: 22,
      graded: 22,
      averageScore: 85.7,
      status: 'completed',
    },
  ];

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesQuery =
        exam.title.toLowerCase().includes(query.toLowerCase()) ||
        exam.class.toLowerCase().includes(query.toLowerCase()) ||
        exam.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || exam.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [exams, query, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'grading':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            type='search'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search exams...'
            className='w-full bg-white'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                />
              </svg>
            }
          />
        </div>
        <div className='flex items-center gap-2'>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'grading', label: 'Grading' },
              { value: 'completed', label: 'Completed' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
            selectedValue={statusFilter}
            onSelect={value =>
              setStatusFilter(
                value as 'all' | 'grading' | 'completed' | 'scheduled',
              )
            }
            className='max-w-xs'
          />
        </div>
      </div>

      {/* Exams List */}
      <div className='space-y-4'>
        {filteredExams.map(exam => (
          <div
            key={exam.id}
            className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-3'>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}
                  >
                    {exam.status}
                  </span>
                  <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                    {exam.subject}
                  </span>
                  <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                    {exam.examType}
                  </span>
                </div>

                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {exam.title}
                </h3>

                <div className='flex items-center gap-6 text-sm text-gray-600 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='w-4 h-4' />
                    <span>{exam.date}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4' />
                    <span>{exam.duration}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <BarChart3 className='w-4 h-4' />
                    <span>Max Marks: {exam.maxMarks}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    <span>Classes: {exam.class}</span>
                  </div>
                </div>

                {/* Statistics Row */}
                <div className='grid grid-cols-4 gap-4 mb-4'>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {exam.totalStudents}
                    </div>
                    <div className='text-xs text-gray-600'>Total Students</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {exam.completed}
                    </div>
                    <div className='text-xs text-gray-600'>Completed</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {exam.graded}
                    </div>
                    <div className='text-xs text-gray-600'>Graded</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-gray-900'>
                      {exam.averageScore > 0 ? `${exam.averageScore}%` : '-'}
                    </div>
                    <div className='text-xs text-gray-600'>Average Score</div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
