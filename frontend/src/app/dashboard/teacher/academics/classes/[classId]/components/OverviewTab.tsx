'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { assignmentService } from '@/api/services/assignment.service';
import { teacherService } from '@/api/services/teacher.service';
import { classService, ClassResponse } from '@/api/services/class.service';
import { useAuth } from '@/hooks/useAuth';
import { AssignmentResponse } from '@/api/types/assignment';

interface ClassDetails {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  currentEnrollment: number;
  shift: 'morning' | 'day';
  roomId: string;
  classTeacherId: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
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
    parents?: Array<{
      id: string;
      parent: {
        id: string;
        user: {
          fullName: string;
          email: string;
          phone?: string;
        };
      };
      relationship: string;
      isPrimary: boolean;
    }>;
    guardians?: Array<{
      id: string;
      fullName: string;
      phone: string;
      email: string;
      relation: string;
    }>;
  }>;
}

interface OverviewTabProps {
  classDetails: ClassDetails;
}

export default function OverviewTab({ classDetails }: OverviewTabProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Stats data from classDetails props
  const stats = {
    totalStudents: classDetails.students?.length || 0,
    capacity: classDetails.capacity || 0,
    ongoingAssignments: assignments.length,
  };

  // Get current teacher's ID
  const loadTeacherData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await teacherService.getCurrentTeacher();
      setTeacherId(response.data.id);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
  }, [user]);

  // Load assignments for this class created by this teacher
  const loadAssignments = useCallback(async () => {
    if (!teacherId || !classDetails.id) {
      setAssignmentsLoading(false);
      return;
    }

    try {
      setAssignmentsLoading(true);
      const response = await assignmentService.getAllAssignments({
        classId: classDetails.id,
        teacherId: teacherId,
      });
      setAssignments(response.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [teacherId, classDetails.id]);

  useEffect(() => {
    loadTeacherData();
  }, [loadTeacherData]);

  useEffect(() => {
    if (teacherId) {
      loadAssignments();
    }
  }, [teacherId, loadAssignments]);

  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Class Statistics */}
      <div className='mb-8'>
        <SectionTitle
          text={`Class ${classDetails.grade}-${classDetails.section} Statistics`}
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
            <div className='text-xs text-gray-500 mt-1'>
              {stats.totalStudents}/{stats.capacity} enrolled
            </div>
          </div>

          {/* Ongoing Assignments */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <Label className='text-gray-600 text-sm'>Ongoing Assignments</Label>
            <div className='text-2xl font-bold text-gray-900'>
              {stats.ongoingAssignments}
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {assignmentsLoading ? 'Loading...' : 'Active assignments'}
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

        {assignmentsLoading ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className='bg-gray-200 animate-pulse rounded-lg p-6 h-32'
              ></div>
            ))}
          </div>
        ) : assignments.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {assignments.map(assignment => (
              <div
                key={assignment.id}
                className='bg-white border border-gray-200 rounded-lg p-6'
              >
                <div className='mb-4'>
                  <div className='text-gray-900 font-medium mb-2'>
                    {assignment.title}
                  </div>
                  <div className='text-sm text-gray-600 mb-1'>
                    Subject: {assignment.subject.name}
                  </div>
                  <div className='text-sm text-gray-600'>
                    Class: Grade {assignment.class.grade}-
                    {assignment.class.section}
                  </div>
                  {assignment.dueDate && (
                    <div className='text-sm text-gray-500 mt-1'>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-600'>
                    {assignment._count?.submissions || 0}/{stats.totalStudents}{' '}
                    Submissions
                  </div>
                  <Button
                    label='Learn More'
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm'
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 bg-gray-50 rounded-lg'>
            <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <div className='text-lg font-medium text-gray-900 mb-2'>
              No assignments yet
            </div>
            <div className='text-gray-600 mb-6'>
              Create your first assignment for this class
            </div>
            <Button
              label='Create Assignment'
              className='bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded mx-auto'
            />
          </div>
        )}
      </div>
    </div>
  );
}
