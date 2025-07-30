"use client";

import { useState } from 'react';
import EventItem from '../molecules/EventItems'
import SectionHeader from '../molecules/SectionHeader';
import { Event } from '@/types/EventTypes';

export default function UpcomingEvents({ events,className }: { events: Event[] , className?: string}) {
  const [filteredEvents, setFilteredEvents] = useState(events);

  const handleFilterChange = (filter: string) => {
    setFilteredEvents(filter === 'All' ? events : events.filter(e => e.status === filter));
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <SectionHeader
        title="Upcoming Events"
        actionText="View All"
        showFilter
        onFilterChange={handleFilterChange}
        onActionClick={() => console.log('View All')}
      />
      <div className="space-y-2">
        {filteredEvents.map(event => <EventItem key={event.id} event={event} />)}
      </div>
    </div>
  );
}