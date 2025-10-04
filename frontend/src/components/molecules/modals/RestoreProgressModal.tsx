'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, Loader2, Upload, Lock } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface ProgressStage {
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
  error?: string;
}

interface RestoreProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupId?: string;
  uploadedFile?: File;
  decryptionKey?: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

export default function RestoreProgressModal({
  isOpen,
  onClose,
  backupId,
  uploadedFile,
  decryptionKey,
  onComplete,
  onCancel,
}: RestoreProgressModalProps) {
  const [currentStage, setCurrentStage] = useState<ProgressStage | null>(null);
  const [allStages, setAllStages] = useState<ProgressStage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [needsDecryptionKey, setNeedsDecryptionKey] = useState(false);
  const [detectedBackupType, setDetectedBackupType] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setAllStages([]);
    setCurrentStage(null);
    setIsComplete(false);
    setHasFailed(false);
    setError('');
    setNeedsDecryptionKey(false);

    // If file is uploaded, detect metadata first
    if (uploadedFile) {
      detectFileMetadata();
    } else if (backupId) {
      // For existing backups, start restore immediately
      connectToRestoreProgress(backupId);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, backupId, uploadedFile]);

  const detectFileMetadata = async () => {
    if (!uploadedFile) return;

    try {
      setCurrentStage({
        stage: 'detecting',
        progress: 10,
        message: 'Analyzing backup file...',
        timestamp: new Date(),
      });

      // Read first few bytes to detect file type and encryption
      const buffer = await uploadedFile.slice(0, 512).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Check for encryption markers (salt, nonce, authTag pattern from AES-GCM)
      const hasEncryptionMarkers = bytes.length >= 44; // salt(16) + nonce(12) + authTag(16)

      // Detect backup type from file extension
      const fileName = uploadedFile.name.toLowerCase();
      let backupType = 'FULL_SYSTEM';
      if (fileName.endsWith('.sql') || fileName.endsWith('.sql.gz')) {
        backupType = 'DATABASE';
      } else if (
        fileName.includes('files') &&
        (fileName.endsWith('.tar.gz') || fileName.endsWith('.zip'))
      ) {
        backupType = 'FILES';
      }

      setDetectedBackupType(backupType);
      setIsEncrypted(hasEncryptionMarkers);

      // If encrypted and no key provided, pause and request key
      if (hasEncryptionMarkers && !decryptionKey) {
        setNeedsDecryptionKey(true);
        setCurrentStage({
          stage: 'waiting_key',
          progress: 15,
          message: 'Backup is encrypted. Decryption key required.',
          timestamp: new Date(),
        });
        return;
      }

      // Proceed with upload and restore
      startRestore();
    } catch (err) {
      setError('Failed to analyze backup file');
      setHasFailed(true);
    }
  };

  const startRestore = async () => {
    if (!uploadedFile) return;

    try {
      setCurrentStage({
        stage: 'uploading',
        progress: 20,
        message: 'Uploading backup file...',
        timestamp: new Date(),
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('backupFile', uploadedFile);
      if (decryptionKey) {
        formData.append('clientKey', decryptionKey);
      }

      // Upload file and start restore
      const response = await fetch('/api/v1/backup/restore/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success || !result.data?.operationId) {
        throw new Error(result.error || 'Failed to initiate restore');
      }

      // Connect to SSE for progress tracking
      connectToRestoreProgress(result.data.operationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start restore');
      setHasFailed(true);
    }
  };

  const connectToRestoreProgress = (restoreId: string) => {
    const eventSource = new EventSource(
      `/api/v1/backup/progress/stream/${restoreId}`,
      { withCredentials: true },
    );

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          setHasFailed(true);
          eventSource.close();
          return;
        }

        const stage: ProgressStage = {
          stage: data.stage,
          progress: data.progress,
          message: data.message,
          timestamp: new Date(data.timestamp),
          error: data.error,
        };

        setCurrentStage(stage);
        setAllStages(prev => {
          const exists = prev.some(
            s =>
              s.stage === stage.stage &&
              s.message === stage.message &&
              s.progress === stage.progress,
          );
          return exists ? prev : [...prev, stage];
        });

        if (data.stage === 'completed' || data.progress === 100) {
          setIsComplete(true);
          onComplete?.(data.details || {});
          eventSource.close();
        } else if (data.stage === 'failed' || data.error) {
          setHasFailed(true);
          setError(data.error || 'Restore failed');
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse restore progress:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    eventSourceRef.current = eventSource;
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    onClose();
  };

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    onCancel?.();
    onClose();
  };

  if (!isOpen) return null;

  const getStageIcon = (stage: string) => {
    if (hasFailed) return <XCircle className='h-5 w-5 text-red-600' />;
    if (isComplete) return <CheckCircle className='h-5 w-5 text-green-600' />;
    return <Loader2 className='h-5 w-5 text-blue-600 animate-spin' />;
  };

  const getStatusColor = () => {
    if (hasFailed) return 'text-red-600';
    if (isComplete) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <Card className='w-full max-w-2xl p-6 m-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg ${isComplete ? 'bg-green-100' : hasFailed ? 'bg-red-100' : 'bg-blue-100'}`}
            >
              {getStageIcon(currentStage?.stage || '')}
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {isComplete
                  ? 'Restore Complete'
                  : hasFailed
                    ? 'Restore Failed'
                    : 'Restoring Backup'}
              </h2>
              <p className='text-sm text-gray-600'>
                {detectedBackupType && `Type: ${detectedBackupType}`}
                {isEncrypted && ' • Encrypted'}
              </p>
            </div>
          </div>
          {(isComplete || hasFailed) && (
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Decryption Key Required */}
        {needsDecryptionKey && (
          <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <Lock className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-yellow-800'>
                  Decryption Key Required
                </p>
                <p className='text-sm text-yellow-700 mt-1'>
                  This backup is encrypted. Please provide the decryption key to
                  continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Stage */}
        {currentStage && !needsDecryptionKey && (
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {currentStage.message}
              </span>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {currentStage.progress}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasFailed
                    ? 'bg-red-600'
                    : isComplete
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                }`}
                style={{ width: `${currentStage.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <XCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-red-800'>
                  Restore Failed
                </p>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stage History */}
        {allStages.length > 0 && !needsDecryptionKey && (
          <div className='mb-6'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>
              Restore Progress
            </h3>
            <div className='space-y-2 max-h-48 overflow-y-auto'>
              {allStages.map((stage, index) => (
                <div
                  key={index}
                  className='flex items-start gap-3 p-2 bg-gray-50 rounded-lg text-sm'
                >
                  <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-gray-900'>{stage.message}</p>
                    <p className='text-xs text-gray-500'>
                      {stage.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {stage.progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex items-center justify-end gap-3'>
          {!isComplete && !hasFailed && !needsDecryptionKey && (
            <ReusableButton
              onClick={handleCancel}
              className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              Cancel
            </ReusableButton>
          )}
          {(isComplete || hasFailed) && (
            <ReusableButton
              onClick={handleClose}
              className={`px-6 py-2 text-white rounded-lg transition-colors ${
                isComplete
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isComplete ? 'Close' : 'Close'}
            </ReusableButton>
          )}
        </div>
      </Card>
    </div>
  );
}
