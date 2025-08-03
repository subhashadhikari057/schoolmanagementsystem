'use client'

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import { getListConfig, Teacher } from '@/components/templates/listConfigurations';
import Statsgrid from "@/components/organisms/dashboard/Statsgrid";
import ShortcutsPanel from "@/components/organisms/dashboard/ShortcutsPanel";
import { Users, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import AcademicStatsPanel from "@/components/organisms/dashboard/AcademicStatsPanel";
import RecentActivityPanel from "@/components/organisms/dashboard/RecentActivityPanel";

const TeachersPage = () => {
  // Teacher-specific stats data
  const teacherStats = [
    {
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      value: "45",
      label: "Total Teachers",
      change: "3.1%",
      isPositive: true
    },
    {
      icon: GraduationCap,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      value: "42",
      label: "Active Teachers",
      change: "1.8%",
      isPositive: true
    },
    {
      icon: Calendar,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      value: "2",
      label: "On Leave",
      change: "5.2%",
      isPositive: false
    },
    {
      icon: BookOpen,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      value: "1",
      label: "New Hires",
      change: "15.3%",
      isPositive: true
    }
  ];

  // Academic stats data
  const academicStats = {
    totalSubjects: 42,
    totalFaculties: 36,
    scheduledExams: 4,
    sections: 13
  };

  // Shortcut handlers
  const handleAddTeacher = () => {
    console.log('Add Teacher clicked');
  };

  const handleBulkImport = () => {
    console.log('Bulk Import clicked');
  };

  const handleGenerateReports = () => {
    console.log('Generate Reports clicked');
  };

  const handleManageSchedule = () => {
    console.log('Manage Schedule clicked');
  };

  // Sample teacher data
  const teachersData: Teacher[] = [
    {
      id: 1,
      name: "Dr. Emily Johnson",
      faculty: "Science",
      subjects: ["Biology", "Chemistry"],
      status: "Active"
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      faculty: "Mathematics",
      subjects: ["Algebra", "Calculus"],
      status: "Active"
    },
    {
      id: 3,
      name: "Ms. Sarah Wilson",
      faculty: "Arts",
      subjects: ["History", "Geography"],
      status: "On Leave"
    },
    {
      id: 4,
      name: "Mr. David Rodriguez",
      faculty: "Engineering",
      subjects: ["Physics", "Computer Science"],
      status: "Active"
    },
    {
      id: 5,
      name: "Dr. Lisa Patel",
      faculty: "Science",
      subjects: ["Physics", "Mathematics"],
      status: "Inactive"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Manage All Teacher Related Info Here</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          <Statsgrid stats={teacherStats} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6 mr-4 lg:mr-0">
              
              {/* Teacher List - Now using Generic List */}
              <GenericList<Teacher>
                config={getListConfig('teachers')}
                data={teachersData}
                currentPage={1}
                totalPages={10}
                totalItems={45}
                itemsPerPage={5}
              />

            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-4 sm:space-y-6">
              
              {/* Combined Academic Stats and Shortcuts Panel */}
              <div className="bg-white p-4 rounded-lg shadow space-y-6">
                {/* Academic Stats Panel */}
                <AcademicStatsPanel 
                  data={{
                    totalSubjects: academicStats.totalSubjects,
                    totalFaculties: academicStats.totalFaculties,
                    scheduledExams: academicStats.scheduledExams,
                    sections: academicStats.sections
                  }}
                />

                {/* Shortcuts Panel */}
                <ShortcutsPanel 
                  onAssignSubject={handleAddTeacher}
                  onAssignFaculty={handleBulkImport}
                  onComplainBox={handleGenerateReports}
                  onDownloadBulkData={handleManageSchedule}
                  labels={{
                    assignSubject: "Add New Teacher",
                    assignFaculty: "Bulk Import",
                    complainBox: "Generate Reports",
                    downloadBulkData: "Manage Schedule"
                  }}
                />
              </div>

              {/* Recent Activity Panel */}
              <RecentActivityPanel />

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
