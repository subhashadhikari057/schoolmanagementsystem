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
      title: 'ACADEMIC MANAGEMENT',
      items: [
        {
          label: 'Classes',
          icon: 'Layers',
          path: '/dashboard/admin/academics/classes',
        },
        {
          label: 'Subjects',
          icon: 'Book',
          path: '/dashboard/admin/academics/subjects',
        },
        {
          label: 'ID Management',
          icon: 'IdCard',
          path: '/dashboard/admin/academics/id-generation',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/admin/academics/attendance',
        },
        {
          label: 'Assignments',
          icon: 'CheckSquare',
          path: '/dashboard/admin/academics/assignments',
        },
        {
          label: 'Exams',
          icon: 'ClipboardList',
          path: '/dashboard/admin/academics/exams',
        },
        {
          label: 'Academic Calendar',
          icon: 'Calendar',
          path: '/dashboard/admin/academics/calendar',
        },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/admin/communication/notices',
        },
        {
          label: 'Complaints',
          icon: 'MessageSquare',
          path: '/dashboard/admin/communication/complaints',
        },
        {
          label: 'Leave Requests',
          icon: 'CalendarMinus',
          path: '/dashboard/admin/communication/leave-requests',
        },
        {
          label: 'Leave Types',
          icon: 'List',
          path: '/dashboard/admin/communication/leave-types',
        },
      ],
    },
    {
      title: 'FINANCE & ACCOUNTING',
      items: [
        {
          label: 'Finance Overview',
          icon: 'BarChart2',
          path: '/dashboard/admin/finance/overview',
        },
        {
          label: 'Fee Management',
          icon: 'FileText',
          path: '/dashboard/admin/finance/fee-management',
        },
        {
          label: 'Expenses',
          icon: 'TrendingUp',
          path: '/dashboard/admin/finance/expenses',
        },
      ],
    },
    {
      title: 'REPORTS & ANALYTICS',
      items: [
        {
          label: 'Reports',
          icon: 'FileText',
          path: '/dashboard/admin/reports/report',
        },
        {
          label: 'Analytics',
          icon: 'BarChart',
          path: '/dashboard/admin/reports/analytics',
        },
        {
          label: 'Notifications',
          icon: 'Bell',
          path: '/dashboard/admin/reports/notifications',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          label: 'Settings',
          icon: 'Settings',
          path: '/dashboard/admin/settings',
        },
      ],
    },
  ],
  teacher: [
    {
      title: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/teacher' },
        {
          label: 'My Leave',
          icon: 'CalendarMinus',
          path: '/dashboard/teacher/my-leave',
        },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          label: 'My Classes',
          icon: 'Users',
          path: '/dashboard/teacher/academics/classes',
        },
        {
          label: 'Class Routine',
          icon: 'CalendarClock',
          path: '/dashboard/teacher/academics/routine',
        },
        {
          label: 'Attendance',
          icon: 'PenSquare',
          path: '/dashboard/teacher/academics/attendance',
        },
        {
          label: 'Assignments',
          icon: 'CheckSquare',
          path: '/dashboard/teacher/academics/assignments',
        },
        {
          label: 'Exams & Results',
          icon: 'ClipboardCheck',
          path: '/dashboard/teacher/academics/results',
        },
        {
          label: 'Academic Calendar',
          icon: 'Calendar',
          path: '/dashboard/teacher/academics/calendar',
        },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/teacher/communication/notices',
        },
        {
          label: 'Complaints and Requests',
          icon: 'Mailbox',
          path: '/dashboard/teacher/communication/complaints&leave',
        },
      ],
    },
  ],
  student: [
    {
      title: 'STUDENT DASHBOARD',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/student' },
        {
          label: 'My Subjects',
          icon: 'Layers',
          path: '/dashboard/student/subjects',
        },
        {
          label: 'Assignments',
          icon: 'CheckSquare',
          path: '/dashboard/student/assignments',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/student/attendance',
        },
        {
          label: 'Exams',
          icon: 'ClipboardList',
          path: '/dashboard/student/exams',
        },
        {
          label: 'Academic Calendar',
          icon: 'Calendar',
          path: '/dashboard/student/academics/calendar',
        },
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/student/notices',
        },
        {
          label: 'Complaints and leaves',
          icon: 'Mailbox',
          path: '/dashboard/student/complaints&leave',
        },
      ],
    },
  ],
  parent: [
    {
      title: 'PARENT DASHBOARD',
      items: [
        { label: 'Dashboard', icon: 'Home', path: '/dashboard/parent' },
        {
          label: 'My Children',
          icon: 'Users',
          path: '/dashboard/parent/children',
        },
        {
          label: 'Attendance',
          icon: 'CalendarCheck',
          path: '/dashboard/parent/attendance',
        },
        {
          label: 'Assignments',
          icon: 'CheckSquare',
          path: '/dashboard/parent/assignments',
        },
        {
          label: 'Exams',
          icon: 'ClipboardList',
          path: '/dashboard/parent/exams',
        },
        {
          label: 'Academic Calendar',
          icon: 'Calendar',
          path: '/dashboard/parent/academics/calendar',
        },
        {
          label: 'Notices',
          icon: 'Megaphone',
          path: '/dashboard/parent/notices',
        },
        {
          label: 'Complaints and Leaves',
          icon: 'Megaphone',
          path: '/dashboard/parent/complaints&leaves',
        },
        {
          label: 'Fees',
          icon: 'Megaphone',
          path: '/dashboard/parent/fees',
        },
        {
          label: 'TimeTable',
          icon: 'Megaphone',
          path: '/dashboard/parent/timetable',
        },
      ],
    },
  ],
};
