import React from 'react'

export default function Label({children,className}: {children: React.ReactNode, className?: string}) {
  return (
      <div className={`text-sm text-gray-500 font-medium ${className}`}>
    {children}
  </div>
  )
}
