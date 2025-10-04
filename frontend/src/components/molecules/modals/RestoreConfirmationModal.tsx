'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Database,
  Shield,
  CheckCircle,
  Eye,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { backupService } from '@/api/services/backup.service';

interface RestoreConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: RestoreOptions) => void;
  backup?: {
    id: string;
    name: string;
    type: string;
    date: string;
    size: string;
    encrypted: boolean;
  };
  isFileUpload?: boolean;
  uploadedFile?: File | null;
}

interface RestoreOptions {
  backupId?: string;
  clientKey?: string;
  overwrite: boolean;
  restoreDatabase: boolean;
  restoreFiles: boolean;
  restoreConfig: boolean;
  dropExisting: boolean;
  createPreSnapshot: boolean;
}

interface RestorePreview {
  databaseTables: string[];
  fileCount: number;
  totalSize: string;
  configFiles: string[];
  warnings: string[];
  conflicts: string[];
}

export default function RestoreConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  backup,
  isFileUpload = false,
  uploadedFile,
}: RestoreConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [options, setOptions] = useState<RestoreOptions>({
    backupId: backup?.id,
    clientKey: '',
    overwrite: false,
    restoreDatabase: true,
    restoreFiles: true,
    restoreConfig: true,
    dropExisting: false,
    createPreSnapshot: true,
  });

  const [confirmationText, setConfirmationText] = useState('');
  const requiredConfirmation = 'RESTORE';

  if (!isOpen) return null;

  const handleOptionChange = (
    key: keyof RestoreOptions,
    value: boolean | string,
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    setPreview(null); // Clear preview when options change
  };

  const handleGetPreview = async () => {
    if (!backup?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await backupService.getRestorePreview(
        backup.id,
        options.clientKey || undefined,
      );

      if (response.success && response.data) {
        setPreview(response.data);
        setShowPreview(true);
      } else {
        setError(response.error || 'Failed to generate restore preview');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate restore preview',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (confirmationText !== requiredConfirmation) {
      setError('Please type "RESTORE" to confirm');
      return;
    }

    onConfirm(options);
  };

  const getRestoreScope = () => {
    const scope = [];
    if (options.restoreDatabase) scope.push('Database');
    if (options.restoreFiles) scope.push('Files');
    if (options.restoreConfig) scope.push('Configuration');
    return scope.length > 0 ? scope.join(', ') : 'Nothing selected';
  };

  const hasDestructiveOptions = () => {
    return options.overwrite || options.dropExisting;
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-orange-50 rounded-lg'>
              <AlertTriangle className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                Confirm Restore Operation
              </h2>
              <p className='text-sm text-gray-600'>
                {isFileUpload
                  ? 'Restore from uploaded file'
                  : `Restore from ${backup?.name}`}
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

          {/* Backup Info */}
          {backup && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-3'>
                Backup Information
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <p className='text-gray-600'>Name</p>
                  <p className='font-medium'>{backup.name}</p>
                </div>
                <div>
                  <p className='text-gray-600'>Type</p>
                  <p className='font-medium'>{backup.type}</p>
                </div>
                <div>
                  <p className='text-gray-600'>Date</p>
                  <p className='font-medium'>{backup.date}</p>
                </div>
                <div>
                  <p className='text-gray-600'>Size</p>
                  <p className='font-medium'>{backup.size}</p>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Info */}
          {isFileUpload && uploadedFile && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-3'>
                Upload Information
              </h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-gray-600'>File Name</p>
                  <p className='font-medium'>{uploadedFile.name}</p>
                </div>
                <div>
                  <p className='text-gray-600'>Size</p>
                  <p className='font-medium'>
                    {Math.round(uploadedFile.size / 1024 / 1024)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Decryption Key */}
          {(backup?.encrypted || isFileUpload) && (
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Decryption Key{' '}
                {backup?.encrypted ? '(Required)' : '(If encrypted)'}
              </Label>
              <Input
                type='password'
                value={options.clientKey}
                onChange={e => handleOptionChange('clientKey', e.target.value)}
                placeholder='Enter decryption key'
                className='w-full font-mono'
              />
            </div>
          )}

          {/* Restore Options */}
          <div className='space-y-4'>
            <h3 className='font-medium text-gray-900'>Restore Options</h3>

            <div className='space-y-3'>
              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.restoreDatabase}
                  onChange={e =>
                    handleOptionChange('restoreDatabase', e.target.checked)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <span className='text-sm text-gray-700'>Restore Database</span>
              </label>

              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.restoreFiles}
                  onChange={e =>
                    handleOptionChange('restoreFiles', e.target.checked)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <span className='text-sm text-gray-700'>Restore Files</span>
              </label>

              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.restoreConfig}
                  onChange={e =>
                    handleOptionChange('restoreConfig', e.target.checked)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <span className='text-sm text-gray-700'>
                  Restore Configuration
                </span>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className='space-y-4'>
            <h3 className='font-medium text-gray-900'>Advanced Options</h3>

            <div className='space-y-3'>
              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.createPreSnapshot}
                  onChange={e =>
                    handleOptionChange('createPreSnapshot', e.target.checked)
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <span className='text-sm text-gray-700'>
                  Create pre-restore snapshot (Recommended)
                </span>
              </label>

              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.overwrite}
                  onChange={e =>
                    handleOptionChange('overwrite', e.target.checked)
                  }
                  className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                />
                <span className='text-sm text-red-700'>
                  Overwrite existing files
                </span>
              </label>

              <label className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={options.dropExisting}
                  onChange={e =>
                    handleOptionChange('dropExisting', e.target.checked)
                  }
                  className='h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded'
                />
                <span className='text-sm text-red-700'>
                  Drop existing database tables
                </span>
              </label>
            </div>
          </div>

          {/* Restore Preview */}
          {backup && !isFileUpload && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-gray-900'>Restore Preview</h3>
                <ReusableButton
                  onClick={handleGetPreview}
                  disabled={loading}
                  className='px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400 flex items-center gap-2 text-sm'
                >
                  <Eye className='h-4 w-4' />
                  {loading ? 'Loading...' : 'Generate Preview'}
                </ReusableButton>
              </div>

              {showPreview && preview && (
                <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-600'>Database Tables</p>
                      <p className='font-medium'>
                        {preview.databaseTables.length}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-600'>Files</p>
                      <p className='font-medium'>
                        {preview.fileCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-600'>Total Size</p>
                      <p className='font-medium'>{preview.totalSize}</p>
                    </div>
                  </div>

                  {preview.warnings.length > 0 && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded p-3'>
                      <p className='text-sm font-medium text-yellow-800 mb-1'>
                        Warnings:
                      </p>
                      <ul className='text-sm text-yellow-700 space-y-1'>
                        {preview.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview.conflicts.length > 0 && (
                    <div className='bg-red-50 border border-red-200 rounded p-3'>
                      <p className='text-sm font-medium text-red-800 mb-1'>
                        Conflicts:
                      </p>
                      <ul className='text-sm text-red-700 space-y-1'>
                        {preview.conflicts.map((conflict, index) => (
                          <li key={index}>• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Restore Summary */}
          <div className='bg-blue-50 rounded-lg p-4'>
            <h3 className='font-medium text-blue-900 mb-2'>Restore Summary</h3>
            <div className='text-sm text-blue-800 space-y-1'>
              <p>
                <strong>Scope:</strong> {getRestoreScope()}
              </p>
              <p>
                <strong>Pre-snapshot:</strong>{' '}
                {options.createPreSnapshot ? 'Yes' : 'No'}
              </p>
              {hasDestructiveOptions() && (
                <p className='text-red-700'>
                  <strong>⚠️ Destructive options enabled:</strong>{' '}
                  {[
                    options.overwrite && 'Overwrite files',
                    options.dropExisting && 'Drop tables',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Final Warning */}
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-red-800'>
                  Critical Warning
                </p>
                <p className='text-sm text-red-700 mt-1'>
                  This operation will modify your system data. Ensure you have a
                  recent backup before proceeding.
                  {hasDestructiveOptions() &&
                    ' Destructive options are enabled and may cause data loss.'}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Type <code className='bg-gray-100 px-1 rounded'>RESTORE</code> to
              confirm:
            </Label>
            <Input
              type='text'
              value={confirmationText}
              onChange={e => setConfirmationText(e.target.value.toUpperCase())}
              placeholder='Type RESTORE to confirm'
              className='w-full'
            />
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200'>
          <ReusableButton
            onClick={onClose}
            className='px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
          >
            Cancel
          </ReusableButton>
          <ReusableButton
            onClick={handleConfirm}
            disabled={
              confirmationText !== requiredConfirmation ||
              (!options.restoreDatabase &&
                !options.restoreFiles &&
                !options.restoreConfig)
            }
            className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:bg-red-400 flex items-center gap-2'
          >
            <Database className='h-4 w-4' />
            Confirm Restore
          </ReusableButton>
        </div>
      </div>
    </div>
  );
}
