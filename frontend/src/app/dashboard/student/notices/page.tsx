'use client';

import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import StudentNoticesTab from '@/components/organisms/tabs/StudentNoticesTab';
import { noticeService } from '@/api/services/notice.service';

export default function StudentNoticesPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stats, setStats] = useState({
    totalNotices: 0,
    unreadNotices: 0,
    thisWeekNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch notice statistics
  useEffect(() => {
    const fetchNoticeStats = async () => {
      try {
        setLoading(true);

        // Fetch all notices for this student
        const response = await noticeService.getMyNotices({
          limit: 100, // Get a large number to calculate stats
          page: 1,
        });

        if (response.success && response.data) {
          const notices = response.data.notices;

          // Calculate total notices
          const totalNotices = notices.length;

          // Calculate unread notices
          const unreadNotices = notices.filter(notice => {
            // Check if recipients exists and is an array before using .some()
            if (!notice.recipients || !Array.isArray(notice.recipients)) {
              return true; // Consider notices with no recipients array as unread
            }
            return !notice.recipients.some(r => r.readAt);
          }).length;

          // Calculate notices from this week
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
          startOfWeek.setHours(0, 0, 0, 0);

          const thisWeekNotices = notices.filter(
            notice => new Date(notice.publishDate) >= startOfWeek,
          ).length;

          setStats({
            totalNotices,
            unreadNotices,
            thisWeekNotices,
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='mb-8'>
          <SectionTitle
            text='My Notices'
            level={1}
            className='text-3xl font-bold text-gray-900 mb-2'
          />
          <Label className='text-lg text-gray-600'>
            View all important notices and announcements
          </Label>
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
                <Label className='text-sm text-gray-600 mb-1'>Unread</Label>
                <div className='text-2xl font-bold text-gray-900'>
                  {loading ? '...' : stats.unreadNotices}
                </div>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm text-gray-600 mb-1'>This Week</Label>
                <div className='text-2xl font-bold text-gray-900'>
                  {loading ? '...' : stats.thisWeekNotices}
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

        {/* Notices Tab */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold mb-6'>All Notices</h2>
          <StudentNoticesTab
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />
        </div>
      </div>
    </div>
  );
}
