'use client'

import React, { useState } from 'react'
import SectionHeader from '../molecules/SectionHeader'
import NotificationItem from '../molecules/NotificationItem'
import { Notification } from '../../types/NotficationItemsTypes'

interface NotificationsProps {
  notifications: Notification[]
}

export default function Notifications({ notifications }: NotificationsProps) {
  const [notificationList, setNotificationList] = useState(notifications)

  const handleMarkAsRead = (id: string) => {
    setNotificationList(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: !notification.read }
          : notification
      )
    )
  }

  const markAllRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <SectionHeader
        title="Notifications"
        actionText="Mark All Read"
        onActionClick={markAllRead}
      />
      <div className="space-y-2">
        {notificationList.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>
    </div>
  )
}
