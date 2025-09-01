'use client';

import React, { useState } from 'react';
import { Mail, TestTube, Eye, Plus, Trash2, Edit2 } from 'lucide-react';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';

interface EmailSettingsTabProps {
  isEditing: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isActive: boolean;
  lastUsed: string;
}

export default function EmailSettingsTab({ isEditing }: EmailSettingsTabProps) {
  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    username: 'school@example.com',
    password: '',
    fromName: 'Springfield Elementary',
    fromEmail: 'noreply@school.edu',
    useTLS: true,
    useSSL: false,
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Welcome New Student',
      subject: 'Welcome to {{school_name}}!',
      content: 'Dear {{student_name}}, welcome to our school...',
      isActive: true,
      lastUsed: '5/24/2025',
    },
  ]);

  const [emailStats] = useState({
    sentThisMonth: 2847,
    deliveryRate: 97.2,
    openRate: 68.5,
    clickRate: 24.3,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setSmtpSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestEmail = () => {
    console.log('Testing email configuration...');
  };

  const handleNewTemplate = () => {
    console.log('Creating new template...');
  };

  return (
    <div className='space-y-6'>
      {/* SMTP Configuration */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Mail className='h-5 w-5 text-blue-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              SMTP Configuration
            </h3>
            <p className='text-sm text-gray-600'>
              Configure email server settings
            </p>
          </div>
          <div className='ml-auto'>
            <ReusableButton
              onClick={handleTestEmail}
              className='flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm'
              disabled={!isEditing}
            >
              <TestTube className='h-4 w-4' />
              Test Email
            </ReusableButton>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                SMTP Host
              </Label>
              <Input
                value={smtpSettings.host}
                onChange={e => handleInputChange('host', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Port
              </Label>
              <Input
                value={smtpSettings.port}
                onChange={e => handleInputChange('port', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Username
              </Label>
              <Input
                value={smtpSettings.username}
                onChange={e => handleInputChange('username', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                Password
              </Label>
              <Input
                type='password'
                value={smtpSettings.password}
                onChange={e => handleInputChange('password', e.target.value)}
                disabled={!isEditing}
                className='w-full'
                placeholder='••••••••'
              />
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                From Name
              </Label>
              <Input
                value={smtpSettings.fromName}
                onChange={e => handleInputChange('fromName', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>
                From Email
              </Label>
              <Input
                value={smtpSettings.fromEmail}
                onChange={e => handleInputChange('fromEmail', e.target.value)}
                disabled={!isEditing}
                className='w-full'
              />
            </div>

            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='useTLS'
                  checked={smtpSettings.useTLS}
                  onChange={e => handleInputChange('useTLS', e.target.checked)}
                  disabled={!isEditing}
                  className='h-4 w-4 text-blue-600 rounded border-gray-300'
                />
                <label
                  htmlFor='useTLS'
                  className='text-sm font-medium text-gray-700'
                >
                  Use TLS
                </label>
              </div>
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  id='useSSL'
                  checked={smtpSettings.useSSL}
                  onChange={e => handleInputChange('useSSL', e.target.checked)}
                  disabled={!isEditing}
                  className='h-4 w-4 text-blue-600 rounded border-gray-300'
                />
                <label
                  htmlFor='useSSL'
                  className='text-sm font-medium text-gray-700'
                >
                  Use SSL
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Templates */}
      <Card className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-green-50 rounded-lg'>
              <Mail className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Email Templates
              </h3>
              <p className='text-sm text-gray-600'>
                Manage automated email templates
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
          {emailTemplates.map(template => (
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
                  <p className='text-sm text-gray-600'>{template.subject}</p>
                  <p className='text-xs text-gray-500'>
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
                  <Eye className='h-4 w-4' />
                </ReusableButton>
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

      {/* Email Statistics */}
      <Card className='p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <Mail className='h-5 w-5 text-purple-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Email Statistics
            </h3>
            <p className='text-sm text-gray-600'>
              Email delivery and engagement metrics
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {emailStats.sentThisMonth.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Sent This Month</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {emailStats.deliveryRate}%
            </div>
            <div className='text-sm text-gray-600'>Delivery Rate</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {emailStats.openRate}%
            </div>
            <div className='text-sm text-gray-600'>Open Rate</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {emailStats.clickRate}%
            </div>
            <div className='text-sm text-gray-600'>Click Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
