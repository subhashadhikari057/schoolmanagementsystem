import React from 'react'
import Label from "@/components/atoms/display/Label";
import Metric from "@/components/atoms/data/Metric";
import Change from "@/components/atoms/data/Change";

export default function MetricDisplay({value, label, change, isPositive = true}:{value: string | number, label: string, change: string | number, isPositive?: boolean}) {
  return (
    <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
      <Label>{label}</Label>
      <Metric value={value} />
      <Change value={change} isPositive={isPositive} />
    </div>
  )
}



