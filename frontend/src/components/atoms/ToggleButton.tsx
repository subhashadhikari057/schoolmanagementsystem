import { Button } from '@headlessui/react'
import React from 'react'

export default function ToggleButton({children, className}: {children: React.ReactNode, className?: string}) {
  return (
    <Button className={`text-sm text-gray-500 border px-2 py-1 rounded hover:bg-gray-100 ${className}`}>
      {children}
    </Button>
  )
}
