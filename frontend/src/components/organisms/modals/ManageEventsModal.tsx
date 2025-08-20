import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import { calendarService } from '@/api/services/calendar.service';
import {
  Edit,
  Trash2,
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';
import EditEventModal from './EditEventModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { toast } from 'sonner';

interface ManageEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated: () => void;
  events: CalendarEvent[];
}

export default function ManageEventsModal({
  isOpen,
  onClose,
  onEventUpdated,
  events,
}: ManageEventsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter events based on search term
  const filteredEvents = events.filter(
    event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setError(null);
  };

  const handleDeleteClick = (event: CalendarEvent) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);

      await calendarService.deleteCalendarEntry(eventToDelete.id);

      toast.success('Event deleted successfully!', {
        description: `${eventToDelete.name} has been permanently deleted.`,
        duration: 3000,
      });

      onEventUpdated();
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      toast.error('Failed to delete event', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
          <SectionTitle text='Manage Events' className='text-white' />
          <button
            onClick={onClose}
            className='text-white hover:text-gray-200 text-xl p-1 rounded-full hover:bg-white/20 transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className='p-4 border-b bg-gray-50'>
          <div className='relative'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              size={16}
            />
            <Input
              type='text'
              placeholder='Search events by name, description, or location...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 max-h-[60vh]'>
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700'>
              {error}
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              {searchTerm
                ? 'No events found matching your search.'
                : 'No events available.'}
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      {/* Event Header */}
                      <div className='flex items-center gap-2 mb-3'>
                        <div
                          className={`p-1.5 rounded-lg ${
                            event.type === 'holiday'
                              ? 'bg-red-100 text-red-600'
                              : event.type === 'exam'
                                ? 'bg-purple-100 text-purple-600'
                                : event.type === 'meeting'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {event.type === 'holiday'
                            ? '🎉'
                            : event.type === 'exam'
                              ? '📝'
                              : event.type === 'meeting'
                                ? '🤝'
                                : '🎪'}
                        </div>
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {event.name}
                          </h3>
                          <p className='text-xs text-gray-500 capitalize'>
                            {event.type || 'event'}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : event.status === 'inactive'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {event.status || 'active'}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-3'>
                        <div className='flex items-center gap-1.5 text-gray-600'>
                          <Calendar size={14} className='text-gray-400' />
                          <span className='text-xs'>
                            {event.date}
                            {event.endDate &&
                              event.endDate !== event.date &&
                              ` - ${event.endDate}`}
                          </span>
                        </div>

                        {event.time && (
                          <div className='flex items-center gap-1.5 text-gray-600'>
                            <Clock size={14} className='text-gray-400' />
                            <span className='text-xs'>{event.time}</span>
                          </div>
                        )}

                        {event.location && (
                          <div className='flex items-center gap-1.5 text-gray-600'>
                            <MapPin size={14} className='text-gray-400' />
                            <span className='text-xs'>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <div className='mb-3 p-2 bg-gray-50 rounded-lg'>
                          <p className='text-xs text-gray-700 line-clamp-2'>
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-1 ml-3'>
                      <button
                        onClick={() => handleEdit(event)}
                        className='p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                        title='Edit Event'
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className='p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                        disabled={isLoading}
                        title='Delete Event'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-4 py-3 border-t bg-gray-50'>
          <div className='flex justify-between items-center'>
            <p className='text-sm text-gray-600'>
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? 's' : ''} found
            </p>
            <Button onClick={onClose} variant='secondary'>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onEventUpdated={onEventUpdated}
        event={editingEvent}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title='Delete Event'
        message={`Are you sure you want to delete "${eventToDelete?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
