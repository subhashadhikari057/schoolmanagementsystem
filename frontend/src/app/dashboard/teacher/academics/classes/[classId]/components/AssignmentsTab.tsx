'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
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
  currentEnrollment?: number;
}

interface AssignmentsTabProps {
  classDetails: ClassDetails;
}

export default function AssignmentsTab({ classDetails }: AssignmentsTabProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [backendClassData, setBackendClassData] =
    useState<ClassResponse | null>(null);
  const [classDataLoading, setClassDataLoading] = useState(true);

  // Load real class data from backend
  const loadClassData = useCallback(async () => {
    if (!classDetails.id) {
      setClassDataLoading(false);
      return;
    }

    try {
      setClassDataLoading(true);
      const response = await classService.getClassById(classDetails.id);
      setBackendClassData(response.data);
    } catch (error) {
      console.error('Failed to load class data:', error);
    } finally {
      setClassDataLoading(false);
    }
  }, [classDetails.id]);

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
    loadClassData();
    loadTeacherData();
  }, [loadClassData, loadTeacherData]);

  useEffect(() => {
    if (teacherId) {
      loadAssignments();
    }
  }, [teacherId, loadAssignments]);

  const totalStudents = backendClassData?.students?.length || 0;
  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Header with Add Assignment Button */}
      <div className='bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5' />
          <span className='font-medium'>Add a new Assignment</span>
        </div>
        <Button className='bg-white text-blue-600 hover:bg-gray-100 px-3 py-1 rounded flex items-center gap-2'>
          <Plus className='w-4 h-4' />
        </Button>
      </div>

      {/* Assignments Grid */}
      {assignmentsLoading ? (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className='bg-gray-200 animate-pulse rounded-lg p-6 h-48'
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
              {/* Assignment Title */}
              <div className='mb-4'>
                <h3 className='font-medium text-gray-900 mb-2 leading-tight'>
                  {assignment.title}
                </h3>
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
                {assignment.description && (
                  <div className='text-sm text-gray-600 mt-2 line-clamp-2'>
                    {assignment.description}
                  </div>
                )}
              </div>

              {/* Submissions Count */}
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-600'>
                  {assignment._count?.submissions || 0}/{totalStudents}{' '}
                  Submissions
                </div>
                <Button
                  label='Learn More'
                  className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm'
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12 bg-gray-50 rounded-lg'>
          <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
          <div className='text-lg font-medium text-gray-900 mb-2'>
            No assignments yet
          </div>
          <div className='text-gray-600 mb-6'>
            Create your first assignment for this class
          </div>
          <Button className='bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded flex items-center gap-2 mx-auto'>
            <Plus className='w-4 h-4' />
            Create Assignment
          </Button>
        </div>
      )}
    </div>
  );
}
