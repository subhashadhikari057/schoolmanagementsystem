import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { MoreVertical } from 'lucide-react';
import Icon from '@/components/atoms/display/Icon';
import { Notification } from '@/types/NotficationItemsTypes';

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const iconStyles = {
    info: '',
    warning: '',
    success: '',
    error: '',
  };
  return (
    <div
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors group ${
        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      <Icon className={iconStyles[notification.type]}>{notification.icon}</Icon>

      <div className='flex-1 min-w-0'>
        <h3
          className={`font-medium mb-1 ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}
        >
          {notification.title}
        </h3>
        <p className='text-sm text-gray-600 mb-2'>{notification.description}</p>
        <span className='text-xs text-gray-400'>{notification.time}</span>
      </div>

      <Menu as={Fragment}>
        <div className='relative opacity-0 group-hover:opacity-100 transition-opacity'>
          <Menu.Button className='p-1 rounded-full hover:bg-gray-200'>
            <MoreVertical className='w-4 h-4 text-gray-500' />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter='transition ease-out duration-100'
            enterFrom='transform opacity-0 scale-95'
            enterTo='transform opacity-100 scale-100'
            leave='transition ease-in duration-75'
            leaveFrom='transform opacity-100 scale-100'
            leaveTo='transform opacity-0 scale-95'
          >
            <Menu.Items className='absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10'>
              <div className='px-1 py-1'>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      {notification.read ? 'Mark as Unread' : 'Mark as Read'}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      className={`${
                        active ? 'bg-red-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </div>
      </Menu>
    </div>
  );
}
