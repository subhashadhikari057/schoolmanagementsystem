'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  MessageCircle,
  Plus,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import Link from 'next/link';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import { AssignmentResponse, SubmissionResponse } from '@/api/types/assignment';
import { toast } from 'sonner';
import { RemarksDropdown } from '@/components/organisms/modals/RemarksDropdown';

interface ProcessedSubmission {
  id: string;
  student: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'Submitted' | 'Missing';
  submittedOn: string;
  files: { name: string; url: string }[];
  grading: string;
  remarks: number;
  hasRemarks: boolean;
  feedback?: string; // Teacher's grading remarks
  studentNotes?: string; // Student's submission comments
}

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const assignmentId = params?.id as string;

  // State management
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grading state
  const [savingGrades, setSavingGrades] = useState<{ [key: string]: boolean }>(
    {},
  );

  // Remarks dropdown state
  const [remarksDropdownOpen, setRemarksDropdownOpen] = useState(false);
  const [selectedSubmissionForRemarks, setSelectedSubmissionForRemarks] =
    useState<ProcessedSubmission | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Data fetching functions
  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment details
      const assignmentResponse =
        await assignmentService.getAssignmentById(assignmentId);
      if (!assignmentResponse.success) {
        throw new Error(
          assignmentResponse.message || 'Failed to fetch assignment',
        );
      }

      // Fetch submissions for this assignment
      const submissionsResponse =
        await submissionService.getSubmissionsByAssignment(assignmentId);
      if (!submissionsResponse.success) {
        throw new Error(
          submissionsResponse.message || 'Failed to fetch submissions',
        );
      }

      setAssignment(assignmentResponse.data);
      setSubmissions(submissionsResponse.data || []);

      // Successfully loaded submissions with attachments
    } catch (err) {
      console.error('Error fetching assignment data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  // Inline grading handlers
  const handleGradingChange = async (
    submissionId: string,
    isComplete: boolean,
  ) => {
    setSavingGrades(prev => ({ ...prev, [submissionId]: true }));

    // Get student name for notification
    const submission = submissions.find(s => s.id === submissionId);
    const studentName = submission?.student.user.fullName || 'Student';

    try {
      await submissionService.gradeSubmission(submissionId, {
        isCompleted: isComplete,
        feedback: submissions.find(s => s.id === submissionId)?.feedback || '',
      });

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId ? { ...sub, isCompleted: isComplete } : sub,
        ),
      );

      // Show success notification
      if (isComplete) {
        toast.success(`Marked ${studentName}'s submission as Complete`, {
          description: 'The submission has been graded successfully.',
        });
      } else {
        toast.info(`Marked ${studentName}'s submission as Not Complete`, {
          description: 'The submission status has been updated.',
        });
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update grade', {
        description:
          'Please try again or contact support if the issue persists.',
      });
    } finally {
      setSavingGrades(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Handle remarks dropdown
  const openRemarksDropdown = (
    submission: ProcessedSubmission,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX + buttonRect.width / 2, // Center the dropdown
    });
    setSelectedSubmissionForRemarks(submission);
    setRemarksDropdownOpen(true);
  };

  const closeRemarksDropdown = () => {
    setRemarksDropdownOpen(false);
    setSelectedSubmissionForRemarks(null);
    setDropdownPosition(null);
  };

  // Handle remarks saving from modal
  const handleSaveRemarksFromModal = async (
    submissionId: string,
    feedback: string,
  ) => {
    try {
      setSavingGrades(prev => ({ ...prev, [submissionId]: true }));

      const currentSubmission = submissions.find(s => s.id === submissionId);
      await submissionService.gradeSubmission(submissionId, {
        feedback: feedback.trim() || undefined,
        isCompleted: currentSubmission?.isCompleted || false,
      });

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === submissionId
            ? { ...sub, feedback: feedback.trim() || undefined }
            : sub,
        ),
      );

      const studentName =
        selectedSubmissionForRemarks?.student.name || 'Student';

      if (feedback.trim()) {
        toast.success(`Feedback saved for ${studentName}`, {
          description: 'Your feedback has been saved successfully.',
        });
      } else {
        toast.info(`Feedback cleared for ${studentName}`, {
          description: 'The feedback has been removed.',
        });
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback', {
        description:
          'Please try again or contact support if the issue persists.',
      });
      throw error; // Re-throw so the modal can handle it
    } finally {
      setSavingGrades(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Helper function to process submissions for display
  const processSubmissions = (
    submissions: SubmissionResponse[],
  ): ProcessedSubmission[] => {
    return submissions.map(submission => {
      const studentNotesCount =
        submission.studentNotes && submission.studentNotes.trim() ? 1 : 0;
      const feedbackCount =
        submission.feedback && submission.feedback.trim() ? 1 : 0;
      const totalRemarks = studentNotesCount + feedbackCount;

      // Temporary debug for the specific issue
      if (submission.studentNotes || submission.feedback) {
        console.log('Submission with remarks:', {
          id: submission.id,
          studentNotes: submission.studentNotes,
          feedback: submission.feedback,
          studentNotesCount,
          feedbackCount,
          totalRemarks,
        });
      }

      return {
        id: submission.id,
        student: {
          name: submission.student.user.fullName,
          email: submission.student.user.email || '',
          avatar: undefined, // No avatar field in current structure
        },
        status: submission.submittedAt ? 'Submitted' : 'Missing',
        submittedOn: submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleDateString('en-GB')
          : 'N/A',
        files: (() => {
          // Primary: Use attachments (proper way with metadata)
          if (submission.attachments && submission.attachments.length > 0) {
            return submission.attachments.map(att => ({
              name: att.originalName || att.filename || 'File',
              url: att.url || '#',
            }));
          }

          // Fallback: Use fileLinks if attachments are empty
          if (
            submission.fileLinks &&
            Array.isArray(submission.fileLinks) &&
            submission.fileLinks.length > 0
          ) {
            return submission.fileLinks.map((link, index) => ({
              name: `File ${index + 1}`,
              url: link,
            }));
          }

          return [];
        })(),
        grading: submission.isCompleted ? 'Complete' : 'Not Complete',
        remarks: totalRemarks, // Count both student notes and teacher feedback
        hasRemarks: Boolean(
          (submission.feedback && submission.feedback.trim()) ||
            (submission.studentNotes && submission.studentNotes.trim()),
        ),
        feedback: submission.feedback,
        studentNotes: submission.studentNotes,
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'text-blue-600 bg-blue-50';
      case 'Missing':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'text-blue-600';
      case 'Missing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading assignment submissions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center max-w-md px-4'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Error Loading Data
          </h2>
          <p className='text-red-600 mb-4'>{error}</p>
          <Button
            onClick={fetchAssignmentData}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2'
          >
            <RefreshCw className='w-4 h-4' />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!assignment) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Assignment Not Found
          </h2>
          <p className='text-gray-600 mb-4'>
            The assignment you're looking for doesn't exist.
          </p>
          <Link href='/dashboard/teacher/academics/assignments'>
            <Button className='bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700'>
              Back to Assignments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const processedSubmissions = processSubmissions(submissions);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-500 to-blue-600 text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center gap-4 mb-4'>
            <Link href='/dashboard/teacher/academics/assignments'>
              <Button className='p-2 hover:bg-blue-400 rounded-lg transition-colors'>
                <ArrowLeft className='w-5 h-5' />
              </Button>
            </Link>
            <div>
              <h1 className='text-2xl font-bold'>{assignment.title}</h1>
              <div className='flex items-center gap-6 mt-2 text-blue-100'>
                <span>{assignment.subject.name}</span>
                <span>
                  Class: {assignment.class.grade}-{assignment.class.section}
                </span>
                {assignment.dueDate && (
                  <span>
                    Due:{' '}
                    {new Date(assignment.dueDate).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Overview Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-8'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Overview
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              {assignment.description ||
                'No description provided for this assignment.'}
            </p>
          </div>
        </div>

        {/* Records Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-6'>
              Records
            </h2>

            {/* Table Header */}
            <div className='grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 text-sm font-medium text-gray-600'>
              <div className='col-span-3'>Student Names:</div>
              <div className='col-span-2'>Status:</div>
              <div className='col-span-2'>Submitted on:</div>
              <div className='col-span-2'>Upload:</div>
              <div className='col-span-2'>Grading:</div>
              <div className='col-span-1'>Remarks</div>
            </div>

            {/* Table Rows */}
            <div className='space-y-4 mt-4'>
              {processedSubmissions.length === 0 ? (
                <div className='text-center py-12'>
                  <p className='text-gray-500'>
                    No submissions found for this assignment.
                  </p>
                </div>
              ) : (
                processedSubmissions.map(submission => (
                  <div
                    key={submission.id}
                    className='grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-100 last:border-b-0'
                  >
                    {/* Student Info */}
                    <div className='col-span-3 flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden'>
                        <img
                          src={submission.student.avatar}
                          alt={submission.student.name}
                          className='w-full h-full object-cover'
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML =
                              submission.student.name.charAt(0).toUpperCase();
                          }}
                        />
                      </div>
                      <div>
                        <div className='font-medium text-gray-900'>
                          {submission.student.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {submission.student.email}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className='col-span-2'>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}
                      >
                        {submission.status}!
                      </span>
                    </div>

                    {/* Submitted On */}
                    <div className='col-span-2'>
                      <span
                        className={
                          submission.status === 'Missing'
                            ? 'text-gray-400'
                            : getStatusTextColor(submission.status)
                        }
                      >
                        {submission.submittedOn}
                      </span>
                    </div>

                    {/* Upload */}
                    <div className='col-span-2'>
                      {submission.files.length > 0 ? (
                        <div className='space-y-1'>
                          {submission.files.map((file, index) => (
                            <div
                              key={index}
                              className='flex items-center gap-1'
                            >
                              <a
                                href={file.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer text-sm'
                                title={file.name} // Show full name on hover
                              >
                                <Download className='w-3 h-3' />
                                <span className='truncate max-w-[100px]'>
                                  {file.name.length > 15
                                    ? `${file.name.substring(0, 12)}...`
                                    : file.name}
                                </span>
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='flex items-center gap-1 text-gray-400'>
                          <span className='text-sm'>No files uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Grading */}
                    <div className='col-span-2'>
                      <select
                        value={
                          submission.grading === 'Complete'
                            ? 'complete'
                            : 'not-complete'
                        }
                        onChange={e =>
                          handleGradingChange(
                            submission.id,
                            e.target.value === 'complete',
                          )
                        }
                        className='w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                        disabled={savingGrades[submission.id]}
                      >
                        <option value='not-complete'>Not Complete</option>
                        <option value='complete'>Complete</option>
                      </select>
                    </div>

                    {/* Remarks */}
                    <div className='col-span-1'>
                      <button
                        onClick={e => openRemarksDropdown(submission, e)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          submission.studentNotes && !submission.feedback
                            ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200' // Student notes without teacher feedback
                            : submission.remarks > 0
                              ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' // Has remarks
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200' // No remarks
                        }`}
                        disabled={savingGrades[submission.id]}
                      >
                        <MessageCircle
                          className={`w-4 h-4 ${
                            submission.studentNotes && !submission.feedback
                              ? 'text-orange-600' // Student notes need attention
                              : submission.remarks > 0
                                ? 'text-blue-600' // Has remarks
                                : 'text-gray-500' // No remarks
                          }`}
                        />
                        <span
                          className={`${
                            submission.studentNotes && !submission.feedback
                              ? 'text-orange-700' // Student notes need attention
                              : submission.remarks > 0
                                ? 'text-blue-700' // Has remarks
                                : 'text-gray-700' // No remarks
                          }`}
                        >
                          {submission.remarks}
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Dropdown */}
      <RemarksDropdown
        isOpen={remarksDropdownOpen}
        onClose={closeRemarksDropdown}
        position={dropdownPosition}
        submission={
          selectedSubmissionForRemarks
            ? {
                id: selectedSubmissionForRemarks.id,
                student: {
                  name: selectedSubmissionForRemarks.student.name,
                  email: selectedSubmissionForRemarks.student.email,
                },
                studentNotes: selectedSubmissionForRemarks.studentNotes,
                feedback: selectedSubmissionForRemarks.feedback,
                submittedAt: submissions.find(
                  s => s.id === selectedSubmissionForRemarks.id,
                )?.submittedAt,
              }
            : null
        }
        onSave={handleSaveRemarksFromModal}
        isLoading={
          selectedSubmissionForRemarks
            ? savingGrades[selectedSubmissionForRemarks.id]
            : false
        }
        userRole='teacher'
      />
    </div>
  );
}
