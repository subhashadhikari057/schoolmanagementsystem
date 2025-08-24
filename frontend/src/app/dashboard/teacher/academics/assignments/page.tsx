'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Plus, BookOpen, Users, Clock, CheckCircle } from 'lucide-react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import AllAssignmentsTab from '@/components/organisms/tabs/AllAssignmentsTab';
import SubmissionsTab from '@/components/organisms/tabs/SubmissionsTab';
import GradingTab from '@/components/organisms/tabs/GradingTab';
import DeadlinesTab from '@/components/organisms/tabs/DeadlinesTab';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import CreateAssignmentModal from '@/components/organisms/modals/CreateAssignmentModal';
import { assignmentService } from '@/api/services/assignment.service';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { AssignmentStats } from '@/api/types/assignment';
import { toast } from 'sonner';
import { PageLoader } from '@/components/atoms/loading';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const loadAssignmentStats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get the teacher record to get teacher ID
      const teacherResponse = await teacherService.getCurrentTeacher();
      const teacherId = teacherResponse.data.id;

      const response = await assignmentService.getAssignmentStats(teacherId);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load assignment stats:', error);
      setError('Failed to load assignment statistics');
      // Set default stats on error
      setStats({
        totalAssignments: 0,
        completedAssignments: 0,
        upcomingAssignments: 0,
        overdueAssignments: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        gradedSubmissions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load assignment statistics
  useEffect(() => {
    loadAssignmentStats();
  }, [loadAssignmentStats]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAssignmentCreated = () => {
    // Show success toast
    toast.success('Assignment created successfully!', {
      description: 'Your assignment has been created and assigned to students.',
    });

    // Refresh stats and assignments list
    loadAssignmentStats();
    setRefreshTrigger(prev => prev + 1);
  };

  // Transform stats data for Statsgrid component
  const statsData = stats
    ? [
        {
          value: stats.totalAssignments.toString(),
          label: 'Total Assignments',
          change: `${stats.completedAssignments} completed, ${stats.upcomingAssignments} upcoming`,
          color: 'bg-blue-600',
          icon: BookOpen,
        },
        {
          value: stats.totalSubmissions.toString(),
          label: 'Total Submissions',
          change: `${stats.gradedSubmissions} graded, ${stats.pendingSubmissions} pending`,
          color: 'bg-green-600',
          icon: Users,
        },
        {
          value: stats.upcomingAssignments.toString(),
          label: 'Upcoming Assignments',
          change:
            stats.overdueAssignments > 0
              ? `${stats.overdueAssignments} overdue`
              : 'On track',
          color: 'bg-yellow-600',
          icon: Clock,
        },
        {
          value: `${Math.round((stats.gradedSubmissions / Math.max(stats.totalSubmissions, 1)) * 100)}%`,
          label: 'Grading Progress',
          change: `${stats.gradedSubmissions}/${stats.totalSubmissions} submissions`,
          color: 'bg-purple-600',
          icon: CheckCircle,
        },
      ]
    : [];

  if (mainLoading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
          <div className='flex-1'>
            <SectionTitle
              text='Assignments'
              level={1}
              className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'
            />
            <Label className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
              Manage school assignments and communicate with students here!
            </Label>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center'
          >
            <Plus className='w-4 h-4' />
            <span>New Assignment</span>
          </Button>
        </div>
      </div>
      <div className='px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Loading State */}
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>
                Loading assignment data...
              </span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <p className='text-red-600 mb-2'>{error}</p>
                <Button
                  onClick={loadAssignmentStats}
                  className='text-blue-600 hover:text-blue-700'
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Top metrics via Statsgrid solid variant */}
              <Statsgrid
                variant='solid'
                stats={statsData.map(s => ({
                  icon: s.icon,
                  bgColor: s.color,
                  iconColor: 'text-white',
                  value: s.value,
                  label: s.label,
                  change: s.change,
                  isPositive: true,
                }))}
              />

              {/* Tabs */}
              <Tabs
                tabs={[
                  {
                    name: 'All',
                    content: (
                      <AllAssignmentsTab
                        refreshTrigger={refreshTrigger}
                        statusFilter='all'
                      />
                    ),
                  },
                  { name: 'Submissions', content: <SubmissionsTab /> },
                  { name: 'Grading', content: <GradingTab /> },
                  { name: 'Deadlines', content: <DeadlinesTab /> },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleAssignmentCreated}
      />
    </div>
  );
}
