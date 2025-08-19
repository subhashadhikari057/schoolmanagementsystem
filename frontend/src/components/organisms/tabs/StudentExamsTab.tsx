'use client';

import React, { useMemo, useState } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { Calendar, AlertCircle } from 'lucide-react';

// Mock data for student term and board exams
const mockExams: StudentExam[] = [
  {
    id: '1',
    title: '1st Term Exam',
    class: 'Grade 10 - Section A',
    subject: 'Mathematics',
    date: '2025-06-10',
    status: 'completed', // type: 'completed' | 'upcoming'
    result: 'passed', // type: 'pending' | 'passed' | 'failed'
    score: 85,
  },
  {
    id: '2',
    title: '2nd Term Exam',
    class: 'Grade 10 - Section A',
    subject: 'Science',
    date: '2025-09-15',
    status: 'upcoming',
    result: 'pending',
    score: null,
  },
  {
    id: '3',
    title: 'Board Exam',
    class: 'Grade 10 - Section A',
    subject: 'History',
    date: '2025-11-05',
    status: 'upcoming',
    result: 'pending',
    score: null,
  },
  {
    id: '5',
    title: 'Science 1st Term Exam',
    class: 'Grade 10 - Section A',
    subject: 'Science',
    date: '2025-06-12',
    status: 'completed',
    result: 'failed',
    score: 45,
  },
];

interface StudentExam {
  id: string;
  title: string;
  class: string;
  subject: string;
  date: string;
  status: 'upcoming' | 'completed';
  result: 'pending' | 'passed' | 'failed';
  score: number | null;
}

interface StudentExamsTabProps {
  statusFilter: string;
  setStatusFilter?: (value: string) => void;
  selectedChild?: string;
}
export default function StudentExamsTab({
  statusFilter,
  setStatusFilter,
  selectedChild,
}: StudentExamsTabProps) {
  const [query, setQuery] = useState('');

  // For demo, assign exams to children by id (odd/even)
  function examBelongsToChild(exam: StudentExam, childId?: string) {
    if (!childId) return true;
    // Example: odd id for child 1, even id for child 2
    if (childId === '1') return parseInt(exam.id) % 2 === 1;
    if (childId === '2') return parseInt(exam.id) % 2 === 0;
    return true;
  }

  const filteredExams = useMemo(() => {
    return mockExams.filter(exam => {
      // Only show term and board exams
      const title = exam.title.toLowerCase();
      if (!(title.includes('term') || title.includes('board'))) return false;

      const matchesQuery =
        title.includes(query.toLowerCase()) ||
        exam.class.toLowerCase().includes(query.toLowerCase()) ||
        exam.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && exam.status === 'upcoming') ||
        (statusFilter === 'completed' && exam.status === 'completed') ||
        (statusFilter === 'passed' && exam.result === 'passed') ||
        (statusFilter === 'failed' && exam.result === 'failed');

      const matchesChild = examBelongsToChild(exam, selectedChild);

      return matchesQuery && matchesStatus && matchesChild;
    });
  }, [query, statusFilter, selectedChild]);

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-row gap-3 items-center w-full'>
          <div className='flex-1'>
            <LabeledInputField
              label=''
              placeholder='Search exams...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full'
            />
          </div>
          {setStatusFilter && (
            <Dropdown
              type='filter'
              title='Filter Status'
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'completed', label: 'Completed' },
                { value: 'passed', label: 'Passed' },
                { value: 'failed', label: 'Failed' },
              ]}
              selectedValue={statusFilter}
              onSelect={setStatusFilter}
              className='max-w-xs'
            />
          )}
        </div>
      </div>

      {/* Exams List */}
      <div className='space-y-4'>
        {filteredExams.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                No exams match your current filters.
              </p>
            </div>
          </div>
        ) : (
          filteredExams.map(exam => (
            <div
              key={exam.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${exam.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {exam.title}
                  </h3>

                  <div className='flex items-center gap-6 text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>Date: {exam.date}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span>{exam.class}</span>
                    </div>
                  </div>
                </div>

                <div className='flex gap-3'>
                  {exam.status === 'completed' ? (
                    <Button
                      label='Download Result'
                      className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                      onClick={() => alert('Result downloaded (mock)')}
                    />
                  ) : (
                    <Button
                      label='Learn More'
                      className='bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200'
                      onClick={() => alert('Exam details (mock)')}
                    />
                  )}
                </div>
              </div>

              {/* Exam Result */}
              {exam.status === 'completed' && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <span
                    className={`text-sm font-medium ${exam.result === 'passed' ? 'text-green-600' : exam.result === 'failed' ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {exam.result === 'pending'
                      ? 'Result Pending'
                      : exam.result === 'passed'
                        ? `Passed (Score: ${exam.score})`
                        : `Failed (Score: ${exam.score})`}
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
