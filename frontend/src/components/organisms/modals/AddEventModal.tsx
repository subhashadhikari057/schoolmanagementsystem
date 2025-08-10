// AddEventModal.tsx
// Modal for adding a new event (Academic Calendar)

import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import Icon from '@/components/atoms/display/Icon';

export default function AddEventModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    eventType: string;
    category: string;
    description: string;
    location: string;
    organizer: string;
    notify: boolean;
    registration: boolean;
    priority: string;
    reminder: string;
    audience: string[];
  }>({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    eventType: '',
    category: '',
    description: '',
    location: '',
    organizer: '',
    notify: true,
    registration: false,
    priority: 'medium',
    reminder: '1 Day Before',
    audience: [],
  });
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0'>
        <div className='flex items-center justify-between px-6 pt-6 pb-2 border-b'>
          <SectionTitle text='Add New Event' />
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl'
          >
            ×
          </button>
        </div>
        <form className='p-6 space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='col-span-2'>
              <Label>Event Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder='e.g., Annual Sports Day'
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type='date'
                value={form.startDate}
                onChange={e =>
                  setForm(f => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type='date'
                value={form.endDate}
                onChange={e =>
                  setForm(f => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type='time'
                value={form.startTime}
                onChange={e =>
                  setForm(f => ({ ...f, startTime: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type='time'
                value={form.endTime}
                onChange={e =>
                  setForm(f => ({ ...f, endTime: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Event Type</Label>
              <Input
                value={form.eventType}
                onChange={e =>
                  setForm(f => ({ ...f, eventType: e.target.value }))
                }
                placeholder='Select type'
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={e =>
                  setForm(f => ({ ...f, category: e.target.value }))
                }
                placeholder='Select category'
              />
            </div>
            <div className='col-span-2'>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={e =>
                  setForm(f => ({ ...f, description: e.target.value }))
                }
                placeholder='Event description...'
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={e =>
                  setForm(f => ({ ...f, location: e.target.value }))
                }
                placeholder='Event location'
              />
            </div>
            <div>
              <Label>Organizer</Label>
              <Input
                value={form.organizer}
                onChange={e =>
                  setForm(f => ({ ...f, organizer: e.target.value }))
                }
                placeholder='Event organizer'
              />
            </div>
          </div>
          <div>
            <Label>Target Audience</Label>
            <div className='grid grid-cols-3 gap-2'>
              <Checkbox
                label='All Students & Staff'
                checked={form.audience.includes('all')}
                onChange={() => {}}
              />
              <Checkbox
                label='All Students'
                checked={form.audience.includes('students')}
                onChange={() => {}}
              />
              <Checkbox
                label='All Teachers'
                checked={form.audience.includes('teachers')}
                onChange={() => {}}
              />
              <Checkbox
                label='All Staff'
                checked={form.audience.includes('staff')}
                onChange={() => {}}
              />
              <Checkbox
                label='Parents'
                checked={form.audience.includes('parents')}
                onChange={() => {}}
              />
              <Checkbox
                label='Grade 9 Students'
                checked={form.audience.includes('g9')}
                onChange={() => {}}
              />
              <Checkbox
                label='Grade 10 Students'
                checked={form.audience.includes('g10')}
                onChange={() => {}}
              />
              <Checkbox
                label='Grade 11 Students'
                checked={form.audience.includes('g11')}
                onChange={() => {}}
              />
              <Checkbox
                label='Grade 12 Students'
                checked={form.audience.includes('g12')}
                onChange={() => {}}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label>Priority</Label>
              <Input
                value={form.priority}
                onChange={e =>
                  setForm(f => ({ ...f, priority: e.target.value }))
                }
                placeholder='Medium Priority'
              />
            </div>
            <div>
              <Label>Reminder (Days Before)</Label>
              <Input
                value={form.reminder}
                onChange={e =>
                  setForm(f => ({ ...f, reminder: e.target.value }))
                }
                placeholder='1 Day Before'
              />
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Checkbox
              label='Notify Participants'
              checked={form.notify}
              onChange={() => setForm(f => ({ ...f, notify: !f.notify }))}
            />
            <Checkbox
              label='Registration Required'
              checked={form.registration}
              onChange={() =>
                setForm(f => ({ ...f, registration: !f.registration }))
              }
            />
          </div>
          <div className='mt-4'>
            <Label>Event Summary</Label>
            <div className='flex flex-col gap-1 text-xs text-gray-500'>
              <div>Duration: Not set</div>
              <div>
                Time: {form.startTime || '09:00'} - {form.endTime || '17:00'}
              </div>
              <div>Audience: {form.audience.length} groups selected</div>
              <div>
                Priority: <span className='capitalize'>{form.priority}</span>
              </div>
            </div>
          </div>
          <div className='flex justify-end gap-2 mt-6'>
            <Button className='bg-gray-100 text-gray-700 px-4 py-2 rounded'>
              Cancel
            </Button>
            <Button className='bg-blue-600 text-white px-4 py-2 rounded'>
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
