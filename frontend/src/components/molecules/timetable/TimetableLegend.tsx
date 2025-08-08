import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface LegendItem {
  type: string;
  label: string;
  color: string;
}

interface TimetableLegendProps {
  weeklyHours: number;
  totalSubjects: number;
  lastUpdated: Date;
  className?: string;
}

const legendItems: LegendItem[] = [
  {
    type: 'regular',
    label: 'Regular Subject',
    color: 'bg-blue-50 border-blue-200',
  },
  { type: 'break', label: 'Break', color: 'bg-yellow-50 border-yellow-200' },
  { type: 'lunch', label: 'Lunch', color: 'bg-green-50 border-green-200' },
  {
    type: 'study_hall',
    label: 'Study Hall',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    type: 'activity',
    label: 'Activity',
    color: 'bg-orange-50 border-orange-200',
  },
  {
    type: 'free_period',
    label: 'Free Period',
    color: 'bg-gray-50 border-gray-200',
  },
];

export default function TimetableLegend({
  weeklyHours,
  totalSubjects,
  lastUpdated,
  className,
}: TimetableLegendProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className='text-lg font-semibold'>Legend & Stats</h3>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Legend */}
          <div>
            <h4 className='font-medium text-sm text-gray-700 mb-3'>
              Period Types
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              {legendItems.map(item => (
                <div key={item.type} className='flex items-center gap-2'>
                  <div className={`w-4 h-4 rounded border-2 ${item.color}`} />
                  <span className='text-sm text-gray-600'>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h4 className='font-medium text-sm text-gray-700 mb-3'>
              Weekly Statistics
            </h4>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Weekly Hours:</span>
                <span className='text-sm font-medium'>{weeklyHours}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Subjects:</span>
                <span className='text-sm font-medium'>{totalSubjects}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Last Updated:</span>
                <span className='text-sm font-medium'>
                  {lastUpdated.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
