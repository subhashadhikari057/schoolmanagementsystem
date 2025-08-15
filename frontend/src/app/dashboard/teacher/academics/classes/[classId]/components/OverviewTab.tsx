'use client';

import React from 'react';
import { Users, FileText, Calendar, CheckCircle } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';

interface ClassDetails {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment?: number;
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
    };
    employeeId?: string;
  };
  students?: Array<{
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
      email?: string;
      phone?: string;
    };
  }>;
}

interface OverviewTabProps {
  classDetails: ClassDetails;
}

export default function OverviewTab({ classDetails }: OverviewTabProps) {
  // Mock data for demonstration - in real app, this would come from API
  const stats = {
    totalStudents:
      classDetails.currentEnrollment || classDetails.students?.length || 28,
    ongoingAssignments: 2,
    attendanceToday: 25,
    attendancePercentage: 89,
  };

  const mockAssignments = [
    {
      id: '1',
      title: 'An essay about Railway in Nepal (minimum 300 words)',
      subject: 'Science',
      class: '8-A',
      submissions: '0/50',
      type: 'essay',
    },
    {
      id: '2',
      title:
        'Complete Coordinate Geometry Problem Set, Page 34 - Optional Maths',
      subject: 'Optional Maths',
      class: '7-A',
      submissions: '12/50',
      type: 'problem-set',
    },
  ];

  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Class Statistics */}
      <div className='mb-8'>
        <SectionTitle
          text='Class 8 Statistics'
          level={3}
          className='text-lg font-semibold text-gray-900 mb-6'
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Total Students */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <Label className='text-gray-600 text-sm'>Total Students:</Label>
            <div className='text-2xl font-bold text-gray-900'>
              {stats.totalStudents}
            </div>
          </div>

          {/* Ongoing Assignments */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <Label className='text-gray-600 text-sm'>Ongoing Assignments</Label>
            <div className='text-2xl font-bold text-gray-900'>
              {stats.ongoingAssignments}
            </div>
          </div>
        </div>
      </div>

      {/* Assignments to Grade */}
      <div>
        <div className='flex items-center justify-between mb-6'>
          <SectionTitle
            text='Assignments to grade'
            level={3}
            className='text-lg font-semibold text-gray-900'
          />
          <Button
            label='View All'
            className='text-blue-600 bg-transparent border-none hover:bg-blue-50 text-sm'
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {mockAssignments.map(assignment => (
            <div
              key={assignment.id}
              className='bg-white border border-gray-200 rounded-lg p-6'
            >
              <div className='mb-4'>
                <div className='text-gray-900 font-medium mb-2'>
                  {assignment.title}
                </div>
                <div className='text-sm text-gray-600 mb-1'>
                  Subject: {assignment.subject}
                </div>
                <div className='text-sm text-gray-600'>
                  Class: {assignment.class}
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  {assignment.submissions} Submissions
                </div>
                <Button
                  label='Learn More'
                  className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm'
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
