'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { AlertCircle, Clock, CheckCircle2, FileText } from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const stats = [
  {
    icon: FileText,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Total Complaints',
    value: '89',
    change: '',
    isPositive: true,
  },
  {
    icon: Clock,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Pending Review',
    value: '23',
    change: '',
    isPositive: true,
  },
  {
    icon: AlertCircle,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    label: 'In Progress',
    value: '15',
    change: '',
    isPositive: true,
  },
  {
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Resolved',
    value: '51',
    change: '',
    isPositive: true,
  },
];

const mockComplaints = [
  {
    id: 1,
    title: 'Cafeteria Food Quality Issue',
    description:
      'The food served in the cafeteria has been consistently poor in quality. Students are complaining about taste and hygiene.',
    categories: ['Facilities'],
    files: 2,
    submittedBy: { name: 'Sarah Johnson', role: 'Parent' },
    assignedTo: { name: 'Michael Davis', role: 'Facilities Manager' },
    status: 'Pending',
    priority: 'High',
  },
  {
    id: 2,
    title: 'Library AC Not Working',
    description:
      'The air conditioning system in the library has been malfunctioning for the past week, making it difficult for students to study.',
    categories: ['Infrastructure'],
    files: 0,
    submittedBy: { name: 'David Wilson', role: 'Teacher' },
    assignedTo: { name: 'Robert Chen', role: 'Maintenance Staff' },
    status: 'In Progress',
    priority: 'Medium',
  },
  {
    id: 3,
    title: 'Bullying Incident Report',
    description:
      'There has been a bullying incident involving students from Grade 8. Immediate attention required.',
    categories: ['Disciplinary'],
    files: 1,
    submittedBy: { name: 'Lisa Park', role: 'Teacher' },
    assignedTo: { name: 'Maria Garcia', role: 'Counselor' },
    status: 'Resolved',
    priority: 'High',
  },
];

const ComplaintManagement: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Statsgrid stats={stats} />
      <GenericList
        config={getListConfig('complaints')}
        data={mockComplaints}
        currentPage={1}
        totalPages={1}
        totalItems={mockComplaints.length}
        itemsPerPage={10}
        customActions={<ActionButtons pageType='complaints' />}
      />
    </div>
  );
};

export default ComplaintManagement;
