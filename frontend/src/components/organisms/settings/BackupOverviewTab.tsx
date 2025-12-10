'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupService } from '@/api/services/backup.service';
import { backupStatsService } from '@/api/services/backup-stats.service';

interface BackupOverviewTabProps {
  onNavigateToManualBackup?: () => void;
}

interface BackupItem {
  id: string;
  type: 'Full Backup' | 'Database Backup' | 'Files Backup';
  date: string;
  time: string;
  size: string;
  status: 'Both' | 'Local' | 'Offsite';
  icon: any;
  color: string;
}

export default function BackupOverviewTab({
  onNavigateToManualBackup,
}: BackupOverviewTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [recentBackups, setRecentBackups] = useState<BackupItem[]>([]);

  const [serviceStatus, setServiceStatus] = useState({
    backupService: 'Loading...' as
      | 'Running'
      | 'Stopped'
      | 'Error'
      | 'Loading...',
    lastBackup: 'Loading...',
    storageUsed: 'Loading...',
    offsiteStatus: 'Loading...' as
      | 'Connected'
      | 'Disconnected'
      | 'Error'
      | 'Disabled'
      | 'Loading...',
  });

  const [storageBreakdown, setStorageBreakdown] = useState({
    totalStorage: 'Loading...',
    databaseBackups: 'Loading...',
    fileBackups: 'Loading...',
    available: 'Loading...',
    usagePercentage: 0,
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new stats service
      const response = await backupStatsService.getOverviewStats();

      // The response structure has storage at the root level
      if (response) {
        const { summary, storage, recentActivities, service, settings } =
          response as any;

        // Format storage sizes with KB precision
        const formatBytes = (bytes: number) => {
          if (bytes === 0) return '0 B';
          if (bytes < 1024) return `${bytes.toFixed(2)} B`;
          const kb = bytes / 1024;
          if (kb < 1024) return `${kb.toFixed(2)} KB`;
          const mb = kb / 1024;
          if (mb < 1024) return `${mb.toFixed(2)} MB`;
          const gb = mb / 1024;
          return `${gb.toFixed(2)} GB`;
        };

        setServiceStatus({
          backupService:
            service?.status === 'running'
              ? 'Running'
              : service?.status === 'error'
                ? 'Error'
                : service?.status === 'stopped'
                  ? 'Stopped'
                  : 'Running',
          lastBackup: summary?.lastBackupTime
            ? new Date(summary.lastBackupTime).toLocaleString()
            : 'Never',
          storageUsed:
            storage?.used != null ? formatBytes(storage.used) : '0 B',
          offsiteStatus: settings?.offsiteEnabled
            ? settings?.offsiteConnectionStatus === 'connected'
              ? 'Connected'
              : settings?.offsiteConnectionStatus === 'error'
                ? 'Error'
                : 'Disconnected'
            : 'Disabled',
        });

        setStorageBreakdown({
          totalStorage:
            storage?.total != null ? formatBytes(storage.total) : '0 B',
          databaseBackups:
            storage?.breakdown?.database != null
              ? formatBytes(storage.breakdown.database)
              : '0 B',
          fileBackups:
            storage?.breakdown?.files != null
              ? formatBytes(storage.breakdown.files)
              : '0 B',
          available: storage?.free != null ? formatBytes(storage.free) : '0 B',
          usagePercentage:
            storage?.percentUsed != null ? storage.percentUsed : 0,
        });

        // Map recent activities to backup items
        if (recentActivities && recentActivities.length > 0) {
          setRecentBackups(
            recentActivities.slice(0, 10).map((activity: any) => ({
              id: activity.id,
              type: activity.operation as any,
              date: new Date(activity.timestamp).toLocaleDateString(),
              time: new Date(activity.timestamp).toLocaleTimeString(),
              size: formatBytes(activity.size),
              status: activity.offsite ? 'Both' : ('Local' as any),
              icon: Database,
              color: activity.operation.includes('FULL')
                ? 'text-purple-600'
                : activity.operation.includes('DATABASE')
                  ? 'text-blue-600'
                  : 'text-green-600',
            })),
          );
        } else {
          setRecentBackups([]);
        }
      } else {
        // Handle API errors gracefully - could be empty state
        setServiceStatus({
          backupService: 'Stopped',
          lastBackup: 'Never',
          storageUsed: '0 GB',
          offsiteStatus: 'Disconnected',
        });

        setStorageBreakdown({
          totalStorage: '0 GB',
          databaseBackups: '0 GB',
          fileBackups: '0 GB',
          available: '0 GB',
          usagePercentage: 0,
        });

        setRecentBackups([]);

        // Only show error if it's a real error, not just empty data
        const resp = response as any;
        if (
          resp.error &&
          !resp.error.includes('not found') &&
          !resp.error.includes('No backups')
        ) {
          setError(resp.error);
        }
      }
    } catch (err: any) {
      // Handle network/API errors gracefully
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMsg);

      // Set default empty state instead of error
      setServiceStatus({
        backupService: 'Stopped',
        lastBackup: 'Never',
        storageUsed: '0 GB',
        offsiteStatus: 'Disconnected',
      });

      setStorageBreakdown({
        totalStorage: '0 GB',
        databaseBackups: '0 GB',
        fileBackups: '0 GB',
        available: '0 GB',
        usagePercentage: 0,
      });

      setRecentBackups([]);

      // Only show error for real network issues
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        setError(
          'Unable to connect to backup service. Please check your connection.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Both':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'>
            <CheckCircle className='w-3 h-3' /> Both
          </span>
        );
      case 'Local':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3' /> Local
          </span>
        );
      case 'Offsite':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3' /> Offsite
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
            <AlertCircle className='w-3 h-3' /> Unknown
          </span>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-gray-600'>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='space-y-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-red-800'>
                Error Loading Dashboard
              </p>
              <p className='text-sm text-red-700 mt-1'>{error}</p>
            </div>
            <ReusableButton
              onClick={loadDashboardData}
              className='px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded text-sm'
            >
              Retry
            </ReusableButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Service Status Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg ${
                serviceStatus.backupService === 'Running'
                  ? 'bg-green-50'
                  : serviceStatus.backupService === 'Error'
                    ? 'bg-red-50'
                    : 'bg-gray-50'
              }`}
            >
              <Play
                className={`h-5 w-5 ${
                  serviceStatus.backupService === 'Running'
                    ? 'text-green-600'
                    : serviceStatus.backupService === 'Error'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Backup Service</p>
              <p
                className={`font-medium ${
                  serviceStatus.backupService === 'Running'
                    ? 'text-green-600'
                    : serviceStatus.backupService === 'Error'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {serviceStatus.backupService}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Clock className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Last Backup</p>
              <p className='font-medium text-gray-900'>
                {serviceStatus.lastBackup}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <Database className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Storage Used</p>
              <p className='font-medium text-gray-900'>
                {serviceStatus.storageUsed}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg ${
                serviceStatus.offsiteStatus === 'Connected'
                  ? 'bg-green-50'
                  : serviceStatus.offsiteStatus === 'Error'
                    ? 'bg-red-50'
                    : serviceStatus.offsiteStatus === 'Disabled'
                      ? 'bg-gray-50'
                      : 'bg-orange-50'
              }`}
            >
              <CheckCircle
                className={`h-5 w-5 ${
                  serviceStatus.offsiteStatus === 'Connected'
                    ? 'text-green-600'
                    : serviceStatus.offsiteStatus === 'Error'
                      ? 'text-red-600'
                      : serviceStatus.offsiteStatus === 'Disabled'
                        ? 'text-gray-600'
                        : 'text-orange-600'
                }`}
              />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Offsite Status</p>
              <p
                className={`font-medium ${
                  serviceStatus.offsiteStatus === 'Connected'
                    ? 'text-green-600'
                    : serviceStatus.offsiteStatus === 'Error'
                      ? 'text-red-600'
                      : serviceStatus.offsiteStatus === 'Disabled'
                        ? 'text-gray-600'
                        : 'text-orange-600'
                }`}
              >
                {serviceStatus.offsiteStatus}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Database className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Storage Usage
            </h3>
            <p className='text-sm text-gray-600'>
              Monitor backup storage consumption
            </p>
          </div>
        </div>

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-3'>
            <span className='text-sm font-medium text-gray-700'>
              Disk Space Overview
            </span>
            <span className='text-xs text-gray-500'>
              Total: {storageBreakdown.totalStorage}
            </span>
          </div>

          {/* Three-segment progress bar */}
          <div className='w-full bg-gray-200 rounded-full h-3 flex overflow-hidden'>
            {/* Used by backups (purple) */}
            <div
              className='bg-purple-600 h-3 transition-all duration-300'
              style={{
                width: `${storageBreakdown.usagePercentage}%`,
              }}
              title={`Backup Storage Used: ${serviceStatus.storageUsed}`}
            ></div>
            {/* Available space (green) */}
            <div
              className='bg-green-500 h-3 transition-all duration-300'
              style={{
                width: `${(() => {
                  const totalBytes = parseFloat(
                    storageBreakdown.totalStorage.replace(/[^0-9.]/g, ''),
                  );
                  const availableBytes = parseFloat(
                    storageBreakdown.available.replace(/[^0-9.]/g, ''),
                  );
                  if (!totalBytes || totalBytes === 0) return 0;
                  return ((availableBytes / totalBytes) * 100).toFixed(2);
                })()}%`,
              }}
              title={`Available: ${storageBreakdown.available}`}
            ></div>
            {/* Used by other files (gray) - the rest */}
          </div>

          {/* Legend */}
          <div className='flex items-center justify-between mt-3 text-xs'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1.5'>
                <div className='w-3 h-3 bg-purple-600 rounded-sm'></div>
                <span className='text-gray-600'>
                  Backups: {serviceStatus.storageUsed}
                </span>
              </div>
              <div className='flex items-center gap-1.5'>
                <div className='w-3 h-3 bg-green-500 rounded-sm'></div>
                <span className='text-gray-600'>
                  Available: {storageBreakdown.available}
                </span>
              </div>
              <div className='flex items-center gap-1.5'>
                <div className='w-3 h-3 bg-gray-200 rounded-sm border border-gray-300'></div>
                <span className='text-gray-600'>Other Files</span>
              </div>
            </div>
            <span className='text-gray-600 font-medium'>
              Total: {storageBreakdown.totalStorage}
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>Database Backups</p>
            <p className='text-lg font-semibold text-gray-900'>
              {storageBreakdown.databaseBackups}
            </p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>File Backups</p>
            <p className='text-lg font-semibold text-gray-900'>
              {storageBreakdown.fileBackups}
            </p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>Available</p>
            <p className='text-lg font-semibold text-green-600'>
              {storageBreakdown.available}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Backups */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <Zap className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Recent Backups
              </h3>
              <p className='text-sm text-gray-600'>
                Latest backup activities and status
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm disabled:opacity-50'
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ReusableButton>
        </div>

        <div className='space-y-3'>
          {recentBackups.length > 0 ? (
            recentBackups.map(backup => {
              const IconComponent = backup.icon;
              return (
                <div
                  key={backup.id}
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`p-2 bg-white rounded-lg ${backup.color}`}>
                      <IconComponent className='h-4 w-4' />
                    </div>
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {backup.type}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {backup.date}, {backup.time} • {backup.size}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    {getStatusBadge(backup.status)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='text-center py-12'>
              <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                <Database className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No backups yet
              </h3>
              <p className='text-gray-600 mb-4 max-w-sm mx-auto'>
                You haven't created any backups yet. Create your first backup to
                get started with data protection.
              </p>
              <ReusableButton
                onClick={() => {
                  if (onNavigateToManualBackup) {
                    onNavigateToManualBackup();
                  }
                }}
                className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors'
              >
                Create First Backup
              </ReusableButton>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
