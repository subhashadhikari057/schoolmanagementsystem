/**
 * =============================================================================
 * Calendar Management Component
 * =============================================================================
 * Admin interface for managing calendar entries (holidays, events, reminders)
 * =============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';

import { ActionButtons } from '../../atoms/interactive/ActionButtons';
import ChartCard from '../../atoms/display/ChartCard';
import {
  CalendarEvent,
  CalendarEntryType,
  HolidayType,
  ExamType,
  CalendarManagementProps,
} from './types/calendar.types';
import {
  CalendarEntryResponseDto,
  CalendarEntriesQueryDto,
  CreateCalendarEntryDto,
  UpdateCalendarEntryDto,
} from '@sms/shared-types';
import { calendarService } from '@/api/services/calendar.service';

export default function CalendarManagement({
  className = '',
}: CalendarManagementProps) {
  const [entries, setEntries] = useState<CalendarEntryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CalendarEntryType | 'ALL'>(
    'ALL',
  );
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<CalendarEntryResponseDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      return time; // Return original if conversion fails
    }
  };

  // Form state
  const [formData, setFormData] = useState<Partial<CreateCalendarEntryDto>>({
    name: '',
    type: CalendarEntryType.EVENT,
    startDate: '',
    endDate: '',
    venue: '',
    holidayType: undefined,
    examType: undefined,
    examDetails: '',
    startTime: '',
    endTime: '',
  });

  // Fetch calendar entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const query: CalendarEntriesQueryDto = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
      };

      const response = await calendarService.getCalendarEntries(query);
      setEntries(response.entries);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch calendar entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load entries on component mount and when filters change
  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchTerm, selectedType]);

  // Handle create/update entry
  const handleSaveEntry = async () => {
    try {
      if (editingEntry) {
        // Update existing entry
        await calendarService.updateCalendarEntry(
          editingEntry.id,
          formData as UpdateCalendarEntryDto,
        );
      } else {
        // Create new entry
        await calendarService.createCalendarEntry(
          formData as CreateCalendarEntryDto,
        );
      }

      setShowForm(false);
      setEditingEntry(null);
      resetForm();
      await fetchEntries();
    } catch (error) {
      console.error('Failed to save calendar entry:', error);
    }
  };

  // Handle delete entry
  const handleDeleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await calendarService.deleteCalendarEntry(id);
        await fetchEntries();
      } catch (error) {
        console.error('Failed to delete calendar entry:', error);
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedEntries.length} entries?`,
      )
    ) {
      try {
        await calendarService.bulkCalendarOperation({
          entryIds: selectedEntries,
          action: 'delete',
        });
        setSelectedEntries([]);
        await fetchEntries();
      } catch (error) {
        console.error('Failed to bulk delete entries:', error);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: CalendarEntryType.EVENT,
      startDate: '',
      endDate: '',
      venue: '',
      holidayType: undefined,
      examType: undefined,
      examDetails: '',
      startTime: '',
      endTime: '',
    });
  };

  // Open edit form
  const handleEditEntry = (entry: CalendarEntryResponseDto) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      type: entry.type,
      startDate: entry.startDate.split('T')[0],
      endDate: entry.endDate ? entry.endDate.split('T')[0] : '',
      venue: entry.venue,
      holidayType: entry.holidayType,
      examType: entry.examType,
      examDetails: entry.examDetails,
      startTime: entry.startTime,
      endTime: entry.endTime,
    });
    setShowForm(true);
  };

  // Toggle entry selection
  const toggleEntrySelection = (id: string) => {
    setSelectedEntries(prev =>
      prev.includes(id)
        ? prev.filter(entryId => entryId !== id)
        : [...prev, id],
    );
  };

  // Select all entries
  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map(entry => entry.id));
    }
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <div className='px-4 lg:px-6 pt-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Calendar Management
            </h1>
            <p className='text-gray-600 mt-1'>
              Manage holidays, events, and reminders for the academic calendar
            </p>
          </div>

          <ActionButtons
            pageType='calendar'
            onRefresh={fetchEntries}
            onAddNew={() => {
              resetForm();
              setEditingEntry(null);
              setShowForm(true);
            }}
          />
        </div>
      </div>

      <div className='px-4 lg:px-6 pb-8'>
        <div className='max-w-7xl mx-auto space-y-6 mt-6'>
          {/* Filters and Search */}
          <ChartCard className='p-4'>
            <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
              {/* Search */}
              <div className='relative flex-1 max-w-md'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Search calendar entries...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              {/* Type Filter */}
              <div className='flex items-center gap-4'>
                <select
                  value={selectedType}
                  onChange={e =>
                    setSelectedType(e.target.value as CalendarEntryType | 'ALL')
                  }
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>All Types</option>
                  <option value={CalendarEntryType.HOLIDAY}>Holidays</option>
                  <option value={CalendarEntryType.EVENT}>Events</option>
                </select>

                {/* Bulk Actions */}
                {selectedEntries.length > 0 && (
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={handleBulkDelete}
                      className='px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                    <span className='text-sm text-gray-600'>
                      {selectedEntries.length} selected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ChartCard>

          {/* Calendar Entries Table */}
          <ChartCard className='p-0'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left'>
                      <button
                        onClick={toggleSelectAll}
                        className='flex items-center space-x-2'
                      >
                        {selectedEntries.length === entries.length &&
                        entries.length > 0 ? (
                          <CheckSquare className='w-4 h-4 text-blue-600' />
                        ) : (
                          <Square className='w-4 h-4 text-gray-400' />
                        )}
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                      Name
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                      Type
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                      Date
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                      Details
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className='px-4 py-8 text-center'>
                        <div className='flex items-center justify-center'>
                          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                          <span className='ml-2 text-gray-600'>Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-4 py-8 text-center text-gray-500'
                      >
                        No calendar entries found
                      </td>
                    </tr>
                  ) : (
                    entries.map(entry => (
                      <tr key={entry.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3'>
                          <button
                            onClick={() => toggleEntrySelection(entry.id)}
                            className='flex items-center'
                          >
                            {selectedEntries.includes(entry.id) ? (
                              <CheckSquare className='w-4 h-4 text-blue-600' />
                            ) : (
                              <Square className='w-4 h-4 text-gray-400' />
                            )}
                          </button>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center'>
                            <div
                              className={`w-3 h-3 rounded-full mr-3 ${
                                entry.type === CalendarEntryType.HOLIDAY
                                  ? 'bg-red-500'
                                  : entry.type === CalendarEntryType.EXAM
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                              }`}
                            />
                            <div>
                              <div className='text-sm font-medium text-gray-900'>
                                {entry.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              entry.type === CalendarEntryType.HOLIDAY
                                ? 'bg-red-100 text-red-800'
                                : entry.type === CalendarEntryType.EXAM
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {entry.type === CalendarEntryType.HOLIDAY
                              ? 'Holiday'
                              : entry.type === CalendarEntryType.EXAM
                                ? 'Exam'
                                : 'Event'}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='text-sm text-gray-900'>
                            {new Date(entry.startDate).toLocaleDateString()}
                          </div>
                          {entry.endDate &&
                            entry.endDate !== entry.startDate && (
                              <div className='text-sm text-gray-500'>
                                to{' '}
                                {new Date(entry.endDate).toLocaleDateString()}
                              </div>
                            )}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='text-sm text-gray-600'>
                            {entry.type === CalendarEntryType.HOLIDAY &&
                              entry.holidayType && (
                                <span className='capitalize'>
                                  {entry.holidayType.toLowerCase()} Holiday
                                </span>
                              )}
                            {entry.type === CalendarEntryType.EVENT && (
                              <div className='space-y-1'>
                                {entry.venue && <span>📍 {entry.venue}</span>}
                                {(entry.startTime || entry.endTime) && (
                                  <span className='block text-xs'>
                                    🕐{' '}
                                    {convertTo12HourFormat(
                                      entry.startTime || '',
                                    )}
                                    {entry.endTime &&
                                      entry.startTime !== entry.endTime &&
                                      ` - ${convertTo12HourFormat(entry.endTime)}`}
                                  </span>
                                )}
                              </div>
                            )}
                            {entry.type === CalendarEntryType.EXAM && (
                              <div className='space-y-1'>
                                {entry.examType && (
                                  <span className='block font-medium'>
                                    {entry.examType.replace('_', ' ')}
                                  </span>
                                )}
                                {entry.examDetails && (
                                  <span className='block text-xs text-gray-500 line-clamp-1'>
                                    {entry.examDetails}
                                  </span>
                                )}
                                {(entry.startTime || entry.endTime) && (
                                  <span className='block text-xs'>
                                    🕐{' '}
                                    {convertTo12HourFormat(
                                      entry.startTime || '',
                                    )}
                                    {entry.endTime &&
                                      entry.startTime !== entry.endTime &&
                                      ` - ${convertTo12HourFormat(entry.endTime)}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center space-x-2'>
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className='p-1 text-gray-400 hover:text-gray-600'
                            >
                              <Edit3 className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className='p-1 text-gray-400 hover:text-red-600'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='px-4 py-3 border-t border-gray-200 flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Page {currentPage} of {totalPages}
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className='px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className='px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
            <h2 className='text-xl font-bold mb-4'>
              {editingEntry ? 'Edit Calendar Entry' : 'Create Calendar Entry'}
            </h2>

            <div className='space-y-4'>
              {/* Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Name *
                </label>
                <input
                  type='text'
                  value={formData.name || ''}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData((prev: any) => ({
                      ...prev,
                      type: e.target.value as CalendarEntryType,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value={CalendarEntryType.EVENT}>Event</option>
                  <option value={CalendarEntryType.HOLIDAY}>Holiday</option>
                  <option value={CalendarEntryType.EXAM}>Exam</option>
                </select>
              </div>

              {/* Date Range */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Start Date *
                  </label>
                  <input
                    type='date'
                    value={formData.startDate || ''}
                    onChange={e =>
                      setFormData((prev: any) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    End Date *
                  </label>
                  <input
                    type='date'
                    value={formData.endDate || ''}
                    onChange={e =>
                      setFormData((prev: any) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                </div>
              </div>

              {/* Time Fields (for Events and Exams) */}
              {(formData.type === CalendarEntryType.EVENT ||
                formData.type === CalendarEntryType.EXAM) && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Start Time
                    </label>
                    <input
                      type='time'
                      value={formData.startTime || ''}
                      onChange={e =>
                        setFormData((prev: any) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      End Time
                    </label>
                    <input
                      type='time'
                      value={formData.endTime || ''}
                      onChange={e =>
                        setFormData((prev: any) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              )}

              {/* Venue (for Events) */}
              {formData.type === CalendarEntryType.EVENT && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Venue
                  </label>
                  <input
                    type='text'
                    value={formData.venue || ''}
                    onChange={e =>
                      setFormData((prev: any) => ({
                        ...prev,
                        venue: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Enter event venue'
                  />
                </div>
              )}

              {/* Holiday Type (for Holidays) */}
              {formData.type === CalendarEntryType.HOLIDAY && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Holiday Type
                  </label>
                  <select
                    value={formData.holidayType || HolidayType.SCHOOL}
                    onChange={e =>
                      setFormData((prev: any) => ({
                        ...prev,
                        holidayType: e.target.value as HolidayType,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value={HolidayType.NATIONAL}>
                      National Holiday
                    </option>
                    <option value={HolidayType.SCHOOL}>School Holiday</option>
                  </select>
                </div>
              )}

              {/* Exam-specific fields */}
              {formData.type === CalendarEntryType.EXAM && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Exam Type *
                    </label>
                    <select
                      value={formData.examType || ''}
                      onChange={e =>
                        setFormData((prev: any) => ({
                          ...prev,
                          examType: e.target.value as ExamType,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      required
                    >
                      <option value=''>Select exam type</option>
                      <option value={ExamType.FIRST_TERM}>First Term</option>
                      <option value={ExamType.SECOND_TERM}>Second Term</option>
                      <option value={ExamType.THIRD_TERM}>Third Term</option>
                      <option value={ExamType.FINAL}>Final</option>
                      <option value={ExamType.UNIT_TEST}>Unit Test</option>
                      <option value={ExamType.OTHER}>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Exam Details (Optional)
                    </label>
                    <textarea
                      value={formData.examDetails || ''}
                      onChange={e =>
                        setFormData((prev: any) => ({
                          ...prev,
                          examDetails: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Enter additional exam details, subjects, or instructions...'
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Form Actions */}
            <div className='flex justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                {editingEntry ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
