'use client';
// Complaint Management Table Config
export const complaintsConfig = {
  title: 'Complaint Management',
  searchPlaceholder: 'Search complaints by title, category, or submitter...',
  primaryFilter: {
    title: 'All Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'Pending', label: 'Pending' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Resolved', label: 'Resolved' },
    ],
  },
  secondaryFilter: {
    title: 'Priority',
    options: [
      { value: 'all', label: 'All' },
      { value: 'High', label: 'High' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Low', label: 'Low' },
    ],
  },
  columns: [
    {
      key: 'title',
      header: 'Complaint Details',
      render: (row: any) => (
        <div>
          <div className='font-medium text-gray-900'>{row.title}</div>
          <div className='text-gray-600 text-sm'>{row.description}</div>
          <div className='flex flex-wrap gap-2 mt-1'>
            {row.categories?.map((cat: string) => (
              <span
                key={cat}
                className='bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs'
              >
                {cat}
              </span>
            ))}
            {row.files > 0 && (
              <span className='bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1'>
                <span className='icon-[lucide--paperclip]' /> {row.files} files
              </span>
            )}
          </div>
        </div>
      ),
      minWidth: 300,
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      render: (row: any) => (
        <div>
          <div className='font-medium text-gray-900'>
            {row.submittedBy?.name}
          </div>
          <div className='text-gray-500 text-xs'>{row.submittedBy?.role}</div>
        </div>
      ),
      minWidth: 120,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (row: any) => (
        <div>
          <div className='font-medium text-gray-900'>
            {row.assignedTo?.name}
          </div>
          <div className='text-gray-500 text-xs'>{row.assignedTo?.role}</div>
        </div>
      ),
      minWidth: 120,
    },
    {
      key: 'status',
      header: 'Status & Priority',
      render: (row: any) => (
        <div className='flex flex-col gap-1'>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              row.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : row.status === 'In Progress'
                  ? 'bg-orange-100 text-orange-800'
                  : row.status === 'Resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            {row.status}
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              row.priority === 'High'
                ? 'bg-red-100 text-red-700'
                : row.priority === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {row.priority}
          </span>
        </div>
      ),
      minWidth: 120,
    },
  ],
  filters: [
    {
      key: 'search',
      type: 'search',
      placeholder: 'Search complaints by title, category, or submitter...',
    },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Status',
      options: [
        { label: 'All Status', value: '' },
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Resolved', value: 'Resolved' },
      ],
    },
    {
      key: 'priority',
      type: 'select',
      placeholder: 'Priority',
      options: [
        { label: 'All', value: '' },
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' },
      ],
    },
    {
      key: 'advanced',
      type: 'advanced',
      label: 'Advanced Filters',
    },
  ],
};
// ...existing code...
import React from 'react';
import { ListConfiguration, BaseItem } from './GenericList';
import UserInfoCell from '@/components/molecules/display/UserInfoCell';
import StatusBadge from '@/components/atoms/data/StatusBadge';
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
  id: string;
  name: string;
  rollNo: string;
  class: string | object;
  parent: string;
  status: 'Active' | 'Suspended' | 'Warning' | 'Graduated' | 'Transferred';
  avatar?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  address?: string;
  grade?: string;
  section?: string;

  attendance?: {
    present: number;
    total: number;
  };
}

export interface Teacher extends BaseItem {
  id: number | string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  faculty: string;
  subjects: string[];
  status: 'Active' | 'On Leave' | 'Inactive' | 'Suspended' | 'Transferred';
  avatar?: string;
  teacherId?: string;
  email?: string;
  phone?: string;
  address?: string;
  designation?: string; // Senior Teacher, Assistant Teacher, etc.
  department?: string;
  employeeId?: string; // Employee ID (T-2023-0001, etc.)
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
  maritalStatus?: string;
  street?: string;
  city?: string;
  state?: string;
  province?: string;
  pinCode?: string;

  // Salary Information
  basicSalary?: number;
  allowances?: number;
  totalSalary?: number;

  // Bank and Legal Information
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  panNumber?: string;
  citizenshipNumber?: string;

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
  id: string;
  userId: string;
  name: string; // This will be fullName from backend
  fullName: string;
  email: string;
  phone: string;
  accountStatus: 'Active' | 'Inactive' | 'Pending';
  avatar?: string;
  parentId?: string;
  address?: string;
  lastActivity?: string;
  preferredContact?: 'Email' | 'SMS';
  relation?: string; // Father, Mother, Guardian, etc.
  job?: string; // This will be occupation from profile
  occupation?: string;
  workPlace?: string;
  workPhone?: string;
  profile?: {
    dateOfBirth?: string;
    gender?: string;
    occupation?: string;
    workPlace?: string;
    workPhone?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pinCode?: string;
      country?: string;
    };
    notes?: string;
    specialInstructions?: string;
  };
  children?: Array<{
    id: string;
    fullName: string;
    name: string; // For compatibility
    grade: string;
    classId?: string;
    studentId: string;
    rollNumber?: string;
    relationship: string;
  }>;
  linkedStudents: string[]; // For compatibility - derived from children
  contact: string; // For compatibility - will be phone
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
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
  examConfig: string;
}

export interface Class extends BaseItem {
  id: number;
  name: string;
  section: string;
  room: string;
  subjectsCount: number;
  classTeacher: string;
  teacherAvatar?: string;
  lastUpdated: string;
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
  complaints: complaintsConfig,
  'fee-management': {
    title: 'Fee Management',
    searchPlaceholder: 'Search fees by student, class, or status...',
    columns: [
      {
        key: 'student',
        header: 'Student',
        render: (item: any) => (
          <UserInfoCell
            name={item.studentName}
            id={item.studentId}
            avatar={item.avatar}
            idLabel=''
          />
        ),
      },
      {
        key: 'class',
        header: 'Class',
        render: (item: any) => <span>{item.class}</span>,
      },
      {
        key: 'feeType',
        header: 'Fee Type',
        render: (item: any) => <span>{item.feeType}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (item: any) => (
          <span className='font-medium text-green-700'>${item.amount}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (item: any) => <StatusBadge status={item.status} />,
      },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (item: any) => <span>{item.dueDate}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (item: any) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  // open view modal
                  break;
                case 'edit':
                  // open edit modal
                  break;
                case 'delete':
                  // open delete confirm
                  break;
                default:
                  break;
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No fee records found',
    primaryFilter: {
      title: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Unpaid', label: 'Unpaid' },
        { value: 'Overdue', label: 'Overdue' },
      ],
    },
    secondaryFilter: {
      title: 'Fee Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Tuition', label: 'Tuition' },
        { value: 'Transport', label: 'Transport' },
        { value: 'Hostel', label: 'Hostel' },
        { value: 'Exam', label: 'Exam' },
        { value: 'Other', label: 'Other' },
      ],
    },
  },
  notices: {
    title: 'Notice Management',
    searchPlaceholder: 'Search notices by title, content, or author...',
    enableSelection: true,
    columns: [
      {
        key: 'title',
        header: 'Notice Details',
        mobileLabel: 'Notice',
        render: (item: any) => (
          <div>
            <div className='font-semibold'>{item.title}</div>
            <div className='text-gray-500 text-sm'>{item.content}</div>
            <div className='text-xs text-gray-400 mt-1 flex items-center gap-2'>
              By: {item.author}
              {item.files > 0 && (
                <span className='flex items-center gap-1 ml-2'>
                  <span role='img' aria-label='file'>
                    📎
                  </span>{' '}
                  {item.files} files
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'recipients',
        header: 'Recipients & Reach',
        mobileLabel: 'Recipients',
        render: (item: any) => (
          <div>
            <div className='text-xs font-medium text-gray-700'>
              {item.recipients}
            </div>
            <div className='text-xs text-green-600 font-semibold'>
              {item.read} / {item.total} read
            </div>
            <div className='w-28 bg-gray-200 rounded-full h-2 mt-1'>
              <div
                className='bg-green-500 h-2 rounded-full'
                style={{ width: `${(item.read / item.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status & Priority',
        mobileLabel: 'Status',
        render: (item: any) => (
          <div className='flex gap-2 items-center'>
            <StatusBadge
              status={
                item.status === 'Published'
                  ? 'Active'
                  : item.status === 'Draft'
                    ? 'Scheduled'
                    : 'Inactive'
              }
            />
            <StatusBadge
              status={
                item.priority === 'High'
                  ? 'Inactive'
                  : item.priority === 'Medium'
                    ? 'Scheduled'
                    : 'Active'
              }
            />
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        mobileLabel: 'Date',
        render: (item: any) => (
          <div className='text-xs text-gray-500'>
            {new Date(item.date).toLocaleDateString()}
          </div>
        ),
      },
    ],
    emptyMessage: 'No notices found',
    primaryFilter: {
      title: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
      ],
    },
    secondaryFilter: {
      title: 'Priority',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  },
  events: {
    title: 'Event Management',
    searchPlaceholder: 'Search events by title, content, or organizer...',
    enableSelection: true,
    columns: [
      {
        key: 'title',
        header: 'Event Details',
        mobileLabel: 'Event',
        render: (item: any) => (
          <div>
            <div className='font-semibold'>{item.title}</div>
            <div className='text-gray-500 text-sm'>{item.content}</div>
            <div className='text-xs text-gray-400 mt-1 flex items-center gap-2'>
              By: {item.organizer}
              {item.files > 0 && (
                <span className='flex items-center gap-1 ml-2'>
                  <span role='img' aria-label='file'>
                    📎
                  </span>{' '}
                  {item.files} files
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'participants',
        header: 'Participants & Attendance',
        mobileLabel: 'Participants',
        render: (item: any) => (
          <div>
            <div className='text-xs font-medium text-gray-700'>
              {item.participants}
            </div>
            <div className='text-xs text-green-600 font-semibold'>
              {item.attended} / {item.total} attended
            </div>
            <div className='w-28 bg-gray-200 rounded-full h-2 mt-1'>
              <div
                className='bg-green-500 h-2 rounded-full'
                style={{ width: `${(item.attended / item.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status & Priority',
        mobileLabel: 'Status',
        render: (item: any) => (
          <div className='flex gap-2 items-center'>
            <StatusBadge
              status={
                item.status === 'Scheduled'
                  ? 'Active'
                  : item.status === 'Draft'
                    ? 'Scheduled'
                    : 'Inactive'
              }
            />
            <StatusBadge
              status={
                item.priority === 'High'
                  ? 'Inactive'
                  : item.priority === 'Medium'
                    ? 'Scheduled'
                    : 'Active'
              }
            />
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        mobileLabel: 'Date',
        render: (item: any) => (
          <div className='text-xs text-gray-500'>
            {new Date(item.date).toLocaleDateString()}
          </div>
        ),
      },
    ],
    emptyMessage: 'No events found',
    primaryFilter: {
      title: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'draft', label: 'Draft' },
      ],
    },
    secondaryFilter: {
      title: 'Priority',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
  },

  'leave-requests': {
    title: 'Leave Request Management',
    searchPlaceholder: 'Search leave requests by name, type, or status...',
    columns: [
      {
        key: 'employee',
        header: 'Employee',
        render: (item: any) => (
          <UserInfoCell
            name={item.employeeName}
            id={item.employeeId}
            avatar={item.avatar}
            idLabel=''
          />
        ),
      },
      {
        key: 'leaveType',
        header: 'Leave Type',
        render: (item: any) => (
          <span className='font-medium'>{item.leaveType}</span>
        ),
      },
      {
        key: 'duration',
        header: 'Duration',
        render: (item: any) => (
          <span>
            {item.startDate} - {item.endDate}
          </span>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (item: any) => (
          <span className='text-xs text-gray-500'>{item.reason}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (item: any) => <StatusBadge status={item.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: any) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  // open view modal
                  break;
                case 'edit':
                  // open edit modal
                  break;
                case 'delete':
                  // open delete confirm
                  break;
                default:
                  break;
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No leave requests found',
    primaryFilter: {
      title: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
      ],
    },
    secondaryFilter: {
      title: 'Leave Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Sick', label: 'Sick' },
        { value: 'Casual', label: 'Casual' },
        { value: 'Earned', label: 'Earned' },
        { value: 'Maternity', label: 'Maternity' },
        { value: 'Other', label: 'Other' },
      ],
    },
  },
  students: {
    title: 'Student Directory',
    searchPlaceholder: 'Search Students by name, ID, email...',
    primaryFilter: {
      title: 'All Classes',
      options: [
        { value: 'all', label: 'All Classes' },
        { value: 'class-1', label: 'Class 1' },
        { value: 'class-2', label: 'Class 2' },
        { value: 'class-3', label: 'Class 3' },
        { value: 'class-4', label: 'Class 4' },
        { value: 'class-5', label: 'Class 5' },
        { value: 'class-6', label: 'Class 6' },
        { value: 'class-7', label: 'Class 7' },
        { value: 'class-8', label: 'Class 8' },
        { value: 'class-9', label: 'Class 9' },
        { value: 'class-10', label: 'Class 10' },
        { value: 'class-11', label: 'Class 11' },
        { value: 'class-12', label: 'Class 12' },
      ],
    },
    secondaryFilter: {
      title: 'All Sections',
      options: [
        { value: 'all', label: 'All Sections' },
        { value: 'section-a', label: 'Section A' },
        { value: 'section-b', label: 'Section B' },
        { value: 'section-c', label: 'Section C' },
        { value: 'section-d', label: 'Section D' },
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
        render: (
          item: Student,
          isSelected?: boolean,
          onSelect?: (id: string | number) => void,
          onItemAction?: (action: string, item: Student) => void,
        ) => (
          <ActionsCell
            entityType='student'
            status={item.status}
            onAction={(action: string) => {
              onItemAction?.(action, item);
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
        render: (
          item: Teacher,
          isSelected?: boolean,
          onSelect?: (id: string | number) => void,
          onItemAction?: (action: string, item: Teacher) => void,
        ) => (
          <ActionsCell
            entityType='teacher'
            status={item.status}
            onAction={(action: string) => {
              onItemAction?.(action, item);
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
              <div className='flex items-center gap-2 mt-1'>
                {(() => {
                  // Determine relationship from children data or profile
                  const relationship =
                    item.children && item.children.length > 0
                      ? item.children[0].relationship
                      : item.profile?.gender === 'male'
                        ? 'Father'
                        : item.profile?.gender === 'female'
                          ? 'Mother'
                          : 'Guardian';

                  return (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        relationship === 'Father' || relationship === 'father'
                          ? 'bg-blue-100 text-blue-800'
                          : relationship === 'Mother' ||
                              relationship === 'mother'
                            ? 'bg-pink-100 text-pink-800'
                            : relationship === 'Guardian' ||
                                relationship === 'guardian'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {relationship || 'Parent'}
                    </span>
                  );
                })()}
                {(() => {
                  // Get occupation from profile or job field
                  const occupation =
                    item.occupation || item.profile?.occupation || item.job;

                  // Only show occupation badge if it exists and is not empty
                  if (!occupation || occupation.trim() === '') {
                    return null;
                  }

                  return (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        occupation.toLowerCase().includes('engineer')
                          ? 'bg-blue-100 text-blue-800'
                          : occupation.toLowerCase().includes('doctor') ||
                              occupation.toLowerCase().includes('physician')
                            ? 'bg-green-100 text-green-800'
                            : occupation.toLowerCase().includes('teacher') ||
                                occupation.toLowerCase().includes('educator')
                              ? 'bg-purple-100 text-purple-800'
                              : occupation.toLowerCase().includes('business') ||
                                  occupation
                                    .toLowerCase()
                                    .includes('entrepreneur')
                                ? 'bg-orange-100 text-orange-800'
                                : occupation.toLowerCase().includes('retired')
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {occupation}
                    </span>
                  );
                })()}
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
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Parent, _isSelected, _onSelect, onItemAction) => (
          <ActionsCell
            onAction={(action: string) => {
              if (onItemAction) {
                onItemAction(action, item);
              }
            }}
            entityType='parent'
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
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
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
                    item.faculty === 'Compulsory Subject'
                      ? 'bg-blue-100 text-blue-800'
                      : item.faculty === 'Optional Subject'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800' // Default to compulsory
                  }`}
                >
                  {item.faculty === 'Compulsory Subject'
                    ? '📚 Compulsory'
                    : item.faculty === 'Optional Subject'
                      ? '⭐ Optional'
                      : '📚 Compulsory'}
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
      { key: 'examConfig', header: 'Exam Config', mobileLabel: 'Exam' },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (
          item: Subject,
          isSelected?: boolean,
          onSelect?: (id: string | number) => void,
          onItemAction?: (action: string, item: Subject) => void,
          onSubjectAction?: (action: string, subject: Subject) => void,
        ) => (
          <ActionsCell
            entityType='subject'
            onAction={(action: string) => {
              if (onSubjectAction) {
                onSubjectAction(action, item);
              } else if (onItemAction) {
                onItemAction(action, item);
              } else {
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
  classes: {
    title: 'Classes List',
    searchPlaceholder: 'Search Classes...',
    searchFields: ['name', 'section', 'classTeacher'],
    columns: [
      {
        key: 'classInfo',
        header: 'Class Information',
        mobileLabel: 'Class',
        render: (item: Class) => (
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M4 19.5A2.5 2.5 0 006.5 22h11a2.5 2.5 0 002.5-2.5V6a2 2 0 00-2-2H6a2 2 0 00-2 2v13.5z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M16 2v4M8 2v4'
                />
              </svg>
            </div>
            <div>
              <div className='font-medium text-gray-900'>
                {item.name} - {item.section}
              </div>
              <div className='text-sm text-gray-500 flex items-center gap-2'>
                Room {item.room} •{' '}
                <span className='flex items-center gap-1'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2}
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M4 6h16M4 10h16M4 14h16M4 18h16'
                    />
                  </svg>
                  {item.subjectsCount} subjects
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'classTeacher',
        header: 'Class Teacher',
        mobileLabel: 'Teacher',
        render: (item: Class) => (
          <div className='flex items-center gap-2'>
            <svg
              className='w-4 h-4 text-gray-400'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <span className='font-medium text-gray-900'>
              {item.classTeacher}
            </span>
          </div>
        ),
      },
      {
        key: 'lastUpdated',
        header: 'Last Updated',
        mobileLabel: 'Updated',
        render: (item: Class) => (
          <span className='text-gray-700'>{item.lastUpdated}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        mobileLabel: 'Actions',
        render: (item: Class) => (
          <ActionsCell
            onAction={(action: string) => {
              switch (action) {
                case 'view':
                  console.log('View class:', item.id);
                  break;
                case 'edit':
                  console.log('Edit class:', item.id);
                  break;
                case 'link':
                  console.log('Share class link:', item.id);
                  break;
                default:
                  console.log('Action:', action, 'for class:', item.id);
              }
            }}
          />
        ),
      },
    ],
    emptyMessage: 'No classes found',
    primaryFilter: {
      title: 'Section',
      options: [
        { value: 'all', label: 'All Sections' },
        { value: 'A', label: 'Section A' },
        { value: 'B', label: 'Section B' },
        { value: 'C', label: 'Section C' },
      ],
    },
    secondaryFilter: {
      title: 'Class Teacher',
      options: [
        { value: 'all', label: 'All Teachers' },
        { value: 'emma-thompson', label: 'Ms. Emma Thompson' },
        { value: 'david-lee', label: 'Mr. David Lee' },
        { value: 'sarah-wilson', label: 'Ms. Sarah Wilson' },
      ],
    },
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
