import React, { useState } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Icon from '@/components/atoms/display/Icon';
import Label from '@/components/atoms/display/Label';
import { Bell, AlertCircle, CheckCircle, Info, X, Check } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
}

interface NotificationPanelProps {
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  hideHeading?: boolean;
}

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertCircle;
    case 'error':
      return X;
    case 'info':
    default:
      return Info;
  }
};

const getNotificationColor = (
  type: NotificationItem['type'],
  isRead: boolean,
) => {
  const baseOpacity = isRead ? 'opacity-60' : '';

  switch (type) {
    case 'success':
      return `bg-green-100 text-green-600 ${baseOpacity}`;
    case 'warning':
      return `bg-orange-100 text-orange-600 ${baseOpacity}`;
    case 'error':
      return `bg-red-100 text-red-600 ${baseOpacity}`;
    case 'info':
    default:
      return `bg-blue-100 text-blue-600 ${baseOpacity}`;
  }
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  hideHeading,
}) => {
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([
    {
      id: '1',
      title: 'New Student Enrollment',
      message: '5 new students have been enrolled today',
      time: '10 minutes ago',
      type: 'success',
      isRead: false,
    },
    {
      id: '2',
      title: 'Fee Payment Reminder',
      message: '15 students have pending fee payments',
      time: '1 hour ago',
      type: 'warning',
      isRead: false,
    },
    {
      id: '3',
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight at 11:00 PM',
      time: '2 hours ago',
      type: 'info',
      isRead: true,
    },
    {
      id: '4',
      title: 'Assignment Deadline',
      message: 'Mathematics assignment due in 2 days',
      time: '4 hours ago',
      type: 'warning',
      isRead: false,
    },
    {
      id: '5',
      title: 'Server Error Resolved',
      message: 'Grade submission issue has been fixed',
      time: 'Yesterday',
      type: 'success',
      isRead: true,
    },
  ]);

  const notificationList = notifications || localNotifications;
  const unreadCount = notificationList.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    } else {
      setLocalNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      setLocalNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true })),
      );
    }
  };

  return (
    <div className='bg-white rounded-xl sm:p-4'>
      {!hideHeading && (
        <div className='flex items-center p-2 justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <SectionTitle
              text='Notifications'
              className='text-base sm:text-lg font-semibold text-gray-900'
            />
            {unreadCount > 0 && (
              <span className='bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center'>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors'
            >
              Mark all read
            </button>
          )}
        </div>
      )}

      <div className='space-y-3 max-h-80 overflow-y-auto modal-scrollbar'>
        {notificationList.map(notification => {
          const IconComponent = getNotificationIcon(notification.type);
          const colorClasses = getNotificationColor(
            notification.type,
            notification.isRead,
          );

          return (
            <div
              key={notification.id}
              className={`flex items-start gap-2 sm:gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'bg-blue-50/30' : ''
              }`}
            >
              <Icon
                className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${colorClasses}`}
              >
                <IconComponent className='w-3 h-3 sm:w-4 sm:h-4' />
              </Icon>

              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <h4
                      className={`text-xs sm:text-sm font-medium text-gray-900 mb-1 ${
                        notification.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <p
                      className={`text-xs text-gray-600 mb-1 line-clamp-2 ${
                        notification.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      {notification.message}
                    </p>
                    <Label
                      className={`text-xs text-gray-500 ${
                        notification.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      {notification.time}
                    </Label>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className='flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
                      title='Mark as read'
                    >
                      <Check className='w-3 h-3' />
                    </button>
                  )}
                </div>
              </div>

              {!notification.isRead && (
                <div className='flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1'></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPanel;
