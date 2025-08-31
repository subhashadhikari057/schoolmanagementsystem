'use client';

import React, { useState, useEffect } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  Eye,
  Send,
  CheckCircle,
  Ban,
  RefreshCw,
  User,
  Upload,
  Calendar,
  UserPlus,
  X,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { complaintService } from '@/api/services/complaint.service';
import { teacherService } from '@/api/services/teacher.service';
import type {
  Complaint,
  ComplaintResponse,
} from '@/api/services/complaint.service';
import { toast } from 'sonner';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import LeaveRequestDetailModal from '@/components/organisms/modals/LeaveRequestDetailModal';

// Teacher Complaint Response Modal
interface ComplaintResponseModalProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  onSubmit: (complaintId: string, content: string) => Promise<void>;
}

const ComplaintResponseModal: React.FC<ComplaintResponseModalProps> = ({
  open,
  onClose,
  complaint,
  onSubmit,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(complaint.id, content.trim());
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      onClose();
    }
  };

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>
                Respond to Complaint
              </h2>
              <p className='text-sm text-gray-600 mt-1'>{complaint?.title}</p>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Response Content */}
            <div>
              <label className='block mb-2 font-medium'>
                Response <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows={6}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder='Type your response here...'
                required
              />
            </div>

            {/* Submit buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                onClick={handleClose}
                className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-medium'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2'
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className='h-4 w-4' />
                    <span>Submit Response</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

// Create Complaint Modal for Teachers
interface CreateComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (complaintData: any, attachments: File[]) => Promise<void>;
}

const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ADMINISTRATIVE',
    priority: 'MEDIUM',
    recipientType: 'ADMINISTRATION',
    recipientId: '',
    studentId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { user } = useAuth();

  const complaintTypes = [
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'BEHAVIORAL', label: 'Behavioral' },
    { value: 'FACILITY', label: 'Facility' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'ADMINISTRATIVE', label: 'Administrative' },
    { value: 'OTHER', label: 'Other' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const recipientTypes = [
    { value: 'ADMINISTRATION', label: 'Administration/Office' },
    { value: 'PARENT', label: 'Parent' },
  ];

  // Load students when modal opens
  useEffect(() => {
    if (open && user?.id) {
      loadStudentsForClassTeacher();
    }
  }, [open, user?.id]);

  const loadStudentsForClassTeacher = async () => {
    if (!user?.id) return;

    setLoadingStudents(true);
    try {
      // Get the current teacher record to get the teacher ID
      const teacherResponse = await teacherService.getCurrentTeacher();
      if (teacherResponse.success && teacherResponse.data) {
        const teacherId = teacherResponse.data.id;

        // Get students for this teacher where they are the class teacher
        const studentsResponse =
          await teacherService.getStudentsForClassTeacher(teacherId);
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        } else {
          console.error('Failed to load students:', studentsResponse);
          toast.error('Failed to load students');
        }
      } else {
        console.error('Failed to get teacher info:', teacherResponse);
        toast.error('Failed to get teacher information');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.recipientType === 'PARENT' && !formData.studentId) {
      newErrors.studentId =
        'Please select a student when complaining to a parent';
    }

    if (
      formData.recipientType === 'PARENT' &&
      formData.studentId &&
      selectedStudent
    ) {
      if (!selectedStudent.parents || selectedStudent.parents.length === 0) {
        newErrors.studentId =
          'Selected student has no parents linked. Cannot create complaint to parent.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean the data before submitting - convert empty strings to undefined
      const cleanData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        recipientType: formData.recipientType,
        recipientId:
          formData.recipientType === 'PARENT' &&
          selectedStudent?.parents?.[0]?.parent?.user?.id
            ? selectedStudent.parents[0].parent.user.id
            : undefined,
      };

      await onSubmit(cleanData, attachments);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'ADMINISTRATIVE',
        priority: 'MEDIUM',
        recipientType: 'ADMINISTRATION',
        recipientId: '',
        studentId: '',
      });
      setAttachments([]);
      setSelectedStudent(null);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating complaint:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file: File) => {
      const validation = complaintService.validateFile(file);
      if (!validation.isValid) {
        toast.error(`File "${file.name}": ${validation.error}`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        type: 'ADMINISTRATIVE',
        priority: 'MEDIUM',
        recipientType: 'ADMINISTRATION',
        recipientId: '',
        studentId: '',
      });
      setAttachments([]);
      setSelectedStudent(null);
      setErrors({});
      onClose();
    }
  };

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-orange-50 to-red-100 p-6 border-b border-orange-200'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>
                Create New Complaint
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                Report administrative issues or parent/student concerns
              </p>
              <p className='text-xs text-orange-700 mt-2 bg-orange-200 px-2 py-1 rounded'>
                <strong>Note:</strong> When complaining to parents, you can only
                select students from your class where you are the class teacher.
                This ensures proper communication channels and accountability.
              </p>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Title */}
            <div>
              <label className='block mb-2 font-medium'>
                Complaint Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder='Enter complaint title...'
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className='block mb-2 font-medium'>
                Description <span className='text-red-500'>*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={4}
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Describe the issue in detail...'
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Complaint Type */}
            <div>
              <label className='block mb-2 font-medium'>Complaint Type</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({ ...prev, type: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {complaintTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className='block mb-2 font-medium'>Priority</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.priority}
                onChange={e =>
                  setFormData(prev => ({ ...prev, priority: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Type */}
            <div>
              <label className='block mb-2 font-medium'>Recipient</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.recipientType}
                onChange={e => {
                  const newRecipientType = e.target.value;
                  // If trying to select parent but no students available, switch to administration
                  if (newRecipientType === 'PARENT' && students.length === 0) {
                    toast.error(
                      'Cannot select parent recipient - no students available in your class',
                    );
                    return;
                  }
                  setFormData(prev => ({
                    ...prev,
                    recipientType: newRecipientType,
                  }));
                }}
                disabled={isSubmitting}
              >
                {recipientTypes.map(recipient => (
                  <option
                    key={recipient.value}
                    value={recipient.value}
                    disabled={
                      recipient.value === 'PARENT' && students.length === 0
                    }
                  >
                    {recipient.value === 'PARENT' && students.length === 0
                      ? `${recipient.label} (No students available)`
                      : recipient.label}
                  </option>
                ))}
              </select>
              {formData.recipientType === 'PARENT' && (
                <p className='text-xs text-blue-600 mt-1'>
                  <strong>Note:</strong> You can only complain to parents of
                  students in your class where you are the class teacher. This
                  restriction ensures proper communication channels and
                  accountability.
                </p>
              )}
            </div>

            {/* Parent Selection - Only show when parent is selected */}
            {formData.recipientType === 'PARENT' && (
              <div>
                <div className='mb-2'>
                  <label className='block font-medium'>
                    Select Student <span className='text-red-500'>*</span>
                  </label>
                  <p className='text-xs text-gray-600 mt-1'>
                    You can only complain to parents of students in your class
                    where you are the class teacher. This ensures proper
                    communication channels and accountability.
                  </p>
                </div>
                <select
                  className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                    errors.studentId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  value={formData.studentId}
                  onChange={e => {
                    const studentId = e.target.value;
                    setFormData(prev => ({ ...prev, studentId }));
                    // Find the selected student to get parent info
                    const student = students.find(s => s.id === studentId);
                    setSelectedStudent(student);
                  }}
                  disabled={isSubmitting || loadingStudents}
                >
                  <option value=''>Select a student...</option>
                  {loadingStudents ? (
                    <option value='' disabled>
                      Loading students...
                    </option>
                  ) : students.length === 0 ? (
                    <option value='' disabled>
                      No students found in your class where you are the class
                      teacher
                    </option>
                  ) : (
                    students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.user.fullName} - {student.className} (Roll:{' '}
                        {student.rollNumber})
                      </option>
                    ))
                  )}
                </select>
                {errors.studentId && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.studentId}
                  </p>
                )}
                {students.length === 0 && !loadingStudents && (
                  <p className='text-sm text-orange-600 mt-2'>
                    <strong>Note:</strong> You don't have any students assigned
                    to your class where you are the class teacher. You can only
                    create complaints to administration or contact an
                    administrator to assign you as a class teacher.
                  </p>
                )}
                {selectedStudent && (
                  <div className='text-sm text-gray-600 mt-1'>
                    <p>
                      <strong>Student:</strong> {selectedStudent.user.fullName}
                    </p>
                    <p>
                      <strong>Class:</strong> {selectedStudent.className}
                    </p>
                    <p>
                      <strong>Roll Number:</strong> {selectedStudent.rollNumber}
                    </p>
                    {selectedStudent.parents &&
                    selectedStudent.parents.length > 0 ? (
                      <div className='mt-2'>
                        <p>
                          <strong>Parents:</strong>
                        </p>
                        {selectedStudent.parents.map(
                          (parentLink: any, index: number) => (
                            <div key={index} className='ml-2 text-xs'>
                              • {parentLink.parent.user.fullName} (
                              {parentLink.parent.user.email})
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className='text-orange-600'>
                        No parents linked to this student
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* File Attachments */}
            <div>
              <label className='block mb-2 font-medium'>
                Attachments (Optional)
              </label>
              <div className='space-y-3'>
                {/* File Upload */}
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400'>
                  <input
                    type='file'
                    multiple
                    onChange={handleFileChange}
                    className='hidden'
                    id='file-upload'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'
                  />
                  <label htmlFor='file-upload' className='cursor-pointer'>
                    <div className='flex flex-col items-center'>
                      <Upload className='h-8 w-8 text-gray-400 mb-2' />
                      <p className='text-sm text-gray-600'>
                        <span className='text-blue-600 font-medium'>
                          Click to upload files
                        </span>{' '}
                        (Max 5 files, 10MB each)
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Supported: Images, PDF, DOC, DOCX
                      </p>
                    </div>
                  </label>
                </div>

                {/* File List */}
                {attachments.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-gray-700'>
                      Selected Files:
                    </p>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between bg-gray-50 p-3 rounded-lg'
                      >
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-gray-500' />
                          <span className='text-sm text-gray-700'>
                            {file.name}
                          </span>
                          <span className='text-xs text-gray-500'>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeAttachment(index)}
                          className='text-red-500 hover:text-red-700 p-1'
                        >
                          <XCircle className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                onClick={handleClose}
                className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-medium'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2'
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.description.trim()
                }
              >
                {isSubmitting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className='h-4 w-4' />
                    <span>Create Complaint</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

// Teacher Complaint Detail Modal
interface TeacherComplaintDetailModalProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  onStatusUpdate: (complaintId: string, status: string) => Promise<void>;
  onResponseSubmit: (complaintId: string, content: string) => Promise<void>;
  currentUserId?: string; // Add current user ID to check ownership
}

const TeacherComplaintDetailModal: React.FC<
  TeacherComplaintDetailModalProps
> = ({
  open,
  onClose,
  complaint,
  onStatusUpdate,
  onResponseSubmit,
  currentUserId,
}) => {
  const [responses, setResponses] = useState<ComplaintResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  useEffect(() => {
    if (open && complaint) {
      loadResponses();
    }
  }, [open, complaint]);

  const loadResponses = async () => {
    if (!complaint) return;

    setLoading(true);
    try {
      // First, try to use responses that are already included in the complaint data
      if (complaint.responses && complaint.responses.length > 0) {
        console.log(
          'Using responses from complaint data:',
          complaint.responses,
        );
        setResponses(complaint.responses);
        setLoading(false);
        return;
      }

      // If no responses in complaint data, fetch them separately
      console.log('Fetching responses separately for complaint:', complaint.id);
      const response = await complaintService.getResponses(complaint.id);
      if (response.success && response.data) {
        console.log('Fetched responses:', response.data);
        // The backend returns { message: 'Responses retrieved', responses: ComplaintResponse[] }
        // So we need to access response.data.responses, not response.data directly
        const responsesData = (response.data as any).responses || response.data;
        setResponses(responsesData);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!complaint) return;

    try {
      await onStatusUpdate(complaint.id, status);
      // Update the local complaint status to reflect the change immediately
      complaint.status = status as any;
      toast.success(`Complaint status updated to ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleResponseSubmit = async (complaintId: string, content: string) => {
    try {
      await onResponseSubmit(complaintId, content);
      await loadResponses(); // Refresh responses
      toast.success('Response submitted successfully');
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  // Helper functions for styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-indigo-100 text-indigo-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-teal-100 text-teal-700';
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      default:
        return status;
    }
  };

  const formatPriorityDisplay = (priority: string) => {
    return priority?.toLowerCase() || 'unknown';
  };

  // Don't render if complaint is null or undefined
  if (!complaint) return null;

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='bg-white rounded-xl max-w-3xl w-full max-h-[75vh] overflow-hidden shadow-2xl flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-50 to-indigo-100 p-6 border-b border-purple-200'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}
                >
                  {formatPriorityDisplay(complaint.priority)}
                </span>

                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                  {complaint.type?.toLowerCase() || 'unknown'}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}
                >
                  {formatStatusDisplay(complaint.status)}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    complaint.recipientType === 'ADMINISTRATION'
                      ? 'bg-green-100 text-green-700'
                      : complaint.recipientType === 'PARENT'
                        ? 'bg-orange-100 text-orange-700'
                        : complaint.recipientType === 'CLASS_TEACHER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {complaint.recipientType === 'ADMINISTRATION'
                    ? 'To: Admin'
                    : complaint.recipientType === 'PARENT'
                      ? 'To: Parent'
                      : complaint.recipientType === 'CLASS_TEACHER'
                        ? 'To: Teacher'
                        : 'To: Unknown'}
                </span>
              </div>

              <h2 className='text-xl font-bold text-gray-800'>
                {complaint.title || 'Untitled Complaint'}
              </h2>
              <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                <span className='font-medium'>From:</span>
                <span>{complaint.complainant?.fullName || 'Unknown'}</span>
                <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                <span className='font-medium'>To:</span>
                <span>
                  {complaint.recipientType === 'ADMINISTRATION'
                    ? 'Administration'
                    : complaint.recipientType === 'PARENT'
                      ? 'Parent'
                      : complaint.recipientType === 'CLASS_TEACHER'
                        ? 'Class Teacher'
                        : 'Unknown'}
                  {complaint.assignedTo && (
                    <span className='ml-1 text-gray-500'>
                      ({complaint.assignedTo.fullName})
                    </span>
                  )}
                </span>
              </div>

              <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                <span>By {complaint.complainant?.fullName || 'Unknown'}</span>
                <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                <span>
                  {complaint.createdAt
                    ? new Date(complaint.createdAt).toLocaleDateString()
                    : 'Unknown date'}
                </span>
              </div>

              <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                <span className='flex items-center gap-1'>
                  <Send className='h-3 w-3' />
                  To:{' '}
                  {complaint.recipientType === 'ADMINISTRATION'
                    ? 'Administration/Office'
                    : complaint.recipientType === 'PARENT'
                      ? 'Parent'
                      : complaint.recipientType === 'CLASS_TEACHER'
                        ? 'Class Teacher'
                        : 'Unknown'}
                </span>
                {complaint.recipient && (
                  <>
                    <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                    <span>{complaint.recipient.fullName}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 space-y-4 overflow-y-auto flex-1'>
          {/* Complaint Details */}
          <div className='space-y-4'>
            <div>
              <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                <FileText className='mr-2' size={18} />
                Complaint Details
              </h3>
              <div className='bg-gray-50 p-3 rounded-lg'>
                <p className='text-gray-700 whitespace-pre-wrap text-sm'>
                  {complaint.description}
                </p>
              </div>
            </div>

            <div>
              <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                <User className='mr-2' size={18} />
                Complainant Information
              </h3>
              <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Name:</span>
                  <span className='font-medium'>
                    {complaint.complainant?.fullName || 'Unknown'}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Email:</span>
                  <span className='font-medium'>
                    {complaint.complainant?.email || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Type:</span>
                  <span className='font-medium'>
                    {complaint.complainantType || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div>
              <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                <Send className='mr-2' size={18} />
                Recipient Information
              </h3>
              <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Recipient Type:</span>
                  <span className='font-medium'>
                    {complaint.recipientType === 'ADMINISTRATION' &&
                      'Administration/Office'}
                    {complaint.recipientType === 'PARENT' && 'Parent'}
                    {complaint.recipientType === 'CLASS_TEACHER' &&
                      'Class Teacher'}
                    {complaint.recipientType || 'Unknown'}
                  </span>
                </div>
                {complaint.recipient && (
                  <>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Recipient Name:</span>
                      <span className='font-medium'>
                        {complaint.recipient.fullName || 'N/A'}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Recipient Email:</span>
                      <span className='font-medium'>
                        {complaint.recipient.email || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {!complaint.recipient &&
                  complaint.recipientType === 'ADMINISTRATION' && (
                    <div className='text-sm text-blue-600 bg-blue-50 p-2 rounded'>
                      <strong>Note:</strong> This complaint is addressed to the
                      school administration/office
                    </div>
                  )}
                {!complaint.recipient &&
                  complaint.recipientType === 'PARENT' && (
                    <div className='text-sm text-orange-600 bg-orange-50 p-2 rounded'>
                      <strong>Note:</strong> This complaint is addressed to a
                      parent (recipient details may be private)
                    </div>
                  )}
                {!complaint.recipient &&
                  complaint.recipientType === 'CLASS_TEACHER' && (
                    <div className='text-sm text-purple-600 bg-purple-50 p-2 rounded'>
                      <strong>Note:</strong> This complaint is addressed to a
                      class teacher
                    </div>
                  )}
              </div>
            </div>

            <div>
              <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                <Calendar className='mr-2' size={18} />
                Timeline
              </h3>
              <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Created:</span>
                  <span className='font-medium'>
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'Unknown'}
                  </span>
                </div>
                {complaint.assignedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Assigned:</span>
                    <span className='font-medium'>
                      {new Date(complaint.assignedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
                {complaint.resolvedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Resolved:</span>
                    <span className='font-medium'>
                      {new Date(complaint.resolvedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
                {complaint.updatedAt && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Last Updated:</span>
                    <span className='font-medium'>
                      {new Date(complaint.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {complaint.assignedTo && (
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                  <UserPlus className='mr-2' size={20} />
                  Assigned To
                </h3>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <User className='text-gray-500' size={16} />
                    <span className='font-medium'>
                      {complaint.assignedTo.fullName}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {complaint.resolution && (
              <div>
                <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                  <CheckCircle className='mr-2' size={20} />
                  Resolution
                </h3>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <p className='text-gray-700 whitespace-pre-wrap'>
                    {complaint.resolution}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                <FileText className='mr-2' size={20} />
                Attachments ({complaint.attachments.length})
              </h3>

              <ul className='space-y-2'>
                {complaint.attachments.map(attachment => (
                  <li
                    key={attachment.id}
                    className='flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50'
                  >
                    <div className='flex items-center gap-2'>
                      <FileText className='w-5 h-5 text-blue-500' />
                      <span className='text-sm text-gray-700'>
                        {attachment.originalName}
                      </span>
                    </div>

                    <div className='flex items-center gap-3'>
                      <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1'>
                        <FileText className='w-4 h-4' />
                        {attachment.mimeType?.split('/')[1]?.toUpperCase() ||
                          'FILE'}
                      </span>
                      <a
                        href={attachment.url}
                        target='_blank'
                        rel='noreferrer'
                        className='bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1'
                      >
                        <Eye className='w-3 h-3' />
                        View
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responses Section */}
          <div>
            <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
              <MessageSquare className='mr-2' size={20} />
              Responses ({responses.length})
            </h3>
            <div className='bg-gray-50 p-4 rounded-lg'>
              {loading ? (
                <div className='text-center py-4'>
                  <div className='inline-block rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
                  <p className='mt-2 text-gray-600'>Loading responses...</p>
                </div>
              ) : responses.length > 0 ? (
                <div className='space-y-4'>
                  {responses.map((response, index) => (
                    <div
                      key={index}
                      className='bg-white p-4 rounded-lg border border-gray-200'
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <div className='flex items-center gap-2'>
                          <User className='text-gray-500' size={16} />
                          <span className='font-medium'>
                            {response.responder?.fullName || 'Unknown'}
                          </span>
                        </div>
                        <span className='text-sm text-gray-500'>
                          {response.createdAt
                            ? new Date(response.createdAt).toLocaleString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                },
                              )
                            : 'Unknown date'}
                        </span>
                      </div>
                      <p className='text-gray-700'>{response.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  No responses yet
                </p>
              )}

              {/* Add Response Button */}
              <div className='mt-6 pt-4 border-t border-gray-200'>
                <div className='flex justify-between items-center'>
                  <h4 className='text-base font-medium text-gray-800 flex items-center'>
                    <MessageSquare className='mr-2' size={18} />
                    Responses
                  </h4>
                  <Button
                    onClick={() => setResponseModalOpen(true)}
                    className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                  >
                    <MessageSquare size={16} />
                    Add Response
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className='border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0'>
          <div className='flex flex-wrap gap-3 justify-between items-center'>
            <div className='flex flex-wrap gap-3'>
              {/* Check if teacher is the complainant */}
              {complaint.complainantId === currentUserId ? (
                // Teacher is the complainant - only allow cancellation
                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className='bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                    disabled={complaint.status === 'CANCELLED'}
                  >
                    <XCircle size={16} />
                    Cancel Complaint
                  </Button>
                  <div className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                    You created this complaint - only cancellation allowed
                  </div>
                </div>
              ) : (
                // Teacher didn't create the complaint - allow status changes
                <>
                  <Button
                    onClick={() => handleStatusUpdate('IN_PROGRESS')}
                    className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center text-sm font-medium'
                    disabled={complaint.status === 'IN_PROGRESS'}
                  >
                    <Clock size={16} />
                    In Progress
                  </Button>

                  <Button
                    onClick={() => handleStatusUpdate('RESOLVED')}
                    className='bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3 py-1.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center text-sm font-medium'
                    disabled={complaint.status === 'RESOLVED'}
                  >
                    <CheckCircle size={16} />
                    Mark as Resolved
                  </Button>

                  <Button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className='bg-gradient-to-r from-rose-600 to-rose-700 text-white px-3 py-1.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center text-sm font-medium'
                    disabled={complaint.status === 'CANCELLED'}
                  >
                    <XCircle size={16} />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={onClose}
              className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-medium'
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      <ComplaintResponseModal
        open={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        complaint={complaint}
        onSubmit={handleResponseSubmit}
      />
    </div>
  ) : null;
};

const ComplaintsAndLeavePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [complaintDetailModalOpen, setComplaintDetailModalOpen] =
    useState(false);
  const [createComplaintModalOpen, setCreateComplaintModalOpen] =
    useState(false);
  const [leaveRequestDetailModalOpen, setLeaveRequestDetailModalOpen] =
    useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [leaveRequestToReject, setLeaveRequestToReject] = useState<any>(null);
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);

  // Use the leave requests hook for real data
  const {
    leaveRequests,
    loading: leaveRequestsLoading,
    fetchLeaveRequests,
    approveByTeacher,
    rejectByTeacher,
  } = useLeaveRequests();

  const { user } = useAuth();
  const router = useRouter();

  // Load complaints and leave requests on component mount
  useEffect(() => {
    loadComplaints();
    fetchLeaveRequests();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getAllComplaints({
        limit: 50,
        page: 1,
      });

      if (response.success && response.data) {
        setComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = async (complaint: Complaint) => {
    try {
      console.log('Opening complaint with ID:', complaint.id);
      console.log('Complaint data:', complaint);
      console.log('Complaint ID type:', typeof complaint.id);
      console.log('Complaint ID length:', complaint.id?.length);

      // Validate complaint ID
      if (
        !complaint.id ||
        complaint.id === 'undefined' ||
        complaint.id === 'null'
      ) {
        console.error('Invalid complaint ID:', complaint.id);
        toast.error('Invalid complaint ID');
        return;
      }

      // Use the complaint data from the list directly
      // This avoids the complex permission issues with getComplaintById
      console.log('Using complaint data from list:', complaint);

      // Try to fetch responses separately if needed
      let complaintWithResponses = { ...complaint };
      try {
        const response = await complaintService.getResponses(complaint.id);
        if (response.success && response.data) {
          console.log('Successfully fetched responses:', response.data);
          // The backend returns { message: 'Responses retrieved', responses: ComplaintResponse[] }
          // So we need to access response.data.responses, not response.data directly
          const responsesData =
            (response.data as any).responses || response.data;
          // Update the complaint with responses
          complaintWithResponses = { ...complaint, responses: responsesData };
        }
      } catch (responseError) {
        console.error('Error fetching responses:', responseError);
        // Don't show error for responses, just log it
      }

      setSelectedComplaint(complaintWithResponses);
      setComplaintDetailModalOpen(true);
    } catch (error) {
      console.error('Error in handleViewComplaint:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });

      toast.error('Failed to open complaint details');
    }
  };

  const handleStatusUpdate = async (complaintId: string, status: string) => {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: status as any,
      });
      await loadComplaints(); // Refresh complaints list

      // Update the selected complaint if it's the one being updated
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint(prev =>
          prev ? { ...prev, status: status as any } : null,
        );
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw error;
    }
  };

  const handleResponseSubmit = async (complaintId: string, content: string) => {
    try {
      await complaintService.createResponse(complaintId, {
        content,
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  const handleCreateComplaint = async (
    complaintData: any,
    attachments: File[] = [],
  ) => {
    try {
      // First, create the complaint
      const response = await complaintService.createComplaint(complaintData);

      console.log('Complaint creation response:', response);

      if (response.success && response.data) {
        // The backend returns { message: 'Complaint created', complaint }
        // So the complaint ID is in response.data.complaint.id
        const complaintId =
          (response.data as any).complaint?.id || (response.data as any).id;
        console.log('Complaint ID:', complaintId);

        if (!complaintId) {
          console.error('No complaint ID received from backend');
          throw new Error('Failed to get complaint ID from response');
        }

        // Then, upload attachments if any
        if (attachments.length > 0) {
          try {
            console.log('Uploading attachments for complaint ID:', complaintId);
            await complaintService.uploadAttachments(complaintId, attachments);
            toast.success(
              `Complaint submitted successfully with ${attachments.length} attachment(s)`,
            );
          } catch (attachmentError) {
            console.error('Error uploading attachments:', attachmentError);
            toast.error('Complaint created but failed to upload attachments');
          }
        } else {
          toast.success('Complaint submitted successfully');
        }

        // Refresh complaints list
        await loadComplaints();
      } else {
        console.error('Complaint creation failed:', response);
        throw new Error('Failed to create complaint');
      }
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Leave request handlers
  const handleViewLeaveRequest = (leaveRequest: any) => {
    setSelectedLeaveRequest(leaveRequest);
    setLeaveRequestDetailModalOpen(true);
  };

  const handleTeacherApprove = async (leaveRequestId: string) => {
    try {
      // Call the backend API to approve the leave request by teacher
      await approveByTeacher(leaveRequestId);
      toast.success('Leave request approved by teacher successfully');
      // Refresh the leave requests list
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleTeacherReject = async (
    leaveRequestId: string,
    reason: string,
  ) => {
    try {
      // Call the backend API to reject the leave request by teacher
      await rejectByTeacher(leaveRequestId, reason);
      toast.success('Leave request rejected by teacher successfully');
      // Refresh the leave requests list
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error('Failed to reject leave request');
    }
  };

  // Tab content with approved/unapproved sections for complaints
  interface TeacherCardListProps {
    title: string;
    items: Complaint[];
  }

  const TeacherCardList = ({ title, items }: TeacherCardListProps) => (
    <div className='mb-8'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='text-xl font-semibold text-slate-800'>{title}</h4>
        <span className='text-sm text-slate-500'>{items.length} items</span>
      </div>
      <div className='space-y-4'>
        {items.length === 0 ? (
          <div className='text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200'>
            <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <FileText className='h-6 w-6 text-gray-400' />
            </div>
            <p className='text-gray-600 font-medium'>No complaints found</p>
            <p className='text-gray-500 text-sm mt-1'>
              Complaints assigned to you will appear here
            </p>
          </div>
        ) : (
          items.map(complaint => (
            <div
              key={complaint.id}
              className='bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900 text-base mb-2'>
                    {complaint.title || 'Untitled Complaint'}
                  </h3>
                  <div className='flex items-center gap-3 text-sm text-gray-600 mb-2'>
                    <span className='flex items-center gap-1'>
                      <CalendarDays className='h-4 w-4' />
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                      {complaintService.getTypeLabel(complaint.type)}
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                      {complaintService.getPriorityLabel(complaint.priority)}
                    </span>
                  </div>
                  <div className='text-sm text-gray-600 mb-2'>
                    <span className='font-medium'>From:</span>{' '}
                    {complaint.complainant?.fullName || 'Student'}
                  </div>
                  <div className='text-sm text-gray-600 mb-2'>
                    <span className='font-medium'>To:</span>
                    <span
                      className={`inline-block ml-1 px-2 py-1 rounded text-xs font-medium ${
                        complaint.recipientType === 'ADMINISTRATION'
                          ? 'bg-green-100 text-green-700'
                          : complaint.recipientType === 'PARENT'
                            ? 'bg-orange-100 text-orange-700'
                            : complaint.recipientType === 'CLASS_TEACHER'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {complaint.recipientType === 'ADMINISTRATION'
                        ? 'Administration'
                        : complaint.recipientType === 'PARENT'
                          ? 'Parent'
                          : complaint.recipientType === 'CLASS_TEACHER'
                            ? 'Class Teacher'
                            : 'Unknown'}
                    </span>
                    {complaint.recipient && (
                      <span className='ml-2 text-gray-500'>
                        ({complaint.recipient.fullName})
                      </span>
                    )}
                  </div>
                </div>
                <div className='ml-3'>
                  <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium'>
                    {complaint.status?.toLowerCase() || 'unknown'}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-sm text-gray-500'>
                  {complaint._count && (
                    <span className='flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs'>
                      <MessageSquare className='h-3 w-3' />
                      {complaint._count.responses} responses
                    </span>
                  )}
                  {complaint._count && complaint._count.attachments > 0 && (
                    <span className='flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs'>
                      <FileText className='h-3 w-3' />
                      {complaint._count.attachments} attachments
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => handleViewComplaint(complaint)}
                  className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                >
                  <Eye className='h-3 w-3 mr-1' />
                  View Details
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const tabs = [
    {
      name: 'Complaints',
      content: (
        <>
          <div className='p-4 border-b border-gray-200 bg-gray-50'>
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Complaints Overview
                </h3>
                <p className='text-gray-600 text-sm mt-1'>
                  Manage complaints assigned to you
                </p>
              </div>
              <div className='flex items-center gap-4'>
                <div className='text-right'>
                  <p className='text-sm text-gray-600'>Total Complaints</p>
                  <p className='text-xl font-bold text-gray-900'>
                    {complaints.length}
                  </p>
                </div>
                <div className='w-px h-8 bg-gray-300'></div>
                <div className='text-right'>
                  <p className='text-sm text-gray-600'>Pending</p>
                  <p className='text-xl font-bold text-orange-600'>
                    {
                      complaints.filter(
                        c => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='p-4'>
            {loading ? (
              <div className='text-center py-6 text-gray-600'>
                Loading complaints...
              </div>
            ) : (
              <>
                <TeacherCardList
                  title='Active Complaints'
                  items={complaints.filter(
                    c => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
                  )}
                />
                <TeacherCardList
                  title='Resolved Complaints'
                  items={complaints.filter(
                    c => c.status === 'RESOLVED' || c.status === 'CLOSED',
                  )}
                />
              </>
            )}
          </div>
        </>
      ),
    },
    {
      name: 'Leave Requests',
      content: (
        <>
          <div className='p-6 border-b border-slate-200 bg-slate-50'>
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='text-lg font-semibold text-slate-800'>
                  Leave Requests Overview
                </h3>
                <p className='text-slate-600 text-sm mt-1'>
                  Track and manage leave requests that require your approval
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Total Requests</p>
                  <p className='text-2xl font-bold text-slate-800'>
                    {leaveRequests.filter(l => l.status !== 'CANCELLED').length}
                  </p>
                </div>
                <div className='w-px h-8 bg-slate-300'></div>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Pending</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    {
                      leaveRequests.filter(
                        l => l.status === 'PENDING_TEACHER_APPROVAL',
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='p-6'>
            {leaveRequestsLoading ? (
              <div className='text-center py-8'>Loading leave requests...</div>
            ) : leaveRequests.length === 0 ? (
              <div className='text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'>
                <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <CalendarDays className='h-8 w-8 text-slate-400' />
                </div>
                <p className='text-slate-500 font-medium'>
                  No leave requests found
                </p>
                <p className='text-slate-400 text-sm mt-1'>
                  Leave requests approved by parents will appear here for your
                  approval
                </p>
              </div>
            ) : (
              <>
                <div className='mb-8'>
                  <h4 className='text-xl font-semibold text-slate-800 mb-4'>
                    Parent-Approved Leave Requests
                  </h4>
                  <p className='text-slate-600 text-sm mb-4'>
                    These are leave requests approved by parents that require
                    your approval.
                  </p>
                  <div className='space-y-4'>
                    {leaveRequests.filter(
                      l => l.status === 'PENDING_TEACHER_APPROVAL',
                    ).length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'>
                        <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <Clock className='h-6 w-6 text-slate-400' />
                        </div>
                        <p className='text-slate-500 font-medium'>
                          No parent-approved leave requests
                        </p>
                        <p className='text-slate-400 text-sm mt-1'>
                          All leave requests are either pending parent approval
                          or have been processed
                        </p>
                      </div>
                    ) : (
                      leaveRequests
                        .filter(l => l.status === 'PENDING_TEACHER_APPROVAL')
                        .map(leaveRequest => (
                          <div
                            key={leaveRequest.id}
                            className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            <div className='flex items-start justify-between mb-4'>
                              <div className='flex-1'>
                                <h3 className='font-semibold text-slate-800 text-lg mb-2 line-clamp-2'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex items-center gap-4 text-sm text-slate-600 mb-3'>
                                  <span className='flex items-center gap-1'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    -{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                                    {leaveRequest.type}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-yellow-500 rounded-full'></span>
                                    Parent Approved - Awaiting Teacher
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>
                              <div className='ml-4'>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700`}
                                >
                                  Parent Approved
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-4 text-sm text-slate-500'>
                                {leaveRequest.attachments &&
                                  leaveRequest.attachments.length > 0 && (
                                    <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                      <FileText className='h-4 w-4' />
                                      {leaveRequest.attachments.length}{' '}
                                      attachment
                                      {leaveRequest.attachments.length !== 1
                                        ? 's'
                                        : ''}
                                    </span>
                                  )}
                                <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                  <CalendarDays className='h-4 w-4' />
                                  Submitted{' '}
                                  {new Date(
                                    leaveRequest.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
                                {/* View Details Button - Always Available */}
                                <Button
                                  onClick={() =>
                                    handleViewLeaveRequest(leaveRequest)
                                  }
                                  className='w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2.5 rounded-lg hover:from-slate-700 hover:to-slate-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                >
                                  <Eye className='h-4 w-4' />
                                  <span>View Details</span>
                                </Button>

                                {/* Teacher Action Buttons */}
                                <Button
                                  onClick={() =>
                                    handleTeacherApprove(leaveRequest.id)
                                  }
                                  className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                >
                                  <CheckCircle className='h-4 w-4' />
                                  <span>Approve as Teacher</span>
                                </Button>
                                <Button
                                  onClick={() => {
                                    setLeaveRequestToReject({
                                      ...leaveRequest,
                                      rejectorRole: 'teacher',
                                    });
                                    setRejectReasonModalOpen(true);
                                  }}
                                  className='w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                >
                                  <X className='h-4 w-4' />
                                  <span>Reject Request</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className='mb-8'>
                  <h4 className='text-xl font-semibold text-slate-800 mb-4'>
                    Approved Leave Requests
                  </h4>
                  <div className='space-y-4'>
                    {leaveRequests.filter(l => l.status === 'APPROVED')
                      .length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'>
                        <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <CheckCircle2 className='h-6 w-6 text-slate-400' />
                        </div>
                        <p className='text-slate-500 font-medium'>
                          No approved leave requests
                        </p>
                        <p className='text-slate-400 text-sm mt-1'>
                          Your approved leave requests will appear here
                        </p>
                      </div>
                    ) : (
                      leaveRequests
                        .filter(l => l.status === 'APPROVED')
                        .map(leaveRequest => (
                          <div
                            key={leaveRequest.id}
                            className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            <div className='flex items-start justify-between mb-4'>
                              <div className='flex-1'>
                                <h3 className='font-semibold text-slate-800 text-lg mb-2 line-clamp-2'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex items-center gap-4 text-sm text-slate-600 mb-3'>
                                  <span className='flex items-center gap-1'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    -{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                                    {leaveRequest.type}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                                    Approved
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>
                              <div className='ml-4'>
                                <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium'>
                                  Approved
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-4 text-sm text-slate-500'>
                                {leaveRequest.attachments &&
                                  leaveRequest.attachments.length > 0 && (
                                    <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                      <FileText className='h-4 w-4' />
                                      {leaveRequest.attachments.length}{' '}
                                      attachment
                                      {leaveRequest.attachments.length !== 1
                                        ? 's'
                                        : ''}
                                    </span>
                                  )}
                                <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                  <CalendarDays className='h-4 w-4' />
                                  Approved on{' '}
                                  {new Date(
                                    leaveRequest.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className='flex items-center gap-3'>
                                <Button
                                  onClick={() =>
                                    handleViewLeaveRequest(leaveRequest)
                                  }
                                  className='bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                >
                                  <Eye className='h-4 w-4' />
                                  <span>View Approved</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className='mb-8'>
                  <h4 className='text-xl font-semibold text-slate-800 mb-4'>
                    Rejected Leave Requests
                  </h4>
                  <div className='space-y-4'>
                    {leaveRequests.filter(l => l.status === 'REJECTED')
                      .length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'>
                        <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <XCircle className='h-6 w-6 text-slate-400' />
                        </div>
                        <p className='text-slate-500 font-medium'>
                          No rejected leave requests
                        </p>
                        <p className='text-slate-400 text-sm mt-1'>
                          Your rejected leave requests will appear here
                        </p>
                      </div>
                    ) : (
                      leaveRequests
                        .filter(l => l.status === 'REJECTED')
                        .map(leaveRequest => (
                          <div
                            key={leaveRequest.id}
                            className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            <div className='flex items-start justify-between mb-4'>
                              <div className='flex-1'>
                                <h3 className='font-semibold text-slate-800 text-lg mb-2 line-clamp-2'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex items-center gap-4 text-sm text-slate-600 mb-3'>
                                  <span className='flex items-center gap-1'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    -{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                                    {leaveRequest.type}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                                    Rejected
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>
                              <div className='ml-4'>
                                <span className='bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium'>
                                  Rejected
                                </span>
                              </div>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-4 text-sm text-slate-500'>
                                {leaveRequest.attachments &&
                                  leaveRequest.attachments.length > 0 && (
                                    <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                      <FileText className='h-4 w-4' />
                                      {leaveRequest.attachments.length}{' '}
                                      attachment
                                      {leaveRequest.attachments.length !== 1
                                        ? 's'
                                        : ''}
                                    </span>
                                  )}
                                <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                                  <CalendarDays className='h-4 w-4' />
                                  Rejected on{' '}
                                  {new Date(
                                    leaveRequest.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className='flex items-center gap-3'>
                                <Button
                                  onClick={() =>
                                    handleViewLeaveRequest(leaveRequest)
                                  }
                                  className='bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                >
                                  <Eye className='h-4 w-4' />
                                  <span>View Rejected</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ),
    },
  ];

  if (loading) {
    return <div className='text-center py-8'>Loading...</div>;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6'>
      {/* Create Complaint Modal */}
      <CreateComplaintModal
        open={createComplaintModalOpen}
        onClose={() => setCreateComplaintModalOpen(false)}
        onSubmit={handleCreateComplaint}
      />

      {/* Complaint Detail Modal */}
      <TeacherComplaintDetailModal
        open={complaintDetailModalOpen}
        onClose={() => {
          setComplaintDetailModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        onStatusUpdate={handleStatusUpdate}
        onResponseSubmit={handleResponseSubmit}
        currentUserId={user?.id}
      />

      {/* Leave Request Detail Modal */}
      <LeaveRequestDetailModal
        open={leaveRequestDetailModalOpen}
        onClose={() => {
          setLeaveRequestDetailModalOpen(false);
          setSelectedLeaveRequest(null);
        }}
        leaveRequest={selectedLeaveRequest}
        onApprove={handleTeacherApprove}
        onReject={(leaveRequestId: string, reason: string) =>
          handleTeacherReject(leaveRequestId, reason)
        }
        onCancel={async (leaveRequestId: string) => {
          // Teachers don't cancel leave requests, only approve/reject
          toast.info('Teachers cannot cancel leave requests');
        }}
      />

      {/* Reject Reason Modal */}
      {rejectReasonModalOpen && leaveRequestToReject && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
          <div className='bg-white rounded-xl max-w-md w-full mx-4 shadow-xl'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-50 to-red-100 p-6 border-b border-red-200'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>
                    Reject Leave Request
                  </h2>
                  <p className='text-sm text-gray-600 mt-1'>
                    Provide a reason for rejection
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRejectReasonModalOpen(false);
                    setLeaveRequestToReject(null);
                  }}
                  className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='p-6'>
              <div className='mb-4'>
                <p className='text-gray-700 mb-2'>
                  Are you sure you want to reject the leave request:
                </p>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <h3 className='font-semibold text-gray-800'>
                    {leaveRequestToReject.title}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    {leaveRequestToReject.days} day
                    {leaveRequestToReject.days !== 1 ? 's' : ''} -{' '}
                    {leaveRequestToReject.type}
                  </p>
                </div>
              </div>

              <p className='text-sm text-red-600 mb-4'>
                This will reject the leave request and notify the student and
                parent.
              </p>
            </div>

            {/* Footer */}
            <div className='flex justify-end gap-3 p-6 border-t border-gray-200'>
              <Button
                onClick={() => {
                  setRejectReasonModalOpen(false);
                  setLeaveRequestToReject(null);
                }}
                className='bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium'
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Handle rejection logic here
                  await handleTeacherReject(
                    leaveRequestToReject.id,
                    'Rejected by teacher',
                  );
                  setRejectReasonModalOpen(false);
                  setLeaveRequestToReject(null);
                }}
                className='bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2'
              >
                <X className='h-4 w-4' />
                <span>Reject Request</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent'>
              Teacher Dashboard - Complaints & Leave
            </h1>
            <p className='text-slate-600 mt-2'>
              Manage complaints and leave requests as a teacher
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            <button
              onClick={() => setCreateComplaintModalOpen(true)}
              className='w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200'
            >
              <AlertCircle className='h-5 w-5' />
              <span>Create New Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>
                Active Complaints
              </p>
              <p className='text-3xl font-bold text-slate-800 mt-1'>
                {
                  complaints.filter(
                    c => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
                  ).length
                }
              </p>
            </div>
            <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
              <AlertCircle className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <div className='mt-4 flex items-center text-sm'>
            <span className='text-blue-600 font-medium'>Assigned</span>
            <span className='text-slate-500 ml-2'>to you</span>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>Resolved</p>
              <p className='text-3xl font-bold text-slate-800 mt-1'>
                {
                  complaints.filter(
                    c => c.status === 'RESOLVED' || c.status === 'CLOSED',
                  ).length
                }
              </p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
              <CheckCircle2 className='h-6 w-6 text-green-600' />
            </div>
          </div>
          <div className='mt-4 flex items-center text-sm'>
            <span className='text-green-600 font-medium'>Completed</span>
            <span className='text-slate-500 ml-2'>by you</span>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>
                Pending Leave
              </p>
              <p className='text-3xl font-bold text-slate-800 mt-1'>
                {
                  leaveRequests.filter(
                    l => l.status === 'PENDING_TEACHER_APPROVAL',
                  ).length
                }
              </p>
            </div>
            <div className='w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
              <Clock className='h-6 w-6 text-yellow-600' />
            </div>
          </div>
          <div className='mt-4 flex items-center text-sm'>
            <span className='text-yellow-600 font-medium'>Awaiting</span>
            <span className='text-slate-500 ml-2'>your approval</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'>
        <Tabs tabs={tabs} defaultIndex={activeTab} />
      </div>
    </div>
  );
};

export default function TeacherComplaintsAndLeavePage() {
  return <ComplaintsAndLeavePage />;
}
