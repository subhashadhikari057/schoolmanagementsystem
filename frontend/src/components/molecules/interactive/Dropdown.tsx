'use client';

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  ChevronUp,
  ChevronDown,
  User as UserIcon,
  Key,
  LogOut,
  BarChart2,
} from 'lucide-react';
import Avatar from '@/components/atoms/display/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAnalyticsOverview } from '@/context/AnalyticsOverviewContext';
import { useRouter } from 'next/navigation';
import ChangePasswordModal from '@/components/organisms/modals/ChangePasswordModal';
import { Menu, Transition } from '@headlessui/react';
import { AuthUser } from '@/api/types/auth';

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

const getUserDisplayName = (user: AuthUser | null) => {
  if (!user) return 'Guest User';

  if (user.full_name) {
    const nameParts = user.full_name.trim().split(' ');
    return nameParts.length > 1 ? nameParts[0] : user.full_name;
  }

  if (user.email) {
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return 'Guest User';
};

const getUserRole = (role: string) => {
  if (!role) return 'guest';

  const roleMap: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  };

  return roleMap[role] || role.toLowerCase();
};

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // SECURITY: Preserve last known user info during logout to prevent "Guest User" flash
  const lastKnownUser = useRef<AuthUser | null>(null);

  // Update last known user only when we have valid user data
  useEffect(() => {
    if (user) {
      lastKnownUser.current = user;
    }
  }, [user]);

  // Use last known user info during logout/loading states
  const displayUser = user || lastKnownUser.current;

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { showAnalytics, toggleAnalytics } = useAnalyticsOverview();

  // Profile dropdown options with Animesh's View Profile change
  const profileOptions = useMemo(() => {
    const opts = [
      {
        value: 'profile',
        label: 'View Profile',
        icon: <UserIcon size={16} />,
        onClick: () => {
          if (displayUser) {
            router.push(`/dashboard/system/myprofile/${displayUser.id}`);
          }
        },
      },
      {
        value: 'password',
        label: 'Change Password',
        icon: <Key size={16} />,
        onClick: () => setIsModalOpen(true),
      },
      {
        value: 'logout',
        label: 'Logout',
        icon: <LogOut size={16} />,
        onClick: logout,
      },
    ];
    if (displayUser?.role === 'superadmin') {
      opts.push({
        value: 'toggle-analytics',
        label: showAnalytics ? 'Hide Analytics' : 'Show Analytics',
        icon: <BarChart2 size={12} />,
        onClick: toggleAnalytics,
      });
    }
    return opts;
  }, [router, displayUser, showAnalytics, toggleAnalytics, logout]);

  const currentOptions = useMemo(
    () => (type === 'profile' ? profileOptions : options),
    [type, profileOptions, options],
  );

  const selectedOption = useMemo(() => {
    if (type === 'filter') {
      return (
        options.find(option => option.value === selectedValue) || {
          label: placeholder,
        }
      );
    }
    return null;
  }, [type, options, selectedValue, placeholder]);

  const handleOptionClick = useCallback(
    (value: string) => {
      if (type === 'filter') {
        onSelect?.(value);
        setIsFilterOpen(false); // Close dropdown after selection
      }
    },
    [type, onSelect],
  );

  const toggleFilterDropdown = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  // Close dropdown on outside click (only for filter)
  useEffect(() => {
    if (type !== 'filter') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [type]);

  if (type === 'profile') {
    return (
      <>
        <div
          className={`relative inline-block text-left w-full ${className || ''}`}
        >
          <Menu>
            {({ open }: { open: boolean }) => (
              <div className='w-full'>
                {/* Profile Button */}
                <Menu.Button
                  className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg transition-all ${
                    open ? 'rounded-b-none shadow-sm' : 'shadow-sm'
                  }`}
                >
                  <Avatar
                    name={
                      displayUser?.full_name ||
                      displayUser?.email ||
                      'Guest User'
                    }
                    className='w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0'
                    showInitials={true}
                  />
                  <div className='text-left flex-1 min-w-0 hidden sm:block'>
                    <p className='text-sm font-semibold text-foreground truncate'>
                      {getUserDisplayName(displayUser)}
                    </p>
                    <p className='text-xs text-secondary truncate capitalize'>
                      {getUserRole(displayUser?.role || '')}
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

                {/* Dropdown Menu */}
                <Transition
                  enter='transition ease-out duration-100'
                  enterFrom='transform opacity-0 -translate-y-1'
                  enterTo='transform opacity-100 translate-y-0'
                  leave='transition ease-in duration-75'
                  leaveFrom='transform opacity-100 translate-y-0'
                  leaveTo='transform opacity-0 -translate-y-1'
                >
                  <Menu.Items className='absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-b-lg shadow-lg z-50'>
                    <div className='p-2 space-y-1'>
                      {currentOptions.map(option => (
                        <Menu.Item key={option.value}>
                          {({ active }: { active: boolean }) => (
                            <button
                              onClick={option.onClick}
                              className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors ${
                                active
                                  ? 'bg-gray-100 text-primary font-bold'
                                  : 'text-gray-700 font-normal'
                              }`}
                            >
                              {option.icon && (
                                <span
                                  className={
                                    active ? 'text-primary' : 'text-gray-500'
                                  }
                                >
                                  {option.icon}
                                </span>
                              )}
                              <span className='flex-1 text-left'>
                                {option.label}
                              </span>
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </div>
            )}
          </Menu>
        </div>
        <ChangePasswordModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Filter dropdown
  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left min-w-[160px] w-full ${className || ''}`}
    >
      {/* Filter Button */}
      <button
        onClick={toggleFilterDropdown}
        className='flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition-all text-sm w-full min-w-[160px] max-w-xs font-medium outline-none'
        type='button'
      >
        {icon && <span className='text-gray-500'>{icon}</span>}
        <span className='text-gray-700 truncate'>{selectedOption?.label}</span>
        {isFilterOpen ? (
          <ChevronUp
            size={18}
            className='text-gray-500 transition-transform ml-auto'
          />
        ) : (
          <ChevronDown
            size={18}
            className='text-gray-500 transition-transform ml-auto'
          />
        )}
      </button>

      {/* Filter Dropdown Menu - Only show when isFilterOpen is true */}
      {isFilterOpen && (
        <div className='absolute top-full left-0 mt-2 w-full min-w-[160px] max-w-xs bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fade-in'>
          <div className='py-1'>
            {title && (
              <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100'>
                {title}
              </div>
            )}
            {currentOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-all duration-150 ${
                  selectedValue === option.value
                    ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                type='button'
              >
                {option.label}
                {selectedValue === option.value && (
                  <div className='ml-auto w-2 h-2 bg-blue-600 rounded-full'></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
