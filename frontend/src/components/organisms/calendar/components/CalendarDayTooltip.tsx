import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { CalendarEvent } from '../types/calendar.types';

interface CalendarDayTooltipProps {
  isVisible: boolean;
  position: { x: number; y: number };
  date: string;
  events: CalendarEvent[];
}

export default function CalendarDayTooltip({
  isVisible,
  position,
  date,
  events,
}: CalendarDayTooltipProps) {
  if (!isVisible || events.length === 0) return null;

  // Convert 24-hour time to 12-hour format
  const convertTo12HourFormat = (time: string): string => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    const colors = {
      holiday: 'bg-red-100 text-red-700 border-red-200',
      event: 'bg-blue-100 text-blue-700 border-blue-200',
      exam: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return (
      colors[type.toLowerCase() as keyof typeof colors] ||
      'bg-gray-100 text-gray-700 border-gray-200'
    );
  };

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return '🎉';
      case 'exam':
        return '📝';
      case 'event':
        return '🎪';
      default:
        return '📅';
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className='fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs'
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      {/* Header */}
      <div className='flex items-center gap-2 mb-2 pb-2 border-b border-gray-100'>
        <Calendar className='w-4 h-4 text-blue-600' />
        <div>
          <h3 className='text-sm font-semibold text-gray-900'>
            {formatDate(date)}
          </h3>
          <p className='text-xs text-gray-500'>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className='space-y-2'>
        {events.slice(0, 3).map((event, index) => (
          <div key={`${event.id}-${index}`} className='flex items-start gap-2'>
            <span className='text-sm'>{getEventIcon(event.type)}</span>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1 mb-1'>
                <span className='text-xs font-medium text-gray-900 truncate'>
                  {event.name || event.title || 'Untitled Event'}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full border ${getEventTypeColor(event.type)}`}
                >
                  {event.type}
                </span>
              </div>

              {/* Time */}
              {(event.startTime || event.endTime || event.time) && (
                <div className='flex items-center gap-1 text-xs text-gray-600'>
                  <Clock className='w-3 h-3' />
                  <span>
                    {event.startTime && event.endTime
                      ? `${convertTo12HourFormat(event.startTime)} - ${convertTo12HourFormat(event.endTime)}`
                      : event.time
                        ? convertTo12HourFormat(event.time)
                        : event.startTime
                          ? convertTo12HourFormat(event.startTime)
                          : ''}
                  </span>
                </div>
              )}

              {/* Location */}
              {(event.venue || event.location) && (
                <div className='flex items-center gap-1 text-xs text-gray-600'>
                  <MapPin className='w-3 h-3' />
                  <span className='truncate'>
                    {event.venue || event.location}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {events.length > 3 && (
          <div className='text-xs text-gray-500 text-center pt-1 border-t border-gray-100'>
            +{events.length - 3} more events
          </div>
        )}
      </div>
    </div>
  );
}
