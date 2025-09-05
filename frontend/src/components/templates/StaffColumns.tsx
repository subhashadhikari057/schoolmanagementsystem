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
        name={item.fullName || item.name}
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
      <div className='text-sm'>
        <div className='font-medium'>
          {(item.designation as string) || (item.position as string) || 'Staff'}
        </div>
        <div className='text-gray-500'>
          {(item.department as string) || 'General'}
        </div>
      </div>
    ),
  },
  {
    key: 'contact',
    header: 'Contact Information',
    mobileLabel: 'Contact',
    render: (item: Staff) => (
      <div className='text-sm'>
        <div className='font-medium'>
          {item.contactInfo?.email || item.email || 'N/A'}
        </div>
        <div className='text-gray-500'>
          {item.contactInfo?.phone || item.phone || 'N/A'}
        </div>
      </div>
    ),
  },
  {
    key: 'qualification',
    header: 'Qualification',
    mobileLabel: 'Qualification',
    render: (item: Staff) => (
      <div className='text-sm'>
        <div className='font-medium'>{item.qualification || 'N/A'}</div>
      </div>
    ),
  },
  {
    key: 'experience',
    header: 'Experience & Salary',
    mobileLabel: 'Experience',
    render: (item: Staff) => (
      <div className='text-sm'>
        <div className='font-medium'>
          ₹{item.totalSalary || item.basicSalary || item.salary || 0}
        </div>
        <div className='text-gray-500'>
          {item.experienceYears ? `${item.experienceYears} years` : 'N/A'}
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    mobileLabel: 'Status',
    render: (item: Staff) => {
      const displayStatus = item.employmentStatus || item.status || 'active';
      let statusColor = 'text-red-600 bg-red-100'; // default

      // Handle different status variations using string includes for flexibility
      const statusLower = displayStatus
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '_');

      if (statusLower === 'active') {
        statusColor = 'text-green-600 bg-green-100';
      } else if (statusLower === 'on_leave' || displayStatus === 'On Leave') {
        statusColor = 'text-yellow-600 bg-yellow-100';
      } else if (statusLower === 'inactive') {
        statusColor = 'text-gray-600 bg-gray-100';
      } else if (statusLower === 'suspended') {
        statusColor = 'text-orange-600 bg-orange-100';
      } else if (statusLower === 'terminated') {
        statusColor = 'text-red-600 bg-red-100';
      }

      return (
        <div className='text-sm'>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {displayStatus.toString().charAt(0).toUpperCase() +
              displayStatus.toString().slice(1).replace('_', ' ')}
          </span>
        </div>
      );
    },
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
