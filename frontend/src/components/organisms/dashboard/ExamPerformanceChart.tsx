'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from '@/components/atoms/display/ChartCard';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
const data = [
  { subject: 'Math', marks: 75 },
  { subject: 'Science', marks: 40 },
  { subject: 'English', marks: 60 },
  { subject: 'Nepali', marks: 70 },
  { subject: 'Social', marks: 65 },
];
export default function ExamPerformanceChart() {
  return (
    <ChartCard className='p-12'>
      <ChartHeader title='Exam Performance' toggleLabel='Subject-wise' />
      <ResponsiveContainer width='100%' height={240}>
        <LineChart data={data}>
          <XAxis dataKey='subject' />
          <YAxis />
          <Tooltip />
          <Line
            type='bump'
            dot={{ r: 8 }}
            activeDot={{ r: 12 }}
            dataKey='marks'
            stroke='#3b82f6'
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
