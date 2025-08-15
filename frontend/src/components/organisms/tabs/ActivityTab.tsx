'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Bell, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  department: string;
  timeAgo: string;
  noticeTitle: string;
  type: 'published' | 'updated' | 'pinned' | 'archived';
}

export default function ActivityTab() {
  const activities: ActivityItem[] = [
    {
      id: '1',
      action: 'Published',
      department: 'Admin',
      timeAgo: '2 hours ago',
      noticeTitle: 'Sports Week 2025',
      type: 'published',
    },
    {
      id: '2',
      action: 'Updated',
      department: 'Academic Office',
      timeAgo: '5 hours ago',
      noticeTitle: 'Mid-term Schedule',
      type: 'updated',
    },
    {
      id: '3',
      action: 'Pinned',
      department: 'Librarian',
      timeAgo: '1 day ago',
      noticeTitle: 'Library Hours',
      type: 'pinned',
    },
    {
      id: '4',
      action: 'Archived',
      department: 'Science Dept',
      timeAgo: '2 days ago',
      noticeTitle: 'Science Fair Results',
      type: 'archived',
    },
    {
      id: '5',
      action: 'Published',
      department: 'Health Office',
      timeAgo: '3 days ago',
      noticeTitle: 'COVID-19 Guidelines',
      type: 'published',
    },
    {
      id: '6',
      action: 'Updated',
      department: 'Sports Committee',
      timeAgo: '1 week ago',
      noticeTitle: 'Annual Sports Day',
      type: 'updated',
    },
  ];

  const getActionColor = (type: string) => {
    switch (type) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'updated':
        return 'bg-blue-100 text-blue-700';
      case 'pinned':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'published':
        return '📢';
      case 'updated':
        return '✏️';
      case 'pinned':
        return '📌';
      case 'archived':
        return '📁';
      default:
        return '📋';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Recent Activity'
            level={3}
            className='text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600'>
            Track recent changes and activities related to notices
          </Label>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Clock className='w-4 h-4' />
          <span>{activities.length} activities</span>
        </div>
      </div>

      {/* Activity List */}
      <div className='bg-white rounded-xl border border-gray-200 shadow-sm'>
        <div className='p-6'>
          <div className='space-y-4'>
            {activities.map(activity => (
              <div
                key={activity.id}
                className='flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-lg'>
                      {getActionIcon(activity.type)}
                    </span>
                  </div>
                  <div>
                    <div className='flex items-center gap-3 mb-1'>
                      <span className='font-medium text-gray-900'>
                        {activity.action}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full`}
                      >
                        {activity.department}
                      </span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      <span className='text-gray-500'>
                        "{activity.noticeTitle}"
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <Clock className='w-4 h-4' />
                  <span>{activity.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Bell className='w-8 h-8 text-gray-400' />
          </div>
          <Label className='text-gray-500 text-lg'>No recent activity</Label>
          <Label className='text-gray-400'>
            Activity will appear here as notices are created and modified
          </Label>
        </div>
      )}
    </div>
  );
}
