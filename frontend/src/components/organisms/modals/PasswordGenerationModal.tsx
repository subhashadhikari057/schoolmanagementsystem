import React, { useState } from 'react';
import {
  X,
  Key,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { passwordGenerationService } from '@/api/services/password-generation.service';

interface PasswordGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'student' | 'teacher' | 'parent';
}

const PasswordGenerationModal: React.FC<PasswordGenerationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userType,
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await passwordGenerationService.generateUserPassword({
        userId,
        userType,
      });

      if (response.success) {
        setGeneratedPassword(response.data.temporaryPassword);
        toast.success('Password generated successfully!');

        // Log to console for testing (like the existing user creation flow)
        console.log('🔐 PASSWORD GENERATED SUCCESSFULLY! 🔐');
        console.table({
          'User Name': userName,
          Email: userEmail,
          'User Type': userType.toUpperCase(),
          'New Password': response.data.temporaryPassword,
          'User ID': userId,
        });
        console.log('💡 Password has been generated for the user');
        console.log(
          '⚠️  This password will be shown only once for security reasons',
        );
      } else {
        toast.error('Failed to generate password');
      }
    } catch (error) {
      console.error('Password generation error:', error);
      toast.error('Failed to generate password');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        toast.success('Password copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy password');
      }
    }
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center'>
            <div className='p-2 bg-yellow-100 rounded-lg mr-3'>
              <Key className='h-5 w-5 text-yellow-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Generate Password
              </h3>
              <p className='text-sm text-gray-500'>
                Create new password for user
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {/* User Info */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h4 className='font-medium text-gray-900 mb-2'>User Information</h4>
            <div className='space-y-1 text-sm'>
              <p>
                <span className='font-medium'>Name:</span> {userName}
              </p>
              <p>
                <span className='font-medium'>Email:</span> {userEmail}
              </p>
              <p>
                <span className='font-medium'>Type:</span>{' '}
                {userType.charAt(0).toUpperCase() + userType.slice(1)}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start'>
            <AlertCircle className='h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0' />
            <div className='text-sm text-amber-800'>
              <p className='font-medium mb-1'>Important Notice</p>
              <p>
                This will generate a new temporary password and invalidate the
                current one. The user will need to use this new password to
                login.
              </p>
            </div>
          </div>

          {/* Generated Password Display */}
          {generatedPassword && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center mb-3'>
                <CheckCircle className='h-5 w-5 text-green-600 mr-2' />
                <h4 className='font-medium text-green-900'>
                  New Password Generated
                </h4>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='flex-1 relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className='w-full px-3 py-2 border border-green-300 rounded-md bg-white font-mono text-sm'
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                <button
                  onClick={copyToClipboard}
                  className='px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center'
                  title='Copy to clipboard'
                >
                  <Copy className='h-4 w-4' />
                </button>
              </div>
              <p className='text-xs text-green-700 mt-2'>
                💡 Password generated! You can copy it to share with the user.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end space-x-3 p-6 border-t border-gray-200'>
          <button
            onClick={handleClose}
            className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
            disabled={loading}
          >
            {generatedPassword ? 'Close' : 'Cancel'}
          </button>
          {!generatedPassword && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className='px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
            >
              {loading ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <Key className='h-4 w-4 mr-2' />
                  Generate Password
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerationModal;
