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

export interface IDCard extends BaseItem {
  id: number;
  cardId: string;
  holderName: string;
  holderType: 'Student' | 'Teacher' | 'Staff';
  holderInfo: string; // Grade/Department info
  generatedDate: string;
  expiryDate: string;
  printStatus: 'Printed' | 'Pending Print' | 'Generated' | 'Expired';
  template: string;
  hasPhoto: boolean;
  hasQR: boolean;
  printCount: number;
  lastPrintDate?: string;
  avatar?: string;
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
            id={item.teacherId || item.id}
            avatar={item.avatar}
            idLabel='EMP'
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
            email={item.email}
            phone={item.phone}
            address={item.address}
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
            isOnline={true} // Could be dynamic
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
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z'></path>
              </svg>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='font-medium text-gray-900 truncate'>
                {item.name}
              </div>
              <div className='text-sm text-gray-500 truncate'>
                PAR{item.parentId}
              </div>
              <div className='flex items-center gap-2 mt-1'>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.relation === 'Father'
                      ? 'bg-blue-100 text-blue-800'
                      : item.relation === 'Mother'
                        ? 'bg-pink-100 text-pink-800'
                        : item.relation === 'Guardian'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.relation}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.job === 'Software Engineer'
                      ? 'bg-blue-100 text-blue-800'
                      : item.job === 'Doctor'
                        ? 'bg-green-100 text-green-800'
                        : item.job === 'Teacher'
                          ? 'bg-purple-100 text-purple-800'
                          : item.job === 'Business Owner'
                            ? 'bg-orange-100 text-orange-800'
                            : item.job === 'Retired'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {item.job || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
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
      {
        key: 'name',
        header: 'Subject Details',
        mobileLabel: 'Subject',
        render: (item: Subject) => (
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
              </svg>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='font-medium text-gray-900 truncate'>
                {item.name}
              </div>
              <div className='text-sm text-gray-500 truncate'>{item.code}</div>
              <div className='flex items-center gap-2 mt-1'>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.faculty === 'Mathematics'
                      ? 'bg-blue-100 text-blue-800'
                      : item.faculty === 'Science'
                        ? 'bg-green-100 text-green-800'
                        : item.faculty === 'Language'
                          ? 'bg-purple-100 text-purple-800'
                          : item.faculty === 'Technology'
                            ? 'bg-orange-100 text-orange-800'
                            : item.faculty === 'Arts'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.faculty === 'Mathematics'
                    ? 'Core Subject'
                    : item.faculty === 'Science'
                      ? 'Science'
                      : item.faculty === 'Language'
                        ? 'Language'
                        : item.faculty === 'Technology'
                          ? 'Technology'
                          : item.faculty === 'Arts'
                            ? 'Arts'
                            : item.faculty}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'gradeClasses',
        header: 'Grade & Classes',
        mobileLabel: 'Classes',
      },
      { key: 'teachers', header: 'Teachers', mobileLabel: 'Teachers' },
      { key: 'scheduleInfo', header: 'Schedule Info', mobileLabel: 'Schedule' },
      { key: 'studentsCount', header: 'Students', mobileLabel: 'Students' },
      { key: 'examConfig', header: 'Exam Config', mobileLabel: 'Exam' },
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
  'id-cards': {
    title: 'ID Cards List',
    searchPlaceholder: 'Search ID Cards...',
    enableSelection: true, // Enable row selection only for ID cards
    primaryFilter: {
      title: 'All Types',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'student', label: 'Student Cards' },
        { value: 'teacher', label: 'Teacher Cards' },
        { value: 'staff', label: 'Staff Cards' },
      ],
    },
    secondaryFilter: {
      title: 'All Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'printed', label: 'Printed' },
        { value: 'pending', label: 'Pending Print' },
        { value: 'generated', label: 'Generated' },
        { value: 'expired', label: 'Expired' },
      ],
    },
    columns: [
      {
        key: 'selection',
        header: '',
        mobileLabel: '',
        render: (
          item: IDCard,
          isSelected?: boolean,
          onSelect?: (id: string | number) => void,
        ) => (
          <div className='flex items-center'>
            <input
              type='checkbox'
              checked={isSelected || false}
              onChange={() => onSelect?.(item.id)}
              className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
            />
          </div>
        ),
      },
      {
        key: 'cardDetails',
        header: 'Card Details',
        mobileLabel: 'Card',
        render: (item: IDCard) => (
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0'>
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.cardId}
                  className='w-10 h-10 rounded-full'
                />
              ) : (
                <span className='text-xs font-medium text-gray-600'>ID</span>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='font-medium text-gray-900 truncate'>
                {item.cardId}
              </div>
              <div className='text-sm text-gray-500 truncate'>
                Expires: {item.expiryDate}
              </div>
              <div className='flex items-center mt-1'>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.holderType === 'Student'
                      ? 'bg-blue-100 text-blue-800'
                      : item.holderType === 'Teacher'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {item.holderType}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'holderInfo',
        header: 'Holder Info',
        mobileLabel: 'Holder',
        render: (item: IDCard) => (
          <div className='space-y-1'>
            <p className='font-medium text-gray-900'>{item.holderName}</p>
            <p className='text-sm text-gray-500'>{item.holderInfo}</p>
          </div>
        ),
      },
      {
        key: 'generationInfo',
        header: 'Generation Info',
        mobileLabel: 'Generated',
        render: (item: IDCard) => (
          <div className='space-y-1'>
            <p className='text-sm font-medium text-gray-900'>
              Generated: {item.generatedDate}
            </p>
            <div className='flex items-center space-x-2 text-xs text-gray-500'>
              {item.hasPhoto && (
                <span className='flex items-center'>✓ Photo</span>
              )}
              {item.hasQR && <span className='flex items-center'>✓ QR</span>}
            </div>
          </div>
        ),
      },
      {
        key: 'printStatus',
        header: 'Print Status',
        mobileLabel: 'Status',
        render: (item: IDCard) => (
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.printStatus === 'Printed'
                    ? 'bg-green-100 text-green-800'
                    : item.printStatus === 'Pending Print'
                      ? 'bg-yellow-100 text-yellow-800'
                      : item.printStatus === 'Generated'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                }`}
              >
                {item.printStatus}
              </span>
            </div>
            {item.printCount > 0 && (
              <p className='text-xs text-gray-500'>
                Print count: {item.printCount}
              </p>
            )}
          </div>
        ),
      },
      { key: 'template', header: 'Template', mobileLabel: 'Template' },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: IDCard) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View ID card:', item.id);
                  break;
                case 'edit':
                  console.log('Edit ID card:', item.id);
                  break;
                case 'print':
                  console.log('Print ID card:', item.id);
                  break;
                case 'regenerate':
                  console.log('Regenerate ID card:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for ID card:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No ID cards found',
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
