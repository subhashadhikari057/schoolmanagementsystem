'use client'

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import { getListConfig, Staff } from '@/components/templates/listConfigurations';
import Statsgrid from "@/components/organisms/dashboard/Statsgrid";
import ShortcutsPanel from "@/components/organisms/dashboard/ShortcutsPanel";
import { Users, UserCheck, Clock, Building } from 'lucide-react';
import AcademicStatsPanel from "@/components/organisms/dashboard/AcademicStatsPanel";
import RecentActivityPanel from "@/components/organisms/dashboard/RecentActivityPanel";

const StaffPage = () => {
  // Staff-specific stats data
  const staffStats = [
    {
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      value: "32",
      label: "Total Staff",
      change: "1.5%",
      isPositive: true
    },
    {
      icon: UserCheck,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      value: "30",
      label: "Active Staff",
      change: "2.1%",
      isPositive: true
    },
    {
      icon: Clock,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      value: "1",
      label: "On Leave",
      change: "0.5%",
      isPositive: false
    },
    {
      icon: Building,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      value: "1",
      label: "Inactive",
      change: "0.3%",
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
  const handleAddStaff = () => {
    console.log('Add Staff clicked');
  };

  const handleBulkImport = () => {
    console.log('Bulk Import clicked');
  };

  const handleGenerateReports = () => {
    console.log('Generate Reports clicked');
  };

  const handleManageShifts = () => {
    console.log('Manage Shifts clicked');
  };

  // Sample staff data
  const staffData: Staff[] = [
    {
      id: 1,
      name: "John Administrator",
      department: "Administration",
      position: "Admin Assistant",
      status: "Active"
    },
    {
      id: 2,
      name: "Mary Cleaner",
      department: "Maintenance",
      position: "Cleaner",
      status: "Active"
    },
    {
      id: 3,
      name: "David Librarian",
      department: "Library",
      position: "Head Librarian",
      status: "On Leave"
    },
    {
      id: 4,
      name: "Susan Cook",
      department: "Canteen",
      position: "Head Chef",
      status: "Active"
    },
    {
      id: 5,
      name: "Mike Security",
      department: "Administration",
      position: "Security Guard",
      status: "Inactive"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Manage All Staff Related Info Here</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          <Statsgrid stats={staffStats} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6 mr-4 lg:mr-0">
              
              {/* Staff List - Now using Generic List */}
              <GenericList<Staff>
                config={getListConfig('staff')}
                data={staffData}
                currentPage={1}
                totalPages={7}
                totalItems={32}
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
                  onAssignSubject={handleAddStaff}
                  onAssignFaculty={handleBulkImport}
                  onComplainBox={handleGenerateReports}
                  onDownloadBulkData={handleManageShifts}
                  labels={{
                    assignSubject: "Add New Staff",
                    assignFaculty: "Bulk Import",
                    complainBox: "Generate Reports",
                    downloadBulkData: "Manage Shifts"
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

export default StaffPage;
