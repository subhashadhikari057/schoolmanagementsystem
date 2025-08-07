'use client';

import React from 'react';
import {
  X,
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import { SubjectResponse } from '@/api/types/subject';

interface SubjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectResponse | null;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  isOpen,
  onClose,
  subject,
}) => {
  if (!isOpen || !subject) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 overflow-hidden'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl'></div>
          <div className='absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-2xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                <BookOpen className='text-white' size={28} />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-white'>
                  {subject.name}
                </h2>
                <p className='text-blue-100 text-sm mt-1'>
                  Code: {subject.code}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200'
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Basic Information */}
            <div className='bg-gray-50 rounded-xl p-5 border border-gray-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <BookOpen size={20} className='mr-3 text-blue-500' />
                Subject Information
              </h3>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Subject Name:
                  </span>
                  <p className='text-gray-900 font-medium'>{subject.name}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Subject Code:
                  </span>
                  <p className='text-gray-900 font-medium'>{subject.code}</p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Subject Type:
                  </span>
                  <div className='mt-1'>
                    {subject.description === 'compulsory' ? (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                        📚 Compulsory Subject
                      </span>
                    ) : subject.description === 'optional' ? (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800'>
                        ⭐ Optional Subject
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
                        📚 Compulsory Subject
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Created:
                  </span>
                  <p className='text-gray-900'>
                    {new Date(subject.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Exam Configuration */}
            <div className='bg-gray-50 rounded-xl p-5 border border-gray-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Award size={20} className='mr-3 text-green-500' />
                Exam Configuration
              </h3>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Maximum Marks:
                  </span>
                  <p className='text-gray-900 font-medium'>
                    {subject.maxMarks || 100}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Pass Marks:
                  </span>
                  <p className='text-gray-900 font-medium'>
                    {subject.passMarks || 40}
                  </p>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-500'>
                    Pass Percentage:
                  </span>
                  <p className='text-gray-900 font-medium'>
                    {Math.round(
                      ((subject.passMarks || 40) / (subject.maxMarks || 100)) *
                        100,
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Classes */}
            <div className='bg-gray-50 rounded-xl p-5 border border-gray-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <GraduationCap size={20} className='mr-3 text-purple-500' />
                Assigned Classes
              </h3>
              {subject.assignedClasses && subject.assignedClasses.length > 0 ? (
                <div className='space-y-3'>
                  {subject.assignedClasses.map((assignment, index) => (
                    <div
                      key={index}
                      className='bg-white p-3 rounded-lg border border-gray-200'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-900'>
                            Grade {assignment.class.grade} - Section{' '}
                            {assignment.class.section}
                          </p>
                          {assignment.teacher && (
                            <p className='text-sm text-gray-600'>
                              Teacher: {assignment.teacher.user.fullName}
                            </p>
                          )}
                        </div>
                        <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  No classes assigned
                </p>
              )}
            </div>

            {/* Assigned Teachers */}
            <div className='bg-gray-50 rounded-xl p-5 border border-gray-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Users size={20} className='mr-3 text-orange-500' />
                Assigned Teachers
              </h3>
              {subject.teacherAssignments &&
              subject.teacherAssignments.length > 0 ? (
                <div className='space-y-3'>
                  {subject.teacherAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className='bg-white p-3 rounded-lg border border-gray-200'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-gray-900'>
                            {assignment.teacher.user.fullName}
                          </p>
                          {assignment.teacher.designation && (
                            <p className='text-sm text-gray-600'>
                              {assignment.teacher.designation}
                            </p>
                          )}
                        </div>
                        <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
                          Assigned
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  No teachers assigned
                </p>
              )}
            </div>
          </div>

          {/* Statistics Summary */}
          <div className='mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <TrendingUp size={20} className='mr-3 text-blue-500' />
              Summary Statistics
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>
                  {subject.assignedClasses?.length || 0}
                </p>
                <p className='text-sm text-gray-600'>Classes</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-green-600'>
                  {subject.teacherAssignments?.length || 0}
                </p>
                <p className='text-sm text-gray-600'>Teachers</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-purple-600'>
                  {subject.maxMarks || 100}
                </p>
                <p className='text-sm text-gray-600'>Max Marks</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-orange-600'>
                  {Math.round(
                    ((subject.passMarks || 40) / (subject.maxMarks || 100)) *
                      100,
                  )}
                  %
                </p>
                <p className='text-sm text-gray-600'>Pass Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailModal;
