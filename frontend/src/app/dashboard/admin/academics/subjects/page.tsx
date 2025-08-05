'use client';

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Subject,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import ShortcutsPanel from '@/components/organisms/dashboard/ShortcutsPanel';
import { Users, UserCheck, AlertCircle, GraduationCap } from 'lucide-react';
import AcademicStatsPanel from '@/components/organisms/dashboard/AcademicStatsPanel';
import RecentActivityPanel from '@/components/organisms/dashboard/RecentActivityPanel';

const SubjectManagementPage = () => {
  // Subject-specific stats data
  const subjectStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '156',
      label: 'Total Subjects',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '152',
      label: 'Active Subjects',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '3',
      label: 'Teacher Assigned',
      change: '5.2%',
      isPositive: false,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '1',
      label: 'Class Covered',
      change: '2.1%',
      isPositive: false,
    },
  ];

  // Academic stats data
  const academicStats = {
    totalSubjects: 42,
    totalTeachers: 18,
    activeClasses: 28,
    examScheduled: 8,
  };

  // Shortcut handlers
  const handleAddSubject = () => {
    console.log('Add Subject clicked');
  };

  const handleAssignTeacher = () => {
    console.log('Assign Teacher clicked');
  };

  const handleScheduleExam = () => {
    console.log('Schedule Exam clicked');
  };

  const handleManageClasses = () => {
    console.log('Manage Classes clicked');
  };

  // Sample subjects data
  const subjectsData: Subject[] = [
    {
      id: 1,
      name: 'Mathematics',
      code: 'MATH101',
      faculty: 'Science',
      credits: 4,
      status: 'Active',
      gradeClasses: ['Grade 10-A', 'Grade 10-B', 'Grade 11-A'],
      teachers: ['John Smith', 'Sarah Wilson'],
      scheduleInfo: 'Mon, Wed, Fri - 9:00 AM',
      studentsCount: 85,
      examConfig: 'Midterm & Final',
    },
    {
      id: 2,
      name: 'English Literature',
      code: 'ENG201',
      faculty: 'Arts',
      credits: 3,
      status: 'Active',
      gradeClasses: ['Grade 9-A', 'Grade 9-B'],
      teachers: ['Emily Davis', 'Michael Brown'],
      scheduleInfo: 'Tue, Thu - 10:30 AM',
      studentsCount: 72,
      examConfig: 'Continuous Assessment',
    },
    {
      id: 3,
      name: 'Physics',
      code: 'PHY101',
      faculty: 'Science',
      credits: 4,
      status: 'Inactive',
      gradeClasses: ['Grade 11-A'],
      teachers: ['David Johnson'],
      scheduleInfo: 'Mon, Wed - 2:00 PM',
      studentsCount: 45,
      examConfig: 'Lab + Theory Exam',
    },
    {
      id: 4,
      name: 'Computer Science',
      code: 'CS101',
      faculty: 'Engineering',
      credits: 4,
      status: 'Active',
      gradeClasses: ['Grade 10-A', 'Grade 11-B', 'Grade 12-A'],
      teachers: ['Alex Thompson', 'Lisa Martinez'],
      scheduleInfo: 'Daily - 11:00 AM',
      studentsCount: 92,
      examConfig: 'Project + Exam',
    },
    {
      id: 5,
      name: 'History',
      code: 'HIST101',
      faculty: 'Social Studies',
      credits: 3,
      status: 'Active',
      gradeClasses: ['Grade 9-C', 'Grade 10-C'],
      teachers: ['Robert Garcia'],
      scheduleInfo: 'Tue, Thu, Fri - 1:00 PM',
      studentsCount: 68,
      examConfig: 'Essay + MCQ Exam',
    },
  ];

  // Subject-related recent activities
  const subjectActivities = [
    {
      id: '1',
      user: 'Dr. Sarah Wilson',
      action: 'created new subject "Advanced Calculus"',
      description: '1 hour ago',
      time: '1 hour ago',
      type: 'assignment' as const,
    },
    {
      id: '2',
      user: 'John Smith',
      action: 'assigned to Mathematics subject',
      description: '3 hours ago',
      time: '3 hours ago',
      type: 'approval' as const,
    },
    {
      id: '3',
      user: 'Emily Davis',
      action: 'updated English Literature schedule',
      description: '5 hours ago',
      time: '5 hours ago',
      type: 'profile' as const,
    },
    {
      id: '4',
      user: 'Alex Thompson',
      action: 'uploaded CS101 exam materials',
      description: 'Yesterday',
      time: 'Yesterday',
      type: 'upload' as const,
    },
    {
      id: '5',
      user: 'Admin',
      action: 'activated 3 new subjects',
      description: '2 days ago',
      time: '2 days ago',
      type: 'general' as const,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Subject Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Subject Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={subjectStats} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-5'>
            {/* Main Content Area */}
            <div className='xl:col-span-3 space-y-4 sm:space-y-6 mr-4 lg:mr-0'>
              {/* Subjects List - Now using Generic List */}
              <GenericList<Subject>
                config={getListConfig('subjects')}
                data={subjectsData}
                currentPage={1}
                totalPages={32}
                totalItems={156}
                itemsPerPage={5}
              />
            </div>

            {/* Sidebar */}
            <div className='xl:col-span-1 space-y-4 sm:space-y-6'>
              {/* Combined Academic Stats and Shortcuts Panel */}
              <div className='bg-white p-4 rounded-lg shadow space-y-6'>
                {/* Academic Stats Panel */}
                <AcademicStatsPanel
                  data={{
                    totalSubjects: academicStats.totalSubjects,
                    totalFaculties: academicStats.totalTeachers,
                    scheduledExams: academicStats.examScheduled,
                    sections: academicStats.activeClasses,
                  }}
                />

                {/* Shortcuts Panel */}
                <ShortcutsPanel
                  onAssignSubject={handleAddSubject}
                  onAssignFaculty={handleAssignTeacher}
                  onComplainBox={handleScheduleExam}
                  onDownloadBulkData={handleManageClasses}
                  labels={{
                    assignSubject: 'Add New Subject',
                    assignFaculty: 'Assign Teacher',
                    complainBox: 'Schedule Exam',
                    downloadBulkData: 'Manage Classes',
                  }}
                />
              </div>

              {/* Recent Activity Panel */}
              <RecentActivityPanel activities={subjectActivities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectManagementPage;
