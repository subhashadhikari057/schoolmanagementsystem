'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import { timetableService } from '@/api/services/timetable.service';
import { TimetableSlotDto } from '@sms/shared-types';
import { toast } from 'sonner';

interface TodaysClassesProps {
  classId: string;
  className?: string;
}

interface ProcessedClass {
  id: string;
  subject: string;
  subjectCode: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  status: 'completed' | 'upcoming' | 'in-progress' | 'pending';
  timeUntilStart?: number; // minutes until class starts
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
    'bg-pink-50 border-pink-200 text-pink-800', // Pink
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

// Helper function to determine class status
const getClassStatus = (
  startTime: string,
  endTime: string,
): ProcessedClass['status'] => {
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

// Helper function to get time until class starts
const getTimeUntilStart = (startTime: string): number => {
  const now = new Date();
  const [startHour, startMin] = startTime.split(':').map(Number);
  const classStart = new Date();
  classStart.setHours(startHour, startMin, 0, 0);

  const diffMs = classStart.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60)); // minutes
};

export const TodaysClasses: React.FC<TodaysClassesProps> = ({
  classId,
  className,
}) => {
  const [classes, setClasses] = useState<ProcessedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodaysClasses();
  }, [classId]);

  const loadTodaysClasses = async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await timetableService.getTimetableByClass(classId);

      if (response.success && response.data) {
        // Get today's day name
        const today = new Date()
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();

        // Filter today's classes
        const todaysSlots = response.data.filter(
          slot => slot.day.toLowerCase() === today,
        );

        // Process and sort classes by time
        const processedClasses = todaysSlots
          .map(slot => {
            const subjectName = slot.subject?.name || 'No Subject';
            const subjectCode = slot.subject?.code || '';
            const teacherName = slot.teacher?.user?.fullName || 'TBA';
            // Removed room display as requested
            const startTime = slot.timeslot?.startTime || '00:00';
            const endTime = slot.timeslot?.endTime || '00:00';

            const status = getClassStatus(startTime, endTime);
            const timeUntilStart =
              status === 'upcoming' ? getTimeUntilStart(startTime) : undefined;

            return {
              id: slot.id || `${subjectName}-${startTime}`,
              subject: subjectName,
              subjectCode,
              teacher: teacherName,
              room: '', // Removed room display
              startTime: formatTime12Hour(startTime),
              endTime: formatTime12Hour(endTime),
              status,
              timeUntilStart,
            };
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        setClasses(processedClasses);
      } else {
        setError(response.error || "Failed to load today's classes");
        setClasses([]);
      }
    } catch (err: any) {
      console.error("Error loading today's classes:", err);
      setError(err.message || "Failed to load today's classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Update class statuses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setClasses(prevClasses =>
        prevClasses.map(cls => ({
          ...cls,
          status: getClassStatus(cls.startTime, cls.endTime),
          timeUntilStart:
            getClassStatus(cls.startTime, cls.endTime) === 'upcoming'
              ? getTimeUntilStart(cls.startTime)
              : undefined,
        })),
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-gray-700'>
            Today's Classes
          </h3>
          <span className='text-xs text-blue-600 hover:text-blue-800 cursor-pointer'>
            View All
          </span>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='bg-gray-100 rounded-lg p-3 animate-pulse'>
              <div className='flex justify-between mb-2'>
                <div className='h-5 w-12 bg-gray-200 rounded-full'></div>
              </div>
              <div className='h-4 bg-gray-200 rounded mb-1'></div>
              <div className='h-3 w-16 bg-gray-200 rounded mb-2'></div>
              <div className='space-y-1'>
                <div className='h-3 w-20 bg-gray-200 rounded'></div>
                <div className='h-3 w-24 bg-gray-200 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-gray-700'>
            Today's Classes
          </h3>
          <span className='text-xs text-blue-600 hover:text-blue-800 cursor-pointer'>
            View All
          </span>
        </div>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center'>
          <AlertCircle className='w-8 h-8 text-red-500 mx-auto mb-2' />
          <p className='text-sm text-red-600'>{error}</p>
          <button
            onClick={loadTodaysClasses}
            className='mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-gray-700'>
            Today's Classes
          </h3>
          <span className='text-xs text-blue-600 hover:text-blue-800 cursor-pointer'>
            View All
          </span>
        </div>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 text-center'>
          <BookOpen className='w-8 h-8 text-blue-500 mx-auto mb-2' />
          <p className='text-sm text-blue-600'>
            No classes scheduled for today
          </p>
          <p className='text-xs text-blue-500 mt-1'>Enjoy your free time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700'>Today's Classes</h3>
        <span className='text-xs text-blue-600 hover:text-blue-800 cursor-pointer'>
          View All
        </span>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
        {classes.map(cls => {
          let cardColor = 'bg-white border-gray-200';
          let textColor = 'text-gray-900';
          let infoColor = 'text-gray-600';
          let statusText = '';
          let statusIcon = null;
          let statusBadgeColor = 'bg-gray-100 text-gray-600';

          switch (cls.status) {
            case 'completed':
              cardColor = 'bg-green-50 border-green-200';
              textColor = 'text-gray-900';
              infoColor = 'text-gray-600';
              statusText = 'Done';
              statusIcon = '✓';
              statusBadgeColor = 'bg-green-100 text-green-700';
              break;
            case 'in-progress':
              cardColor = 'bg-blue-50 border-blue-200';
              textColor = 'text-gray-900';
              infoColor = 'text-gray-600';
              statusText = 'Now';
              statusIcon = '●';
              statusBadgeColor = 'bg-blue-100 text-blue-700';
              break;
            case 'upcoming':
              if (cls.timeUntilStart && cls.timeUntilStart <= 10) {
                cardColor = 'bg-yellow-50 border-yellow-200';
                textColor = 'text-gray-900';
                infoColor = 'text-gray-600';
                statusText = `${cls.timeUntilStart}m`;
                statusIcon = '⏰';
                statusBadgeColor = 'bg-yellow-100 text-yellow-700';
              } else {
                cardColor = 'bg-white border-gray-200';
                textColor = 'text-gray-900';
                infoColor = 'text-gray-600';
                statusText = cls.startTime;
                statusIcon = '⏰';
                statusBadgeColor = 'bg-gray-100 text-gray-600';
              }
              break;
            case 'pending':
            default:
              cardColor = 'bg-gray-50 border-gray-200';
              textColor = 'text-gray-700';
              infoColor = 'text-gray-500';
              statusText = 'Later';
              statusIcon = '○';
              statusBadgeColor = 'bg-gray-100 text-gray-500';
              break;
          }

          return (
            <div
              key={cls.id}
              className={`${cardColor} rounded-lg border shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group p-3`}
            >
              {/* Compact Header with Status and Time */}
              <div className='flex items-center justify-between mb-2'>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeColor}`}
                >
                  {statusIcon} {statusText}
                </div>
              </div>

              {/* Subject Info - Compact */}
              <div className='mb-2'>
                <h3
                  className={`text-sm font-bold ${textColor} group-hover:text-blue-600 transition-colors line-clamp-2`}
                >
                  {cls.subject}
                </h3>
                {cls.subjectCode && (
                  <p className={`text-xs ${infoColor} opacity-75`}>
                    {cls.subjectCode}
                  </p>
                )}
              </div>

              {/* Teacher and Time - Single Line */}
              <div className='space-y-1'>
                <div className='flex items-center text-xs'>
                  <User className='w-3 h-3 mr-1 text-gray-400' />
                  <span className={`${infoColor} truncate`}>{cls.teacher}</span>
                </div>
                <div className='flex items-center text-xs text-gray-500'>
                  <Clock className='w-3 h-3 mr-1' />
                  <span>
                    {cls.startTime} - {cls.endTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
