'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { backupService } from '@/api/services/backup.service';

interface ProgressStage {
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
  error?: string;
  details?: Record<string, unknown>;
}

interface BackupProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupId: string;
  backupType: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  onComplete?: (result: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export default function BackupProgressModal({
  isOpen,
  onClose,
  backupId,
  backupType,
  onComplete,
  onCancel,
}: BackupProgressModalProps) {
  const [currentStage, setCurrentStage] = useState<ProgressStage | null>(null);
  const [allStages, setAllStages] = useState<ProgressStage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [error, setError] = useState<string>('');
  const [timing, setTiming] = useState<{
    elapsed: number;
    remaining: number | null;
  }>({
    elapsed: 0,
    remaining: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const historyLoadedRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const lastKnownBackupIdRef = useRef(backupId);
  const isCompleteRef = useRef(isComplete);
  const hasFailedRef = useRef(hasFailed);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    lastKnownBackupIdRef.current = backupId;
  }, [backupId]);

  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    hasFailedRef.current = hasFailed;
  }, [hasFailed]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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

  const loadProgressHistory = useCallback(async () => {
    if (!backupId) return false;

    const wait = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));
    const MAX_ATTEMPTS = 6;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await wait(400 * attempt);
      }

      try {
        const historyResponse =
          await backupService.getProgressHistory(backupId);
        const history =
          (historyResponse?.data as Array<{
            stage: string;
            progress: number;
            message: string;
            timestamp: string | Date;
            error?: string;
            details?: unknown;
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
          details: (item as { details?: Record<string, unknown> }).details,
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
          latest.stage === 'backup_completed' ||
          latest.progress >= 100 ||
          latest.stage === 'completed'
        ) {
          setIsComplete(true);
          setHasFailed(false);
          setError('');
          if (!historyLoadedRef.current) {
            onCompleteRef.current?.(
              (latest.details as Record<string, unknown>) || {},
            );
          }
          historyLoadedRef.current = true;
          return true;
        }

        if (latest.stage === 'backup_failed' || latest.error) {
          setHasFailed(true);
          setError(latest.error || latest.message || 'Backup failed');
          historyLoadedRef.current = true;
          return true;
        }

        historyLoadedRef.current = true;
        return true;
      } catch (historyError) {
        console.error('Failed to load backup progress history:', historyError);
      }
    }

    return false;
  }, [backupId, updateTiming]);

  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    setTiming({ elapsed: 0, remaining: null });
    historyLoadedRef.current = false;
    setIsComplete(false);
    setHasFailed(false);
    setError('');
    setAllStages([]);
    setCurrentStage({
      stage: 'initializing',
      progress: 0,
      message: lastKnownBackupIdRef.current
        ? 'Initiating backup...'
        : 'Preparing backup request...',
      timestamp: new Date(),
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      startTimeRef.current = null;
      setTiming({ elapsed: 0, remaining: null });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !backupId) {
      return;
    }

    setCurrentStage(prev => {
      if (!prev) {
        return {
          stage: 'initializing',
          progress: 0,
          message: 'Initiating backup...',
          timestamp: new Date(),
        };
      }
      if (
        prev.stage !== 'initializing' ||
        prev.message === 'Initiating backup...'
      ) {
        return prev;
      }
      return {
        ...prev,
        message: 'Initiating backup...',
      };
    });
  }, [backupId, isOpen]);

  useEffect(() => {
    if (!isOpen || !backupId) {
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    historyLoadedRef.current = false;

    const timer = setTimeout(() => {
      const eventSource = new EventSource(
        `/api/v1/backup/progress/stream/${backupId}`,
        { withCredentials: true },
      );

      eventSource.onmessage = async event => {
        try {
          const data = JSON.parse(event.data);

          if (data.error && typeof data.error === 'string') {
            if (data.error.includes('Operation not found')) {
              const historyLoaded = await loadProgressHistory();
              if (!historyLoaded) {
                setError(data.error);
                setHasFailed(true);
              }
              eventSource.close();
              return;
            }

            setError(data.error);
            setHasFailed(true);
            eventSource.close();
            return;
          }

          if (data.status === 'completed') {
            setIsComplete(true);
            eventSource.close();
            onCompleteRef.current?.(data.details || {});
            historyLoadedRef.current = true;
            return;
          }

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

          if (data.stage === 'backup_completed' || data.progress >= 100) {
            setIsComplete(true);
            eventSource.close();
            onCompleteRef.current?.(data.details || {});
            historyLoadedRef.current = true;
          } else if (
            data.stage === 'backup_failed' ||
            (data.error && typeof data.error === 'string')
          ) {
            setHasFailed(true);
            setError(
              typeof data.error === 'string' ? data.error : 'Backup failed',
            );
            eventSource.close();
          }
        } catch (err) {
          console.error('Failed to parse SSE progress update:', err);
        }
      };

      eventSource.onerror = async err => {
        console.error('Backup progress stream error:', err);
        if (!isCompleteRef.current && !hasFailedRef.current) {
          const historyLoaded = await loadProgressHistory();
          if (!historyLoaded) {
            setError(
              'Connection to backup stream lost. Please refresh to check status.',
            );
            setHasFailed(true);
          }
        }
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    }, 400);

    return () => {
      clearTimeout(timer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, backupId, loadProgressHistory, updateTiming]);

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
  };

  if (!isOpen) {
    return null;
  }

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      backup_initiated: 'Initiating Backup',
      dumping_database: 'Dumping Database',
      collecting_files: 'Collecting Files',
      compressing: 'Compressing Backup',
      encrypting: 'Encrypting Backup',
      transferring_offsite: 'Transferring to Offsite',
      backup_completed: 'Backup Completed',
      backup_failed: 'Backup Failed',
    };
    return (
      labels[stage] ||
      stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    );
  };

  const getBackupTypeName = (type: string): string => {
    return type
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='w-full max-w-2xl p-6 m-4 bg-white rounded-lg shadow-xl'>
        {/* Header */}
        <div className='flex items-start justify-between mb-6'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>
              {isComplete
                ? 'Backup Completed'
                : hasFailed
                  ? 'Backup Failed'
                  : 'Backup in Progress'}
            </h2>
            <p className='text-sm text-gray-600'>
              {getBackupTypeName(backupType)} -{' '}
              {backupId || 'Preparing operation...'}
            </p>
          </div>
          {(isComplete || hasFailed) && (
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          )}
        </div>

        {/* Wait Banner */}
        {!isComplete && !hasFailed && (
          <div className='mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4'>
            <p className='text-sm font-semibold text-blue-900'>
              Please wait while your backup completes.
            </p>
            <p className='mt-1 text-xs text-blue-700'>
              Elapsed: {formatDuration(timing.elapsed)}
              {timing.remaining !== null
                ? ` • Approximately ${formatDuration(timing.remaining)} remaining`
                : ''}
            </p>
          </div>
        )}

        {/* Progress Section */}
        <div className='space-y-4 mb-6'>
          {/* Current Stage */}
          {currentStage && !isComplete && !hasFailed && (
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center gap-3 mb-3'>
                <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-blue-900'>
                    {getStageLabel(currentStage.stage)}
                  </p>
                  <p className='text-sm text-blue-700 mt-1'>
                    {currentStage.message}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-blue-900'>
                    {currentStage.progress}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className='w-full bg-blue-100 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${currentStage.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion Status */}
          {isComplete && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <CheckCircle className='w-6 h-6 text-green-600 flex-shrink-0' />
                <div>
                  <p className='text-sm font-semibold text-green-900'>
                    Backup Completed Successfully
                  </p>
                  <p className='text-sm text-green-700 mt-1'>
                    Your {getBackupTypeName(backupType).toLowerCase()} has been
                    created and saved.
                  </p>
                  <p className='text-xs text-green-600 mt-1'>
                    Completed in {formatDuration(timing.elapsed)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failure Status */}
          {hasFailed && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <XCircle className='w-6 h-6 text-red-600 flex-shrink-0' />
                <div>
                  <p className='text-sm font-semibold text-red-900'>
                    Backup Failed
                  </p>
                  <p className='text-sm text-red-700 mt-1'>
                    {error || 'An error occurred during the backup process.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stage History */}
          {allStages.length > 0 && (
            <div className='border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto'>
              <h3 className='text-sm font-semibold text-gray-900 mb-3'>
                Progress History
              </h3>
              <div className='space-y-2'>
                {allStages.map((stage, index) => (
                  <div key={index} className='flex items-start gap-3 text-sm'>
                    <div className='w-16 text-gray-500 flex-shrink-0'>
                      {new Date(stage.timestamp).toLocaleTimeString()}
                    </div>
                    <div className='flex-1'>
                      <span className='font-medium text-gray-900'>
                        {getStageLabel(stage.stage)}
                      </span>
                      <span className='text-gray-600'> - {stage.message}</span>
                    </div>
                    <div className='w-12 text-right text-gray-600 font-medium'>
                      {stage.progress}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          {!isComplete && !hasFailed && (
            <ReusableButton
              onClick={handleCancel}
              className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              Cancel
            </ReusableButton>
          )}

          {(isComplete || hasFailed) && (
            <ReusableButton
              onClick={handleClose}
              className={`flex-1 px-6 py-2 text-white rounded-lg transition-colors ${
                isComplete
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Close
            </ReusableButton>
          )}
        </div>
      </div>
    </div>
  );
}
