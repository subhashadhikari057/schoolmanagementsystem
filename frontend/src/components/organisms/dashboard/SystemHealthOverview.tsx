import React from 'react'
import ChartHeader from '@/components/molecules/interactive/ChartHeader';
import ChartCard from '@/components/atoms/display/ChartCard';
import SystemStatus from '@/components/molecules/cards/SystemStatus';

export default function SystemHealthOverview() {
  return (
   <ChartCard className='w-full p-4 lg:p-6'>
     <ChartHeader title="System Health Overview" toggleLabel="Real-time"/>
     <div className="mt-4">
       <SystemStatus />
     </div>
   </ChartCard>
  )
}
