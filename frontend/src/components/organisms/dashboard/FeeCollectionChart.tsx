'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartCard from '@/components/atoms/display/ChartCard';
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
  { month: 'Jan', collected: 10000, pending: 40000 },
  { month: 'Feb', collected: 12000, pending: 36000 },
  { month: 'Mar', collected: 11000, pending: 39000 },
  { month: 'Apr', collected: 15000, pending: 33000 },
  { month: 'May', collected: 13000, pending: 35000 },
  { month: 'Jun', collected: 14000, pending: 42000 },
];

export default function FeeCollectionChart() {
  return (
    <ChartCard className='p-12'>
      <ChartHeader title='Fee Collection' toggleLabel='Half-year' />
      <ResponsiveContainer width='100%' height={240}>
        <AreaChart data={data}>
          <XAxis dataKey='month' />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />

          {/* PENDING AREA (Bottom) */}
          <Area
            type='linear'
            dataKey='pending'
            stackId='1'
            fill='#EB5757'
            stroke='#EB5757' // Add matching stroke
            fillOpacity={1} // Remove default opacity
          />

          {/* COLLECTED AREA (Top) */}
          <Area
            type='linear'
            dataKey='collected'
            stackId='1'
            fill='#2F80ED'
            stroke='#2F80ED' // Add matching stroke
            fillOpacity={1} // Remove default opacity
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className='mt-5'>
        <BarLegend
          items={[
            { label: 'Collected', color: '#2F80ED' },
            { label: 'Pending', color: '#EB5757' },
          ]}
        />
      </div>
    </ChartCard>
  );
}
