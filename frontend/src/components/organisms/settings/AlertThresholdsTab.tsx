'use client';

import React, { useState } from 'react';
import { AlertTriangle, Users, DollarSign, Settings2 } from 'lucide-react';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

interface AlertThresholdsTabProps {
  isEditing: boolean;
}

export default function AlertThresholdsTab({
  isEditing,
}: AlertThresholdsTabProps) {
  const [academicAlerts, setAcademicAlerts] = useState({
    lowAttendanceThreshold: '75',
    examReminderDays: '7',
  });

  const [financialAlerts, setFinancialAlerts] = useState({
    unpaidFeesAlertDays: '30',
  });

  const [systemAlerts, setSystemAlerts] = useState({
    systemErrorThreshold: 'Immediate (1 error)',
    storageAlertThreshold: '85',
  });

  const [alertRecipients, setAlertRecipients] = useState({
    administratorEmails: 'admin@school.edu, admin2@school.edu',
    administratorPhoneNumbers: '+1234567890, +0987654321',
  });

  const handleAcademicChange = (field: string, value: string) => {
    setAcademicAlerts(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialChange = (field: string, value: string) => {
    setFinancialAlerts(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemChange = (field: string, value: string) => {
    setSystemAlerts(prev => ({ ...prev, [field]: value }));
  };

  const handleRecipientsChange = (field: string, value: string) => {
    setAlertRecipients(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className='space-y-6'>
      {/* Academic Alerts */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <AlertTriangle className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Academic Alerts
            </h3>
            <p className='text-sm text-gray-600'>
              Configure academic performance and attendance alerts
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Low Attendance Threshold (%)
            </Label>
            <Input
              value={academicAlerts.lowAttendanceThreshold}
              onChange={e =>
                handleAcademicChange('lowAttendanceThreshold', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='75'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Alert when student attendance falls below this percentage
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Exam Reminder (Days)
            </Label>
            <Input
              value={academicAlerts.examReminderDays}
              onChange={e =>
                handleAcademicChange('examReminderDays', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='7'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Send reminder notifications this many days before exams
            </p>
          </div>
        </div>
      </Card>

      {/* Financial Alerts */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <DollarSign className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Financial Alerts
            </h3>
            <p className='text-sm text-gray-600'>
              Configure fee payment and financial alerts
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Unpaid Fees Alert (Days)
            </Label>
            <Input
              value={financialAlerts.unpaidFeesAlertDays}
              onChange={e =>
                handleFinancialChange('unpaidFeesAlertDays', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='30'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Alert when fees remain unpaid for this many days
            </p>
          </div>
        </div>
      </Card>

      {/* System Alerts */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-red-50 rounded-lg'>
            <Settings2 className='h-5 w-5 text-red-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              System Alerts
            </h3>
            <p className='text-sm text-gray-600'>
              Configure system error and storage alerts
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              System Error Threshold
            </Label>
            <select
              value={systemAlerts.systemErrorThreshold}
              onChange={e =>
                handleSystemChange('systemErrorThreshold', e.target.value)
              }
              disabled={!isEditing}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
            >
              <option value='Immediate (1 error)'>Immediate (1 error)</option>
              <option value='After 5 errors'>After 5 errors</option>
              <option value='After 10 errors'>After 10 errors</option>
              <option value='After 20 errors'>After 20 errors</option>
            </select>
            <p className='text-xs text-gray-500 mt-1'>
              Alert when this many system errors occur
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Storage Alert Threshold (%)
            </Label>
            <Input
              value={systemAlerts.storageAlertThreshold}
              onChange={e =>
                handleSystemChange('storageAlertThreshold', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='85'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Alert when storage usage exceeds this percentage
            </p>
          </div>
        </div>
      </Card>

      {/* Alert Recipients */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <Users className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Alert Recipients
            </h3>
            <p className='text-sm text-gray-600'>
              Configure who receives system alerts
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Administrator Emails
            </Label>
            <Input
              value={alertRecipients.administratorEmails}
              onChange={e =>
                handleRecipientsChange('administratorEmails', e.target.value)
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='admin@school.edu, admin2@school.edu'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Email addresses to receive system alerts (comma separated)
            </p>
          </div>
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Administrator Phone Numbers
            </Label>
            <Input
              value={alertRecipients.administratorPhoneNumbers}
              onChange={e =>
                handleRecipientsChange(
                  'administratorPhoneNumbers',
                  e.target.value,
                )
              }
              disabled={!isEditing}
              className='w-full'
              placeholder='+1234567890, +0987654321'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Phone numbers for SMS alerts (comma separated)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
