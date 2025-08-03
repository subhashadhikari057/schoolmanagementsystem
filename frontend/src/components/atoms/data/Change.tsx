import React from 'react'

export default function Change({value, isPositive=true, className}: {value: string | number, isPositive?: boolean, className?: string}) {
  return (
    <div className={`text-xs sm:text-sm flex items-center flex-wrap ${className}`}>
      <span className={`${isPositive ? 'text-green-600' : 'text-red-600'} whitespace-nowrap`}>
        {isPositive ? '↗' : '↘'} {value}
      </span>
      <span className="text-gray-500 ml-1 whitespace-nowrap">from last month</span>
    </div>
  )
}



