'use client';

/**
 * =============================================================================
 * Attendance History Organism
 * =============================================================================
 * Displays attendance history with expandable records
 * =============================================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttendanceStatusBadge } from '@/components/atoms/display/AttendanceStatusBadge';
import { Student, AttendanceRecord } from '@/types/attendance';
import { formatDate, formatTime } from '@/utils';

export interface AttendanceHistoryProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  students,
  attendanceRecords,
}) => {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const toggleRecord = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  };

  const getAttendanceStats = (record: AttendanceRecord) => {
    const present = Object.values(record.attendance).filter(
      status => status === 'present',
    ).length;
    const absent = Object.values(record.attendance).filter(
      status => status === 'absent',
    ).length;
    return { present, absent, total: students.length };
  };

  if (attendanceRecords.length === 0) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <div className='text-4xl mb-4'>📅</div>
          <p className='text-gray-600'>No attendance records found.</p>
          <p className='text-sm text-gray-500 mt-2'>
            Start taking attendance to see history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {attendanceRecords
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map(record => {
                const stats = getAttendanceStats(record);
                const isExpanded = expandedRecord === record.id;

                return (
                  <div key={record.id} className='border rounded-lg'>
                    <div
                      className='p-4 cursor-pointer hover:bg-gray-50 transition-colors'
                      onClick={() => toggleRecord(record.id)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-4'>
                          <div>
                            <p className='font-medium'>
                              {formatDate(record.date, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Taken at {formatTime(record.takenAt)}
                            </p>
                          </div>

                          <div className='flex space-x-2'>
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              Present: {stats.present}
                            </span>
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                              Absent: {stats.absent}
                            </span>
                          </div>
                        </div>

                        <Button variant='ghost' size='sm'>
                          {isExpanded ? '▼' : '▶'}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='border-t p-4 bg-gray-50'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          {students.map(student => {
                            const status =
                              record.attendance[student.id] || 'absent';
                            const remark = record.remarks?.[student.id];

                            return (
                              <div
                                key={student.id}
                                className='flex items-center justify-between p-3 bg-white rounded border'
                              >
                                <div className='flex-1'>
                                  <p className='font-medium text-sm'>
                                    {student.name}
                                  </p>
                                  <p className='text-xs text-gray-600'>
                                    {student.rollNumber}
                                  </p>
                                  {remark && (
                                    <p className='text-xs text-gray-600 mt-1 italic'>
                                      "{remark}"
                                    </p>
                                  )}
                                </div>
                                <AttendanceStatusBadge
                                  status={status}
                                  size='sm'
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
