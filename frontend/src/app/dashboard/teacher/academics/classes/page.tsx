import SectionTitle from '@/components/atoms/display/SectionTitle';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { Label } from '@headlessui/react';
import React from 'react';

export default function page() {
  const classes: {
    status: string;
    title: string;
    subtitle: string;
    tone: 'green' | 'blue' | 'gray';
  }[] = [
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'In Time',
      title: 'Class 8 - A',
      subtitle: 'Science Class',
      tone: 'blue',
    },
    {
      status: '9:10am - 10:10am',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'gray',
    },
    {
      status: 'in 10 mins',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'blue',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: 'Completed',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'green',
    },
    {
      status: '9:10am - 10:10am',
      title: 'Class 7 - B',
      subtitle: 'Science Class',
      tone: 'gray',
    },
  ];
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <SectionTitle
          text='Classes:'
          level={1}
          className='mb-4 text-xl font-semibold text-foreground'
        />
      </div>
      <Statsgrid
        variant='classes'
        items={classes}
        classesSize='lg'
        className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4'
      />
    </div>
  );
}
