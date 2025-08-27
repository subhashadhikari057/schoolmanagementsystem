import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  leaveTypeService,
  LeaveType,
  CreateLeaveTypeRequest,
  UpdateLeaveTypeRequest,
  QueryLeaveTypeRequest,
  LeaveTypeStats,
} from '@/api/services/leave-type.service';

export const useLeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [stats, setStats] = useState<LeaveTypeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all leave types
  const fetchLeaveTypes = useCallback(async (query?: QueryLeaveTypeRequest) => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaveTypeService.getAllLeaveTypes(query);
      setLeaveTypes(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch leave types';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch leave type statistics
  const fetchStats = useCallback(async () => {
    try {
      const data = await leaveTypeService.getLeaveTypeStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch leave type stats:', err);
      // Don't show toast for stats errors as they're not critical
    }
  }, []);

  // Create a new leave type
  const createLeaveType = useCallback(
    async (data: CreateLeaveTypeRequest) => {
      try {
        setLoading(true);
        const newLeaveType = await leaveTypeService.createLeaveType(data);
        setLeaveTypes(prev => [newLeaveType, ...prev]);
        // Refresh stats after creating
        await fetchStats();
        toast.success('Leave type created successfully!');
        return newLeaveType;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create leave type';
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats],
  );

  // Update an existing leave type
  const updateLeaveType = useCallback(
    async (id: string, data: UpdateLeaveTypeRequest) => {
      try {
        setLoading(true);
        const updatedLeaveType = await leaveTypeService.updateLeaveType(
          id,
          data,
        );
        setLeaveTypes(prev =>
          prev.map(lt => (lt.id === id ? updatedLeaveType : lt)),
        );
        // Refresh stats after updating
        await fetchStats();
        toast.success('Leave type updated successfully!');
        return updatedLeaveType;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update leave type';
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats],
  );

  // Delete a leave type
  const deleteLeaveType = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await leaveTypeService.deleteLeaveType(id);
        setLeaveTypes(prev => prev.filter(lt => lt.id !== id));
        // Refresh stats after deleting
        await fetchStats();
        toast.success('Leave type deleted successfully!');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete leave type';
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats],
  );

  // Toggle leave type status
  const toggleStatus = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const updatedLeaveType =
          await leaveTypeService.toggleLeaveTypeStatus(id);
        setLeaveTypes(prev =>
          prev.map(lt => (lt.id === id ? updatedLeaveType : lt)),
        );
        // Refresh stats after toggling status
        await fetchStats();
        const action =
          updatedLeaveType.status === 'ACTIVE' ? 'activated' : 'deactivated';
        toast.success(`Leave type ${action} successfully!`);
        return updatedLeaveType;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to toggle leave type status';
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchStats],
  );

  // Get a specific leave type by ID
  const getLeaveTypeById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const leaveType = await leaveTypeService.getLeaveTypeById(id);
      return leaveType;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch leave type';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchLeaveTypes();
    fetchStats();
  }, [fetchLeaveTypes, fetchStats]);

  return {
    // State
    leaveTypes,
    stats,
    loading,
    error,

    // Actions
    fetchLeaveTypes,
    fetchStats,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    toggleStatus,
    getLeaveTypeById,

    // Computed values
    totalTypes: stats?.totalTypes || 0,
    paidTypes: stats?.paidTypes || 0,
    activeTypes: stats?.activeTypes || 0,
    inactiveTypes: stats?.inactiveTypes || 0,
  };
};
