'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  FileText,
  HardDrive,
  Download,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupService } from '@/api/services/backup.service';
import RestoreConfirmationModal from '@/components/molecules/modals/RestoreConfirmationModal';
import DecryptionKeyModal from '@/components/molecules/modals/DecryptionKeyModal';
import RestoreProgressModal from '@/components/molecules/modals/RestoreProgressModal';
import DeleteConfirmationModal from '@/components/organisms/modals/DeleteConfirmationModal';
import { useBackupContext } from '@/context/BackupContext';

interface AvailableBackup {
  id: string;
  name: string;
  date: string;
  time: string;
  size: string;
  type: 'Full Backup' | 'Database Backup' | 'Files Backup';
  encrypted: boolean;
  location: 'Both' | 'Local' | 'Offsite';
  frequency: 'Daily' | 'Weekly';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function RestoreTab() {
  const { toast } = useBackupContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [availableBackups, setAvailableBackups] = useState<AvailableBackup[]>(
    [],
  );
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    backup: AvailableBackup | null;
    isFileUpload: boolean;
  }>({
    isOpen: false,
    backup: null,
    isFileUpload: false,
  });
  const [decryptionModal, setDecryptionModal] = useState<{
    isOpen: boolean;
    backupName: string;
    backup: AvailableBackup | null;
  }>({
    isOpen: false,
    backupName: '',
    backup: null,
  });
  const [restoreProgressModal, setRestoreProgressModal] = useState({
    isOpen: false,
    backupId: '',
    uploadedFile: null as File | null,
    decryptionKey: '',
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    backup: AvailableBackup | null;
  }>({ isOpen: false, backup: null });
  const [deleting, setDeleting] = useState(false);

  // Load available backups
  useEffect(() => {
    loadAvailableBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadAvailableBackups = async () => {
    try {
      setLoading(true);
      const response = await backupService.listBackups();

      if (response.success && response.data) {
        type BackupResponse = {
          backupId: string;
          type: string;
          startedAt?: string;
          createdAt?: string;
          size?: number;
          encrypted?: boolean;
          offsiteBackupCompleted?: boolean;
          scheduledBackup?: boolean;
        };
        const backupsList = (response.data as unknown as BackupResponse[]).map(
          (backup): AvailableBackup => {
            const backupTypeName =
              backup.type === 'DATABASE'
                ? 'Database Backup'
                : backup.type === 'FILES'
                  ? 'Files Backup'
                  : 'Full System Backup';
            const backupDate = new Date(
              backup.startedAt || backup.createdAt || Date.now(),
            );
            const locationLabel = backup.offsiteBackupCompleted
              ? 'Both'
              : 'Local';
            const frequencyLabel = backup.scheduledBackup
              ? 'Scheduled'
              : 'Manual';

            return {
              id: backup.backupId,
              name: backupTypeName,
              type: backupTypeName as
                | 'Full Backup'
                | 'Database Backup'
                | 'Files Backup',
              date: backupDate.toLocaleDateString(),
              time: backupDate.toLocaleTimeString(),
              size: formatBytes(backup.size || 0),
              encrypted: backup.encrypted || false,
              location: locationLabel as 'Both' | 'Local' | 'Offsite',
              frequency: frequencyLabel as 'Daily' | 'Weekly',
              icon:
                backup.type === 'FULL_SYSTEM'
                  ? HardDrive
                  : backup.type === 'DATABASE'
                    ? Database
                    : FileText,
              color:
                backup.type === 'FULL_SYSTEM'
                  ? 'text-purple-600'
                  : backup.type === 'DATABASE'
                    ? 'text-blue-600'
                    : 'text-green-600',
            };
          },
        );
        setAvailableBackups(backupsList);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRestore = async (backup: AvailableBackup) => {
    // If backup is encrypted, show decryption modal first
    if (backup.encrypted) {
      setDecryptionModal({
        isOpen: true,
        backupName: backup.name,
        backup: backup,
      });
      return;
    }

    try {
      setLoading(true);

      // Initiate restore via API
      const response = await backupService.restoreBackup({
        backupId: backup.id,
      });

      if (response.success && response.data?.operationId) {
        // Open restore progress modal with operationId
        setRestoreProgressModal({
          isOpen: true,
          backupId: response.data.operationId,
          uploadedFile: null,
          decryptionKey: '',
        });
      } else {
        toast.error(
          'Restore Failed',
          response.error || 'Failed to initiate restore',
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start restore';
      toast.error('Restore Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileRestore = () => {
    if (!uploadedFile) return;

    // Open restore progress modal with uploaded file
    setRestoreProgressModal({
      isOpen: true,
      backupId: '',
      uploadedFile: uploadedFile,
      decryptionKey: decryptionKey,
    });
  };

  const handleDownload = async (backup: AvailableBackup) => {
    try {
      setLoading(true);
      const blob = await backupService.downloadBackup(backup.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.name || `backup-${backup.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download Started', 'Backup file is being downloaded');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Download failed';
      toast.error('Download Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (backup: AvailableBackup) => {
    setDeleteModal({ isOpen: true, backup });
  };

  const confirmDelete = async () => {
    if (!deleteModal.backup) return;

    try {
      setDeleting(true);
      const response = await backupService.deleteBackup(deleteModal.backup.id);
      if (response.success) {
        toast.success('Backup Deleted', 'Backup has been deleted successfully');
        setDeleteModal({ isOpen: false, backup: null });
        loadAvailableBackups(); // Refresh list
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

  const handleDecryptionKeySubmit = async (key: string) => {
    const backup = decryptionModal.backup;
    setDecryptionModal({ isOpen: false, backupName: '', backup: null });

    if (!backup) return;

    try {
      setLoading(true);

      // Initiate restore via API with decryption key
      const response = await backupService.restoreBackup({
        backupId: backup.id,
        clientKey: key,
      });

      if (response.success && response.data?.operationId) {
        // Open restore progress modal with operationId
        setRestoreProgressModal({
          isOpen: true,
          backupId: response.data.operationId,
          uploadedFile: null,
          decryptionKey: key,
        });
      } else {
        toast.error(
          'Restore Failed',
          response.error || 'Failed to initiate restore',
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start restore';
      toast.error('Restore Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRestore = async (
    options: Record<string, unknown> & { clientKey?: string },
  ) => {
    try {
      setLoading(true);
      setError('');

      // Add decryption key if available
      const restoreOptions = {
        ...options,
        clientKey: decryptionKey || options.clientKey,
      };

      let response;
      if (confirmModal.isFileUpload && uploadedFile) {
        response = await backupService.uploadAndRestore(
          uploadedFile,
          restoreOptions,
        );
      } else if (confirmModal.backup) {
        response = await backupService.restoreBackup({
          ...restoreOptions,
          backupId: confirmModal.backup.id,
        });
      }

      if (response && response.success) {
        toast.success(
          'Restore Completed',
          'Data has been restored successfully!',
        );
        setConfirmModal({ isOpen: false, backup: null, isFileUpload: false });
        setDecryptionKey(''); // Clear decryption key
        setUploadedFile(null);
        loadAvailableBackups(); // Refresh the backup list
      } else {
        const errorMsg = response?.error || 'Restore failed';
        setError(errorMsg);
        toast.error('Restore Failed', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Restore failed';
      setError(errorMsg);
      toast.error('Restore Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getLocationBadge = (location: string) => {
    switch (location) {
      case 'Both':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'>
            Both
          </span>
        );
      case 'Local':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            Local
          </span>
        );
      case 'Offsite':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            Offsite
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
            Unknown
          </span>
        );
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

      {/* Warning */}
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div>
            <p className='text-sm font-medium text-yellow-800'>Warning:</p>
            <p className='text-sm text-yellow-700'>
              Restoring from a backup will overwrite all current data. Make sure
              to create a backup of the current system before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Upload & Restore Backup */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Upload className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Upload & Restore Backup
            </h3>
            <p className='text-sm text-gray-600'>
              Upload a backup file to restore from
            </p>
          </div>
        </div>

        <div className='space-y-6'>
          {/* File Upload Area */}
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
            <Upload className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-gray-900 mb-2'>
              Upload Backup File
            </h4>
            <p className='text-sm text-gray-600 mb-4'>
              Select a backup file (.sql, .gz, .zip, .tar.gz) to restore
            </p>
            <input
              type='file'
              accept='.sql,.gz,.zip,.tar.gz'
              onChange={handleFileUpload}
              className='hidden'
              id='backup-file'
            />
            <label
              htmlFor='backup-file'
              className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors`}
            >
              <Upload className='h-4 w-4' />
              Choose File
            </label>
            {uploadedFile && (
              <p className='text-sm text-green-600 mt-2'>
                Selected: {uploadedFile.name} (
                {Math.round(uploadedFile.size / 1024 / 1024)} MB)
              </p>
            )}
          </div>

          {/* Restore Button */}
          {uploadedFile && (
            <ReusableButton
              onClick={handleFileRestore}
              className='w-full px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium'
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Restore from Uploaded File'}
            </ReusableButton>
          )}
        </div>
      </Card>

      {/* Available Backups */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <Database className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Available Backups
            </h3>
            <p className='text-sm text-gray-600'>
              Select a backup to restore from
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          {availableBackups.map(backup => {
            const IconComponent = backup.icon;
            return (
              <div
                key={backup.id}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 bg-gray-50 rounded-lg ${backup.color}`}>
                    <IconComponent className='h-4 w-4' />
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900'>{backup.name}</h4>
                    <p className='text-sm text-gray-600'>
                      {backup.date}, {backup.time} • {backup.size}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      {backup.encrypted && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                          Encrypted
                        </span>
                      )}
                      {getLocationBadge(backup.location)}
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
                        {backup.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <ReusableButton
                    onClick={() => handleDownload(backup)}
                    className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    disabled={loading}
                  >
                    <Download className='h-4 w-4' />
                  </ReusableButton>
                  <ReusableButton
                    onClick={() => handleRestore(backup)}
                    className='px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm disabled:opacity-50'
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Restore'}
                  </ReusableButton>
                  <ReusableButton
                    onClick={() => handleDelete(backup)}
                    className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    disabled={loading}
                  >
                    <Trash2 className='h-4 w-4' />
                  </ReusableButton>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Decryption Key Modal */}
      <DecryptionKeyModal
        isOpen={decryptionModal.isOpen}
        onClose={() =>
          setDecryptionModal({ isOpen: false, backupName: '', backup: null })
        }
        onSubmit={handleDecryptionKeySubmit}
        backupName={decryptionModal.backupName}
      />

      {/* Restore Progress Modal */}
      <RestoreProgressModal
        isOpen={restoreProgressModal.isOpen}
        onClose={() => {
          setRestoreProgressModal({
            isOpen: false,
            backupId: '',
            uploadedFile: null,
            decryptionKey: '',
          });
          setUploadedFile(null);
          loadAvailableBackups();
        }}
        backupId={restoreProgressModal.backupId}
        uploadedFile={restoreProgressModal.uploadedFile || undefined}
        decryptionKey={restoreProgressModal.decryptionKey}
        onComplete={() => {
          toast.success(
            'Restore Completed',
            'Data has been restored successfully!',
          );
          setRestoreProgressModal({
            isOpen: false,
            backupId: '',
            uploadedFile: null,
            decryptionKey: '',
          });
          setUploadedFile(null);
          loadAvailableBackups();
        }}
        onCancel={() => {
          toast.warning(
            'Restore Cancelled',
            'Restore operation was cancelled by user.',
          );
          setRestoreProgressModal({
            isOpen: false,
            backupId: '',
            uploadedFile: null,
            decryptionKey: '',
          });
        }}
      />

      {/* Restore Confirmation Modal */}
      <RestoreConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, backup: null, isFileUpload: false })
        }
        onConfirm={handleConfirmRestore as (options: unknown) => void}
        backup={confirmModal.backup as never}
        isFileUpload={confirmModal.isFileUpload}
        uploadedFile={uploadedFile}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, backup: null })}
        onConfirm={confirmDelete}
        title='Delete Backup'
        message='Are you sure you want to delete this backup?'
        itemName={deleteModal.backup?.name || ''}
        isLoading={deleting}
      />
    </div>
  );
}
