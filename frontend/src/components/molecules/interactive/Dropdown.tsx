'use client';

import { Menu, Transition } from '@headlessui/react';
import {
  ChevronUp,
  ChevronDown,
  User as UserIcon,
  Key,
  LogOut,
} from 'lucide-react';
import Avatar from '@/components/atoms/display/Avatar';
import { Fragment } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface DropdownProps {
  className?: string;
  type?: 'profile' | 'filter';
  title?: string;
  options?: DropdownOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function Dropdown({
  className,
  type = 'profile',
  title,
  options = [],
  selectedValue,
  onSelect,
  placeholder = 'Select option',
  icon,
}: DropdownProps) {
  const { user } = useAuth();
  const { logout } = useAuthStore();

  const dropdownBg = 'bg-background';
  const hoverBg = 'bg-muted-hover';

  // Profile dropdown options
  const profileOptions = [
    {
      value: 'profile',
      label: 'View Profile',
      icon: <UserIcon size={16} />,
      onClick: () => console.log('View Profile'),
    },
    {
      value: 'password',
      label: 'Change Password',
      icon: <Key size={16} />,
      onClick: () => console.log('Change Password'),
    },
    {
      value: 'logout',
      label: 'Logout',
      icon: <LogOut size={16} />,
      onClick: () => {
        console.log('🚪 Logging out user...');
        void logout();
      },
    },
  ];

  const currentOptions = type === 'profile' ? profileOptions : options;
  const selectedOption =
    type === 'filter'
      ? options.find(option => option.value === selectedValue) || {
          label: placeholder,
        }
      : null;

  if (type === 'profile') {
    return (
      <Menu>
        {({ open }: { open: boolean }) => (
          <div
            className={`relative inline-block text-left w-full ${className}`}
          >
            <>
              {/* === Profile Button === */}
              <Menu.Button
                className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 w-full bg-white border border-gray-200 rounded-lg transition-all ${
                  open ? 'rounded-b-none shadow-sm' : 'shadow-sm'
                }`}
              >
                <Avatar className='w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0' />
                <div className='text-left flex-1 min-w-0 hidden sm:block'>
                  <p className='text-sm font-semibold text-foreground truncate'>
                    {user
                      ? `${user.firstName} ${user.lastName}`.trim() ||
                        user.email
                      : 'User'}
                  </p>
                  <p className='text-xs text-secondary truncate capitalize'>
                    {user?.role?.replace('_', ' ') || 'user'}
                  </p>
                </div>
                {open ? (
                  <ChevronUp
                    size={16}
                    className='text-secondary ml-auto flex-shrink-0'
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className='text-secondary ml-auto flex-shrink-0'
                  />
                )}
              </Menu.Button>

              {/* === Dropdown Menu === */}
              <Transition
                as={Fragment}
                enter='transition ease-out duration-100'
                enterFrom='transform opacity-0 -translate-y-1'
                enterTo='transform opacity-100 translate-y-0'
                leave='transition ease-in duration-75'
                leaveFrom='transform opacity-100 translate-y-0'
                leaveTo='transform opacity-0 -translate-y-1'
              >
                <Menu.Items
                  className={`absolute top-full left-0 mt-1 w-full ${dropdownBg} border border-muted rounded-b-lg shadow-lg z-50`}
                >
                  <div className='p-2 space-y-1'>
                    {currentOptions.map(option => (
                      <Menu.Item key={option.value}>
                        {({ active }: { active: boolean }) => (
                          <button
                            onClick={option.onClick}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                              active
                                ? `${hoverBg} text-primary font-bold`
                                : 'text-secondary font-normal'
                            } ${option.value === 'logout' ? 'text-hover' : ''}`}
                          >
                            {option.icon && (
                              <span
                                className={
                                  active ? 'text-primary' : 'text-secondary'
                                }
                              >
                                {option.icon}
                              </span>
                            )}
                            <span>{option.label}</span>
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </>
          </div>
        )}
      </Menu>
    );
  }

  // Filter dropdown
  return (
    <Menu>
      {({ open }: { open: boolean }) => (
        <div className={`relative inline-block text-left ${className}`}>
          <>
            <Menu.Button className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm'>
              {icon && <span className='text-gray-500'>{icon}</span>}
              <span className='text-gray-700'>{selectedOption?.label}</span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
              />
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
              <Menu.Items className='absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                <div className='p-1'>
                  {title && (
                    <div className='px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100'>
                      {title}
                    </div>
                  )}
                  {currentOptions.map(option => (
                    <Menu.Item key={option.value}>
                      {({ active }: { active: boolean }) => (
                        <button
                          onClick={() => onSelect?.(option.value)}
                          className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700'
                          } ${
                            selectedValue === option.value
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : ''
                          }`}
                        >
                          {option.label}
                          {selectedValue === option.value && (
                            <div className='ml-auto w-2 h-2 bg-blue-600 rounded-full'></div>
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </>
        </div>
      )}
    </Menu>
  );
}
