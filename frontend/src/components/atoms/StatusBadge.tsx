import React from 'react'

export default function Statusbadge({status, className}: {status: string, className?: string}) {

    const statusStyle  = {
        Active : "",
        Inactive : "",
        scheduled : "",
    }

  return (
     <span>
        {status}
     </span>
  )
}
