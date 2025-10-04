'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface ProgressStage {
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
  error?: string;
}

interface BackupProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupId: string;
  backupType: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  onComplete?: (result: any) => void;
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
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isOpen || !backupId) return;

    // Don't connect to SSE for temporary IDs - wait for real ID
    const isTempId = backupId.startsWith('temp_');

    if (isTempId) {
      // Show waiting state for temp IDs
      setCurrentStage({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing backup...',
        timestamp: new Date(),
      });
      return;
    }

    // Reset state for real backup IDs
    setAllStages([]);
    setCurrentStage(null);
    setIsComplete(false);
    setHasFailed(false);
    setError('');

    // Connect to SSE stream
    const connectToProgress = () => {
      const eventSource = new EventSource(
        `/api/v1/backup/progress/stream/${backupId}`,
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

          if (data.status === 'completed') {
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
            // Prevent duplicate stages
            const exists = prev.some(
              s =>
                s.stage === stage.stage &&
                s.message === stage.message &&
                s.progress === stage.progress,
            );
            return exists ? prev : [...prev, stage];
          });

          // Check for completion or failure
          if (data.stage === 'backup_completed' || data.progress === 100) {
            setIsComplete(true);
            setTimeout(() => {
              onComplete?.(data.details || {});
            }, 1000);
          } else if (data.stage === 'backup_failed' || data.error) {
            setHasFailed(true);
            setError(data.error || 'Backup failed');
          }
        } catch (err) {
          console.error('Failed to parse progress update:', err);
        }
      };

      eventSource.onerror = err => {
        console.error('EventSource error:', err);
        // Don't show error if already complete
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    };

    connectToProgress();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, backupId]);

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

  if (!isOpen) return null;

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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <Card className='w-full max-w-2xl p-6 m-4 bg-white rounded-lg shadow-xl'>
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
              {getBackupTypeName(backupType)} - {backupId}
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
              variant='outline'
              className='flex-1'
            >
              Cancel
            </ReusableButton>
          )}

          {(isComplete || hasFailed) && (
            <ReusableButton
              onClick={handleClose}
              variant='primary'
              className='flex-1'
            >
              Close
            </ReusableButton>
          )}
        </div>
      </Card>
    </div>
  );
}
