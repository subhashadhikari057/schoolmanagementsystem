// Mock data for Super Admin Dashboard
import { Event } from '@/types/EventTypes';
import { Notification } from '@/types/NotficationItemsTypes';
import { QuickAction } from '@/types/QuickActionItems';
import {
  Calendar,
  Bell,
  Users,
  GraduationCap,
  IdCard,
  CalendarPlus,
  FileText,
  Settings,
  UserPlus,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
} from 'lucide-react';
import React from 'react';

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

// Mock Notifications Data
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Student Registration',
    description: '15 new students registered for the upcoming semester',
    time: '2 hours ago',
    type: 'success',
    icon: React.createElement(CheckCircle, { className: 'w-5 h-5' }),
    read: false,
  },
  {
    id: '2',
    title: 'Fee Payment Reminder',
    description: 'Monthly fee collection deadline is approaching',
    time: '4 hours ago',
    type: 'warning',
    icon: React.createElement(AlertTriangle, { className: 'w-5 h-5' }),
    read: false,
  },
  {
    id: '3',
    title: 'System Maintenance',
    description:
      'Scheduled maintenance on Feb 20, 2024 from 2:00 AM to 4:00 AM',
    time: '6 hours ago',
    type: 'info',
    icon: React.createElement(Info, { className: 'w-5 h-5' }),
    read: true,
  },
  {
    id: '4',
    title: 'Teacher Leave Request',
    description: 'Mrs. Sarah Johnson has requested leave for Feb 22-24',
    time: '8 hours ago',
    type: 'info',
    icon: React.createElement(Clock, { className: 'w-5 h-5' }),
    read: false,
  },
  {
    id: '5',
    title: 'Exam Results Published',
    description: 'Mid-term exam results are now available for Grade 10',
    time: '1 day ago',
    type: 'success',
    icon: React.createElement(BookOpen, { className: 'w-5 h-5' }),
    read: true,
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
  '1': '/dashboard/admin/students/add', // Add New Student
  '2': '/dashboard/admin/teachers/add', // Add New Teacher
  '3': '/dashboard/admin/id-generation', // Generate ID
  '4': '/dashboard/admin/events/create', // Create Event
  '5': '/dashboard/admin/files/process', // Process Files
  '6': '/dashboard/admin/settings', // System Settings
};
