'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { TrendingUp, Users } from 'lucide-react';

interface TopPerformer {
  id: string;
  rank: number;
  studentName: string;
  class: string;
  grade: string;
  percentage: number;
}

interface SubjectAnalysis {
  id: string;
  subject: string;
  students: number;
  averageScore: number;
  passRate: number;
}

export default function AnalyticsTab() {
  const topPerformers: TopPerformer[] = [
    {
      id: '1',
      rank: 1,
      studentName: 'David Wilson',
      class: 'Class 9-A',
      grade: 'A+',
      percentage: 93.75,
    },
    {
      id: '2',
      rank: 2,
      studentName: 'Alice Johnson',
      class: 'Class 7-B',
      grade: 'A',
      percentage: 85,
    },
    {
      id: '3',
      rank: 3,
      studentName: 'Eva Brown',
      class: 'Class 9-A',
      grade: 'A',
      percentage: 81.25,
    },
    {
      id: '4',
      rank: 4,
      studentName: 'Bob Smith',
      class: 'Class 7-B',
      grade: 'B',
      percentage: 72,
    },
    {
      id: '5',
      rank: 5,
      studentName: 'Carol Davis',
      class: 'Class 7-B',
      grade: 'B',
      percentage: 68,
    },
  ];

  const subjectAnalysis: SubjectAnalysis[] = [
    {
      id: '1',
      subject: 'Science',
      students: 60,
      averageScore: 78.5,
      passRate: 85,
    },
    {
      id: '2',
      subject: 'Optional Mathematics',
      students: 25,
      averageScore: 82.3,
      passRate: 92,
    },
    {
      id: '3',
      subject: 'Chemistry Theory',
      students: 22,
      averageScore: 85.7,
      passRate: 95,
    },
    {
      id: '4',
      subject: 'Physics Lab',
      students: 18,
      averageScore: 0,
      passRate: 0,
    },
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'bg-green-100 text-green-700';
      case 'A':
        return 'bg-blue-100 text-blue-700';
      case 'B':
        return 'bg-yellow-100 text-yellow-700';
      case 'C':
        return 'bg-orange-100 text-orange-700';
      case 'D':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <SectionTitle
            text='Performance Analytics'
            level={3}
            className='text-lg sm:text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600 text-sm sm:text-base'>
            Comprehensive analysis of student and subject performance
          </Label>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        {/* Left Panel: Top Performers */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-2 mb-4 sm:mb-6'>
            <TrendingUp className='w-5 h-5 text-blue-600' />
            <SectionTitle
              text='Top Performers'
              level={4}
              className='text-base sm:text-lg font-semibold text-gray-900'
            />
          </div>

          <div className='space-y-3 sm:space-y-4'>
            {topPerformers.map(performer => (
              <div
                key={performer.id}
                className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-50'
              >
                <div className='flex items-center gap-2 sm:gap-4 min-w-0'>
                  <div className='w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-blue-600 font-bold text-xs sm:text-sm'>
                      #{performer.rank}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <div className='font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none'>
                      {performer.studentName}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      {performer.class}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0'>
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getGradeColor(performer.grade)}`}
                  >
                    {performer.grade}
                  </span>
                  <div className='text-right'>
                    <div className='text-xs sm:text-sm font-medium text-gray-900'>
                      {performer.percentage}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Subject Analysis */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'>
          <div className='flex items-center gap-2 mb-4 sm:mb-6'>
            <Users className='w-5 h-5 text-green-600' />
            <SectionTitle
              text='Subject Analysis'
              level={4}
              className='text-base sm:text-lg font-semibold text-gray-900'
            />
          </div>

          <div className='space-y-3 sm:space-y-4'>
            {subjectAnalysis.map(subject => (
              <div key={subject.id} className='space-y-2 sm:space-y-3'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {subject.subject}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      {subject.students} students
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-xs sm:text-sm font-medium text-gray-900'>
                      {subject.averageScore > 0
                        ? `${subject.averageScore}%`
                        : '-'}{' '}
                      avg
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      {subject.passRate}% pass rate
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${subject.passRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm text-center'>
          <div className='text-lg sm:text-2xl font-bold text-green-600'>
            93.75%
          </div>
          <Label className='text-xs sm:text-sm text-gray-600'>
            Highest Score
          </Label>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm text-center'>
          <div className='text-lg sm:text-2xl font-bold text-red-600'>68%</div>
          <Label className='text-xs sm:text-sm text-gray-600'>
            Lowest Score
          </Label>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm text-center'>
          <div className='text-lg sm:text-2xl font-bold text-blue-600'>91%</div>
          <Label className='text-xs sm:text-sm text-gray-600'>Pass Rate</Label>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm text-center'>
          <div className='text-lg sm:text-2xl font-bold text-purple-600'>
            82.1%
          </div>
          <Label className='text-xs sm:text-sm text-gray-600'>
            Class Average
          </Label>
        </div>
      </div>
    </div>
  );
}
