'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Database,
  FileText,
  HardDrive,
  Play,
} from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';

interface BackupScheduleTabProps {
  isEditing: boolean;
}

export default function BackupScheduleTab({
  isEditing,
}: BackupScheduleTabProps) {
  const [automaticBackups, setAutomaticBackups] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState({
    backupTime: '02:00 AM',
    dailyRetention: '7 days',
    weeklyRetention: '4 weeks',
    monthlyRetention: '3 months',
  });

  const [nextScheduledBackup] = useState({
    date: 'Tomorrow at 2:00 AM',
    type: 'Full system backup (automated)',
  });

  const [backupTypes] = useState([
    {
      id: 'database',
      name: 'Database',
      schedule: 'Daily at 2:00 AM',
      icon: Database,
      color: 'text-blue-600',
    },
    {
      id: 'files',
      name: 'Files',
      schedule: 'Weekly on Sunday',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      id: 'full',
      name: 'Full System',
      schedule: 'Monthly on 1st',
      icon: HardDrive,
      color: 'text-purple-600',
    },
  ]);

  const handleScheduleChange = (field: string, value: string) => {
    setScheduleSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleRunNow = () => {
    console.log('Running backup now...');
  };

  return (
    <div className='space-y-6'>
      {/* Automatic Backup Schedule */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Calendar className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Automatic Backup Schedule
            </h3>
            <p className='text-sm text-gray-600'>
              Configure automated backup schedules
            </p>
          </div>
        </div>

        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <input
              type='checkbox'
              id='enableAutomaticBackups'
              checked={automaticBackups}
              onChange={e => setAutomaticBackups(e.target.checked)}
              disabled={!isEditing}
              className='h-4 w-4 text-blue-600 rounded border-gray-300'
            />
            <label
              htmlFor='enableAutomaticBackups'
              className='text-sm font-medium text-gray-700'
            >
              Enable Automatic Backups
            </label>
            <span className='text-sm text-gray-500'>
              Run scheduled backups automatically
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Backup Time
              </Label>
              <Input
                value={scheduleSettings.backupTime}
                onChange={e =>
                  handleScheduleChange('backupTime', e.target.value)
                }
                disabled={!isEditing || !automaticBackups}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Daily Retention
              </Label>
              <Input
                value={scheduleSettings.dailyRetention}
                onChange={e =>
                  handleScheduleChange('dailyRetention', e.target.value)
                }
                disabled={!isEditing || !automaticBackups}
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Weekly Retention
              </Label>
              <Input
                value={scheduleSettings.weeklyRetention}
                onChange={e =>
                  handleScheduleChange('weeklyRetention', e.target.value)
                }
                disabled={!isEditing || !automaticBackups}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Monthly Retention
              </Label>
              <Input
                value={scheduleSettings.monthlyRetention}
                onChange={e =>
                  handleScheduleChange('monthlyRetention', e.target.value)
                }
                disabled={!isEditing || !automaticBackups}
                className='w-full'
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Next Scheduled Backup */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <Clock className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Next Scheduled Backup
            </h3>
            <p className='text-sm text-gray-600'>
              Upcoming automatic backup schedule
            </p>
          </div>
        </div>

        <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
          <div className='flex items-center gap-3'>
            <Calendar className='h-5 w-5 text-blue-600' />
            <div>
              <h4 className='font-medium text-gray-900'>
                {nextScheduledBackup.date}
              </h4>
              <p className='text-sm text-gray-600'>
                {nextScheduledBackup.type}
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={handleRunNow}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
            disabled={!isEditing}
          >
            <Play className='h-4 w-4' />
            Run Now
          </ReusableButton>
        </div>
      </Card>

      {/* Backup Types Schedule */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <Calendar className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Backup Types Schedule
            </h3>
            <p className='text-sm text-gray-600'>
              Configured backup frequency by type
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {backupTypes.map(type => {
            const IconComponent = type.icon;
            return (
              <div
                key={type.id}
                className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 bg-gray-50 rounded-lg ${type.color}`}>
                    <IconComponent className='h-5 w-5' />
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900'>{type.name}</h4>
                    <p className='text-sm text-gray-600'>{type.schedule}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-500'>Active</span>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
