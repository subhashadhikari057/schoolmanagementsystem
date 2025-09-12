'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { sidebarItems } from '@/constants/sidebaritems';
import { useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const enableHoverExpand = true; // Always allow hover-to-expand
  const [suppressHover, setSuppressHover] = useState(false); // prevents hover expand until next mouse leave

  const { user } = useAuth();

  // Convert UserRole enum to sidebar key
  const getSidebarRole = (userRole: string | undefined): SidebarRole => {
    const normalizedRole = userRole?.toLowerCase().replace(/_/g, '');

    switch (normalizedRole) {
      case 'admin':
      case 'superadmin':
        return 'Superadmin';
      case 'teacher':
        return 'teacher';
      case 'student':
        return 'student';
      case 'parent':
        return 'parent';
      default:
        return 'student';
    }
  };

  // DEV-ONLY override by path
  let sidebarRole = getSidebarRole(user?.role);
  if (
    typeof window !== 'undefined' &&
    pathname?.includes('dashboard/teacher')
  ) {
    sidebarRole = 'teacher';
  }

  const toggleSidebar = () => {
    if (!isCollapsed) {
      setSuppressHover(true);
      setIsHoverExpanded(false);
      setIsCollapsed(true);
      return;
    }
    setSuppressHover(false);
    setIsCollapsed(false);
  };

  const effectiveRole = sidebarRole;

  const expandedByHover =
    isCollapsed && isHoverExpanded && enableHoverExpand && !suppressHover;

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
          sidebar-scroll
          fixed md:relative top-0 left-0 z-50 md:z-auto
          h-screen border-r border-gray-200 px-4 py-2 bg-white
          transition-[transform,width] duration-150 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${expandedByHover ? 'w-64' : isCollapsed ? 'w-20' : 'w-64'}
          shadow-lg md:shadow-none
        `}
        onMouseEnter={() => {
          if (
            !isOpen &&
            isCollapsed &&
            !suppressHover &&
            typeof window !== 'undefined' &&
            window.innerWidth >= 768
          ) {
            setIsHoverExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (
            !isOpen &&
            isCollapsed &&
            typeof window !== 'undefined' &&
            window.innerWidth >= 768
          ) {
            setIsHoverExpanded(false);
          }
          if (suppressHover) setSuppressHover(false);
        }}
      >
        {/* Logo and Toggle Container */}
        <div className='relative flex flex-col gap-4 items-center justify-between mt-4 mb-8'>
          {/* Mobile Close Button */}
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onToggle?.();
            }}
            className='md:hidden absolute right-3 top-3 z-10 p-1 rounded-md hover:bg-gray-100 text-gray-600'
            aria-label='Close menu'
          >
            <X size={18} />
          </button>

          {/* Logo Section */}
          <div className='flex items-center h-10 w-full relative'>
            {!isCollapsed ? (
              <>
                <div className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                  <span aria-hidden>🎓</span>
                  <span>SMS</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className='hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center justify-center hover:bg-gray-100 rounded-md p-1'
                  aria-label='Collapse sidebar'
                  title='Collapse'
                >
                  <PanelLeftClose size={20} className='text-gray-500' />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className='group/logo relative w-full h-full flex items-center justify-center rounded-md hover:bg-gray-100 focus-visible:outline-none'
                aria-label='Expand sidebar'
                title='Expand'
              >
                {/* default: 🎓 */}
                <span
                  className='text-xl transition-opacity duration-150 group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0'
                  aria-hidden
                >
                  🎓
                </span>
                {/* on hover/focus: show open-panel icon */}
                <span className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                  <PanelLeftOpen
                    size={20}
                    className='text-gray-600 opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100'
                    aria-hidden
                  />
                </span>
              </button>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className='mr-5 mt-2 hidden md:flex items-center justify-center absolute right-0.25 top-3 -translate-y-1/2 hover:bg-gray-100 rounded-md'
              aria-label='Collapse sidebar'
              title='Collapse'
            ></button>
          )}
        </div>

        {/* ProfileDropdown for mobile view */}
        {isOpen && (
          <div className='md:hidden px-4 py-2'>
            <ProfileDropdown />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className='space-y-6 pb-20 md:pb-6 lg:pb-4'>
          {sidebarItems[effectiveRole]?.map(
            (
              section: {
                title: string;
                items: ReadonlyArray<{
                  label: string;
                  icon?: string;
                  path: string;
                }>;
              },
              index: number,
            ) => (
              <div key={index} className='mb-4'>
                <h3 className='mb-2 text-xs font-semibold text-gray-500 uppercase'>
                  {isCollapsed && !expandedByHover && !isOpen
                    ? ''
                    : section.title}
                </h3>
                <ul className='space-y-2'>
                  {section.items.map(
                    (
                      item: Readonly<{
                        label: string;
                        icon?: string;
                        path: string;
                      }>,
                    ) => {
                      const iconName =
                        item.icon && typeof item.icon === 'string'
                          ? item.icon
                          : 'Circle';

                      const Icon =
                        (
                          Icons as unknown as Record<
                            string,
                            ComponentType<{ size?: number; className?: string }>
                          >
                        )[iconName] || Icons.Circle;

                      // Dynamic path for My Account
                      let itemPath = item.path;
                      if (
                        item.path === '/dashboard/system/myprofile' &&
                        user?.id
                      ) {
                        itemPath = `/dashboard/system/myprofile/${user.id}`;
                      }

                      const isActive =
                        pathname === itemPath ||
                        (pathname &&
                          pathname.startsWith(itemPath + '/dashboard'));

                      return (
                        <li key={item.label}>
                          <Link
                            href={itemPath}
                            onClick={_e => {
                              if (
                                typeof window !== 'undefined' &&
                                window.innerWidth < 768 &&
                                onToggle
                              ) {
                                onToggle();
                              }
                            }}
                            className={`group/item flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                              text-foreground
                              ${isCollapsed && !expandedByHover ? 'justify-center' : ''}
                              ${isActive ? 'bg-blue-500 font-bold text-white' : 'hover:bg-muted-hover hover:font-bold'}`}
                            title={isCollapsed ? item.label : ''}
                          >
                            <Icon
                              size={16}
                              className={`flex-shrink-0 transition-transform duration-200 will-change-transform
                                ${isActive ? 'text-white scale-110' : 'text-gray-500 group-hover/item:text-blue-500 group-hover/item:scale-110'}
                              `}
                            />
                            {(!isCollapsed || expandedByHover) && (
                              <span className='truncate'>{item.label}</span>
                            )}
                          </Link>
                        </li>
                      );
                    },
                  )}
                </ul>
              </div>
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
