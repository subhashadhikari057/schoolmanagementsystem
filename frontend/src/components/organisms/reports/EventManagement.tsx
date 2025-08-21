'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { CalendarDays, CheckCircle2, FileText, Users } from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const mockEvents = [
  {
    id: 1,
    title: 'Annual Sports Day',
    content:
      'Join us for the Annual Sports Day on March 30th, 2025. All students are encouraged to participate. Detailed schedule will be shared soon.',
    organizer: 'Sports Department',
    files: 2,
    participants: 'All Students',
    attended: 1200,
    total: 2847,
    status: 'Scheduled',
    priority: 'High',
    date: '2025-03-15',
  },
  {
    id: 2,
    title: 'Science Exhibition',
    content:
      'The Science Exhibition will be held on April 10th, 2025. Students can register their projects by March 25th.',
    organizer: 'Science Club',
    files: 1,
    participants: 'Grades 9-12',
    attended: 400,
    total: 1200,
    status: 'Scheduled',
    priority: 'Medium',
    date: '2025-04-01',
  },
  {
    id: 3,
    title: 'Art & Culture Fest',
    content:
      'Art & Culture Fest is scheduled for May 5th, 2025. All students are invited to showcase their talents.',
    organizer: 'Cultural Committee',
    files: 3,
    participants: 'All Students',
    attended: 0,
    total: 2847,
    status: 'Draft',
    priority: 'Low',
    date: '2025-04-20',
  },
];

const stats = [
  {
    icon: CalendarDays,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Total Events',
    value: '45',
    change: '',
    isPositive: true,
  },
  {
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Active Events',
    value: '12',
    change: '',
    isPositive: true,
  },
  {
    icon: FileText,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Draft Events',
    value: '5',
    change: '',
    isPositive: true,
  },
  {
    icon: Users,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Participants Today',
    value: '2,847',
    change: '',
    isPositive: true,
  },
];

const EventManagement: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Statsgrid stats={stats} />
      <GenericList
        config={getListConfig('events')}
        data={mockEvents}
        currentPage={1}
        totalPages={1}
        totalItems={mockEvents.length}
        itemsPerPage={10}
        customActions={<ActionButtons pageType='reports' />}
      />
    </div>
  );
};

export default EventManagement;
