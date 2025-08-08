export const sidebarItems = {
  Superadmin: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/admin' },
        { label: 'Parents', icon: 'Users', path: '/dashboard/admin/parents' },
        {
          label: 'Students',
          icon: 'GraduationCap',
          path: '/dashboard/admin/students',
        },
        {
          label: 'Teachers',
          icon: 'UserCheck',
          path: '/dashboard/admin/teachers',
        },
        { label: 'Staff', icon: 'Briefcase', path: '/dashboard/admin/staff' },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'Classes & Sections',
          icon: 'Layers',
          path: '/dashboard/admin/academics/classes',
        },
        {
          label: 'Subjects & Curriculum',
          icon: 'Book',
          path: '/dashboard/admin/academics/subjects',
        },
        {
          label: 'ID Cards & Generation',
          icon: 'IdCard',
          path: '/dashboard/admin/academics/id-generation',
        },
        {
          label: 'Exams & Results',
          icon: 'ClipboardList',
          path: '/dashboard/admin/academics/exams',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/admin/academics/attendance',
        },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        {
          label: 'Payments & Dues',
          icon: 'CreditCard',
          path: '/dashboard/admin/payments',
        },
        {
          label: 'Fee Structures',
          icon: 'Receipt',
          path: '/dashboard/admin/fee-structures',
        },
        {
          label: 'Scholarships & Discounts',
          icon: 'Award',
          path: '/dashboard/admin/scholarships',
        },
        {
          label: 'Expenses & Tracking',
          icon: 'TrendingUp',
          path: '/dashboard/admin/expenses',
        },
      ],
    },
    {
      title: 'Report and Analytics',
      items: [
        {
          label: 'Notifications',
          icon: 'Bell',
          path: '/dashboard/admin/reports/notices',
        },
        {
          label: 'Reports',
          icon: 'Report',
          path: '/dashboard/admin/reports/report',
        },
        {
          label: 'Analytics',
          icon: 'Calendar',
          path: '/dashboard/admin/reports/analytics',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          label: 'General Settings',
          icon: 'Settings',
          path: '/dashboard/admin/settings',
        },
        {
          label: 'Access Control',
          icon: 'Lock',
          path: '/dashboard/admin/access-control',
        },
        {
          label: 'System Logs',
          icon: 'FileText',
          path: '/dashboard/admin/logs',
        },
        {
          label: 'Data Backups',
          icon: 'Database',
          path: '/dashboard/admin/backups',
        },
        // ...removed static My Account, now handled dynamically in Sidebar
      ],
    },
  ],
  teacher: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/teacher' },
        {
          label: 'Leave Requests',
          icon: 'CalendarMinus',
          path: '/dashboard/teacher/leave-requests',
        },
        { label: 'Account', icon: 'User', path: '/dashboard/teacher/account' },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'My Subjects',
          icon: 'Book',
          path: '/dashboard/teacher/subjects',
        },
        {
          label: 'My Classes',
          icon: 'Users',
          path: '/dashboard/teacher/classes',
        },
        {
          label: 'Class Routine',
          icon: 'Calendar',
          path: '/dashboard/teacher/routine',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/teacher/attendance',
        },
        {
          label: 'Assignment',
          icon: 'CheckSquare',
          path: '/dashboard/teacher/assignments',
        },
        {
          label: 'Exams & Results',
          icon: 'ClipboardList',
          path: '/dashboard/teacher/exams',
        },
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/teacher/notices',
        },
      ],
    },
  ],
  student: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/student' },
        {
          label: 'Leave Requests',
          icon: 'CalendarMinus',
          path: '/dashboard/student/leave-requests',
        },
        {
          label: 'Calendar View',
          icon: 'Calendar',
          path: '/dashboard/student/calendar',
        },
        { label: 'Account', icon: 'User', path: '/dashboard/student/account' },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'My Subjects',
          icon: 'Book',
          path: '/dashboard/student/subjects',
        },
        {
          label: 'My Classes',
          icon: 'Users',
          path: '/dashboard/student/classes',
        },
        {
          label: 'Class Routine',
          icon: 'Calendar',
          path: '/dashboard/student/routine',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/student/attendance',
        },
        {
          label: 'Assignment',
          icon: 'CheckSquare',
          path: '/dashboard/student/assignments',
        },
        {
          label: 'Exams & Results',
          icon: 'ClipboardList',
          path: '/dashboard/student/exams',
        },
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/student/notices',
        },
        {
          label: 'Complaint Box',
          icon: 'MessageSquare',
          path: '/dashboard/student/complaints',
        },
      ],
    },
  ],
  parent: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/parent' },
        {
          label: 'Leave Requests',
          icon: 'CalendarMinus',
          path: '/dashboard/parent/leave-requests',
        },
        {
          label: 'Calendar View',
          icon: 'Calendar',
          path: '/dashboard/parent/calendar',
        },
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/parent/notices',
        },
        { label: 'Account', icon: 'User', path: '/dashboard/parent/account' },
      ],
    },
    {
      title: 'STUDENT',
      items: [
        {
          label: 'My Children',
          icon: 'Baby',
          path: '/dashboard/parent/children',
        },
        {
          label: 'Complaint Box',
          icon: 'MessageSquare',
          path: '/dashboard/parent/complaints',
        },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'Assignment Status',
          icon: 'CheckSquare',
          path: '/dashboard/parent/assignments',
        },
        {
          label: 'Exams & Results',
          icon: 'ClipboardList',
          path: '/dashboard/parent/exams',
        },
        {
          label: 'Timetable',
          icon: 'Calendar',
          path: '/dashboard/parent/timetable',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/parent/attendance',
        },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        {
          label: 'Fees & Payments',
          icon: 'CreditCard',
          path: '/dashboard/parent/fees',
        },
      ],
    },
  ],
  staff: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/staff' },
        {
          label: 'My Tasks',
          icon: 'CheckSquare',
          path: '/dashboard/staff/tasks',
        },
        {
          label: 'Leave Requests',
          icon: 'CalendarMinus',
          path: '/dashboard/staff/leave-requests',
        },
        {
          label: 'Work Schedule',
          icon: 'Calendar',
          path: '/dashboard/staff/schedule',
        },
        { label: 'Account', icon: 'User', path: '/dashboard/staff/account' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          label: 'Maintenance',
          icon: 'Wrench',
          path: '/dashboard/staff/maintenance',
        },
        {
          label: 'Inventory',
          icon: 'Package',
          path: '/dashboard/staff/inventory',
        },
        {
          label: 'Facilities',
          icon: 'Building',
          path: '/dashboard/staff/facilities',
        },
        {
          label: 'Reports',
          icon: 'FileText',
          path: '/dashboard/staff/reports',
        },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/staff/notices',
        },
        {
          label: 'Messages',
          icon: 'MessageSquare',
          path: '/dashboard/staff/messages',
        },
      ],
    },
  ],
};
