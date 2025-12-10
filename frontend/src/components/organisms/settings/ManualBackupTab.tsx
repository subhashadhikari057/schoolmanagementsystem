'use client';

import React, { useState } from 'react';
import { Database, FileText, HardDrive, AlertTriangle } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupService } from '@/api/services/backup.service';
import type { ApiResponse } from '@/api/services/backup.service';
import BackupProgressModal from '@/components/molecules/modals/BackupProgressModal';
import { useBackupContext } from '@/context/BackupContext';

interface BackupType {
  id: 'database' | 'files' | 'full';
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

  const resolveBackupType = (
    id: 'database' | 'files' | 'full',
  ): 'DATABASE' | 'FILES' | 'FULL_SYSTEM' => {
    if (id === 'database') return 'DATABASE';
    if (id === 'files') return 'FILES';
    return 'FULL_SYSTEM';
  };

  const openProgressModal = (
    backupType: 'DATABASE' | 'FILES' | 'FULL_SYSTEM',
    operationId?: string,
  ) => {
    setProgressModal({
      isOpen: true,
      backupId: operationId ?? '',
      backupType,
    });
  };

  const attachOperationToModal = (operationId: string) => {
    setProgressModal(prev => ({
      ...prev,
      isOpen: true,
      backupId: operationId,
    }));
  };

  const isApiResponse = (
    value: unknown,
  ): value is ApiResponse<Record<string, unknown>> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      'data' in value
    );
  };

  const extractOperationId = (payload: unknown): string | undefined => {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    if (
      'operationId' in payload &&
      typeof (payload as { operationId?: unknown }).operationId === 'string'
    ) {
      return (payload as { operationId: string }).operationId;
    }

    if (isApiResponse(payload)) {
      const data = payload.data;
      if (
        data &&
        typeof data === 'object' &&
        'operationId' in data &&
        typeof (data as { operationId?: unknown }).operationId === 'string'
      ) {
        return (data as { operationId: string }).operationId;
      }
    }

    return undefined;
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

  const handleBackup = async (type: 'database' | 'files' | 'full') => {
    const backupType = resolveBackupType(type);
    setLoading(type);
    setError('');
    openProgressModal(backupType);

    const findActiveBackupOperation = async (): Promise<string | null> => {
      const wait = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

      const lookupActive = async (): Promise<string | null> => {
        try {
          const activeResponse = await backupService.getActiveOperations();
          const activeOperations = (activeResponse?.data as string[]) || [];

          if (
            !Array.isArray(activeOperations) ||
            activeOperations.length === 0
          ) {
            return null;
          }

          for (
            let index = activeOperations.length - 1;
            index >= 0;
            index -= 1
          ) {
            const operationId = activeOperations[index];

            try {
              const progressResponse =
                await backupService.getCurrentProgress(operationId);
              const progressData = progressResponse?.data as {
                operationType?: string;
              };

              if (progressData?.operationType === 'backup') {
                return operationId;
              }
            } catch (progressError) {
              console.warn(
                'Failed to fetch progress snapshot for operation:',
                operationId,
                progressError,
              );
            }
          }
        } catch (activeError) {
          console.error(
            'Failed to detect active backup operation:',
            activeError,
          );
        }

        return null;
      };

      const MAX_ATTEMPTS = 6;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
          await wait(400 * attempt);
        } else {
          await wait(500);
        }

        const activeId = await lookupActive();
        if (activeId) {
          return activeId;
        }
      }

      try {
        const historyResponse = await backupService.listBackups({ limit: 1 });
        const backups =
          (historyResponse?.data as Array<{
            metadata?: { operationId?: string };
          }>) || [];

        const metadataOperationId = backups[0]?.metadata?.operationId;
        if (metadataOperationId) {
          try {
            const history =
              await backupService.getProgressHistory(metadataOperationId);
            if (Array.isArray(history?.data) && history.data.length > 0) {
              return metadataOperationId;
            }
          } catch (historyError) {
            console.warn(
              'Failed to fetch history for fallback operation:',
              metadataOperationId,
              historyError,
            );
          }
        }
      } catch (historyError) {
        console.error(
          'Failed to inspect latest backup metadata:',
          historyError,
        );
      }

      return null;
    };

    try {
      const response = await backupService.createBackup({
        type: backupType,
      });

      if (response.success === false) {
        const responseError =
          response.error || response.message || 'Failed to start backup';
        throw new Error(responseError);
      }

      const operationId = extractOperationId(response);

      if (!operationId) {
        throw new Error('Failed to start backup - no operation ID received');
      }

      toast.success(
        'Backup Started',
        `${backupType.replace('_', ' ').toLowerCase()} backup is being created...`,
      );

      attachOperationToModal(operationId);
    } catch (err) {
      const isAbortError =
        err instanceof Error &&
        (err.message.includes('aborted') || err.name === 'AbortError');

      if (isAbortError) {
        const fallbackOperationId = await findActiveBackupOperation();

        if (fallbackOperationId) {
          toast.success(
            'Backup In Progress',
            'Reattached to running backup operation.',
          );
          attachOperationToModal(fallbackOperationId);
        } else {
          toast.info(
            'Backup Running',
            'Backup started, but real-time tracking was not attached. Refresh the page to see status.',
          );
          setProgressModal(prev => ({ ...prev, isOpen: false }));
        }
        return;
      }

      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start backup';
      console.error('❌ Backup error:', err);
      setError(errorMsg);
      toast.error('Backup Error', errorMsg);
      setProgressModal(prev => ({ ...prev, isOpen: false }));
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

      {/* Progress Modal */}
      <BackupProgressModal
        isOpen={progressModal.isOpen}
        onClose={() => {
          setProgressModal(prev => ({ ...prev, isOpen: false }));
        }}
        backupId={progressModal.backupId}
        backupType={progressModal.backupType}
        onComplete={() => {
          toast.success('Backup Complete', 'Backup finished successfully.');
        }}
        onCancel={() => {
          toast.warning(
            'Backup Cancelled',
            'Backup operation was cancelled by user.',
          );
          setProgressModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
