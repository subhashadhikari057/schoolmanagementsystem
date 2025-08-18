'use client';

import React, { useState } from 'react';
import { Search, Users, Mail, Phone, User, MapPin } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Button from '@/components/atoms/form-controls/Button';

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
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
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

interface StudentsTabProps {
  classDetails: ClassDetails;
}

export default function StudentsTab({ classDetails }: StudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Use actual student data from the backend
  const students =
    classDetails.students?.map(student => ({
      id: student.id,
      name: student.user.fullName,
      email: student.user.email || 'No email',
      phone: student.user.phone || 'No phone',
      rollNumber: student.rollNumber,
      address: student.address,
      street: student.street,
      city: student.city,
      state: student.state,
      pinCode: student.pinCode,
      parents: student.parents || [],
      guardians: student.guardians || [],
      avatar: '/placeholder-avatar.jpg',
    })) || [];

  // Filter students based on search term
  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className='bg-white rounded-lg p-6'>
      {/* Header with Students Attendance indicator */}
      <div className='bg-blue-600 text-white rounded-lg p-4 flex items-center gap-3 mb-6'>
        <Users className='w-5 h-5' />
        <span className='font-medium'>Students Attendance</span>
      </div>

      {/* Students Section */}
      <div>
        <SectionTitle
          text='Students'
          level={3}
          className='text-lg font-semibold text-gray-900 mb-4'
        />

        {/* Search */}
        <div className='max-w-md mb-6'>
          <LabeledInputField
            type='search'
            placeholder='Search students...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className='text-gray-400 w-4 h-4' />}
          />
        </div>

        {/* Students Count */}
        <div className='mb-4 text-sm text-gray-600'>
          {students.length} student{students.length !== 1 ? 's' : ''} enrolled
        </div>

        {/* Students Grid */}
        {students.length > 0 ? (
          <div className='space-y-4'>
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className='border border-gray-200 rounded-lg hover:bg-gray-50'
              >
                {/* Student Basic Info */}
                <div className='flex items-center justify-between p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium'>
                      {student.rollNumber}
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>
                        {student.name}
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          {student.email !== 'No email' && (
                            <div className='flex items-center gap-1'>
                              <Mail className='w-3 h-3' />
                              {student.email}
                            </div>
                          )}
                          {student.phone !== 'No phone' && (
                            <div className='flex items-center gap-1'>
                              <Phone className='w-3 h-3' />
                              {student.phone}
                            </div>
                          )}
                        </div>
                        {(student.address ||
                          student.street ||
                          student.city ||
                          student.state) && (
                          <div className='flex items-start gap-1 text-sm text-gray-500'>
                            <MapPin className='w-3 h-3 mt-0.5 flex-shrink-0' />
                            <span>
                              {[
                                student.address,
                                student.street,
                                student.city,
                                student.state,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      label={
                        expandedStudent === student.id
                          ? 'Hide Details'
                          : 'View Details'
                      }
                      onClick={() => toggleStudentExpansion(student.id)}
                      className='text-blue-600 bg-transparent border border-blue-600 hover:bg-blue-50 px-3 py-1 text-sm rounded'
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStudent === student.id && (
                  <div className='border-t border-gray-200 p-4 bg-gray-50'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Parents Section */}
                      {student.parents.length > 0 && (
                        <div>
                          <h4 className='font-medium text-gray-900 mb-3 flex items-center gap-2'>
                            <User className='w-4 h-4' />
                            Parents
                          </h4>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {student.parents.map(parent => (
                              <div
                                key={parent.id}
                                className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-w-0'
                              >
                                <div className='flex items-start justify-between mb-3'>
                                  <div className='font-semibold text-gray-900 text-base truncate flex-1 mr-2'>
                                    {parent.parent.user.fullName}
                                  </div>
                                  {parent.isPrimary && (
                                    <span className='text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium flex-shrink-0'>
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <div className='text-sm text-gray-600 mb-3 capitalize'>
                                  {parent.relationship}
                                </div>
                                <div className='space-y-2'>
                                  <div className='flex items-center gap-2 text-sm text-gray-600 min-w-0'>
                                    <Mail className='w-4 h-4 text-gray-400 flex-shrink-0' />
                                    <span className='truncate'>
                                      {parent.parent.user.email}
                                    </span>
                                  </div>
                                  {parent.parent.user.phone && (
                                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                                      <Phone className='w-4 h-4 text-gray-400 flex-shrink-0' />
                                      <span className='truncate'>
                                        {parent.parent.user.phone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Guardians Section */}
                      {student.guardians.length > 0 && (
                        <div>
                          <h4 className='font-medium text-gray-900 mb-3 flex items-center gap-2'>
                            <User className='w-4 h-4' />
                            Guardians
                          </h4>
                          <div className='space-y-3'>
                            {student.guardians.map(guardian => (
                              <div
                                key={guardian.id}
                                className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                              >
                                <div className='font-semibold text-gray-900 text-base mb-2'>
                                  {guardian.fullName}
                                </div>
                                <div className='text-sm text-gray-600 mb-3 capitalize'>
                                  {guardian.relation}
                                </div>
                                <div className='space-y-2'>
                                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                                    <Mail className='w-4 h-4 text-gray-400 flex-shrink-0' />
                                    <span className='truncate'>
                                      {guardian.email}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                                    <Phone className='w-4 h-4 text-gray-400 flex-shrink-0' />
                                    <span className='truncate'>
                                      {guardian.phone}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            No students enrolled in this class yet.
          </div>
        )}

        {students.length > 0 && filteredStudents.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            No students found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
