'use client';

/**
 * =============================================================================
 * Attendance Form Organism
 * =============================================================================
 * Main attendance marking form with student list and controls
 * =============================================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentAttendanceRow } from '@/components/molecules/forms/StudentAttendanceRow';
import { AttendanceEditModal } from '@/components/molecules/forms/AttendanceEditModal';
import { Student, AttendanceRecord } from '@/types/attendance';

export interface AttendanceFormProps {
  students: Student[];
  isLocked: boolean;
  todayRecord?: AttendanceRecord;
  onSaveAttendance: (attendance: {
    [studentId: string]: 'present' | 'absent';
  }) => void;
  onUpdateWithRemark: (
    studentId: string,
    status: 'present' | 'absent',
    remark: string,
  ) => Promise<void>;
  saving?: boolean;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({
  students,
  isLocked,
  todayRecord,
  onSaveAttendance,
  onUpdateWithRemark,
  saving = false,
}) => {
  const [attendance, setAttendance] = useState<{
    [studentId: string]: 'present' | 'absent';
  }>(() => {
    if (todayRecord) {
      return todayRecord.attendance;
    }
    // Default all students to present
    return students.reduce(
      (acc, student) => {
        acc[student.id] = 'present';
        return acc;
      },
      {} as { [studentId: string]: 'present' | 'absent' },
    );
  });

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleAttendanceChange = (
    studentId: string,
    status: 'present' | 'absent',
  ) => {
    if (!isLocked) {
      setAttendance(prev => ({
        ...prev,
        [studentId]: status,
      }));
    }
  };

  const handleSaveAttendance = () => {
    onSaveAttendance(attendance);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (
    status: 'present' | 'absent',
    remark: string,
  ) => {
    if (editingStudent) {
      try {
        await onUpdateWithRemark(editingStudent.id, status, remark);
        setAttendance(prev => ({
          ...prev,
          [editingStudent.id]: status,
        }));
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Failed to update attendance:', error);
      }
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className='space-y-4'>
      {showSuccessMessage && (
        <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
          <div className='flex items-center'>
            <span className='text-green-600 mr-2'>✓</span>
            <span className='text-green-800'>
              Attendance updated successfully!
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Daily Attendance</span>
            {!isLocked && (
              <Button onClick={handleSaveAttendance} className='ml-4' size='lg'>
                💾 Save Attendance
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {students.map(student => {
              const studentStatus = attendance[student.id] || 'present';
              const hasRemark = todayRecord?.remarks?.[student.id];
              const remark = todayRecord?.remarks?.[student.id];

              return (
                <StudentAttendanceRow
                  key={student.id}
                  student={student}
                  currentStatus={studentStatus}
                  isLocked={isLocked}
                  hasRemark={!!hasRemark}
                  remark={remark}
                  onStatusChange={status =>
                    handleAttendanceChange(student.id, status)
                  }
                  onEdit={
                    isLocked ? () => handleEditStudent(student) : undefined
                  }
                />
              );
            })}
          </div>

          {isLocked && (
            <div className='mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
              <div className='flex items-center justify-center space-x-2 text-amber-800'>
                <span>⚠️</span>
                <p className='text-sm font-medium'>
                  Today's attendance is locked. Use the Edit button to modify
                  individual records with remarks.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceEditModal
        isOpen={isEditModalOpen}
        student={editingStudent}
        currentStatus={
          editingStudent
            ? attendance[editingStudent.id] || 'present'
            : 'present'
        }
        currentRemark={
          editingStudent ? todayRecord?.remarks?.[editingStudent.id] : ''
        }
        onSave={handleSaveEdit}
        onClose={handleCloseEditModal}
        loading={saving}
      />
    </div>
  );
};
