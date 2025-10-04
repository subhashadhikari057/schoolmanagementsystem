'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Settings,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { backupSettingsService } from '@/api/services/backup-settings.service';

interface SettingsValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onValidationComplete?: (result: ValidationResult) => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  recommendations: ValidationMessage[];
}

interface ValidationMessage {
  id: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  field?: string;
}

export default function SettingsValidationModal({
  isOpen,
  onClose,
  settings,
  onValidationComplete,
}: SettingsValidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && settings) {
      validateSettings();
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const validateSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await backupSettingsService.validateSettings(settings);

      if (response.success && response.data) {
        const result: ValidationResult = {
          isValid: response.data.isValid,
          errors:
            response.data.errors?.map((msg: string, index: number) => ({
              id: `error-${index}`,
              category: 'Configuration',
              severity: 'error' as const,
              message: msg,
            })) || [],
          warnings:
            response.data.warnings?.map((msg: string, index: number) => ({
              id: `warning-${index}`,
              category: 'Security',
              severity: 'warning' as const,
              message: msg,
            })) || [],
          recommendations:
            response.data.recommendations?.map(
              (msg: string, index: number) => ({
                id: `recommendation-${index}`,
                category: 'Best Practice',
                severity: 'info' as const,
                message: msg,
              }),
            ) || [],
        };

        setValidation(result);
        onValidationComplete?.(result);
      } else {
        setError(response.error || 'Failed to validate settings');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to validate settings',
      );
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
      case 'info':
        return <Info className='h-5 w-5 text-blue-600' />;
      default:
        return <Info className='h-5 w-5 text-gray-600' />;
    }
  };

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getOverallStatus = () => {
    if (!validation) return null;

    if (validation.errors.length > 0) {
      return {
        icon: <AlertCircle className='h-6 w-6 text-red-600' />,
        title: 'Configuration Issues Found',
        message: `${validation.errors.length} error(s) must be fixed before saving.`,
        color: 'text-red-800',
        bgColor: 'bg-red-50 border-red-200',
      };
    } else if (validation.warnings.length > 0) {
      return {
        icon: <AlertTriangle className='h-6 w-6 text-yellow-600' />,
        title: 'Configuration Warnings',
        message: `Settings are valid but ${validation.warnings.length} warning(s) were found.`,
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-50 border-yellow-200',
      };
    } else {
      return {
        icon: <CheckCircle className='h-6 w-6 text-green-600' />,
        title: 'Configuration Valid',
        message: 'All settings are properly configured.',
        color: 'text-green-800',
        bgColor: 'bg-green-50 border-green-200',
      };
    }
  };

  const status = getOverallStatus();
  const allMessages = [
    ...(validation?.errors || []),
    ...(validation?.warnings || []),
    ...(validation?.recommendations || []),
  ];

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Settings className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                Settings Validation
              </h2>
              <p className='text-sm text-gray-600'>
                Validate your backup configuration settings
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5' />
          </ReusableButton>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Loading State */}
          {loading && (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>Validating settings...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-red-800'>
                    Validation Error
                  </p>
                  <p className='text-sm text-red-700 mt-1'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validation && status && (
            <>
              {/* Overall Status */}
              <div className={`border rounded-lg p-4 ${status.bgColor}`}>
                <div className='flex items-start gap-3'>
                  {status.icon}
                  <div>
                    <p className={`text-sm font-medium ${status.color}`}>
                      {status.title}
                    </p>
                    <p
                      className={`text-sm mt-1 ${status.color.replace('800', '700')}`}
                    >
                      {status.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className='grid grid-cols-3 gap-4'>
                <div className='bg-red-50 rounded-lg p-4 text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {validation.errors.length}
                  </div>
                  <div className='text-sm text-red-700'>Errors</div>
                </div>
                <div className='bg-yellow-50 rounded-lg p-4 text-center'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {validation.warnings.length}
                  </div>
                  <div className='text-sm text-yellow-700'>Warnings</div>
                </div>
                <div className='bg-blue-50 rounded-lg p-4 text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {validation.recommendations.length}
                  </div>
                  <div className='text-sm text-blue-700'>Recommendations</div>
                </div>
              </div>

              {/* Detailed Messages */}
              {allMessages.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Validation Details
                  </h3>

                  <div className='space-y-3 max-h-96 overflow-y-auto'>
                    {allMessages.map(message => (
                      <div
                        key={message.id}
                        className={`border rounded-lg p-4 ${getBgColor(message.severity)}`}
                      >
                        <div className='flex items-start gap-3'>
                          {getIcon(message.severity)}
                          <div className='flex-1'>
                            <div className='flex items-start justify-between'>
                              <div>
                                <p
                                  className={`text-sm font-medium ${getTextColor(message.severity)}`}
                                >
                                  {message.category}
                                </p>
                                <p
                                  className={`text-sm mt-1 ${getTextColor(message.severity).replace('800', '700')}`}
                                >
                                  {message.message}
                                </p>
                                {message.suggestion && (
                                  <p
                                    className={`text-sm mt-2 ${getTextColor(message.severity).replace('800', '600')} italic`}
                                  >
                                    💡 {message.suggestion}
                                  </p>
                                )}
                              </div>
                              {message.field && (
                                <span className='text-xs bg-white bg-opacity-50 px-2 py-1 rounded'>
                                  {message.field}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration Preview */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-medium text-gray-900 mb-3'>
                  Configuration Summary
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Encryption:</span>
                    <span
                      className={
                        settings.encryption?.enableEncryption
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    >
                      {settings.encryption?.enableEncryption
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Offsite Backup:</span>
                    <span
                      className={
                        settings.offsite?.enableOffsiteBackup
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    >
                      {settings.offsite?.enableOffsiteBackup
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Compression:</span>
                    <span className='text-gray-900'>
                      {settings.advanced?.compressionLevel || 'Medium'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Parallel Operations:</span>
                    <span className='text-gray-900'>
                      {settings.advanced?.parallelOperations || 2}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Progress Tracking:</span>
                    <span
                      className={
                        settings.advanced?.enableProgressTracking
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    >
                      {settings.advanced?.enableProgressTracking
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations Summary */}
              {validation.recommendations.length > 0 && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <Info className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-blue-800'>
                        Optimization Suggestions
                      </p>
                      <p className='text-sm text-blue-700 mt-1'>
                        Consider implementing the recommendations above to
                        improve backup performance and security.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
          <div className='text-sm text-gray-500'>
            {validation && (
              <span>
                Validation completed at {new Date().toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className='flex items-center gap-3'>
            {loading && (
              <ReusableButton
                onClick={validateSettings}
                disabled={loading}
                className='px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400'
              >
                {loading ? 'Validating...' : 'Re-validate'}
              </ReusableButton>
            )}

            <ReusableButton
              onClick={onClose}
              className='px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors'
            >
              {validation?.isValid ? 'Done' : 'Close'}
            </ReusableButton>
          </div>
        </div>
      </div>
    </div>
  );
}
