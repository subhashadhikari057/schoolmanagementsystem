import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Database,
  Files,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RestoreProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupName: string;
  isFromFile?: boolean;
  isCompleted?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  duration?: number;
}

export default function RestoreProgressModal({
  isOpen,
  onClose,
  backupName,
  isFromFile = false,
  isCompleted = false,
  isError = false,
  errorMessage = '',
}: RestoreProgressModalProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'init',
      label: 'Initializing restore operation',
      status: 'pending',
      icon: Loader2,
    },
    {
      id: 'snapshot',
      label: 'Creating pre-restore safety snapshot',
      status: 'pending',
      icon: Clock,
    },
    {
      id: 'database',
      label: 'Restoring database',
      status: 'pending',
      icon: Database,
    },
    { id: 'files', label: 'Restoring files', status: 'pending', icon: Files },
    {
      id: 'config',
      label: 'Restoring configuration',
      status: 'pending',
      icon: Settings,
    },
    {
      id: 'complete',
      label: 'Restore completed successfully',
      status: 'pending',
      icon: CheckCircle,
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isOpen && !startTime) {
      setStartTime(new Date());
    }
  }, [isOpen, startTime]);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!isOpen) return;

    // Handle completion or error states
    if (isCompleted) {
      setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setCurrentStep(steps.length - 1);
      return;
    }

    if (isError) {
      setSteps(prev =>
        prev.map((s, i) => {
          if (i <= currentStep)
            return { ...s, status: i === currentStep ? 'error' : 'completed' };
          return s;
        }),
      );
      return;
    }

    // Simulate progress steps only if not completed or error
    if (!isCompleted && !isError) {
      const progressSteps = [
        { step: 0, delay: 1000 },
        { step: 1, delay: 3000 },
        { step: 2, delay: 8000 },
        { step: 3, delay: 15000 },
        { step: 4, delay: 20000 },
        { step: 5, delay: 25000 },
      ];

      const timeouts = progressSteps.map(({ step, delay }) =>
        setTimeout(() => {
          setSteps(prev =>
            prev.map((s, i) => {
              if (i < step) return { ...s, status: 'completed' };
              if (i === step) return { ...s, status: 'in_progress' };
              return s;
            }),
          );
          setCurrentStep(step);
        }, delay),
      );

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [isOpen, isCompleted, isError, currentStep, steps.length]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-md bg-white rounded-lg shadow-xl'>
        <div className='p-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Restore in Progress
              </h3>
              <p className='text-sm text-gray-500 mt-1'>
                {isFromFile ? 'From uploaded file' : `Backup: ${backupName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Progress Steps */}
          <div className='space-y-4 mb-6'>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className='flex items-center space-x-3'>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-600'
                        : step.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-600'
                          : step.status === 'error'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.status === 'in_progress' ? (
                      <Icon className='h-4 w-4 animate-spin' />
                    ) : (
                      <Icon className='h-4 w-4' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p
                      className={`text-sm font-medium ${
                        step.status === 'completed'
                          ? 'text-green-700'
                          : step.status === 'in_progress'
                            ? 'text-blue-700'
                            : step.status === 'error'
                              ? 'text-red-700'
                              : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {step.status === 'completed' && (
                    <CheckCircle className='h-4 w-4 text-green-500' />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className='h-4 w-4 text-red-500' />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className='mb-4'>
            <div className='flex justify-between text-xs text-gray-500 mb-2'>
              <span>Progress</span>
              <span>
                {isCompleted
                  ? '100%'
                  : isError
                    ? 'Failed'
                    : `${Math.round(((currentStep + 1) / steps.length) * 100)}%`}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  isError
                    ? 'bg-red-500'
                    : isCompleted
                      ? 'bg-green-500'
                      : 'bg-blue-600'
                }`}
                style={{
                  width: isCompleted
                    ? '100%'
                    : isError
                      ? `${Math.round(((currentStep + 1) / steps.length) * 100)}%`
                      : `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Time Info */}
          <div className='flex justify-between text-xs text-gray-500'>
            <span>Elapsed: {formatTime(elapsed)}</span>
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Success/Error/Warning */}
          {isCompleted ? (
            <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-start space-x-3'>
                <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-medium text-green-800'>
                    Restore Completed Successfully!
                  </p>
                  <p className='text-sm text-green-700 mt-1'>
                    Your backup has been restored successfully. A pre-restore
                    snapshot is available for rollback if needed.
                  </p>
                  <button
                    onClick={onClose}
                    className='mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors'
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : isError ? (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start space-x-3'>
                <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-medium text-red-800'>Restore Failed</p>
                  <p className='text-sm text-red-700 mt-1'>{errorMessage}</p>
                  <button
                    onClick={onClose}
                    className='mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors'
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <div className='flex items-start space-x-2'>
                <AlertCircle className='h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5' />
                <div className='text-xs text-yellow-800'>
                  <p className='font-medium'>Please do not close this window</p>
                  <p>
                    The restore operation is in progress. Interrupting it may
                    cause data corruption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
