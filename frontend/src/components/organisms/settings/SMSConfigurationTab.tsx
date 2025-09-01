'use client';

import React, { useState } from 'react';
import { MessageSquare, TestTube, Plus, Trash2, Edit2 } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

interface SMSConfigurationTabProps {
  isEditing: boolean;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  lastUsed: string;
}

export default function SMSConfigurationTab({
  isEditing,
}: SMSConfigurationTabProps) {
  const [smsSettings, setSmsSettings] = useState({
    provider: 'Twilio',
    apiKey: '',
    apiSecret: '',
    fromNumber: '+1234567890',
    enableNotifications: true,
  });

  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([
    {
      id: '1',
      name: 'Fee Payment Reminder',
      content: 'Dear parent, fee payment of ${{amount}} is due on {{due_date}}',
      isActive: true,
      lastUsed: '5/8/2025',
    },
  ]);

  const [smsStats] = useState({
    sentThisMonth: 1247,
    deliveryRate: 98.5,
    totalCost: 127.4,
    remainingCredits: 2500,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setSmsSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestSMS = () => {
    console.log('Testing SMS configuration...');
  };

  const handleNewTemplate = () => {
    console.log('Creating new SMS template...');
  };

  return (
    <div className='space-y-6'>
      {/* SMS Provider Configuration */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <MessageSquare className='h-5 w-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              SMS Provider Configuration
            </h3>
            <p className='text-sm text-gray-600'>
              Configure SMS gateway settings
            </p>
          </div>
          <div className='ml-auto'>
            <ReusableButton
              onClick={handleTestSMS}
              className='flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm'
              disabled={!isEditing}
            >
              <TestTube className='h-4 w-4' />
              Test SMS
            </ReusableButton>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Provider
              </Label>
              <select
                value={smsSettings.provider}
                onChange={e => handleInputChange('provider', e.target.value)}
                disabled={!isEditing}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100'
              >
                <option value='Twilio'>Twilio</option>
                <option value='AWS SNS'>AWS SNS</option>
                <option value='MessageBird'>MessageBird</option>
              </select>
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                API Key
              </Label>
              <Input
                value={smsSettings.apiKey}
                onChange={e => handleInputChange('apiKey', e.target.value)}
                disabled={!isEditing}
                className='w-full'
                placeholder='Enter API Key'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                API Secret
              </Label>
              <Input
                type='password'
                value={smsSettings.apiSecret}
                onChange={e => handleInputChange('apiSecret', e.target.value)}
                disabled={!isEditing}
                className='w-full'
                placeholder='••••••••'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                From Number
              </Label>
              <Input
                value={smsSettings.fromNumber}
                onChange={e => handleInputChange('fromNumber', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>
          </div>
        </div>

        <div className='mt-4'>
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='enableNotifications'
              checked={smsSettings.enableNotifications}
              onChange={e =>
                handleInputChange('enableNotifications', e.target.checked)
              }
              disabled={!isEditing}
              className='h-4 w-4 text-blue-600 rounded border-gray-300'
            />
            <label
              htmlFor='enableNotifications'
              className='text-sm font-medium text-gray-700'
            >
              Enable SMS Notifications
            </label>
            <span className='text-sm text-gray-500'>
              Allow the system to send SMS notifications
            </span>
          </div>
        </div>
      </Card>

      {/* SMS Templates */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <MessageSquare className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                SMS Templates
              </h3>
              <p className='text-sm text-gray-600'>
                Manage automated SMS templates
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
          {smsTemplates.map(template => (
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
                  <p className='text-sm text-gray-600 max-w-md truncate'>
                    {template.content}
                  </p>
                  <div className='flex items-center gap-4 mt-1'>
                    <span className='text-xs text-gray-500'>
                      Length: 62/160 characters
                    </span>
                    <span className='text-xs text-gray-500'>
                      Last used: {template.lastUsed}
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

      {/* SMS Usage Statistics */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <MessageSquare className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              SMS Usage Statistics
            </h3>
            <p className='text-sm text-gray-600'>
              SMS delivery and cost metrics
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {smsStats.sentThisMonth.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Sent This Month</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {smsStats.deliveryRate}%
            </div>
            <div className='text-sm text-gray-600'>Delivery Rate</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              ${smsStats.totalCost}
            </div>
            <div className='text-sm text-gray-600'>Total Cost</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {smsStats.remainingCredits.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Remaining Credits</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
