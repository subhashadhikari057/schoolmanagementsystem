'use client';

import { useState, useEffect } from 'react';
import EventItem from '@/components/molecules/cards/EventItems';
import SectionHeader from '@/components/molecules/interactive/SectionHeader';
import { Event } from '@/types/EventTypes';

export default function UpcomingEvents({
  events,
  className,
}: {
  events: Event[];
  className?: string;
}) {
  const [filteredEvents, setFilteredEvents] = useState(events);

  // Update filtered events when events prop changes
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const handleFilterChange = (filter: string) => {
    setFilteredEvents(
      filter === 'All' ? events : events.filter(e => e.status === filter),
    );
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}
    >
      <SectionHeader
        title='Upcoming Events'
        actionText='View All'
        showFilter
        onFilterChange={handleFilterChange}
        onActionClick={() => console.log('View All')}
      />
      <div className='space-y-2'>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <EventItem key={event.id} event={event} />
          ))
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <p>No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
