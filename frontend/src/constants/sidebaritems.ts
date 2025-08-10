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
          label: 'Fee Payments',
          icon: 'CreditCard',
          path: '/dashboard/admin/finance/fee-payments',
        },
        {
          label: 'Dues & Fines',
          icon: 'AlertCircle',
          path: '/dashboard/admin/finance/dues-fines',
        },
        {
          label: 'Salaries',
          icon: 'DollarSign',
          path: '/dashboard/admin/finance/salaries',
        },
        {
          label: 'Tax Management',
          icon: 'Percent',
          path: '/dashboard/admin/finance/tax-management',
        },
        {
          label: 'Expenses',
          icon: 'TrendingUp',
          path: '/dashboard/admin/finance/expenses',
        },
        {
          label: 'Scholarships',
          icon: 'Award',
          path: '/dashboard/admin/finance/scholarships',
        },
      ],
    },
    {
      title: 'REPORTS & ANALYTICS',
      items: [
        {
          label: 'Events',
          icon: 'CalendarEvent',
          path: '/dashboard/admin/reports/events',
        },
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
};
