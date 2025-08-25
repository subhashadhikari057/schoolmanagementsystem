'use client';

import React from 'react';
import ChartCard from '@/components/atoms/display/ChartCard';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import BarLegend from '@/components/molecules/interactive/BarLegend';
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className='bg-gray-200 text-sm text-gray-800 px-3 py-1 rounded shadow'
      style={{ width: 'fit-content' }}
    >
      <p className='font-medium'>{label}</p>
      {payload.map((entry, index: number) => (
        <p key={index}>{`${entry.name}: ${entry.value}`}</p>
      ))}
    </div>
  );
};

const data = [
  { day: 'Sun', students: 90, teachers: 10 },
  { day: 'Mon', students: 95, teachers: 5 },
  { day: 'Tue', students: 85, teachers: 15 },
  { day: 'Wed', students: 92, teachers: 8 },
  { day: 'Thu', students: 93, teachers: 7 },
  { day: 'Fri', students: 88, teachers: 12 },
];

export default function AttendanceOverview() {
  return (
    <ChartCard className='p-12'>
      <ChartHeader title='Attendance Overview' toggleLabel='Daily' />
      <ResponsiveContainer width='100%' height={240}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
          barCategoryGap='20%'
        >
          <XAxis
            dataKey='day'
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#374151' }}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            radius={[3, 3, 0, 0]}
            dataKey='students'
            stackId='a'
            fill='#3b82f6'
            maxBarSize={35}
          />
          <Bar
            radius={[3, 3, 0, 0]}
            dataKey='teachers'
            stackId='a'
            fill='#d1d5db'
            maxBarSize={35}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className='mt-5'>
        {' '}
        <BarLegend
          items={[
            { label: 'Students', color: '#3b82f6' },
            { label: 'Teachers', color: '#d1d5db' },
          ]}
        />
      </div>
    </ChartCard>
  );
}
