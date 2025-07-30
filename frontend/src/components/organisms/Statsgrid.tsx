import React from 'react'
import { LucideIcon } from 'lucide-react';
import StatCard from '../molecules/StatCard';

type StatItem = {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  value: string;
  label: string;
  change: string;
  isPositive: boolean;
};

export default function Statsgrid({stats}: {stats:StatItem[] }) {
  return (
<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8' >
    {
        stats.map((stat,index)=>(
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
        ))
    }
</div>
  )
}
