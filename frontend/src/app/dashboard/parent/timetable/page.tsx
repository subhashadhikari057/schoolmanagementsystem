'use client';
import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { CardGridLoader } from '@/components/atoms/loading';

// Demo children data
const children = [
  { id: '1', name: 'Aarav Sharma', class: '10', section: 'A' },
  { id: '2', name: 'Priya Sharma', class: '7', section: 'B' },
];

// Demo timetable data per child
const timetableData: Record<
  string,
  Array<{ period: string; subject: string; teacher: string; time: string }>
> = {
  '1': [
    {
      period: '1',
      subject: 'Mathematics',
      teacher: 'Ram Bahadur',
      time: '08:00 - 08:45',
    },
    {
      period: '2',
      subject: 'Science',
      teacher: 'Hari Prasang',
      time: '08:45 - 09:30',
    },
    {
      period: '3',
      subject: 'English',
      teacher: 'Sita Devi',
      time: '09:30 - 10:15',
    },
    {
      period: '4',
      subject: 'Social Studies',
      teacher: 'Krishna Sharma',
      time: '10:15 - 11:00',
    },
    {
      period: '5',
      subject: 'Nepali',
      teacher: 'Maya Gurung',
      time: '11:00 - 11:45',
    },
    {
      period: '6',
      subject: 'Computer',
      teacher: 'Ramesh Shrestha',
      time: '11:45 - 12:30',
    },
    {
      period: '7',
      subject: 'Health',
      teacher: 'Sunita Karki',
      time: '12:30 - 01:15',
    },
  ],
  '2': [
    {
      period: '1',
      subject: 'English',
      teacher: 'Sita Devi',
      time: '08:00 - 08:45',
    },
    {
      period: '2',
      subject: 'Mathematics',
      teacher: 'Ram Bahadur',
      time: '08:45 - 09:30',
    },
    {
      period: '3',
      subject: 'Science',
      teacher: 'Hari Prasang',
      time: '09:30 - 10:15',
    },
    {
      period: '4',
      subject: 'Nepali',
      teacher: 'Maya Gurung',
      time: '10:15 - 11:00',
    },
    {
      period: '5',
      subject: 'Social Studies',
      teacher: 'Krishna Sharma',
      time: '11:00 - 11:45',
    },
    {
      period: '6',
      subject: 'Computer',
      teacher: 'Ramesh Shrestha',
      time: '11:45 - 12:30',
    },
    {
      period: '7',
      subject: 'Health',
      teacher: 'Sunita Karki',
      time: '12:30 - 01:15',
    },
  ],
};

export default function ParentTimetablePage() {
  const [selectedChild, setSelectedChild] = useState(children[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);
  const childOptions = children.map(child => ({
    value: child.id,
    label: `${child.name} (Class ${child.class}${child.section})`,
  }));
  const timetable = timetableData[selectedChild] || [];

  if (loading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
        <div className='max-w-8xl mx-auto'>
          <CardGridLoader
            cards={7}
            columns='grid-cols-1 sm:grid-cols-2'
            cardHeight='h-24'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
      <div className='max-w-8xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <SectionTitle
            text='Class Timetable'
            className='text-xl font-bold text-gray-900'
          />
          <Dropdown
            type='filter'
            options={childOptions}
            selectedValue={selectedChild}
            onSelect={setSelectedChild}
            className='min-w-[220px]'
            placeholder='Select Child'
          />
        </div>
        <div className='bg-white rounded-xl shadow-sm p-6'>
          <h3 className='font-semibold text-gray-800 mb-4'>Today's Periods</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            {timetable.length === 0 ? (
              <div className='text-gray-500'>No timetable found.</div>
            ) : (
              timetable.map((period, idx) => (
                <div
                  key={idx}
                  className='border border-gray-200 rounded-lg p-4 flex flex-col gap-2 bg-gray-50 hover:bg-blue-50 transition-all shadow group'
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-xs font-bold text-blue-700 bg-blue-100 rounded-full px-2 py-1'>
                      Period {period.period}
                    </span>
                    <span className='text-sm font-semibold text-gray-900 group-hover:text-blue-700'>
                      {period.subject}
                    </span>
                  </div>
                  <div className='text-xs text-gray-600'>
                    Teacher:{' '}
                    <span className='font-medium'>{period.teacher}</span>
                  </div>
                  <div className='text-xs text-gray-500'>
                    Time: {period.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
