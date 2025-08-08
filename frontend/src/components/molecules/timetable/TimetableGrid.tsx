import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PeriodCard from '@/components/atoms/timetable/PeriodCard';
import { TimeSlotData } from '@/types/timetable';

interface TimetableGridProps {
  schedule: TimeSlotData[];
  className?: string;
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const dayKeys = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export default function TimetableGrid({
  schedule,
  className,
}: TimetableGridProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
          <div className='min-w-[800px]'>
            {/* Header Row */}
            <div className='grid grid-cols-8 bg-gray-50 border-b'>
              <div className='p-3 font-semibold text-sm text-gray-700 border-r'>
                Time Slot
              </div>
              {days.map(day => (
                <div
                  key={day}
                  className='p-3 font-semibold text-sm text-gray-700 text-center border-r last:border-r-0'
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Schedule Rows */}
            {schedule.map((timeSlot, index) => (
              <div
                key={index}
                className='grid grid-cols-8 border-b last:border-b-0'
              >
                {/* Time Slot Column */}
                <div className='p-3 text-sm font-medium text-gray-600 border-r bg-gray-25 flex items-center'>
                  {timeSlot.timeSlot}
                </div>

                {/* Period Columns */}
                {dayKeys.map(dayKey => (
                  <div
                    key={dayKey}
                    className='p-2 border-r last:border-r-0 min-h-[100px]'
                  >
                    {timeSlot.periods[dayKey] ? (
                      <PeriodCard period={timeSlot.periods[dayKey]!} />
                    ) : (
                      <div className='h-full min-h-[80px] bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center'>
                        <span className='text-xs text-gray-400'>
                          Free Period
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
