'use client';

import React, { useState } from 'react';
import {
  Upload,
  Database,
  FileText,
  HardDrive,
  Download,
  AlertTriangle,
  Eye,
  Trash2,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

interface RestoreTabProps {
  isEditing: boolean;
}

interface AvailableBackup {
  id: string;
  name: string;
  date: string;
  time: string;
  size: string;
  type: 'Full Backup' | 'Database Backup' | 'Files Backup';
  encrypted: boolean;
  location: 'Both' | 'Local' | 'Offsite';
  frequency: 'Daily' | 'Weekly';
  icon: any;
  color: string;
}

export default function RestoreTab({ isEditing }: RestoreTabProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [backupType, setBackupType] = useState('');

  const [availableBackups] = useState<AvailableBackup[]>([
    {
      id: '1',
      name: 'Full Backup',
      date: '1/20/2025',
      time: '4:15:00 PM',
      size: '2.4 GB',
      type: 'Full Backup',
      encrypted: true,
      location: 'Both',
      frequency: 'Daily',
      icon: HardDrive,
      color: 'text-purple-600',
    },
    {
      id: '2',
      name: 'Database Backup',
      date: '1/20/2025',
      time: '7:45:00 AM',
      size: '1.8 GB',
      type: 'Database Backup',
      encrypted: true,
      location: 'Local',
      frequency: 'Daily',
      icon: Database,
      color: 'text-blue-600',
    },
    {
      id: '3',
      name: 'Files Backup',
      date: '1/19/2025',
      time: '8:00:00 PM',
      size: '650 MB',
      type: 'Files Backup',
      encrypted: false,
      location: 'Offsite',
      frequency: 'Weekly',
      icon: FileText,
      color: 'text-green-600',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRestore = (backupId: string) => {
    console.log(`Restoring backup ${backupId}...`);
  };

  const getLocationBadge = (location: string) => {
    switch (location) {
      case 'Both':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'>
            Both
          </span>
        );
      case 'Local':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            Local
          </span>
        );
      case 'Offsite':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            Offsite
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
            Unknown
          </span>
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* Warning */}
      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
        <div className='flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div>
            <p className='text-sm font-medium text-yellow-800'>Warning:</p>
            <p className='text-sm text-yellow-700'>
              Restoring from a backup will overwrite all current data. Make sure
              to create a backup of the current system before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Upload & Restore Backup */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Upload className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Upload & Restore Backup
            </h3>
            <p className='text-sm text-gray-600'>
              Upload a backup file to restore from
            </p>
          </div>
        </div>

        <div className='space-y-6'>
          {/* File Upload Area */}
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'>
            <Upload className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-gray-900 mb-2'>
              Upload Backup File
            </h4>
            <p className='text-sm text-gray-600 mb-4'>
              Select a backup file (.sql, .gz, .zip, .tar.gz) to restore
            </p>
            <input
              type='file'
              accept='.sql,.gz,.zip,.tar.gz'
              onChange={handleFileUpload}
              disabled={!isEditing}
              className='hidden'
              id='backup-file'
            />
            <label
              htmlFor='backup-file'
              className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${!isEditing ? 'bg-gray-400 cursor-not-allowed' : ''}`}
            >
              <Upload className='h-4 w-4' />
              Choose File
            </label>
            {uploadedFile && (
              <p className='text-sm text-green-600 mt-2'>
                Selected: {uploadedFile.name} (
                {Math.round(uploadedFile.size / 1024 / 1024)} MB)
              </p>
            )}
          </div>

          {/* Additional Options */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Decryption Key (if encrypted)
              </Label>
              <Input
                type='password'
                value={decryptionKey}
                onChange={e => setDecryptionKey(e.target.value)}
                disabled={!isEditing}
                className='w-full'
                placeholder='Enter decryption key'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Backup Type
              </Label>
              <select
                value={backupType}
                onChange={e => setBackupType(e.target.value)}
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value=''>Select backup type</option>
                <option value='full'>Full System Backup</option>
                <option value='database'>Database Only</option>
                <option value='files'>Files Only</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Available Backups */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <Database className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Available Backups
            </h3>
            <p className='text-sm text-gray-600'>
              Select a backup to restore from
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          {availableBackups.map(backup => {
            const IconComponent = backup.icon;
            return (
              <div
                key={backup.id}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 bg-gray-50 rounded-lg ${backup.color}`}>
                    <IconComponent className='h-4 w-4' />
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900'>{backup.name}</h4>
                    <p className='text-sm text-gray-600'>
                      {backup.date}, {backup.time} • {backup.size}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      {backup.encrypted && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                          Encrypted
                        </span>
                      )}
                      {getLocationBadge(backup.location)}
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
                        {backup.frequency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <ReusableButton
                    onClick={() => {}}
                    className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    disabled={!isEditing}
                  >
                    <Download className='h-4 w-4' />
                  </ReusableButton>
                  <ReusableButton
                    onClick={() => {}}
                    className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    disabled={!isEditing}
                  >
                    <Eye className='h-4 w-4' />
                  </ReusableButton>
                  <ReusableButton
                    onClick={() => handleRestore(backup.id)}
                    className='px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
                    disabled={!isEditing}
                  >
                    Restore
                  </ReusableButton>
                  <ReusableButton
                    onClick={() => {}}
                    className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    disabled={!isEditing}
                  >
                    <Trash2 className='h-4 w-4' />
                  </ReusableButton>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
