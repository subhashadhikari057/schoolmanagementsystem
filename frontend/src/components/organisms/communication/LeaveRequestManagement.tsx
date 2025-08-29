'use client';

import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { LeaveRequestService } from '@/api/services/leave-request.service';
import { HttpClient } from '@/api/client/http-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import LeaveRequestDetailModal from '@/components/organisms/modals/LeaveRequestDetailModal';
import SectionTitle from '@/components/atoms/display/SectionTitle';

// Types for leave request data
interface LeaveRequestData {
  id: string;
  applicant: { name: string; role: string; extra: string };
  leaveType: string;
  leaveTypeColor: string;
  appliedDate: string;
  files: number;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  status: string;
  statusBy: string;
  actions: any;
  originalData?: any; // Keep original API data
}

interface StatsData {
  icon: any;
  bgColor: string;
  iconColor: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const LeaveRequestManagement: React.FC = () => {
  // State management
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestData[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequestData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal state
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Action modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { user } = useAuth();
  const leaveRequestService = new LeaveRequestService(new HttpClient());

  // Utility function to get leave type color
  const getLeaveTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      SICK: 'bg-red-100 text-red-700',
      PERSONAL: 'bg-blue-100 text-blue-700',
      VACATION: 'bg-green-100 text-green-700',
      EMERGENCY: 'bg-yellow-100 text-yellow-800',
      MEDICAL: 'bg-purple-100 text-purple-700',
      FAMILY: 'bg-orange-100 text-orange-700',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  // Utility function to format status
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING_PARENT_APPROVAL: 'Pending Parent',
      PENDING_TEACHER_APPROVAL: 'Pending Teacher',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  // Utility function to format leave type
  const formatLeaveType = (type: string): string => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
  };

  // Utility function to calculate duration in days
  const calculateDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  // Transform API data to component format
  const transformLeaveRequestData = (apiData: any[]): LeaveRequestData[] => {
    return apiData.map(item => ({
      id: item.id,
      applicant: {
        name: item.student?.user?.fullName || 'Unknown Student',
        role: 'Student',
        extra: item.student?.class
          ? `Grade ${item.student.class.grade}${item.student.class.section}`
          : 'No Class',
      },
      leaveType: formatLeaveType(item.type),
      leaveTypeColor: getLeaveTypeColor(item.type),
      appliedDate: new Date(item.createdAt).toISOString().split('T')[0],
      files: item.attachments?.length || 0,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: new Date(item.endDate).toISOString().split('T')[0],
      duration: calculateDuration(item.startDate, item.endDate),
      reason: item.description
        ? item.description.length > 30
          ? item.description.substring(0, 30) + '...'
          : item.description
        : item.title,
      status: formatStatus(item.status),
      statusBy:
        item.teacher?.user?.fullName || item.parent?.user?.fullName || '',
      actions: {}, // Will be handled by ActionButtons component
      originalData: item, // Keep original API data for the modal
    }));
  };

  // Calculate statistics from data
  const calculateStats = (data: any[]): StatsData[] => {
    const total = data.length;
    const pending = data.filter(
      item =>
        item.status === 'PENDING_PARENT_APPROVAL' ||
        item.status === 'PENDING_TEACHER_APPROVAL',
    ).length;
    const approved = data.filter(item => item.status === 'APPROVED').length;
    const rejected = data.filter(item => item.status === 'REJECTED').length;

    return [
      {
        icon: FileText,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        label: 'Total Requests',
        value: total.toString(),
        change: '',
        isPositive: true,
      },
      {
        icon: Clock,
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        label: 'Pending Approval',
        value: pending.toString(),
        change: '',
        isPositive: true,
      },
      {
        icon: CheckCircle2,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        label: 'Approved',
        value: approved.toString(),
        change: '',
        isPositive: true,
      },
      {
        icon: XCircle,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        label: 'Rejected',
        value: rejected.toString(),
        change: '',
        isPositive: false,
      },
    ];
  };

  // Load leave requests data
  const loadLeaveRequests = async (page: number = 1) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Fetch all leave requests for filtering and stats
      const allResponse = await leaveRequestService.getLeaveRequests({
        page: 1,
        limit: 1000, // Get all for filtering and stats
      });

      if (allResponse.success && allResponse.data) {
        const allTransformedData = transformLeaveRequestData(
          allResponse.data.leaveRequests,
        );
        setAllLeaveRequests(allTransformedData);

        const calculatedStats = calculateStats(allResponse.data.leaveRequests);
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Failed to load student leave requests');
      setAllLeaveRequests([]);
      setStats([
        {
          icon: FileText,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          label: 'Total Requests',
          value: '0',
          change: '',
          isPositive: true,
        },
        {
          icon: Clock,
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          label: 'Pending Approval',
          value: '0',
          change: '',
          isPositive: true,
        },
        {
          icon: CheckCircle2,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          label: 'Approved',
          value: '0',
          change: '',
          isPositive: true,
        },
        {
          icon: XCircle,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          label: 'Rejected',
          value: '0',
          change: '',
          isPositive: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadLeaveRequests(1);
  }, [user?.id]);

  // Filter and paginate data based on search and filter criteria
  const filteredAndPaginatedData = useMemo(() => {
    let filtered = [...allLeaveRequests];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.applicant.name.toLowerCase().includes(search) ||
          item.leaveType.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.reason.toLowerCase().includes(search),
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Pending') {
        filtered = filtered.filter(item => item.status.includes('Pending'));
      } else {
        filtered = filtered.filter(item => item.status === statusFilter);
      }
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.leaveType === typeFilter);
    }

    // Calculate pagination
    const totalFiltered = filtered.length;
    const totalPagesCalculated = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems: totalFiltered,
      totalPages: totalPagesCalculated,
    };
  }, [
    allLeaveRequests,
    searchTerm,
    statusFilter,
    typeFilter,
    currentPage,
    itemsPerPage,
  ]);

  // Update leaveRequests when filtered data changes
  useEffect(() => {
    setLeaveRequests(filteredAndPaginatedData.data);
    setTotalItems(filteredAndPaginatedData.totalItems);
    setTotalPages(filteredAndPaginatedData.totalPages);
  }, [filteredAndPaginatedData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  // Handle type filter change
  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle item actions (view, approve, reject)
  const handleItemAction = (action: string, item: LeaveRequestData) => {
    if (action === 'view') {
      setSelectedLeaveRequest(item.originalData);
      setIsDetailModalOpen(true);
    } else if (action === 'approve') {
      handleApproveLeaveRequest(item);
    } else if (action === 'reject') {
      setSelectedLeaveRequest(item);
      setIsRejectModalOpen(true);
    }
  };

  // Handle approve leave request
  const handleApproveLeaveRequest = async (item: LeaveRequestData) => {
    try {
      setActionLoading('approve');
      await leaveRequestService.adminApprove(item.id);
      toast.success('Leave request approved successfully');
      // Refresh data after a short delay to ensure backend consistency
      setTimeout(() => {
        loadLeaveRequests(1);
      }, 500);
    } catch (error: any) {
      console.error('Error approving leave request:', error);
      let errorMessage = 'Failed to approve leave request';

      // Handle specific error messages
      if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        if (msg.includes('Parent approval required first')) {
          errorMessage =
            'Cannot approve: Parent must approve this request first';
        } else if (msg.includes('Only superadmin')) {
          errorMessage = 'Only superadmin can approve student leave requests';
        } else {
          errorMessage = msg;
        }
      }

      toast.error(errorMessage);
      return;
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject leave request
  const handleRejectLeaveRequest = async () => {
    if (!selectedLeaveRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading('reject');
      await leaveRequestService.adminReject(
        selectedLeaveRequest.id,
        rejectionReason,
      );
      toast.success('Leave request rejected successfully');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setSelectedLeaveRequest(null);
      // Refresh data after a short delay to ensure backend consistency
      setTimeout(() => {
        loadLeaveRequests(1);
      }, 500);
    } catch (error: any) {
      console.error('Error rejecting leave request:', error);
      let errorMessage = 'Failed to reject leave request';

      // Handle specific error messages
      if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        if (msg.includes('Only superadmin')) {
          errorMessage = 'Only superadmin can reject student leave requests';
        } else {
          errorMessage = msg;
        }
      }

      toast.error(errorMessage);
      return;
    } finally {
      setActionLoading(null);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedLeaveRequest(null);
  };

  // Memoized configuration to prevent focus loss
  const leaveRequestsConfig = useMemo(() => {
    const config = getListConfig('leave-requests');
    return {
      ...config,
      searchValue: searchTerm,
      onSearchChange: handleSearch,
      primaryFilter: {
        ...config.primaryFilter,
        value: statusFilter,
        onChange: handleStatusFilterChange,
      },
      secondaryFilter: {
        ...config.secondaryFilter,
        value: typeFilter,
        onChange: handleTypeFilterChange,
      },
    };
  }, [searchTerm, statusFilter, typeFilter]);

  return (
    <div className='space-y-6'>
      <div>
        <SectionTitle
          text='Student Leaves'
          className='mb-1 text-3xl font-bold'
        />
        <p className='text-sm text-gray-500 mt-1 mb-6'>
          Monitor all the student leave requests in the school
        </p>
        <Statsgrid stats={stats} />
      </div>
      <GenericList
        config={leaveRequestsConfig}
        data={leaveRequests}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemAction={handleItemAction}
        onSearch={handleSearch}
        onPrimaryFilterChange={handleStatusFilterChange}
        onSecondaryFilterChange={handleTypeFilterChange}
        customActions={<ActionButtons pageType='leave-requests' />}
      />

      {/* Leave Request Detail Modal */}
      <LeaveRequestDetailModal
        open={isDetailModalOpen}
        onClose={handleModalClose}
        leaveRequest={selectedLeaveRequest}
        // Admin can only view, no approve/reject/cancel actions
        onApprove={undefined}
        onReject={undefined}
        onCancel={undefined}
      />

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
            <div className='p-6 border-b border-gray-200'>
              <h2 className='text-xl font-bold text-gray-800 mb-2'>
                Reject Leave Request
              </h2>
              <p className='text-gray-600'>
                Please provide a reason for rejecting this leave request
              </p>
            </div>

            <div className='p-6'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    rows={4}
                    placeholder='Please explain why this leave request is being rejected...'
                  />
                </div>
              </div>
            </div>

            <div className='p-6 pt-0 flex gap-3'>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                  setSelectedLeaveRequest(null);
                }}
                className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                disabled={actionLoading === 'reject'}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectLeaveRequest}
                disabled={!rejectionReason.trim() || actionLoading === 'reject'}
                className='flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition-colors'
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;
