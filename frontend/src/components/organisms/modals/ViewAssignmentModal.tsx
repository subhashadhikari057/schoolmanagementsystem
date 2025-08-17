'use client';

import React from 'react';
import { X, Users, Calendar, BookOpen, User } from 'lucide-react';
import { AssignmentResponse } from '@/api/types/assignment';
import Button from '@/components/atoms/form-controls/Button';

interface ViewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentResponse;
}

export default function ViewAssignmentModal({
  isOpen,
  onClose,
  assignment,
}: ViewAssignmentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl font-bold text-gray-800'>
            Assignment Details
          </h2>
          <p className='text-gray-600 mt-1'>{assignment.title}</p>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Description */}
          {assignment.description && (
            <div>
              <h3 className='text-sm font-medium text-gray-500 mb-2'>
                Description
              </h3>
              <p className='text-gray-700'>{assignment.description}</p>
            </div>
          )}

          {/* Key Details */}
          <div className='grid grid-cols-2 gap-6'>
            <div className='flex items-start gap-3'>
              <BookOpen className='w-5 h-5 text-gray-400 mt-1' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Subject</p>
                <p className='text-gray-900'>
                  {assignment.subject.name}
                  <span className='text-gray-500 text-sm ml-1'>
                    ({assignment.subject.code})
                  </span>
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Users className='w-5 h-5 text-gray-400 mt-1' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Class</p>
                <p className='text-gray-900'>
                  Grade {assignment.class.grade} - {assignment.class.section}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <User className='w-5 h-5 text-gray-400 mt-1' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Teacher</p>
                <p className='text-gray-900'>
                  {assignment.teacher?.user?.fullName || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Calendar className='w-5 h-5 text-gray-400 mt-1' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Due Date</p>
                <p className='text-gray-900'>
                  {assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Stats */}
          <div className='bg-gray-50 rounded-lg p-4 mt-6'>
            <h3 className='text-sm font-medium text-gray-500 mb-4'>
              Submission Stats
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignment.class.students?.length || 0}
                </p>
                <p className='text-sm text-gray-500'>Total Students</p>
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>
                  {assignment._count?.submissions || 0}
                </p>
                <p className='text-sm text-gray-500'>Submissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end p-6 border-t bg-gray-50 rounded-b-xl'>
          <Button
            onClick={onClose}
            className='px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
