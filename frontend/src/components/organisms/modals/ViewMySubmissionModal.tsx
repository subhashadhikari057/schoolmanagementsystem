'use client';

import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  User,
  GraduationCap,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import { submissionService } from '@/api/services/submission.service';
import { studentService } from '@/api/services/student.service';
import { parentService } from '@/api/services/parent.service';
import { SubmissionResponse } from '@/api/types/assignment';
import { useAuth } from '@/hooks/useAuth';

interface ViewMySubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  childId?: string; // For parent usage - to view specific child's submission
}

export const ViewMySubmissionModal = ({
  isOpen,
  onClose,
  assignmentId,
  childId,
}: ViewMySubmissionModalProps) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Fetch student ID from user ID (only for students, not parents)
  useEffect(() => {
    const getStudentId = async () => {
      if (!user?.id || childId) return; // Skip if childId is provided (parent usage)
      try {
        const studentRes = await studentService.getStudentByUserId(user.id);
        setStudentId(studentRes.data?.id || null);
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    };
    getStudentId();
  }, [user, childId]);

  useEffect(() => {
    if (isOpen && assignmentId && (studentId || childId)) {
      fetchSubmissionHistory();
    }
  }, [isOpen, assignmentId, studentId, childId]);

  const fetchSubmissionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      // If childId is provided, this is a parent viewing their child's submission
      if (childId) {
        response = await parentService.getChildSubmission(
          childId,
          assignmentId,
        );

        // Convert single submission response to array format for consistency
        if (response.success && response.data) {
          setSubmissions([
            {
              id: response.data.submission.id,
              assignmentId: assignmentId,
              studentId: childId,
              submittedAt: response.data.submission.submittedAt,
              isCompleted: response.data.submission.isCompleted,
              feedback: response.data.submission.feedback,
              studentNotes: response.data.submission.studentNotes,
              attachments: response.data.submission.attachments,
              createdAt: response.data.submission.submittedAt, // Use submittedAt as createdAt
              fileLinks: [], // Not used in this context
              student: {
                id: childId,
                rollNumber: '',
                user: {
                  fullName: response.data.child.fullName,
                },
              }, // Student info from parent response
            },
          ]);
        } else {
          setError('Failed to load submission');
        }
      } else {
        // This is a student viewing their own submission
        if (!studentId) {
          setError('Student not found');
          setLoading(false);
          return;
        }

        response = await submissionService.getStudentSubmissionHistory(
          assignmentId,
          studentId,
        );

        if (response.success && response.data) {
          setSubmissions(response.data);
        } else {
          setError('Failed to load submission history');
        }
      }
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (submission: SubmissionResponse) => {
    if (submission.isCompleted) {
      return <CheckCircle className='w-4 h-4 text-green-600' />;
    }
    return <Clock className='w-4 h-4 text-yellow-600' />;
  };

  const getStatusText = (submission: SubmissionResponse) => {
    if (submission.isCompleted) {
      return 'Graded';
    }
    return 'Pending';
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-xl border-b border-gray-100 sticky top-0 z-10'>
          <button
            onClick={onClose}
            className='absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-4 w-4 text-gray-500' />
          </button>

          <h2 className='text-lg font-bold text-gray-800'>
            {childId ? "Child's Submission" : 'My Submission History'}
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            {childId
              ? "View your child's submission for this assignment"
              : 'View all your submissions for this assignment'}
          </p>
        </div>

        {/* Content */}
        <div className='p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-2 text-gray-600'>
                Loading submission history...
              </span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-8'>
              <AlertCircle className='w-6 h-6 text-red-500 mr-2' />
              <span className='text-red-600'>{error}</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className='text-center py-8'>
              <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No Submissions Yet
              </h3>
              <p className='text-gray-600'>
                You haven't submitted this assignment yet.
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                >
                  {/* Submission Header */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(submission)}
                        <span className='text-sm font-medium text-gray-700'>
                          Submitted
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {getStatusText(submission)}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <Calendar className='w-4 h-4' />
                      <span>{formatDate(submission.createdAt)}</span>
                    </div>
                  </div>

                  {/* Attachments */}
                  {submission.attachments &&
                    submission.attachments.length > 0 && (
                      <div className='mb-4'>
                        <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                          <FileText className='w-4 h-4' />
                          Attachments ({submission.attachments.length})
                        </h4>
                        <div className='space-y-2'>
                          {submission.attachments.map(
                            (attachment, fileIndex) => (
                              <div
                                key={attachment.id}
                                className='flex items-center justify-between bg-white rounded-md p-3 border'
                              >
                                <div className='flex items-center gap-3'>
                                  <FileText className='w-4 h-4 text-blue-600' />
                                  <div>
                                    <p className='text-sm font-medium text-gray-700'>
                                      {attachment.originalName ||
                                        attachment.filename}
                                    </p>
                                    <p className='text-xs text-gray-500'>
                                      {(attachment.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Button
                                    onClick={() =>
                                      window.open(attachment.url, '_blank')
                                    }
                                    className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                                  >
                                    <Eye className='w-4 h-4' />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleDownloadFile(
                                        attachment.url,
                                        attachment.originalName ||
                                          attachment.filename,
                                      )
                                    }
                                    className='p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors'
                                  >
                                    <Download className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Remarks Section - Inline Display */}
                  {(submission.studentNotes || submission.feedback) && (
                    <div className='mt-4 pt-4 border-t border-gray-200 space-y-3'>
                      {/* Student Notes */}
                      {submission.studentNotes && (
                        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                          <div className='flex items-center gap-2 mb-2'>
                            <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center'>
                              <User className='w-3 h-3 text-green-600' />
                            </div>
                            <span className='text-sm font-medium text-green-800'>
                              {childId ? "Your Child's Note" : 'Your Note'}
                            </span>
                          </div>
                          <p className='text-sm text-green-700 leading-relaxed whitespace-pre-wrap pl-7'>
                            {submission.studentNotes}
                          </p>
                        </div>
                      )}

                      {/* Teacher Feedback */}
                      {submission.feedback && (
                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                          <div className='flex items-center gap-2 mb-2'>
                            <div className='w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center'>
                              <GraduationCap className='w-3 h-3 text-blue-600' />
                            </div>
                            <span className='text-sm font-medium text-blue-800'>
                              Teacher Feedback
                            </span>
                          </div>
                          <p className='text-sm text-blue-700 leading-relaxed whitespace-pre-wrap pl-7'>
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-100'>
          <div className='flex justify-end'>
            <Button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
