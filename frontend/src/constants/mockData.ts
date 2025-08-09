// Mock data for Super Admin Dashboard
import { Event } from '@/types/EventTypes';
import { QuickAction } from '@/types/QuickActionItems';
import {
  GraduationCap,
  IdCard,
  CalendarPlus,
  FileText,
  Settings,
  UserPlus,
} from 'lucide-react';
import React from 'react';
import type { ClassResponse } from '@/api/services/class.service';

// Mock Events Data
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Parent-Teacher Conference',
    date: '2024-02-15',
    time: '09:00 AM',
    location: 'Main Auditorium',
    status: 'Scheduled',
  },
  {
    id: '2',
    title: 'Annual Sports Day',
    date: '2024-02-20',
    time: '08:00 AM',
    location: 'Sports Ground',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Science Fair Exhibition',
    date: '2024-02-25',
    time: '10:00 AM',
    location: 'Science Lab',
    status: 'Scheduled',
  },
  {
    id: '4',
    title: 'Mid-Term Examinations',
    date: '2024-03-01',
    time: '09:00 AM',
    location: 'All Classrooms',
    status: 'Scheduled',
  },
  {
    id: '5',
    title: 'Cultural Program',
    date: '2024-03-05',
    time: '02:00 PM',
    location: 'Main Hall',
    status: 'Active',
  },
  {
    id: '6',
    title: 'Staff Meeting',
    date: '2024-02-18',
    time: '03:30 PM',
    location: 'Conference Room',
    status: 'Scheduled',
  },
];

// Mock Quick Actions Data
export const mockQuickActions: QuickAction[] = [
  {
    id: '1',
    title: 'Add New Student',
    icon: React.createElement(UserPlus, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
  {
    id: '2',
    title: 'Add New Teacher',
    icon: React.createElement(GraduationCap, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
  {
    id: '3',
    title: 'Generate ID',
    icon: React.createElement(IdCard, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
  {
    id: '4',
    title: 'Create Event',
    icon: React.createElement(CalendarPlus, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
  {
    id: '5',
    title: 'Process Files',
    icon: React.createElement(FileText, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
  {
    id: '6',
    title: 'System Settings',
    icon: React.createElement(Settings, { className: 'w-6 h-6' }),
    onClick: () => {
      // This will be handled by the component
    },
  },
];

// Route mappings for quick actions
export const quickActionRoutes: Record<string, string> = {
  '1': '/dashboard/admin/students', // Add New Student
  '2': '/dashboard/admin/teachers', // Add New Teacher
  '3': '/dashboard/admin/id-generation', // Generate ID
  '4': '/dashboard/admin/events', // Create Event
  '5': '/dashboard/admin/files', // Process Files
  '6': '/dashboard/admin/settings', // System Settings
};

// Mock Classes Data
export const mockClasses: ClassResponse[] = [
  {
    id: 'class-1',
    name: 'Grade 10',
    sections: [
      {
        id: 'section-1',
        name: 'A',
        classId: 'class-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      {
        id: 'section-2',
        name: 'B',
        classId: 'class-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdById: 'admin-1',
    updatedById: 'admin-2',
  },
  {
    id: 'class-2',
    name: 'Grade 11',
    sections: [
      {
        id: 'section-3',
        name: 'A',
        classId: 'class-2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdById: 'admin-1',
    updatedById: 'admin-2',
  },
];
