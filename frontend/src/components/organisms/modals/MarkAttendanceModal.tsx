import React, { useState } from 'react';
import Input from '@/components/atoms/form-controls/Input';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Icon from '@/components/atoms/display/Icon';

interface Student {
  id: string;
  name: string;
  roll: string;
  studentId: string;
  initials: string;
  lastAttendance: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
}

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emily Johnson',
    roll: '101',
    studentId: '2024001',
    initials: 'EJ',
    lastAttendance: '2025-01-27',
    attendanceStatus: 'unmarked',
  },
  {
    id: '2',
    name: 'James Smith',
    roll: '102',
    studentId: '2024002',
    initials: 'JS',
    lastAttendance: '2025-01-27',
    attendanceStatus: 'unmarked',
  },
  {
    id: '3',
    name: 'Sarah Brown',
    roll: '103',
    studentId: '2024003',
    initials: 'SB',
    lastAttendance: '2025-01-26',
    attendanceStatus: 'unmarked',
  },
  {
    id: '4',
    name: 'Michael Davis',
    roll: '104',
    studentId: '2024004',
    initials: 'MD',
    lastAttendance: '2025-01-26',
    attendanceStatus: 'unmarked',
  },
  {
    id: '5',
    name: 'Emma Wilson',
    roll: '105',
    studentId: '2024005',
    initials: 'EW',
    lastAttendance: '2025-01-25',
    attendanceStatus: 'unmarked',
  },
];

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [selectedDate, setSelectedDate] = useState('2025-08-12');
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [selectedSession, setSelectedSession] = useState('Morning');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Calculate attendance statistics
  const totalStudents = students.length;
  const presentCount = students.filter(
    s => s.attendanceStatus === 'present',
  ).length;
  const absentCount = students.filter(
    s => s.attendanceStatus === 'absent',
  ).length;
  const lateCount = students.filter(s => s.attendanceStatus === 'late').length;
  const excusedCount = students.filter(
    s => s.attendanceStatus === 'excused',
  ).length;
  const unmarkedCount = students.filter(
    s => s.attendanceStatus === 'unmarked',
  ).length;
  const markedCount = totalStudents - unmarkedCount;

  // Filter students based on search term
  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll.includes(searchTerm) ||
      student.studentId.includes(searchTerm),
  );

  const markAttendance = (
    studentId: string,
    status: Student['attendanceStatus'],
  ) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, attendanceStatus: status }
          : student,
      ),
    );
  };

  const markAllPresent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'present' })),
    );
  };

  const markAllAbsent = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'absent' })),
    );
  };

  const resetAttendance = () => {
    setStudents(prev =>
      prev.map(student => ({ ...student, attendanceStatus: 'unmarked' })),
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative border border-gray-200 my-8 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <Icon className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-5 h-5 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </Icon>
            <SectionTitle
              text='Mark Attendance'
              className='text-xl font-semibold text-gray-900'
            />
          </div>
          <button
            className='text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors'
            onClick={onClose}
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        {/* Filters */}
        <div className='px-6 pt-4 pb-4'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Date
              </Label>
              <Input
                type='date'
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className='h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Class
              </Label>
              <Dropdown
                placeholder='Select Class'
                options={[
                  { value: 'Grade 9', label: 'Grade 9' },
                  { value: 'Grade 10', label: 'Grade 10' },
                  { value: 'Grade 11', label: 'Grade 11' },
                  { value: 'Grade 12', label: 'Grade 12' },
                ]}
                className='w-full h-10'
                selectedValue={selectedClass}
                onSelect={setSelectedClass}
                type='filter'
              />
            </div>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Section
              </Label>
              <Dropdown
                placeholder='Select Section'
                options={[
                  { value: 'Section A', label: 'Section A' },
                  { value: 'Section B', label: 'Section B' },
                  { value: 'Section C', label: 'Section C' },
                ]}
                className='w-full h-10'
                selectedValue={selectedSection}
                onSelect={setSelectedSection}
                type='filter'
              />
            </div>
            <div>
              <Label className='block text-sm font-medium text-gray-700 mb-2'>
                Session
              </Label>
              <Dropdown
                placeholder='Select Session'
                options={[
                  { value: 'Morning', label: 'Morning' },
                  { value: 'Afternoon', label: 'Afternoon' },
                  { value: 'Evening', label: 'Evening' },
                ]}
                className='w-full h-10'
                selectedValue={selectedSession}
                onSelect={setSelectedSession}
                type='filter'
              />
            </div>
          </div>
        </div>

        {/* Attendance Summary Cards */}
        <div className='px-6 pb-4'>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {absentCount}
              </div>
              <div className='text-sm text-red-700 font-medium'>Absent</div>
            </div>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {lateCount}
              </div>
              <div className='text-sm text-yellow-700 font-medium'>Late</div>
            </div>
            <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {excusedCount}
              </div>
              <div className='text-sm text-purple-700 font-medium'>Excused</div>
            </div>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {unmarkedCount}
              </div>
              <div className='text-sm text-gray-700 font-medium'>Unmarked</div>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {totalStudents}
              </div>
              <div className='text-sm text-blue-700 font-medium'>
                Total Students
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className='px-6 pb-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Icon className='h-5 w-5 text-gray-400'>
                  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </Icon>
              </div>
              <Input
                type='text'
                placeholder='Search students...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Filter'
                onClick={() => {}}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Mark All Present'
                onClick={markAllPresent}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Mark All Absent'
                onClick={markAllAbsent}
              />
              <Button
                className='px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
                label='Reset'
                onClick={resetAttendance}
              />
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className='px-6 pb-4'>
          <div className='bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto'>
            <div className='space-y-3'>
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className='bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700'>
                      {student.initials}
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>
                        {student.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        Roll: {student.roll} ID: {student.studentId}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='text-sm text-gray-500 mr-4'>
                      Last: {student.lastAttendance}
                    </div>
                    <div className='flex gap-1'>
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                          student.attendanceStatus === 'present'
                            ? 'bg-green-100 text-green-600 border-green-300'
                            : 'bg-white text-gray-400 border-gray-300 hover:bg-green-50'
                        }`}
                        title='Present'
                      >
                        <Icon className='w-4 h-4'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        </Icon>
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                          student.attendanceStatus === 'absent'
                            ? 'bg-red-100 text-red-600 border-red-300'
                            : 'bg-white text-gray-400 border-gray-300 hover:bg-red-50'
                        }`}
                        title='Absent'
                      >
                        <Icon className='w-4 h-4'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        </Icon>
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'late')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                          student.attendanceStatus === 'late'
                            ? 'bg-yellow-100 text-yellow-600 border-yellow-300'
                            : 'bg-white text-gray-400 border-gray-300 hover:bg-yellow-50'
                        }`}
                        title='Late'
                      >
                        <Icon className='w-4 h-4'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <circle cx='12' cy='12' r='10' />
                            <polyline points='12,6 12,12 16,14' />
                          </svg>
                        </Icon>
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'excused')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors ${
                          student.attendanceStatus === 'excused'
                            ? 'bg-purple-100 text-purple-600 border-purple-300'
                            : 'bg-white text-gray-400 border-gray-300 hover:bg-purple-50'
                        }`}
                        title='Excused'
                      >
                        <Icon className='w-4 h-4'>
                          <svg
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                            />
                          </svg>
                        </Icon>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress and Footer */}
        <div className='px-6 pb-6'>
          <div className='flex items-center justify-between mb-4'>
            <Label className='text-sm text-gray-600'>
              {markedCount}/{totalStudents} marked
            </Label>
            <div className='w-32 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${(markedCount / totalStudents) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className='flex justify-end gap-3'>
            <Button
              onClick={onClose}
              className='px-6 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium'
              label='Cancel'
            />
            <Button
              className='px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors'
              label={`Save Attendance (${unmarkedCount} remaining)`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendanceModal;
