import React from 'react'
import Label from '@/components/atoms/Label';
import Metric from '@/components/atoms/Metric';
import Change from '@/components/atoms/Change';

export default function MetricDisplay({value, label, change, isPositive = true}:{value: string | number, label: string, change: string | number, isPositive?: boolean}) {
  return (
   <div className="space-y-2">
    <Label>{label}</Label>
    <Metric value={value} />
    <Change value={change} isPositive={isPositive} />
  </div>
  )
}
