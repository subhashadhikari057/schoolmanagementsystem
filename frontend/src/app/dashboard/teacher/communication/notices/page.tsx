'use client';

import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Plus } from 'lucide-react';
import TeacherNoticesTab from '@/components/organisms/tabs/TeacherNoticesTab';
import CreateNoticeModal from '@/components/organisms/modals/CreateNoticeModal';
import { noticeService } from '@/api/services/notice.service';
import { PageLoader } from '@/components/atoms/loading';

export default function NoticesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mainLoading, setMainLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotices: 0,
    activeNotices: 0,
    thisMonthNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  // Fetch notice statistics
  useEffect(() => {
    const fetchNoticeStats = async () => {
      try {
        setLoading(true);

        // Fetch all notices for this teacher
        const response = await noticeService.getMyNotices({
          limit: 100, // Get a large number to calculate stats
          page: 1,
        });

        if (response.success && response.data) {
          const notices = response.data.notices;

          // Calculate total notices (only count notices for teachers or all)
          const totalNotices = notices.length;

          // Calculate active notices (not expired and published)
          const now = new Date();
          const activeNotices = notices.filter(
            notice =>
              new Date(notice.expiryDate) > now &&
              notice.status === 'PUBLISHED',
          ).length;

          // Calculate notices created this month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const thisMonthNotices = notices.filter(notice => {
            const noticeDate = new Date(notice.publishDate);
            return (
              noticeDate.getMonth() === currentMonth &&
              noticeDate.getFullYear() === currentYear
            );
          }).length;

          setStats({
            totalNotices,
            activeNotices,
            thisMonthNotices,
          });
        }
      } catch (error) {
        console.error('Error fetching notice stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeStats();

    // Listen for refresh events
    const handleRefresh = () => {
      fetchNoticeStats();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('notices:refresh', handleRefresh);
      return () => {
        window.removeEventListener('notices:refresh', handleRefresh);
      };
    }
  }, []);

  if (mainLoading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <SectionTitle
              text='Notices & Announcements'
              level={1}
              className='text-3xl font-bold text-gray-900 mb-2'
            />
            <Label className='text-lg text-gray-600'>
              Manage school notices and communicate with students
            </Label>
          </div>
          <Button
            label='Create Notice'
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2'
          >
            <Plus className='w-4 h-4' />
            <span>Create Notice</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>
                  Total Notices
                </Label>
                <div className='text-2xl font-bold text-gray-900'>
                  {loading ? '...' : stats.totalNotices}
                </div>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 17h5l-5 5v-5z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>Active</Label>
                <div className='text-2xl font-bold text-gray-900'>
                  {loading ? '...' : stats.activeNotices}
                </div>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>This Month</Label>
                <div className='text-2xl font-bold text-gray-900'>
                  {loading ? '...' : stats.thisMonthNotices}
                </div>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* All Notices */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold mb-6'>All Notices</h2>
          <TeacherNoticesTab />
        </div>

        {/* Create Notice Modal */}
        {isCreateModalOpen && (
          <CreateNoticeModal
            open={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              // Trigger a refresh event that our component listens to
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('notices:refresh'));
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
