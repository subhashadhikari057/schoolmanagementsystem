import React from 'react';
import Panel from '@/components/organisms/dashboard/UpcomingEventsPanel';

export default function DeadlinesTabs() {
  const deadlineEvents = [
    {
      id: '1',
      title: 'Railway Essay',
      date: '2025-08-15',
      time: '11:59 PM',
      location: 'Science',
      status: 'Due Soon',
    },
    {
      id: '2',
      title: 'Coordinate Geometry',
      date: '2025-08-18',
      time: '11:59 PM',
      location: 'Optional Mathematics',
      status: 'Due Soon',
    },
    {
      id: '3',
      title: 'Lab Report',
      date: '2025-08-20',
      time: '11:59 PM',
      location: 'Physics Lab',
      status: 'Due Soon',
    },
  ];

  return (
    <Panel
      variant='list-cards'
      title='Upcoming Assignment Deadlines'
      events={deadlineEvents}
      maxEvents={deadlineEvents.length}
    />
  );
}
