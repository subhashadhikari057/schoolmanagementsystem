'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { Megaphone, CheckCircle2, FileText, Users } from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const mockNotices = [
  {
    id: 1,
    title: 'Mid-Term Examination Schedule',
    content:
      'The mid-term examinations will be conducted from March 15th to March 25th, 2025. Please refer to the detailed schedule attached.',
    author: 'Academic Office',
    files: 1,
    recipients: 'All Students, Parents',
    read: 2456,
    total: 2847,
    status: 'Published',
    priority: 'High',
    date: '2025-03-10',
  },
  {
    id: 2,
    title: 'School Holiday - Republic Day',
    content:
      'The school will remain closed on January 26th, 2025 in observance of Republic Day. Regular classes will resume on January 27th.',
    author: 'Principal',
    files: 0,
    recipients: 'All Students, Parents',
    read: 2801,
    total: 2847,
    status: 'Published',
    priority: 'Medium',
    date: '2025-01-20',
  },
  {
    id: 3,
    title: 'Parent-Teacher Meeting',
    content:
      'Parent-Teacher meetings are scheduled for February 10th, 2025. Please contact your class teacher to book an appointment.',
    author: 'Academic Coordinator',
    files: 1,
    recipients: 'Parents, Teachers',
    read: 0,
    total: 1456,
    status: 'Draft',
    priority: 'Medium',
    date: '2025-02-01',
  },
];

const stats = [
  {
    icon: Megaphone,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Total Notices',
    value: '156',
    change: '',
    isPositive: true,
  },
  {
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Active Notices',
    value: '23',
    change: '',
    isPositive: true,
  },
  {
    icon: FileText,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Draft Notices',
    value: '8',
    change: '',
    isPositive: true,
  },
  {
    icon: Users,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Recipients Today',
    value: '2,847',
    change: '',
    isPositive: true,
  },
];

const NoticeManagement: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Statsgrid stats={stats} />
      <GenericList
        config={getListConfig('notices')}
        data={mockNotices}
        currentPage={1}
        totalPages={1}
        totalItems={mockNotices.length}
        itemsPerPage={10}
        customActions={<ActionButtons pageType='notices' />}
      />
    </div>
  );
};

export default NoticeManagement;
