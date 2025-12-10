'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupService } from '@/api/services/backup.service';

interface ProgressStage {
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
  error?: string;
  details?: Record<string, unknown>;
}

interface RestoreProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupId?: string;
  uploadedFile?: File;
  decryptionKey?: string;
  onComplete?: (result: Record<string, unknown>) => void;
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
  const [timing, setTiming] = useState<{
    elapsed: number;
    remaining: number | null;
  }>({
    elapsed: 0,
    remaining: null,
  });
  const [detectedBackupType, setDetectedBackupType] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const historyLoadedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  const formatDuration = useCallback((seconds: number) => {
    const clamped = Math.max(0, Math.round(seconds));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    if (mins === 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs}s`;
  }, []);

  const updateTiming = useCallback(
    (progress: number, eventTimestamp?: number) => {
      const now = eventTimestamp ?? Date.now();
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }
      const elapsedSeconds = Math.max(0, (now - startTimeRef.current) / 1000);
      let remainingSeconds: number | null = null;
      if (progress > 0 && progress < 100) {
        const estimatedTotal = elapsedSeconds / (progress / 100);
        remainingSeconds = Math.max(0, estimatedTotal - elapsedSeconds);
      }
      setTiming({ elapsed: elapsedSeconds, remaining: remainingSeconds });
    },
    [],
  );

  const loadProgressHistory = useCallback(
    async (operationId?: string): Promise<boolean> => {
      const targetId = operationId || backupId;
      if (!targetId) return false;

      const wait = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));
      const MAX_ATTEMPTS = 6;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
          await wait(400 * attempt);
        }

        try {
          const historyResponse =
            await backupService.getProgressHistory(targetId);
          const history =
            (historyResponse?.data as Array<{
              stage: string;
              progress: number;
              message: string;
              timestamp: string | Date;
              error?: string;
              details?: Record<string, unknown>;
            }>) || [];

          if (!Array.isArray(history) || history.length === 0) {
            continue;
          }

          const normalized = history.map(item => ({
            stage: item.stage,
            progress: item.progress,
            message: item.message,
            timestamp: new Date(item.timestamp),
            error: item.error,
            details: item.details,
          }));

          normalized.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
          );

          const latest = normalized[normalized.length - 1];

          if (normalized.length > 0 && startTimeRef.current === null) {
            startTimeRef.current = normalized[0].timestamp.getTime();
          }

          setAllStages(normalized);
          setCurrentStage(latest);
          updateTiming(latest.progress, latest.timestamp.getTime());

          if (
            latest.stage === 'restore_completed' ||
            latest.stage === 'completed' ||
            latest.progress >= 100
          ) {
            setIsComplete(true);
            setHasFailed(false);
            setError('');
            historyLoadedRef.current = true;
            onComplete?.(latest.details || {});
            return true;
          }

          if (latest.stage === 'restore_failed' || latest.error) {
            setHasFailed(true);
            setError(latest.error || latest.message || 'Restore failed');
            historyLoadedRef.current = true;
            return true;
          }

          historyLoadedRef.current = true;
          return true;
        } catch (historyError) {
          console.error(
            'Failed to load restore progress history:',
            historyError,
          );
        }
      }

      return false;
    },
    [backupId, onComplete, updateTiming],
  );

  useEffect(() => {
    if (!isOpen) return;

    historyLoadedRef.current = false;
    startTimeRef.current = Date.now();
    setTiming({ elapsed: 0, remaining: null });

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
      startTimeRef.current = null;
      setTiming({ elapsed: 0, remaining: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const originalName = uploadedFile.name.toLowerCase();
      const sanitizedName = originalName.endsWith('.enc')
        ? originalName.replace(/\.enc$/, '')
        : originalName;
      let backupType = 'FULL_SYSTEM';
      if (sanitizedName.endsWith('.sql') || sanitizedName.endsWith('.sql.gz')) {
        backupType = 'DATABASE';
      } else if (
        sanitizedName.includes('files') &&
        (sanitizedName.endsWith('.tar.gz') || sanitizedName.endsWith('.zip'))
      ) {
        backupType = 'FILES';
      }

      setDetectedBackupType(backupType);
      const appearsEncrypted =
        hasEncryptionMarkers || originalName.endsWith('.enc');
      setIsEncrypted(appearsEncrypted);

      // If encrypted and no key provided, pause and request key
      if (appearsEncrypted && !decryptionKey) {
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
    } catch {
      setError('Failed to analyze backup file');
      setHasFailed(true);
    }
  };

  const startRestore = async () => {
    if (!uploadedFile) return;

    try {
      console.log('📤 Uploading file for restore:', uploadedFile.name);

      setCurrentStage({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading backup file...',
        timestamp: new Date(),
      });

      // Get CSRF token
      const { csrfService } = await import('@/api/services/csrf.service');
      const token = await csrfService.getToken();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('backupFile', uploadedFile);
      if (decryptionKey) {
        formData.append('clientKey', decryptionKey);
      }
      formData.append('originalFilename', uploadedFile.name);
      formData.append('detectedType', detectedBackupType);
      formData.append('isEncrypted', String(isEncrypted));

      console.log('📡 Uploading to: /api/v1/backup/restore/upload');

      // Upload file and start restore
      const response = await fetch('/api/v1/backup/restore/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token,
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });

      const result = await response.json();
      console.log('📦 Upload response:', result);

      if (!result.success) {
        throw new Error(
          result.error || result.message || 'Failed to initiate restore',
        );
      }

      const operationId = result.data?.operationId;
      if (!operationId) {
        throw new Error('No operation ID received from server');
      }

      console.log('✅ Restore initiated with operationId:', operationId);

      setCurrentStage({
        stage: 'uploaded',
        progress: 20,
        message: 'File uploaded, starting restore...',
        timestamp: new Date(),
      });

      // Connect to SSE for progress tracking
      connectToRestoreProgress(operationId);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start restore';
      console.error('❌ Restore upload error:', errorMsg);
      setError(errorMsg);
      setHasFailed(true);
    }
  };

  const connectToRestoreProgress = (restoreId: string) => {
    console.log(`🔗 Connecting to restore progress stream: ${restoreId}`);

    // Small delay to ensure backend has initialized the progress tracking
    setTimeout(() => {
      const eventSource = new EventSource(
        `/api/v1/backup/progress/stream/${restoreId}`,
        { withCredentials: true },
      );

      eventSource.onopen = () => {
        console.log('✅ Restore SSE connection established');
      };

      eventSource.onmessage = async event => {
        try {
          const data = JSON.parse(event.data);
          console.log('📊 Restore progress update:', data);

          // Handle error flag
          if (data.error && typeof data.error === 'string') {
            if (data.error.includes('Operation not found')) {
              console.warn(
                '⚠️ Restore operation not found. Attempting history fallback.',
              );
              const historyLoaded = await loadProgressHistory(restoreId);
              if (!historyLoaded) {
                setError(data.error);
                setHasFailed(true);
              }
              eventSource.close();
              return;
            }

            console.error('❌ Restore error received:', data.error);
            setError(data.error);
            setHasFailed(true);
            eventSource.close();
            return;
          }

          // Handle completion status
          if (data.status === 'completed') {
            console.log('✅ Restore completed (status flag)');
            setIsComplete(true);
            eventSource.close();
            onComplete?.(data.details || {});
            return;
          }

          // Build progress stage
          const stage: ProgressStage = {
            stage: data.stage || 'processing',
            progress: data.progress || 0,
            message: data.message || 'Processing...',
            timestamp: new Date(data.timestamp || Date.now()),
            error: data.error,
            details: (data.details as Record<string, unknown>) || undefined,
          };

          setCurrentStage(stage);
          updateTiming(stage.progress, stage.timestamp.getTime());
          setAllStages(prev => {
            const exists = prev.some(
              s =>
                s.stage === stage.stage &&
                s.message === stage.message &&
                s.progress === stage.progress,
            );
            return exists ? prev : [...prev, stage];
          });

          // Check for completion or failure
          if (
            data.stage === 'restore_completed' ||
            data.stage === 'completed' ||
            data.progress >= 100
          ) {
            console.log('✅ Restore completed successfully');
            setIsComplete(true);
            onComplete?.(data.details || {});
            eventSource.close();
          } else if (
            data.stage === 'restore_failed' ||
            data.stage === 'failed' ||
            (data.error && typeof data.error === 'string')
          ) {
            console.error('❌ Restore failed:', data.error || 'Unknown error');
            setHasFailed(true);
            setError(
              typeof data.error === 'string' ? data.error : 'Restore failed',
            );
            eventSource.close();
          }
        } catch (err) {
          console.error('Failed to parse restore progress:', err);
        }
      };

      eventSource.onerror = async err => {
        console.error('❌ Restore SSE error:', err);
        // Check if restore is already complete or failed
        if (!isComplete && !hasFailed) {
          console.log(
            '⚠️ Connection closed unexpectedly. Attempting history fallback.',
          );
          const historyLoaded = await loadProgressHistory(restoreId);
          if (!historyLoaded) {
            setError(
              'Connection to restore stream lost. Please refresh to check status.',
            );
            setHasFailed(true);
          }
        }
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    }, 500); // 500ms delay to ensure backend is ready
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

  const getStageIcon = (_stage: string) => {
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
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

        {/* Wait Banner */}
        {!isComplete && !hasFailed && !needsDecryptionKey && (
          <div className='mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4'>
            <p className='text-sm font-semibold text-blue-900'>
              Please wait while your restore completes.
            </p>
            <p className='mt-1 text-xs text-blue-700'>
              Elapsed: {formatDuration(timing.elapsed)}
              {timing.remaining !== null
                ? ` • Approximately ${formatDuration(timing.remaining)} remaining`
                : ''}
            </p>
          </div>
        )}

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

        {isComplete && (
          <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-green-900'>
                  Restore Complete
                </p>
                <p className='text-sm text-green-700 mt-1'>
                  Your backup has been restored successfully.
                </p>
                <p className='text-xs text-green-600 mt-1'>
                  Completed in {formatDuration(timing.elapsed)}.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
