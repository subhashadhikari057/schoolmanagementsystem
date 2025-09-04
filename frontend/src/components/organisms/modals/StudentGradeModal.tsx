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
  User,
  BookOpen,
  Calendar,
  Clock,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  History,
} from 'lucide-react';
import {
  type ExamResult,
  gradingService,
} from '@/api/services/grading.service';
import { useAuth } from '@/hooks/useAuth';

interface StudentGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
}

interface GradeForm {
  marksObtained?: number;
  remarks: string;
  isAbsent: boolean;
  modificationReason: string;
}

export default function StudentGradeModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentGradeModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<GradeForm>({
    marksObtained: undefined,
    remarks: '',
    isAbsent: false,
    modificationReason: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const result = student?.result as ExamResult | undefined;
  const isExistingResult = !!result?.id;
  const maxMarks = result?.examSlot?.subject?.maxMarks || 100;
  const passMarks = result?.examSlot?.subject?.passMarks || 40;

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setForm({
        marksObtained: result?.marksObtained || undefined,
        remarks: result?.remarks || '',
        isAbsent: result?.isAbsent || false,
        modificationReason: '',
      });
      setValidationErrors([]);
      setShowHistory(false);
    }
  }, [isOpen, student, result]);

  if (!isOpen || !student) return null;

  const handleInputChange = (field: keyof GradeForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!form.isAbsent && form.marksObtained === undefined) {
      errors.push('Marks are required unless student is marked absent');
    }

    if (form.marksObtained && form.marksObtained > maxMarks) {
      errors.push(`Marks cannot exceed ${maxMarks}`);
    }

    if (form.marksObtained && form.marksObtained < 0) {
      errors.push('Marks cannot be negative');
    }

    if (isExistingResult && !form.modificationReason.trim()) {
      errors.push(
        'Modification reason is required when updating existing grades',
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (isExistingResult) {
        // Update existing result
        const response = await gradingService.updateExamResult(result.id, {
          marksObtained: form.isAbsent ? undefined : form.marksObtained,
          remarks: form.remarks,
          isAbsent: form.isAbsent,
          modificationReason: form.modificationReason,
        });

        if (response.success) {
          onSuccess();
          alert('Grade updated successfully');
        }
      } else {
        // Create new result
        const examSlotId = result?.examSlotId || student.examSlotId;
        if (!examSlotId) {
          throw new Error('Exam slot ID not found');
        }

        const response = await gradingService.createExamResult({
          examSlotId,
          studentId: student.id,
          marksObtained: form.isAbsent ? undefined : form.marksObtained,
          remarks: form.remarks,
          isAbsent: form.isAbsent,
        });

        if (response.success) {
          onSuccess();
          alert('Grade saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (marks?: number) => {
    if (!marks) return 'text-gray-500';
    if (marks >= passMarks) return 'text-green-600';
    return 'text-red-600';
  };

  const calculatePercentage = (marks?: number) => {
    if (!marks) return 0;
    return Math.round((marks / maxMarks) * 100);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center space-x-4'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <User className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <SectionTitle
                text={student.user.fullName}
                className='text-xl font-bold text-gray-900'
              />
              <Label className='text-gray-600'>
                Roll: {student.rollNumber} •{' '}
                {result?.examSlot?.subject?.name || 'Subject'}
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
        <div className='overflow-y-auto max-h-[calc(90vh-200px)]'>
          <div className='p-6 space-y-6'>
            {/* Exam Info */}
            {result?.examSlot && (
              <Card className='p-4 bg-gray-50'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center space-x-2'>
                    <BookOpen className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>Subject:</span>
                    <span className='font-medium'>
                      {result.examSlot.subject?.name}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>Date:</span>
                    <span className='font-medium'>
                      {new Date(
                        result.examSlot.dateslot.examDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Award className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>Max Marks:</span>
                    <span className='font-medium'>{maxMarks}</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-600'>Pass Marks:</span>
                    <span className='font-medium'>{passMarks}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Current Grade Display */}
            {isExistingResult && (
              <Card className='p-4'>
                <Label className='text-sm font-medium text-gray-700 mb-3'>
                  Current Grade
                </Label>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-xs text-gray-500'>
                      Marks Obtained
                    </Label>
                    <p
                      className={`text-lg font-semibold ${getGradeColor(result?.marksObtained)}`}
                    >
                      {result?.isAbsent
                        ? 'Absent'
                        : result?.marksObtained || 'Not graded'}
                      {result?.marksObtained && ` / ${maxMarks}`}
                    </p>
                  </div>
                  <div>
                    <Label className='text-xs text-gray-500'>Percentage</Label>
                    <p
                      className={`text-lg font-semibold ${getGradeColor(result?.marksObtained)}`}
                    >
                      {result?.isAbsent
                        ? 'N/A'
                        : `${calculatePercentage(result?.marksObtained)}%`}
                    </p>
                  </div>
                  <div>
                    <Label className='text-xs text-gray-500'>Grade</Label>
                    <p className='text-lg font-semibold text-blue-600'>
                      {result?.grade?.grade || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className='text-xs text-gray-500'>Status</Label>
                    <div className='flex items-center space-x-1'>
                      {result?.isPassed ? (
                        <CheckCircle className='h-4 w-4 text-green-600' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-600' />
                      )}
                      <span
                        className={
                          result?.isPassed ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {result?.isAbsent
                          ? 'Absent'
                          : result?.isPassed
                            ? 'Pass'
                            : 'Fail'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Grade Form */}
            <Card className='p-4'>
              <Label className='text-sm font-medium text-gray-700 mb-4'>
                {isExistingResult ? 'Update Grade' : 'Enter Grade'}
              </Label>

              <div className='space-y-4'>
                {/* Absent Checkbox */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='isAbsent'
                    checked={form.isAbsent}
                    onChange={e =>
                      handleInputChange('isAbsent', e.target.checked)
                    }
                    className='rounded border-gray-300'
                  />
                  <label
                    htmlFor='isAbsent'
                    className='text-sm font-medium text-gray-700'
                  >
                    Mark as Absent
                  </label>
                </div>

                {/* Marks Input */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm text-gray-700 mb-2'>
                      Marks Obtained
                    </Label>
                    <Input
                      type='number'
                      placeholder='Enter marks'
                      value={form.marksObtained || ''}
                      onChange={e =>
                        handleInputChange(
                          'marksObtained',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                      disabled={form.isAbsent}
                      min='0'
                      max={maxMarks}
                      className='w-full'
                    />
                  </div>
                  <div>
                    <Label className='text-sm text-gray-700 mb-2'>Out of</Label>
                    <Input
                      type='number'
                      value={maxMarks}
                      disabled
                      className='w-full bg-gray-100'
                    />
                  </div>
                </div>

                {/* Percentage Display */}
                {form.marksObtained && !form.isAbsent && (
                  <div className='p-3 bg-blue-50 rounded-lg'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Percentage:</span>
                      <span
                        className={`font-semibold ${getGradeColor(form.marksObtained)}`}
                      >
                        {calculatePercentage(form.marksObtained)}%
                      </span>
                    </div>
                    <div className='flex items-center justify-between mt-1'>
                      <span className='text-sm text-gray-600'>Result:</span>
                      <span
                        className={`font-semibold ${getGradeColor(form.marksObtained)}`}
                      >
                        {form.marksObtained >= passMarks ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <Label className='text-sm text-gray-700 mb-2'>
                    Remarks (Optional)
                  </Label>
                  <textarea
                    placeholder='Add any remarks or feedback...'
                    value={form.remarks}
                    onChange={e => handleInputChange('remarks', e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm'
                  />
                </div>

                {/* Modification Reason (for updates) */}
                {isExistingResult && (
                  <div>
                    <Label className='text-sm text-gray-700 mb-2'>
                      Modification Reason{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      placeholder="Explain why you're changing the grade..."
                      value={form.modificationReason}
                      onChange={e =>
                        handleInputChange('modificationReason', e.target.value)
                      }
                      className='w-full'
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Card className='p-4 border-red-200 bg-red-50'>
                <div className='flex items-start space-x-2'>
                  <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-red-800'>
                      Please fix the following errors:
                    </p>
                    <ul className='mt-2 text-sm text-red-700 list-disc list-inside'>
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Modification History */}
            {isExistingResult && result?.modificationHistory && (
              <Card className='p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <Label className='text-sm font-medium text-gray-700'>
                    Modification History
                  </Label>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    className='text-xs text-blue-600 hover:text-blue-800'
                  >
                    <History className='h-3 w-3 mr-1' />
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                </div>

                {showHistory && (
                  <div className='space-y-3 max-h-40 overflow-y-auto'>
                    {(result.modificationHistory as any[])?.map(
                      (entry, index) => (
                        <div
                          key={index}
                          className='p-3 bg-gray-50 rounded-lg text-sm'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <span className='font-medium text-gray-900'>
                              {entry.modifiedBy}
                            </span>
                            <span className='text-gray-500'>
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className='text-gray-700 mb-2'>{entry.reason}</p>
                          {entry.changes && (
                            <div className='text-xs text-gray-600'>
                              {Object.entries(entry.changes).map(
                                ([field, change]: [string, any]) => (
                                  <div key={field}>
                                    {field}: {change.from} → {change.to}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Grading Information */}
            <Card className='p-4 bg-blue-50'>
              <Label className='text-sm font-medium text-blue-800 mb-2'>
                Grading Information
              </Label>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-blue-600'>Pass Marks:</span>
                  <span className='ml-2 font-medium'>{passMarks}</span>
                </div>
                <div>
                  <span className='text-blue-600'>Max Marks:</span>
                  <span className='ml-2 font-medium'>{maxMarks}</span>
                </div>
                <div>
                  <span className='text-blue-600'>Required %:</span>
                  <span className='ml-2 font-medium'>
                    {Math.round((passMarks / maxMarks) * 100)}%
                  </span>
                </div>
                <div>
                  <span className='text-blue-600'>Subject Code:</span>
                  <span className='ml-2 font-medium'>
                    {result?.examSlot?.subject?.code}
                  </span>
                </div>
              </div>
            </Card>

            {/* Existing Grade Info */}
            {isExistingResult && (
              <Card className='p-4 bg-yellow-50'>
                <Label className='text-sm font-medium text-yellow-800 mb-2'>
                  Current Grade Details
                </Label>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-yellow-700'>Graded By:</span>
                    <span className='ml-2 font-medium'>
                      {result?.gradedBy?.fullName || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className='text-yellow-700'>Graded At:</span>
                    <span className='ml-2 font-medium'>
                      {result?.gradedAt
                        ? new Date(result.gradedAt).toLocaleString()
                        : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className='text-yellow-700'>Status:</span>
                    <span className='ml-2 font-medium'>{result?.status}</span>
                  </div>
                  {result?.lastModifiedAt && (
                    <div>
                      <span className='text-yellow-700'>Last Modified:</span>
                      <span className='ml-2 font-medium'>
                        {new Date(result.lastModifiedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t bg-gray-50'>
          <div className='flex items-center space-x-4 text-sm text-gray-600'>
            {form.marksObtained && !form.isAbsent && (
              <div className='flex items-center space-x-2'>
                <Award className='h-4 w-4' />
                <span>
                  Preview: {form.marksObtained}/{maxMarks} (
                  {calculatePercentage(form.marksObtained)}%) -
                  <span
                    className={`ml-1 font-medium ${getGradeColor(form.marksObtained)}`}
                  >
                    {form.marksObtained >= passMarks ? 'Pass' : 'Fail'}
                  </span>
                </span>
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
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
            >
              <Save className='h-4 w-4 mr-2' />
              {isSaving
                ? 'Saving...'
                : isExistingResult
                  ? 'Update Grade'
                  : 'Save Grade'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
