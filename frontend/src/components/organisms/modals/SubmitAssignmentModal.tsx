'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import { submissionService } from '@/api/services/submission.service';
import { studentService } from '@/api/services/student.service';
import { assignmentService } from '@/api/services/assignment.service';
import { useAuth } from '@/hooks/useAuth';
import {
  AssignmentResponse,
  SubmissionResponse,
  SubmissionAttachment,
} from '@/api/types/assignment';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentResponse;
  onSubmissionSuccess: () => void;
}

interface SubmissionHistory {
  id: string;
  feedback?: string;
  attachments?: SubmissionAttachment[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSubmissionSuccess,
}: SubmitAssignmentModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<
    SubmissionHistory[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Get student ID on mount
  useEffect(() => {
    const getStudentId = async () => {
      if (!user?.id) return;
      try {
        const studentRes = await studentService.getStudentByUserId(user.id);
        setStudentId(studentRes.data?.id || null);
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    };
    getStudentId();
  }, [user]);

  // Load submission history
  useEffect(() => {
    const loadSubmissionHistory = async () => {
      if (!studentId || !assignment.id) return;

      setLoadingHistory(true);
      try {
        const response =
          await submissionService.getSubmissionsByStudent(studentId);
        const studentSubmissions =
          response.data?.filter(
            (submission: SubmissionResponse) =>
              submission.assignmentId === assignment.id,
          ) || [];

        const mappedSubmissions: SubmissionHistory[] = studentSubmissions.map(
          submission => ({
            id: submission.id,
            feedback: submission.feedback,
            attachments: submission.attachments,
            isCompleted: submission.isCompleted,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
          }),
        );

        setSubmissionHistory(mappedSubmissions);
      } catch (error) {
        console.error('Error loading submission history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (isOpen) {
      loadSubmissionHistory();
    }
  }, [isOpen, studentId, assignment.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Basic file validation
    for (const file of selectedFiles) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    setUploadError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FileText className='w-4 h-4 text-blue-600' />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className='w-4 h-4 text-red-600' />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className='w-4 h-4 text-blue-600' />;
    } else {
      return <FileText className='w-4 h-4 text-gray-600' />;
    }
  };

  const handleSubmit = async () => {
    if (!studentId || files.length === 0) {
      alert('Please upload at least one file to submit your assignment.');
      return;
    }

    setSubmitting(true);
    setUploadError(null);

    try {
      // Step 1: Create the submission
      const submissionResponse = await submissionService.submitAssignment(
        assignment.id,
        studentId,
        [],
        content || undefined, // Student notes
      );

      // Extract submission ID from response
      const responseData = submissionResponse.data as any;
      const submissionId = responseData?.id || responseData?.submission?.id;

      console.log('Submission created successfully with ID:', submissionId);
      console.log(
        'Files to upload:',
        files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      );

      if (!submissionId) {
        throw new Error('Failed to create submission - no ID returned');
      }

      // Step 2: Upload files using the working assignment service method
      console.log('Starting file upload to submission ID:', submissionId);
      try {
        const uploadResponse =
          await assignmentService.uploadSubmissionAttachments(
            submissionId,
            files,
          );

        console.log('File upload response:', uploadResponse);
        console.log('Upload response data:', uploadResponse.data);

        // Step 3: Update submission with file links
        // Backend returns attachments directly in data array, not nested under data.attachments
        if (
          uploadResponse.data &&
          Array.isArray(uploadResponse.data) &&
          uploadResponse.data.length > 0
        ) {
          console.log(
            'Files uploaded successfully, updating submission with file links',
          );
          const fileLinks = uploadResponse.data.map(file => file.url);
          console.log('File links:', fileLinks);

          await submissionService.updateStudentSubmission(
            assignment.id,
            studentId,
            fileLinks,
            content || undefined, // Student notes
          );
          console.log('Submission updated with file links successfully');
        } else {
          console.error('No attachments returned from upload response');
          console.error('Upload response data structure:', uploadResponse.data);
          throw new Error('File upload failed - no attachments returned');
        }
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        throw new Error(
          `File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
        );
      }

      onSubmissionSuccess();
      onClose();
      setContent('');
      setFiles([]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Failed to submit assignment. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-t-xl border-b border-gray-100 sticky top-0 z-10'>
          <button
            onClick={onClose}
            className='absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-4 w-4 text-gray-500' />
          </button>

          <h2 className='text-lg font-bold text-gray-800'>Submit Assignment</h2>
          <p className='text-sm text-gray-600 mt-1'>{assignment.title}</p>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Assignment Details */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>
              Assignment Details
            </h3>
            <div className='space-y-1 text-sm text-gray-600'>
              <p>
                <span className='font-medium'>Subject:</span>{' '}
                {assignment.subject.name}
              </p>
              <p>
                <span className='font-medium'>Class:</span> Grade{' '}
                {assignment.class.grade} - {assignment.class.section}
              </p>
              <p>
                <span className='font-medium'>Due Date:</span>{' '}
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleDateString()
                  : 'No due date'}
              </p>
            </div>
          </div>

          {/* Submission History */}
          {submissionHistory.length > 0 && (
            <div className='bg-blue-50 rounded-lg p-4'>
              <h3 className='text-sm font-medium text-blue-700 mb-3 flex items-center gap-2'>
                <Clock className='w-4 h-4' />
                Previous Submissions ({submissionHistory.length})
              </h3>
              <div className='space-y-3'>
                {submissionHistory.map((submission, index) => (
                  <div
                    key={submission.id}
                    className='bg-white rounded-md p-3 border border-blue-200'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs text-blue-600 font-medium'>
                        Submission #{submissionHistory.length - index}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {formatDate(submission.createdAt)}
                      </span>
                    </div>
                    {submission.feedback && (
                      <p className='text-sm text-gray-700 mb-2'>
                        {submission.feedback}
                      </p>
                    )}
                    {submission.attachments &&
                      submission.attachments.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {submission.attachments.map(attachment => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target='_blank'
                              rel='noreferrer'
                              className='inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded transition-colors'
                            >
                              <FileText className='w-3 h-3' />
                              {attachment.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Submission Form */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-gray-700'>
              {submissionHistory.length > 0
                ? 'Resubmit Assignment'
                : 'Submit Assignment'}
            </h3>

            {/* Content/Notes */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Notes (Optional)
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder='Add any notes or comments about your submission...'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none'
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Attachments <span className='text-red-500'>*</span>
              </label>

              {/* Upload Area */}
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors'>
                <Upload className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-gray-600 mb-2'>
                  Drag and drop files here, or click to select files
                </p>
                <p className='text-xs text-gray-500 mb-3'>
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP
                  (Max 10MB each)
                </p>
                <input
                  type='file'
                  multiple
                  onChange={handleFileChange}
                  className='hidden'
                  id='file-upload'
                  accept='.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp'
                />
                <label
                  htmlFor='file-upload'
                  className='inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 cursor-pointer transition-colors'
                >
                  Choose Files
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    Selected Files:
                  </h4>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between bg-gray-50 rounded-lg p-3'
                    >
                      <div className='flex items-center gap-3'>
                        {getFileIcon(file.name)}
                        <div>
                          <p className='text-sm font-medium text-gray-700'>
                            {file.name}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className='p-1 text-red-500 hover:bg-red-50 rounded transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <p className='text-sm text-red-600'>{uploadError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl'>
          <Button
            onClick={onClose}
            className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || files.length === 0}
            className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {submitting ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Upload className='w-4 h-4' />
                {submissionHistory.length > 0
                  ? 'Resubmit'
                  : 'Submit Assignment'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
