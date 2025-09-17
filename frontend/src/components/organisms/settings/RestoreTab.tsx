'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  FileText,
  HardDrive,
  Download,
  AlertTriangle,
  Eye,
  Trash2,
  XCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import {
  backupService,
  BackupMetadata,
  RestorePreview,
} from '@/api/services/backup.service';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import RestoreProgressModal from '@/components/organisms/modals/RestoreProgressModal';

interface RestoreTabProps {
  isEditing: boolean;
}

export default function RestoreTab({ isEditing }: RestoreTabProps) {
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [availableBackups, setAvailableBackups] = useState<BackupMetadata[]>(
    [],
  );

  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentRestoreBackup, setCurrentRestoreBackup] = useState<string>('');
  const [isFromFileRestore, setIsFromFileRestore] = useState(false);
  const [restoreCompleted, setRestoreCompleted] = useState(false);
  const [restoreError, setRestoreError] = useState<string>('');

  // Restore options
  const [restoreOptions, setRestoreOptions] = useState({
    restoreDatabase: true,
    restoreFiles: true,
    restoreConfig: true,
    dropExisting: false,
    overwrite: false,
  });

  // Check if user has SUPER_ADMIN permissions
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Load available backups on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadAvailableBackups();
    }
  }, [isSuperAdmin]);

  const loadAvailableBackups = async () => {
    try {
      setIsLoadingBackups(true);
      const response = await backupService.listBackups({
        status: 'COMPLETED',
        limit: 10,
      });

      // Handle both wrapped and unwrapped responses
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success && response.data) {
          setAvailableBackups(response.data);
        } else {
          console.warn('Failed to load backups:', response);
          toast.error(response.error || 'Failed to load available backups');
        }
      } else {
        // Response is unwrapped, check if it's an array of backups
        if (Array.isArray(response)) {
          setAvailableBackups(response as BackupMetadata[]);
        } else {
          console.error('Invalid backup list response format:', response);
          toast.error('Invalid backup list format');
        }
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Failed to load available backups');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRestoreFromBackup = async (backup: BackupMetadata) => {
    if (!isSuperAdmin) {
      toast.error('Access denied. SUPER_ADMIN permissions required.');
      return;
    }

    // Check if backup is encrypted and prompt for key if needed
    let decryptionKey: string | undefined;
    if (backup.encrypted) {
      const userKey = prompt(
        `🔐 This backup is encrypted. Please enter the encryption key:\n\nBackup: ${backup.backupId}\nCreated: ${new Date(backup.createdAt).toLocaleString()}\n\nNote: Use the encryption key that was active when this backup was created.\nKey must be at least 32 characters long.`,
      );
      if (!userKey || !userKey.trim()) {
        toast.info(
          'Restore cancelled - encryption key required for encrypted backup',
        );
        return;
      }

      // Basic client-side validation
      const key = userKey.trim();
      if (key.length < 32) {
        toast.error('Encryption key must be at least 32 characters long');
        return;
      }

      decryptionKey = key;
    }

    // Enhanced safety confirmation with pre-restore snapshot info
    const confirmMessage = `⚠️ CRITICAL SAFETY NOTICE ⚠️

You are about to restore from:
• Backup Type: ${backup.type}
• Created: ${backupService.formatTimestamp(backup.startedAt)}
• Size: ${backupService.formatFileSize(Number(backup.size))}
• Encrypted: ${backup.encrypted ? 'Yes' : 'No'}

SAFETY MEASURES:
✅ A pre-restore snapshot will be created automatically
✅ Current system state will be preserved before restore
✅ You can recover from the snapshot if needed

This operation will:
${restoreOptions.restoreDatabase ? '• Replace current database data\n' : ''}${restoreOptions.restoreFiles ? '• Replace current files\n' : ''}${restoreOptions.restoreConfig ? '• Replace configuration files\n' : ''}${restoreOptions.dropExisting ? '• Drop existing database first\n' : ''}${restoreOptions.overwrite ? '• Overwrite duplicate files\n' : ''}
Are you absolutely sure you want to proceed?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRestoring(true);
    setCurrentRestoreBackup(backup.backupId);
    setIsFromFileRestore(false);
    setRestoreCompleted(false);
    setRestoreError('');
    setShowProgressModal(true);

    try {
      const response = await backupService.restoreFromBackup({
        backupId: backup.backupId,
        clientKey: backup.encrypted ? decryptionKey : undefined,
        ...restoreOptions,
      });

      // Handle both wrapped and unwrapped responses
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success) {
          setRestoreCompleted(true);
          toast.success(
            '✅ Restore completed successfully! Pre-restore snapshot is available for rollback if needed.',
            { duration: 5000 },
          );
          // Reload the backups list to show the new pre-restore snapshot
          await loadAvailableBackups();
        } else {
          setRestoreError(
            response.error || response.message || 'Unknown error',
          );
          toast.error(
            `❌ Restore failed: ${response.error || response.message || 'Unknown error'}`,
            { duration: 5000 },
          );
        }
      } else {
        // Response is unwrapped, assume success if no error
        setRestoreCompleted(true);
        toast.success(
          '✅ Restore completed successfully! Pre-restore snapshot is available for rollback if needed.',
          { duration: 5000 },
        );
        await loadAvailableBackups();
      }
    } catch (error) {
      console.error('Restore error:', error);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types
        if (error.message.includes('Failed to fetch')) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (error.message.includes('signal is aborted')) {
          errorMessage =
            'Request timed out. The restore operation may take longer than expected. Please check the server logs.';
        } else if (error.message.includes('CSRF')) {
          errorMessage =
            'Security token error. Please refresh the page and try again.';
        } else if (
          error.message.includes('ENOENT') ||
          error.message.includes('no such file')
        ) {
          errorMessage =
            'Backup file not found or corrupted. Please try a different backup.';
        }
      }

      setRestoreError(errorMessage);
      toast.error(`❌ Restore failed: ${errorMessage}`, { duration: 7000 });
    } finally {
      setIsRestoring(false);
      // Don't auto-close modal, let user close it manually
    }
  };

  const handleRestoreFromFile = async () => {
    if (!isSuperAdmin) {
      toast.error('Access denied. SUPER_ADMIN permissions required.');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please select a backup file to restore from.');
      return;
    }

    // Enhanced safety confirmation for file uploads
    const confirmMessage = `⚠️ CRITICAL SAFETY NOTICE ⚠️

You are about to restore from uploaded file:
• File Name: ${uploadedFile.name}
• File Size: ${backupService.formatFileSize(uploadedFile.size)}
• Type & Encryption: Will be detected automatically

SAFETY MEASURES:
✅ A pre-restore snapshot will be created automatically
✅ Current system state will be preserved before restore
✅ You can recover from the snapshot if needed

This operation will:
${restoreOptions.restoreDatabase ? '• Replace current database data\n' : ''}${restoreOptions.restoreFiles ? '• Replace current files\n' : ''}${restoreOptions.restoreConfig ? '• Replace configuration files\n' : ''}${restoreOptions.dropExisting ? '• Drop existing database first\n' : ''}${restoreOptions.overwrite ? '• Overwrite duplicate files\n' : ''}
Are you absolutely sure you want to proceed?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRestoring(true);
    setCurrentRestoreBackup(uploadedFile.name);
    setIsFromFileRestore(true);
    setRestoreCompleted(false);
    setRestoreError('');
    setShowProgressModal(true);

    try {
      // First attempt without encryption key
      let response;
      try {
        response = await backupService.restoreFromUploadedFile(uploadedFile, {
          clientKey: undefined,
          ...restoreOptions,
        });
      } catch (error) {
        // If the error suggests the file is encrypted, prompt for key
        if (
          error instanceof Error &&
          (error.message.includes('encrypted') ||
            error.message.includes('decryption') ||
            error.message.includes('key'))
        ) {
          const userKey = prompt(
            `🔐 This backup file appears to be encrypted. Please enter the encryption key:\n\nFile: ${uploadedFile.name}\n\nNote: Use the encryption key that was active when this backup was created.\nKey must be at least 32 characters long.`,
          );
          if (!userKey || !userKey.trim()) {
            toast.info(
              'Restore cancelled - encryption key required for encrypted backup',
            );
            return;
          }

          // Basic client-side validation
          const key = userKey.trim();
          if (key.length < 32) {
            toast.error('Encryption key must be at least 32 characters long');
            return;
          }

          // Retry with encryption key
          response = await backupService.restoreFromUploadedFile(uploadedFile, {
            clientKey: key,
            ...restoreOptions,
          });
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Handle both wrapped and unwrapped responses
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success) {
          setRestoreCompleted(true);
          toast.success(
            '✅ Restore from file completed successfully! Pre-restore snapshot is available for rollback if needed.',
            { duration: 5000 },
          );
          setUploadedFile(null);
          // Reload the backups list to show the new pre-restore snapshot
          await loadAvailableBackups();
        } else {
          setRestoreError(
            response.error || response.message || 'Unknown error',
          );
          toast.error(
            `❌ Restore from file failed: ${response.error || response.message || 'Unknown error'}`,
            { duration: 5000 },
          );
        }
      } else {
        // Response is unwrapped, assume success if no error
        setRestoreCompleted(true);
        toast.success(
          '✅ Restore from file completed successfully! Pre-restore snapshot is available for rollback if needed.',
          { duration: 5000 },
        );
        setUploadedFile(null);
        await loadAvailableBackups();
      }
    } catch (error) {
      console.error('Restore from file error:', error);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types
        if (error.message.includes('Failed to fetch')) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (error.message.includes('signal is aborted')) {
          errorMessage =
            'Request timed out. The restore operation may take longer than expected. Please check the server logs.';
        } else if (error.message.includes('CSRF')) {
          errorMessage =
            'Security token error. Please refresh the page and try again.';
        } else if (
          error.message.includes('ENOENT') ||
          error.message.includes('no such file')
        ) {
          errorMessage =
            'Backup file not found or corrupted. Please verify the backup file.';
        }
      }

      setRestoreError(errorMessage);
      toast.error(`❌ Restore failed: ${errorMessage}`, { duration: 7000 });
    } finally {
      setIsRestoring(false);
      // Don't auto-close modal, let user close it manually
    }
  };

  const handlePreview = async (backup: BackupMetadata) => {
    if (!isSuperAdmin) {
      toast.error('Access denied. SUPER_ADMIN permissions required.');
      return;
    }

    // Check if backup is encrypted and prompt for key if needed
    let decryptionKey: string | undefined;
    if (backup.encrypted) {
      const userKey = prompt(
        `🔐 This backup is encrypted. Please enter the encryption key to preview:\n\nBackup: ${backup.backupId}\nCreated: ${new Date(backup.createdAt).toLocaleString()}\n\nKey must be at least 32 characters long.`,
      );
      if (!userKey || !userKey.trim()) {
        toast.info(
          'Preview cancelled - encryption key required for encrypted backup',
        );
        return;
      }

      // Basic client-side validation
      const key = userKey.trim();
      if (key.length < 32) {
        toast.error('Encryption key must be at least 32 characters long');
        return;
      }

      decryptionKey = key;
    }

    try {
      const response = await backupService.getRestorePreview(
        backup.backupId,
        decryptionKey,
      );

      // Handle both wrapped and unwrapped responses
      if (response.success !== undefined) {
        // Response is wrapped with success/data structure
        if (response.success && response.data) {
          const preview = response.data;
          alert(
            `Backup Contents:\nType: ${preview.type}\nSize: ${backupService.formatFileSize(preview.size)}\nContents: ${preview.contents.slice(0, 10).join(', ')}${preview.contents.length > 10 ? '...' : ''}`,
          );
        } else {
          toast.error(response.error || 'Failed to preview backup');
        }
      } else {
        // Response is unwrapped, check if it has preview structure
        if (
          response &&
          typeof response === 'object' &&
          'type' in response &&
          'size' in response &&
          'contents' in response
        ) {
          const preview = response as unknown as RestorePreview;
          alert(
            `Backup Contents:\nType: ${preview.type}\nSize: ${backupService.formatFileSize(preview.size)}\nContents: ${preview.contents.slice(0, 10).join(', ')}${preview.contents.length > 10 ? '...' : ''}`,
          );
        } else {
          toast.error('Invalid preview response format');
        }
      }
    } catch (error) {
      console.error('Preview error:', error);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types
        if (error.message.includes('Failed to fetch')) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else if (error.message.includes('signal is aborted')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('CSRF')) {
          errorMessage =
            'Security token error. Please refresh the page and try again.';
        }
      }

      toast.error(`Preview failed: ${errorMessage}`);
    }
  };

  const handleDownload = async (backup: BackupMetadata) => {
    if (!isSuperAdmin) {
      toast.error('Access denied. SUPER_ADMIN permissions required.');
      return;
    }

    // Check if backup is encrypted and prompt for key if needed
    let decryptionKey: string | undefined;
    if (backup.encrypted) {
      const userKey = prompt(
        `🔐 This backup is encrypted. Please enter the encryption key to download:\n\nBackup: ${backup.backupId}\nCreated: ${new Date(backup.createdAt).toLocaleString()}\n\nKey must be at least 32 characters long.`,
      );
      if (!userKey || !userKey.trim()) {
        toast.info(
          'Download cancelled - encryption key required for encrypted backup',
        );
        return;
      }

      // Basic client-side validation
      const key = userKey.trim();
      if (key.length < 32) {
        toast.error('Encryption key must be at least 32 characters long');
        return;
      }

      decryptionKey = key;
    }

    try {
      toast.info('Starting backup download...');
      await backupService.downloadBackup(backup.backupId, decryptionKey);
      toast.success('Backup download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  // Show access denied message if not SUPER_ADMIN
  if (!isSuperAdmin) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Card className='p-8 text-center max-w-md'>
          <XCircle className='h-16 w-16 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Access Denied
          </h3>
          <p className='text-gray-600'>
            Restore operations require SUPER_ADMIN permissions. Please contact
            your system administrator.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Instructions & Warning */}
      <div className='space-y-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <CheckCircle className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-blue-800'>
                How to Restore:
              </p>
              <ul className='text-sm text-blue-700 mt-2 space-y-1'>
                <li>
                  1. Configure restore options (what to restore, overwrite
                  settings, etc.)
                </li>
                <li>
                  2. Either upload a backup file OR select from available
                  backups below
                </li>
                <li>
                  3. If the backup is encrypted, you'll be prompted for the
                  encryption key
                </li>
                <li>4. Click restore and confirm the operation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-yellow-800'>Warning:</p>
              <p className='text-sm text-yellow-700'>
                Restoring from a backup will replace current data with the
                backup version. A pre-restore snapshot will be created
                automatically for safety.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Options */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-indigo-50 rounded-lg'>
            <CheckCircle className='h-5 w-5 text-indigo-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Restore Options
            </h3>
            <p className='text-sm text-gray-600'>
              Select which components to restore from the backup
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='restore-database'
                  className='text-sm font-medium text-gray-700'
                >
                  Restore Database
                </label>
                <input
                  id='restore-database'
                  type='checkbox'
                  checked={restoreOptions.restoreDatabase}
                  onChange={e =>
                    setRestoreOptions(prev => ({
                      ...prev,
                      restoreDatabase: e.target.checked,
                    }))
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Restore all database records and settings
              </p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='restore-files'
                  className='text-sm font-medium text-gray-700'
                >
                  Restore Files
                </label>
                <input
                  id='restore-files'
                  type='checkbox'
                  checked={restoreOptions.restoreFiles}
                  onChange={e =>
                    setRestoreOptions(prev => ({
                      ...prev,
                      restoreFiles: e.target.checked,
                    }))
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Restore uploaded documents and media files
              </p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='restore-config'
                  className='text-sm font-medium text-gray-700'
                >
                  Restore Configuration
                </label>
                <input
                  id='restore-config'
                  type='checkbox'
                  checked={restoreOptions.restoreConfig}
                  onChange={e =>
                    setRestoreOptions(prev => ({
                      ...prev,
                      restoreConfig: e.target.checked,
                    }))
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Restore system configuration and settings
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='drop-existing'
                  className='text-sm font-medium text-gray-700'
                >
                  Clear Existing Data First
                </label>
                <input
                  id='drop-existing'
                  type='checkbox'
                  checked={restoreOptions.dropExisting}
                  onChange={e =>
                    setRestoreOptions(prev => ({
                      ...prev,
                      dropExisting: e.target.checked,
                    }))
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Remove all existing data before restore (recommended for clean
                restore)
              </p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='overwrite'
                  className='text-sm font-medium text-gray-700'
                >
                  Replace Duplicate Files
                </label>
                <input
                  id='overwrite'
                  type='checkbox'
                  checked={restoreOptions.overwrite}
                  onChange={e =>
                    setRestoreOptions(prev => ({
                      ...prev,
                      overwrite: e.target.checked,
                    }))
                  }
                  disabled={!isEditing}
                  className='h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded'
                />
              </div>
              <p className='text-xs text-gray-500'>
                Replace files that already exist with backup versions
              </p>
            </div>
          </div>
        </div>
      </Card>

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
              disabled={!isEditing}
              className='hidden'
              id='backup-file'
            />
            <label
              htmlFor='backup-file'
              className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${!isEditing ? 'bg-gray-400 cursor-not-allowed' : ''}`}
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

          {/* Additional Options */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-blue-600' />
              <div>
                <p className='text-sm font-medium text-blue-800'>
                  Smart Detection
                </p>
                <p className='text-xs text-blue-700'>
                  Backup type and encryption will be detected automatically from
                  the uploaded file.
                </p>
              </div>
            </div>
          </div>

          {/* Restore Button */}
          <div className='flex justify-center mt-6'>
            <ReusableButton
              onClick={handleRestoreFromFile}
              className='bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium'
              disabled={!uploadedFile || !isEditing || isRestoring}
            >
              {isRestoring ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Restoring from File...
                </div>
              ) : (
                'Restore from File'
              )}
            </ReusableButton>
          </div>
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

        {isLoadingBackups ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
            <span className='ml-2 text-gray-600'>
              Loading available backups...
            </span>
          </div>
        ) : availableBackups.length > 0 ? (
          <div className='space-y-3'>
            {availableBackups.map(backup => {
              const getBackupIcon = (type: string) => {
                switch (type) {
                  case 'DATABASE':
                    return Database;
                  case 'FILES':
                    return FileText;
                  case 'FULL_SYSTEM':
                    return HardDrive;
                  default:
                    return Database;
                }
              };

              const IconComponent = getBackupIcon(backup.type);
              return (
                <div
                  key={backup.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-gray-50 rounded-lg'>
                      <IconComponent className='h-4 w-4 text-blue-600' />
                    </div>
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {backup.type}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {backupService.formatTimestamp(backup.startedAt)} •{' '}
                        {backupService.formatFileSize(backup.size)}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        {backup.encrypted ? (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200'>
                            🔐 Encrypted
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200'>
                            🔓 Unencrypted
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            backup.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : backup.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {backup.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <ReusableButton
                      onClick={() => handleDownload(backup)}
                      className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      disabled={!isEditing || isRestoring}
                    >
                      <Download className='h-4 w-4' />
                    </ReusableButton>
                    <ReusableButton
                      onClick={() => handlePreview(backup)}
                      className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                      disabled={!isEditing || isRestoring}
                    >
                      <Eye className='h-4 w-4' />
                    </ReusableButton>
                    <ReusableButton
                      onClick={() => handleRestoreFromBackup(backup)}
                      className='px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                      disabled={!isEditing || isRestoring}
                    >
                      {isRestoring ? (
                        <div className='flex items-center gap-1'>
                          <Loader2 className='h-3 w-3 animate-spin' />
                          Restoring...
                        </div>
                      ) : (
                        'Restore'
                      )}
                    </ReusableButton>
                    <ReusableButton
                      onClick={() => {}}
                      className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      disabled={!isEditing}
                    >
                      <Trash2 className='h-4 w-4' />
                    </ReusableButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <Database className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>No completed backups available</p>
            <p className='text-sm mt-2'>
              Create backups using the Manual Backup tab
            </p>
          </div>
        )}
      </Card>

      {/* Progress Modal */}
      <RestoreProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setRestoreCompleted(false);
          setRestoreError('');
        }}
        backupName={currentRestoreBackup}
        isFromFile={isFromFileRestore}
        isCompleted={restoreCompleted}
        isError={!!restoreError}
        errorMessage={restoreError}
      />
    </div>
  );
}
