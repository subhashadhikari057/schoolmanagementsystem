'use client'

import React from 'react';
import GenericList from '@/components/templates/GenericList';
import { getListConfig, Parent } from '@/components/templates/listConfigurations';
import Statsgrid from "@/components/organisms/dashboard/Statsgrid";
import ShortcutsPanel from "@/components/organisms/dashboard/ShortcutsPanel";
import { Users, UserCheck, Phone, Mail } from 'lucide-react';
import AcademicStatsPanel from "@/components/organisms/dashboard/AcademicStatsPanel";
import RecentActivityPanel from "@/components/organisms/dashboard/RecentActivityPanel";

const ParentsPage = () => {
  // Parent-specific stats data
  const parentStats = [
    {
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      value: "120",
      label: "Total Parents",
      change: "2.1%",
      isPositive: true
    },
    {
      icon: UserCheck,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      value: "115",
      label: "Active Parents",
      change: "1.5%",
      isPositive: true
    },
    {
      icon: Phone,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      value: "3",
      label: "Pending Verification",
      change: "8.2%",
      isPositive: false
    },
    {
      icon: Mail,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      value: "2",
      label: "Inactive",
      change: "0.5%",
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
  const handleAddParent = () => {
    console.log('Add Parent clicked');
  };

  const handleBulkImport = () => {
    console.log('Bulk Import clicked');
  };

  const handleGenerateReports = () => {
    console.log('Generate Reports clicked');
  };

  const handleSendNotifications = () => {
    console.log('Send Notifications clicked');
  };

  // Sample parent data
  const parentsData: Parent[] = [
    {
      id: 1,
      name: "Robert Johnson",
      linkedStudents: ["Sarah Johnson"],
      contact: "+1-555-0123",
      accountStatus: "Active"
    },
    {
      id: 2,
      name: "Wei Chen",
      linkedStudents: ["Michael Chen"],
      contact: "+1-555-0456",
      accountStatus: "Active"
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      linkedStudents: ["Emily Rodriguez", "Carlos Rodriguez"],
      contact: "+1-555-0789",
      accountStatus: "Pending"
    },
    {
      id: 4,
      name: "James Williams",
      linkedStudents: ["David Williams"],
      contact: "+1-555-0321",
      accountStatus: "Active"
    },
    {
      id: 5,
      name: "Raj Patel",
      linkedStudents: ["Sophia Patel"],
      contact: "+1-555-0654",
      accountStatus: "Inactive"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">Manage All Parent Related Info Here</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6">
        <div className="max-w-7xl mx-auto">
          <Statsgrid stats={parentStats} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6 mr-4 lg:mr-0">
              
              {/* Parent List - Now using Generic List */}
              <GenericList<Parent>
                config={getListConfig('parents')}
                data={parentsData}
                currentPage={1}
                totalPages={12}
                totalItems={120}
                itemsPerPage={10}
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
                  onAssignSubject={handleAddParent}
                  onAssignFaculty={handleBulkImport}
                  onComplainBox={handleGenerateReports}
                  onDownloadBulkData={handleSendNotifications}
                  labels={{
                    assignSubject: "Add New Parent",
                    assignFaculty: "Bulk Import",
                    complainBox: "Generate Reports",
                    downloadBulkData: "Send Notifications"
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

export default ParentsPage;
