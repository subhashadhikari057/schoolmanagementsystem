'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { Bell, Star } from 'lucide-react';

interface PinnedNotice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  audience: 'all' | 'students' | 'parents' | 'teachers';
  author: string;
  date: string;
  views: number;
  pinnedDate: string;
}

export default function PinnedTab() {
  const pinnedNotices: PinnedNotice[] = [
    {
      id: '1',
      title: 'Sports Week 2025 - Registration Open',
      content:
        'Dear Students, Registration for Sports Week 2025 is now open. Please submit your forms by August 20th. Various events including football, basketball, athletics, and more.',
      category: 'event',
      priority: 'high',
      audience: 'all',
      author: 'Sports Committee',
      date: '8/10/2025',
      views: 245,
      pinnedDate: '8/11/2025',
    },
    {
      id: '2',
      title: 'Mid-term Examination Schedule',
      content:
        'The mid-term examinations will commence from August 25th. Please refer to the attached schedule for detailed timing and venue information.',
      category: 'academic',
      priority: 'high',
      audience: 'students',
      author: 'Academic Office',
      date: '8/8/2025',
      views: 189,
      pinnedDate: '8/9/2025',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'event':
        return 'bg-blue-100 text-blue-700';
      case 'academic':
        return 'bg-purple-100 text-purple-700';
      case 'general':
        return 'bg-gray-100 text-gray-700';
      case 'meeting':
        return 'bg-indigo-100 text-indigo-700';
      case 'announcement':
        return 'bg-pink-100 text-pink-700';
      case 'health':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'bg-gray-100 text-gray-700';
      case 'students':
        return 'bg-blue-100 text-blue-700';
      case 'parents':
        return 'bg-green-100 text-green-700';
      case 'teachers':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Pinned Notices'
            level={3}
            className='text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600'>
            Important notices that have been pinned for easy access
          </Label>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <Star className='w-4 h-4 text-yellow-500' />
          <span>{pinnedNotices.length} pinned notices</span>
        </div>
      </div>

      {/* Pinned Notices List */}
      <div className='space-y-4'>
        {pinnedNotices.map(notice => (
          <div
            key={notice.id}
            className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm relative'
          >
            {/* Pinned Badge */}
            <div className='absolute top-4 right-4'>
              <div className='bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                <Star className='w-3 h-3' />
                Pinned
              </div>
            </div>

            <div className='flex items-start justify-between mb-4 pr-20'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-3'>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(notice.category)}`}
                  >
                    {notice.category}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}
                  >
                    {notice.priority}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getAudienceColor(notice.audience)}`}
                  >
                    {notice.audience}
                  </span>
                </div>

                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {notice.title}
                </h3>
                <p className='text-gray-600 mb-4'>{notice.content}</p>

                <div className='flex items-center gap-6 text-sm text-gray-600 mb-4'>
                  <div className='flex items-center gap-2'>
                    <Bell className='w-4 h-4' />
                    <span>By {notice.author}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span>Published: {notice.date}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span>Pinned: {notice.pinnedDate}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span>{notice.views} views</span>
                  </div>
                </div>
              </div>

              <div className='flex gap-3'>
                <Button
                  label='Edit'
                  className='bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200'
                />
                <Button
                  label='View Full'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pinnedNotices.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Star className='w-8 h-8 text-gray-400' />
          </div>
          <Label className='text-gray-500 text-lg'>No pinned notices</Label>
          <Label className='text-gray-400'>
            Pin important notices to keep them easily accessible
          </Label>
        </div>
      )}
    </div>
  );
}
