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
  TeacherLeaveCredit,
} from '@/api/services/teacher-leave.service';
import CreateTeacherLeaveRequestModal from '@/components/organisms/modals/CreateTeacherLeaveRequestModal';
import { toast } from 'sonner';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';

export default function MyLeavePage() {
  const { user } = useAuth();
  const [mainLoading, setMainLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<TeacherLeaveRequest[]>([]);
  const [leaveUsage, setLeaveUsage] = useState<LeaveUsage | null>(null);
  const [myCredits, setMyCredits] = useState<TeacherLeaveCredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'requests' | 'statistics' | 'credits'
  >('requests');
  const [cancelConfirmation, setCancelConfirmation] = useState<{
    isOpen: boolean;
    requestId: string;
    requestTitle: string;
  }>({ isOpen: false, requestId: '', requestTitle: '' });
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadLeaveData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'credits' && !creditsLoaded) {
      void loadMyCredits();
    }
  }, [activeTab, creditsLoaded]);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      const [requestsResponse, usageResponse] = await Promise.all([
        teacherLeaveService.getTeacherLeaveRequests(),
        teacherLeaveService.getMyLeaveUsage(),
      ]);
      setLeaveRequests(requestsResponse.teacherLeaveRequests || []);
      setLeaveUsage(usageResponse.usage);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      setLeaveRequests([]);
      setLeaveUsage(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCredits = async (force = false) => {
    if (!force && creditsLoaded) return;

    setCreditsLoading(true);
    try {
      const creditsResponse = await teacherLeaveService.getMyCredits();
      const rows = creditsResponse.credits || [];
      rows.sort(
        (a, b) =>
          new Date(b.creditedAt).getTime() - new Date(a.creditedAt).getTime(),
      );
      setMyCredits(rows);
      setCreditsLoaded(true);
    } catch (error) {
      console.error('Failed to load credit data:', error);
      setMyCredits([]);
      toast.error('Failed to load allocated credits');
    } finally {
      setCreditsLoading(false);
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

  const visibleUsageData =
    leaveUsage?.usageData?.filter(usageItem => {
      if (!usageItem?.leaveType?.requiresSubstituteCredit) return true;
      return Number(usageItem?.balance?.creditAvailable ?? 0) > 0;
    }) || [];

  const totalAllocatedCredits = myCredits.reduce(
    (sum, credit) => sum + Number(credit.days || 0),
    0,
  );
  const totalAvailableCredits =
    leaveUsage?.usageData?.reduce((sum, usageItem) => {
      if (!usageItem?.leaveType?.requiresSubstituteCredit) return sum;
      return sum + Number(usageItem?.balance?.creditAvailable ?? 0);
    }, 0) || 0;
  const totalConsumedCredits = Math.max(
    totalAllocatedCredits - totalAvailableCredits,
    0,
  );

  // Tabs configuration using the generic tabs component
  const tabs = [
    {
      name: 'Leave Requests',
      content: (
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
                    <div key={i} className='h-20 bg-gray-200 rounded-lg'></div>
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
                            <span className='text-gray-500'>Leave Type:</span>
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
                                    {attachment.originalName || 'Unknown File'}
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
                            className='px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white border border-rose-600 rounded-lg text-sm font-medium hover:from-rose-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2'
                          >
                            <Trash2 className='w-4 h-4' />
                            <span>Cancel Request</span>
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
      ),
    },
    {
      name: 'Statistics',
      content: (
        <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
          {/* Leave Usage Summary */}
          {leaveUsage && visibleUsageData.length > 0 ? (
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <SectionTitle
                text='Leave Usage Summary'
                level={2}
                className='text-lg font-semibold text-gray-900 mb-4'
              />
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {visibleUsageData.map(usageItem => {
                  if (!usageItem || !usageItem.leaveType) {
                    return null;
                  }

                  const maxDays = Number(usageItem.leaveType?.maxDays || 0);
                  const entitlementDays =
                    usageItem.balance?.entitlementDays ?? maxDays;
                  const usedDays =
                    usageItem.balance?.usedDays ??
                    Number(usageItem.usage?.yearlyUsage || 0);
                  const remainingDays =
                    usageItem.balance?.remainingDays ??
                    Math.max(entitlementDays - usedDays, 0);
                  const periodLabel =
                    usageItem.balance?.periodLabel || 'Current period';
                  const carryForwardDays =
                    usageItem.balance?.carryForwardDays || 0;
                  const creditAvailable = usageItem.balance?.creditAvailable;
                  const isCreditBased =
                    usageItem.leaveType?.requiresSubstituteCredit === true;
                  const availableCredits = Math.max(
                    Number(creditAvailable ?? 0),
                    0,
                  );
                  const displayRemainingDays = isCreditBased
                    ? availableCredits
                    : remainingDays;

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
                          <span className='text-gray-600'>Entitlement:</span>
                          <span className='font-medium'>
                            {isCreditBased
                              ? 'Credit based'
                              : `${entitlementDays} days`}
                          </span>
                        </div>
                        {carryForwardDays > 0 && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>
                              Carry forward:
                            </span>
                            <span className='font-medium'>
                              {carryForwardDays} days
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Used:</span>
                          <span className='font-medium'>{usedDays} days</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Remaining:</span>
                          <span className='font-medium text-green-600'>
                            {displayRemainingDays} days
                          </span>
                        </div>
                        {creditAvailable !== null &&
                          creditAvailable !== undefined && (
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>Credits:</span>
                              <span className='font-medium'>
                                {creditAvailable} days
                              </span>
                            </div>
                          )}
                        <div className='text-xs text-gray-500 mt-2'>
                          {periodLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : leaveUsage && visibleUsageData.length === 0 ? (
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
      ),
    },
    {
      name: 'Allocated Credits',
      content: (
        <div className='space-y-4 sm:space-y-5 lg:space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='bg-white rounded-lg border border-gray-200 p-4'>
              <p className='text-sm text-gray-600'>Total Allocated</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {totalAllocatedCredits} days
              </p>
            </div>
            <div className='bg-white rounded-lg border border-gray-200 p-4'>
              <p className='text-sm text-gray-600'>Consumed</p>
              <p className='text-2xl font-semibold text-rose-600'>
                {totalConsumedCredits} days
              </p>
            </div>
            <div className='bg-white rounded-lg border border-gray-200 p-4'>
              <p className='text-sm text-gray-600'>Available</p>
              <p className='text-2xl font-semibold text-emerald-600'>
                {totalAvailableCredits} days
              </p>
            </div>
          </div>

          <div className='bg-white rounded-lg border border-gray-200'>
            <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
              <SectionTitle
                text='Allocated Credit History'
                level={2}
                className='text-lg font-semibold text-gray-900'
              />
              <Button
                onClick={() => loadMyCredits(true)}
                disabled={creditsLoading}
                className='px-3 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md disabled:opacity-50'
              >
                Refresh
              </Button>
            </div>

            {creditsLoading ? (
              <div className='p-6'>
                <div className='animate-pulse space-y-3'>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className='h-10 bg-gray-200 rounded-md'></div>
                  ))}
                </div>
              </div>
            ) : myCredits.length === 0 ? (
              <div className='p-6 text-center text-gray-600'>
                <p>No credits allocated yet by admin.</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Leave Type
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Allocated
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Source
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Credited On
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Expires On
                      </th>
                      <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {myCredits.map(credit => (
                      <tr key={credit.id}>
                        <td className='px-4 py-3 text-sm text-gray-900'>
                          {credit.leaveType?.name || 'Unknown'}
                        </td>
                        <td className='px-4 py-3 text-sm font-medium text-gray-900'>
                          {credit.days} days
                        </td>
                        <td className='px-4 py-3 text-sm'>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              credit.source === 'HOLIDAY_WORK'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {credit.source === 'HOLIDAY_WORK'
                              ? 'Holiday Work'
                              : 'Manual'}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-700'>
                          {formatDate(credit.creditedAt)}
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-700'>
                          {credit.expiresAt
                            ? formatDate(credit.expiresAt)
                            : '-'}
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-700 max-w-sm'>
                          {credit.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

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
            className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto'
          >
            <Plus className='w-4 h-4' />
            <span>Create Leave Request</span>
          </Button>
        </div>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full mt-4 sm:mt-5 lg:mt-6'>
          <div className='bg-white rounded-lg border border-gray-200 mb-6'>
            <div className='px-6 py-4'>
              <GenericTabs
                tabs={tabs}
                selectedIndex={
                  activeTab === 'statistics'
                    ? 1
                    : activeTab === 'credits'
                      ? 2
                      : 0
                }
                onChange={index => {
                  if (index === 1) {
                    setActiveTab('statistics');
                    return;
                  }
                  if (index === 2) {
                    setActiveTab('credits');
                    return;
                  }
                  setActiveTab('requests');
                }}
                className='w-full'
              />
            </div>
          </div>
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
                className='px-4 py-2.5 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium text-sm shadow-sm hover:shadow-md'
              >
                Keep Request
              </Button>
              <Button
                onClick={confirmCancelRequest}
                disabled={cancelLoading}
                className='px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-sm shadow-md hover:shadow-lg'
              >
                {cancelLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4' />
                    <span>Yes, Cancel Request</span>
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
