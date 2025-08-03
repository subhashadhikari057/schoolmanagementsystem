'use client'

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import { getListConfig, Student } from '@/components/templates/listConfigurations';
import Statsgrid from "@/components/organisms/dashboard/Statsgrid";
import ShortcutsPanel from "@/components/organisms/dashboard/ShortcutsPanel";
import { Users, UserCheck, AlertCircle, GraduationCap } from 'lucide-react';
import AcademicStatsPanel from "@/components/organisms/dashboard/AcademicStatsPanel";
import RecentActivityPanel from "@/components/organisms/dashboard/RecentActivityPanel";

const StudentsPage = () => {
  // Student-specific stats data
  const studentStats = [
    {
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      value: "156",
      label: "Total Students",
      change: "3.1%",
      isPositive: true
    },
    {
      icon: UserCheck,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      value: "152",
      label: "Active Students",
      change: "1.8%",
      isPositive: true
    },
    {
      icon: AlertCircle,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      value: "3",
      label: "Students on Warning",
      change: "5.2%",
      isPositive: false
    },
    {
      icon: GraduationCap,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      value: "1",
      label: "Suspended Students",
      change: "2.1%",
      isPositive: false
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
  const handleAddStudent = () => {
    console.log('Add Student clicked');
  };

  const handleBulkImport = () => {
    console.log('Bulk Import clicked');
  };

  const handleGenerateReports = () => {
    console.log('Generate Reports clicked');
  };

  const handleManageGrades = () => {
    console.log('Manage Grades clicked');
  };

  // Sample student data
  const studentsData: Student[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      rollNo: "2023001",
      class: "Class 5-A",
      parent: "Robert Johnson",
      status: "Active"
    },
    {
      id: 2,
      name: "Michael Chen",
      rollNo: "2023002",
      class: "Class 4-B",
      parent: "Wei Chen",
      status: "Active"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      rollNo: "2023003",
      class: "Class 5-A",
      parent: "Maria Rodriguez",
      status: "Suspended"
    },
    {
      id: 4,
      name: "David Williams",
      rollNo: "2023004",
      class: "Class 3-C",
      parent: "James Williams",
      status: "Active"
    },
    {
      id: 5,
      name: "Sophia Patel",
      rollNo: "2023005",
      class: "Class 4-A",
      parent: "Raj Patel",
      status: "Warning"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Manage All Student Related Info Here</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          <Statsgrid stats={studentStats} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-5">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6 mr-4 lg:mr-0">
              
              {/* Student List - Now using Generic List */}
              <GenericList<Student>
                config={getListConfig('students')}
                data={studentsData}
                currentPage={1}
                totalPages={32}
                totalItems={156}
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
                  onAssignSubject={handleAddStudent}
                  onAssignFaculty={handleBulkImport}
                  onComplainBox={handleGenerateReports}
                  onDownloadBulkData={handleManageGrades}
                  labels={{
                    assignSubject: "Add New Student",
                    assignFaculty: "Bulk Import",
                    complainBox: "Generate Reports",
                    downloadBulkData: "Manage Grades"
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

export default StudentsPage;
