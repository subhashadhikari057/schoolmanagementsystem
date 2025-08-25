/**
 * Mock data for development and testing
 */

import React from 'react';
import { UserPlus, Users, BookOpen } from 'lucide-react';

export const adminQuickActions = [
  {
    id: 'add-student',
    title: 'Add Student',
    description: 'Register a new student',
    icon: React.createElement(UserPlus, { size: 20 }),
    action: 'modal',
    modalType: 'add-student',
    onClick: () => console.log('Add Student clicked'),
  },
  {
    id: 'add-teacher',
    title: 'Add Teacher',
    description: 'Register a new teacher',
    icon: React.createElement(UserPlus, { size: 20 }),
    action: 'modal',
    modalType: 'add-teacher',
    onClick: () => console.log('Add Teacher clicked'),
  },
  {
    id: 'add-staff',
    title: 'Add Staff',
    description: 'Register a new staff member',
    icon: React.createElement(Users, { size: 20 }),
    action: 'modal',
    modalType: 'add-staff',
    onClick: () => console.log('Add Staff clicked'),
  },
  {
    id: 'add-class',
    title: 'Add Class',
    description: 'Create a new class',
    icon: React.createElement(BookOpen, { size: 20 }),
    action: 'modal',
    modalType: 'add-class',
    onClick: () => console.log('Add Class clicked'),
  },
];

export const quickActionRoutes: Record<string, string> = {
  'add-student': '/dashboard/admin/students',
  'add-teacher': '/dashboard/admin/teachers',
  'add-staff': '/dashboard/admin/staff',
  'add-class': '/dashboard/admin/academics/classes',
};

// Mock classes data to match the expected interface
export const mockClasses = [
  {
    id: 'class-1',
    name: 'Class 1A',
    section: 'A',
    grade: 1,
    capacity: 30,
    currentEnrollment: 25,
    roomId: 'room-1',
    classTeacherId: 'teacher-1',
    shift: 'morning' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdById: 'admin-1',
    updatedById: 'admin-1',
  },
  {
    id: 'class-2',
    name: 'Class 1B',
    section: 'B',
    grade: 1,
    capacity: 30,
    currentEnrollment: 28,
    roomId: 'room-2',
    classTeacherId: 'teacher-2',
    shift: 'morning' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdById: 'admin-1',
    updatedById: 'admin-1',
  },
];
