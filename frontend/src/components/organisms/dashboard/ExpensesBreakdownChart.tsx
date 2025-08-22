'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ChartCard from '@/components/atoms/display/ChartCard';
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import BarLegend from '@/components/molecules/interactive/BarLegend';
const data = [
  { name: 'Salaries', value: 40 },
  { name: 'Infrastructure', value: 25 },
  { name: 'Resources', value: 20 },
  { name: 'Others', value: 15 },
];
const COLORS = ['#3b82f6', '#22c55e', '#facc15', '#ef4444'];
export default function ExpensesBreakdownChart() {
  return (
    <ChartCard className='p-4 sm:p-8 md:p-12'>
      <ChartHeader title='Expenses Breakdown' toggleLabel='Annual' />
      <ResponsiveContainer
        width='100%'
        height={140}
        className='sm:h-[180px] md:h-[200px]'
      >
        <PieChart>
          <Pie
            data={data}
            labelLine={false}
            nameKey='name'
            outerRadius={60}
            label={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className='mt-5 grid grid-cols-2 grid-rows-2 gap-2 sm:grid-cols-4 sm:grid-rows-1 sm:gap-4'>
        {data.map((item, i) => (
          <div key={item.name} className='flex items-center'>
            <BarLegend
              items={[
                {
                  label: `${item.name} (${item.value}%)`,
                  color: COLORS[i],
                },
              ]}
            />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
