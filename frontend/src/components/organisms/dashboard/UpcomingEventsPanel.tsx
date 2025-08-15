import React from 'react';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import Icon from '@/components/atoms/display/Icon';

import { Calendar, MapPin, Clock } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
}

type SubjectItem = {
  id: string;
  label: string;
  code?: string;
  icon: React.ElementType;
};

interface UpcomingEventsPanelProps {
  events?: Event[];
  maxEvents?: number;
  variant?: 'default' | 'list-cards' | 'subjects';
  subjects?: SubjectItem[];
  title?: string;
  className?: string;
  itemActionLabel?: string;
}

const formatDateBadge = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
  return { day, month };
};

const UpcomingEventsPanel: React.FC<UpcomingEventsPanelProps> = ({
  events,
  maxEvents = 10,
  variant = 'default',
  subjects,
  title,
  className,
  itemActionLabel = 'Learn More',
}) => {
  // Mock data for upcoming events
  const mockUpcomingEvents: Event[] = [
    {
      id: '1',
      title: 'Parent-Teacher Conference',
      date: '2025-08-15',
      time: '09:00 AM',
      location: 'Main Auditorium',
      status: 'Scheduled',
    },
    {
      id: '2',
      title: 'Annual Sports Day',
      date: '2025-08-20',
      time: '08:00 AM',
      location: 'Sports Ground',
      status: 'Active',
    },
    {
      id: '3',
      title: 'Science Fair Exhibition',
      date: '2025-08-25',
      time: '10:00 AM',
      location: 'Science Lab',
      status: 'Scheduled',
    },
    {
      id: '4',
      title: 'Mid-Term Examinations',
      date: '2025-09-01',
      time: '09:00 AM',
      location: 'All Classrooms',
      status: 'Scheduled',
    },
    {
      id: '5',
      title: 'Cultural Program',
      date: '2025-09-05',
      time: '02:00 PM',
      location: 'Main Hall',
      status: 'Active',
    },
    {
      id: '6',
      title: 'Staff Meeting',
      date: '2025-08-18',
      time: '03:30 PM',
      location: 'Conference Room',
      status: 'Scheduled',
    },
  ];

  const eventList = events || mockUpcomingEvents;

  // For list-cards variant (activities), show all events without date filtering
  // For other variants, filter to only upcoming events
  const upcomingEvents =
    variant === 'list-cards'
      ? eventList.slice(0, maxEvents)
      : eventList
          .filter(event => new Date(event.date) >= new Date())
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )
          .slice(0, maxEvents);

  if (variant === 'list-cards') {
    return (
      <div
        className={`bg-white rounded-xl p-4 border border-gray-200 ${className}`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='text-base font-semibold text-gray-900'>
            {title || 'Upcoming Events'}
          </div>
          <a
            className='text-xs text-blue-600 hover:text-blue-800 font-medium'
            href='#'
          >
            View All
          </a>
        </div>
        <div className='space-y-3'>
          {upcomingEvents.map(ev => (
            <div
              key={ev.id}
              className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
            >
              <div className='text-sm font-medium text-gray-900 mb-1 line-clamp-1'>
                {ev.title}
              </div>
              <div className='text-xs text-gray-500 mb-3'>
                Date: {new Date(ev.date).toLocaleDateString()} • {ev.time} •{' '}
                {ev.location}
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-500'>
                  Status: {ev.status}
                </span>
                <Button
                  className='px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-xs font-medium'
                  label={itemActionLabel}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'subjects') {
    const subjectList: SubjectItem[] = subjects || [
      {
        id: 'sub-1',
        label: 'Science',
        icon: Calendar, // placeholder icon
      },
    ];

    // Default classes for icon chip (always blue theme)
    const defaultClasses = { text: 'text-blue-600', bg: 'bg-blue-50' };

    return (
      <div
        className={`bg-white rounded-xl p-4 border border-gray-200 ${className}`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='text-base font-semibold text-gray-900'>
            {title || 'Assigned Subjects'}
          </div>
          <a
            className='text-xs text-blue-600 hover:text-blue-800 font-medium'
            href='#'
          >
            View All
          </a>
        </div>
        <div className='space-y-3'>
          {subjectList.map(sub => {
            const classes = defaultClasses;
            const RightIcon = sub.icon;
            // Always blue shades for waves
            const waveA = 'bg-blue-200';
            const waveB = 'bg-blue-300';
            return (
              <div
                key={sub.id}
                className='relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
              >
                {/* Decorative wavy corner using overlapping circles */}
                <div className='pointer-events-none absolute inset-0 -z-0'>
                  <div
                    className={`absolute -right-10 -top-12 w-40 h-40 rounded-full opacity-40 ${waveA}`}
                  />
                  <div
                    className={`absolute -right-20 -top-6 w-56 h-56 rounded-full opacity-30 ${waveB}`}
                  />
                  <div
                    className={`absolute -right-24 -bottom-16 w-72 h-32 rounded-[999px] rotate-[-15deg] opacity-25 ${waveB}`}
                  />
                </div>
                <div className='relative z-10 flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='text-sm font-medium text-gray-900'>
                      {sub.label}
                    </div>
                    {sub.code && (
                      <div className='text-xs text-gray-500 mt-0.5'>
                        {sub.code}
                      </div>
                    )}
                  </div>
                  <Icon
                    className={`w-8 h-8 ${classes.bg} ${classes.text} flex items-center justify-center`}
                  >
                    <RightIcon className='w-4 h-4' />
                  </Icon>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl sm:p-4 ${className}`}>
      <ChartHeader title='Upcoming Events' toggleLabel='All' />

      <div className='space-y-4 max-h-80 overflow-y-auto modal-scrollbar'>
        {upcomingEvents.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Calendar className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map(event => {
            const { day, month } = formatDateBadge(event.date);

            return (
              <div key={event.id} className='flex items-start gap-4'>
                <div className='flex-shrink-0 text-center'>
                  <div className='text-2xl font-bold text-blue-600'>{day}</div>
                  <div className='text-xs text-gray-500 font-medium'>
                    {month}
                  </div>
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2 mb-1'>
                    <h4 className='text-sm font-semibold text-gray-900 line-clamp-2'>
                      {event.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        event.status.toLowerCase() === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex items-center gap-1 text-xs text-gray-600'>
                      <Clock className='w-3 h-3 flex-shrink-0' />
                      <span>{event.time}</span>
                    </div>

                    <div className='flex items-center gap-1 text-xs text-gray-600'>
                      <MapPin className='w-3 h-3 flex-shrink-0' />
                      <span className='line-clamp-1'>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsPanel;
