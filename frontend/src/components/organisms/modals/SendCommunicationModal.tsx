import React, { useState } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';

interface SendCommunicationModalProps {
  open: boolean;
  onClose: () => void;
}

const messageTypes = [
  { label: 'Notice/Announcement', value: 'notice' },
  { label: 'Reminder', value: 'reminder' },
  { label: 'Alert', value: 'alert' },
];
const priorities = [
  { label: 'High Priority', value: 'high' },
  { label: 'Medium Priority', value: 'medium' },
  { label: 'Low Priority', value: 'low' },
];
const deliveries = [
  { label: 'Send Immediately', value: 'immediate' },
  { label: 'Schedule', value: 'schedule' },
];

const roleOptions = [
  { label: 'All Students', value: 'students', count: 2847 },
  { label: 'All Parents', value: 'parents', count: 1425 },
  { label: 'All Teachers', value: 'teachers', count: 156 },
  { label: 'All Staff', value: 'staff', count: 67 },
  { label: 'Administration', value: 'admin', count: 12 },
];
const classOptions = [
  { label: 'Grade 9', value: 'g9', count: 712 },
  { label: 'Grade 10', value: 'g10', count: 689 },
  { label: 'Grade 11', value: 'g11', count: 756 },
  { label: 'Grade 12', value: 'g12', count: 690 },
];

export default function SendCommunicationModal({
  open,
  onClose,
}: SendCommunicationModalProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({
    messageType: 'notice',
    priority: 'medium',
    delivery: 'immediate',
    subject: '',
    content: '',
    attachments: [] as File[],
    sendEmail: true,
    sendSMS: false,
    sendPush: false,
    recipients: [] as string[],
    classes: [] as string[],
  });
  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({
      ...f,
      attachments: e.target.files ? Array.from(e.target.files) : [],
    }));
  };

  const tabs = [
    {
      name: 'Compose Message',
      content: (
        <form className='space-y-6' onSubmit={e => e.preventDefault()}>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6'>
            <div>
              <SectionTitle
                text='Message Type'
                className='block text-xs font-medium mb-1'
                level={6}
              />
              <Dropdown
                type='filter'
                options={messageTypes}
                selectedValue={form.messageType}
                onSelect={val => setForm(f => ({ ...f, messageType: val }))}
                className='w-full'
              />
            </div>
            <div>
              <SectionTitle
                text='Priority Level'
                className='block text-xs font-medium mb-1'
                level={6}
              />
              <Dropdown
                type='filter'
                options={priorities}
                selectedValue={form.priority}
                onSelect={val => setForm(f => ({ ...f, priority: val }))}
                className='w-full'
              />
            </div>
            <div>
              <SectionTitle
                text='Delivery'
                className='block text-xs font-medium mb-1'
                level={6}
              />
              <Dropdown
                type='filter'
                options={deliveries}
                selectedValue={form.delivery}
                onSelect={val => setForm(f => ({ ...f, delivery: val }))}
                className='w-full'
              />
            </div>
          </div>
          <div>
            <SectionTitle
              text='Subject *'
              className='block text-xs font-medium mb-1'
              level={6}
            />
            <Input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder='Enter subject/title of the communication'
              className='bg-gray-50 h-12 focus:bg-white transition-colors'
            />
          </div>
          <div>
            <SectionTitle
              text='Message Content *'
              className='block text-xs font-medium mb-1'
              level={6}
            />
            <Textarea
              className='w-full border rounded px-3 py-2 min-h-[100px] bg-gray-50 focus:bg-white transition-colors resize-y'
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder='Write your message content here...'
              rows={5}
            />
            <div className='text-xs text-gray-500'>
              Character count: {form.content.length}
            </div>
          </div>
          <div>
            <SectionTitle
              text='Attachments'
              className='block text-xs font-medium mb-1'
              level={6}
            />
            <input
              type='file'
              multiple
              className='block w-full text-sm text-gray-500 bg-gray-50 rounded border border-gray-200 px-2 py-2'
              onChange={handleFileChange}
            />
          </div>
          <div>
            <SectionTitle
              text='Delivery Channels'
              className='block text-xs font-medium mb-1'
              level={6}
            />
            <div className='flex flex-col gap-2'>
              <Checkbox
                label='Send Email Notification'
                checked={form.sendEmail}
                onChange={() =>
                  setForm(f => ({ ...f, sendEmail: !f.sendEmail }))
                }
              />
              <Checkbox
                label='Send SMS Notification'
                checked={form.sendSMS}
                onChange={() => setForm(f => ({ ...f, sendSMS: !f.sendSMS }))}
              />
              <Checkbox
                label='Send Push Notification'
                checked={form.sendPush}
                onChange={() => setForm(f => ({ ...f, sendPush: !f.sendPush }))}
              />
            </div>
          </div>
        </form>
      ),
    },
    {
      name: 'Select Recipients',
      content: (
        <div className='space-y-10 sm:space-y-12 md:space-y-14'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 rounded px-4 py-4 mb-6 gap-4'>
            <div className='flex items-center gap-2 text-base font-medium'>
              <span className='text-blue-600'>👤</span> Total Recipients:{' '}
              {form.recipients.length + form.classes.length}
            </div>
            <Button className='bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-medium cursor-pointer'>
              View Recipient List
            </Button>
          </div>
          <div>
            <div className='font-semibold mb-2'>Select by Role</div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-4 mb-8'>
              {roleOptions.map(opt => (
                <Checkbox
                  key={opt.value}
                  label={`${opt.label} ${opt.count ? `(${opt.count} recipients)` : ''}`}
                  checked={form.recipients.includes(opt.value)}
                  onChange={() =>
                    setForm(f => ({
                      ...f,
                      recipients: f.recipients.includes(opt.value)
                        ? f.recipients.filter(r => r !== opt.value)
                        : [...f.recipients, opt.value],
                    }))
                  }
                />
              ))}
            </div>
            <div className='font-semibold mb-2 mt-8'>Select by Class</div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-4'>
              {classOptions.map(opt => (
                <Checkbox
                  key={opt.value}
                  label={`${opt.label} ${opt.count ? `(${opt.count} students)` : ''}`}
                  checked={form.classes.includes(opt.value)}
                  onChange={() =>
                    setForm(f => ({
                      ...f,
                      classes: f.classes.includes(opt.value)
                        ? f.classes.filter(c => c !== opt.value)
                        : [...f.classes, opt.value],
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0 mx-2 my-auto max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 border-b'>
          <SectionTitle text='Send Communication' />
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl'
          >
            ×
          </button>
        </div>
        <div className='p-4 sm:p-6 space-y-4'>
          <Tabs tabs={tabs} defaultIndex={tabIndex} className='text-sm' />
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 sm:px-6 pb-6 mt-2'>
          <Button
            className='bg-gray-100 text-gray-700 px-1.5 py-1 rounded w-full text-[11px] sm:text-xs cursor-pointer'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className='bg-gray-100 text-gray-700 px-1.5 py-1 rounded w-full text-[11px] sm:text-xs cursor-pointer'>
            Preview
          </Button>
          <Button className='bg-blue-600 text-white px-1.5 py-1 rounded w-full flex items-center gap-2 text-[11px] sm:text-xs cursor-pointer'>
            Send Communication
            <span className='ml-1'>✈️</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
