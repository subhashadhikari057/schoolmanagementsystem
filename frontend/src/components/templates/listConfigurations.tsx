import React from 'react';
import { ListConfiguration, BaseItem } from './GenericList';
import UserInfoCell from '@/components/molecules/display/UserInfoCell';
import ContactCell from '@/components/molecules/display/ContactCell';
import RoleDepartmentCell from '@/components/molecules/display/RoleDepartmentCell';
import StatusActivityCell from '@/components/molecules/display/StatusActivityCell';
import ActionsCell from '@/components/molecules/display/ActionsCell';
import ChildrenCell from '@/components/molecules/display/ChildrenCell';
import ParentInfoCell from '@/components/molecules/display/ParentInfoCell';
import SubjectsClassesCell from '@/components/molecules/display/SubjectsClassesCell';
import ExperienceSalaryCell from '@/components/molecules/display/ExperienceSalaryCell';
import ClassSectionCell from '@/components/molecules/display/ClassSectionCell';
import AttendanceCell from '@/components/molecules/display/AttendanceCell';
import QualificationCell from '@/components/molecules/display/QualificationCell';
import PersonalInfoCell from '@/components/molecules/display/PersonalInfoCell';

// Define all data interfaces
export interface Student extends BaseItem {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  parent: string;
  status: 'Active' | 'Suspended' | 'Warning';
  avatar?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  grade?: string;
  section?: string;

  attendance?: {
    percentage: number;
    present: number;
    total: number;
  };
}

export interface Teacher extends BaseItem {
  id: number;
  name: string;
  faculty: string;
  subjects: string[];
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar?: string;
  teacherId?: string;
  email?: string;
  phone?: string;
  address?: string;
  designation?: string; // Senior Teacher, Assistant Teacher, etc.
  department?: string;
  experience?: string; // "5 years", "15 years", etc.
  joinedDate?: string;
  salary?: number;
  classTeacher?: string; // "Grade 10A", "Grade 9B", etc.
  subjects_detailed?: Array<{
    name: string;
    grade: string;
  }>;

  // Extended fields from backend
  qualification?: string;
  specialization?: string;
  employmentStatus?: string;
  employmentDate?: string;
  experienceYears?: number;

  // Personal Information
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;

  // Salary Information
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;

  // Class Teacher Status
  isClassTeacher?: boolean;

  // Additional Information
  languagesKnown?: string[];
  certifications?: string;
  previousExperience?: string;

  // Profile Information
  bio?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };

  // System fields
  isActive?: boolean;
  lastLoginAt?: string;

  // Subject assignments
  subjectAssignments?: Array<{
    id: string;
    name: string;
    code: string;
  }>;

  // Class assignments (if class teacher)
  classAssignments?: Array<{
    id: string;
    className: string;
    sectionName: string;
  }>;
}

export interface Parent extends BaseItem {
  id: number;
  name: string;
  linkedStudents: string[];
  contact: string;
  accountStatus: 'Active' | 'Inactive' | 'Pending';
  avatar?: string;
  parentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  lastActivity?: string;
  preferredContact?: 'Email' | 'SMS';
  relation?: string; // Father, Mother, Guardian, etc.
  job?: string; // Software Engineer, Doctor, etc.
  children?: Array<{
    name: string;
    grade: string;
    studentId: string;
  }>;
}

export interface Staff extends BaseItem {
  id: number;
  name: string;
  department: string;
  position: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar?: string;
  staffId?: string;
  email?: string;
  phone?: string;
  salary?: number;
  lastActivity?: string;
  isOnline?: boolean;
}

export interface Subject extends BaseItem {
  id: number;
  name: string;
  code: string;
  faculty: string;
  credits: number;
  status: 'Active' | 'Inactive';
  gradeClasses: string[];
  teachers: string[];
  scheduleInfo: string;
  studentsCount: number;
  examConfig: string;
}

// All list configurations in one place
export const LIST_CONFIGS: Record<string, ListConfiguration<any>> = {
  students: {
    title: 'Students List',
    searchPlaceholder: 'Search Students...',
    primaryFilter: {
      title: 'All Faculty',
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' },
      ],
    },
    secondaryFilter: {
      title: 'All Grades',
      options: [
        { value: 'all', label: 'All Grades' },
        { value: 'class-5-a', label: 'Class 5-A' },
        { value: 'class-4-b', label: 'Class 4-B' },
        { value: 'class-3-c', label: 'Class 3-C' },
        { value: 'class-4-a', label: 'Class 4-A' },
      ],
    },
    columns: [
      {
        key: 'name',
        header: 'Student Details',
        mobileLabel: 'Student',
        render: (item: Student) => (
          <UserInfoCell
            name={item.name}
            id={item.studentId || item.rollNo}
            avatar={item.avatar}
            idLabel=''
          />
        ),
      },
      {
        key: 'class',
        header: 'Class & Section',
        mobileLabel: 'Class',
        render: (item: Student) => (
          <ClassSectionCell
            grade={item.grade}
            section={item.section}
            class={item.class}
          />
        ),
      },
      {
        key: 'contact',
        header: 'Contact Information',
        mobileLabel: 'Contact',
        render: (item: Student) => (
          <ContactCell
            email={item.email}
            phone={item.phone}
            address={item.address}
          />
        ),
      },
      {
        key: 'attendance',
        header: 'Attendance',
        mobileLabel: 'Attendance',
        render: (item: Student) => (
          <AttendanceCell attendance={item.attendance} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        mobileLabel: 'Status',
        render: (item: Student) => (
          <StatusActivityCell status={item.status} isOnline={true} />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Student) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View student:', item.id);
                  break;
                case 'edit':
                  console.log('Edit student:', item.id);
                  break;
                case 'schedule':
                  console.log('Schedule meeting for student:', item.id);
                  break;
                case 'link':
                  console.log('Share student link:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for student:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No students found',
  },

  teachers: {
    title: 'Teachers List',
    searchPlaceholder: 'Search Teachers...',
    primaryFilter: {
      title: 'All Faculty',
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' },
        { value: 'mathematics', label: 'Mathematics' },
      ],
    },
    secondaryFilter: {
      title: 'All Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'on-leave', label: 'On Leave' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    columns: [
      {
        key: 'name',
        header: 'Teacher Details',
        mobileLabel: 'Teacher',
        render: (item: Teacher) => (
          <UserInfoCell
            name={item.name}
            id={item.designation || 'Teacher'}
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
        header: 'Qualification & Specialization',
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
        key: 'personal',
        header: 'Personal Information',
        mobileLabel: 'Personal',
        render: (item: Teacher) => (
          <PersonalInfoCell
            dateOfBirth={item.dateOfBirth}
            gender={item.gender}
            bloodGroup={item.bloodGroup}
            languagesKnown={item.languagesKnown}
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
        header: 'Status & Activity',
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
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View teacher:', item.id);
                  break;
                case 'edit':
                  console.log('Edit teacher:', item.id);
                  break;
                case 'schedule':
                  console.log('Schedule meeting with teacher:', item.id);
                  break;
                case 'link':
                  console.log('Share teacher link:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for teacher:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No teachers found',
  },

  parents: {
    title: 'Parents List',
    searchPlaceholder: 'Search Parents...',
    primaryFilter: {
      title: 'All Faculty',
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' },
      ],
    },
    secondaryFilter: {
      title: 'All Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    columns: [
      {
        key: 'name',
        header: 'Parent Details',
        mobileLabel: 'Parent',
        render: (item: Parent) => (
          <ParentInfoCell
            name={item.name}
            relation={item.relation}
            job={item.job}
            avatar={item.avatar}
          />
        ),
      },
      {
        key: 'contact',
        header: 'Contact Information',
        mobileLabel: 'Contact',
        render: (item: Parent) => (
          <ContactCell
            email={item.email}
            phone={item.phone}
            address={item.address}
          />
        ),
      },
      {
        key: 'children',
        header: 'Children',
        mobileLabel: 'Children',
        render: (item: Parent) => (
          <ChildrenCell
            children={item.children}
            linkedStudents={item.linkedStudents}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        mobileLabel: 'Status',
        render: (item: Parent) => (
          <div className='flex items-center gap-2'>
            <StatusActivityCell
              status={item.accountStatus}
              isOnline={true} // Could be dynamic based on last activity
            />
            {item.preferredContact && (
              <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                {item.preferredContact}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'lastActivity',
        header: 'Last Activity',
        mobileLabel: 'Last Active',
        render: (item: Parent) => (
          <div className='text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-400'>🕒</span>
              <span>{item.lastActivity || 'Never'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Parent) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View parent:', item.id);
                  break;
                case 'edit':
                  console.log('Edit parent:', item.id);
                  break;
                case 'schedule':
                  console.log('Schedule meeting with parent:', item.id);
                  break;
                case 'link':
                  console.log('Share link with parent:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for parent:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No parents found',
  },

  staff: {
    title: 'Staff List',
    searchPlaceholder: 'Search Staff...',
    primaryFilter: {
      title: 'All Departments',
      options: [
        { value: 'all', label: 'All Departments' },
        { value: 'administration', label: 'Administration' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'library', label: 'Library' },
        { value: 'canteen', label: 'Canteen' },
      ],
    },
    secondaryFilter: {
      title: 'All Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'on-leave', label: 'On Leave' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    columns: [
      {
        key: 'name',
        header: 'Staff Details',
        mobileLabel: 'Staff',
        render: (item: Staff) => (
          <UserInfoCell
            name={item.name}
            id={item.staffId || item.id}
            avatar={item.avatar}
            idLabel='STF'
          />
        ),
      },
      {
        key: 'role',
        header: 'Role & Department',
        mobileLabel: 'Role',
        render: (item: Staff) => (
          <RoleDepartmentCell
            position={item.position}
            department={item.department}
          />
        ),
      },
      {
        key: 'contact',
        header: 'Contact',
        mobileLabel: 'Contact',
        render: (item: Staff) => (
          <ContactCell email={item.email} phone={item.phone} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        mobileLabel: 'Status',
        render: (item: Staff) => (
          <StatusActivityCell status={item.status} isOnline={item.isOnline} />
        ),
      },
      {
        key: 'lastActivity',
        header: 'Last Activity',
        mobileLabel: 'Last Active',
        render: (item: Staff) => (
          <div className='text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-400'>🕒</span>
              <span>{item.lastActivity || 'Never'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'salary',
        header: 'Salary',
        mobileLabel: 'Salary',
        render: (item: Staff) => (
          <div className='text-sm font-medium text-gray-900'>
            <span className='text-green-600'>$</span>
            {item.salary ? item.salary.toLocaleString() : 'N/A'}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Staff) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View staff:', item.id);
                  break;
                case 'edit':
                  console.log('Edit staff:', item.id);
                  break;
                case 'schedule':
                  console.log('Schedule meeting with staff:', item.id);
                  break;
                case 'link':
                  console.log('Share staff link:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for staff:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No staff found',
  },

  subjects: {
    title: 'Subjects List',
    searchPlaceholder: 'Search Subjects...',
    primaryFilter: {
      title: 'All Faculty',
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'social-studies', label: 'Social Studies' },
      ],
    },
    secondaryFilter: {
      title: 'All Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    columns: [
      { key: 'name', header: 'Subject Details', mobileLabel: 'Subject' },
      {
        key: 'gradeClasses',
        header: 'Grade & Classes',
        mobileLabel: 'Classes',
      },
      { key: 'teachers', header: 'Teachers', mobileLabel: 'Teachers' },
      { key: 'scheduleInfo', header: 'Schedule Info', mobileLabel: 'Schedule' },
      { key: 'studentsCount', header: 'Students', mobileLabel: 'Students' },
      { key: 'examConfig', header: 'Exam Config', mobileLabel: 'Exam' },
      { key: 'status', header: 'Status', mobileLabel: 'Status' },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Subject) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View subject:', item.id);
                  break;
                case 'edit':
                  console.log('Edit subject:', item.id);
                  break;
                case 'schedule':
                  console.log('Schedule class for subject:', item.id);
                  break;
                case 'link':
                  console.log('Share subject link:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for subject:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No subjects found',
  },
};

// Helper function to get configuration by type
export const getListConfig = (type: string): ListConfiguration<any> => {
  const config = LIST_CONFIGS[type];
  if (!config) {
    throw new Error(`Configuration for list type "${type}" not found`);
  }
  return config;
};
