/**
 * =============================================================================
 * Staff Table Columns Configuration
 * =============================================================================
 * Column definitions for staff data tables with actions
 * =============================================================================
 */

import React from 'react';
import { TableColumn } from '@/components/templates/GenericTable';
import { UserInfoCell } from '@/components/molecules/display/UserInfoCell';
import { RoleDepartmentCell } from '@/components/molecules/display/RoleDepartmentCell';
import { ExperienceSalaryCell } from '@/components/molecules/display/ExperienceSalaryCell';
import { StatusActivityCell } from '@/components/molecules/display/StatusActivityCell';
import { ActionsCell } from '@/components/molecules/display/ActionsCell';

export interface StaffMember {
  id: string;
  [key: string]: any; // Index signature for BaseItem compatibility
  email: string;
  fullName: string;
  phone: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  designation?: string;
  department?: string;
  basicSalary: number;
  allowances: number;
  totalSalary: number;
  employmentDate?: string;
  experienceYears?: number;
  employmentStatus?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  createdById: string;
  updatedById?: string;
  deletedById?: string;
  profile?: {
    bio?: string;
    profilePhotoUrl?: string;
    contactInfo?: any;
    additionalData?: any;
  };
}

interface StaffColumnsProps {
  onView: (staff: StaffMember) => void;
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
}

export const getStaffColumns = ({
  onView,
  onEdit,
  onDelete,
}: StaffColumnsProps): TableColumn<StaffMember>[] => [
  {
    key: 'user',
    header: 'Staff Member',
    render: (record: StaffMember) => (
      <UserInfoCell
        name={record.fullName}
        id={record.id}
        avatar={record.profile?.profilePhotoUrl}
        idLabel='STF'
      />
    ),
    className: 'w-1/4',
  },
  {
    key: 'email',
    header: 'Contact Info',
    render: (record: StaffMember) => (
      <div className='space-y-1'>
        <div className='text-sm font-medium text-gray-900'>{record.email}</div>
        {record.phone && (
          <div className='text-xs text-gray-500'>{record.phone}</div>
        )}
      </div>
    ),
    className: 'w-1/6',
  },
  {
    key: 'role',
    header: 'Role & Department',
    render: (record: StaffMember) => (
      <RoleDepartmentCell
        position={record.designation || 'Staff Member'}
        department={record.department || 'General'}
      />
    ),
    className: 'w-1/5',
  },
  {
    key: 'experience',
    header: 'Experience & Salary',
    render: (record: StaffMember) => (
      <ExperienceSalaryCell
        experience={`${record.experienceYears || 0} years`}
        salary={record.basicSalary}
        joinedDate={record.employmentDate}
      />
    ),
    className: 'w-1/5',
  },
  {
    key: 'status',
    header: 'Status & Activity',
    render: (record: StaffMember) => (
      <StatusActivityCell
        status={record.employmentStatus || 'active'}
        lastActivity={record.employmentDate}
      />
    ),
    className: 'w-1/6',
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (record: StaffMember) => (
      <ActionsCell
        onView={() => onView(record)}
        onEdit={() => onEdit(record)}
        onDelete={() => onDelete(record)}
        entityType='staff'
        status={record.employmentStatus === 'active' ? 'Active' : 'Inactive'}
        viewLabel='View Staff'
        editLabel='Edit Staff'
        deleteLabel='Delete Staff'
      />
    ),
    className: 'w-1/5 text-center',
  },
];
