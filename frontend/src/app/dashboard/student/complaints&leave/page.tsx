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
  Upload,
  X,
  Eye,
  MessageSquare,
  ExternalLink,
  Download,
  CheckCircle,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { complaintService } from '@/api/services/complaint.service';
import type {
  Complaint,
  CreateComplaintRequest,
  ComplaintAttachment,
  ComplaintResponse,
} from '@/api/services/complaint.service';
import { toast } from 'sonner';

// Mock data for leave requests (keeping unchanged)
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

// Enhanced Modal for submitting complaint with full backend integration
interface ComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    complaint: CreateComplaintRequest,
    attachments: File[],
  ) => Promise<void>;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateComplaintRequest>({
    title: '',
    description: '',
    type: 'ACADEMIC',
    priority: 'MEDIUM',
    recipientType: 'CLASS_TEACHER',
    recipientId: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const complaintTypes = [
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'BEHAVIORAL', label: 'Behavioral' },
    { value: 'FACILITY', label: 'Facility' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'BULLYING', label: 'Bullying' },
    { value: 'DISCIPLINARY', label: 'Disciplinary' },
    { value: 'FINANCIAL', label: 'Financial' },
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
    { value: 'CLASS_TEACHER', label: 'Class Teacher' },
    { value: 'ADMINISTRATION', label: 'Administration' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Complaint title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Complaint description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    // Validate attachments
    attachments.forEach((file, index) => {
      const validation = complaintService.validateFile(file);
      if (!validation.isValid) {
        newErrors[`attachment_${index}`] = validation.error || 'Invalid file';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean the data before submitting - convert empty strings to undefined
      const cleanData = {
        ...formData,
        recipientId: formData.recipientId?.trim() || undefined,
      };

      await onSubmit(cleanData, attachments);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'ACADEMIC',
        priority: 'MEDIUM',
        recipientType: 'CLASS_TEACHER',
        recipientId: '',
      });
      setAttachments([]);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        type: 'ACADEMIC',
        priority: 'MEDIUM',
        recipientType: 'CLASS_TEACHER',
        recipientId: '',
      });
      setAttachments([]);
      setErrors({});
      onClose();
    }
  };

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>
                Submit a Complaint
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                Raise a concern or issue
              </p>
            </div>
            <button
              onClick={isSubmitting ? undefined : handleClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <X size={20} />
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
                className={`w-full border rounded-lg p-3 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder='Short summary of your complaint'
                readOnly={isSubmitting}
              />
              {errors.title && (
                <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className='block mb-2 font-medium'>
                Complaint Details <span className='text-red-500'>*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg p-3 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={4}
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Describe your issue or concern in detail...'
                readOnly={isSubmitting}
              />
              {errors.description && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Type and Priority */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block mb-2 font-medium'>
                  Complaint Type <span className='text-red-500'>*</span>
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  value={formData.type}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
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

              <div>
                <label className='block mb-2 font-medium'>
                  Priority <span className='text-red-500'>*</span>
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  value={formData.priority}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priority: e.target.value as any,
                    }))
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
            </div>

            {/* Recipient Type */}
            <div>
              <label className='block mb-2 font-medium'>
                Recipient Type <span className='text-red-500'>*</span>
              </label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.recipientType}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    recipientType: e.target.value as any,
                  }))
                }
                disabled={isSubmitting}
              >
                {recipientTypes.map(recipient => (
                  <option key={recipient.value} value={recipient.value}>
                    {recipient.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Attachments */}
            <div>
              <label className='block mb-2 font-medium'>
                Attachments (Optional)
              </label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
                <input
                  type='file'
                  multiple
                  accept='image/*,.pdf,.doc,.docx'
                  onChange={handleFileChange}
                  className='hidden'
                  id='file-upload'
                />
                <label
                  htmlFor='file-upload'
                  className='cursor-pointer flex flex-col items-center'
                >
                  <Upload className='h-8 w-8 text-gray-400 mb-2' />
                  <span className='text-sm text-gray-600'>
                    Click to upload files (Max 5 files, 10MB each)
                  </span>
                  <span className='text-xs text-gray-500 mt-1'>
                    Supported: Images, PDF, DOC, DOCX
                  </span>
                </label>
              </div>

              {/* File list */}
              {attachments.length > 0 && (
                <div className='mt-4 space-y-2'>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between bg-gray-50 p-2 rounded'
                    >
                      <div className='flex items-center space-x-2'>
                        <span className='text-sm'>{file.name}</span>
                        <span className='text-xs text-gray-500'>
                          ({complaintService.formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type='button'
                        onClick={
                          isSubmitting
                            ? undefined
                            : () => removeAttachment(index)
                        }
                        className={`text-red-500 hover:text-red-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                onClick={isSubmitting ? undefined : handleClose}
                className={`bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

// Complaint Detail Modal
interface ComplaintDetailModalProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  user?: any;
}

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  open,
  onClose,
  complaint,
  user,
}) => {
  const [responses, setResponses] = useState<ComplaintResponse[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Don't render if complaint is null or undefined
  if (!complaint) return null;

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 border-b border-yellow-200'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium 
                  ${
                    complaint.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700'
                      : complaint.priority === 'HIGH'
                        ? 'bg-red-100 text-red-600'
                        : complaint.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                  }`}
                >
                  {complaint.priority?.toLowerCase() || 'unknown'}
                </span>
                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                  {complaint.type?.toLowerCase() || 'unknown'}
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
            </div>

            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {/* Recipients */}
          <div className='bg-gray-50 p-3 rounded-lg'>
            <div className='text-sm font-medium text-gray-700 mb-1'>
              Recipient:
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700'>
                {complaint.recipientType
                  ? complaintService.getRecipientTypeLabel(
                      complaint.recipientType,
                    )
                  : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Complaint Content */}
          <div className='prose prose-blue max-w-none text-gray-700 bg-white p-4 rounded-lg border border-gray-200'>
            {complaint.description || 'No description provided'}
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold mb-3 flex items-center gap-2 text-gray-700'>
                <FileText className='w-5 h-5 text-blue-600' />
                Attachments ({complaint.attachments.length})
              </h3>

              <ul className='space-y-2'>
                {complaint.attachments.map(
                  (attachment: ComplaintAttachment) => (
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
                          <ExternalLink className='w-3 h-3' />
                          View Attachment
                        </a>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {/* Responses */}
          <div>
            <h4 className='font-medium mb-2 flex items-center'>
              <MessageSquare className='h-4 w-4 mr-2' />
              Responses ({responses.length})
            </h4>
            {loading ? (
              <div className='text-center py-4'>Loading responses...</div>
            ) : responses.length > 0 ? (
              <div className='space-y-3'>
                {responses.map(response => (
                  <div key={response.id} className='bg-gray-50 p-3 rounded'>
                    <div className='flex justify-between items-start mb-2'>
                      <span className='font-medium text-sm'>
                        {response.responder?.fullName || 'Unknown'}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {response.createdAt
                          ? new Date(response.createdAt).toLocaleString()
                          : 'Unknown time'}
                      </span>
                    </div>
                    <p className='text-sm text-gray-700'>
                      {response.content || 'No content'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-sm'>No responses yet.</p>
            )}
          </div>

          {/* Footer */}
          <div className='flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200 mt-6'>
            <div className='flex flex-col gap-1'>
              <div className='font-medium text-gray-700'>Complaint Status:</div>
              <div className='flex items-center gap-2'>
                <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs'>
                  Status: {complaint.status?.toLowerCase() || 'unknown'}
                </span>
              </div>
            </div>

            <div className='flex gap-2'>
              {/* Show resolve button if user is the recipient and complaint is open/in progress */}
              {user &&
                complaint.recipientId === user.id &&
                (complaint.status === 'OPEN' ||
                  complaint.status === 'IN_PROGRESS') && (
                  <button
                    onClick={async () => {
                      try {
                        const response =
                          await complaintService.resolveComplaint(
                            complaint.id,
                            'Complaint resolved by recipient',
                          );
                        if (response.success) {
                          toast.success('Complaint resolved successfully');
                          onClose();
                          // Refresh the complaints list
                          window.location.reload();
                        } else {
                          toast.error('Failed to resolve complaint');
                        }
                      } catch (error) {
                        console.error('Error resolving complaint:', error);
                        toast.error('Failed to resolve complaint');
                      }
                    }}
                    className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2'
                  >
                    <CheckCircle className='h-4 w-4' />
                    Resolve
                  </button>
                )}

              <button
                onClick={onClose}
                className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export const ComplaintsAndLeavePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintDetailModalOpen, setComplaintDetailModalOpen] =
    useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [complaintToCancel, setComplaintToCancel] = useState<Complaint | null>(
    null,
  );
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSubmitComplaint = async (
    complaintData: CreateComplaintRequest,
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

  const handleCancelComplaint = async (complaint: Complaint) => {
    // Only allow cancellation if the student created the complaint
    if (complaint.complainantId !== user?.id) {
      toast.error('You can only cancel complaints that you created');
      return;
    }

    // Only allow cancellation if the complaint is still open or in progress
    if (complaint.status !== 'OPEN' && complaint.status !== 'IN_PROGRESS') {
      toast.error(
        'You can only cancel complaints that are open or in progress',
      );
      return;
    }

    setComplaintToCancel(complaint);
    setCancelModalOpen(true);
  };

  const handleResolveComplaint = async (complaint: Complaint) => {
    // Only allow resolution if the user is the recipient of the complaint
    if (complaint.recipientId !== user?.id) {
      toast.error(
        'You can only resolve complaints where you are the recipient',
      );
      return;
    }

    // Only allow resolution if the complaint is still open or in progress
    if (complaint.status !== 'OPEN' && complaint.status !== 'IN_PROGRESS') {
      toast.error(
        'You can only resolve complaints that are open or in progress',
      );
      return;
    }

    try {
      const response = await complaintService.resolveComplaint(
        complaint.id,
        'Complaint resolved by recipient',
      );
      if (response.success) {
        toast.success('Complaint resolved successfully');
        // Update the complaint status in local state
        setComplaints(prev =>
          prev.map(c =>
            c.id === complaint.id ? { ...c, status: 'RESOLVED' } : c,
          ),
        );
      } else {
        toast.error('Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint');
    }
  };

  const confirmCancelComplaint = async () => {
    if (!complaintToCancel) return;

    try {
      const response = await complaintService.updateComplaint(
        complaintToCancel.id,
        { status: 'CLOSED' },
      );
      if (response.success) {
        toast.success('Complaint closed successfully');
        // Update the complaint status in local state
        setComplaints(prev =>
          prev.map(c =>
            c.id === complaintToCancel.id ? { ...c, status: 'CLOSED' } : c,
          ),
        );
        setCancelModalOpen(false);
        setComplaintToCancel(null);
      } else {
        toast.error('Failed to close complaint');
      }
    } catch (error) {
      console.error('Error closing complaint:', error);
      toast.error('Failed to close complaint');
    }
  };

  // Tab content with approved/unapproved sections
  interface CardListProps {
    title: string;
    items: Complaint[];
  }

  const CardList = ({ title, items }: CardListProps) => (
    <div className='mb-8'>
      <div className='flex items-center justify-between mb-4'>
        <h4 className='text-xl font-semibold text-slate-800'>{title}</h4>
        <span className='text-sm text-slate-500'>{items.length} items</span>
      </div>
      <div className='space-y-4'>
        {items.length === 0 ? (
          <div className='text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'>
            <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='h-8 w-8 text-slate-400' />
            </div>
            <p className='text-slate-500 font-medium'>No complaints found</p>
            <p className='text-slate-400 text-sm mt-1'>
              When you submit complaints, they'll appear here
            </p>
          </div>
        ) : (
          items.map(complaint => (
            <div
              key={complaint.id}
              className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-slate-800 text-lg mb-2 line-clamp-2'>
                    {complaint.title || 'Untitled Complaint'}
                  </h3>
                  <div className='text-sm text-gray-600 mb-2'>
                    <span className='font-medium'>From:</span>{' '}
                    {complaint.complainant?.fullName || 'Unknown'}
                  </div>
                  <div className='text-sm text-gray-600 mb-2'>
                    <span className='font-medium'>To:</span>{' '}
                    {complaint.recipientType === 'ADMINISTRATION'
                      ? 'Administration'
                      : complaint.recipientType === 'PARENT'
                        ? 'Parent'
                        : complaint.recipientType === 'CLASS_TEACHER'
                          ? 'Class Teacher'
                          : 'Unknown'}
                    {complaint.assignedTo && (
                      <span className='ml-2 text-gray-500'>
                        ({complaint.assignedTo.fullName})
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-4 text-sm text-slate-600 mb-3'>
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
                </div>
                <div className='ml-4'>
                  <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium'>
                    {complaint.status?.toLowerCase() || 'unknown'}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4 text-sm text-slate-500'>
                  {complaint._count && (
                    <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                      <MessageSquare className='h-4 w-4' />
                      {complaint._count.responses} responses
                    </span>
                  )}
                  {complaint._count && complaint._count.attachments > 0 && (
                    <span className='flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full'>
                      <FileText className='h-4 w-4' />
                      {complaint._count.attachments} attachments
                    </span>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() => handleViewComplaint(complaint)}
                    className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105'
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    View Details
                  </Button>

                  {/* Show resolve button if user is the recipient of the complaint and it's still open/in progress */}
                  {user &&
                    complaint.recipientId === user.id &&
                    (complaint.status === 'OPEN' ||
                      complaint.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => handleResolveComplaint(complaint)}
                        className='bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                      >
                        <CheckCircle className='h-4 w-4 mr-2' />
                        Resolve
                      </Button>
                    )}

                  {/* Show close button only if user is the creator of the complaint and it's still open/in progress */}
                  {user &&
                    complaint.complainantId === user.id &&
                    (complaint.status === 'OPEN' ||
                      complaint.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => handleCancelComplaint(complaint)}
                        className='bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl'
                      >
                        <X className='h-4 w-4' />
                        Close
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Parent action handler for leave requests (unchanged)
  const handleParentAction = (id: string, newStatus: string) => {
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)),
    );
  };

  const tabs = [
    {
      name: 'Complaints',
      content: (
        <>
          <div className='p-6 border-b border-slate-200 bg-slate-50'>
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='text-lg font-semibold text-slate-800'>
                  Complaints Overview
                </h3>
                <p className='text-slate-600 text-sm mt-1'>
                  Track and manage your submitted complaints
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Total Complaints</p>
                  <p className='text-2xl font-bold text-slate-800'>
                    {complaints.length}
                  </p>
                </div>
                <div className='w-px h-8 bg-slate-300'></div>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Pending</p>
                  <p className='text-2xl font-bold text-orange-600'>
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
          <div className='p-6'>
            {loading ? (
              <div className='text-center py-8'>Loading complaints...</div>
            ) : (
              <>
                <CardList
                  title='Resolved Complaints'
                  items={complaints.filter(
                    c =>
                      c.status === 'RESOLVED' ||
                      c.status === 'CLOSED' ||
                      c.status === 'CANCELLED',
                  )}
                />
                <CardList
                  title='Active Complaints'
                  items={complaints.filter(
                    c => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
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
          <div className='mb-2 flex justify-between items-center'>
            <span className='text-sm text-gray-500'>
              Total: {leaveRequests.length}
            </span>
            <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
              {leaveRequests.filter(l => l.status === 'pending').length} pending
            </span>
          </div>
          <div className='mb-6'>
            <h4 className='font-semibold mb-2'>Approved Leave Requests</h4>
            <div className='flex flex-col gap-4'>
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
                      className='bg-white rounded-lg p-6 shadow border flex flex-col gap-2'
                    >
                      <div className='flex justify-between items-center mb-2'>
                        <span className='font-medium'>{event.title}</span>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className='text-sm text-gray-500 mb-1'>
                        Date: {event.date}{' '}
                        {event.time !== 'N/A' && `• ${event.time}`} •{' '}
                        {event.location}
                      </div>
                      <Button className='bg-gray-100 text-gray-700 px-4 py-2 rounded w-fit'>
                        View Details
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
          <div className='mb-6'>
            <h4 className='font-semibold mb-2'>
              Unapproved (Pending) Leave Requests
            </h4>
            <div className='flex flex-col gap-4'>
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
                      className='bg-white rounded-lg p-6 shadow border flex flex-col gap-2'
                    >
                      <div className='flex justify-between items-center mb-2'>
                        <span className='font-medium'>{event.title}</span>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className='text-sm text-gray-500 mb-1'>
                        Date: {event.date}{' '}
                        {event.time !== 'N/A' && `• ${event.time}`} •{' '}
                        {event.location}
                      </div>
                      <Button className='bg-gray-100 text-gray-700 px-4 py-2 rounded w-fit'>
                        View Details
                      </Button>
                      {/* Parent approve/reject buttons for leave requests */}
                      <div className='flex gap-2 mt-2'>
                        <Button
                          className='bg-green-500 text-white px-4 py-2 rounded'
                          onClick={() =>
                            handleParentAction(event.id, 'approved')
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          className='bg-red-500 text-white px-4 py-2 rounded'
                          onClick={() =>
                            handleParentAction(event.id, 'rejected')
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
        </>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6'>
      <ComplaintModal
        open={complaintModalOpen}
        onClose={() => setComplaintModalOpen(false)}
        onSubmit={handleSubmitComplaint}
      />

      <ComplaintDetailModal
        open={complaintDetailModalOpen}
        onClose={() => {
          setComplaintDetailModalOpen(false);
          setSelectedComplaint(null);
        }}
        complaint={selectedComplaint}
        user={user}
      />

      {/* Close Confirmation Modal */}
      {cancelModalOpen && complaintToCancel && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
          <div className='bg-white rounded-xl max-w-md w-full mx-4 shadow-xl'>
            {/* Header */}
            <div className='bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b border-orange-200'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>
                    Close Complaint
                  </h2>
                  <p className='text-sm text-gray-600 mt-1'>
                    This will mark the complaint as closed
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCancelModalOpen(false);
                    setComplaintToCancel(null);
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
                  Are you sure you want to close the complaint:
                </p>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <h3 className='font-semibold text-gray-800'>
                    {complaintToCancel.title}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Created on{' '}
                    {new Date(complaintToCancel.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className='text-sm text-orange-600 mb-4'>
                This will mark the complaint as closed. The complaint will
                remain in the system but will no longer be active.
              </p>
            </div>

            {/* Footer */}
            <div className='flex justify-end gap-3 p-6 border-t border-gray-200'>
              <Button
                onClick={() => {
                  setCancelModalOpen(false);
                  setComplaintToCancel(null);
                }}
                className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400'
              >
                No, Keep Active
              </Button>
              <Button
                onClick={confirmCancelComplaint}
                className='bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700'
              >
                Yes, Close Complaint
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
              Requests & Complaints
            </h1>
            <p className='text-slate-600 mt-2'>
              Manage your complaints and leave requests efficiently
            </p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => setComplaintModalOpen(true)}
              className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl'
            >
              <AlertCircle className='h-5 w-5' />
              New Complaint
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
            <span className='text-green-600 font-medium'>+2.5%</span>
            <span className='text-slate-500 ml-2'>from last month</span>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>Resolved</p>
              <p className='text-3xl font-bold text-slate-800 mt-1'>
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
            <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
              <CheckCircle2 className='h-6 w-6 text-green-600' />
            </div>
          </div>
          <div className='mt-4 flex items-center text-sm'>
            <span className='text-green-600 font-medium'>+12%</span>
            <span className='text-slate-500 ml-2'>from last month</span>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>
                Pending Leave
              </p>
              <p className='text-3xl font-bold text-slate-800 mt-1'>
                {leaveRequests.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <div className='w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center'>
              <Clock className='h-6 w-6 text-yellow-600' />
            </div>
          </div>
          <div className='mt-4 flex items-center text-sm'>
            <span className='text-yellow-600 font-medium'>Awaiting</span>
            <span className='text-slate-500 ml-2'>parent approval</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-8'>
        <h2 className='text-xl font-semibold text-slate-800 mb-4'>
          Quick Actions
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <button
            type='button'
            onClick={() => {
              // Leave request functionality
            }}
            className='group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200'>
                <CalendarDays className='h-6 w-6 text-white' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-slate-800 text-lg mb-1'>
                  Request Leave
                </h3>
                <p className='text-slate-600 text-sm'>
                  Apply for personal leave with detailed information
                </p>
                <div className='mt-3 flex items-center text-blue-600 text-sm font-medium'>
                  <span>Get Started</span>
                  <svg
                    className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          <button
            type='button'
            onClick={() => setComplaintModalOpen(true)}
            className='group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200'>
                <AlertCircle className='h-6 w-6 text-white' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-slate-800 text-lg mb-1'>
                  Submit Complaint
                </h3>
                <p className='text-slate-600 text-sm'>
                  Report issues or concerns with attachments
                </p>
                <div className='mt-3 flex items-center text-orange-600 text-sm font-medium'>
                  <span>Report Issue</span>
                  <svg
                    className='w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'>
        <Tabs tabs={tabs} defaultIndex={activeTab} />
      </div>
    </div>
  );
};

export default ComplaintsAndLeavePage;
