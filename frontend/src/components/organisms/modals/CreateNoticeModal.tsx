// CreateNoticeModal.tsx
// Modal for creating a new notice (Notice Management)

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import Dropdown from '@/components/molecules/interactive/Dropdown';

type FormState = {
  title: string;
  priority: string;
  content: string;
  publishDate: string;
  expiryDate: string;
  recipients: string[];
  categories: string[];
  attachments: File[];
  sendEmail: boolean;
  sendSMS: boolean;
  recipient: string;
  grade: string;
};

export default function CreateNoticeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    title: '',
    priority: '',
    content: '',
    publishDate: '',
    expiryDate: '',
    recipients: [],
    categories: [],
    attachments: [],
    sendEmail: false,
    sendSMS: false,
    recipient: '',
    grade: '',
  });

  if (!open) return null;

  const priorities = ['High', 'Medium', 'Low'];
  const categoryOptions = [
    'Academic',
    'Administrative',
    'Event',
    'Holiday',
    'Examination',
    'Fee',
    'General',
  ];

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with real submit logic
    console.log('Publish Notice', form);
    onClose();
  };

  const handleSaveDraft = () => {
    // TODO: Replace with real draft logic
    console.log('Save Draft', form);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 h-screen flex items-center justify-center bg-black/20 overflow-y-auto'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0 mx-2 my-6 max-h-[80vh] overflow-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 border-b'>
          <SectionTitle text='Create New Notice' />
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl'
            aria-label='Close'
            type='button'
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form className='p-4 sm:p-6 space-y-4' onSubmit={handlePublish}>
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              type='text'
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder='Enter notice title'
              required
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority *</Label>
            <Dropdown
              type='filter'
              placeholder='Select Class'
              options={[
                { value: 'High', label: 'High' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
              ]}
              selectedValue={form.grade}
              onSelect={value => setForm(f => ({ ...f, grade: value }))}
              className='max-w-xs'
            />
          </div>

          {/* Content */}
          <div>
            <Label>Notice Content *</Label>
            <textarea
              className='border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:ring-primary min-h-[120px] px-3 py-2'
              rows={5}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder='Write your notice content here...'
              required
            />
          </div>

          {/* Dates */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Label>Publish Date</Label>
              <Input
                type='datetime-local'
                value={form.publishDate}
                onChange={e =>
                  setForm(f => ({ ...f, publishDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type='date'
                value={form.expiryDate}
                onChange={e =>
                  setForm(f => ({ ...f, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Recipients */}
          <div>
            <Label>Recipients *</Label>
            <div className='flex gap-4'>
              <Dropdown
                type='filter'
                placeholder='Select Recipient'
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'parent', label: 'Parent' },
                  { value: 'teacher', label: 'Teacher' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'All', label: 'All' },
                ]}
                selectedValue={form.recipient}
                onSelect={value => setForm(f => ({ ...f, recipient: value }))}
                className='max-w-xs'
              />
              <Dropdown
                type='filter'
                placeholder='Select Class'
                options={[
                  { value: '10A', label: 'Grade 10A' },
                  { value: '10B', label: 'Grade 10B' },
                  { value: '11A', label: 'Grade 11A' },
                  { value: 'All', label: 'All' },
                ]}
                selectedValue={form.grade}
                onSelect={value => setForm(f => ({ ...f, grade: value }))}
                className='max-w-xs'
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <Label>Categories</Label>
            <div className='flex flex-wrap gap-2 sm:gap-3'>
              <Dropdown
                type='filter'
                placeholder='Select Category'
                options={[
                  { value: 'Academic', label: 'Academic' },
                  { value: 'Meeting', label: 'Meeting' },
                  { value: 'Holiday', label: 'Holiday' },
                  { value: 'Event', label: 'Event' },
                ]}
                selectedValue={form.grade}
                onSelect={value => setForm(f => ({ ...f, grade: value }))}
                className='max-w-xs'
              />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <div className='flex flex-col xs:flex-row gap-2 items-stretch xs:items-center'>
              <input
                type='file'
                multiple
                className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100'
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    attachments: e.target.files
                      ? Array.from(e.target.files)
                      : [],
                  }))
                }
              />
              <Button
                type='button'
                className='bg-gray-100 text-gray-700 px-3 py-2 rounded'
                onClick={() => {
                  // Optional: open file picker programmatically
                }}
              >
                Add Files
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className='flex flex-col gap-2'>
            <Checkbox
              label='Send email notification'
              checked={form.sendEmail}
              onChange={() => setForm(f => ({ ...f, sendEmail: !f.sendEmail }))}
            />
            <Checkbox
              label='Send SMS notification'
              checked={form.sendSMS}
              onChange={() => setForm(f => ({ ...f, sendSMS: !f.sendSMS }))}
            />
          </div>

          {/* Actions */}
          <div className='flex flex-col xs:flex-row justify-end gap-2 mt-6'>
            <Button
              type='button'
              className='bg-gray-100 text-gray-700 px-4 py-2 rounded'
              onClick={handleSaveDraft}
            >
              Save as Draft
            </Button>
            <Button
              type='submit'
              className='bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2'
            >
              Publish Notice <span className='ml-1'>✈️</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
