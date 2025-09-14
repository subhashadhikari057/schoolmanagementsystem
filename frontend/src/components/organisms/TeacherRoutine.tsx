import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, User, BookOpen, AlertCircle } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { useAuth } from '@/hooks/useAuth';
import { teacherService } from '@/api/services/teacher.service';
import { timetableService } from '@/api/services/timetable.service';
import { TimetableSlotDto } from '@sms/shared-types';
import { toast } from 'sonner';

// Days of the week (Sunday to Friday for school)
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Interface for processed timetable data
interface ProcessedTimetable {
  name: string;
  periods: ProcessedPeriod[];
}

interface ProcessedPeriod {
  id: string;
  class: string;
  subject: string;
  subjectCode?: string;
  time: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'pending';
  room?: string;
}

// Helper function to format time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to get consistent color for subjects
const getSubjectColor = (subjectName: string) => {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    const char = subjectName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get consistent color index
  const colorIndex = Math.abs(hash) % 12;

  const colors = [
    'bg-blue-50 border-blue-200 text-blue-800', // Blue
    'bg-green-50 border-green-200 text-green-800', // Green
    'bg-purple-50 border-purple-200 text-purple-800', // Purple
    'bg-orange-50 border-orange-200 text-orange-800', // Orange
    'bg-slate-50 border-slate-200 text-slate-800', // Slate
    'bg-indigo-50 border-indigo-200 text-indigo-800', // Indigo
    'bg-red-50 border-red-200 text-red-800', // Red
    'bg-yellow-50 border-yellow-200 text-yellow-800', // Yellow
    'bg-teal-50 border-teal-200 text-teal-800', // Teal
    'bg-cyan-50 border-cyan-200 text-cyan-800', // Cyan
    'bg-emerald-50 border-emerald-200 text-emerald-800', // Emerald
    'bg-violet-50 border-violet-200 text-violet-800', // Violet
  ];

  return colors[colorIndex];
};

// Helper function to determine period status
const getPeriodStatus = (
  startTime: string,
  endTime: string,
): ProcessedPeriod['status'] => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const classStart = startHour * 60 + startMin;
  const classEnd = endHour * 60 + endMin;

  if (currentTime > classEnd) {
    return 'completed';
  } else if (currentTime >= classStart && currentTime <= classEnd) {
    return 'in-progress';
  } else if (currentTime < classStart) {
    return 'upcoming';
  }

  return 'pending';
};

const TeacherRoutine = () => {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get('day');
  const daysLower = days.map(d => d.toLowerCase());
  let defaultIndex = 0;
  if (dayParam) {
    const idx = daysLower.indexOf(dayParam.toLowerCase());
    if (idx !== -1) defaultIndex = idx;
  } else {
    defaultIndex = new Date().getDay();
  }

  // State for timetable data
  const [teacherRoutine, setTeacherRoutine] = useState<ProcessedTimetable[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process timetable data into the required format
  const processTimetableData = useCallback(
    (timetableData: any[]): ProcessedTimetable[] => {
      const processedByDay: { [key: string]: ProcessedPeriod[] } = {};

      // Initialize all days
      days.forEach(day => {
        processedByDay[day] = [];
      });

      // Process each timetable slot
      timetableData.forEach(slot => {
        if (slot.timeslot && slot.subject) {
          const day = slot.timeslot.day;
          const startTime = slot.timeslot.startTime;
          const endTime = slot.timeslot.endTime;

          // Convert day to proper case to match our days array
          const capitalizedDay =
            day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

          // Format time to 12-hour format
          const timeFormatted = `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;

          // Determine status
          const status = getPeriodStatus(startTime, endTime);

          // Get class information from the response
          const classInfo = slot.class;
          const className = classInfo
            ? `Class ${classInfo.grade}-${classInfo.section}`
            : slot.subject.name;

          const period: ProcessedPeriod = {
            id: slot.id,
            class: className, // Using class info from backend
            subject: slot.subject.name,
            subjectCode: slot.subject.code,
            time: timeFormatted,
            status,
            room: slot.room?.roomNo,
          };

          if (processedByDay[capitalizedDay]) {
            processedByDay[capitalizedDay].push(period);
          }
        }
      });

      // Convert to array format
      const result = days.map(day => ({
        name: day,
        periods: processedByDay[day] || [],
      }));

      return result;
    },
    [],
  );

  // Fetch teacher timetable data
  useEffect(() => {
    const fetchTeacherRoutine = async () => {
      if (!user) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      if (!user.id) {
        setError('User ID not found. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First get the teacher profile to get the teacher ID
        const teacherResponse = await teacherService.getCurrentTeacher();
        if (!teacherResponse.success || !teacherResponse.data) {
          setError(
            'Failed to get teacher profile. Please ensure you are logged in as a teacher.',
          );
          return;
        }

        const teacherId = teacherResponse.data.id;
        const response =
          await timetableService.getTimetableByTeacher(teacherId);

        if (response.success) {
          const processedData = processTimetableData((response as any).data);
          setTeacherRoutine(processedData);
        } else {
          setError((response as any).message);
        }
      } catch (err) {
        setError('Failed to fetch teacher routine. Please try again later.');
        console.error('Error fetching teacher routine:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if not loading auth and user exists
    if (!authLoading && user) {
      fetchTeacherRoutine();
    } else if (!authLoading && !user) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
    }
  }, [user, authLoading, processTimetableData]);

  const tabsWithNav = teacherRoutine.map((day: ProcessedTimetable) => ({
    name: day.name,
    content: (
      <div className='mt-6'>
        {day.periods.length === 0 ? (
          <div className='text-gray-400 text-center py-16 text-lg font-medium'>
            No classes scheduled for this day.
          </div>
        ) : (
          <div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'>
            {day.periods.map((period: ProcessedPeriod, idx: number) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 sm:p-6 min-h-[60px] flex flex-col justify-center transition-all duration-150 shadow-sm hover:shadow-md ${period.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-blue-300'}`}
              >
                <span
                  className={`text-base sm:text-xl font-semibold mb-2 ${period.status === 'completed' ? 'text-green-700' : 'text-gray-900'}`}
                >
                  {period.class}
                </span>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit ${period.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}
                >
                  {period.time}
                </span>
                <span
                  className={`mt-2 text-xs font-medium ${period.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}
                >
                  {period.status === 'completed' ? 'Completed' : 'Upcoming'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  }));

  // Show loading state for authentication or data fetching
  if (authLoading || loading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='max-w-8xl mx-auto'>
          <SectionTitle
            text='My Routine'
            level={1}
            className='text-2xl font-bold text-gray-900 mb-2'
          />
          <Label className='text-base text-gray-600 mb-6'>
            {authLoading ? 'Loading...' : 'Loading your teaching routine...'}
          </Label>
          <div className='flex justify-center items-center py-16'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='max-w-8xl mx-auto'>
          <SectionTitle
            text='My Routine'
            level={1}
            className='text-2xl font-bold text-gray-900 mb-2'
          />
          <div className='flex items-center justify-center py-16'>
            <div className='text-center'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 text-lg font-medium mb-2'>
                Error Loading Routine
              </p>
              <p className='text-gray-600'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
      <div className='max-w-8xl mx-auto'>
        <SectionTitle
          text='My Routine'
          level={1}
          className='text-2xl font-bold text-gray-900 mb-2'
        />
        <Label className='text-base text-gray-600 mb-6'>
          View your teaching routine for each day. Only scheduled classes will
          appear below.
        </Label>
        <div className='mb-8'>
          <GenericTabs
            tabs={tabsWithNav}
            defaultIndex={defaultIndex}
            className=''
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherRoutine;
