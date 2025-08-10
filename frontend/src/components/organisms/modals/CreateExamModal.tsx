'use client';

import Tabs from '@/components/organisms/tabs/GenericTabs';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import Checkbox from '@/components/atoms/form-controls/Checkbox';
import { useState } from 'react';

export default function CreateExamModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tabIdx, setTabIdx] = useState(0);
  const [form, setForm] = useState({
    name: '',
    start: '',
    end: '',
    type: '',
    term: '',
    desc: '',
    classes: { 9: false, 10: false, 11: false, 12: false },
    allowCalculator: false,
    strictTiming: true,
    autoSubmit: true,
    showMarks: false,
  });
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-lg p-0'>
        <div className='flex items-center justify-between px-6 pt-6 pb-2 border-b'>
          <div className='font-semibold text-lg flex items-center gap-2'>
            🎯 Create New Examination
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-700 text-xl'
          >
            ×
          </button>
        </div>
        <Tabs
          tabs={[
            {
              name: 'Basic Info',
              content: (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='col-span-2'>
                    <label className='text-sm font-medium'>Exam Name *</label>
                    <Input
                      value={form.name}
                      onChange={e =>
                        setForm(f => ({ ...f, name: e.target.value }))
                      }
                      placeholder='e.g., Mid-term Examination 2025'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Start Date *</label>
                    <Input
                      type='date'
                      value={form.start}
                      onChange={e =>
                        setForm(f => ({ ...f, start: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>End Date *</label>
                    <Input
                      type='date'
                      value={form.end}
                      onChange={e =>
                        setForm(f => ({ ...f, end: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Exam Type *</label>
                    <Input
                      value={form.type}
                      onChange={e =>
                        setForm(f => ({ ...f, type: e.target.value }))
                      }
                      placeholder='Select exam type'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Term *</label>
                    <Input
                      value={form.term}
                      onChange={e =>
                        setForm(f => ({ ...f, term: e.target.value }))
                      }
                      placeholder='Select term'
                    />
                  </div>
                  <div className='col-span-2'>
                    <label className='text-sm font-medium'>Description</label>
                    <Input
                      value={form.desc}
                      onChange={e =>
                        setForm(f => ({ ...f, desc: e.target.value }))
                      }
                      placeholder='Enter exam description...'
                    />
                  </div>
                  <div className='col-span-2'>
                    <div className='font-medium mb-1'>Select Classes *</div>
                    <div className='grid grid-cols-2 gap-2'>
                      {Object.entries(form.classes).map(([grade, checked]) => (
                        <Checkbox
                          key={grade}
                          label={`Grade ${grade}`}
                          checked={checked}
                          onChange={() =>
                            setForm(f => ({
                              ...f,
                              classes: {
                                ...f.classes,
                                [grade]:
                                  !f.classes[
                                    grade as unknown as keyof typeof f.classes
                                  ],
                              },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              name: 'Schedule',
              content: (
                <div className='flex flex-col gap-4 items-start'>
                  <div className='font-medium'>Exam Schedule</div>
                  <ReusableButton
                    label='+ Add Subject'
                    className='bg-blue-600 text-white px-4 py-2 rounded'
                  />
                </div>
              ),
            },
            {
              name: 'Settings',
              content: (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      label='Allow Calculator'
                      checked={form.allowCalculator}
                      onChange={() =>
                        setForm(f => ({
                          ...f,
                          allowCalculator: !f.allowCalculator,
                        }))
                      }
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      label='Strict Timing'
                      checked={form.strictTiming}
                      onChange={() =>
                        setForm(f => ({ ...f, strictTiming: !f.strictTiming }))
                      }
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      label='Auto Submit'
                      checked={form.autoSubmit}
                      onChange={() =>
                        setForm(f => ({ ...f, autoSubmit: !f.autoSubmit }))
                      }
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      label='Show Marks After Exam'
                      checked={form.showMarks}
                      onChange={() =>
                        setForm(f => ({ ...f, showMarks: !f.showMarks }))
                      }
                    />
                  </div>
                </div>
              ),
            },
          ]}
          defaultIndex={tabIdx}
          className='px-6 pt-4 pb-6'
        />
        <div className='flex justify-end gap-2 px-6 pb-6'>
          <ReusableButton
            label='Cancel'
            className='bg-gray-100 text-gray-700 px-4 py-2 rounded'
            onClick={onClose}
          />
          <ReusableButton
            label='Create Exam'
            className='bg-blue-600 text-white px-4 py-2 rounded'
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
