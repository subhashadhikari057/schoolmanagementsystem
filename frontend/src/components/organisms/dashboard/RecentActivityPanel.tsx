import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Icon from '@/components/atoms/display/Icon';
import Label from '@/components/atoms/display/Label';
import { User, FileText, Upload, UserCheck, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  description: string;
  time: string;
  type: 'assignment' | 'profile' | 'upload' | 'approval' | 'general';
}

interface RecentActivityPanelProps {
  activities?: ActivityItem[];
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'assignment':
      return FileText;
    case 'profile':
      return User;
    case 'upload':
      return Upload;
    case 'approval':
      return UserCheck;
    default:
      return Clock;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'assignment':
      return 'text-blue-600 bg-blue-50';
    case 'profile':
      return 'text-green-600 bg-green-50';
    case 'upload':
      return 'text-purple-600 bg-purple-50';
    case 'approval':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export default function RecentActivityPanel({ activities }: RecentActivityPanelProps) {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      user: 'John Smith',
      action: 'added a new assignment',
      description: '2 hours ago',
      time: '2 hours ago',
      type: 'assignment'
    },
    {
      id: '2',
      user: 'Sarah Johnson',
      action: 'updated profile information',
      description: '4 hours ago',
      time: '4 hours ago',
      type: 'profile'
    },
    {
      id: '3',
      user: 'Michael Chen',
      action: 'uploaded 24 files',
      description: 'Yesterday',
      time: 'Yesterday',
      type: 'upload'
    },
    {
      id: '4',
      user: 'Emily Rodriguez',
      action: 'Approved 56 students HW',
      description: 'Yesterday',
      time: 'Yesterday',
      type: 'approval'
    },
    {
      id: '5',
      user: 'Michael Chen',
      action: 'uploaded 24 files',
      description: 'Yesterday',
      time: 'Yesterday',
      type: 'upload'
    }
  ];

  const activityList = activities || defaultActivities;

  return (
    <div className="bg-white rounded-xl sm:p-4">
      <SectionTitle text="Recent Activity" className="text-base sm:text-lg font-semibold text-gray-900 mb-3" />
      
      <div className="space-y-3">
        {activityList.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
              <Icon className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
                <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
              </Icon>
              <div className="flex-1 min-w-0">
                <div className="mb-1 overflow-hidden">
                  <span className="text-xs sm:text-sm font-normal text-blue-600">
                    {activity.user}
                  </span>
                  <span className="text-xs text-gray-700 ml-1">
                    {activity.action}
                  </span>
                </div>
                <Label className="text-xs text-gray-500">
                  {activity.time}
                </Label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
