'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  HardDrive,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupService } from '@/api/services/backup.service';
import BackupProgressModal from '@/components/molecules/modals/BackupProgressModal';
import DeleteConfirmationModal from '@/components/organisms/modals/DeleteConfirmationModal';
import { useBackupContext } from '@/context/BackupContext';

interface BackupType {
  id: string;
  name: string;
  description: string;
  includes: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export default function ManualBackupTab() {
  const { toast } = useBackupContext();
  const [loading, setLoading] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progressModal, setProgressModal] = useState({
    isOpen: false,
    backupId: '',
    backupType: 'DATABASE' as 'DATABASE' | 'FILES' | 'FULL_SYSTEM',
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    backupId: string | null;
    backupName: string | null;
  }>({ isOpen: false, backupId: null, backupName: null });
  const [deleting, setDeleting] = useState(false);

  // Load backup history on mount
  useEffect(() => {
    loadBackupHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  interface BackupHistoryItem {
    backupId: string;
    type: string;
    startedAt?: string;
    createdAt?: string;
    size?: number;
    encrypted?: boolean;
    offsiteBackupCompleted?: boolean;
    status?: string;
  }

  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);

  const loadBackupHistory = async () => {
    try {
      const response = await backupService.listBackups();
      if (response.success && response.data) {
        setBackupHistory(response.data as unknown as BackupHistoryItem[]);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load backup history';
      toast.error('Load Failed', errorMsg);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const handleDownloadHistory = async (
    backupId: string,
    backupType: string,
  ) => {
    try {
      const blob = await backupService.downloadBackup(backupId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${backupId}-${backupType}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download Started', 'Backup file is being downloaded');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      toast.error('Download Failed', errorMsg);
    }
  };

  const handleDeleteHistory = async (backupId: string, backupName: string) => {
    setDeleteModal({ isOpen: true, backupId, backupName });
  };

  const confirmDelete = async () => {
    if (!deleteModal.backupId) return;

    try {
      setDeleting(true);
      const response = await backupService.deleteBackup(deleteModal.backupId);
      if (response.success) {
        toast.success('Backup Deleted', 'Backup has been deleted successfully');
        setDeleteModal({ isOpen: false, backupId: null, backupName: null });
        loadBackupHistory(); // Refresh list
      } else {
        toast.error(
          'Delete Failed',
          response.error || 'Failed to delete backup',
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delete failed';
      toast.error('Delete Failed', errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const [backupTypes] = useState<BackupType[]>([
    {
      id: 'database',
      name: 'Database Backup',
      description: 'Full database dump',
      includes: [
        'Student records',
        'Academic data',
        'User accounts',
        'System settings',
      ],
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'files',
      name: 'Files Backup',
      description: 'Documents and media',
      includes: [
        'Student photos',
        'Uploaded documents',
        'Generated reports',
        'System configurations',
      ],
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      id: 'full',
      name: 'Full System Backup',
      description: 'Complete system snapshot',
      includes: [
        'Complete database',
        'All uploaded files',
        'System configurations',
        'Application settings',
      ],
      icon: HardDrive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]);

  const handleBackup = async (type: string) => {
    setLoading(type);
    setError('');

    try {
      const backupType =
        type === 'database'
          ? 'DATABASE'
          : type === 'files'
            ? 'FILES'
            : 'FULL_SYSTEM';

      // Generate temporary ID for progress tracking
      const tempBackupId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Open progress modal IMMEDIATELY before API call
      setProgressModal({
        isOpen: true,
        backupId: tempBackupId,
        backupType: backupType,
      });

      // Show starting toast
      toast.success(
        'Backup Started',
        `${backupType.replace('_', ' ').toLowerCase()} backup is being created...`,
      );

      // Call API to create backup
      const response = await backupService.createBackup({
        type: backupType,
        // Let backend use global encryption settings
      });

      // Update modal with real operationId if successful
      if (response.success && response.data && response.data.operationId) {
        setProgressModal(prev => ({
          ...prev,
          backupId: response.data.operationId, // Use operationId for SSE tracking
        }));
      } else {
        // Close modal and show error
        setProgressModal(prev => ({ ...prev, isOpen: false }));
        const errorMsg =
          response.error || response.message || 'Failed to start backup';
        setError(errorMsg);
        toast.error('Backup Failed', errorMsg);
      }
    } catch (err) {
      // Close modal and show error
      setProgressModal(prev => ({ ...prev, isOpen: false }));
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start backup';
      setError(errorMsg);
      toast.error('Backup Error', errorMsg);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-red-800'>Error</p>
              <p className='text-sm text-red-700 mt-1'>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Backup Types */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {backupTypes.map(backupType => {
          const IconComponent = backupType.icon;
          return (
            <Card key={backupType.id} className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div className={`p-2 ${backupType.bgColor} rounded-lg`}>
                  <IconComponent className={`h-5 w-5 ${backupType.color}`} />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {backupType.name}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {backupType.description}
                  </p>
                </div>
              </div>

              <div className='mb-4'>
                <p className='text-sm font-medium text-gray-700 mb-2'>
                  Includes:
                </p>
                <ul className='space-y-1'>
                  {backupType.includes.map((item, index) => (
                    <li
                      key={index}
                      className='flex items-center gap-2 text-sm text-gray-600'
                    >
                      <span className='w-1 h-1 bg-gray-400 rounded-full'></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <ReusableButton
                onClick={() => handleBackup(backupType.id)}
                className={`w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                  backupType.id === 'database'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : backupType.id === 'files'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
                disabled={loading === backupType.id}
              >
                {loading === backupType.id
                  ? 'Starting...'
                  : backupType.id === 'database'
                    ? 'Backup Database'
                    : backupType.id === 'files'
                      ? 'Backup Files'
                      : 'Full Backup'}
              </ReusableButton>
            </Card>
          );
        })}
      </div>

      {/* Backup History Section */}
      {backupHistory.length > 0 && (
        <Card className='p-6 mt-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-gray-50 rounded-lg'>
              <Database className='h-5 w-5 text-gray-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Recent Manual Backups
              </h3>
              <p className='text-sm text-gray-600'>
                Download or delete previous backups
              </p>
            </div>
          </div>

          <div className='space-y-3'>
            {backupHistory.length > 0 ? (
              backupHistory.slice(0, 10).map(backup => {
                const IconComponent =
                  backup.type === 'DATABASE'
                    ? Database
                    : backup.type === 'FILES'
                      ? FileText
                      : HardDrive;
                const colorClass =
                  backup.type === 'DATABASE'
                    ? 'text-blue-600'
                    : backup.type === 'FILES'
                      ? 'text-green-600'
                      : 'text-purple-600';
                const bgColorClass =
                  backup.type === 'DATABASE'
                    ? 'bg-blue-50'
                    : backup.type === 'FILES'
                      ? 'bg-green-50'
                      : 'bg-purple-50';

                return (
                  <div
                    key={backup.backupId}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors'
                  >
                    <div className='flex items-center gap-3 flex-1'>
                      <div
                        className={`p-2 ${bgColorClass} rounded-lg ${colorClass}`}
                      >
                        <IconComponent className='h-4 w-4' />
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          {backup.type.replace('_', ' ')} Backup
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {new Date(
                            backup.startedAt || backup.createdAt || Date.now(),
                          ).toLocaleString()}{' '}
                          • {formatBytes(Number(backup.size))}
                        </p>
                        <div className='flex items-center gap-2 mt-1'>
                          {backup.encrypted && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                              Encrypted
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              backup.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : backup.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {backup.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <ReusableButton
                        onClick={() =>
                          handleDownloadHistory(backup.backupId, backup.type)
                        }
                        className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      >
                        <Download className='h-4 w-4' />
                      </ReusableButton>
                      <ReusableButton
                        onClick={() =>
                          handleDeleteHistory(backup.backupId, backup.type)
                        }
                        className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <Trash2 className='h-4 w-4' />
                      </ReusableButton>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='text-center py-12'>
                <Database className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h4 className='text-lg font-medium text-gray-900 mb-2'>
                  No Manual Backups Yet
                </h4>
                <p className='text-sm text-gray-600 mb-4'>
                  Create your first backup using the buttons above
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Progress Modal */}
      <BackupProgressModal
        isOpen={progressModal.isOpen}
        onClose={() => setProgressModal(prev => ({ ...prev, isOpen: false }))}
        backupId={progressModal.backupId}
        backupType={progressModal.backupType}
        onComplete={result => {
          toast.success(
            'Backup Completed',
            `Backup completed successfully. Size: ${result.size || 'Unknown'}`,
          );
          setProgressModal(prev => ({ ...prev, isOpen: false }));
          loadBackupHistory();
        }}
        onCancel={() => {
          toast.warning(
            'Backup Cancelled',
            'Backup operation was cancelled by user.',
          );
          setProgressModal(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, backupId: null, backupName: null })
        }
        onConfirm={confirmDelete}
        title='Delete Backup'
        message='Are you sure you want to delete this backup?'
        itemName={deleteModal.backupName || ''}
        isLoading={deleting}
      />
    </div>
  );
}
