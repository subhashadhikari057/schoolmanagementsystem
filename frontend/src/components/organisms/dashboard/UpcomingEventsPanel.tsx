import React from 'react';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import Icon from '@/components/atoms/display/Icon';

import { Calendar, MapPin, Clock } from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';

interface Event {
  id: string;
  title: string;
  date: string;
  endDate?: string; // For multi-day events
  time?: string;
  location?: string;
  status: string;
  type?: string; // event, exam, holiday
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
  viewAllHref?: string;
}

const formatDateBadge = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
  return { day, month };
};

const formatEventDetails = (event: Event) => {
  const parts: string[] = [];

  // Format date(s)
  if (event.endDate && event.endDate !== event.date) {
    // Multi-day event
    const startDate = new Date(event.date).toLocaleDateString();
    const endDate = new Date(event.endDate).toLocaleDateString();
    parts.push(`Date: ${startDate} - ${endDate}`);
  } else {
    // Single day event
    parts.push(`Date: ${new Date(event.date).toLocaleDateString()}`);
  }

  // Add time if available
  if (event.time && event.time.trim()) {
    parts.push(event.time);
  }

  // Add location if available
  if (event.location && event.location.trim()) {
    parts.push(event.location);
  }

  return parts.join(' • ');
};

const UpcomingEventsPanel: React.FC<UpcomingEventsPanelProps> = ({
  events,
  maxEvents = 10,
  variant = 'default',
  subjects,
  title,
  className,
  itemActionLabel = 'Learn More',
  viewAllHref,
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
    // Helper to get badge color and label
    const getTypeBadge = (type?: string) => {
      if (!type || type === 'event')
        return (
          <span className='inline-block text-xs px-2 py-1 rounded font-semibold bg-blue-100 text-blue-700 mr-2'>
            Event
          </span>
        );
      if (type === 'exam')
        return (
          <span className='inline-block text-xs px-2 py-1 rounded font-semibold bg-purple-100 text-purple-700 mr-2'>
            Exam
          </span>
        );
      if (type === 'holiday')
        return (
          <span className='inline-block text-xs px-2 py-1 rounded font-semibold bg-red-100 text-red-700 mr-2'>
            Holiday
          </span>
        );
      return null;
    };
    return (
      <div
        className={`bg-white rounded-xl p-4 border border-gray-200 ${className}`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='text-base font-semibold text-gray-900'>
            {title || 'Upcoming Events'}
          </div>
          <a
            className='text-xs text-blue-600 hover:text-blue-800 font-medium pt-4 sm:pt-0'
            href={viewAllHref || '#'}
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
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-medium text-gray-900 line-clamp-1'>
                  {ev.title}
                </span>
                {getTypeBadge(ev.type)}
              </div>
              <div className='text-xs text-gray-500 mb-3'>
                {formatEventDetails(ev)}
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
    <div
      className={`bg-white rounded-xl py-2 sm:p-4 min-h-[365px] ${className}`}
    >
      <ChartHeader title='Upcoming Events' toggleLabel='All' />

      <div className='space-y-0 px-2 max-h-80 overflow-y-auto modal-scrollbar'>
        {upcomingEvents.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Calendar className='w-12 h-12 mx-auto mb-3 opacity-30' />
            <p className='text-sm'>No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map((event, idx) => (
            <React.Fragment key={event.id}>
              <div className='flex items-start gap-4 group transition-all duration-200 hover:bg-blue-50/60 rounded-xl p-3 mb-0 shadow-sm'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <span className='text-base font-semibold text-gray-900 line-clamp-2'>
                      {event.title}
                    </span>
                    {event.type && (
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 shadow-sm ${
                          event.type === 'holiday'
                            ? 'bg-red-100 text-red-700'
                            : event.type === 'exam'
                              ? 'bg-purple-100 text-purple-700'
                              : event.type === 'emergency_closure'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {event.type.charAt(0).toUpperCase() +
                          event.type.slice(1).replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {/* Time/location left, status right, in a single row below title */}
                  <div className='flex items-center justify-between mt-1'>
                    <div className='flex gap-4'>
                      {event.type === 'holiday' ? null : (
                        <>
                          {event.type === 'event' || event.type === 'exam' ? (
                            <>
                              {event.time && (
                                <div className='flex items-center gap-1 text-xs text-gray-600 font-medium'>
                                  <Clock className='w-3 h-3 flex-shrink-0' />
                                  <span>{event.time}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className='flex items-center gap-1 text-xs text-gray-600 font-medium'>
                                  <MapPin className='w-3 h-3 flex-shrink-0' />
                                  <span className='line-clamp-1'>
                                    {event.location}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {event.time && (
                                <div className='text-xs text-gray-600 font-medium'>
                                  Time: {event.time}
                                </div>
                              )}
                              {event.location && (
                                <div className='text-xs text-gray-600 font-medium'>
                                  Location: {event.location}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 shadow-sm ${
                        event.status.toLowerCase() === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
              {idx < upcomingEvents.length - 1 && (
                <div className='border-b border-gray-200 mx-4' />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsPanel;
