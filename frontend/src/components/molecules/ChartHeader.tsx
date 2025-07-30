import { Heading } from 'lucide-react'
import React from 'react'
import ToggleButton from '../atoms/ToggleButton'

export default function ChartHeader({title,toggleLabel}: {title: string, toggleLabel?: string}) {
  return (
    <div className="flex justify-between items-center mb-2">
        <Heading>{title}</Heading>
        <ToggleButton>{toggleLabel}</ToggleButton>
    </div>
  )
}
