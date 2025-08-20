import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';
import { calendarService } from '@/api/services/calendar.service';
import { Edit, Trash2, X, Search, Calendar } from 'lucide-react';
import EditEventModal from './EditEventModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { toast } from 'sonner';
import { ad2bs } from 'hamro-nepali-patro';

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

  // Nepali month names
  const nepaliMonths = [
    'बैशाख',
    'जेठ',
    'असार',
    'साउन',
    'भदौ',
    'असोज',
    'कार्तिक',
    'मंसिर',
    'पुष',
    'माघ',
    'फागुन',
    'चैत',
  ];

  // Convert AD date to BS format
  const convertToBSDate = (adDateString: string) => {
    try {
      const adDate = new Date(adDateString);
      const bsDate = ad2bs(
        adDate.getFullYear(),
        adDate.getMonth() + 1,
        adDate.getDate(),
      );
      if (bsDate && typeof bsDate === 'object') {
        return `${nepaliMonths[bsDate.month - 1]} ${bsDate.date}, ${bsDate.year}`;
      }
    } catch (error) {
      console.error('Error converting date to BS:', error);
    }
    return adDateString;
  };

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
    <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white'>
          <SectionTitle text='Manage Events' className='text-white' />
          <button
            onClick={onClose}
            className='text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/20 transition-colors'
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
              placeholder='Search events...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4 max-h-[calc(85vh-200px)]'>
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
            <div className='space-y-2'>
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className='border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-white'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 flex-1'>
                      {/* Event Icon */}
                      <div
                        className={`p-2 rounded-lg ${
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

                      {/* Event Info */}
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-base font-semibold text-gray-900 truncate'>
                          {event.name}
                        </h3>
                        <div className='flex items-center gap-4 mt-1'>
                          <span className='text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full'>
                            {event.type || 'event'}
                          </span>
                          <div className='flex items-center gap-1 text-xs text-gray-600'>
                            <Calendar size={12} className='text-gray-400' />
                            <span>
                              {convertToBSDate(event.date)}
                              {event.endDate &&
                                event.endDate !== event.date &&
                                ` - ${convertToBSDate(event.endDate)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-1 ml-4'>
                      <button
                        onClick={() => handleEdit(event)}
                        className='p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                        title='Edit Event'
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
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
        <div className='px-6 py-4 border-t bg-gray-50'>
          <div className='flex justify-between items-center'>
            <p className='text-sm text-gray-600'>
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? 's' : ''} found
            </p>
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
