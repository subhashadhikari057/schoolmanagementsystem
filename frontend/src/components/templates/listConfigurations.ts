import { ListConfiguration, BaseItem } from './GenericList';

// Define all data interfaces
export interface Student extends BaseItem {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  parent: string;
  status: 'Active' | 'Suspended' | 'Warning';
}

export interface Teacher extends BaseItem {
  id: number;
  name: string;
  faculty: string;
  subjects: string[];
  status: 'Active' | 'On Leave' | 'Inactive';
}

export interface Parent extends BaseItem {
  id: number;
  name: string;
  linkedStudents: string[];
  contact: string;
  accountStatus: 'Active' | 'Inactive' | 'Pending';
}

export interface Staff extends BaseItem {
  id: number;
  name: string;
  department: string;
  position: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

// All list configurations in one place
export const LIST_CONFIGS: Record<string, ListConfiguration> = {
  students: {
    title: "Students List",
    searchPlaceholder: "Search Students...",
    primaryFilter: {
      title: "All Faculty",
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' }
      ]
    },
    secondaryFilter: {
      title: "All Grades",
      options: [
        { value: 'all', label: 'All Grades' },
        { value: 'class-5-a', label: 'Class 5-A' },
        { value: 'class-4-b', label: 'Class 4-B' },
        { value: 'class-3-c', label: 'Class 3-C' },
        { value: 'class-4-a', label: 'Class 4-A' }
      ]
    },
    columns: [
      { key: 'name', header: 'Student', mobileLabel: 'Student' },
      { key: 'rollNo', header: 'Roll No.', mobileLabel: 'Roll' },
      { key: 'class', header: 'Class' },
      { key: 'parent', header: 'Parent' },
      { key: 'status', header: 'Status' }
    ],
    emptyMessage: "No students found"
  },

  teachers: {
    title: "Teachers List",
    searchPlaceholder: "Search Teachers...",
    primaryFilter: {
      title: "All Faculty",
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' },
        { value: 'mathematics', label: 'Mathematics' }
      ]
    },
    secondaryFilter: {
      title: "All Status",
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'on-leave', label: 'On Leave' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    columns: [
      { key: 'name', header: 'Teacher', mobileLabel: 'Teacher' },
      { key: 'faculty', header: 'Faculty', mobileLabel: 'Faculty' },
      { key: 'subjects', header: 'Subjects' },
      { key: 'status', header: 'Status' }
    ],
    emptyMessage: "No teachers found"
  },

  parents: {
    title: "Parents List",
    searchPlaceholder: "Search Parents...",
    primaryFilter: {
      title: "All Faculty",
      options: [
        { value: 'all', label: 'All Faculty' },
        { value: 'science', label: 'Science' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'arts', label: 'Arts' }
      ]
    },
    secondaryFilter: {
      title: "All Status",
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    columns: [
      { key: 'name', header: 'Parent', mobileLabel: 'Parent' },
      { key: 'linkedStudents', header: 'Linked Students', mobileLabel: 'Students' },
      { key: 'contact', header: 'Contact' },
      { key: 'accountStatus', header: 'Status' }
    ],
    emptyMessage: "No parents found"
  },

  staff: {
    title: "Staff List",
    searchPlaceholder: "Search Staff...",
    primaryFilter: {
      title: "All Departments",
      options: [
        { value: 'all', label: 'All Departments' },
        { value: 'administration', label: 'Administration' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'library', label: 'Library' },
        { value: 'canteen', label: 'Canteen' }
      ]
    },
    secondaryFilter: {
      title: "All Status",
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'on-leave', label: 'On Leave' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    columns: [
      { key: 'name', header: 'Staff', mobileLabel: 'Staff' },
      { key: 'department', header: 'Department', mobileLabel: 'Dept' },
      { key: 'position', header: 'Position' },
      { key: 'status', header: 'Status' }
    ],
    emptyMessage: "No staff found"
  }
};

// Helper function to get configuration by type
export const getListConfig = (type: string): ListConfiguration => {
  const config = LIST_CONFIGS[type];
  if (!config) {
    throw new Error(`Configuration for list type "${type}" not found`);
  }
  return config;
};
