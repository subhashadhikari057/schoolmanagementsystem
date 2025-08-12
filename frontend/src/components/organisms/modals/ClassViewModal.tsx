'use client';

import React, { useEffect } from 'react';
import { X, School, Users, Building, User } from 'lucide-react';

interface ClassViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name?: string;
    grade: number;
    section: string;
    capacity: number;
    roomId: string;
    classTeacherId?: string;
    shift?: 'morning' | 'day';
    room?: {
      roomNo: string;
      name?: string;
      floor: number;
      building?: string;
    };
    classTeacher?: {
      id: string;
      fullName: string;
      email: string;
      employeeId?: string;
    };
    studentCount?: number;
    status: 'Active' | 'Inactive';
  } | null;
}

const ClassViewModal: React.FC<ClassViewModalProps> = ({
  isOpen,
  onClose,
  classData,
}) => {
  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !classData) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl' />
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl' />
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                <School size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {classData.name ||
                    `Grade ${classData.grade} Section ${classData.section}`}
                </h2>
                <p className='text-sm text-gray-600 mt-1'>Class Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='space-y-6'>
            {/* Class Information */}
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-100'>
              <h3 className='text-md font-semibold text-blue-800 flex items-center mb-3'>
                <School size={18} className='mr-2' />
                Class Information
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Grade</p>
                  <p className='font-medium'>{classData.grade}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Section</p>
                  <p className='font-medium'>{classData.section}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Shift</p>
                  <p className='font-medium'>
                    {classData.shift
                      ? classData.shift.charAt(0).toUpperCase() +
                        classData.shift.slice(1)
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Capacity</p>
                  <p className='font-medium'>{classData.capacity}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Students</p>
                  <p className='font-medium'>{classData.studentCount || 0}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      classData.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {classData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-100'>
              <h3 className='text-md font-semibold text-yellow-800 flex items-center mb-3'>
                <Building size={18} className='mr-2' />
                Room Information
              </h3>
              {classData.room ? (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Room Number</p>
                    <p className='font-medium'>{classData.room.roomNo}</p>
                  </div>
                  {classData.room.name && (
                    <div>
                      <p className='text-sm text-gray-500'>Room Name</p>
                      <p className='font-medium'>{classData.room.name}</p>
                    </div>
                  )}
                  <div>
                    <p className='text-sm text-gray-500'>Floor</p>
                    <p className='font-medium'>{classData.room.floor}</p>
                  </div>
                  {classData.room.building && (
                    <div>
                      <p className='text-sm text-gray-500'>Building</p>
                      <p className='font-medium'>{classData.room.building}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-gray-500'>No room assigned</p>
              )}
            </div>

            {/* Class Teacher */}
            <div className='bg-green-50 p-4 rounded-lg border border-green-100'>
              <h3 className='text-md font-semibold text-green-800 flex items-center mb-3'>
                <User size={18} className='mr-2' />
                Class Teacher
              </h3>
              {classData.classTeacher ? (
                <div className='flex items-start space-x-4'>
                  <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center'>
                    <User size={24} className='text-green-600' />
                  </div>
                  <div>
                    <p className='font-medium'>
                      {classData.classTeacher.fullName}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {classData.classTeacher.email}
                    </p>
                    {classData.classTeacher.employeeId && (
                      <p className='text-sm text-gray-500'>
                        Employee ID: {classData.classTeacher.employeeId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className='text-gray-500'>No class teacher assigned</p>
              )}
            </div>

            {/* Students Summary */}
            <div className='bg-purple-50 p-4 rounded-lg border border-purple-100'>
              <h3 className='text-md font-semibold text-purple-800 flex items-center mb-3'>
                <Users size={18} className='mr-2' />
                Students Summary
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Total Students</p>
                  <p className='font-medium'>{classData.studentCount || 0}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Available Seats</p>
                  <p className='font-medium'>
                    {classData.capacity - (classData.studentCount || 0)}
                  </p>
                </div>
                <div className='col-span-2'>
                  <p className='text-sm text-gray-500 mb-1'>Occupancy</p>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-purple-600 h-2 rounded-full'
                      style={{
                        width: `${Math.min(
                          ((classData.studentCount || 0) / classData.capacity) *
                            100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-gray-500 mt-1 text-right'>
                    {Math.round(
                      ((classData.studentCount || 0) / classData.capacity) *
                        100,
                    )}
                    % Full
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-6 flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassViewModal;
