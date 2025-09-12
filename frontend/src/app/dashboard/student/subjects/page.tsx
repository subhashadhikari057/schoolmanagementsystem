'use client';
// Student Classes Page: Day-wise tabs, real timetable data, teacher info, consistent card UI
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import GenericTabs from '@/components/organisms/tabs/GenericTabs';
import { CardGridLoader } from '@/components/atoms/loading';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/api/services/student.service';
import { timetableService } from '@/api/services/timetable.service';
import { TimetableSlotDto } from '@sms/shared-types';
import { Clock, User, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Days of the week (Sunday to Friday for school)
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Interface for processed timetable data
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
  // Create a simple hash from subject name for consistent colors
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

export default function StudentClassesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<ProcessedTimetable[]>([]);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // Load student profile and timetable
  useEffect(() => {
    loadStudentData();
  }, [user?.id]);

  const loadStudentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get student profile to get class ID
      const studentResponse = await studentService.getStudentByUserId(user.id);
      if (!studentResponse.success || !studentResponse.data) {
        throw new Error('Failed to load student profile');
      }

      const student = studentResponse.data;
      setStudentProfile(student);

      // Get timetable for student's class
      if (student.classId) {
        const timetableResponse = await timetableService.getTimetableByClass(
          student.classId,
        );

        if (timetableResponse.success && timetableResponse.data) {
          // Process timetable data by day
          const processedTimetable = processTimetableData(
            timetableResponse.data,
          );
          setTimetable(processedTimetable);
          const hasAnySchedule = processedTimetable.some(
            day => day.periods.length > 0,
          );
          setHasSchedule(hasAnySchedule);

          if (!hasAnySchedule) {
            toast.info('No schedule found for your class yet');
          }
        } else {
          setHasSchedule(false);
          if (timetableResponse.error) {
            toast.error(timetableResponse.error);
          } else {
            toast.error('Failed to load timetable');
          }
        }
      } else {
        setHasSchedule(false);
        toast.warning('No class assigned yet');
      }
    } catch (err: any) {
      console.error('Error loading student data:', err);
      setError(err.message || 'Failed to load timetable');
      setHasSchedule(false);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  // Process timetable data to group by day
  const processTimetableData = (
    timetableData: TimetableSlotDto[],
  ): ProcessedTimetable[] => {
    const dayGroups: Record<string, TimetableSlotDto[]> = {};

    // Initialize all days
    days.forEach(day => {
      dayGroups[day.toLowerCase()] = [];
    });

    // Group slots by day
    timetableData.forEach(slot => {
      const day =
        slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase();
      if (dayGroups[day.toLowerCase()]) {
        dayGroups[day.toLowerCase()].push(slot);
      }
    });

    // Sort slots by time within each day
    Object.keys(dayGroups).forEach(day => {
      dayGroups[day].sort((a, b) => {
        const timeA = a.timeslot?.startTime || '00:00';
        const timeB = b.timeslot?.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    // Convert to array format
    return days.map(day => ({
      name: day,
      periods: dayGroups[day.toLowerCase()] || [],
    }));
  };

  // Render period card component
  const renderPeriodCard = (slot: TimetableSlotDto, index: number) => {
    const subjectName = slot.subject?.name || 'No Subject';
    const subjectCode = slot.subject?.code || '';
    const teacherName = slot.teacher?.user?.fullName || 'TBA';
    const startTime = slot.timeslot?.startTime || '00:00';
    const endTime = slot.timeslot?.endTime || '00:00';
    const slotType = slot.timeslot?.type || 'REGULAR';

    // Check if this is a break period
    const isBreak = slotType === 'BREAK' || subjectName === 'No Subject';

    return (
      <div
        key={slot.id || index}
        className={`rounded-xl border shadow-sm p-4 min-h-[140px] flex flex-col justify-between transition-all duration-200 ${
          isBreak
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : getSubjectColor(subjectName)
        }`}
      >
        {/* Time Badge */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-1 text-xs font-medium'>
            <Clock className='w-3 h-3' />
            <span>
              {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
            </span>
          </div>
          {slotType !== 'REGULAR' && (
            <span className='text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700'>
              {slotType}
            </span>
          )}
        </div>

        {/* Break Card - Show only BREAK */}
        {isBreak ? (
          <div className='flex-1 flex items-center justify-center'>
            <h3 className='text-2xl font-bold text-yellow-800'>BREAK</h3>
          </div>
        ) : (
          <>
            {/* Subject Info */}
            <div className='mb-3'>
              <h3 className='text-lg font-semibold mb-1'>{subjectName}</h3>
              {subjectCode && (
                <p className='text-xs opacity-75 font-medium'>{subjectCode}</p>
              )}
            </div>

            {/* Teacher Info */}
            <div className='flex items-center text-sm mb-2'>
              <User className='w-3 h-3 mr-1' />
              <span className='font-medium'>{teacherName}</span>
            </div>
          </>
        )}

        {/* Room display removed as requested */}
      </div>
    );
  };

  // Create tabs with real data
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
            {day.periods.map((slot, index) => renderPeriodCard(slot, index))}
          </div>
        )}
      </div>
    ),
  }));

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='w-full'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-48 mb-4'></div>
            <div className='h-4 bg-gray-200 rounded w-96 mb-8'></div>
            <CardGridLoader
              cards={18}
              columns='grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              cardHeight='h-36'
            />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='w-full'>
          <div className='text-center py-12'>
            <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Failed to Load Timetable
            </h3>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={loadStudentData}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no schedule message
  if (!hasSchedule) {
    return (
      <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
        <div className='w-full'>
          <SectionTitle
            text='Class Routine'
            level={1}
            className='text-2xl font-bold text-gray-900 mb-2'
          />
          <div className='text-center py-16'>
            <div className='text-6xl mb-4'>📅</div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Schedule Not Planned Yet
            </h3>
            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
              Your class timetable will appear here once it's created by your
              teacher.
            </p>

            {/* Debug Information */}
            {studentProfile && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg mx-auto mb-6'>
                <h4 className='font-semibold text-yellow-900 mb-2'>
                  Debug Info:
                </h4>
                <div className='text-sm text-yellow-800 text-left space-y-1'>
                  <p>
                    <strong>Student ID:</strong> {studentProfile.id}
                  </p>
                  <p>
                    <strong>Class ID:</strong>{' '}
                    {studentProfile.classId || 'Not assigned'}
                  </p>
                  <p>
                    <strong>Class Name:</strong>{' '}
                    {studentProfile.className || 'Not assigned'}
                  </p>
                  <p>
                    <strong>Roll Number:</strong> {studentProfile.rollNumber}
                  </p>
                </div>
                <button
                  onClick={loadStudentData}
                  className='mt-3 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm'
                >
                  Refresh Data
                </button>
              </div>
            )}

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto'>
              <div className='flex items-start space-x-3'>
                <BookOpen className='w-6 h-6 text-blue-600 mt-1' />
                <div className='text-left'>
                  <h4 className='font-semibold text-blue-900 mb-2'>
                    What to expect:
                  </h4>
                  <ul className='text-sm text-blue-800 space-y-1'>
                    <li>• Daily class schedule with subjects and teachers</li>
                    <li>• Time slots and room assignments</li>
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

  // Show timetable
  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 pt-8 pb-12'>
      <div className='w-full'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <SectionTitle
              text='Class Routine'
              level={1}
              className='text-2xl font-bold text-gray-900 mb-2'
            />
            <Label className='text-base text-gray-600'>
              Your weekly class schedule.
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-3 h-3 bg-green-400 rounded-full'></div>
            <span className='text-sm text-gray-600'>Active Schedule</span>
          </div>
        </div>

        <div className='mb-8'>
          <GenericTabs
            tabs={tabsWithNav}
            defaultIndex={new Date().getDay()}
            className=''
          />
        </div>
      </div>
    </div>
  );
}
