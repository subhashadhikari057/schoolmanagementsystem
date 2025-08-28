'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Button from '@/components/atoms/form-controls/Button';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import Dropdown from '@/components/molecules/interactive/Dropdown';
// import { PageLoader } from '@/components/atoms/loading';

// Overview tab: summary, info, assignments (matches image)
function OverviewTab({ subject }: { subject: any }) {
  // Demo summary data
  const summary = {
    ongoing: 2,
    missed: 12,
    completed: 28,
    teacher: subject.teacher,
  };
  // Demo assignments
  const assignments = [
    {
      title: 'An essay about Railway In Nepal (minimum 300 words)',
      subject: 'Economics',
      teacher: 'Tara Kumari',
      due: '2025/08/12',
      status: 'Unsubmitted',
    },
  ];
  return (
    <div className='p-4 space-y-4'>
      {/* Info Banner */}
      <div className='border-dashed border-2 border-blue-200 rounded-lg p-3 flex items-center gap-2 bg-blue-50'>
        <span className='text-blue-600'>
          <svg
            width='20'
            height='20'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='16' x2='12' y2='12' />
            <line x1='12' y1='8' x2='12' y2='8' />
          </svg>
        </span>
        <span className='text-blue-700 font-medium'>
          Science Unit Test is Scheduled for August 12th
        </span>
      </div>

      {/* Summary */}
      <div className='bg-white rounded-lg shadow-sm p-4'>
        <h4 className='font-semibold text-gray-800 mb-3'>Summary</h4>
        <div className='grid grid-cols-2 gap-2 mb-2'>
          <div className='flex items-center gap-2 text-gray-700'>
            <svg
              width='18'
              height='18'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              viewBox='0 0 24 24'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <line x1='9' y1='9' x2='15' y2='9' />
              <line x1='9' y1='15' x2='15' y2='15' />
            </svg>{' '}
            Ongoing Assignments
          </div>
          <div className='font-bold text-right'>{summary.ongoing}</div>
          <div className='flex items-center gap-2 text-gray-700'>
            <svg
              width='18'
              height='18'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              viewBox='0 0 24 24'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <line x1='9' y1='9' x2='15' y2='9' />
              <line x1='9' y1='15' x2='15' y2='15' />
            </svg>{' '}
            Missed Assignments
          </div>
          <div className='font-bold text-right'>{summary.missed}</div>
          <div className='flex items-center gap-2 text-gray-700'>
            <svg
              width='18'
              height='18'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              viewBox='0 0 24 24'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <line x1='9' y1='9' x2='15' y2='9' />
              <line x1='9' y1='15' x2='15' y2='15' />
            </svg>{' '}
            Completed Assignments
          </div>
          <div className='font-bold text-right'>{summary.completed}</div>
          <div className='flex items-center gap-2 text-gray-700 col-span-2'>
            <svg
              width='18'
              height='18'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='7' r='4' />
              <path d='M5.5 21a6.5 6.5 0 0 1 13 0' />
            </svg>{' '}
            Subject Teacher{' '}
            <span className='font-bold ml-2'>{summary.teacher}</span>
          </div>
        </div>
      </div>

      {/* Assignments Section */}
      <div className='mt-4'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='font-semibold text-gray-800'>Assignments</h4>
          <span className='text-xs text-blue-600 cursor-pointer'>View All</span>
        </div>
        {assignments.map((a, idx) => (
          <div key={idx} className='bg-white rounded-xl shadow p-4 mb-3'>
            <div className='font-medium text-gray-900 mb-1'>{a.title}</div>
            <div className='flex flex-wrap gap-4 text-xs text-gray-500 mb-1'>
              <span>Subject: {a.subject}</span>
              <span>Teacher: {a.teacher}</span>
            </div>
            <div className='flex items-center justify-between mt-2'>
              <span className='text-xs font-semibold text-yellow-600'>
                Due: {a.due}
              </span>
              <button className='bg-blue-600 text-white px-4 py-1 rounded-full font-semibold text-xs'>
                Submit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Assignments tab: filter dropdown and assignment list
function AssignmentsTab({ subject }: { subject: any }) {
  // Demo assignments
  const allAssignments = [
    { title: 'Essay on Environment', due: '2025-08-25', status: 'Completed' },
    { title: 'Chapter 5 Worksheet', due: '2025-08-28', status: 'Ongoing' },
    { title: 'Unit Test Preparation', due: '2025-08-30', status: 'Missed' },
    { title: 'Science Project', due: '2025-09-02', status: 'Ongoing' },
  ];
  const [filter, setFilter] = React.useState('All');
  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Missed', label: 'Missed' },
  ];
  const assignments =
    filter === 'All'
      ? allAssignments
      : allAssignments.filter(a => a.status === filter);
  return (
    <div className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Assignments</h3>
        <Dropdown
          type='filter'
          options={statusOptions}
          selectedValue={filter}
          onSelect={setFilter}
          placeholder='Filter by status'
          className='max-w-[160px]'
        />
      </div>
      {assignments.length === 0 ? (
        <p className='text-gray-500'>No assignments found.</p>
      ) : (
        <div className='space-y-3'>
          {assignments.map((a, idx) => (
            <div
              key={idx}
              className='rounded-lg p-3 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between'
            >
              <div>
                <div className='font-medium text-gray-800'>{a.title}</div>
                <div className='text-xs text-gray-500'>Due: {a.due}</div>
              </div>
              <div
                className={`text-xs font-semibold px-2 py-1 rounded mt-2 sm:mt-0 ${a.status === 'Completed' ? 'bg-green-100 text-green-700' : a.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}
              >
                {a.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Client component for the actual page content
function SubjectDetailsContent({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  // Demo subject data (could be dynamic)
  const subject = {
    id: subjectId,
    name: subjectId.charAt(0).toUpperCase() + subjectId.slice(1),
    description:
      'This subject covers basic science topics including physics, chemistry, and biology.',
    schedule: 'Mon, Wed, Fri - 10:00AM to 11:00AM',
    teacher: 'Tara Kumari',
    students: 32,
  };
  const tabs = [
    {
      name: 'Overview',
      content: <OverviewTab subject={subject} />,
    },
    {
      name: 'Assignments',
      content: <AssignmentsTab subject={subject} />,
    },
  ];

  // For now, no loading state - data is hardcoded
  // if (loading) {
  //   return <PageLoader />;
  // }

  return (
    <div className='min-h-screen w-full bg-[#f7f8fa] sm:px-4 pb-12'>
      <div className='w-full'>
        <div className='flex rounded-xl items-center gap-2 mb-6 bg-blue-700 py-20 px-5'>
          <Button
            onClick={() => router.back()}
            className='bg-blue-50 hover:bg-blue-100 p-2 rounded-full'
          >
            <ArrowLeft className='w-5 h-5 text-blue-700' />
          </Button>
          <SectionTitle
            text={`${decodeURIComponent(subject.name)} Details`}
            className='ml-2 text-xl font-bold text-gray-900'
          />
        </div>
        <div className='mb-8'>
          <GenericTabs tabs={tabs} />
        </div>
      </div>
    </div>
  );
}

// Server component wrapper to handle async params
export default async function SubjectDetailsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  return <SubjectDetailsContent subjectId={subjectId} />;
}
