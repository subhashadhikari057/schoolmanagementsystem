import { useState, useEffect, useCallback } from 'react';
import { LeaveRequestService } from '@/api/services/leave-request.service';
import { httpClient } from '@/api/client';
import {
  LeaveRequest,
  LeaveRequestListResponse,
  LeaveRequestQueryParams,
  CreateLeaveRequestRequest,
  UpdateLeaveRequestRequest,
  RejectLeaveRequestRequest,
} from '@/api/services/leave-request.service';

// =============================================================================
// Leave Request Service Instance
// =============================================================================

const leaveRequestService = new LeaveRequestService(httpClient);

// =============================================================================
// Main Leave Request Hooks
// =============================================================================

export const useLeaveRequests = (params?: LeaveRequestQueryParams) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.getLeaveRequests(params);
      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch leave requests',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const createLeaveRequest = useCallback(
    async (data: CreateLeaveRequestRequest) => {
      try {
        const response = await leaveRequestService.createLeaveRequest(data);
        if (response.success && response.data) {
          setLeaveRequests(prev => [response.data, ...prev]);
          return response.data;
        }
        throw new Error(response.message || 'Failed to create leave request');
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to create leave request');
      }
    },
    [],
  );

  const updateLeaveRequest = useCallback(
    async (id: string, data: UpdateLeaveRequestRequest) => {
      try {
        const response = await leaveRequestService.updateLeaveRequest(id, data);
        if (response.success && response.data) {
          setLeaveRequests(prev =>
            prev.map(lr => (lr.id === id ? response.data : lr)),
          );
          return response.data;
        }
        throw new Error(response.message || 'Failed to update leave request');
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Failed to update leave request');
      }
    },
    [],
  );

  const deleteLeaveRequest = useCallback(async (id: string) => {
    try {
      const response = await leaveRequestService.deleteLeaveRequest(id);
      if (response.success) {
        setLeaveRequests(prev => prev.filter(lr => lr.id !== id));
        return response.data;
      }
      throw new Error(response.message || 'Failed to delete leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to delete leave request');
    }
  }, []);

  const approveByParent = useCallback(async (id: string) => {
    try {
      const response = await leaveRequestService.approveByParent(id);
      if (response.success && response.data) {
        setLeaveRequests(prev =>
          prev.map(lr => (lr.id === id ? response.data : lr)),
        );
        return response.data;
      }
      throw new Error(response.message || 'Failed to approve leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to approve leave request');
    }
  }, []);

  const approveByTeacher = useCallback(async (id: string) => {
    try {
      const response = await leaveRequestService.approveByTeacher(id);
      if (response.success && response.data) {
        setLeaveRequests(prev =>
          prev.map(lr => (lr.id === id ? response.data : lr)),
        );
        return response.data;
      }
      throw new Error(response.message || 'Failed to approve leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to approve leave request');
    }
  }, []);

  const rejectByParent = useCallback(async (id: string, reason: string) => {
    try {
      const response = await leaveRequestService.rejectByParent(id, reason);
      if (response.success && response.data) {
        setLeaveRequests(prev =>
          prev.map(lr => (lr.id === id ? response.data : lr)),
        );
        return response.data;
      }
      throw new Error(response.message || 'Failed to reject leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to reject leave request');
    }
  }, []);

  const rejectByTeacher = useCallback(async (id: string, reason: string) => {
    try {
      const response = await leaveRequestService.rejectByTeacher(id, reason);
      if (response.success && response.data) {
        setLeaveRequests(prev =>
          prev.map(lr => (lr.id === id ? response.data : lr)),
        );
        return response.data;
      }
      throw new Error(response.message || 'Failed to reject leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to reject leave request');
    }
  }, []);

  const cancelLeaveRequest = useCallback(async (id: string) => {
    try {
      const response = await leaveRequestService.cancelLeaveRequest(id);
      if (response.success && response.data) {
        setLeaveRequests(prev =>
          prev.map(lr => (lr.id === id ? response.data : lr)),
        );
        return response.data;
      }
      throw new Error(response.message || 'Failed to cancel leave request');
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Failed to cancel leave request');
    }
  }, []);

  return {
    leaveRequests,
    loading,
    error,
    pagination,
    fetchLeaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveByParent,
    approveByTeacher,
    rejectByParent,
    rejectByTeacher,
    cancelLeaveRequest,
  };
};

// =============================================================================
// Specialized Leave Request Hooks
// =============================================================================

export const useMyLeaveRequests = (params?: LeaveRequestQueryParams) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.getMyLeaveRequests(params);
      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch my leave requests',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchMyLeaveRequests();
  }, [fetchMyLeaveRequests]);

  return {
    leaveRequests,
    loading,
    error,
    fetchMyLeaveRequests,
  };
};

export const usePendingApprovals = (params?: LeaveRequestQueryParams) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.getPendingApprovals(params);
      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch pending approvals',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  return {
    leaveRequests,
    loading,
    error,
    fetchPendingApprovals,
  };
};

export const usePendingTeacherApprovals = (
  params?: LeaveRequestQueryParams,
) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingTeacherApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await leaveRequestService.getPendingTeacherApprovals(params);
      if (response.success && response.data) {
        setLeaveRequests(response.data.leaveRequests);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch pending teacher approvals',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchPendingTeacherApprovals();
  }, [fetchPendingTeacherApprovals]);

  return {
    leaveRequests,
    loading,
    error,
    fetchPendingTeacherApprovals,
  };
};

export const useLeaveRequestStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pendingParentApproval: 0,
    pendingTeacherApproval: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    byType: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.getLeaveRequestStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch leave request statistics',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

// =============================================================================
// Single Leave Request Hook
// =============================================================================

export const useLeaveRequest = (id: string) => {
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaveRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await leaveRequestService.getLeaveRequest(id);
      if (response.success && response.data) {
        setLeaveRequest(response.data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch leave request',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeaveRequest();
  }, [fetchLeaveRequest]);

  return {
    leaveRequest,
    loading,
    error,
    fetchLeaveRequest,
  };
};
