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
          label: 'Student Promotions',
          icon: 'ArrowUpCircle',
          path: '/dashboard/admin/academics/promotions',
        },
        {
          label: 'Reports',
          icon: 'FileText',
          path: '/dashboard/admin/reports/report',
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
          label: 'Student Leave',
          icon: 'CalendarMinus',
          path: '/dashboard/admin/communication/leave-requests',
        },
        {
          label: 'Teacher Leave',
          icon: 'UserX',
          path: '/dashboard/admin/communication/teacher-leave',
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
          label: 'Fee Management',
          icon: 'FileText',
          path: '/dashboard/admin/finance/fee-management',
        },
        {
          label: 'Finance and Assets',
          icon: 'TrendingUp',
          path: '/dashboard/admin/finance/expenses',
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
        {
          label: 'My Account',
          icon: 'UserCog',
          path: '/dashboard/system/myprofile',
        },
      ],
    },
  ],
  teacher: [
    {
      title: 'GENERAL',
      items: [{ label: 'Dashboard', icon: 'Home', path: '/dashboard/teacher' }],
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
          path: '/dashboard/teacher/communication/complaints-leave',
        },
        {
          label: 'My Leave',
          icon: 'CalendarMinus',
          path: '/dashboard/teacher/my-leave',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          label: 'My Account',
          icon: 'UserCog',
          path: '/dashboard/system/myprofile',
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
          label: 'Class Routine',
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
          path: '/dashboard/student/complaints-leave',
        },
        {
          label: 'My Account',
          icon: 'UserCog',
          path: '/dashboard/system/myprofile',
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
          path: '/dashboard/parent/complaints-leaves',
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
        {
          label: 'My Account',
          icon: 'UserCog',
          path: '/dashboard/system/myprofile',
        },
      ],
    },
  ],
} as const;
