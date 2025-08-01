import React from 'react'

export default function ColorIndicator({color}: {color: string}) {
  return (
 <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
  )
}



