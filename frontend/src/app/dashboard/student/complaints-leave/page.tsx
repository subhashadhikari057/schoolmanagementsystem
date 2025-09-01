'use client';

import React, { useState, useEffect } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
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
import { PageLoader } from '@/components/atoms/loading';
import { useAuth } from '@/hooks/useAuth';
import { complaintService } from '@/api/services/complaint.service';
import type {
  Complaint,
  CreateComplaintRequest,
  ComplaintAttachment,
  ComplaintResponse,
} from '@/api/services/complaint.service';
import { toast } from 'sonner';
import LeaveRequestModal from '@/components/organisms/modals/LeaveRequestModal';
import TeacherComplaintModal from '@/components/organisms/modals/TeacherComplaintModal';
import LeaveRequestDetailModal from '@/components/organisms/modals/LeaveRequestDetailModal';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';

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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-3 sm:px-0'>
      <div className='bg-white rounded-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 sm:p-6 border-b border-yellow-200'>
          <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3'>
            <div>
              <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                Submit a Complaint
              </h2>
              <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                Raise a concern or issue
              </p>
            </div>
            <button
              onClick={isSubmitting ? undefined : handleClose}
              className='justify-self-start sm:justify-self-end text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='w-full p-4 sm:p-6'>
          <form onSubmit={handleSubmit} className='space-y-5 sm:space-y-6'>
            {/* Title */}
            <div>
              <label className='block mb-2 font-medium text-sm sm:text-base'>
                Complaint Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className={`w-full border rounded-lg p-3 text-sm sm:text-base ${
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
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className='block mb-2 font-medium text-sm sm:text-base'>
                Complaint Details <span className='text-red-500'>*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg p-3 text-sm sm:text-base ${
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
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Type and Priority */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <label className='block mb-2 font-medium text-sm sm:text-base'>
                  Complaint Type <span className='text-red-500'>*</span>
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
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
                <label className='block mb-2 font-medium text-sm sm:text-base'>
                  Priority <span className='text-red-500'>*</span>
                </label>
                <select
                  className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
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
              <label className='block mb-2 font-medium text-sm sm:text-base'>
                Recipient Type <span className='text-red-500'>*</span>
              </label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base'
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
              <label className='block mb-2 font-medium text-sm sm:text-base'>
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
                      <div className='flex items-center space-x-2 min-w-0'>
                        <span className='text-sm truncate'>{file.name}</span>
                        <span className='text-xs text-gray-500 whitespace-nowrap'>
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
                        className={`text-red-500 hover:text-red-700 ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit buttons */}
            <div className='flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4'>
              <Button
                type='button'
                onClick={isSubmitting ? undefined : handleClose}
                className={`w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FileText className='h-4 w-4' />
                    <span>Submit Complaint</span>
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
      if (complaint.responses && complaint.responses.length > 0) {
        setResponses(complaint.responses);
        setLoading(false);
        return;
      }

      const response = await complaintService.getResponses(complaint.id);
      if (response.success && response.data) {
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

  if (!complaint) return null;

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-3 sm:px-0'>
      <div className='bg-white rounded-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 sm:p-6 border-b border-yellow-200'>
          <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3'>
            <div>
              <div className='mb-2 flex flex-wrap items-center gap-2'>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium 
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
                <span className='inline-block px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-blue-100 text-blue-700'>
                  {complaint.type?.toLowerCase() || 'unknown'}
                </span>
              </div>

              <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                {complaint.title || 'Untitled Complaint'}
              </h2>

              <div className='mt-2 text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2'>
                <span className='font-medium'>From:</span>
                <span>{complaint.complainant?.fullName || 'Unknown'}</span>
                <span className='inline-block w-1 h-1 rounded-full bg-gray-400' />
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

              <div className='mt-2 text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2'>
                <span>By {complaint.complainant?.fullName || 'Unknown'}</span>
                <span className='inline-block w-1 h-1 rounded-full bg-gray-400' />
                <span>
                  {complaint.createdAt
                    ? new Date(complaint.createdAt).toLocaleDateString()
                    : 'Unknown date'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className='bg-white h-8 w-8 p-1 rounded-full shadow-sm hover:shadow-lg'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 space-y-4'>
          {/* Recipients */}
          <div className='bg-gray-50 p-3 sm:p-4 rounded-lg'>
            <div className='text-sm font-medium text-gray-700 mb-1'>
              Recipient:
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='inline-block px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-purple-100 text-purple-700'>
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
              <h3 className='text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-gray-700'>
                <FileText className='w-5 h-5 text-blue-600' />
                Attachments ({complaint.attachments.length})
              </h3>

              <ul className='space-y-2'>
                {complaint.attachments.map(
                  (attachment: ComplaintAttachment) => (
                    <li
                      key={attachment.id}
                      className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50'
                    >
                      <div className='flex items-center gap-2 min-w-0'>
                        <FileText className='w-5 h-5 text-blue-500' />
                        <span className='text-sm text-gray-700 truncate'>
                          {attachment.originalName}
                        </span>
                      </div>

                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded text-[11px] sm:text-xs font-medium inline-flex items-center gap-1'>
                          <FileText className='w-4 h-4' />
                          {attachment.mimeType?.split('/')[1]?.toUpperCase() ||
                            'FILE'}
                        </span>
                        <a
                          href={attachment.url}
                          target='_blank'
                          rel='noreferrer'
                          className='w-full sm:w-auto text-center bg-blue-600 text-white px-3 py-1 rounded text-[11px] sm:text-xs font-medium hover:bg-blue-700 inline-flex items-center justify-center gap-1'
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
            <h4 className='font-medium mb-2 flex items-center text-sm sm:text-base'>
              <MessageSquare className='h-4 w-4 mr-2' />
              Responses ({responses.length})
            </h4>
            {loading ? (
              <div className='text-center py-4'>Loading responses...</div>
            ) : responses.length > 0 ? (
              <div className='space-y-3'>
                {responses.map(response => (
                  <div key={response.id} className='bg-gray-50 p-3 rounded'>
                    <div className='flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-start mb-2'>
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
          <div className='flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 text-sm text-gray-500 pt-4 border-t border-gray-200 mt-6'>
            <div className='flex flex-col gap-1'>
              <div className='font-medium text-gray-700'>Complaint Status:</div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-[11px] sm:text-xs'>
                  Status: {complaint.status?.toLowerCase() || 'unknown'}
                </span>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
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
                          window.location.reload();
                        } else {
                          toast.error('Failed to resolve complaint');
                        }
                      } catch (error) {
                        console.error('Error resolving complaint:', error);
                        toast.error('Failed to resolve complaint');
                      }
                    }}
                    className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm'
                  >
                    <CheckCircle className='h-4 w-4' />
                    <span>Resolve</span>
                  </button>
                )}

              <button
                onClick={onClose}
                className='w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm'
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

const ComplaintsAndLeavePage = () => {
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
  const [leaveRequestModalOpen, setLeaveRequestModalOpen] = useState(false);
  const [leaveRequestDetailModalOpen, setLeaveRequestDetailModalOpen] =
    useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [cancelConfirmationModalOpen, setCancelConfirmationModalOpen] =
    useState(false);
  const [leaveRequestToCancel, setLeaveRequestToCancel] = useState<any>(null);
  const [leaveRequestToReject, setLeaveRequestToReject] = useState<any>(null);
  const [rejectReasonModalOpen, setRejectReasonModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    leaveRequests: realLeaveRequests,
    loading: leaveRequestsLoading,
    fetchLeaveRequests,
    cancelLeaveRequest,
    approveByParent,
    approveByTeacher,
    rejectByParent,
    rejectByTeacher,
  } = useLeaveRequests();

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadComplaints();
    loadLeaveRequests();
  }, []);

  useEffect(() => {
    if (realLeaveRequests) {
      setLeaveRequests(realLeaveRequests);
    }
  }, [realLeaveRequests]);

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

  const loadLeaveRequests = async () => {
    try {
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Failed to load leave requests');
    }
  };

  const handleViewLeaveRequest = (leaveRequest: any) => {
    setSelectedLeaveRequest(leaveRequest);
    setLeaveRequestDetailModalOpen(true);
  };

  const handleApproveLeaveRequest = async (leaveRequestId: string) => {
    try {
      await approveByParent(leaveRequestId);
      toast.success('Leave request approved successfully');
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleParentApprove = async (leaveRequestId: string) => {
    try {
      await approveByParent(leaveRequestId);
      toast.success('Leave request approved by parent successfully');
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleTeacherApprove = async (leaveRequestId: string) => {
    try {
      await approveByTeacher(leaveRequestId);
      toast.success('Leave request approved by teacher successfully');
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleRejectLeaveRequest = async (
    leaveRequestId: string,
    reason: string,
    rejectorRole?: 'parent' | 'teacher',
  ) => {
    try {
      if (rejectorRole === 'teacher' || user?.role === 'TEACHER') {
        await rejectByTeacher(leaveRequestId, reason);
        toast.success('Leave request rejected by teacher successfully');
      } else {
        await rejectByParent(leaveRequestId, reason);
        toast.success('Leave request rejected by parent successfully');
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error('Failed to reject leave request');
    }
  };

  const handleCancelLeaveRequest = async (leaveRequestId: string) => {
    try {
      await cancelLeaveRequest(leaveRequestId);
      toast.success('Leave request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling leave request:', error);

      if (error instanceof Error) {
        if (
          error.message.includes(
            'Cannot cancel leave request after approval process has started',
          )
        ) {
          toast.error(
            'Cannot cancel leave request after approval process has started',
          );
        } else if (error.message.includes('Forbidden')) {
          toast.error(
            'Cannot cancel leave request after approval process has started',
          );
        } else {
          toast.error(error.message || 'Failed to cancel leave request');
        }
      } else {
        toast.error('Failed to cancel leave request');
      }
    }
  };

  const refreshLeaveRequests = () => {
    loadLeaveRequests();
  };

  const handleLeaveRequestSuccess = () => {
    window.location.reload();
  };

  const handleSubmitComplaint = async (
    complaintData: CreateComplaintRequest,
    attachments: File[] = [],
  ) => {
    try {
      const response = await complaintService.createComplaint(complaintData);

      if (response.success && response.data) {
        const complaintId =
          (response.data as any).complaint?.id || (response.data as any).id;

        if (!complaintId) {
          throw new Error('Failed to get complaint ID from response');
        }

        if (attachments.length > 0) {
          try {
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

        await loadComplaints();
      } else {
        throw new Error('Failed to create complaint');
      }
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  };

  const handleViewComplaint = async (complaint: Complaint) => {
    try {
      if (
        !complaint.id ||
        complaint.id === 'undefined' ||
        complaint.id === 'null'
      ) {
        toast.error('Invalid complaint ID');
        return;
      }

      let complaintWithResponses = { ...complaint };
      try {
        const response = await complaintService.getResponses(complaint.id);
        if (response.success && response.data) {
          const responsesData =
            (response.data as any).responses || response.data;
          complaintWithResponses = { ...complaint, responses: responsesData };
        }
      } catch (responseError) {
        console.error('Error fetching responses:', responseError);
      }

      setSelectedComplaint(complaintWithResponses);
      setComplaintDetailModalOpen(true);
    } catch (error) {
      console.error('Error in handleViewComplaint:', error);
      toast.error('Failed to open complaint details');
    }
  };

  const handleCancelComplaint = async (complaint: Complaint) => {
    if (complaint.complainantId !== user?.id) {
      toast.error('You can only cancel complaints that you created');
      return;
    }

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
    if (complaint.recipientId !== user?.id) {
      toast.error(
        'You can only resolve complaints where you are the recipient',
      );
      return;
    }

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  interface CardListProps {
    title: string;
    items: Complaint[];
  }

  const CardList = ({ title, items }: CardListProps) => (
    <div className='mb-8'>
      <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 mb-4'>
        <h4 className='text-lg sm:text-xl font-semibold text-slate-800'>
          {title}
        </h4>
        <span className='justify-self-start sm:justify-self-end text-sm text-slate-500'>
          {items.length} items
        </span>
      </div>
      <div className='space-y-4'>
        {items.length === 0 ? (
          <div className='text-center py-10 sm:py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4'>
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
              className='group bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl'
            >
              {/* Header (responsive) */}
              <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 mb-4'>
                {/* Left: content */}
                <div className='min-w-0'>
                  <h3 className='font-semibold text-slate-900 text-sm sm:text-lg mb-1.5 line-clamp-2 break-words'>
                    {complaint.title || 'Untitled Complaint'}
                  </h3>

                  <div className='space-y-1 sm:space-y-2'>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      <span className='font-medium'>From:</span>{' '}
                      {complaint.complainant?.fullName || 'Unknown'}
                    </div>

                    <div className='text-xs sm:text-sm text-gray-600'>
                      <span className='font-medium'>To:</span>{' '}
                      {complaint.recipientType === 'ADMINISTRATION'
                        ? 'Administration'
                        : complaint.recipientType === 'PARENT'
                          ? 'Parent'
                          : complaint.recipientType === 'CLASS_TEACHER'
                            ? 'Class Teacher'
                            : 'Unknown'}
                      {complaint.assignedTo && (
                        <span className='ml-1.5 text-gray-500'>
                          ({complaint.assignedTo.fullName})
                        </span>
                      )}
                    </div>

                    {/* Date • Type • Priority */}
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600'>
                      <span className='inline-flex items-center gap-1.5'>
                        <CalendarDays className='h-4 w-4 shrink-0' />
                        <time
                          dateTime={new Date(complaint.createdAt).toISOString()}
                        >
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </time>
                      </span>

                      <span className='inline-flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-blue-500' />
                        {complaintService.getTypeLabel(complaint.type)}
                      </span>

                      <span className='inline-flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-orange-500' />
                        {complaintService.getPriorityLabel(complaint.priority)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: status */}
                <div className='sm:ml-4 sm:justify-self-end'>
                  <span className='inline-block bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium capitalize'>
                    {complaint.status?.toLowerCase() || 'unknown'}
                  </span>
                </div>
              </div>

              {/* Footer/actions (responsive) */}
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500'>
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

                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                  <Button
                    onClick={() => handleViewComplaint(complaint)}
                    className='w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2.5 rounded-lg hover:from-slate-700 hover:to-slate-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                  >
                    <Eye className='h-4 w-4' />
                    <span>View Details</span>
                  </Button>

                  {user &&
                    complaint.recipientId === user.id &&
                    (complaint.status === 'OPEN' ||
                      complaint.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => handleResolveComplaint(complaint)}
                        className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                      >
                        <CheckCircle className='h-4 w-4' />
                        <span>Resolve</span>
                      </Button>
                    )}

                  {user &&
                    complaint.complainantId === user.id &&
                    (complaint.status === 'OPEN' ||
                      complaint.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => handleCancelComplaint(complaint)}
                        className='w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                      >
                        <X className='h-4 w-4' />
                        <span>Cancel</span>
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
          <div className='p-4 sm:p-6 border-b border-slate-200 bg-slate-50'>
            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-slate-800'>
                  Complaints Overview
                </h3>
                <p className='text-slate-600 text-sm mt-1'>
                  Track and manage your submitted complaints
                </p>
              </div>
              <div className='flex items-center gap-3 justify-self-start sm:justify-self-end'>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Total Complaints</p>
                  <p className='text-2xl font-bold text-slate-800'>
                    {complaints.length}
                  </p>
                </div>
                <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                  <AlertCircle className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </div>
          </div>
          <div className='w-full p-4 sm:p-6'>
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
          <div className='p-4 sm:p-6 border-b border-slate-200 bg-slate-50'>
            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-slate-800'>
                  Leave Requests Overview
                </h3>
                <p className='text-slate-600 text-sm mt-1'>
                  Track and manage your submitted leave requests
                </p>
              </div>
              <div className='flex items-center gap-3 justify-self-start sm:justify-self-end'>
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Total Requests</p>
                  <p className='text-2xl font-bold text-slate-800'>
                    {leaveRequests.filter(l => l.status !== 'CANCELLED').length}
                  </p>
                </div>
                <div className='w-px h-8 bg-slate-300' />
                <div className='text-right'>
                  <p className='text-sm text-slate-600'>Pending</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    {
                      leaveRequests.filter(l => {
                        if (user?.role === 'TEACHER') {
                          return l.status === 'PENDING_TEACHER_APPROVAL';
                        } else if (user?.role === 'PARENT') {
                          return l.status === 'PENDING_PARENT_APPROVAL';
                        } else {
                          return (
                            l.status === 'PENDING_PARENT_APPROVAL' ||
                            l.status === 'PENDING_TEACHER_APPROVAL'
                          );
                        }
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='w-full p-4 sm:p-6'>
            {leaveRequestsLoading ? (
              <div className='text-center py-8'>Loading leave requests...</div>
            ) : leaveRequests.length === 0 ? (
              <div className='text-center py-10 sm:py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4'>
                <div className='w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <CalendarDays className='h-8 w-8 text-slate-400' />
                </div>
                <p className='text-slate-500 font-medium'>
                  No leave requests found
                </p>
                <p className='text-slate-400 text-sm mt-1'>
                  When you submit leave requests, they'll appear here
                </p>
              </div>
            ) : (
              <>
                {/* Pending / Active */}
                <div className='mb-8'>
                  <h4 className='text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-4'>
                    {user?.role === 'TEACHER'
                      ? 'Parent-Approved Leave Requests'
                      : user?.role === 'PARENT'
                        ? 'Pending Leave Requests'
                        : 'Active Leave Requests'}
                  </h4>
                  <p className='text-slate-600 text-sm mb-3 sm:mb-4'>
                    {user?.role === 'TEACHER'
                      ? 'These are leave requests approved by parents that require your approval.'
                      : user?.role === 'PARENT'
                        ? 'These are leave requests from your children that require your approval.'
                        : "These are your pending leave requests. You can cancel them if they haven't been approved by your parent yet."}
                  </p>

                  <div className='space-y-4'>
                    {leaveRequests.filter(l => {
                      if (user?.role === 'TEACHER') {
                        return l.status === 'PENDING_TEACHER_APPROVAL';
                      } else if (user?.role === 'PARENT') {
                        return l.status === 'PENDING_PARENT_APPROVAL';
                      } else {
                        return (
                          l.status === 'PENDING_PARENT_APPROVAL' ||
                          l.status === 'PENDING_TEACHER_APPROVAL'
                        );
                      }
                    }).length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4'>
                        <div className='w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <Clock className='h-6 w-6 text-slate-400' />
                        </div>
                        <p className='text-slate-500 font-medium'>
                          {user?.role === 'TEACHER'
                            ? 'No parent-approved leave requests'
                            : user?.role === 'PARENT'
                              ? 'No pending leave requests'
                              : 'No pending leave requests'}
                        </p>
                        <p className='text-slate-400 text-sm mt-1'>
                          {user?.role === 'TEACHER'
                            ? 'All leave requests are either pending parent approval or have been processed'
                            : user?.role === 'PARENT'
                              ? 'All leave requests have been processed'
                              : 'All your leave requests have been processed'}
                        </p>
                      </div>
                    ) : (
                      leaveRequests
                        .filter(l => {
                          if (user?.role === 'TEACHER') {
                            return l.status === 'PENDING_TEACHER_APPROVAL';
                          } else if (user?.role === 'PARENT') {
                            return l.status === 'PENDING_PARENT_APPROVAL';
                          } else {
                            return (
                              l.status === 'PENDING_PARENT_APPROVAL' ||
                              l.status === 'PENDING_TEACHER_APPROVAL'
                            );
                          }
                        })
                        .map(leaveRequest => (
                          <div
                            key={leaveRequest.id}
                            className='group bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            {/* Header */}
                            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 mb-4'>
                              <div className='min-w-0'>
                                <h3 className='font-semibold text-slate-800 text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-2 break-words'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3'>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    –{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full' />
                                    {leaveRequest.type}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-yellow-500 rounded-full' />
                                    {user?.role === 'TEACHER'
                                      ? 'Parent Approved - Awaiting Teacher'
                                      : leaveRequest.status ===
                                          'PENDING_PARENT_APPROVAL'
                                        ? 'Pending Parent Approval'
                                        : 'Pending Teacher Approval'}
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-xs sm:text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>

                              <div className='sm:ml-4 sm:justify-self-end'>
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
                                    user?.role === 'TEACHER'
                                      ? 'bg-green-50 text-green-700'
                                      : leaveRequest.status ===
                                          'PENDING_PARENT_APPROVAL'
                                        ? 'bg-yellow-50 text-yellow-700'
                                        : 'bg-blue-50 text-blue-700'
                                  }`}
                                >
                                  {user?.role === 'TEACHER'
                                    ? 'Parent Approved'
                                    : leaveRequest.status ===
                                        'PENDING_PARENT_APPROVAL'
                                      ? 'Pending Parent Approval'
                                      : 'Pending Teacher Approval'}
                                </span>
                              </div>
                            </div>

                            {/* Footer/actions */}
                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                              <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500'>
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

                                {/* Role-Specific Action Buttons */}
                                {user?.role === 'PARENT' ? (
                                  <>
                                    <Button
                                      onClick={() =>
                                        handleParentApprove(leaveRequest.id)
                                      }
                                      className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                    >
                                      <CheckCircle className='h-4 w-4' />
                                      <span>Approve as Parent</span>
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setLeaveRequestToReject({
                                          ...leaveRequest,
                                          rejectorRole: 'parent',
                                        });
                                        setRejectReasonModalOpen(true);
                                      }}
                                      className='w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                    >
                                      <X className='h-4 w-4' />
                                      <span>Reject Request</span>
                                    </Button>
                                  </>
                                ) : user?.role === 'TEACHER' ? (
                                  <>
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
                                  </>
                                ) : (
                                  leaveRequest.status ===
                                    'PENDING_PARENT_APPROVAL' && (
                                    <Button
                                      onClick={() => {
                                        setLeaveRequestToCancel(leaveRequest);
                                        setCancelConfirmationModalOpen(true);
                                      }}
                                      className='w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 rounded-lg hover:from-amber-700 hover:to-amber-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
                                    >
                                      <X className='h-4 w-4' />
                                      <span>Cancel Request</span>
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Approved */}
                <div className='mb-8'>
                  <h4 className='text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-4'>
                    Approved Leave Requests
                  </h4>
                  <div className='space-y-4'>
                    {leaveRequests.filter(l => l.status === 'APPROVED')
                      .length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4'>
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
                            className='group bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 mb-4'>
                              <div className='min-w-0'>
                                <h3 className='font-semibold text-slate-800 text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-2 break-words'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3'>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    –{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full' />
                                    {leaveRequest.type}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-green-500 rounded-full' />
                                    Approved
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-xs sm:text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>
                              <div className='sm:ml-4 sm:justify-self-end'>
                                <span className='inline-block bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium'>
                                  Approved
                                </span>
                              </div>
                            </div>

                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                              <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500'>
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

                              <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
                                <Button
                                  onClick={() =>
                                    handleViewLeaveRequest(leaveRequest)
                                  }
                                  className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
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

                {/* Rejected */}
                <div className='mb-2 sm:mb-8'>
                  <h4 className='text-lg sm:text-xl font-semibold text-slate-800 mb-2 sm:mb-4'>
                    Rejected Leave Requests
                  </h4>
                  <div className='space-y-4'>
                    {leaveRequests.filter(l => l.status === 'REJECTED')
                      .length === 0 ? (
                      <div className='text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 px-4'>
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
                            className='group bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl'
                          >
                            <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:gap-4 mb-4'>
                              <div className='min-w-0'>
                                <h3 className='font-semibold text-slate-800 text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-2 break-words'>
                                  {leaveRequest.title}
                                </h3>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Type:</span>{' '}
                                  {leaveRequest.type}
                                </div>
                                <div className='text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2'>
                                  <span className='font-medium'>Duration:</span>{' '}
                                  {leaveRequest.days} day
                                  {leaveRequest.days !== 1 ? 's' : ''}
                                </div>
                                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3'>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <CalendarDays className='h-4 w-4' />
                                    {new Date(
                                      leaveRequest.startDate,
                                    ).toLocaleDateString()}{' '}
                                    –{' '}
                                    {new Date(
                                      leaveRequest.endDate,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-blue-500 rounded-full' />
                                    {leaveRequest.type}
                                  </span>
                                  <span className='inline-flex items-center gap-1.5'>
                                    <span className='w-2 h-2 bg-red-500 rounded-full' />
                                    Rejected
                                  </span>
                                </div>
                                {leaveRequest.description && (
                                  <p className='text-slate-600 text-xs sm:text-sm line-clamp-2'>
                                    {leaveRequest.description}
                                  </p>
                                )}
                              </div>
                              <div className='sm:ml-4 sm:justify-self-end'>
                                <span className='inline-block bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium'>
                                  Rejected
                                </span>
                              </div>
                            </div>

                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                              <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500'>
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

                              <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
                                <Button
                                  onClick={() =>
                                    handleViewLeaveRequest(leaveRequest)
                                  }
                                  className='w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm'
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
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen p-4 sm:p-6'>
      {/* Conditionally render the appropriate complaint modal based on user role */}
      {user?.role === 'TEACHER' ? (
        <TeacherComplaintModal
          open={complaintModalOpen}
          onClose={() => setComplaintModalOpen(false)}
          onSubmit={handleSubmitComplaint}
        />
      ) : (
        <ComplaintModal
          open={complaintModalOpen}
          onClose={() => setComplaintModalOpen(false)}
          onSubmit={handleSubmitComplaint}
        />
      )}

      <LeaveRequestModal
        open={leaveRequestModalOpen}
        onClose={() => setLeaveRequestModalOpen(false)}
        onSuccess={refreshLeaveRequests}
      />

      <LeaveRequestDetailModal
        open={leaveRequestDetailModalOpen}
        onClose={() => {
          setLeaveRequestDetailModalOpen(false);
          setSelectedLeaveRequest(null);
        }}
        leaveRequest={selectedLeaveRequest}
        onApprove={handleApproveLeaveRequest}
        onReject={handleRejectLeaveRequest}
        onCancel={handleCancelLeaveRequest}
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-3 sm:px-0'>
          <div className='bg-white rounded-xl w-full max-w-md mx-auto shadow-xl'>
            {/* Header */}
            <div className='bg-gradient-to-r from-orange-50 to-orange-100 p-4 sm:p-6 border-b border-orange-200'>
              <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2'>
                <div>
                  <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                    Close Complaint
                  </h2>
                  <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                    This will mark the complaint as closed
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCancelModalOpen(false);
                    setComplaintToCancel(null);
                  }}
                  className='justify-self-start sm:justify-self-end text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='w-full p-4 sm:p-6'>
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
            <div className='flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200'>
              <Button
                onClick={() => {
                  setCancelModalOpen(false);
                  setComplaintToCancel(null);
                }}
                className='w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400'
              >
                No, Keep Active
              </Button>
              <Button
                onClick={confirmCancelComplaint}
                className='w-full sm:w-auto bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700'
              >
                Yes, Close Complaint
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cancel Confirmation Modal */}
      {cancelConfirmationModalOpen && leaveRequestToCancel && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-3 sm:px-0 animate-in fade-in duration-200'>
          <div className='bg-white rounded-xl w-full max-w-md mx-auto shadow-xl animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='bg-gradient-to-r from-orange-50 to-orange-100 p-4 sm:p-6 border-b border-orange-200'>
              <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center'>
                    <X className='h-5 w-5 text-orange-600' />
                  </div>
                  <div>
                    <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                      Cancel Leave Request
                    </h2>
                    <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCancelConfirmationModalOpen(false);
                    setLeaveRequestToCancel(null);
                  }}
                  className='justify-self-start sm:justify-self-end text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='w-full p-4 sm:p-6'>
              <div className='mb-6'>
                <div className='flex items-start gap-3 mb-4'>
                  <div className='w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                    <AlertCircle className='h-4 w-4 text-orange-600' />
                  </div>
                  <div>
                    <p className='text-gray-700 font-medium'>
                      Are you sure you want to cancel this leave request?
                    </p>
                  </div>
                </div>

                <div className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                  <h3 className='font-semibold text-gray-800 text-base sm:text-lg mb-2'>
                    {leaveRequestToCancel.title}
                  </h3>
                  <div className='flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600'>
                    <span className='flex items-center gap-1'>
                      <span className='w-2 h-2 bg-blue-500 rounded-full' />
                      {leaveRequestToCancel.type}
                    </span>
                    <span className='flex items-center gap-1'>
                      <CalendarDays className='h-4 w-4' />
                      {leaveRequestToCancel.days} day
                      {leaveRequestToCancel.days !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className='text-xs sm:text-sm text-gray-500 mt-2'>
                    {new Date(
                      leaveRequestToCancel.startDate,
                    ).toLocaleDateString()}{' '}
                    –{' '}
                    {new Date(
                      leaveRequestToCancel.endDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                    <AlertCircle className='h-3 w-3 text-orange-600' />
                  </div>
                  <div>
                    <p className='text-sm text-orange-800 font-medium mb-1'>
                      Important Note
                    </p>
                    <p className='text-sm text-orange-700'>
                      Once cancelled, this leave request will no longer be
                      active and cannot be reactivated. You'll need to submit a
                      new request if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50'>
              <Button
                onClick={() => {
                  setCancelConfirmationModalOpen(false);
                  setLeaveRequestToCancel(null);
                }}
                disabled={cancelling}
                className='w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all duration-200'
              >
                Keep Request
              </Button>
              <Button
                onClick={async () => {
                  setCancelling(true);
                  await handleCancelLeaveRequest(leaveRequestToCancel.id);
                  setCancelConfirmationModalOpen(false);
                  setLeaveRequestToCancel(null);
                  setCancelling(false);
                }}
                disabled={cancelling}
                className='w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all duration-200'
              >
                {cancelling ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent'>
              Requests & Complaints
            </h1>
            <p className='text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base'>
              Manage your complaints and leave requests efficiently
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto'></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8'>
        <div className='bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>
                Active Complaints
              </p>
              <p className='text-2xl sm:text-3xl font-bold text-slate-800 mt-1'>
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

        <div className='bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>Resolved</p>
              <p className='text-2xl sm:text-3xl font-bold text-slate-800 mt-1'>
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

        <div className='bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-slate-600 text-sm font-medium'>
                Pending Leave
              </p>
              <p className='text-2xl sm:text-3xl font-bold text-slate-800 mt-1'>
                {
                  leaveRequests.filter(
                    l =>
                      l.status === 'PENDING_PARENT_APPROVAL' ||
                      l.status === 'PENDING_TEACHER_APPROVAL',
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
            <span className='text-slate-500 ml-2'>parent approval</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mb-8'>
        <h2 className='text-lg sm:text-xl font-semibold text-slate-800 mb-3 sm:mb-4'>
          Quick Actions
        </h2>
        <div className='grid grid-cols-1 gap-4'>
          <button
            type='button'
            onClick={() => setLeaveRequestModalOpen(true)}
            className='group relative bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left'
          >
            <div className='flex items-start gap-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200'>
                <CalendarDays className='h-6 w-6 text-white' />
              </div>
              <div className='flex-1'>
                <h3 className='font-semibold text-slate-800 text-base sm:text-lg mb-1'>
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
        </div>
      </div>

      {/* Main Content */}
      <div className='bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden'>
        <Tabs tabs={tabs} defaultIndex={activeTab} />
      </div>

      {/* Reject Reason Modal */}
      {rejectReasonModalOpen && leaveRequestToReject && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-3 sm:px-0'>
          <div className='bg-white rounded-xl w-full max-w-md mx-auto shadow-xl'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-50 to-red-100 p-4 sm:p-6 border-b border-red-200'>
              <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2'>
                <div>
                  <h2 className='text-lg sm:text-xl font-bold text-gray-800'>
                    Reject Leave Request
                  </h2>
                  <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                    Provide a reason for rejection
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRejectReasonModalOpen(false);
                    setLeaveRequestToReject(null);
                  }}
                  className='justify-self-start sm:justify-self-end text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='w-full p-4 sm:p-6'>
              <div className='mb-4'>
                <h3 className='font-semibold text-gray-800 mb-2'>
                  Leave Request Details
                </h3>
                <div className='text-sm text-gray-600 space-y-1'>
                  <p>
                    <span className='font-medium'>Title:</span>{' '}
                    {leaveRequestToReject.title}
                  </p>
                  <p>
                    <span className='font-medium'>Type:</span>{' '}
                    {leaveRequestToReject.type}
                  </p>
                  <p>
                    <span className='font-medium'>Duration:</span>{' '}
                    {leaveRequestToReject.days} day
                    {leaveRequestToReject.days !== 1 ? 's' : ''}
                  </p>
                  <p>
                    <span className='font-medium'>Dates:</span>{' '}
                    {new Date(
                      leaveRequestToReject.startDate,
                    ).toLocaleDateString()}{' '}
                    –{' '}
                    {new Date(
                      leaveRequestToReject.endDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const reason = formData.get('reason') as string;

                  if (!reason.trim()) {
                    toast.error('Please provide a reason for rejection');
                    return;
                  }

                  try {
                    await handleRejectLeaveRequest(
                      leaveRequestToReject.id,
                      reason,
                      leaveRequestToReject.rejectorRole,
                    );
                    setRejectReasonModalOpen(false);
                    setLeaveRequestToReject(null);
                  } catch (error) {
                    console.error('Error rejecting leave request:', error);
                  }
                }}
                className='space-y-4'
              >
                <div>
                  <label className='block mb-2 font-medium'>
                    Rejection Reason <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    name='reason'
                    className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500'
                    rows={4}
                    placeholder='Explain why this leave request is being rejected...'
                    required
                  />
                </div>

                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2'>
                  <Button
                    type='button'
                    onClick={() => {
                      setRejectReasonModalOpen(false);
                      setLeaveRequestToReject(null);
                    }}
                    className='w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:from-gray-200 hover:to-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    className='w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-2.5 rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2'
                  >
                    <X className='h-4 w-4' />
                    <span>Reject Request</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsAndLeavePage;
