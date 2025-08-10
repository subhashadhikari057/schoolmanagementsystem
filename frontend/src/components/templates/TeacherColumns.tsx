import React from 'react';
import { TableColumn } from './GenericList';
import { Teacher } from './listConfigurations';
import UserInfoCell from '@/components/molecules/display/UserInfoCell';
import RoleDepartmentCell from '@/components/molecules/display/RoleDepartmentCell';
import SubjectsClassesCell from '@/components/molecules/display/SubjectsClassesCell';
import ContactCell from '@/components/molecules/display/ContactCell';
import QualificationCell from '@/components/molecules/display/QualificationCell';
import ExperienceSalaryCell from '@/components/molecules/display/ExperienceSalaryCell';
import StatusActivityCell from '@/components/molecules/display/StatusActivityCell';
import ActionsCell from '@/components/molecules/display/ActionsCell';

/**
 * Get teacher columns for the table
 * @param onAction Callback for action buttons
 * @returns Array of table columns
 */
export const getTeacherColumns = (
  onAction?: (action: string, teacher: Teacher) => void,
): TableColumn<Teacher>[] => [
  {
    key: 'name',
    header: 'Teacher Details',
    mobileLabel: 'Teacher',
    render: (item: Teacher) => (
      <UserInfoCell
        name={item.name}
        id={item.employeeId || 'N/A'}
        avatar={item.avatar}
        idLabel=''
      />
    ),
  },
  {
    key: 'designation',
    header: 'Designation & Department',
    mobileLabel: 'Designation',
    render: (item: Teacher) => (
      <RoleDepartmentCell
        position={item.designation || 'Teacher'}
        department={item.department || item.faculty}
      />
    ),
  },
  {
    key: 'subjects',
    header: 'Subjects & Classes',
    mobileLabel: 'Subjects',
    render: (item: Teacher) => (
      <SubjectsClassesCell
        subjects={item.subjects}
        subjects_detailed={item.subjects_detailed}
        classTeacher={item.classTeacher}
      />
    ),
  },
  {
    key: 'contact',
    header: 'Contact Information',
    mobileLabel: 'Contact',
    render: (item: Teacher) => (
      <ContactCell
        email={item.contactInfo?.email || item.email}
        phone={item.contactInfo?.phone || item.phone}
        address={item.contactInfo?.address || item.address}
      />
    ),
  },
  {
    key: 'qualification',
    header: 'Qualification & Experience',
    mobileLabel: 'Qualification',
    render: (item: Teacher) => (
      <QualificationCell
        qualification={item.qualification}
        specialization={item.specialization}
        experienceYears={item.experienceYears}
      />
    ),
  },
  {
    key: 'experience',
    header: 'Experience & Salary',
    mobileLabel: 'Experience',
    render: (item: Teacher) => (
      <ExperienceSalaryCell
        experience={item.experience}
        joinedDate={item.joinedDate}
        salary={item.salary}
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    mobileLabel: 'Status',
    render: (item: Teacher) => (
      <StatusActivityCell
        status={item.status}
        isOnline={item.isActive}
        lastActivity={item.lastLoginAt}
      />
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    mobileLabel: 'Actions',
    render: (item: Teacher) => (
      <ActionsCell
        entityType='teacher'
        status={item.status}
        onAction={(action: string) => {
          if (onAction) {
            onAction(action, item);
          } else {
            console.log('Action:', action, 'for teacher:', item.id);
          }
        }}
      />
    ),
  },
];
