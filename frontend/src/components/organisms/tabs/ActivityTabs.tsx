import React from 'react';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';

export default function ActivityTabs() {
  const activityEvents = [
    {
      id: '1',
      title: 'New assignment created for Class 8-A',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      time: '09:00 AM',
      location: 'Science',
      status: 'Completed',
    },
    {
      id: '2',
      title: 'Graded 15 assignments',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      time: '10:30 AM',
      location: 'Optional Mathematics',
      status: 'Completed',
    },
    {
      id: '3',
      title: 'Conducted lab session',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      time: '02:00 PM',
      location: 'Physics Lab',
      status: 'Completed',
    },
    {
      id: '4',
      title: 'Assignment deadline extended',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: '11:00 AM',
      location: 'Science',
      status: 'Completed',
    },
  ];

  return (
    <Panel
      variant='list-cards'
      title='Recent Activities'
      events={activityEvents}
      maxEvents={activityEvents.length}
    />
  );
}
