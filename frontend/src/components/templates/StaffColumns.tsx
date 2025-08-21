import React from 'react';
import { TableColumn } from './GenericList';
import { Staff } from './listConfigurations';
import UserInfoCell from '@/components/molecules/display/UserInfoCell';
import RoleDepartmentCell from '@/components/molecules/display/RoleDepartmentCell';
import ContactCell from '@/components/molecules/display/ContactCell';
import QualificationCell from '@/components/molecules/display/QualificationCell';
import ExperienceSalaryCell from '@/components/molecules/display/ExperienceSalaryCell';
import StatusActivityCell from '@/components/molecules/display/StatusActivityCell';
import ActionsCell from '@/components/molecules/display/ActionsCell';

// Action handler type
type ActionHandler = (action: string, staff: Staff) => void;

/**
 * Get staff columns for the table
 * @param onAction Callback for action buttons
 * @returns Array of table columns
 */
export const getStaffColumns = (
  onAction?: (action: string, staff: Staff) => void,
): TableColumn<Staff>[] => [
  {
    key: 'name',
    header: 'Staff Details',
    mobileLabel: 'Staff',
    render: (item: Staff) => (
      <UserInfoCell
        name={item.name}
        id={(item.employeeId as string) || 'N/A'}
        avatar={item.avatar}
        idLabel='ID:'
      />
    ),
  },
  {
    key: 'designation',
    header: 'Designation & Department',
    mobileLabel: 'Designation',
    render: (item: Staff) => (
      <RoleDepartmentCell
        position={(item.designation as string) || 'Staff'}
        department={(item.department as string) || 'General'}
      />
    ),
  },
  {
    key: 'contact',
    header: 'Contact Information',
    mobileLabel: 'Contact',
    render: (item: Staff) => (
      <ContactCell
        email={(item.contactInfo as any)?.email || (item as any).email}
        phone={(item.contactInfo as any)?.phone || (item as any).phone}
        address={(item.contactInfo as any)?.address || (item as any).address}
      />
    ),
  },
  {
    key: 'qualification',
    header: 'Qualification & Experience',
    mobileLabel: 'Qualification',
    render: (item: Staff) => (
      <QualificationCell
        qualification={item.qualification as string}
        specialization={undefined}
        experienceYears={item.experienceYears as number}
      />
    ),
  },
  {
    key: 'experience',
    header: 'Experience & Salary',
    mobileLabel: 'Experience',
    render: (item: Staff) => (
      <ExperienceSalaryCell
        experience={
          item.experienceYears ? `${item.experienceYears} years` : 'N/A'
        }
        joinedDate={item.joinedDate as string}
        salary={item.totalSalary as number}
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    mobileLabel: 'Status',
    render: (item: Staff) => (
      <StatusActivityCell
        status={item.status}
        isOnline={item.isActive as boolean}
        lastActivity={item.lastLoginAt as string}
      />
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    mobileLabel: 'Actions',
    render: (item: Staff) => (
      <ActionsCell
        entityType='staff'
        status={item.status}
        onAction={(action: string) => {
          if (onAction) {
            onAction(action, item);
          } else {
            console.log('Action:', action, 'for staff:', item.id);
          }
        }}
      />
    ),
  },
];

export default getStaffColumns;
