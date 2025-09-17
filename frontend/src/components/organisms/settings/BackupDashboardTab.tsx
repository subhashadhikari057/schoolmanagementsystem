'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  HardDrive,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  backupService,
  BackupDashboardData,
} from '@/api/services/backup.service';

interface BackupDashboardTabProps {
  onNavigateToTab?: (tabName: string) => void;
}

export default function BackupDashboardTab({
  onNavigateToTab,
}: BackupDashboardTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] =
    useState<BackupDashboardData | null>(null);

  // Check if user has backup management permissions (SUPER_ADMIN or ADMIN)
  const hasBackupAccess =
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    if (hasBackupAccess) {
      loadDashboardData();
    }
  }, [hasBackupAccess]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await backupService.getDashboard();

      // Check if response has success field (wrapped) or is direct data (unwrapped by HTTP client)
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          console.error('Dashboard response failed:', response);
          toast.error(response.message || 'Failed to load dashboard data');
        }
      } else {
        // Response is unwrapped, check if it has dashboard data structure
        if (
          response &&
          typeof response === 'object' &&
          'stats' in response &&
          'serviceStatus' in response
        ) {
          setDashboardData(response as unknown as BackupDashboardData);
        } else {
          console.error('Invalid dashboard response format:', response);
          toast.error('Invalid dashboard data format');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success('Dashboard data refreshed');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatUptime = (uptimeMs: number): string => {
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
    } else {
      return `${Math.floor(uptimeMs / (1000 * 60))}m`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'stopped':
        return <AlertCircle className='h-5 w-5 text-yellow-600' />;
      case 'error':
        return <AlertTriangle className='h-5 w-5 text-red-600' />;
      default:
        return <Clock className='h-5 w-5 text-gray-600' />;
    }
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'DATABASE':
        return <Database className='h-4 w-4 text-blue-600' />;
      case 'FILES':
        return <FileText className='h-4 w-4 text-green-600' />;
      case 'FULL_SYSTEM':
        return <HardDrive className='h-4 w-4 text-purple-600' />;
      default:
        return <Server className='h-4 w-4 text-gray-600' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className='px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full'>
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className='px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
            In Progress
          </span>
        );
      case 'FAILED':
        return (
          <span className='px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full'>
            Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className='px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
            Cancelled
          </span>
        );
      default:
        return (
          <span className='px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
            {status}
          </span>
        );
    }
  };

  if (!hasBackupAccess) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Access Denied
          </h3>
          <p className='text-gray-600'>
            You need ADMIN or SUPER_ADMIN permissions to view the backup
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 text-blue-600 animate-spin mx-auto mb-4' />
          <p className='text-gray-600'>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Data Available
          </h3>
          <p className='text-gray-600 mb-4'>
            Unable to load backup dashboard data.
          </p>
          <ReusableButton
            onClick={handleRefresh}
            className='bg-blue-600 text-white hover:bg-blue-700'
          >
            Try Again
          </ReusableButton>
        </div>
      </div>
    );
  }

  // Check if we have valid data but no backups yet
  const hasNoBackups = dashboardData.stats.total === 0;
  const hasLimitedData =
    dashboardData.stats.total > 0 && dashboardData.stats.total < 3;

  if (hasNoBackups) {
    return (
      <div className='space-y-6'>
        {/* Header with Refresh Button */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>
              Backup Dashboard
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              Last updated:{' '}
              {new Date(dashboardData.lastUpdated).toLocaleString()}
            </p>
          </div>
          <ReusableButton
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </ReusableButton>
        </div>

        {/* Empty State */}
        <div className='text-center py-12'>
          <Server className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>
            No Backups Yet
          </h3>
          <p className='text-gray-600 mb-6 max-w-md mx-auto'>
            Get started by creating your first backup. You can create manual
            backups or set up automated schedules.
          </p>
          <div className='flex gap-4 justify-center'>
            <ReusableButton
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('Manual Backup');
                } else {
                  toast.success(
                    'Navigate to the Manual Backup tab to create your first backup',
                  );
                }
              }}
              className='bg-blue-600 text-white hover:bg-blue-700'
            >
              Create Manual Backup
            </ReusableButton>
            <ReusableButton
              onClick={() => {
                if (onNavigateToTab) {
                  onNavigateToTab('Schedule');
                } else {
                  toast.success(
                    'Navigate to the Schedule tab to set up automated backups',
                  );
                }
              }}
              className='bg-green-600 text-white hover:bg-green-700'
            >
              Setup Schedule
            </ReusableButton>
          </div>
        </div>

        {/* Service Status Cards - Show even when no backups */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Service Status */}
          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              {getStatusIcon(dashboardData.serviceStatus.status)}
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Service Status
                </p>
                <p className='text-lg font-semibold capitalize'>
                  {dashboardData.serviceStatus.status}
                </p>
              </div>
            </div>
            <div className='mt-3 text-sm text-gray-600'>
              <p>Uptime: {formatUptime(dashboardData.serviceStatus.uptime)}</p>
              <p>Active: {dashboardData.serviceStatus.activeBackups}</p>
            </div>
          </Card>

          {/* Total Backups */}
          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <Server className='h-5 w-5 text-blue-600' />
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Total Backups
                </p>
                <p className='text-lg font-semibold'>
                  {dashboardData.stats.total}
                </p>
              </div>
            </div>
            <div className='mt-3 text-sm text-gray-600'>
              <p>
                Size: {formatBytes(parseInt(dashboardData.stats.totalSize))}
              </p>
            </div>
          </Card>

          {/* Scheduled Backups */}
          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='h-5 w-5 text-purple-600' />
              <div>
                <p className='text-sm font-medium text-gray-900'>Scheduled</p>
                <p className='text-lg font-semibold'>
                  {dashboardData.serviceStatus.scheduledBackups}
                </p>
              </div>
            </div>
            <div className='mt-3 text-sm text-gray-600'>
              <p>Active schedules</p>
            </div>
          </Card>

          {/* Offsite Status */}
          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              {dashboardData.offsiteStatus.connected ? (
                <Wifi className='h-5 w-5 text-green-600' />
              ) : (
                <WifiOff className='h-5 w-5 text-red-600' />
              )}
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Offsite Status
                </p>
                <p
                  className={`text-lg font-semibold ${dashboardData.offsiteStatus.connected ? 'text-green-600' : 'text-red-600'}`}
                >
                  {dashboardData.offsiteStatus.connected
                    ? 'Connected'
                    : 'Disconnected'}
                </p>
              </div>
            </div>
            <div className='mt-3 text-sm text-gray-600'>
              <p>Synced: {dashboardData.offsiteStatus.syncedBackups}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Refresh Button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Backup Dashboard</h2>
          <p className='text-sm text-gray-600 mt-1'>
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        </div>
        <ReusableButton
          onClick={handleRefresh}
          disabled={refreshing}
          className='flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </ReusableButton>
      </div>

      {/* Getting Started Banner for Limited Data */}
      {hasLimitedData && (
        <Card className='p-4 border-blue-200 bg-blue-50'>
          <div className='flex items-start gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Server className='h-5 w-5 text-blue-600' />
            </div>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-blue-900 mb-1'>
                Getting Started with Backups
              </h3>
              <p className='text-sm text-blue-700 mb-3'>
                You have {dashboardData.stats.total} backup
                {dashboardData.stats.total !== 1 ? 's' : ''}. Consider creating
                regular backups and setting up automated schedules for better
                data protection.
              </p>
              <div className='flex gap-2'>
                <ReusableButton
                  onClick={() => {
                    if (onNavigateToTab) {
                      onNavigateToTab('Manual Backup');
                    } else {
                      toast.success(
                        'Navigate to the Manual Backup tab to create more backups',
                      );
                    }
                  }}
                  className='text-xs px-3 py-1 bg-blue-600 text-white hover:bg-blue-700'
                >
                  Create Backup
                </ReusableButton>
                <ReusableButton
                  onClick={() => {
                    if (onNavigateToTab) {
                      onNavigateToTab('Schedule');
                    } else {
                      toast.success(
                        'Navigate to the Schedule tab to set up automated backups',
                      );
                    }
                  }}
                  className='text-xs px-3 py-1 bg-green-600 text-white hover:bg-green-700'
                >
                  Setup Schedule
                </ReusableButton>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Service Status Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Service Status */}
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            {getStatusIcon(dashboardData.serviceStatus.status)}
            <div>
              <p className='text-sm font-medium text-gray-900'>
                Service Status
              </p>
              <p className='text-lg font-semibold capitalize'>
                {dashboardData.serviceStatus.status}
              </p>
            </div>
          </div>
          <div className='mt-3 text-sm text-gray-600'>
            <p>Uptime: {formatUptime(dashboardData.serviceStatus.uptime)}</p>
            <p>Active: {dashboardData.serviceStatus.activeBackups}</p>
          </div>
        </Card>

        {/* Last Backup Size */}
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <HardDrive className='h-5 w-5 text-blue-600' />
            <div>
              <p className='text-sm font-medium text-gray-900'>
                Last Backup Size
              </p>
              <p className='text-lg font-semibold'>
                {dashboardData.recentBackups.length > 0
                  ? formatBytes(
                      parseInt(dashboardData.recentBackups[0].size.toString()),
                    )
                  : '0 B'}
              </p>
            </div>
          </div>
          <div className='mt-3 text-sm text-gray-600'>
            <p>
              Total: {dashboardData.stats.total} backup
              {dashboardData.stats.total !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* Scheduled Backups */}
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <Clock className='h-5 w-5 text-purple-600' />
            <div>
              <p className='text-sm font-medium text-gray-900'>Scheduled</p>
              <p className='text-lg font-semibold'>
                {dashboardData.serviceStatus.scheduledBackups}
              </p>
            </div>
          </div>
          <div className='mt-3 text-sm text-gray-600'>
            <p>Active schedules</p>
          </div>
        </Card>

        {/* Offsite Status */}
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            {dashboardData.offsiteStatus.connected ? (
              <Wifi className='h-5 w-5 text-green-600' />
            ) : (
              <WifiOff className='h-5 w-5 text-red-600' />
            )}
            <div>
              <p className='text-sm font-medium text-gray-900'>
                Offsite Status
              </p>
              <p
                className={`text-lg font-semibold ${dashboardData.offsiteStatus.connected ? 'text-green-600' : 'text-red-600'}`}
              >
                {dashboardData.offsiteStatus.connected
                  ? 'Connected'
                  : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className='mt-3 text-sm text-gray-600'>
            <p>Synced: {dashboardData.offsiteStatus.syncedBackups}</p>
          </div>
        </Card>
      </div>

      {/* Storage Usage Visualization */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Storage Usage</h3>
          <div className='text-sm text-gray-600'>
            {dashboardData.storageUsage.percentUsed}% used
          </div>
        </div>

        {/* Storage Progress Bar */}
        <div className='w-full bg-gray-200 rounded-full h-3 mb-4'>
          <div
            className='bg-blue-600 h-3 rounded-full transition-all duration-300'
            style={{
              width: `${Math.min(dashboardData.storageUsage.percentUsed, 100)}%`,
            }}
          ></div>
        </div>

        {/* Storage Breakdown */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center'>
            <Database className='h-8 w-8 text-blue-600 mx-auto mb-2' />
            <p className='text-sm font-medium text-gray-900'>Database</p>
            <p className='text-lg font-semibold'>
              {formatBytes(dashboardData.storageUsage.breakdown.database)}
            </p>
          </div>
          <div className='text-center'>
            <FileText className='h-8 w-8 text-green-600 mx-auto mb-2' />
            <p className='text-sm font-medium text-gray-900'>Files</p>
            <p className='text-lg font-semibold'>
              {formatBytes(dashboardData.storageUsage.breakdown.files)}
            </p>
          </div>
          <div className='text-center'>
            <HardDrive className='h-8 w-8 text-purple-600 mx-auto mb-2' />
            <p className='text-sm font-medium text-gray-900'>Full System</p>
            <p className='text-lg font-semibold'>
              {formatBytes(dashboardData.storageUsage.breakdown.fullSystem)}
            </p>
          </div>
        </div>

        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>
              Used: {formatBytes(dashboardData.storageUsage.used)}
            </span>
            <span className='text-gray-600'>
              Free: {formatBytes(dashboardData.storageUsage.free)}
            </span>
            <span className='text-gray-600'>
              Total: {formatBytes(dashboardData.storageUsage.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Recent Backups */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Recent Backups
          </h3>
          <div className='text-sm text-gray-600'>
            Last {dashboardData.recentBackups.length} backups
          </div>
        </div>

        <div className='space-y-3'>
          {dashboardData.recentBackups.map(backup => (
            <div
              key={backup.id}
              className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
            >
              <div className='flex items-center gap-3'>
                {getBackupTypeIcon(backup.type)}
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {backup.type
                      .replace('_', ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, l => l.toUpperCase())}{' '}
                    Backup
                  </p>
                  <p className='text-xs text-gray-600'>
                    {new Date(backup.startedAt).toLocaleString()} •{' '}
                    {formatBytes(parseInt(backup.size.toString()))}
                    {backup.encrypted && ' • 🔒 Encrypted'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {getStatusBadge(backup.status)}
                <span className='text-xs text-gray-500'>
                  {backup.location.includes('offsite') ? 'Offsite' : 'Local'}
                </span>
              </div>
            </div>
          ))}

          {dashboardData.recentBackups.length === 0 && (
            <div className='text-center py-8'>
              <Server className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>No recent backups found</p>
            </div>
          )}
        </div>
      </Card>

      {/* System Errors (if any) */}
      {dashboardData.serviceStatus.errors.length > 0 && (
        <Card className='p-6 border-red-200 bg-red-50'>
          <div className='flex items-center gap-2 mb-3'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            <h3 className='text-lg font-semibold text-red-900'>
              Recent Errors
            </h3>
          </div>
          <div className='space-y-2'>
            {dashboardData.serviceStatus.errors.map((error, index) => (
              <div
                key={index}
                className='text-sm text-red-800 bg-red-100 p-2 rounded'
              >
                {error}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
