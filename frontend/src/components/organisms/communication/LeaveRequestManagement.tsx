'use client';

import React from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

const stats = [
  {
    icon: FileText,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Total Requests',
    value: '145',
    change: '',
    isPositive: true,
  },
  {
    icon: Clock,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Pending Approval',
    value: '28',
    change: '',
    isPositive: true,
  },
  {
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Approved',
    value: '89',
    change: '',
    isPositive: true,
  },
  {
    icon: XCircle,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Rejected',
    value: '28',
    change: '',
    isPositive: false,
  },
];

const mockLeaveRequests = [
  {
    id: 1,
    applicant: { name: 'Emily Johnson', role: 'Student', extra: 'Grade 10A' },
    leaveType: 'Sick Leave',
    leaveTypeColor: 'bg-red-100 text-red-700',
    appliedDate: '2025-01-28',
    files: 1,
    startDate: '2025-02-05',
    endDate: '2025-02-07',
    duration: '3 days',
    reason: 'Fever and flu symptoms. Doc',
    status: 'Pending',
    statusBy: '',
    actions: {},
  },
  {
    id: 2,
    applicant: {
      name: 'Dr. Sarah Mitchell',
      role: 'Teacher',
      extra: 'Mathematics Dept',
    },
    leaveType: 'Personal Leave',
    leaveTypeColor: 'bg-blue-100 text-blue-700',
    appliedDate: '2025-01-25',
    files: 1,
    startDate: '2025-02-10',
    endDate: '2025-02-12',
    duration: '3 days',
    reason: 'Family wedding ceremony to',
    status: 'Approved',
    statusBy: 'John Wilson',
    actions: {},
  },
  {
    id: 3,
    applicant: { name: 'James Smith', role: 'Student', extra: 'Grade 11B' },
    leaveType: 'Family Emergency',
    leaveTypeColor: 'bg-yellow-100 text-yellow-800',
    appliedDate: '2025-01-20',
    files: 0,
    startDate: '2025-01-30',
    endDate: '2025-02-01',
    duration: '3 days',
    reason: "Grandfather's surgery, need t",
    status: 'Approved',
    statusBy: 'Maria Garcia',
    actions: {},
  },
  {
    id: 4,
    applicant: {
      name: 'Michael Davis',
      role: 'Staff',
      extra: 'Administration',
    },
    leaveType: 'Annual Leave',
    leaveTypeColor: 'bg-green-100 text-green-700',
    appliedDate: '2025-01-20',
    files: 0,
    startDate: '2025-03-15',
    endDate: '2025-03-20',
    duration: '6 days',
    reason: 'Planned vacation with family.',
    status: 'Rejected',
    statusBy: 'John Wilson',
    actions: {},
  },
];

const LeaveRequestManagement: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Statsgrid stats={stats} />
      <GenericList
        config={getListConfig('leave-requests')}
        data={mockLeaveRequests}
        currentPage={1}
        totalPages={1}
        totalItems={mockLeaveRequests.length}
        itemsPerPage={10}
        customActions={<ActionButtons pageType='leave-requests' />}
      />
    </div>
  );
};

export default LeaveRequestManagement;
