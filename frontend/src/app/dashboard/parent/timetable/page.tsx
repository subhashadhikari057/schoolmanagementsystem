'use client';
import React, { useState, useEffect, useMemo } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { CardGridLoader } from '@/components/atoms/loading';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { parentService } from '@/api/services/parent.service';
import { TimetableSlotDto } from '@sms/shared-types';
import { Clock, User, BookOpen, AlertCircle } from 'lucide-react';

// Days of the week (Sunday to Friday for school)
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ProcessedTimetable {
  name: string;
  periods: TimetableSlotDto[];
}

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to get random color for any subject
const getSubjectColor = (subjectName: string) => {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    const char = subjectName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const colorIndex = Math.abs(hash) % 12;

  const colors = [
    'bg-blue-50 border-blue-200 text-blue-800',
    'bg-green-50 border-green-200 text-green-800',
    'bg-purple-50 border-purple-200 text-purple-800',
    'bg-orange-50 border-orange-200 text-orange-800',
    'bg-slate-50 border-slate-200 text-slate-800',
    'bg-indigo-50 border-indigo-200 text-indigo-800',
    'bg-red-50 border-red-200 text-red-800',
    'bg-yellow-50 border-yellow-200 text-yellow-800',
    'bg-teal-50 border-teal-200 text-teal-800',
    'bg-cyan-50 border-cyan-200 text-cyan-800',
    'bg-emerald-50 border-emerald-200 text-emerald-800',
    'bg-violet-50 border-violet-200 text-violet-800',
  ];

  return colors[colorIndex];
};

export default function ParentTimetablePage() {
  const [children, setChildren] = useState<
    Array<{
      id: string;
      studentId: string;
      fullName: string;
      className?: string;
      classId?: string;
    }>
  >([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [timetable, setTimetable] = useState<ProcessedTimetable[]>([]);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await parentService.getMyProfile();
        const childList = response.data?.children || [];
        setChildren(childList);
        if (childList.length > 0) {
          setSelectedChild(childList[0].studentId || childList[0].id);
        }
      } catch (error) {
        console.error('Failed to load children:', error);
        setChildren([]);
        setError('Failed to load children');
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);

  useEffect(() => {
    const loadTimetable = async () => {
      if (!selectedChild) {
        setTimetable([]);
        setHasSchedule(false);
        return;
      }

      try {
        setTimetableLoading(true);
        setError(null);
        const response = await parentService.getChildTimetable(selectedChild);
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load timetable');
        }

        const processedTimetable = processTimetableData(
          response.data?.slots || [],
        );
        setTimetable(processedTimetable);
        const hasAnySchedule = processedTimetable.some(
          day => day.periods.length > 0,
        );
        setHasSchedule(hasAnySchedule);
      } catch (error) {
        console.error('Failed to load timetable:', error);
        setTimetable([]);
        setHasSchedule(false);
        setError('Failed to load timetable');
      } finally {
        setTimetableLoading(false);
      }
    };

    loadTimetable();
  }, [selectedChild]);

  const childOptions = useMemo(
    () =>
      children.map(child => ({
        value: child.studentId || child.id,
        label: child.className
          ? `${child.fullName} (${child.className})`
          : child.fullName,
      })),
    [children],
  );

  const processTimetableData = (
    timetableData: TimetableSlotDto[],
  ): ProcessedTimetable[] => {
    const dayGroups: Record<string, TimetableSlotDto[]> = {};

    days.forEach(day => {
      dayGroups[day.toLowerCase()] = [];
    });

    timetableData.forEach(slot => {
      const day =
        slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase();
      if (dayGroups[day.toLowerCase()]) {
        dayGroups[day.toLowerCase()].push(slot);
      }
    });

    Object.keys(dayGroups).forEach(day => {
      dayGroups[day].sort((a, b) => {
        const timeA = a.timeslot?.startTime || '00:00';
        const timeB = b.timeslot?.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return days.map(day => ({
      name: day,
      periods: dayGroups[day.toLowerCase()] || [],
    }));
  };

  const renderPeriodCard = (
    slot: TimetableSlotDto,
    index: number,
    allPeriods: TimetableSlotDto[],
  ) => {
    const subjectName = slot.subject?.name || 'No Subject';
    const subjectCode = slot.subject?.code || '';
    const teacherName = slot.teacher?.user?.fullName || 'TBA';
    const startTime = slot.timeslot?.startTime || '00:00';
    const endTime = slot.timeslot?.endTime || '00:00';
    const slotType = slot.timeslot?.type || 'REGULAR';
    const isBreak = slotType === 'BREAK' || subjectName === 'No Subject';

    const getOrdinalSuffix = (num: number) => {
      const j = num % 10;
      const k = num % 100;
      if (j === 1 && k !== 11) return num + 'st';
      if (j === 2 && k !== 12) return num + 'nd';
      if (j === 3 && k !== 13) return num + 'rd';
      return num + 'th';
    };

    let periodNumber = 0;
    for (let i = 0; i <= index; i++) {
      const currentSlot = allPeriods[i];
      const currentSlotType = currentSlot.timeslot?.type || 'REGULAR';
      const currentSubjectName = currentSlot.subject?.name || 'No Subject';
      const isCurrentBreak =
        currentSlotType === 'BREAK' || currentSubjectName === 'No Subject';

      if (!isCurrentBreak) {
        periodNumber++;
      }
    }

    return (
      <div
        key={slot.id || index}
        className={`rounded-xl border shadow-sm p-4 min-h-[140px] flex flex-col justify-between transition-all duration-200 ${
          isBreak
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : getSubjectColor(subjectName)
        }`}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            {!isBreak && (
              <div className='px-2 py-1 rounded-full text-xs font-bold bg-white bg-opacity-80 text-gray-700'>
                {getOrdinalSuffix(periodNumber)}
              </div>
            )}
            <div className='flex items-center space-x-1 text-xs font-medium'>
              <Clock className='w-3 h-3' />
              <span>
                {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
              </span>
            </div>
          </div>
          {slotType !== 'REGULAR' && (
            <span className='text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700'>
              {slotType}
            </span>
          )}
        </div>

        {isBreak ? (
          <div className='flex-1 flex items-center justify-center'>
            <h3 className='text-2xl font-bold text-yellow-800'>BREAK</h3>
          </div>
        ) : (
          <>
            <div className='mb-3'>
              <h3 className='text-lg font-semibold mb-1'>{subjectName}</h3>
              {subjectCode && (
                <p className='text-xs opacity-75 font-medium'>{subjectCode}</p>
              )}
            </div>

            <div className='flex items-center text-sm mb-2'>
              <User className='w-3 h-3 mr-1' />
              <span className='font-medium'>{teacherName}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const tabsWithNav = timetable.map(day => ({
    name: day.name,
    content: (
      <div className='mt-4'>
        {day.periods.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-gray-300 text-4xl mb-4'>📚</div>
            <h3 className='text-lg font-medium text-gray-500 mb-2'>
              No classes scheduled
            </h3>
            <p className='text-sm text-gray-400'>
              No classes are scheduled for {day.name}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {day.periods.map((slot, index) =>
              renderPeriodCard(slot, index, day.periods),
            )}
          </div>
        )}
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
        <div className='max-w-8xl mx-auto'>
          <CardGridLoader
            cards={18}
            columns='grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            cardHeight='h-36'
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
        <div className='w-full'>
          <div className='text-center py-12'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Failed to Load Timetable
            </h3>
            <p className='text-gray-600 mb-4'>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSchedule && !timetableLoading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
        <div className='w-full'>
          <div className='flex items-center justify-between mb-6'>
            <SectionTitle
              text='Class Routine'
              className='text-xl font-bold text-gray-900'
            />
            <Dropdown
              type='filter'
              options={childOptions}
              selectedValue={selectedChild}
              onSelect={setSelectedChild}
              className='min-w-[220px]'
              placeholder='Select Child'
            />
          </div>
          <div className='text-center py-16'>
            <div className='text-6xl mb-4'>📅</div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Schedule Not Planned Yet
            </h3>
            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
              Your child&apos;s class timetable will appear here once it&apos;s
              created by the school.
            </p>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto'>
              <div className='flex items-start space-x-3'>
                <BookOpen className='w-6 h-6 text-blue-600 mt-1' />
                <div className='text-left'>
                  <h4 className='font-semibold text-blue-900 mb-2'>
                    What to expect:
                  </h4>
                  <ul className='text-sm text-blue-800 space-y-1'>
                    <li>• Daily class schedule with subjects and teachers</li>
                    <li>• Time slots for each period</li>
                    <li>• Weekly view from Sunday to Friday</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
      <div className='w-full'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <SectionTitle
              text='Class Routine'
              className='text-xl font-bold text-gray-900'
            />
            <Label className='text-base text-gray-600'>
              Your child&apos;s weekly class schedule.
            </Label>
          </div>
          <Dropdown
            type='filter'
            options={childOptions}
            selectedValue={selectedChild}
            onSelect={setSelectedChild}
            className='min-w-[220px]'
            placeholder='Select Child'
          />
        </div>
        <div className='mb-8'>
          <GenericTabs
            tabs={tabsWithNav}
            defaultIndex={Math.max(
              0,
              days.findIndex(
                day =>
                  day.toLowerCase() ===
                  new Date()
                    .toLocaleDateString('en-US', { weekday: 'long' })
                    .toLowerCase(),
              ),
            )}
            className=''
          />
        </div>
      </div>
    </div>
  );
}
