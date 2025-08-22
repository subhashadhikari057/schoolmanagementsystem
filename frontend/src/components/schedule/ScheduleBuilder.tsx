'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, School } from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { classService } from '@/api/services/class.service';
import TimeslotManager from './TimeslotManager';
import { TimetableBuilder } from './TimetableBuilder';
import { TeacherAssignmentModal } from './TeacherAssignmentModal';

// Tab definition
interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'timeslot-manager',
    label: 'Timeslot Manager',
    icon: <Clock className='h-4 w-4 mr-2' />,
  },
  {
    id: 'timetable-builder',
    label: 'Timetable Builder',
    icon: <Calendar className='h-4 w-4 mr-2' />,
  },
];

export default function ScheduleBuilder() {
  const { activeTab, setActiveTab, setSelectedClass, selectedClassId } =
    useScheduleStore();
  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState<
    Array<{
      id: string;
      name?: string;
      grade: number;
      section: string;
      classTeacherId?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load classes from the backend
  const loadClasses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await classService.getAllClasses();
      if (response && Array.isArray(response.data)) {
        const classData = response.data.map(cls => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          classTeacherId: cls.classTeacherId,
        }));
        setClasses(classData);
        console.log('Classes loaded, selectedClassId:', selectedClassId);
        // Don't reset selectedClassId here - it should persist
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove selectedClassId and setSelectedClass from dependencies

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
    loadClasses();
  }, [loadClasses]);

  // Handle class selection
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value;
    console.log('Class selection changed to:', newClassId);

    // Reset timetable loaded flag when changing class
    useScheduleStore.getState().setHasLoadedTimetable(false);
    setSelectedClass(newClassId);
  };

  // Get the selected class info and update store with full class data
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Update the store with the full class data when it changes
  useEffect(() => {
    if (selectedClass) {
      // Map the class data to match the store's Class interface
      const classData = {
        id: selectedClass.id,
        classId: selectedClass.id, // Use id as classId
        gradeLevel: selectedClass.grade,
        section: selectedClass.section,
        academicYearId: '2024-25', // Default academic year - should be dynamic
        teacherId: selectedClass.classTeacherId,
        // Add grade for backward compatibility
        grade: selectedClass.grade,
      };
      useScheduleStore.getState().setSelectedClassData(classData);
    }
  }, [selectedClass]);

  if (!mounted) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='p-4 sm:p-6'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center'>
            <School className='h-6 w-6 mr-2' />
            Schedule Builder
          </h1>
          <p className='text-gray-600 mt-1'>
            Create and manage class schedules with our intuitive schedule
            builder tool.
          </p>
        </div>

        {/* Class Selector */}
        <div className='bg-white p-4 rounded-lg shadow mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <label
                htmlFor='class-select'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Select Class
              </label>
              {isLoading ? (
                <div className='h-10 w-64 bg-gray-200 animate-pulse rounded-md'></div>
              ) : (
                <select
                  id='class-select'
                  value={selectedClassId || ''}
                  onChange={handleClassChange}
                  className='px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value=''>-- Select a class --</option>
                  {classes.length > 0 ? (
                    classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name ||
                          `Grade ${cls.grade} Section ${cls.section}`}
                      </option>
                    ))
                  ) : (
                    <option value='' disabled>
                      No classes available
                    </option>
                  )}
                </select>
              )}
            </div>

            <div className='flex items-center text-sm text-gray-600'>
              {selectedClass && (
                <>
                  <div className='mr-6'>
                    <span className='font-medium'>Grade:</span>{' '}
                    {selectedClass.grade}
                  </div>
                  <div className='mr-6'>
                    <span className='font-medium'>Section:</span>{' '}
                    {selectedClass.section}
                  </div>
                  <div>
                    <span className='font-medium'>Class Teacher:</span>{' '}
                    {selectedClass.classTeacherId ? 'Assigned' : 'Not Assigned'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
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
          {/* Main content - Full width */}
          <div className='lg:col-span-4'>
            {activeTab === 0 && <TimeslotManager />}
            {activeTab === 1 && <TimetableBuilder />}
          </div>
        </div>
      </div>

      {/* Teacher Assignment Modal */}
      <TeacherAssignmentModal />
    </div>
  );
}
