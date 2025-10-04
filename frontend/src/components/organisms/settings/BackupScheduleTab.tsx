'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Database,
  FileText,
  HardDrive,
  Play,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import ReusableButton from '@/components/atoms/form-controls/Button';
import { Card } from '@/components/ui/card';
import { backupScheduleService } from '@/api/services/backup-schedule.service';
import { useBackupContext } from '@/context/BackupContext';

interface BackupScheduleTabProps {}

export default function BackupScheduleTab() {
  const { toast } = useBackupContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [schedulerHealth, setSchedulerHealth] = useState<any>(null);

  const [automaticBackups, setAutomaticBackups] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState({
    backupTime: '02:00',
    dailyRetention: 7,
    weeklyRetention: 4,
    monthlyRetention: 3,
  });

  const [nextScheduledBackup, setNextScheduledBackup] = useState({
    date: 'Loading...',
    type: 'Loading...',
  });

  const [backupTypesSchedule, setBackupTypesSchedule] = useState<any[]>([]);

  // Load schedules on component mount
  useEffect(() => {
    loadSchedules();
    loadSchedulerHealth();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await backupScheduleService.getSchedules();

      if (response.success && response.data) {
        setSchedules(response.data);

        // Update next scheduled backup
        const nextBackup = response.data.find(
          (schedule: any) => schedule.enabled && schedule.nextRun,
        );
        if (nextBackup && nextBackup.nextRun) {
          setNextScheduledBackup({
            date: new Date(nextBackup.nextRun).toLocaleString(),
            type: `${nextBackup.type} backup (${nextBackup.frequency})`,
          });
        } else if (response.data.length === 0) {
          setNextScheduledBackup({
            date: 'No scheduled backups',
            type: 'Configure a schedule below',
          });
        }

        // Group schedules by type for display
        const byType = response.data.map((schedule: any) => {
          const typeName =
            schedule.type === 'DATABASE'
              ? 'Database'
              : schedule.type === 'FILES'
                ? 'Files'
                : 'Full System';
          const scheduleText = schedule.enabled
            ? `${schedule.frequency} - Next: ${new Date(schedule.nextRun).toLocaleString()}`
            : 'Disabled';

          return {
            id: schedule.id, // Use schedule.id instead of schedule.scheduleId
            name: typeName,
            schedule: scheduleText,
            icon:
              schedule.type === 'DATABASE'
                ? Database
                : schedule.type === 'FILES'
                  ? FileText
                  : HardDrive,
            color:
              schedule.type === 'DATABASE'
                ? 'text-blue-600'
                : schedule.type === 'FILES'
                  ? 'text-green-600'
                  : 'text-purple-600',
            enabled: schedule.enabled,
          };
        });
        setBackupTypesSchedule(byType);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to load schedules';
      setError(errorMsg);
      toast.error('Schedule Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedulerHealth = async () => {
    try {
      const response = await backupScheduleService.getSchedulerHealth();
      if (response.success) {
        setSchedulerHealth(response.data);
      }
    } catch (err) {
      // Silently fail - scheduler health is non-critical
    }
  };

  const handleScheduleChange = (field: string, value: string | number) => {
    setScheduleSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      setError('');

      const scheduleData = {
        name: 'Daily Full System Backup',
        type: 'FULL_SYSTEM' as const,
        frequency: 'DAILY' as const,
        time: scheduleSettings.backupTime,
        retentionPolicy: {
          daily: scheduleSettings.dailyRetention,
          weekly: scheduleSettings.weeklyRetention,
          monthly: scheduleSettings.monthlyRetention,
        },
        enabled: automaticBackups,
      };

      const response = await backupScheduleService.createSchedule(scheduleData);

      if (response.success) {
        toast.success(
          'Schedule Saved',
          'Backup schedule updated successfully.',
        );
        await loadSchedules(); // Reload schedules
      } else {
        const errorMsg = response.error || 'Failed to save schedule';
        setError(errorMsg);
        toast.error('Save Failed', errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to save schedule';
      setError(errorMsg);
      toast.error('Save Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunNow = async () => {
    try {
      setLoading(true);

      // Find the next scheduled backup's ID
      const nextBackup = schedules.find(
        (schedule: any) => schedule.enabled && schedule.nextRun,
      );
      if (!nextBackup || !nextBackup.id) {
        toast.error('No Schedule', 'No enabled schedule found to run.');
        return;
      }

      const response = await backupScheduleService.runScheduleNow(
        nextBackup.id,
      );

      if (response.success) {
        toast.success(
          'Backup Started',
          'Scheduled backup initiated successfully.',
        );
        // Reload schedules to update the display
        await loadSchedules();
      } else {
        const errorMsg = response.error || 'Failed to start backup';
        toast.error('Backup Failed', errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start backup';
      toast.error('Backup Error', errorMsg);
    } finally {
      setLoading(false);
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

      {/* Save Button */}
      <div className='flex justify-end'>
        <ReusableButton
          onClick={handleSaveSchedule}
          disabled={loading}
          className='px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2'
        >
          {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
          {loading ? 'Saving...' : 'Save Schedule'}
        </ReusableButton>
      </div>

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
                disabled={!automaticBackups}
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
                disabled={!automaticBackups}
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
                disabled={!automaticBackups}
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
                disabled={!automaticBackups}
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

        {backupTypesSchedule.length > 0 ? (
          <div className='space-y-4'>
            {backupTypesSchedule.map(type => {
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
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-500'>
                        {type.enabled ? 'Active' : 'Inactive'}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${type.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                      ></div>
                    </div>
                    {type.enabled && (
                      <ReusableButton
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const response =
                              await backupScheduleService.runScheduleNow(
                                type.id,
                              );
                            if (response.success) {
                              toast.success(
                                'Backup Started',
                                `${type.name} backup initiated successfully.`,
                              );
                              await loadSchedules();
                            } else {
                              toast.error(
                                'Backup Failed',
                                response.error || 'Failed to start backup',
                              );
                            }
                          } catch (err) {
                            const errorMsg =
                              err instanceof Error
                                ? err.message
                                : 'Failed to start backup';
                            toast.error('Backup Error', errorMsg);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className='flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm disabled:opacity-50'
                        disabled={loading}
                      >
                        <Play className='h-3.5 w-3.5' />
                        Run Now
                      </ReusableButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Calendar className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h4 className='text-lg font-medium text-gray-900 mb-2'>
              No Schedules Configured
            </h4>
            <p className='text-sm text-gray-600 mb-6'>
              Create backup schedules to automate your backup process
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
