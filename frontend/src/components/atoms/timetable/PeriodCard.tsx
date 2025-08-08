import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PeriodData } from '@/types/timetable';
import {
  formatTeacherName,
  formatRoomNumber,
} from '@/utils/timetableFormatters';

interface PeriodCardProps {
  period: PeriodData;
  className?: string;
}

const getPeriodTypeColor = (type: string) => {
  switch (type) {
    case 'regular':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    case 'break':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'lunch':
      return 'bg-green-50 border-green-200 text-green-900';
    case 'study_hall':
      return 'bg-purple-50 border-purple-200 text-purple-900';
    case 'activity':
      return 'bg-orange-50 border-orange-200 text-orange-900';
    case 'free_period':
      return 'bg-gray-50 border-gray-200 text-gray-900';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

export default function PeriodCard({ period, className }: PeriodCardProps) {
  const colorClasses = getPeriodTypeColor(period.type);

  return (
    <Card
      className={`${colorClasses} border-2 h-full min-h-[80px] ${className}`}
    >
      <CardContent className='p-2 h-full flex flex-col justify-between'>
        <div>
          <h4 className='font-semibold text-sm leading-tight mb-1'>
            {period.subject}
          </h4>
          {period.teacher.firstName && period.teacher.lastName && (
            <p className='text-xs opacity-80'>
              {formatTeacherName(
                period.teacher.firstName,
                period.teacher.lastName,
              )}
            </p>
          )}
        </div>
        {period.room && (
          <p className='text-xs opacity-70 mt-1'>
            {period.room.startsWith('Room')
              ? period.room
              : formatRoomNumber(period.room)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
