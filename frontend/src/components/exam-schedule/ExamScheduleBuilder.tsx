'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useExamTimetableStore } from '@/store/exam-timetable';

import { calendarService } from '@/api/services/calendar.service';
import { classService } from '@/api/services/class.service';
import { examDateslotService } from '@/api/services/exam-timetable.service';
import ExamDateslotManager from './ExamDateslotManager';
import { ExamTimetableBuilder } from './ExamTimetableBuilder';
import { CalendarEntryType } from '@sms/shared-types';

// Tab definition
interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'dateslot-manager',
    label: 'Dateslot Manager',
    icon: <Clock className='h-4 w-4 mr-2' />,
  },
  {
    id: 'exam-timetable-builder',
    label: 'Exam Timetable Builder',
    icon: <Calendar className='h-4 w-4 mr-2' />,
  },
];

export default function ExamScheduleBuilder() {
  const {
    activeTab,
    setActiveTab,
    selectedCalendarEntryId,
    selectedCalendarEntry,
    selectedClassId,
    selectedClass,
    availableClasses,
    setSelectedCalendarEntry,
    setSelectedClass,
    setAvailableClasses,
  } = useExamTimetableStore();

  const [mounted, setMounted] = useState(false);

  const [examCalendarEntries, setExamCalendarEntries] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      examType?: string;
      startDate: Date;
      endDate: Date;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [calendarLoadError, setCalendarLoadError] = useState(false);

  // Load exam calendar entries
  const loadExamCalendarEntries = React.useCallback(async () => {
    // Don't retry if there was a previous error
    if (calendarLoadError) {
      console.log('Skipping calendar load due to previous error');
      return;
    }

    setIsLoading(true);
    try {
      // Try to get calendar entries with minimal parameters
      let response;
      try {
        response = await calendarService.getCalendarEntries({
          page: 1,
          limit: 100,
          type: CalendarEntryType.EXAM,
        });
      } catch (apiError) {
        console.error('Calendar API error:', apiError);
        // If API fails, provide empty array and show error state
        setExamCalendarEntries([]);
        setCalendarLoadError(true);
        setIsLoading(false);
        return;
      }

      if (response && response.entries && Array.isArray(response.entries)) {
        console.log('EXAM calendar entries received:', response.entries.length);
        console.log(
          'EXAM entries:',
          response.entries.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            examType: e.examType,
          })),
        );

        // Map the entries (already filtered by type=EXAM on server)
        const examEntries = response.entries.map(entry => ({
          id: entry.id,
          name: entry.name,
          type: entry.type,
          examType: entry.examType,
          startDate: new Date(entry.startDate),
          endDate: new Date(entry.endDate),
        }));

        setExamCalendarEntries(examEntries);
        setCalendarLoadError(false);
        setIsLoading(false);
        console.log(
          'Exam calendar entries loaded:',
          examEntries.length,
          'entries',
        );

        // Clear invalid persisted state
        if (
          selectedCalendarEntryId &&
          !examEntries.some(e => e.id === selectedCalendarEntryId)
        ) {
          console.warn('Clearing invalid persisted calendar entry ID');
          useExamTimetableStore.getState().setSelectedCalendarEntry('');
        }
      } else {
        console.warn('Invalid calendar response format:', response);
        setExamCalendarEntries([]);
        setCalendarLoadError(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading exam calendar entries:', error);
      setExamCalendarEntries([]);
      setCalendarLoadError(true);
      setIsLoading(false);
    }
  }, [selectedCalendarEntryId, calendarLoadError]);

  // Load available classes
  const loadAvailableClasses = React.useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setAvailableClasses(response.data);
      } else {
        setAvailableClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setAvailableClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [setAvailableClasses]);

  // Load exam dateslots when needed
  const loadExamDateslots = React.useCallback(async () => {
    if (
      !selectedCalendarEntryId ||
      !selectedCalendarEntryId.match(/^[0-9a-fA-F-]{36}$/)
    ) {
      return;
    }

    try {
      const response = await examDateslotService.getDateslotsByCalendarEntry(
        selectedCalendarEntryId,
      );
      if (response.success && response.data) {
        useExamTimetableStore.getState().setExamDateslots(
          response.data.map(ds => ({
            ...ds,
            examDate: new Date(ds.examDate),
          })),
        );
      }
    } catch (error) {
      console.error('Error loading dateslots:', error);
    }
  }, [selectedCalendarEntryId]);

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);

    // Ensure we start with Dateslot Manager tab (index 0)
    setActiveTab(0);

    // Clear any invalid mock data from persistent storage
    useExamTimetableStore.getState().clearInvalidState();
    loadExamCalendarEntries();
    loadAvailableClasses();
  }, [loadExamCalendarEntries, loadAvailableClasses, setActiveTab]);

  // Handle calendar entry selection
  const handleCalendarEntryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const entryId = e.target.value;
    const entry = examCalendarEntries.find(e => e.id === entryId);
    setSelectedCalendarEntry(entryId, entry);

    // Load dateslots for the selected calendar entry
    if (entryId && entryId.match(/^[0-9a-fA-F-]{36}$/)) {
      try {
        const response =
          await examDateslotService.getDateslotsByCalendarEntry(entryId);
        if (response.success && response.data) {
          useExamTimetableStore.getState().setExamDateslots(
            response.data.map(ds => ({
              ...ds,
              examDate: new Date(ds.examDate),
            })),
          );
        }
      } catch (error) {
        console.error('Error loading dateslots:', error);
      }
    }
  };

  // Handle class selection
  const handleClassSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    const classData = availableClasses.find(cls => cls.id === classId);
    setSelectedClass(classId, classData);
  };

  // Handle retry calendar loading
  const handleRetryCalendar = () => {
    setCalendarLoadError(false);
    setIsLoading(true);
    loadExamCalendarEntries();
  };

  // Don't render until mounted (avoid hydration issues)
  if (!mounted) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='pt-3'>
        {/* Header */}
        <div className='mb-6'>
          <div className='bg-white p-4 rounded-lg shadow'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Calendar Entry Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Exam Period
                </label>
                {isLoading ? (
                  <div className='h-10 bg-gray-100 rounded-md animate-pulse'></div>
                ) : (
                  <select
                    value={selectedCalendarEntryId}
                    onChange={handleCalendarEntryChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value=''>Select an exam period...</option>
                    {examCalendarEntries.map(entry => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name} ({entry.examType || 'Exam'}) -{' '}
                        {entry.startDate.toLocaleDateString()} to{' '}
                        {entry.endDate.toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}

                {calendarLoadError && (
                  <div className='mt-2 p-3 bg-red-50 border border-red-200 rounded-md'>
                    <p className='text-sm text-red-600'>
                      Failed to load exam periods. Please try again.
                    </p>
                    <button
                      onClick={handleRetryCalendar}
                      className='mt-2 text-sm text-red-700 hover:text-red-800 underline'
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Debug info */}
                {!isLoading &&
                  !calendarLoadError &&
                  examCalendarEntries.length === 0 && (
                    <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                      <p className='text-sm text-yellow-700'>
                        No exam periods found. Please create EXAM type entries
                        in the Academic Calendar first.
                      </p>
                    </div>
                  )}
              </div>

              {/* Class Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Class
                </label>
                {isLoadingClasses ? (
                  <div className='h-10 bg-gray-100 rounded-md animate-pulse'></div>
                ) : (
                  <select
                    value={selectedClassId}
                    onChange={handleClassSelection}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value=''>Select a class...</option>
                    {availableClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        Grade {cls.grade} {cls.section}{' '}
                        {cls.name ? `(${cls.name})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {!isLoadingClasses && availableClasses.length === 0 && (
                  <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                    <p className='text-sm text-yellow-700'>
                      No classes found. Please create classes first.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Exam and Class Info Display */}
            {(selectedCalendarEntry || selectedClass) && (
              <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                <div className='flex flex-wrap items-center gap-4 text-sm text-blue-800'>
                  {selectedCalendarEntry && (
                    <>
                      <div>
                        <span className='font-medium'>Exam:</span>{' '}
                        {selectedCalendarEntry.name}
                      </div>
                      <div>
                        <span className='font-medium'>Type:</span>{' '}
                        {selectedCalendarEntry.examType || 'General'}
                      </div>
                      <div>
                        <span className='font-medium'>Period:</span>{' '}
                        {selectedCalendarEntry.startDate.toLocaleDateString()} -{' '}
                        {selectedCalendarEntry.endDate.toLocaleDateString()}
                      </div>
                    </>
                  )}
                  {selectedClass && (
                    <div>
                      <span className='font-medium'>Class:</span> Grade{' '}
                      {selectedClass.grade} {selectedClass.section}{' '}
                      {selectedClass.name ? `(${selectedClass.name})` : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={async () => {
                    setActiveTab(index);
                    // If switching to timetable builder and we have a calendar entry, ensure dateslots are loaded
                    if (index === 1 && selectedCalendarEntryId) {
                      const store = useExamTimetableStore.getState();
                      if (store.examDateslots.length === 0) {
                        await loadExamDateslots();
                      }
                    }
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 gap-6'>
          <div className='lg:col-span-4'>
            {activeTab === 0 && <ExamDateslotManager />}
            {activeTab === 1 && <ExamTimetableBuilder />}
          </div>
        </div>
      </div>
    </div>
  );
}
