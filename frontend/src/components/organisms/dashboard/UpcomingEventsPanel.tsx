import React from 'react';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import Icon from '@/components/atoms/display/Icon';
import Label from '@/components/atoms/display/Label';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
}

interface UpcomingEventsPanelProps {
  events?: Event[];
  maxEvents?: number;
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
  const upcomingEvents = eventList
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents);

  return (
    <div className='bg-white rounded-xl sm:p-4'>
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
                {/* Date Badge */}
                <div className='flex-shrink-0 text-center'>
                  <div className='text-2xl font-bold text-blue-600'>{day}</div>
                  <div className='text-xs text-gray-500 font-medium'>
                    {month}
                  </div>
                </div>

                {/* Event Details */}
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
