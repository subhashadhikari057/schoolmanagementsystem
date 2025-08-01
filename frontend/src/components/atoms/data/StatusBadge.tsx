import React from 'react'

export default function StatusBadge({status, className}: {status: string, className?: string}) {

    const statusStyles = {
        Active: { backgroundColor: "#EAF7F0", color: "#16A34A" },
        Inactive: { backgroundColor: "#FEEFEF", color: "#DC2626" },
        scheduled: { backgroundColor: "#FEFAEE", color: "#D97706" },
        "On Leave": { backgroundColor: "#FEF3C7", color: "#B45309" },
    } as const;

    const getStatusStyle = (status: string) => {
        const normalizedStatus = status as keyof typeof statusStyles;
        return statusStyles[normalizedStatus] || { backgroundColor: "#F3F4F6", color: "#374151" };
    };

  return (
     <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className || ''}`}
        style={getStatusStyle(status)}
     >
        {status}
     </span>
  )
}



