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

// Mock data for leave requests (keeping unchanged as requested)
const mockLeaveRequests = [
  {
    id: '1',
    title: 'Annual Leave',
    date: '2023-08-20',
    time: '3 days',
    location: 'Family wedding celebration',
    status: 'approved',
  },
  {
    id: '2',
    title: 'Sick Leave',
    date: '2023-08-15',
    time: '1 day',
    location: 'Doctor appointment for routine checkup',
    status: 'pending',
  },
];

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
                className='bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
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
                className='bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700'
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.description.trim()
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Complaint'}
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
                    className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                    disabled={complaint.status === 'IN_PROGRESS'}
                  >
                    <Clock size={16} />
                    In Progress
                  </Button>

                  <Button
                    onClick={() => handleStatusUpdate('RESOLVED')}
                    className='bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                    disabled={complaint.status === 'RESOLVED'}
                  >
                    <CheckCircle size={16} />
                    Mark as Resolved
                  </Button>

                  <Button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className='bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
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
              className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg'
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

export const ComplaintsAndLeavePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [complaintDetailModalOpen, setComplaintDetailModalOpen] =
    useState(false);
  const [createComplaintModalOpen, setCreateComplaintModalOpen] =
    useState(false);

  const { user } = useAuth();
  const router = useRouter();

  // Load complaints on component mount
  useEffect(() => {
    loadComplaints();
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

  // Teacher action handler for leave requests (unchanged)
  const handleTeacherAction = (id: string, newStatus: string) => {
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)),
    );
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
          <div className='p-4 border-b border-gray-200 bg-gray-50'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>
                Total: {leaveRequests.length}
              </span>
              <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
                {leaveRequests.filter(l => l.status === 'pending').length}{' '}
                pending
              </span>
            </div>
          </div>
          <div className='p-4'>
            <div className='mb-6'>
              <h4 className='font-semibold mb-3 text-gray-900'>
                Approved Leave Requests
              </h4>
              <div className='space-y-3'>
                {leaveRequests.filter(l => l.status === 'approved').length ===
                0 ? (
                  <div className='text-gray-500 text-sm'>
                    No approved leave requests found.
                  </div>
                ) : (
                  leaveRequests
                    .filter(l => l.status === 'approved')
                    .map(event => (
                      <div
                        key={event.id}
                        className='bg-white rounded-lg p-4 border border-gray-200'
                      >
                        <div className='flex justify-between items-center mb-2'>
                          <span className='font-medium text-gray-900'>
                            {event.title}
                          </span>
                          <StatusBadge status={event.status} />
                        </div>
                        <div className='text-sm text-gray-600 mb-2'>
                          Date: {event.date}{' '}
                          {event.time !== 'N/A' && `• ${event.time}`} •{' '}
                          {event.location}
                        </div>
                        <Button className='bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm'>
                          View Details
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className='mb-6'>
              <h4 className='font-semibold mb-3 text-gray-900'>
                Pending Leave Requests
              </h4>
              <div className='space-y-3'>
                {leaveRequests.filter(l => l.status === 'pending').length ===
                0 ? (
                  <div className='text-gray-500 text-sm'>
                    No pending leave requests found.
                  </div>
                ) : (
                  leaveRequests
                    .filter(l => l.status === 'pending')
                    .map(event => (
                      <div
                        key={event.id}
                        className='bg-white rounded-lg p-4 border border-gray-200'
                      >
                        <div className='flex justify-between items-center mb-2'>
                          <span className='font-medium text-gray-900'>
                            {event.title}
                          </span>
                          <StatusBadge status={event.status} />
                        </div>
                        <div className='text-sm text-gray-600 mb-2'>
                          Date: {event.date}{' '}
                          {event.time !== 'N/A' && `• ${event.time}`} •{' '}
                          {event.location}
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            className='bg-green-500 text-white px-3 py-1 rounded text-sm'
                            onClick={() =>
                              handleTeacherAction(event.id, 'approved')
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            className='bg-red-500 text-white px-3 py-1 rounded text-sm'
                            onClick={() =>
                              handleTeacherAction(event.id, 'rejected')
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
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

        <CreateComplaintModal
          open={createComplaintModalOpen}
          onClose={() => setCreateComplaintModalOpen(false)}
          onSubmit={handleCreateComplaint}
        />

        {/* Header Section */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Complaints & Leave Requests
          </h1>
          <p className='text-gray-600 mt-1'>
            Manage complaints and leave requests
          </p>
          <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-800'>
              <strong>Important:</strong> When creating complaints to parents,
              you can only select students from your class where you are the
              class teacher. This ensures proper communication channels and
              accountability.
            </p>
            <div className='mt-2 text-xs text-blue-700'>
              <p>
                • <strong>Administration:</strong> For general school issues,
                policies, or administrative concerns
              </p>
              <p>
                • <strong>Parent:</strong> For student-specific behavioral,
                academic, or personal issues (limited to your class students)
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>Active Complaints</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {
                    complaints.filter(
                      c => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
                    ).length
                  }
                </p>
              </div>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <AlertCircle className='h-5 w-5 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>Resolved</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {
                    complaints.filter(
                      c =>
                        c.status === 'RESOLVED' ||
                        c.status === 'CLOSED' ||
                        c.status === 'CANCELLED',
                    ).length
                  }
                </p>
              </div>
              <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle2 className='h-5 w-5 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm'>Pending Leave</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {leaveRequests.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <Clock className='h-5 w-5 text-yellow-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-3'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <button
              type='button'
              onClick={() =>
                router.push(
                  '/dashboard/teacher/communication/complaints&leave/leave-request',
                )
              }
              className='bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 text-left'
            >
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <CalendarDays className='h-5 w-5 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900 mb-1'>
                    Request Leave
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Apply for personal leave
                  </p>
                </div>
              </div>
            </button>

            <button
              type='button'
              onClick={() => setCreateComplaintModalOpen(true)}
              className='bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 text-left'
            >
              <div className='flex items-start gap-3'>
                <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                  <AlertCircle className='h-5 w-5 text-orange-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-900 mb-1'>
                    Create Complaint
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Report issues or concerns
                  </p>
                  <p className='text-xs text-orange-600 mt-1'>
                    Parent complaints limited to your class students where you
                    are the class teacher
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <Tabs tabs={tabs} defaultIndex={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default ComplaintsAndLeavePage;
