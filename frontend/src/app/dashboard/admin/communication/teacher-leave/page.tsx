'use client';

import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { PageLoader } from '@/components/atoms/loading';
import {
  Users,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  adminTeacherLeaveService,
  AdminTeacherLeaveRequest,
  TeacherLeaveStatistics,
  AdminActionDto,
  CreateTeacherLeaveRequestByAdminDto,
  Teacher,
  LeaveType,
} from '@/api/services/admin-teacher-leave.service';
import { toast } from 'sonner';

export default function TeacherLeaveManagementPage() {
  const { user } = useAuth();
  const [mainLoading, setMainLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<
    AdminTeacherLeaveRequest[]
  >([]);
  const [filteredRequests, setFilteredRequests] = useState<
    AdminTeacherLeaveRequest[]
  >([]);
  const [statistics, setStatistics] = useState<TeacherLeaveStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Modal states
  const [selectedRequest, setSelectedRequest] =
    useState<AdminTeacherLeaveRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState('');

  // Create leave modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(
    null,
  );
  const [teacherLeaveUsage, setTeacherLeaveUsage] = useState<{
    totalUsage: number;
    yearlyUsage: number;
    monthlyUsage: number;
  } | null>(null);
  const [createFormData, setCreateFormData] = useState<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    days: number;
    adminCreationReason: string;
  }>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    days: 0,
    adminCreationReason: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Load leave requests and statistics
  useEffect(() => {
    if (user?.id) {
      loadLeaveData();
    }
  }, [user]);

  // Filter requests when search term or filters change
  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter, searchTerm, dateFilter]);

  // Load teachers and leave types when create modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      loadTeachersAndLeaveTypes();
    }
  }, [isCreateModalOpen]);

  // Load teacher leave usage when teacher and leave type are selected
  useEffect(() => {
    if (selectedTeacher && selectedLeaveType) {
      loadTeacherLeaveUsage(selectedTeacher.id, selectedLeaveType.id);
    }
  }, [selectedTeacher, selectedLeaveType]);

  // Calculate days when dates change
  useEffect(() => {
    if (createFormData.startDate && createFormData.endDate) {
      const days = calculateDays(
        createFormData.startDate,
        createFormData.endDate,
      );
      setCreateFormData(prev => ({ ...prev, days }));
    }
  }, [createFormData.startDate, createFormData.endDate]);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      const response =
        await adminTeacherLeaveService.getAllTeacherLeaveRequests();
      setLeaveRequests(response.teacherLeaveRequests || []);

      // Calculate statistics
      const stats = adminTeacherLeaveService.calculateStatistics(
        response.teacherLeaveRequests || [],
      );
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load teacher leave data:', error);
      toast.error('Failed to load teacher leave requests');
      setLeaveRequests([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachersAndLeaveTypes = async () => {
    try {
      const [teachersResponse, leaveTypesResponse] = await Promise.all([
        adminTeacherLeaveService.getAllTeachers(),
        adminTeacherLeaveService.getAllLeaveTypes(),
      ]);
      setTeachers(teachersResponse.teachers || []);
      setLeaveTypes(leaveTypesResponse.leaveTypes || []);
    } catch (error) {
      console.error('Failed to load teachers and leave types:', error);
      toast.error('Failed to load teachers and leave types');
    }
  };

  const loadTeacherLeaveUsage = async (
    teacherId: string,
    leaveTypeId: string,
  ) => {
    try {
      const usage = await adminTeacherLeaveService.getTeacherLeaveUsage(
        teacherId,
        leaveTypeId,
      );
      setTeacherLeaveUsage(usage);
    } catch (error) {
      console.error('Failed to load teacher leave usage:', error);
      setTeacherLeaveUsage(null);
    }
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;

    // Parse dates consistently - expect YYYY-MM-DD format
    const startDateMatch = startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const endDateMatch = endDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!startDateMatch || !endDateMatch) {
      return 0;
    }

    const [, startYear, startMonth, startDay] = startDateMatch.map(Number);
    const [, endYear, endMonth, endDay] = endDateMatch.map(Number);

    // Create dates in local timezone to avoid UTC issues (matching backend)
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    // Validate date objects
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    // Calculate difference in milliseconds and convert to days (matching backend)
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive

    return daysDiff > 0 ? daysDiff : 0;
  };

  const handleCreateLeave = async () => {
    if (!selectedTeacher || !selectedLeaveType) {
      toast.error('Please select a teacher and leave type');
      return;
    }

    if (!createFormData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!createFormData.adminCreationReason.trim()) {
      toast.error('Please provide a reason for creating this leave');
      return;
    }

    if (createFormData.days <= 0) {
      toast.error('Please select valid dates');
      return;
    }

    setCreateLoading(true);
    try {
      const createData: CreateTeacherLeaveRequestByAdminDto = {
        teacherId: selectedTeacher.id,
        title: createFormData.title,
        description: createFormData.description?.trim() || undefined,
        leaveTypeId: selectedLeaveType.id,
        startDate: createFormData.startDate,
        endDate: createFormData.endDate,
        days: createFormData.days,
        adminCreationReason: createFormData.adminCreationReason,
      };

      await adminTeacherLeaveService.createTeacherLeaveRequestByAdmin(
        createData,
      );

      toast.success('Leave request created successfully');
      setIsCreateModalOpen(false);
      resetCreateForm();
      await loadLeaveData();
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      const errorMessage =
        error?.response?.data?.message || 'Failed to create leave request';
      toast.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedTeacher(null);
    setSelectedLeaveType(null);
    setTeacherLeaveUsage(null);
    setCreateFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      days: 0,
      adminCreationReason: '',
    });
  };

  const filterRequests = () => {
    let filtered = [...leaveRequests];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        request =>
          request.title.toLowerCase().includes(term) ||
          request.teacher?.user?.fullName.toLowerCase().includes(term) ||
          request.teacher?.user?.email.toLowerCase().includes(term) ||
          request.leaveType?.name.toLowerCase().includes(term),
      );
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(request => {
        const requestDate = new Date(request.createdAt);
        switch (dateFilter) {
          case 'TODAY':
            return requestDate.toDateString() === new Date().toDateString();
          case 'WEEK':
            return requestDate >= startOfWeek;
          case 'MONTH':
            return requestDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
  };

  const handleViewRequest = (request: AdminTeacherLeaveRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleActionRequest = (
    request: AdminTeacherLeaveRequest,
    action: 'APPROVE' | 'REJECT',
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setRejectionReason('');
    setIsActionModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    // Validate rejection reason
    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(selectedRequest.id);
    try {
      const actionData: AdminActionDto = {
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        ...(actionType === 'REJECT' && {
          rejectionReason: rejectionReason.trim(),
        }),
      };

      await adminTeacherLeaveService.adminActionOnTeacherLeaveRequest(
        selectedRequest.id,
        actionData,
      );

      toast.success(
        `Leave request ${actionType === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      );

      // Close modal and refresh data
      setIsActionModalOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason('');

      await loadLeaveData();
    } catch (error: any) {
      console.error(
        `Failed to ${actionType.toLowerCase()} leave request:`,
        error,
      );
      const errorMessage =
        error?.response?.data?.message ||
        `Failed to ${actionType.toLowerCase()} leave request`;
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
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
    return adminTeacherLeaveService.formatDate(dateString);
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
              text='Teacher Leave Management'
              level={1}
              className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
            />
            <Label className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
              Review and manage teacher leave requests
            </Label>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-all duration-200 text-sm font-medium flex items-center gap-2 hover:shadow-sm'
            >
              <Users className='w-4 h-4' />
              Create Leave for Teacher
            </Button>
          </div>
        </div>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='w-full mt-4 sm:mt-5 lg:mt-6'>
          {/* Statistics Cards */}
          {statistics && (
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6'>
              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Total Requests</p>
                    <p className='text-2xl font-bold text-gray-900'>
                      {statistics.totalRequests}
                    </p>
                  </div>
                  <Users className='w-8 h-8 text-blue-600' />
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Pending</p>
                    <p className='text-2xl font-bold text-yellow-600'>
                      {statistics.pendingRequests}
                    </p>
                  </div>
                  <AlertCircle className='w-8 h-8 text-yellow-600' />
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Approved</p>
                    <p className='text-2xl font-bold text-green-600'>
                      {statistics.approvedRequests}
                    </p>
                  </div>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Rejected</p>
                    <p className='text-2xl font-bold text-red-600'>
                      {statistics.rejectedRequests}
                    </p>
                  </div>
                  <XCircle className='w-8 h-8 text-red-600' />
                </div>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>Cancelled</p>
                    <p className='text-2xl font-bold text-gray-600'>
                      {statistics.cancelledRequests}
                    </p>
                  </div>
                  <XCircle className='w-8 h-8 text-gray-600' />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className='bg-white rounded-lg border border-gray-200 mb-6'>
            <div className='p-4 border-b border-gray-200'>
              <div className='flex items-center gap-2 mb-4'>
                <Filter className='w-5 h-5 text-gray-500' />
                <h3 className='font-medium text-gray-900'>Filters</h3>
              </div>

              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                {/* Search */}
                <div className='relative flex-1 max-w-md'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search by teacher name, title, or leave type...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                {/* Filters - Right aligned with minimal gap */}
                <div className='flex justify-end gap-2'>
                  {/* Status Filter */}
                  <Dropdown
                    type='filter'
                    title='Status'
                    options={[
                      { value: 'ALL', label: 'All Status' },
                      {
                        value: 'PENDING_ADMINISTRATION',
                        label: 'Pending Review',
                      },
                      { value: 'APPROVED', label: 'Approved' },
                      { value: 'REJECTED', label: 'Rejected' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ]}
                    selectedValue={statusFilter}
                    onSelect={setStatusFilter}
                    placeholder='All Status'
                    className='min-w-[140px]'
                  />

                  {/* Date Filter */}
                  <Dropdown
                    type='filter'
                    title='Date Range'
                    options={[
                      { value: 'ALL', label: 'All Time' },
                      { value: 'TODAY', label: 'Today' },
                      { value: 'WEEK', label: 'This Week' },
                      { value: 'MONTH', label: 'This Month' },
                    ]}
                    selectedValue={dateFilter}
                    onSelect={setDateFilter}
                    placeholder='All Time'
                    className='min-w-[120px]'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Leave Requests */}
          <div className='bg-white rounded-lg border border-gray-200'>
            <div className='p-6 border-b border-gray-200'>
              <SectionTitle
                text={`Teacher Leave Requests (${filteredRequests.length})`}
                level={2}
                className='text-lg font-semibold text-gray-900'
              />
            </div>

            {loading ? (
              <div className='p-6'>
                <div className='animate-pulse space-y-4'>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className='h-24 bg-gray-200 rounded-lg'></div>
                  ))}
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className='p-6 text-center'>
                <Calendar className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No leave requests found
                </h3>
                <p className='text-gray-600'>
                  {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No teacher leave requests have been submitted yet.'}
                </p>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {filteredRequests.map(request => {
                  const statusInfo = adminTeacherLeaveService.getStatusInfo(
                    request.status,
                  );
                  const canTakeAction =
                    adminTeacherLeaveService.canTakeAction(request);

                  return (
                    <div
                      key={request.id}
                      className='p-6 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-3'>
                            <h3 className='text-lg font-medium text-gray-900'>
                              {request.title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color} ${statusInfo.bgColor} shadow-sm border-2 border-opacity-20 ${
                                request.status === 'APPROVED'
                                  ? 'border-emerald-300'
                                  : request.status === 'REJECTED'
                                    ? 'border-rose-300'
                                    : request.status === 'CANCELLED'
                                      ? 'border-gray-300'
                                      : 'border-yellow-300'
                              }`}
                            >
                              {getStatusIcon(request.status)}
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3'>
                            <div>
                              <span className='text-gray-500'>Teacher:</span>
                              <p className='font-medium'>
                                {request.teacher?.user?.fullName || 'Unknown'}
                              </p>
                              <p className='text-gray-600 text-xs'>
                                {request.teacher?.user?.email || ''}
                              </p>
                            </div>
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
                              <span className='text-gray-500'>Dates:</span>
                              <p className='font-medium'>
                                {formatDate(request.startDate)} -{' '}
                                {formatDate(request.endDate)}
                              </p>
                            </div>
                          </div>

                          {request.description && (
                            <p className='text-gray-600 text-sm mb-3'>
                              {request.description}
                            </p>
                          )}

                          {request.rejectionReason && (
                            <div className='mb-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                              <p className='text-sm text-red-800'>
                                <strong>Rejection Reason:</strong>{' '}
                                {request.rejectionReason}
                              </p>
                            </div>
                          )}

                          {request.attachments &&
                            request.attachments.length > 0 && (
                              <div className='mb-3'>
                                <p className='text-sm text-gray-500 mb-2'>
                                  Attachments:
                                </p>
                                <div className='flex flex-wrap gap-2'>
                                  {request.attachments.map(attachment => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-medium hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-sm'
                                    >
                                      <FileText className='w-3.5 h-3.5' />
                                      {attachment.originalName}
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
                              {formatDate(request.createdAt)}
                            </p>
                          </div>

                          <div className='flex items-center gap-1.5'>
                            <Button
                              onClick={() => handleViewRequest(request)}
                              className='px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-medium hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-sm flex items-center gap-1.5'
                            >
                              <Eye className='w-3.5 h-3.5' />
                              View
                            </Button>

                            {canTakeAction && (
                              <>
                                <Button
                                  onClick={() =>
                                    handleActionRequest(request, 'APPROVE')
                                  }
                                  disabled={actionLoading === request.id}
                                  className='px-2.5 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-xs font-medium hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                  <ThumbsUp className='w-3.5 h-3.5' />
                                  Approve
                                </Button>

                                <Button
                                  onClick={() =>
                                    handleActionRequest(request, 'REJECT')
                                  }
                                  disabled={actionLoading === request.id}
                                  className='px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-xs font-medium hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                  <ThumbsDown className='w-3.5 h-3.5' />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Request Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                Leave Request Details
              </h2>
              <p className='text-gray-600'>
                Review complete information about this leave request
              </p>
            </div>

            <div className='p-6'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Title
                  </label>
                  <p className='text-gray-900'>{selectedRequest.title}</p>
                </div>

                {selectedRequest.description && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Description
                    </label>
                    <p className='text-gray-900'>
                      {selectedRequest.description}
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Teacher
                    </label>
                    <p className='text-gray-900'>
                      {selectedRequest.teacher?.user?.fullName}
                    </p>
                    <p className='text-gray-600 text-sm'>
                      {selectedRequest.teacher?.user?.email}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Leave Type
                    </label>
                    <p className='text-gray-900'>
                      {selectedRequest.leaveType?.name}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Start Date
                    </label>
                    <p className='text-gray-900'>
                      {formatDate(selectedRequest.startDate)}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      End Date
                    </label>
                    <p className='text-gray-900'>
                      {formatDate(selectedRequest.endDate)}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Duration
                    </label>
                    <p className='text-gray-900'>
                      {selectedRequest.days} day
                      {selectedRequest.days !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${adminTeacherLeaveService.getStatusInfo(selectedRequest.status).color} ${adminTeacherLeaveService.getStatusInfo(selectedRequest.status).bgColor} shadow-sm border-2 border-opacity-20 ${
                        selectedRequest.status === 'APPROVED'
                          ? 'border-emerald-300'
                          : selectedRequest.status === 'REJECTED'
                            ? 'border-rose-300'
                            : selectedRequest.status === 'CANCELLED'
                              ? 'border-gray-300'
                              : 'border-yellow-300'
                      }`}
                    >
                      {getStatusIcon(selectedRequest.status)}
                      {
                        adminTeacherLeaveService.getStatusInfo(
                          selectedRequest.status,
                        ).label
                      }
                    </span>
                  </div>
                </div>

                {selectedRequest.rejectionReason && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Rejection Reason
                    </label>
                    <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                      <p className='text-red-800'>
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.attachments &&
                  selectedRequest.attachments.length > 0 && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Attachments
                      </label>
                      <div className='space-y-2'>
                        {selectedRequest.attachments.map(attachment => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-sm'
                          >
                            <FileText className='w-4 h-4 text-blue-600' />
                            <span className='text-sm text-blue-800 font-medium'>
                              {attachment.originalName}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className='p-6 border-t border-gray-200 flex justify-end gap-3'>
              <Button
                onClick={() => setIsViewModalOpen(false)}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all duration-200 text-sm font-medium'
              >
                Close
              </Button>

              {adminTeacherLeaveService.canTakeAction(selectedRequest) && (
                <>
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleActionRequest(selectedRequest, 'APPROVE');
                    }}
                    className='px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-all duration-200 text-sm font-medium flex items-center gap-2 hover:shadow-sm'
                  >
                    <ThumbsUp className='h-4 w-4' />
                    Approve
                  </Button>

                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleActionRequest(selectedRequest, 'REJECT');
                    }}
                    className='px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-md transition-all duration-200 text-sm font-medium flex items-center gap-2 hover:shadow-sm'
                  >
                    <ThumbsDown className='h-4 w-4' />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {isActionModalOpen && selectedRequest && actionType && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                {actionType === 'APPROVE' ? 'Approve' : 'Reject'} Leave Request
              </h2>
              <p className='text-gray-600'>
                Are you sure you want to{' '}
                {actionType === 'APPROVE' ? 'approve' : 'reject'} "
                {selectedRequest.title}" by{' '}
                {selectedRequest.teacher?.user?.fullName}?
              </p>
            </div>

            <div className='p-6'>
              {actionType === 'REJECT' && (
                <div>
                  <label
                    htmlFor='rejectionReason'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Rejection Reason <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    id='rejectionReason'
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder='Please provide a clear reason for rejection...'
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    required
                  />
                </div>
              )}
            </div>

            <div className='p-6 border-t border-gray-200 flex justify-end gap-3'>
              <Button
                onClick={() => {
                  setIsActionModalOpen(false);
                  setSelectedRequest(null);
                  setActionType(null);
                  setRejectionReason('');
                }}
                disabled={actionLoading === selectedRequest.id}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={actionLoading === selectedRequest.id}
                className={`px-4 py-2 text-white rounded-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-sm ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading === selectedRequest.id ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    {actionType === 'APPROVE' ? 'Approving...' : 'Rejecting...'}
                  </>
                ) : (
                  <>
                    {actionType === 'APPROVE' ? (
                      <ThumbsUp className='h-4 w-4' />
                    ) : (
                      <ThumbsDown className='h-4 w-4' />
                    )}
                    {actionType === 'APPROVE'
                      ? 'Approve Request'
                      : 'Reject Request'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Leave for Teacher Modal */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                Create Leave for Teacher
              </h2>
              <p className='text-gray-600'>
                Create a leave request on behalf of a teacher
              </p>
            </div>

            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Teacher Selection */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Teacher <span className='text-red-500'>*</span>
                  </label>
                  <Dropdown
                    type='filter'
                    title='Choose Teacher'
                    options={teachers.map(teacher => ({
                      value: teacher.id,
                      label: `${teacher.fullName} (${teacher.email})`,
                    }))}
                    selectedValue={selectedTeacher?.id || ''}
                    onSelect={teacherId => {
                      const teacher = teachers.find(t => t.id === teacherId);
                      setSelectedTeacher(teacher || null);
                    }}
                    placeholder='Select a teacher'
                    className='w-full'
                  />
                </div>

                {/* Leave Type Selection */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Leave Type <span className='text-red-500'>*</span>
                  </label>
                  <Dropdown
                    type='filter'
                    title='Choose Leave Type'
                    options={leaveTypes.map(leaveType => ({
                      value: leaveType.id,
                      label: `${leaveType.name} (Max: ${leaveType.maxDays} days)`,
                    }))}
                    selectedValue={selectedLeaveType?.id || ''}
                    onSelect={leaveTypeId => {
                      const leaveType = leaveTypes.find(
                        lt => lt.id === leaveTypeId,
                      );
                      setSelectedLeaveType(leaveType || null);
                    }}
                    placeholder='Select leave type'
                    className='w-full'
                  />
                </div>
              </div>

              {/* Leave Balance Display */}
              {selectedTeacher && selectedLeaveType && teacherLeaveUsage && (
                <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <h3 className='font-medium text-blue-900 mb-2'>
                    Leave Balance
                  </h3>
                  <div className='grid grid-cols-3 gap-4 text-sm'>
                    <div>
                      <span className='text-blue-700'>Total Entitlement:</span>
                      <p className='font-semibold text-blue-900'>
                        {selectedLeaveType.maxDays} days
                      </p>
                    </div>
                    <div>
                      <span className='text-blue-700'>Already Used:</span>
                      <p className='font-semibold text-blue-900'>
                        {teacherLeaveUsage.totalUsage} days
                      </p>
                    </div>
                    <div>
                      <span className='text-blue-700'>Available:</span>
                      <p className='font-semibold text-blue-900'>
                        {selectedLeaveType.maxDays -
                          teacherLeaveUsage.totalUsage}{' '}
                        days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Details */}
              <div className='mt-6 space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={createFormData.title}
                    onChange={e =>
                      setCreateFormData(prev => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder='Enter leave title'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={e =>
                      setCreateFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder='Enter leave description (optional)'
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Start Date <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      value={createFormData.startDate}
                      onChange={e =>
                        setCreateFormData(prev => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      End Date <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='date'
                      value={createFormData.endDate}
                      onChange={e =>
                        setCreateFormData(prev => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Duration
                    </label>
                    <div className='w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700'>
                      {createFormData.days} day
                      {createFormData.days !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Admin Creation Reason{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    value={createFormData.adminCreationReason}
                    onChange={e =>
                      setCreateFormData(prev => ({
                        ...prev,
                        adminCreationReason: e.target.value,
                      }))
                    }
                    placeholder='Why are you creating this leave request?'
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                </div>
              </div>
            </div>

            <div className='p-6 border-t border-gray-200 flex justify-end gap-3'>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }}
                disabled={createLoading}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLeave}
                disabled={
                  createLoading ||
                  !selectedTeacher ||
                  !selectedLeaveType ||
                  createFormData.days <= 0
                }
                className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-sm'
              >
                {createLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className='h-4 w-4' />
                    Create Leave
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
