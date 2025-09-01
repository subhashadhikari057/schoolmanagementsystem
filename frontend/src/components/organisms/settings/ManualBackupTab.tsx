'use client';

import React, { useState } from 'react';
import {
  Database,
  FileText,
  HardDrive,
  Download,
  TestTube,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface ManualBackupTabProps {
  isEditing: boolean;
}

interface BackupType {
  id: string;
  name: string;
  description: string;
  includes: string[];
  icon: any;
  color: string;
  bgColor: string;
}

export default function ManualBackupTab({ isEditing }: ManualBackupTabProps) {
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

  const handleBackup = (type: string) => {
    console.log(`Starting ${type} backup...`);
  };

  const handleTestConnection = () => {
    console.log('Testing offsite connection...');
  };

  const handleDownloadBackup = () => {
    console.log('Downloading latest backup...');
  };

  return (
    <div className='space-y-6'>
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
                }`}
                disabled={!isEditing}
              >
                {backupType.id === 'database'
                  ? 'Backup Database'
                  : backupType.id === 'files'
                    ? 'Backup Files'
                    : 'Full Backup'}
              </ReusableButton>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <HardDrive className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Quick Actions
            </h3>
            <p className='text-sm text-gray-600'>
              Backup management tools and utilities
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <ReusableButton
            onClick={handleTestConnection}
            className='flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            disabled={!isEditing}
          >
            <TestTube className='h-4 w-4' />
            Test Offsite Connection
          </ReusableButton>

          <ReusableButton
            onClick={handleDownloadBackup}
            className='flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <Download className='h-4 w-4' />
            Download Latest Backup
          </ReusableButton>
        </div>
      </Card>
    </div>
  );
}
