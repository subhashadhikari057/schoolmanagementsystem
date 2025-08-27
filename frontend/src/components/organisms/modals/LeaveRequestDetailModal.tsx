import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarDays,
  User,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types based on the schema
interface LeaveRequestAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface LeaveRequestAuditLog {
  id: string;
  action: string;
  details?: any;
  performedBy?: string;
  performedAt: string;
  performer?: {
    fullName: string;
    email: string;
  };
}

interface LeaveRequest {
  id: string;
  title: string;
  description?: string;
  type: 'SICK' | 'PERSONAL' | 'VACATION' | 'EMERGENCY' | 'MEDICAL' | 'FAMILY';
  status:
    | 'PENDING_PARENT_APPROVAL'
    | 'PENDING_TEACHER_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED';
  startDate: string;
  endDate: string;
  days: number;
  studentId: string;
  parentId?: string;
  teacherId?: string;
  parentApprovedAt?: string;
  teacherApprovedAt?: string;
  parentRejectedAt?: string;
  teacherRejectedAt?: string;
  parentRejectionReason?: string;
  teacherRejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  student: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
    class: {
      name: string;
      grade: number;
      section: string;
    };
    rollNumber: string;
  };
  parent?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  attachments: LeaveRequestAttachment[];
  auditLogs: LeaveRequestAuditLog[];
}

interface LeaveRequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequest | null;
  onApprove?: (leaveRequestId: string, reason?: string) => Promise<void>;
  onReject?: (leaveRequestId: string, reason: string) => Promise<void>;
  onCancel?: (leaveRequestId: string) => Promise<void>;
}

const LeaveRequestDetailModal: React.FC<LeaveRequestDetailModalProps> = ({
  open,
  onClose,
  leaveRequest,
  onApprove,
  onReject,
  onCancel,
}) => {
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!leaveRequest) return null;

  const canApprove = () => {
    if (!user || !user.role) {
      console.log('User or user.role is missing:', {
        user,
        userRole: user?.role,
      });
      return false;
    }

    console.log('Checking if user can approve:', {
      userRole: user.role,
      leaveRequestStatus: leaveRequest.status,
    });

    // Parent can approve if status is PENDING_PARENT_APPROVAL
    if (
      user.role === 'parent' &&
      leaveRequest.status === 'PENDING_PARENT_APPROVAL'
    ) {
      return true;
    }

    // Teacher can approve if status is PENDING_TEACHER_APPROVAL
    if (
      user.role === 'teacher' &&
      leaveRequest.status === 'PENDING_TEACHER_APPROVAL'
    ) {
      return true;
    }

    return false;
  };

  const canReject = () => {
    if (!user || !user.role) {
      console.log('User or user.role is missing:', {
        user,
        userRole: user?.role,
      });
      return false;
    }

    console.log('Checking if user can reject:', {
      userRole: user.role,
      leaveRequestStatus: leaveRequest.status,
    });

    // Parent can reject if status is PENDING_PARENT_APPROVAL
    if (
      user.role === 'parent' &&
      leaveRequest.status === 'PENDING_PARENT_APPROVAL'
    ) {
      return true;
    }

    // Teacher can reject if status is PENDING_TEACHER_APPROVAL
    if (
      user.role === 'teacher' &&
      leaveRequest.status === 'PENDING_TEACHER_APPROVAL'
    ) {
      return true;
    }

    return false;
  };

  const canCancel = () => {
    if (!user || !user.role) return false;

    // Students can only cancel if status is PENDING_PARENT_APPROVAL
    if (
      user.role === 'student' &&
      leaveRequest.status === 'PENDING_PARENT_APPROVAL'
    ) {
      return true;
    }

    return false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PARENT_APPROVAL':
        return 'bg-yellow-100 text-yellow-700';
      case 'PENDING_TEACHER_APPROVAL':
        return 'bg-blue-100 text-blue-700';
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PARENT_APPROVAL':
        return 'Pending Parent Approval';
      case 'PENDING_TEACHER_APPROVAL':
        return 'Pending Teacher Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SICK':
        return 'Sick Leave';
      case 'PERSONAL':
        return 'Personal Leave';
      case 'VACATION':
        return 'Vacation';
      case 'EMERGENCY':
        return 'Emergency Leave';
      case 'MEDICAL':
        return 'Medical Leave';
      case 'FAMILY':
        return 'Family Leave';
      default:
        return type;
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;

    try {
      setLoading(true);
      await onApprove(leaveRequest.id);
      toast.success('Leave request approved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to approve leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await onReject(leaveRequest.id, rejectionReason);
      toast.success('Leave request rejected successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to reject leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;

    try {
      setCancelling(true);
      await onCancel(leaveRequest.id);
      toast.success('Leave request cancelled successfully');
      setShowCancelConfirmation(false);
      onClose();
    } catch (error) {
      toast.error('Failed to cancel leave request');
    } finally {
      setCancelling(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leaveRequest.status)}`}
                >
                  {getStatusLabel(leaveRequest.status)}
                </span>
                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                  {getTypeLabel(leaveRequest.type)}
                </span>
              </div>
              <h2 className='text-xl font-bold text-gray-800'>
                {leaveRequest.title}
              </h2>
              <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                <CalendarDays className='h-4 w-4' />
                <span>
                  {new Date(leaveRequest.startDate).toLocaleDateString()} -{' '}
                  {new Date(leaveRequest.endDate).toLocaleDateString()}
                </span>
                <span className='text-blue-600 font-medium'>
                  ({leaveRequest.days} day{leaveRequest.days !== 1 ? 's' : ''})
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
        <div className='p-6 space-y-6'>
          {/* Description */}
          {leaveRequest.description && (
            <div>
              <h3 className='font-medium mb-2 flex items-center'>
                <AlertCircle className='h-4 w-4 mr-2' />
                Description
              </h3>
              <p className='text-gray-700 bg-gray-50 p-3 rounded-lg'>
                {leaveRequest.description}
              </p>
            </div>
          )}

          {/* Student Information */}
          <div>
            <h3 className='font-medium mb-3 flex items-center'>
              <User className='h-4 w-4 mr-2' />
              Student Information
            </h3>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-600'>Name</p>
                  <p className='font-medium text-gray-900'>
                    {leaveRequest.student.user.fullName}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Roll Number</p>
                  <p className='font-medium text-gray-900'>
                    {leaveRequest.student.rollNumber}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Class</p>
                  <p className='font-medium text-gray-900'>
                    Grade {leaveRequest.student.class.grade} -{' '}
                    {leaveRequest.student.class.section}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Email</p>
                  <p className='font-medium text-gray-900'>
                    {leaveRequest.student.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Flow */}
          <div>
            <h3 className='font-medium mb-3 flex items-center'>
              <CheckCircle className='h-4 w-4 mr-2' />
              Approval Flow
            </h3>
            <div className='space-y-3'>
              {/* Parent Approval */}
              <div className='flex items-center gap-3 p-3 bg-yellow-50 rounded-lg'>
                <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <User className='h-4 w-4 text-yellow-600' />
                </div>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900'>Parent Approval</p>
                  <p className='text-sm text-gray-600'>
                    {leaveRequest.parent
                      ? leaveRequest.parent.user.fullName
                      : 'Not assigned'}
                  </p>
                </div>
                <div className='text-right'>
                  {leaveRequest.status === 'PENDING_PARENT_APPROVAL' && (
                    <span className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium'>
                      Pending
                    </span>
                  )}
                  {leaveRequest.parentApprovedAt && (
                    <div>
                      <span className='bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium'>
                        Approved
                      </span>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(
                          leaveRequest.parentApprovedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {leaveRequest.parentRejectedAt && (
                    <div>
                      <span className='bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium'>
                        Rejected
                      </span>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(
                          leaveRequest.parentRejectedAt,
                        ).toLocaleDateString()}
                      </p>
                      {leaveRequest.parentRejectionReason && (
                        <p className='text-xs text-red-600 mt-1'>
                          Reason: {leaveRequest.parentRejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Approval */}
              <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <User className='h-4 w-4 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900'>Teacher Approval</p>
                  <p className='text-sm text-gray-600'>
                    {leaveRequest.teacher
                      ? leaveRequest.teacher.user.fullName
                      : 'Not assigned'}
                  </p>
                </div>
                <div className='text-right'>
                  {leaveRequest.status === 'PENDING_TEACHER_APPROVAL' && (
                    <span className='bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium'>
                      Pending
                    </span>
                  )}
                  {leaveRequest.teacherApprovedAt && (
                    <div>
                      <span className='bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium'>
                        Approved
                      </span>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(
                          leaveRequest.teacherApprovedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {leaveRequest.teacherRejectedAt && (
                    <div>
                      <span className='bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium'>
                        Rejected
                      </span>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(
                          leaveRequest.teacherRejectedAt,
                        ).toLocaleDateString()}
                      </p>
                      {leaveRequest.teacherRejectionReason && (
                        <p className='text-xs text-red-600 mt-1'>
                          Reason: {leaveRequest.teacherRejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {leaveRequest.attachments && leaveRequest.attachments.length > 0 && (
            <div>
              <h3 className='font-medium mb-3 flex items-center'>
                <FileText className='h-4 w-4 mr-2' />
                Attachments ({leaveRequest.attachments.length})
              </h3>
              <ul className='space-y-2'>
                {leaveRequest.attachments.map(attachment => (
                  <li
                    key={attachment.id}
                    className='flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50'
                  >
                    <div className='flex items-center gap-3'>
                      <FileText className='w-5 h-5 text-blue-500' />
                      <div>
                        <span className='text-sm text-gray-700 font-medium'>
                          {attachment.originalName}
                        </span>
                        <p className='text-xs text-gray-500'>
                          {formatFileSize(attachment.size)} •{' '}
                          {attachment.mimeType}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
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

          {/* Audit Logs */}
          {leaveRequest.auditLogs && leaveRequest.auditLogs.length > 0 && (
            <div>
              <h3 className='font-medium mb-3 flex items-center'>
                <Clock className='h-4 w-4 mr-2' />
                Activity History
              </h3>
              <div className='space-y-2'>
                {leaveRequest.auditLogs.map(log => (
                  <div key={log.id} className='bg-gray-50 p-3 rounded-lg'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <span className='font-medium text-sm text-gray-900'>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.details && (
                          <p className='text-xs text-gray-600 mt-1'>
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <div className='text-right'>
                        <span className='text-xs text-gray-500'>
                          {new Date(log.performedAt).toLocaleDateString()}
                        </span>
                        {log.performer && (
                          <p className='text-xs text-gray-600'>
                            by {log.performer.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(canApprove() || canReject()) && (
            <div className='border-t border-gray-200 pt-4'>
              <h3 className='font-medium mb-3'>Actions</h3>
              <div className='flex gap-3'>
                {canApprove() && (
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                  >
                    <CheckCircle className='h-4 w-4' />
                    Approve
                  </Button>
                )}

                {canReject() && !showRejectionForm && (
                  <Button
                    onClick={() => setShowRejectionForm(true)}
                    className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                  >
                    <XCircle className='h-4 w-4' />
                    Reject
                  </Button>
                )}

                {canCancel() && (
                  <Button
                    onClick={() => setShowCancelConfirmation(true)}
                    className='bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                  >
                    <X className='h-4 w-4' />
                    Cancel Request
                  </Button>
                )}
              </div>

              {/* Rejection Form */}
              {showRejectionForm && (
                <div className='mt-4 p-4 bg-red-50 rounded-lg border border-red-200'>
                  <h4 className='font-medium text-red-800 mb-2'>
                    Rejection Reason
                  </h4>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder='Please provide a reason for rejection...'
                    className='w-full p-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    rows={3}
                  />
                  <div className='flex gap-2 mt-3'>
                    <Button
                      onClick={handleReject}
                      disabled={loading || !rejectionReason.trim()}
                      className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg'
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectionForm(false);
                        setRejectionReason('');
                      }}
                      className='bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg'
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Modal */}
              {showCancelConfirmation && (
                <div className='mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200'>
                  <h4 className='font-medium text-orange-800 mb-2'>
                    Cancel Leave Request
                  </h4>
                  <p className='text-orange-700 text-sm mb-3'>
                    Are you sure you want to cancel this leave request? This
                    action cannot be undone.
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className='bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg'
                    >
                      {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                    <Button
                      onClick={() => setShowCancelConfirmation(false)}
                      className='bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg'
                    >
                      Keep Request
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className='flex justify-end pt-4 border-t border-gray-200'>
            <Button
              onClick={onClose}
              className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400'
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default LeaveRequestDetailModal;
