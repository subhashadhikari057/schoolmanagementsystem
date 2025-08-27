'use client';

import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { PageLoader } from '@/components/atoms/loading';
import {
  Plus,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  teacherLeaveService,
  TeacherLeaveRequest,
  LeaveUsage,
} from '@/api/services/teacher-leave.service';
import CreateTeacherLeaveRequestModal from '@/components/organisms/modals/CreateTeacherLeaveRequestModal';
import { toast } from 'sonner';

// Remove the duplicate interfaces since we're importing them from the service

export default function MyLeavePage() {
  const { user } = useAuth();
  const [mainLoading, setMainLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<TeacherLeaveRequest[]>([]);
  const [leaveUsage, setLeaveUsage] = useState<LeaveUsage | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'statistics'>(
    'requests',
  );
  const [cancelConfirmation, setCancelConfirmation] = useState<{
    isOpen: boolean;
    requestId: string;
    requestTitle: string;
  }>({ isOpen: false, requestId: '', requestTitle: '' });
  const [cancelLoading, setCancelLoading] = useState(false);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Load leave requests and usage data
  useEffect(() => {
    if (user?.id) {
      loadLeaveData();
    }
  }, [user]);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      // Load leave requests using the service
      const requestsResponse =
        await teacherLeaveService.getTeacherLeaveRequests();
      setLeaveRequests(requestsResponse.teacherLeaveRequests || []);

      // Load leave usage using the service
      const usageResponse = await teacherLeaveService.getMyLeaveUsage();
      setLeaveUsage(usageResponse.usage);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      // Set empty arrays/objects to prevent undefined errors
      setLeaveRequests([]);
      setLeaveUsage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (request: TeacherLeaveRequest) => {
    setCancelConfirmation({
      isOpen: true,
      requestId: request.id,
      requestTitle: request.title,
    });
  };

  const confirmCancelRequest = async () => {
    if (!cancelConfirmation.requestId) return;

    setCancelLoading(true);
    try {
      await teacherLeaveService.cancelTeacherLeaveRequest(
        cancelConfirmation.requestId,
      );
      toast.success('Leave request cancelled successfully');
      setCancelConfirmation({ isOpen: false, requestId: '', requestTitle: '' });
      await loadLeaveData(); // Refresh the data
    } catch (error: any) {
      console.error('Failed to cancel leave request:', error);
      const errorMessage =
        error?.response?.data?.message || 'Failed to cancel leave request';
      toast.error(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancelRequest = (request: TeacherLeaveRequest): boolean => {
    return request.status === 'PENDING_ADMINISTRATION';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      case 'PENDING_ADMINISTRATION':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className='w-4 h-4' />;
      case 'REJECTED':
        return <XCircle className='w-4 h-4' />;
      case 'CANCELLED':
        return <XCircle className='w-4 h-4' />;
      case 'PENDING_ADMINISTRATION':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (mainLoading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
          <div className='flex-1'>
            <SectionTitle
              text='My Leave'
              level={1}
              className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
            />
            <Label className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
              Manage your leave requests and track your leave usage
            </Label>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center'
          >
            <Plus className='w-4 h-4' />
            <span>New Leave Request</span>
          </Button>
        </div>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto mt-4 sm:mt-5 lg:mt-6'>
          {/* Tab Navigation */}
          <div className='bg-white rounded-lg border border-gray-200 mb-6'>
            <div className='px-6 py-4'>
              <nav className='flex space-x-6' aria-label='Tabs'>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                    activeTab === 'requests'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Leave Requests
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                    activeTab === 'statistics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Statistics
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'requests' && (
            <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
              {/* Leave Requests */}
              <div className='bg-white rounded-lg border border-gray-200'>
                <div className='p-6 border-b border-gray-200'>
                  <SectionTitle
                    text='Leave Requests'
                    level={2}
                    className='text-lg font-semibold text-gray-900'
                  />
                </div>

                {loading ? (
                  <div className='p-6'>
                    <div className='animate-pulse space-y-4'>
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className='h-20 bg-gray-200 rounded-lg'
                        ></div>
                      ))}
                    </div>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className='p-6 text-center'>
                    <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No leave requests yet
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      You haven't submitted any leave requests. Click the button
                      above to create your first request.
                    </p>
                  </div>
                ) : (
                  <div className='divide-y divide-gray-200'>
                    {leaveRequests.map(request => (
                      <div
                        key={request.id}
                        className='p-6 hover:bg-gray-50 transition-colors'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-3 mb-2'>
                              <h3 className='text-lg font-medium text-gray-900'>
                                {request.title}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                              >
                                {getStatusIcon(request.status)}
                                {request.status.replace('_', ' ')}
                              </span>
                            </div>

                            {request.description && (
                              <p className='text-gray-600 mb-3'>
                                {request.description}
                              </p>
                            )}

                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                              <div>
                                <span className='text-gray-500'>
                                  Leave Type:
                                </span>
                                <p className='font-medium'>
                                  {request.leaveType?.name || 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <span className='text-gray-500'>Duration:</span>
                                <p className='font-medium'>
                                  {request.days || 0} day
                                  {(request.days || 0) !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div>
                                <span className='text-gray-500'>From:</span>
                                <p className='font-medium'>
                                  {request.startDate
                                    ? formatDate(request.startDate)
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className='text-gray-500'>To:</span>
                                <p className='font-medium'>
                                  {request.endDate
                                    ? formatDate(request.endDate)
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {request.rejectionReason && (
                              <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                <p className='text-sm text-red-800'>
                                  <strong>Rejection Reason:</strong>{' '}
                                  {request.rejectionReason}
                                </p>
                              </div>
                            )}

                            {request.attachments &&
                              request.attachments.length > 0 && (
                                <div className='mt-3'>
                                  <p className='text-sm text-gray-500 mb-2'>
                                    Attachments:
                                  </p>
                                  <div className='flex flex-wrap gap-2'>
                                    {request.attachments.map(attachment => (
                                      <a
                                        key={attachment.id || 'unknown'}
                                        href={attachment.url || '#'}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors'
                                      >
                                        <FileText className='w-3 h-3' />
                                        {attachment.originalName ||
                                          'Unknown File'}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className='flex flex-col items-end gap-3 ml-4'>
                            <div className='text-right text-sm text-gray-500'>
                              <p>Submitted</p>
                              <p className='font-medium'>
                                {request.createdAt
                                  ? formatDate(request.createdAt)
                                  : 'N/A'}
                              </p>
                            </div>

                            {canCancelRequest(request) && (
                              <Button
                                onClick={() => handleCancelRequest(request)}
                                disabled={cancelLoading}
                                className='px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 flex items-center gap-1.5'
                              >
                                <Trash2 className='w-4 h-4' />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
              {/* Leave Usage Summary */}
              {leaveUsage &&
              leaveUsage.usageData &&
              leaveUsage.usageData.length > 0 ? (
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <SectionTitle
                    text='Leave Usage Summary'
                    level={2}
                    className='text-lg font-semibold text-gray-900 mb-4'
                  />
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {leaveUsage.usageData.map(usageItem => {
                      // Add null checks for leaveType
                      if (!usageItem || !usageItem.leaveType) {
                        return null;
                      }

                      // Calculate usage values once to avoid repetition and ensure consistency
                      const maxDays = Number(usageItem.leaveType?.maxDays || 0);
                      const usedDays = Number(
                        usageItem.usage?.yearlyUsage || 0,
                      );
                      const remainingDays = maxDays - usedDays;

                      // Debug logging
                      console.log(
                        `Leave Type: ${usageItem.leaveType?.name}, MaxDays: ${maxDays}, UsedDays: ${usedDays}, Remaining: ${remainingDays}`,
                      );

                      return (
                        <div
                          key={usageItem.leaveType.id || 'unknown'}
                          className='bg-gray-50 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <h4 className='font-medium text-gray-900'>
                              {usageItem.leaveType.name || 'Unknown Leave Type'}
                            </h4>
                            {usageItem.leaveType.isPaid && (
                              <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
                                Paid
                              </span>
                            )}
                          </div>
                          <div className='space-y-1 text-sm'>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>
                                Entitlement:
                              </span>
                              <span className='font-medium'>
                                {maxDays} days
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>Used:</span>
                              <span className='font-medium'>
                                {usedDays} days
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>Remaining:</span>
                              <span className='font-medium text-green-600'>
                                {remainingDays} days
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : leaveUsage &&
                leaveUsage.usageData &&
                leaveUsage.usageData.length === 0 ? (
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <SectionTitle
                    text='Leave Usage Summary'
                    level={2}
                    className='text-lg font-semibold text-gray-900 mb-4'
                  />
                  <div className='text-center text-gray-600'>
                    <p>No leave usage data available.</p>
                  </div>
                </div>
              ) : (
                <div className='bg-white rounded-lg border border-gray-200 p-6'>
                  <SectionTitle
                    text='Leave Usage Summary'
                    level={2}
                    className='text-lg font-semibold text-gray-900 mb-4'
                  />
                  <div className='text-center text-gray-600'>
                    <p>Loading leave usage data...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelConfirmation.isOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                Cancel Leave Request
              </h2>
              <p className='text-gray-600'>
                Are you sure you want to cancel "
                {cancelConfirmation.requestTitle}"? This action cannot be
                undone.
              </p>
            </div>

            <div className='p-6 flex justify-end gap-3'>
              <Button
                onClick={() =>
                  setCancelConfirmation({
                    isOpen: false,
                    requestId: '',
                    requestTitle: '',
                  })
                }
                disabled={cancelLoading}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50'
              >
                Keep Request
              </Button>
              <Button
                onClick={confirmCancelRequest}
                disabled={cancelLoading}
                className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2'
              >
                {cancelLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4' />
                    Yes, Cancel Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Leave Request Modal */}
      <CreateTeacherLeaveRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadLeaveData}
      />
    </div>
  );
}
