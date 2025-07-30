export const sidebarItems = {
  Superadmin: [
    {
      title: "GENERAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/admin/dashboard" },
        { label: "Parents", icon: "Users", path: "/admin/parents" },
        { label: "Students", icon: "GraduationCap", path: "/admin/students" },
        { label: "Teachers", icon: "UserCheck", path: "/admin/teachers" },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Classes & Sections", icon: "Layers", path: "/admin/classes" },
        { label: "Subjects & Curriculum", icon: "Book", path: "/admin/subjects" },
        { label: "Exams & Results", icon: "ClipboardList", path: "/admin/exams" },
        { label: "Attendance", icon: "CalendarCheck", path: "/admin/attendance" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Payments & Dues", icon: "CreditCard", path: "/admin/payments" },
        { label: "Fee Structures", icon: "Receipt", path: "/admin/fee-structures" },
        { label: "Scholarships & Discounts", icon: "Award", path: "/admin/scholarships" },
        { label: "Expenses & Tracking", icon: "TrendingUp", path: "/admin/expenses" },
      ],
    },
    {
      title: "ENGAGEMENT",
      items: [
        { label: "Notices & Communication", icon: "Megaphone", path: "/admin/notices" },
        { label: "Achievements & Events", icon: "Calendar", path: "/admin/events" },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { label: "General Settings", icon: "Settings", path: "/admin/settings" },
        { label: "Access Control", icon: "Lock", path: "/admin/access-control" },
        { label: "System Logs", icon: "FileText", path: "/admin/logs" },
        { label: "Data Backups", icon: "Database", path: "/admin/backups" },
        { label: "Account", icon: "UserCog", path: "/admin/account" },
      ],
    },
  ],
  teacher: [
    {
      title: "GENERAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/teacher/dashboard" },
        { label: "Leave Requests", icon: "CalendarMinus", path: "/teacher/leave-requests" },
        { label: "Account", icon: "User", path: "/teacher/account" },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "My Subjects", icon: "Book", path: "/teacher/subjects" },
        { label: "My Classes", icon: "Users", path: "/teacher/classes" },
        { label: "Class Routine", icon: "Calendar", path: "/teacher/routine" },
        { label: "Attendance", icon: "CalendarCheck", path: "/teacher/attendance" },
        { label: "Assignment", icon: "CheckSquare", path: "/teacher/assignments" },
        { label: "Exams & Results", icon: "ClipboardList", path: "/teacher/exams" },
        { label: "Notices", icon: "Megaphone", path: "/teacher/notices" },
      ],
    },
  ],
  student: [
    {
      title: "GENERAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/student/dashboard" },
        { label: "Leave Requests", icon: "CalendarMinus", path: "/student/leave-requests" },
        { label: "Calendar View", icon: "Calendar", path: "/student/calendar" },
        { label: "Account", icon: "User", path: "/student/account" },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "My Subjects", icon: "Book", path: "/student/subjects" },
        { label: "My Classes", icon: "Users", path: "/student/classes" },
        { label: "Class Routine", icon: "Calendar", path: "/student/routine" },
        { label: "Attendance", icon: "CalendarCheck", path: "/student/attendance" },
        { label: "Assignment", icon: "CheckSquare", path: "/student/assignments" },
        { label: "Exams & Results", icon: "ClipboardList", path: "/student/exams" },
        { label: "Notices", icon: "Megaphone", path: "/student/notices" },
        { label: "Complaint Box", icon: "MessageSquare", path: "/student/complaints" },
      ],
    },
  ],
  parent: [
    {
      title: "GENERAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/parent/dashboard" },
        { label: "Leave Requests", icon: "CalendarMinus", path: "/parent/leave-requests" },
        { label: "Calendar View", icon: "Calendar", path: "/parent/calendar" },
        { label: "Notices", icon: "Megaphone", path: "/parent/notices" },
        { label: "Account", icon: "User", path: "/parent/account" },
      ],
    },
    {
      title: "STUDENT",
      items: [
        { label: "My Children", icon: "Baby", path: "/parent/children" },
        { label: "Complaint Box", icon: "MessageSquare", path: "/parent/complaints" },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Assignment Status", icon: "CheckSquare", path: "/parent/assignments" },
        { label: "Exams & Results", icon: "ClipboardList", path: "/parent/exams" },
        { label: "Timetable", icon: "Calendar", path: "/parent/timetable" },
        { label: "Attendance", icon: "CalendarCheck", path: "/parent/attendance" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Fees & Payments", icon: "CreditCard", path: "/parent/fees" },
      ],
    },
  ],
};