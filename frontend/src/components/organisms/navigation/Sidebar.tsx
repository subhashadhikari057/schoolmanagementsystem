'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { sidebarItems } from '@/constants/sidebaritems';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import ProfileDropdown from '@/components/molecules/interactive/Dropdown';
import { useAuth } from '@/hooks/useAuth';

type SidebarRole = 'Superadmin' | 'teacher' | 'student' | 'parent';

interface SidebarProps {
  role?: SidebarRole;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onToggle }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  const { role } = useAuth();

  // Convert UserRole enum to sidebar key
  const getSidebarRole = (userRole: any): SidebarRole => {
    switch (userRole) {
      case 'Superadmin':
        return 'Superadmin';
      case 'teacher':
        return 'teacher';
      case 'student':
        return 'student';
      case 'parent':
        return 'parent';
      default:
        return 'student'; // fallback
    }
  };

  const sidebarRole = getSidebarRole(role);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
    sidebar-scroll group
    fixed md:relative top-0 left-0 z-50 md:z-auto
    h-screen border-r border-gray-200 px-4 py-2 bg-white
    transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    ${isCollapsed ? 'w-20' : 'w-64'}
    shadow-lg md:shadow-none
  `}
      >
        {/* Logo and Toggle Container */}
        <div
          className='flex flex-col gap-4 items-center justify-between mt-4 mb-8'
          onMouseEnter={() => setIsHoveringLogo(true)}
          onMouseLeave={() => setIsHoveringLogo(false)}
        >
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className='md:hidden absolute right-3 top-3 p-1 rounded-md hover:bg-gray-100 text-gray-600'
            aria-label='Close menu'
          >
            <X size={18} />
          </button>

          {/* Logo Section */}
          <div className='flex items-center justify-center h-10 w-full relative'>
            {!isCollapsed ? (
              <div className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                <span>🎓</span>
                <span>SMS</span>
              </div>
            ) : (
              <button
                onClick={toggleSidebar}
                className='w-full h-full flex items-center justify-center hover:bg-gray-100 rounded-md'
                aria-label='Expand sidebar'
              >
                {isHoveringLogo ? (
                  <PanelLeftOpen size={20} className='text-gray-600' />
                ) : (
                  <span className='text-xl'>🎓</span>
                )}
              </button>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className='mr-5 mt-2 hidden md:flex items-center justify-center absolute -right-3 top-6 hover:bg-gray-100 rounded-md'
              aria-label='Collapse sidebar'
            >
              <PanelLeftClose size={20} className='text-gray-500' />
            </button>
          )}
        </div>

        {/* ProfileDropdown for mobile view */}
        {isOpen && (
          <div className='md:hidden px-4 py-2'>
            <ProfileDropdown />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className='space-y-6'>
          {sidebarItems[sidebarRole].map((section: any, index: number) => (
            <div key={index} className='mb-4'>
              <h3 className='mb-2 text-xs font-semibold text-gray-500 uppercase'>
                {isCollapsed && !isOpen ? '' : section.title}
              </h3>
              <ul className='space-y-2'>
                {section.items.map((item: any, itemIndex: number) => {
                  const Icon =
                    (
                      Icons as unknown as Record<
                        string,
                        React.ComponentType<{
                          size?: number;
                          className?: string;
                        }>
                      >
                    )[item.icon] || Icons.Circle;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.path}
                        onClick={onToggle} // Close sidebar when navigation link is clicked on mobile
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                             text-foreground hover:bg-muted-hover hover:font-bold
                         ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <Icon
                          size={16}
                          className={`flex-shrink-0 text-gray-500`}
                        />
                        {!isCollapsed && (
                          <span className='truncate'>{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
