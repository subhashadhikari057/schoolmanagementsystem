'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import ParentNoticesTab from '@/components/organisms/tabs/ParentNoticesTab';
import { noticeService } from '@/api/services/notice.service';
import { PageLoader } from '@/components/atoms/loading';

export default function ParentNoticesPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mainLoading, setMainLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotices: 0,
    unreadNotices: 0,
    thisWeekNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  // Main page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMainLoading(false);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  // Fetch notice statistics
  useEffect(() => {
    const fetchNoticeStats = async () => {
      try {
        setLoading(true);

        // Fetch all notices for this parent
        const response = await noticeService.getMyNotices({
          limit: 100, // Get a large number to calculate stats
          page: 1,
        });

        if (response.success && response.data) {
          const notices = response.data.notices;

          // Calculate total notices
          const totalNotices = notices.length;

          // Calculate unread notices
          // For simplicity, count notices without any read receipt as unread
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

  if (mainLoading) {
    return <PageLoader />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='mb-8'>
          <SectionTitle
            text='School Notices'
            level={1}
            className='text-3xl font-bold text-gray-900 mb-2'
          />
          <Label className='text-lg text-gray-600'>
            View all important notices for parents and children
          </Label>
        </div>

        {/* Mobile search icon and input */}
        <div className='flex items-center gap-4 mb-6'>
          <div className='block md:hidden'>
            {!showSearch ? (
              <button
                aria-label='Open search'
                className='p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                onClick={() => setShowSearch(true)}
              >
                <FiSearch size={24} />
              </button>
            ) : (
              <input
                type='text'
                placeholder='Search notices...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='min-w-[180px] bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm'
                onBlur={() => setShowSearch(false)}
              />
            )}
          </div>
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
          <ParentNoticesTab
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
}
