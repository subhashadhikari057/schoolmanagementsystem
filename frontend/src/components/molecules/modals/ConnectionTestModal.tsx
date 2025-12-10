'use client';

import React from 'react';
import { X, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'testing' | 'success' | 'failed';
  error?: string;
  details?: {
    host: string;
    authentication?: 'success' | 'failed' | 'not_tested';
    responseTime?: number;
  };
}

const ConnectionTestModal: React.FC<ConnectionTestModalProps> = ({
  isOpen,
  onClose,
  status,
  error,
  details,
}) => {
  if (!isOpen) return null;

  const canClose = status !== 'testing';

  const getErrorMessage = (
    error?: string,
  ): { title: string; message: string; suggestions: string[] } => {
    if (!error) {
      return {
        title: 'Connection Failed',
        message: 'Could not connect to the server.',
        suggestions: [
          'Check your internet connection',
          'Verify server is online',
        ],
      };
    }

    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return {
        title: 'Connection Timeout',
        message: 'The server is not responding.',
        suggestions: [
          'Check if the server IP/hostname is correct',
          'Verify the server is online and accessible',
          'Ensure firewall allows SSH connections (port 22)',
          'Check if your network can reach the server',
        ],
      };
    }

    if (
      errorLower.includes('authentication') ||
      errorLower.includes('password') ||
      errorLower.includes('permission denied') ||
      errorLower.includes('auth')
    ) {
      return {
        title: 'Login Failed',
        message: 'The username or password is incorrect.',
        suggestions: [
          'Double-check the username (e.g., "root" or your username)',
          'Verify the password is correct',
          'Ensure the user has SSH access permissions',
          'Try logging in manually via SSH client to verify credentials',
        ],
      };
    }

    if (
      errorLower.includes('host') ||
      errorLower.includes('refused') ||
      errorLower.includes('connect')
    ) {
      return {
        title: 'Cannot Reach Server',
        message: 'The server rejected the connection.',
        suggestions: [
          'Verify the server IP/hostname is correct',
          'Check if SSH service is running on the server',
          'Ensure port 22 is open and not blocked',
          'Confirm the server allows remote connections',
        ],
      };
    }

    if (errorLower.includes('network') || errorLower.includes('unreachable')) {
      return {
        title: 'Network Error',
        message: 'Cannot reach the server network.',
        suggestions: [
          'Check your internet connection',
          'Verify the server IP is reachable',
          'Try pinging the server from your terminal',
          'Check if VPN is required to access the server',
        ],
      };
    }

    return {
      title: 'Connection Error',
      message: error,
      suggestions: ['Please check your server details and try again'],
    };
  };

  const errorInfo = status === 'failed' ? getErrorMessage(error) : null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            status === 'testing'
              ? 'bg-blue-50 border-b border-blue-100'
              : status === 'success'
                ? 'bg-green-50 border-b border-green-100'
                : 'bg-red-50 border-b border-red-100'
          }`}
        >
          <div className='flex items-center gap-3'>
            {status === 'testing' && (
              <Loader2 className='h-5 w-5 text-blue-600 animate-spin' />
            )}
            {status === 'success' && (
              <CheckCircle className='h-5 w-5 text-green-600' />
            )}
            {status === 'failed' && (
              <XCircle className='h-5 w-5 text-red-600' />
            )}
            <h3
              className={`font-semibold ${
                status === 'testing'
                  ? 'text-blue-900'
                  : status === 'success'
                    ? 'text-green-900'
                    : 'text-red-900'
              }`}
            >
              {status === 'testing'
                ? 'Testing Connection...'
                : status === 'success'
                  ? 'Connection Successful!'
                  : errorInfo?.title || 'Connection Failed'}
            </h3>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='px-6 py-5'>
          {status === 'testing' && (
            <div className='space-y-4'>
              <p className='text-gray-600 text-sm'>
                Please wait while we test the connection to your server...
              </p>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
                  <span>Connecting to {details?.host || 'server'}...</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-400'>
                  <div className='w-2 h-2 bg-gray-300 rounded-full' />
                  <span>Authenticating...</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-400'>
                  <div className='w-2 h-2 bg-gray-300 rounded-full' />
                  <span>Verifying permissions...</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className='space-y-4'>
              <div className='flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg'>
                <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-green-900'>
                    Successfully connected to {details?.host}!
                  </p>
                  <p className='text-xs text-green-700 mt-1'>
                    {details?.responseTime &&
                      `Response time: ${details.responseTime}ms`}
                  </p>
                </div>
              </div>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-sm text-blue-900 font-medium mb-2'>
                  ✅ What's Next?
                </p>
                <ol className='text-xs text-blue-800 space-y-1 ml-4 list-decimal'>
                  <li>
                    Proceed to <strong>Step 2</strong> to configure your backup
                    path
                  </li>
                  <li>
                    Click "Create Folder on Server" to set up the backup
                    directory
                  </li>
                  <li>
                    Choose your backup storage location in{' '}
                    <strong>Step 3</strong>
                  </li>
                  <li>Save your settings</li>
                </ol>
              </div>
            </div>
          )}

          {status === 'failed' && errorInfo && (
            <div className='space-y-4'>
              <div className='flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <AlertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-900'>
                    {errorInfo.message}
                  </p>
                </div>
              </div>

              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <p className='text-sm text-yellow-900 font-medium mb-2'>
                  💡 What to Check:
                </p>
                <ul className='text-xs text-yellow-800 space-y-1.5'>
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <span className='text-yellow-600 flex-shrink-0'>•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <details className='text-xs'>
                  <summary className='text-gray-500 cursor-pointer hover:text-gray-700'>
                    Technical Details
                  </summary>
                  <div className='mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-gray-600 font-mono text-xs break-all'>
                    {error}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {canClose && (
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end'>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                status === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {status === 'success' ? 'Continue' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionTestModal;
