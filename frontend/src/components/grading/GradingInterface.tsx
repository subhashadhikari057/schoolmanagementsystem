'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import {
  Save,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Search,
} from 'lucide-react';
import {
  type ClassGradingData,
  gradingService,
} from '@/api/services/grading.service';
import { toast } from 'sonner';

interface GradingInterfaceProps {
  classData: ClassGradingData;
  selectedSubject: string;
  onSuccess: () => void;
}

interface StudentGradeInput {
  studentId: string;
  marksObtained?: number;
  remarks?: string;
  isAbsent: boolean;
  hasExistingResult?: boolean;
  existingResultId?: string;
  original?: {
    marksObtained?: number;
    remarks?: string;
    isAbsent: boolean;
  };
  modificationReason?: string;
}

export default function GradingInterface({
  classData,
  selectedSubject,
  onSuccess,
}: GradingInterfaceProps) {
  const [gradeInputs, setGradeInputs] = useState<
    Map<string, StudentGradeInput>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);

  const selectedSubjectData = classData.subjects.find(
    s => s.id === selectedSubject,
  );

  // Initialize grade inputs when component mounts or subject changes
  useEffect(() => {
    const newInputs = new Map<string, StudentGradeInput>();

    classData.students.forEach(student => {
      const existingResult = student.results.find(
        r => r.examSlot.subject?.id === selectedSubject,
      );

      newInputs.set(student.id, {
        studentId: student.id,
        marksObtained: existingResult?.marksObtained || undefined,
        remarks: existingResult?.remarks || '',
        isAbsent: existingResult?.isAbsent || false,
        hasExistingResult: !!existingResult,
        existingResultId: existingResult?.id,
        original: {
          marksObtained: existingResult?.marksObtained,
          remarks: existingResult?.remarks || '',
          isAbsent: existingResult?.isAbsent || false,
        },
      });
    });

    setGradeInputs(newInputs);
  }, [classData, selectedSubject]);

  if (!selectedSubjectData) {
    return (
      <Card className='p-8'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto h-12 w-12 text-red-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Subject Not Found
          </h3>
          <p className='text-gray-500'>
            The selected subject could not be found in the exam schedule.
          </p>
        </div>
      </Card>
    );
  }

  // Update grade input for a student
  const updateGradeInput = (
    studentId: string,
    updates: Partial<StudentGradeInput>,
  ) => {
    setGradeInputs(prev => {
      const newInputs = new Map(prev);
      const current = newInputs.get(studentId) || {
        studentId,
        marksObtained: undefined,
        remarks: '',
        isAbsent: false,
      };
      newInputs.set(studentId, { ...current, ...updates });
      return newInputs;
    });
  };

  // Save grades for all students
  const handleBulkSave = async () => {
    if (!selectedSubjectData.examSlot?.id) {
      toast.error('No exam slot found for this subject');
      return;
    }

    setIsSaving(true);
    try {
      const gradesToSave = Array.from(gradeInputs.values()).filter(input => {
        const hasData =
          input.marksObtained !== undefined || input.isAbsent || input.remarks;
        return hasData;
      });

      if (gradesToSave.length === 0) {
        toast.warning('No grades to save');
        return;
      }

      // Separate new grades from updates
      const newGrades = gradesToSave.filter(input => !input.hasExistingResult);
      const updatedGrades = gradesToSave.filter(
        input => input.hasExistingResult,
      );

      // Handle new grades with bulk save
      if (newGrades.length > 0) {
        const bulkGradeData = {
          examSlotId: selectedSubjectData.examSlot!.id,
          results: newGrades.map(input => ({
            studentId: input.studentId,
            marksObtained: input.marksObtained,
            remarks: input.remarks || '',
            isAbsent: input.isAbsent,
          })),
        };

        await gradingService.bulkGradeStudents(bulkGradeData);
      }

      // Handle updated grades individually (requires modification reason)
      const validationErrors: string[] = [];
      const validUpdates: typeof updatedGrades = [];

      for (const input of updatedGrades) {
        if (!input.existingResultId) continue;

        const hasChanged =
          input.marksObtained !== input.original?.marksObtained ||
          input.remarks !== input.original?.remarks ||
          input.isAbsent !== input.original?.isAbsent;

        if (hasChanged) {
          if (!input.modificationReason?.trim()) {
            const studentName =
              classData.students.find(s => s.id === input.studentId)?.user
                .fullName || 'student';
            validationErrors.push(
              `Modification reason required for ${studentName}`,
            );
          } else {
            validUpdates.push(input);
          }
        }
      }

      // Show all validation errors at once
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        setIsSaving(false);
        return;
      }

      // Process all valid updates
      for (const input of validUpdates) {
        await gradingService.updateExamResult(input.existingResultId!, {
          marksObtained: input.marksObtained,
          remarks: input.remarks || '',
          isAbsent: input.isAbsent,
          modificationReason: input.modificationReason!,
        });
      }

      toast.success(
        `Grades saved successfully for ${gradesToSave.length} students`,
      );
      onSuccess();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = classData.students.filter(student => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.user.fullName.toLowerCase().includes(searchLower) ||
      student.rollNumber?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate statistics
  const gradedCount = filteredStudents.filter(student =>
    student.results.some(r => r.examSlot.subject?.id === selectedSubject),
  ).length;
  const pendingCount = filteredStudents.length - gradedCount;

  return (
    <div className='space-y-6'>
      {/* Subject Header */}
      <Card className='p-6'>
        <div className='flex justify-between items-start'>
          <div>
            <h3 className='text-xl font-semibold text-gray-900'>
              {selectedSubjectData.name} ({selectedSubjectData.code})
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              Maximum Marks: {selectedSubjectData.maxMarks} • Passing Marks:{' '}
              {selectedSubjectData.passMarks}
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-center'>
              <div className='text-lg font-bold text-green-600'>
                {gradedCount}
              </div>
              <div className='text-xs text-gray-500'>Graded</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-orange-600'>
                {pendingCount}
              </div>
              <div className='text-xs text-gray-500'>Pending</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Actions */}
      <Card className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex-1 max-w-md'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search students...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              onClick={handleBulkSave}
              disabled={
                isSaving ||
                Array.from(gradeInputs.values()).every(
                  input =>
                    !input.marksObtained && !input.isAbsent && !input.remarks,
                )
              }
              className='flex items-center'
            >
              <Save className='w-4 h-4 mr-2' />
              {isSaving ? 'Saving...' : 'Save All Grades'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Student List */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-800 flex items-center'>
            <Users className='w-5 h-5 mr-2' />
            Student Grades
          </h3>
          <div className='text-sm text-gray-500'>
            {filteredStudents.length} students
          </div>
        </div>

        <div className='overflow-hidden rounded-lg border border-gray-200'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Student
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Roll Number
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Marks Obtained
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Remarks
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredStudents.map((student, index) => {
                const gradeInput = gradeInputs.get(student.id);

                const isEditing = editingStudent === student.id;
                const hasChanged =
                  gradeInput &&
                  (gradeInput.marksObtained !==
                    gradeInput.original?.marksObtained ||
                    gradeInput.remarks !== gradeInput.original?.remarks ||
                    gradeInput.isAbsent !== gradeInput.original?.isAbsent);

                return (
                  <tr
                    key={student.id}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${isEditing ? 'bg-blue-50' : ''}`}
                  >
                    {/* Student Name */}
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {student.user.fullName}
                          </div>
                          <div className='text-sm text-gray-500'>
                            ID: {student.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roll Number */}
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {student.rollNumber || '-'}
                    </td>

                    {/* Marks Obtained */}
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {isEditing ? (
                        <div className='space-y-2'>
                          <div className='flex items-center space-x-2'>
                            <Input
                              type='number'
                              min='0'
                              max={selectedSubjectData.maxMarks}
                              value={gradeInput?.marksObtained || ''}
                              onChange={e => {
                                const value = e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : undefined;
                                updateGradeInput(student.id, {
                                  marksObtained: value,
                                  isAbsent: false, // Clear absent if entering marks
                                });
                              }}
                              placeholder='0'
                              disabled={gradeInput?.isAbsent}
                              className='w-20'
                            />
                            <span className='text-xs text-gray-500'>
                              /{selectedSubjectData.maxMarks}
                            </span>
                          </div>
                          <label className='flex items-center text-sm'>
                            <input
                              type='checkbox'
                              checked={gradeInput?.isAbsent || false}
                              onChange={e => {
                                updateGradeInput(student.id, {
                                  isAbsent: e.target.checked,
                                  marksObtained: e.target.checked
                                    ? undefined
                                    : gradeInput?.marksObtained,
                                });
                              }}
                              className='mr-2'
                            />
                            <span className='text-gray-600'>Absent</span>
                          </label>
                        </div>
                      ) : (
                        <div className='text-sm'>
                          {gradeInput?.isAbsent ? (
                            <span className='text-red-600 font-medium'>
                              Absent
                            </span>
                          ) : gradeInput?.marksObtained !== undefined ? (
                            <span className='text-gray-900 font-medium'>
                              {gradeInput.marksObtained}/
                              {selectedSubjectData.maxMarks}
                            </span>
                          ) : (
                            <span className='text-gray-400'>Not graded</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {gradeInput?.isAbsent ? (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                          <XCircle className='w-3 h-3 mr-1' />
                          Absent
                        </span>
                      ) : gradeInput?.marksObtained !== undefined ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            gradeInput.marksObtained >=
                            selectedSubjectData.passMarks
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {gradeInput.marksObtained >=
                          selectedSubjectData.passMarks ? (
                            <CheckCircle className='w-3 h-3 mr-1' />
                          ) : (
                            <XCircle className='w-3 h-3 mr-1' />
                          )}
                          {gradeInput.marksObtained >=
                          selectedSubjectData.passMarks
                            ? 'Pass'
                            : 'Fail'}
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Remarks */}
                    <td className='px-6 py-4'>
                      {isEditing ? (
                        <div className='space-y-2'>
                          <Input
                            value={gradeInput?.remarks || ''}
                            onChange={e =>
                              updateGradeInput(student.id, {
                                remarks: e.target.value,
                              })
                            }
                            placeholder='Add remarks...'
                            className='w-full'
                          />
                          {gradeInput?.hasExistingResult && hasChanged && (
                            <Input
                              value={gradeInput?.modificationReason || ''}
                              onChange={e =>
                                updateGradeInput(student.id, {
                                  modificationReason: e.target.value,
                                })
                              }
                              placeholder='Reason for change (required)'
                              className='w-full text-xs'
                            />
                          )}
                        </div>
                      ) : (
                        <div className='text-sm text-gray-600'>
                          {gradeInput?.remarks || '-'}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      {isEditing ? (
                        <div className='flex items-center justify-end space-x-2'>
                          <Button
                            onClick={() => setEditingStudent(null)}
                            className='px-2 py-1 text-xs bg-gray-500 text-white hover:bg-gray-600'
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingStudent(null);
                              // Auto-save individual grade if needed
                            }}
                            className='px-2 py-1 text-xs'
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setEditingStudent(student.id)}
                          className='px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 flex items-center'
                        >
                          <Edit className='w-3 h-3 mr-1' />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className='text-center py-8'>
            <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Students Found
            </h3>
            <p className='text-gray-500'>
              {searchTerm
                ? 'No students match your search criteria'
                : 'No students in this class'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
