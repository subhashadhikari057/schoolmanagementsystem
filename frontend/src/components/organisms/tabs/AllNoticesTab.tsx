'use client';

import React, { useMemo, useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { Edit, Eye, Bell } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  audience: 'all' | 'students' | 'parents' | 'teachers';
  author: string;
  date: string;
  views: number;
  isPinned: boolean;
}

export default function AllNoticesTab() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<
    | 'all'
    | 'event'
    | 'academic'
    | 'general'
    | 'meeting'
    | 'announcement'
    | 'health'
  >('all');

  const notices: Notice[] = [
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
      isPinned: false,
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
      isPinned: false,
    },
    {
      id: '3',
      title: 'Library Hours Extended',
      content:
        'Due to upcoming examinations, library hours have been extended. New timings: Monday to Friday 8:00 AM - 8:00 PM, Saturday 9:00 AM - 5:00 PM.',
      category: 'general',
      priority: 'medium',
      audience: 'all',
      author: 'Librarian',
      date: '8/5/2025',
      views: 156,
      isPinned: false,
    },
    {
      id: '4',
      title: 'Parent-Teacher Meeting',
      content:
        'Monthly Parent-Teacher meeting scheduled for August 22nd at 3:00 PM. Please confirm your attendance by August 20th.',
      category: 'meeting',
      priority: 'medium',
      audience: 'parents',
      author: 'Admin',
      date: '8/3/2025',
      views: 134,
      isPinned: false,
    },
    {
      id: '5',
      title: 'Science Fair Winners Announced',
      content:
        'Congratulations to all participants in the Science Fair 2025. Winners have been announced. Please check the notice board for results.',
      category: 'announcement',
      priority: 'low',
      audience: 'students',
      author: 'Science Dept',
      date: '7/30/2025',
      views: 98,
      isPinned: false,
    },
    {
      id: '6',
      title: 'New COVID-19 Safety Guidelines',
      content:
        'Updated safety guidelines for the new academic year. Mandatory masks in indoor areas, regular sanitization, and social distancing protocols.',
      category: 'health',
      priority: 'high',
      audience: 'all',
      author: 'Health Office',
      date: '7/25/2025',
      views: 367,
      isPinned: false,
    },
  ];

  const filteredNotices = useMemo(() => {
    return notices.filter(notice => {
      const matchesQuery =
        notice.title.toLowerCase().includes(query.toLowerCase()) ||
        notice.content.toLowerCase().includes(query.toLowerCase()) ||
        notice.author.toLowerCase().includes(query.toLowerCase());

      const matchesType =
        typeFilter === 'all' || notice.category === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [notices, query, typeFilter]);

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
      {/* Search and Filters */}
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            type='search'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search notices...'
            className='w-full bg-white'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                />
              </svg>
            }
          />
        </div>
        <div className='flex items-center gap-2'>
          <Dropdown
            type='filter'
            title='Filter Type'
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'event', label: 'Event' },
              { value: 'academic', label: 'Academic' },
              { value: 'general', label: 'General' },
              { value: 'meeting', label: 'Meeting' },
              { value: 'announcement', label: 'Announcement' },
              { value: 'health', label: 'Health' },
            ]}
            selectedValue={typeFilter}
            onSelect={value => setTypeFilter(value as any)}
            className='max-w-xs'
          />
        </div>
      </div>

      {/* Notices List */}
      <div className='space-y-4'>
        {filteredNotices.map(notice => (
          <div
            key={notice.id}
            className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
          >
            <div className='flex items-start justify-between mb-4'>
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
                    <span>{notice.date}</span>
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
      {filteredNotices.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Bell className='w-8 h-8 text-gray-400' />
          </div>
          <Label className='text-gray-500 text-lg'>No notices found</Label>
          <Label className='text-gray-400'>
            Try adjusting your search or filter criteria
          </Label>
        </div>
      )}
    </div>
  );
}
