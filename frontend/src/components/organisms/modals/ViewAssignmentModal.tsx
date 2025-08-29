'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  Calendar,
  BookOpen,
  User,
  Paperclip,
  Download,
  Eye,
  FileText,
  Image,
  File,
} from 'lucide-react';
import { AssignmentResponse } from '@/api/types/assignment';
import Button from '@/components/atoms/form-controls/Button';

interface ViewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentResponse;
  userRole?: string;
}

export default function ViewAssignmentModal({
  isOpen,
  onClose,
  assignment,
  userRole,
}: ViewAssignmentModalProps) {
  if (!isOpen) return null;

  // Helper function to get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className='w-4 h-4' />;
    if (mimeType.includes('pdf')) return <FileText className='w-4 h-4' />;
    return <File className='w-4 h-4' />;
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if user can see submission stats (teachers, admins, superadmins)
  const canViewSubmissionStats =
    userRole &&
    ['teacher', 'admin', 'superadmin'].includes(userRole.toLowerCase());

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
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={onClose}
            className='absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-4 w-4 text-gray-500' />
          </button>

          <h2 className='text-xl font-bold text-gray-800'>
            Assignment Details
          </h2>
          <p className='text-base text-gray-600 mt-1'>{assignment.title}</p>
        </div>

        {/* Content */}
        <div className='p-4 space-y-4'>
          {/* Description */}
          {assignment.description && (
            <div>
              <h3 className='text-base font-medium text-gray-500 mb-3'>
                Description
              </h3>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-700 leading-relaxed text-base whitespace-pre-wrap'>
                  {assignment.description}
                </p>
              </div>
            </div>
          )}

          {/* Key Details */}
          <div className='grid grid-cols-1 gap-3'>
            <div className='flex items-center gap-3'>
              <BookOpen className='w-4 h-4 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Subject</p>
                <p className='text-base text-gray-900'>
                  {assignment.subject.name} ({assignment.subject.code})
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Users className='w-4 h-4 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Class</p>
                <p className='text-base text-gray-900'>
                  Grade {assignment.class.grade} - {assignment.class.section}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <User className='w-4 h-4 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Teacher</p>
                <p className='text-base text-gray-900'>
                  {assignment.teacher?.user?.fullName || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Calendar className='w-4 h-4 text-gray-400' />
              <div>
                <p className='text-sm font-medium text-gray-500'>Due Date</p>
                <p className='text-base text-gray-900'>
                  {assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <h3 className='text-sm font-medium text-gray-500 mb-2 flex items-center gap-2'>
                <Paperclip className='w-3 h-3' />
                Attachments ({assignment.attachments.length})
              </h3>
              <div className='flex flex-wrap gap-2'>
                {assignment.attachments.map((attachment, index) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-3 py-1.5 transition-colors duration-200'
                    title={attachment.originalName}
                  >
                    <FileText className='w-3 h-3 text-blue-600 flex-shrink-0' />
                    <span className='text-sm font-medium text-blue-700'>
                      File {index + 1}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submission Stats */}
          {canViewSubmissionStats && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <h3 className='text-sm font-medium text-gray-500 mb-3'>
                Submission Stats
              </h3>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-xl font-bold text-gray-900'>
                    {assignment.class.students?.length || 0}
                  </p>
                  <p className='text-sm text-gray-500'>Total Students</p>
                </div>
                <div>
                  <p className='text-xl font-bold text-gray-900'>
                    {assignment._count?.submissions || 0}
                  </p>
                  <p className='text-sm text-gray-500'>Submissions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end p-4 border-t bg-gray-50 rounded-b-xl'>
          <Button
            onClick={onClose}
            className='px-4 py-2 bg-white border border-gray-300 rounded-md text-base text-gray-700 hover:bg-gray-50'
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
