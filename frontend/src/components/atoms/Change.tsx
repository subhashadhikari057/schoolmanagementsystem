import React from 'react'

export default function Change({value, isPositive=true, className}: {value: string | number, isPositive?: boolean, className?: string}) {
  return (
    <div className={`text-sm flex items-center ${className}`}>
    <span className={`${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? '↗' : '↘'} {value}
    </span>
    <span className="text-gray-500 ml-1">from last month</span>
  </div>
  )
}
