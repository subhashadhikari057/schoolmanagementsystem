import React from 'react'
import Icon from '@/components/atoms/display/Icon'
import StatusBadge from '@/components/atoms/data/StatusBadge'
import Metric from '@/components/atoms/data/Metric'
import { Server, Database, HardDrive, Wifi } from 'lucide-react'

const systemMetrics = [
  {
    id: "server",
    label: "Server Uptime",
    value: 85,
    icon: Server,
    color: "text-blue-500",
    status: "Active"
  },
  {
    id: "database", 
    label: "Database Load",
    value: 65,
    icon: Database,
    color: "text-blue-600",
    status: "Active"
  },
  {
    id: "storage",
    label: "Storage Used",
    value: 45,
    icon: HardDrive,
    color: "text-purple-500",
    status: "Active"
  },
  {
    id: "network",
    label: "Network Usage", 
    value: 92,
    icon: Wifi,
    color: "text-green-500",
    status: "Active"
  }
];

export default function SystemStatus({className}: {className?: string}) {
  return (
    <div className={className}>
      {/* Mobile: Horizontal scroll cards, Desktop: Grid */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-6 flex lg:flex-none gap-3 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-3 lg:pb-0">
        {systemMetrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5 min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Icon with background */}
              <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-50 flex items-center justify-center ${metric.color.replace('text-', 'bg-').replace('-500', '-50')}`}>
                <Icon>
                  <metric.icon size={20} className={metric.color} />
                </Icon>
              </div>
              
              {/* Metric value */}
              <div className="space-y-1">
                <Metric 
                  value={`${metric.value}%`}
                  className="text-xl lg:text-2xl font-bold text-gray-900"
                />
                <p className="text-xs lg:text-sm text-gray-600">{metric.label}</p>
                <StatusBadge status={metric.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile scroll indicators */}
      <div className="flex justify-center space-x-1 mt-3 lg:hidden">
        {systemMetrics.map((_, index) => (
          <div key={index} className="w-2 h-2 rounded-full bg-gray-300"></div>
        ))}
      </div>
    </div>
  )
}