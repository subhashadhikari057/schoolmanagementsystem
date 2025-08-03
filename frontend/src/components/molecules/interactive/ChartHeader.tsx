'use client';

import React from 'react'
import SectionTitle from "@/components/atoms/display/SectionTitle"
import ToggleButton from "@/components/atoms/form-controls/ToggleButton"

export default function ChartHeader({title,toggleLabel,className,toggleClassName}: {title: string, toggleLabel?: string, className?: string, toggleClassName?: string}) {
  return (
    <div className={`flex justify-between items-center mb-2 mx-4 ${className}`}>
        <SectionTitle text={title} level={3} />
        <ToggleButton className={`${toggleClassName}`}>{toggleLabel}</ToggleButton>
    </div>
  )
}



