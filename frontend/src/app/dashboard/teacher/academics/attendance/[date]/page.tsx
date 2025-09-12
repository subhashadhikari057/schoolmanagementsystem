'use client';

import React, { useState, use } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  email: string;
  initials: string;
  isPresent?: boolean;
}

interface PageProps {
  params: Promise<{
    date: string;
  }>;
}

export default function AttendanceTrackingPage({ params }: PageProps) {
  const { date } = use(params);

  // Mock student data - in real app this would come from props or API
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: true,
    },
    {
      id: '2',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: false,
    },
    {
      id: '3',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: true,
    },
    {
      id: '4',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: true,
    },
    {
      id: '5',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: false,
    },
    {
      id: '6',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: true,
    },
    {
      id: '7',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: true,
    },
    {
      id: '8',
      name: 'Shobha Ghurtu',
      email: 'sobha@gmail.com',
      initials: 'SG',
      isPresent: false,
    },
  ];

  const [attendanceData, setAttendanceData] = useState<Student[]>(mockStudents);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if this is today's date
  const isToday = date === 'today' || date === 'Today';

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    if (!isToday) return; // Read-only for past dates

    setAttendanceData(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, isPresent } : student,
      ),
    );
    setHasChanges(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Simulate API call - in real app this would be an actual API request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would typically save to backend
      console.log('Saving attendance:', attendanceData);

      // Update local state to reflect saved data
      setHasChanges(false);
      setIsSaved(true);
      setSaveMessage('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSaveMessage('Error saving attendance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='w-full mx-auto p-4 sm:p-6 lg:p-8'>
        {/* Header */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <Link
                href='/dashboard/teacher/academics/attendance'
                className='flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors'
              >
                <ArrowLeft className='w-4 h-4' />
                <span>Back to Overview</span>
              </Link>
            </div>
            <div className='flex items-center gap-2 text-gray-600'>
              <Calendar className='w-5 h-5' />
              <span className='text-sm font-medium'>{getCurrentDate()}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <SectionTitle
            text={`Attendance tracking for ${date}`}
            level={1}
            className='text-2xl sm:text-3xl font-bold text-gray-900 mb-3'
          />
          <Label className='text-lg text-gray-600'>
            {isToday
              ? 'Are the Students below present today?'
              : 'Attendance records for this date'}
          </Label>
        </div>

        {/* Students Grid */}
        <div className='mb-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            {attendanceData.map(student => (
              <div
                key={student.id}
                className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'
              >
                <div className='flex items-start gap-4 mb-6'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xl shadow-sm'>
                    {student.initials}
                  </div>
                  <div className='flex-1'>
                    <div className='text-lg font-semibold text-gray-900 mb-1'>
                      {student.name}
                    </div>
                    <div className='text-sm text-gray-600'>{student.email}</div>
                  </div>
                </div>

                {isToday && !isSaved ? (
                  /* Today - Show Present/Absent buttons (only when not saved) */
                  <div className='flex gap-3'>
                    <Button
                      label='Present'
                      className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                        student.isPresent === true
                          ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-gray-200'
                      }`}
                      onClick={() => handleAttendanceChange(student.id, true)}
                    />
                    <Button
                      label='Absent'
                      className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                        student.isPresent === false
                          ? 'bg-red-600 text-white shadow-md hover:bg-red-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200'
                      }`}
                      onClick={() => handleAttendanceChange(student.id, false)}
                    />
                  </div>
                ) : (
                  /* Past dates - Show read-only status */
                  <div className='flex items-center gap-3'>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${
                        student.isPresent
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {student.isPresent ? 'Present' : 'Absent'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          {isToday && (
            <div className='text-center mb-6'>
              <Label className='text-base text-gray-600'>
                Please track every student to save
              </Label>
            </div>
          )}

          <div className='flex justify-center'>
            {isToday ? (
              <div className='space-y-4 w-full'>
                {saveMessage && (
                  <div
                    className={`text-center p-4 rounded-xl border ${
                      saveMessage.includes('Error')
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                {!isSaved ? (
                  <Button
                    label={isSaving ? 'Saving...' : 'Save Attendance'}
                    className='w-full bg-blue-600 text-white px-12 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200'
                    onClick={handleSave}
                    disabled={isSaving}
                  />
                ) : (
                  <div className='space-y-4 text-center'>
                    <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
                      <Label className='text-base text-green-700 font-medium'>
                        ✅ Attendance has been saved successfully!
                      </Label>
                    </div>
                    <Link href='/dashboard/teacher/academics/attendance'>
                      <Button
                        label='Back to Overview'
                        className='w-full bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200'
                      />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link href='/dashboard/teacher/academics/attendance'>
                <Button
                  label='Back to Overview'
                  className='bg-gray-600 text-white px-12 py-4 rounded-xl text-lg font-medium hover:bg-gray-700 shadow-md hover:shadow-lg transition-all duration-200'
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
