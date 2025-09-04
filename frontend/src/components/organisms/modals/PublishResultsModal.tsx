'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import Textarea from '@/components/atoms/form-controls/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gradingService } from '@/api/services/grading.service';
import { calendarService } from '@/api/services/calendar.service';
import { toast } from 'sonner';

interface ExamEntry {
  id: string;
  name: string;
  academicYear: string;
  class: {
    grade: number;
    section: string;
  };
}

interface PublishResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
}

const PublishResultsModal: React.FC<PublishResultsModalProps> = ({
  isOpen,
  onClose,
  onPublish,
}) => {
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [publishRemarks, setPublishRemarks] = useState('');
  const [action, setAction] = useState<'publish' | 'lock'>('publish');
  const [loading, setLoading] = useState(false);
  const [examStats, setExamStats] = useState<{
    totalStudents: number;
    gradedStudents: number;
    pendingStudents: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchExamEntries();
    }
  }, [isOpen]);

  const fetchExamEntries = async () => {
    try {
      setLoading(true);
      const response = await calendarService.getCalendarEntries({
        page: 1,
        limit: 100,
        type: 'EXAM' as any,
      });

      // Transform calendar entries to exam entries
      const entries =
        response.entries?.map((entry: any) => ({
          id: entry.id,
          name: entry.examDetails || 'Exam',
          academicYear: new Date(entry.startDate).getFullYear().toString(),
          class: {
            grade: 1, // You might need to get this from exam schedule
            section: 'A',
          },
        })) || [];

      setExamEntries(entries);
    } catch (error) {
      toast.error('Failed to load exam entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamStats = async (examId: string) => {
    try {
      // This would need to be implemented in the backend
      // For now, using mock data
      setExamStats({
        totalStudents: 30,
        gradedStudents: 25,
        pendingStudents: 5,
      });
    } catch (error) {
      toast.error('Failed to load exam statistics');
    }
  };

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
    if (examId) {
      fetchExamStats(examId);
    } else {
      setExamStats(null);
    }
  };

  const handlePublish = async () => {
    if (!selectedExamId) {
      toast.error('Please select an exam');
      return;
    }

    if (!publishRemarks.trim()) {
      toast.error('Please provide remarks for publishing');
      return;
    }

    try {
      setLoading(true);

      if (action === 'publish') {
        await gradingService.publishResults({
          calendarEntryId: selectedExamId,
          publishRemarks: publishRemarks,
        });
        toast.success('Results published successfully');
      } else {
        await gradingService.lockResults({
          calendarEntryId: selectedExamId,
          publishRemarks: publishRemarks,
        });
        toast.success('Results locked successfully');
      }

      onPublish();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Failed to ${action} results`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
            {action === 'publish' ? (
              <Send className='h-6 w-6' />
            ) : (
              <Lock className='h-6 w-6' />
            )}
            {action === 'publish' ? 'Publish' : 'Lock'} Exam Results
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {/* Action Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Action
            </label>
            <div className='flex space-x-4'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='publish'
                  checked={action === 'publish'}
                  onChange={e =>
                    setAction(e.target.value as 'publish' | 'lock')
                  }
                  className='mr-2'
                />
                <Send className='h-4 w-4 mr-1 text-blue-600' />
                Publish Results
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='lock'
                  checked={action === 'lock'}
                  onChange={e =>
                    setAction(e.target.value as 'publish' | 'lock')
                  }
                  className='mr-2'
                />
                <Lock className='h-4 w-4 mr-1 text-red-600' />
                Lock Results
              </label>
            </div>
            <p className='text-sm text-gray-500 mt-2'>
              {action === 'publish'
                ? 'Publishing will make results visible to students and parents'
                : 'Locking will prevent any further modifications to the results'}
            </p>
          </div>

          {/* Exam Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Exam
            </label>
            <Select value={selectedExamId} onValueChange={handleExamSelect}>
              <SelectTrigger>
                <SelectValue placeholder='Choose an exam to publish/lock' />
              </SelectTrigger>
              <SelectContent>
                {examEntries.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} - Grade {exam.class.grade}-{exam.class.section}{' '}
                    ({exam.academicYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Statistics */}
          {examStats && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-3'>
                Exam Statistics
              </h4>
              <div className='grid grid-cols-3 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {examStats.totalStudents}
                  </div>
                  <div className='text-sm text-gray-600'>Total Students</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {examStats.gradedStudents}
                  </div>
                  <div className='text-sm text-gray-600'>Graded</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {examStats.pendingStudents}
                  </div>
                  <div className='text-sm text-gray-600'>Pending</div>
                </div>
              </div>

              {examStats.pendingStudents > 0 && (
                <div className='mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5 text-orange-600' />
                  <p className='text-sm text-orange-800'>
                    {examStats.pendingStudents} students still need to be graded
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Remarks <span className='text-red-500'>*</span>
            </label>
            <Textarea
              value={publishRemarks}
              onChange={e => setPublishRemarks(e.target.value)}
              placeholder={`Enter remarks for ${action === 'publish' ? 'publishing' : 'locking'} these results...`}
              rows={4}
              required
            />
            <p className='text-sm text-gray-500 mt-1'>
              This will be recorded in the audit log for future reference
            </p>
          </div>

          {/* Warning */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3'>
            <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5' />
            <div>
              <h4 className='font-medium text-yellow-800'>
                {action === 'publish'
                  ? 'Publishing Results'
                  : 'Locking Results'}
              </h4>
              <p className='text-sm text-yellow-700 mt-1'>
                {action === 'publish'
                  ? 'Once published, results will be visible to students and parents. You can still modify grades after publishing.'
                  : 'Once locked, results cannot be modified by anyone. This action cannot be undone.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
          <Button
            onClick={onClose}
            className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || !selectedExamId || !publishRemarks.trim()}
            className={`flex items-center gap-2 ${
              action === 'lock' ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            {action === 'publish' ? (
              <Send className='h-4 w-4' />
            ) : (
              <Lock className='h-4 w-4' />
            )}
            {loading
              ? 'Processing...'
              : action === 'publish'
                ? 'Publish Results'
                : 'Lock Results'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublishResultsModal;
