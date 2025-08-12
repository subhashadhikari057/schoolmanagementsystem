import React from 'react';

import StatCard from '@/components/molecules/cards/StatCard';

type StatItem = {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  value: string;
  label: string;
  change: string;
  isPositive: boolean;
};

export default function Statsgrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-5 lg:mb-6 w-full'>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          bgColor={stat.bgColor}
          iconColor={stat.iconColor}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          isPositive={stat.isPositive}
        />
      ))}
    </div>
  );
}
