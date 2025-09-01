'use client';

import React, { useState } from 'react';
import {
  Play,
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface BackupOverviewTabProps {
  isEditing: boolean;
}

interface BackupItem {
  id: string;
  type: 'Full Backup' | 'Database Backup' | 'Files Backup';
  date: string;
  time: string;
  size: string;
  status: 'Both' | 'Local' | 'Offsite';
  icon: any;
  color: string;
}

export default function BackupOverviewTab({
  isEditing,
}: BackupOverviewTabProps) {
  const [serviceStatus] = useState({
    backupService: 'Running',
    lastBackup: '2 hours ago',
    storageUsed: '75 / 100 GB',
    offsiteStatus: 'Connected',
  });

  const [storageBreakdown] = useState({
    totalStorage: '75 / 100 GB',
    databaseBackups: '45 GB',
    fileBackups: '25 GB',
    available: '25 GB',
  });

  const [recentBackups] = useState<BackupItem[]>([
    {
      id: '1',
      type: 'Full Backup',
      date: '1/20/2025',
      time: '4:15:00 PM',
      size: '2.4 GB',
      status: 'Both',
      icon: Database,
      color: 'text-purple-600',
    },
    {
      id: '2',
      type: 'Database Backup',
      date: '1/20/2025',
      time: '7:45:00 AM',
      size: '1.8 GB',
      status: 'Local',
      icon: Database,
      color: 'text-blue-600',
    },
    {
      id: '3',
      type: 'Files Backup',
      date: '1/19/2025',
      time: '8:00:00 PM',
      size: '650 MB',
      status: 'Offsite',
      icon: Database,
      color: 'text-green-600',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Both':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'>
            <CheckCircle className='w-3 h-3' /> Both
          </span>
        );
      case 'Local':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3' /> Local
          </span>
        );
      case 'Offsite':
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3' /> Offsite
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
            <AlertCircle className='w-3 h-3' /> Unknown
          </span>
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* Service Status Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <Play className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Backup Service</p>
              <p className='font-medium text-green-600'>
                {serviceStatus.backupService}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Clock className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Last Backup</p>
              <p className='font-medium text-gray-900'>
                {serviceStatus.lastBackup}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <Database className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Storage Used</p>
              <p className='font-medium text-gray-900'>
                {serviceStatus.storageUsed}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-orange-50 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-orange-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Offsite Status</p>
              <p className='font-medium text-green-600'>
                {serviceStatus.offsiteStatus}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Database className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Storage Usage
            </h3>
            <p className='text-sm text-gray-600'>
              Monitor backup storage consumption
            </p>
          </div>
        </div>

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm text-gray-600'>Total Storage</span>
            <span className='text-sm font-medium text-gray-900'>
              {storageBreakdown.totalStorage}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full'
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>Database Backups</p>
            <p className='text-lg font-semibold text-gray-900'>
              {storageBreakdown.databaseBackups}
            </p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>File Backups</p>
            <p className='text-lg font-semibold text-gray-900'>
              {storageBreakdown.fileBackups}
            </p>
          </div>
          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <p className='text-sm text-gray-600'>Available</p>
            <p className='text-lg font-semibold text-green-600'>
              {storageBreakdown.available}
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Backups */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-purple-50 rounded-lg'>
              <Zap className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Recent Backups
              </h3>
              <p className='text-sm text-gray-600'>
                Latest backup activities and status
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={() => {}}
            className='flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm'
          >
            Refresh
          </ReusableButton>
        </div>

        <div className='space-y-3'>
          {recentBackups.map(backup => {
            const IconComponent = backup.icon;
            return (
              <div
                key={backup.id}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 bg-white rounded-lg ${backup.color}`}>
                    <IconComponent className='h-4 w-4' />
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900'>{backup.type}</h4>
                    <p className='text-sm text-gray-600'>
                      {backup.date}, {backup.time} • {backup.size}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  {getStatusBadge(backup.status)}
                  <div className='flex gap-1'>
                    <ReusableButton
                      onClick={() => {}}
                      className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                    >
                      <Database className='h-4 w-4' />
                    </ReusableButton>
                    <ReusableButton
                      onClick={() => {}}
                      className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                    >
                      <AlertCircle className='h-4 w-4' />
                    </ReusableButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
