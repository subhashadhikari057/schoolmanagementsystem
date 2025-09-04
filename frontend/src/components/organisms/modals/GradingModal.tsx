'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import {
  X,
  Save,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Award,
  FileText,
} from 'lucide-react';
import {
  type ClassGradingData,
  type SubjectGradingData,
  type ExamResult,
  gradingService,
} from '@/api/services/grading.service';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData?: ClassGradingData | null;
  subjectData?: SubjectGradingData | null;
  onStudentClick: (student: any, result?: ExamResult) => void;
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

export default function GradingModal({
  isOpen,
  onClose,
  classData,
  subjectData,
  onStudentClick,
  onSuccess,
}: GradingModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<
    Map<string, StudentGradeInput>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isClassView = !!classData;
  const currentData = classData || subjectData;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSubject(null);
      setGradeInputs(new Map());
      setSearchTerm('');
    }
  }, [isOpen]);

  // Initialize grade inputs when subject is selected (class view)
  useEffect(() => {
    if (isClassView && selectedSubject && classData) {
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
    }
  }, [selectedSubject, classData, isClassView]);

  // Initialize grade inputs for subject view
  useEffect(() => {
    if (!isClassView && subjectData) {
      const newInputs = new Map<string, StudentGradeInput>();

      subjectData.classes.forEach(cls => {
        cls.students.forEach(student => {
          const existingResult = student.result;
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
      });

      setGradeInputs(newInputs);
    }
  }, [subjectData, isClassView]);

  if (!isOpen || !currentData) return null;

  const handleInputChange = (
    studentId: string,
    field: keyof StudentGradeInput,
    value: any,
  ) => {
    const currentInput = gradeInputs.get(studentId) || {
      studentId,
      marksObtained: undefined,
      remarks: '',
      isAbsent: false,
    };

    const updatedInput = { ...currentInput, [field]: value };
    const newInputs = new Map(gradeInputs);
    newInputs.set(studentId, updatedInput);
    setGradeInputs(newInputs);
  };

  const handleBulkSave = async () => {
    if (!selectedSubject && isClassView) return;

    setIsSaving(true);
    try {
      const examSlotId = isClassView
        ? classData?.subjects.find(s => s.id === selectedSubject)?.examSlot?.id
        : subjectData?.classes[0]?.examSlot?.id;

      if (!examSlotId) {
        throw new Error('Exam slot not found');
      }

      const maxMarks = isClassView
        ? classData?.subjects.find(s => s.id === selectedSubject)?.maxMarks ||
          100
        : subjectData?.subject.maxMarks || 100;

      // Build create vs update payloads
      const inputs = Array.from(gradeInputs.values());
      const creates = inputs.filter(
        i =>
          !i.hasExistingResult && (i.marksObtained !== undefined || i.isAbsent),
      );
      const updates = inputs.filter(i => {
        if (!i.hasExistingResult) return false;
        const o = i.original || {
          marksObtained: undefined,
          isAbsent: false,
          remarks: '',
        };
        const changed =
          (i.marksObtained ?? undefined) !== (o.marksObtained ?? undefined) ||
          i.isAbsent !== o.isAbsent ||
          (i.remarks || '') !== (o.remarks || '');
        return changed;
      });

      // Validate marks and required modification reasons
      for (const c of creates) {
        if (
          !c.isAbsent &&
          (c.marksObtained === undefined ||
            c.marksObtained < 0 ||
            c.marksObtained > maxMarks)
        ) {
          throw new Error(
            'Please enter valid marks within range for all entries',
          );
        }
      }
      for (const u of updates) {
        if (
          !u.isAbsent &&
          (u.marksObtained === undefined ||
            u.marksObtained < 0 ||
            u.marksObtained > maxMarks)
        ) {
          throw new Error(
            'Please enter valid marks within range for all updates',
          );
        }
        if (!u.modificationReason || !u.modificationReason.trim()) {
          throw new Error('Modification reason is required for changed grades');
        }
      }

      // Execute creates first (bulk)
      if (creates.length > 0) {
        const createResponse = await gradingService.bulkGradeStudents({
          examSlotId,
          results: creates.map(i => ({
            studentId: i.studentId,
            marksObtained: i.isAbsent ? undefined : i.marksObtained,
            remarks: i.remarks,
            isAbsent: i.isAbsent,
          })),
        });
        if (!createResponse.success) {
          throw new Error('Failed to save some grades');
        }
      }

      // Execute updates (one by one to carry modification reason)
      if (updates.length > 0) {
        await Promise.all(
          updates.map(i =>
            gradingService.updateExamResult(i.existingResultId as string, {
              marksObtained: i.isAbsent ? undefined : i.marksObtained,
              remarks: i.remarks,
              isAbsent: i.isAbsent,
              modificationReason: i.modificationReason as string,
            }),
          ),
        );
      }

      const results = Array.from(gradeInputs.values())
        .filter(input => input.marksObtained !== undefined || input.isAbsent)
        .map(input => ({
          studentId: input.studentId,
          marksObtained: input.isAbsent ? undefined : input.marksObtained,
          remarks: input.remarks,
          isAbsent: input.isAbsent,
        }));

      if (creates.length === 0 && updates.length === 0) {
        alert('No grades to save');
        return;
      }
      onSuccess();
      alert(
        `Successfully saved grades for ${creates.length + updates.length} students`,
      );
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };

  const getStudentStatus = (student: any) => {
    const input = gradeInputs.get(student.id);
    const hasExistingResult = isClassView
      ? student.results.some(
          (r: ExamResult) => r.examSlot.subject?.id === selectedSubject,
        )
      : student.result;

    if (input?.isAbsent) return 'absent';
    if (input?.marksObtained !== undefined || hasExistingResult)
      return 'graded';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'absent':
        return <XCircle className='h-4 w-4 text-red-600' />;
      default:
        return <Clock className='h-4 w-4 text-gray-400' />;
    }
  };

  const filteredStudents = isClassView
    ? classData?.students.filter(
        student =>
          student.user.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || []
    : subjectData?.classes.flatMap(cls =>
        cls.students.filter(
          student =>
            student.user.fullName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      ) || [];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center space-x-4'>
            <div
              className={`p-3 rounded-lg ${isClassView ? 'bg-blue-100' : 'bg-green-100'}`}
            >
              {isClassView ? (
                <Users
                  className={`h-6 w-6 ${isClassView ? 'text-blue-600' : 'text-green-600'}`}
                />
              ) : (
                <BookOpen
                  className={`h-6 w-6 ${isClassView ? 'text-blue-600' : 'text-green-600'}`}
                />
              )}
            </div>
            <div>
              <SectionTitle
                text={
                  isClassView
                    ? `Grade ${classData?.class.grade} - ${classData?.class.section}`
                    : `${subjectData?.subject.name} (${subjectData?.subject.code})`
                }
                className='text-xl font-bold text-gray-900'
              />
              <Label className='text-gray-600'>
                {isClassView
                  ? `${classData?.examSchedule.name} • ${classData?.students.length} students`
                  : `${subjectData?.classes.length} classes • ${filteredStudents.length} students`}
              </Label>
            </div>
          </div>
          <Button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg'
          >
            <X className='h-5 w-5' />
          </Button>
        </div>

        {/* Content */}
        <div className='flex h-[calc(90vh-120px)]'>
          {/* Subject Selection (Class View) */}
          {isClassView && (
            <div className='w-80 border-r bg-gray-50 p-4 overflow-y-auto'>
              <Label className='text-sm font-medium text-gray-700 mb-3'>
                Select Subject
              </Label>
              <div className='space-y-2'>
                {classData?.subjects.map(subject => (
                  <Card
                    key={subject.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedSubject === subject.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-white'
                    }`}
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {subject.name}
                        </p>
                        <p className='text-xs text-gray-500'>{subject.code}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs text-gray-500'>
                          Max: {subject.maxMarks}
                        </p>
                        <p className='text-xs text-gray-500'>
                          Pass: {subject.passMarks}
                        </p>
                      </div>
                    </div>
                    {subject.examSlot && (
                      <div className='mt-2 text-xs text-gray-500 flex items-center space-x-1'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {new Date(
                            subject.examSlot.examDate,
                          ).toLocaleDateString()}
                        </span>
                        {subject.examSlot.startTime && (
                          <>
                            <Clock className='h-3 w-3 ml-2' />
                            <span>{subject.examSlot.startTime}</span>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Students Grading Area */}
          <div className='flex-1 flex flex-col'>
            {/* Search and Actions */}
            <div className='p-4 border-b bg-white'>
              <div className='flex items-center justify-between space-x-4'>
                <div className='relative flex-1 max-w-md'>
                  <Input
                    placeholder='Search students...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                  <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                    <Users className='h-4 w-4 text-gray-400' />
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  {(selectedSubject || !isClassView) && (
                    <Button
                      onClick={handleBulkSave}
                      disabled={isSaving}
                      className='bg-green-600 hover:bg-green-700 text-white'
                    >
                      <Save className='h-4 w-4 mr-2' />
                      {isSaving ? 'Saving...' : 'Save All Grades'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className='flex-1 overflow-y-auto p-4'>
              {!isClassView || selectedSubject ? (
                <div className='space-y-3'>
                  {filteredStudents.map(student => {
                    const input = gradeInputs.get(student.id);
                    const status = getStudentStatus(student);
                    const maxMarks = isClassView
                      ? classData?.subjects.find(s => s.id === selectedSubject)
                          ?.maxMarks || 100
                      : subjectData?.subject.maxMarks || 100;
                    const passMarks = isClassView
                      ? classData?.subjects.find(s => s.id === selectedSubject)
                          ?.passMarks || 40
                      : subjectData?.subject.passMarks || 40;

                    return (
                      <Card key={student.id} className='p-4'>
                        <div className='flex items-center space-x-4'>
                          {/* Student Info */}
                          <div className='flex items-center space-x-3 flex-1'>
                            <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                              <span className='text-sm font-medium text-gray-600'>
                                {student.rollNumber}
                              </span>
                            </div>
                            <div className='flex-1'>
                              <p className='font-medium text-gray-900'>
                                {student.user.fullName}
                              </p>
                              <p className='text-sm text-gray-500'>
                                Roll: {student.rollNumber}
                              </p>
                            </div>
                            {getStatusIcon(status)}
                          </div>

                          {/* Grade Input */}
                          <div className='flex items-center space-x-3'>
                            {/* Absent Checkbox */}
                            <label className='flex items-center space-x-2'>
                              <input
                                type='checkbox'
                                checked={input?.isAbsent || false}
                                onChange={e =>
                                  handleInputChange(
                                    student.id,
                                    'isAbsent',
                                    e.target.checked,
                                  )
                                }
                                className='rounded border-gray-300'
                              />
                              <span className='text-sm text-gray-600'>
                                Absent
                              </span>
                            </label>

                            {/* Marks Input */}
                            <div className='flex items-center space-x-2'>
                              <Input
                                type='number'
                                placeholder='Marks'
                                value={input?.marksObtained || ''}
                                onChange={e =>
                                  handleInputChange(
                                    student.id,
                                    'marksObtained',
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined,
                                  )
                                }
                                disabled={input?.isAbsent}
                                className='w-20 text-center'
                                min='0'
                                max={maxMarks}
                              />
                              <span className='text-sm text-gray-500'>
                                / {maxMarks}
                              </span>
                            </div>

                            {/* Remarks editor */}
                            <div className='w-56'>
                              <Input
                                placeholder='Remarks'
                                value={input?.remarks || ''}
                                onChange={e =>
                                  handleInputChange(
                                    student.id,
                                    'remarks',
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            {/* Grade Display */}
                            <div className='w-12 text-center'>
                              {input?.marksObtained && !input.isAbsent && (
                                <span
                                  className={`text-sm font-medium ${
                                    input.marksObtained >= passMarks
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {input.marksObtained >= passMarks
                                    ? 'Pass'
                                    : 'Fail'}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className='flex items-center space-x-1'>
                              <Button
                                onClick={() =>
                                  onStudentClick(
                                    student,
                                    isClassView
                                      ? (student as any).results?.find(
                                          (r: ExamResult) =>
                                            r.examSlot.subject?.id ===
                                            selectedSubject,
                                        )
                                      : (student as any).result,
                                  )
                                }
                                className='p-2 hover:bg-gray-100 rounded-lg'
                              >
                                <Eye className='h-4 w-4 text-blue-600' />
                              </Button>
                              <Button
                                onClick={() =>
                                  onStudentClick(
                                    student,
                                    isClassView
                                      ? (student as any).results?.find(
                                          (r: ExamResult) =>
                                            r.examSlot.subject?.id ===
                                            selectedSubject,
                                        )
                                      : (student as any).result,
                                  )
                                }
                                className='p-2 hover:bg-gray-100 rounded-lg'
                              >
                                <Edit className='h-4 w-4 text-green-600' />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Modification reason required if updating existing */}
                        {input?.hasExistingResult &&
                          input?.original &&
                          (() => {
                            const changed =
                              (input.marksObtained ?? undefined) !==
                                (input.original?.marksObtained ?? undefined) ||
                              input.isAbsent !==
                                (input.original?.isAbsent ?? false) ||
                              (input.remarks || '') !==
                                (input.original?.remarks || '');
                            if (!changed) return null;
                            return (
                              <div className='mt-3'>
                                <Label className='text-xs text-gray-500 mb-1'>
                                  Reason for change (required)
                                </Label>
                                <Input
                                  placeholder='Enter reason for modifying the grade'
                                  value={input.modificationReason || ''}
                                  onChange={e =>
                                    handleInputChange(
                                      student.id,
                                      'modificationReason',
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            );
                          })()}

                        {/* Remarks */}
                        {(input?.remarks ||
                          (isClassView
                            ? (student as any).results?.find(
                                (r: ExamResult) =>
                                  r.examSlot.subject?.id === selectedSubject,
                              )?.remarks
                            : (student as any).result?.remarks)) && (
                          <div className='mt-3 pt-3 border-t'>
                            <Label className='text-xs text-gray-500 mb-1'>
                              Remarks:
                            </Label>
                            <p className='text-sm text-gray-700'>
                              {input?.remarks ||
                                (isClassView
                                  ? (student as any).results?.find(
                                      (r: ExamResult) =>
                                        r.examSlot.subject?.id ===
                                        selectedSubject,
                                    )?.remarks
                                  : (student as any).result?.remarks)}
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <div className='text-center py-12'>
                      <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-600'>No students found</p>
                      {searchTerm && (
                        <p className='text-sm text-gray-500 mt-2'>
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-center'>
                    <BookOpen className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                    <p className='text-lg text-gray-600 mb-2'>
                      Select a Subject
                    </p>
                    <p className='text-sm text-gray-500'>
                      Choose a subject from the left panel to start grading
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t bg-gray-50'>
          <div className='flex items-center space-x-4'>
            {currentData && (
              <div className='flex items-center space-x-6 text-sm'>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span>
                    Graded:{' '}
                    {isClassView && selectedSubject
                      ? classData?.students.filter(s =>
                          s.results.some(
                            r =>
                              r.examSlot.subject?.id === selectedSubject &&
                              r.status !== 'DRAFT',
                          ),
                        ).length || 0
                      : !isClassView
                        ? subjectData?.classes.reduce(
                            (sum, cls) =>
                              sum +
                              cls.students.filter(
                                s => s.result && s.result.status !== 'DRAFT',
                              ).length,
                            0,
                          ) || 0
                        : 0}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4 text-yellow-600' />
                  <span>
                    Pending:{' '}
                    {isClassView && selectedSubject
                      ? classData?.students.filter(
                          s =>
                            !s.results.some(
                              r =>
                                r.examSlot.subject?.id === selectedSubject &&
                                r.status !== 'DRAFT',
                            ),
                        ).length || 0
                      : !isClassView
                        ? subjectData?.classes.reduce(
                            (sum, cls) =>
                              sum +
                              cls.students.filter(
                                s => !s.result || s.result.status === 'DRAFT',
                              ).length,
                            0,
                          ) || 0
                        : 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center space-x-3'>
            <Button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg'
            >
              Cancel
            </Button>
            {(selectedSubject || !isClassView) && (
              <Button
                onClick={handleBulkSave}
                disabled={isSaving}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
              >
                <Save className='h-4 w-4 mr-2' />
                {isSaving ? 'Saving...' : 'Save All Grades'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
