'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  TestTube,
  Plus,
  Trash2,
  Edit2,
  Upload,
} from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

interface PushNotificationsTabProps {
  isEditing: boolean;
}

interface PushTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  isActive: boolean;
  lastUsed: string;
}

export default function PushNotificationsTab({
  isEditing,
}: PushNotificationsTabProps) {
  const [pushSettings, setPushSettings] = useState({
    firebaseServerKey: '',
    apnsCertificate: null as File | null,
    enablePushNotifications: true,
    androidSettings: {
      forAndroidPushNotifications: true,
    },
    iosSettings: {
      forIOSPushNotifications: true,
    },
  });

  const [pushTemplates, setPushTemplates] = useState<PushTemplate[]>([
    {
      id: '1',
      name: 'Attendance Alert',
      title: 'Attendance Alert',
      content: 'Your child {{student_name}} was marked absent today',
      isActive: true,
      lastUsed: '5/8/2025',
    },
  ]);

  const [pushStats] = useState({
    sentThisMonth: 8542,
    deliveredCount: 6789,
    openedCount: 2145,
    openRate: 31.6,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setPushSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (
    section: 'androidSettings' | 'iosSettings',
    field: string,
    value: boolean,
  ) => {
    setPushSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPushSettings(prev => ({ ...prev, apnsCertificate: file }));
    }
  };

  const handleTestPush = () => {
    console.log('Testing push notification configuration...');
  };

  const handleNewTemplate = () => {
    console.log('Creating new push template...');
  };

  return (
    <div className='space-y-6'>
      {/* Push Service Configuration */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Smartphone className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Push Service Configuration
            </h3>
            <p className='text-sm text-gray-600'>
              Configure mobile app push notifications
            </p>
          </div>
          <div className='ml-auto'>
            <ReusableButton
              onClick={handleTestPush}
              className='flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm'
              disabled={!isEditing}
            >
              <TestTube className='h-4 w-4' />
              Test Push
            </ReusableButton>
          </div>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Firebase Server Key
              </Label>
              <Input
                type='password'
                value={pushSettings.firebaseServerKey}
                onChange={e =>
                  handleInputChange('firebaseServerKey', e.target.value)
                }
                disabled={!isEditing}
                className='w-full'
                placeholder='For Android push notifications'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                APNs Certificate
              </Label>
              <div className='flex items-center gap-2'>
                <input
                  type='file'
                  accept='.p12,.pem'
                  onChange={handleFileUpload}
                  disabled={!isEditing}
                  className='hidden'
                  id='apns-certificate'
                />
                <label
                  htmlFor='apns-certificate'
                  className={`flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <Upload className='h-4 w-4' />
                  {pushSettings.apnsCertificate
                    ? pushSettings.apnsCertificate.name
                    : 'Choose File'}
                </label>
                <span className='text-sm text-gray-500'>
                  {pushSettings.apnsCertificate
                    ? 'File chosen'
                    : 'No file chosen'}
                </span>
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                For iOS push notifications (.p12 or .pem)
              </p>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='enablePushNotifications'
                checked={pushSettings.enablePushNotifications}
                onChange={e =>
                  handleInputChange('enablePushNotifications', e.target.checked)
                }
                disabled={!isEditing}
                className='h-4 w-4 text-blue-600 rounded border-gray-300'
              />
              <label
                htmlFor='enablePushNotifications'
                className='text-sm font-medium text-gray-700'
              >
                Enable Push Notifications
              </label>
              <span className='text-sm text-gray-500'>
                Allow the system to send push notifications
              </span>
            </div>

            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='forAndroidPushNotifications'
                checked={
                  pushSettings.androidSettings.forAndroidPushNotifications
                }
                onChange={e =>
                  handleNestedInputChange(
                    'androidSettings',
                    'forAndroidPushNotifications',
                    e.target.checked,
                  )
                }
                disabled={!isEditing}
                className='h-4 w-4 text-blue-600 rounded border-gray-300'
              />
              <label
                htmlFor='forAndroidPushNotifications'
                className='text-sm font-medium text-gray-700'
              >
                Enable Android Push Notifications
              </label>
            </div>

            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='forIOSPushNotifications'
                checked={pushSettings.iosSettings.forIOSPushNotifications}
                onChange={e =>
                  handleNestedInputChange(
                    'iosSettings',
                    'forIOSPushNotifications',
                    e.target.checked,
                  )
                }
                disabled={!isEditing}
                className='h-4 w-4 text-blue-600 rounded border-gray-300'
              />
              <label
                htmlFor='forIOSPushNotifications'
                className='text-sm font-medium text-gray-700'
              >
                Enable iOS Push Notifications
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Push Templates */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <Smartphone className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Push Templates
              </h3>
              <p className='text-sm text-gray-600'>
                Manage push notification templates
              </p>
            </div>
          </div>
          <ReusableButton
            onClick={handleNewTemplate}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm'
            disabled={!isEditing}
          >
            <Plus className='h-4 w-4' />
            New Template
          </ReusableButton>
        </div>

        <div className='space-y-3'>
          {pushTemplates.map(template => (
            <div
              key={template.id}
              className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                ></div>
                <div>
                  <h4 className='font-medium text-gray-900'>{template.name}</h4>
                  <p className='text-sm font-medium text-gray-700'>
                    {template.title}
                  </p>
                  <p className='text-sm text-gray-600'>{template.content}</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Last used: {template.lastUsed}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <ReusableButton
                  onClick={() => {}}
                  className='p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                  disabled={!isEditing}
                >
                  <Edit2 className='h-4 w-4' />
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
          ))}
        </div>
      </Card>

      {/* Push Notification Statistics */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <Smartphone className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Push Notification Statistics
            </h3>
            <p className='text-sm text-gray-600'>
              Push delivery and engagement metrics
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {pushStats.sentThisMonth.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Sent This Month</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {pushStats.deliveredCount.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Delivered</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {pushStats.openedCount.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Opened</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {pushStats.openRate}%
            </div>
            <div className='text-sm text-gray-600'>Open Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
