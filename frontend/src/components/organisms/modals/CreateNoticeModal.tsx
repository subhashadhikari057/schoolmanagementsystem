// CreateNoticeModal.tsx
// Modal for creating a new notice (Notice Management)

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Checkbox from '@/components/atoms/form-controls/Checkbox';

export default function CreateNoticeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    priority: '',
    content: '',
    publishDate: '',
    expiryDate: '',
    recipients: [] as string[],
    categories: [] as string[],
    attachments: [] as File[],
    sendEmail: false,
    sendSMS: false,
  });
  if (!open) return null;
  const priorities = ['High', 'Medium', 'Low'];
  const recipientOptions = [
    { label: 'All Students', value: 'students' },
    { label: 'All Parents', value: 'parents' },
    { label: 'All Teachers', value: 'teachers' },
    { label: 'All Staff', value: 'staff' },
    { label: 'Grade 9', value: 'g9' },
    { label: 'Grade 10', value: 'g10' },
    { label: 'Grade 11', value: 'g11' },
    { label: 'Grade 12', value: 'g12' },
  ];
  const categoryOptions = [
    'Academic',
    'Administrative',
    'Event',
    'Holiday',
    'Examination',
    'Fee',
    'General',
  ];
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0'>
        <div className='flex items-center justify-between px-6 pt-6 pb-2 border-b'>
          <SectionTitle text='Create New Notice' />
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl'
          >
            ×
          </button>
        </div>
        <form className='p-6 space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>Notice Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder='Enter notice title'
              />
            </div>
            <div>
              <Label>Priority *</Label>
              <select
                className='border border-gray-300 rounded-md w-full h-10 px-2 focus:outline-none focus:ring focus:ring-primary bg-gray-50'
                value={form.priority}
                onChange={e =>
                  setForm(f => ({ ...f, priority: e.target.value }))
                }
              >
                <option value='' disabled>
                  Select priority
                </option>
                {priorities.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Notice Content *</Label>
            <textarea
              className='border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:ring-primary min-h-[80px]'
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder='Write your notice content here...'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
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
          <div>
            <Label>Recipients *</Label>
            <div className='grid grid-cols-3 gap-2'>
              {recipientOptions.map(opt => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
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
          </div>
          <div>
            <Label>Categories</Label>
            <div className='flex flex-wrap gap-3'>
              {categoryOptions.map(cat => (
                <Checkbox
                  key={cat}
                  label={cat}
                  checked={form.categories.includes(cat)}
                  onChange={() =>
                    setForm(f => ({
                      ...f,
                      categories: f.categories.includes(cat)
                        ? f.categories.filter(c => c !== cat)
                        : [...f.categories, cat],
                    }))
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Attachments</Label>
            <div className='flex gap-2 items-center'>
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
              <Button className='bg-gray-100 text-gray-700 px-3 py-2 rounded'>
                Add Files
              </Button>
            </div>
          </div>
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
          <div className='flex justify-end gap-2 mt-6'>
            <Button className='bg-gray-100 text-gray-700 px-4 py-2 rounded'>
              Save as Draft
            </Button>
            <Button
              className='bg-gray-100 text-gray-700 px-4 py-2 rounded'
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button className='bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2'>
              Publish Notice
              <span className='ml-1'>✈️</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
