'use client';

import { Menu, Transition } from '@headlessui/react';
import { ChevronUp, ChevronDown, User as UserIcon, Key, LogOut } from 'lucide-react';
import Avatar from '../atoms/Avatar';
import { Fragment } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileDropdown({ className }: { className?: string }) {
  const { User, role } = useAuth();

  const dropdownBg = 'bg-background';
  const hoverBg = 'bg-muted-hover';

  return (
    <Menu as="div" className={`relative inline-block text-left w-full ${className}`}>
      {({ open }) => (
        <>
          {/* === Profile Button === */}
          <Menu.Button
            className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 w-full bg-white border border-gray-200 rounded-lg transition-all ${
              open ? 'rounded-b-none shadow-sm' : 'shadow-sm'
            }`}
          >
            <Avatar src="/avatar.jpg" className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0" />
            <div className="text-left flex-1 min-w-0 hidden sm:block">
              <p className="text-sm font-semibold text-foreground truncate">{User.name}</p>
              <p className="text-xs text-secondary truncate capitalize">{role}</p>
            </div>
            {open ? (
              <ChevronUp size={16} className="text-secondary ml-auto flex-shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-secondary ml-auto flex-shrink-0" />
            )}
          </Menu.Button>

          {/* === Dropdown Menu === */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 -translate-y-1"
            enterTo="transform opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 translate-y-0"
            leaveTo="transform opacity-0 -translate-y-1"
          >
            <Menu.Items
              className={`absolute top-full left-0 mt-1 w-full ${dropdownBg} border border-muted rounded-b-lg shadow-lg z-50`}
            >
              <div className="p-2 space-y-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                        active ? `${hoverBg} text-primary font-bold` : 'text-secondary font-normal'
                      }`}
                    >
                      <UserIcon size={16} className={active ? 'text-primary' : 'text-secondary'} />
                      <span>View Profile</span>
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                        active ? `${hoverBg} text-primary font-bold` : 'text-secondary font-normal'
                      }`}
                    >
                      <Key size={16} className={active ? 'text-primary' : 'text-secondary'} />
                      <span>Change Password</span>
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                        active ? `${hoverBg} text-hover font-bold` : 'text-hover font-normal'
                      }`}
                    >
                      <LogOut size={16} className="text-hover" />
                      <span>Logout</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
