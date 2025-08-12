'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { sidebarItems } from '@/constants/sidebaritems';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import ProfileDropdown from '@/components/molecules/interactive/Dropdown';
import { useAuth } from '@/hooks/useAuth';
import { isDevMockEnabled } from '@/utils';

type SidebarRole = 'Superadmin' | 'teacher' | 'student' | 'parent' | 'staff';

interface SidebarProps {
  role?: SidebarRole;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const enableHoverExpand = true; // Always allow hover-to-expand
  const [suppressHover, setSuppressHover] = useState(false); // prevents hover expand until next mouse leave

  const { user } = useAuth();

  // Convert UserRole enum to sidebar key
  const getSidebarRole = (userRole: string | undefined): SidebarRole => {
    // Normalize the role to handle backend inconsistencies (e.g., SUPER_ADMIN -> superadmin)
    const normalizedRole = userRole?.toLowerCase().replace(/_/g, '');

    switch (normalizedRole) {
      case 'admin':
      case 'superadmin':
        return 'Superadmin'; // Admin and superadmin users get Superadmin sidebar
      case 'teacher':
        return 'teacher';
      case 'student':
        return 'student';
      case 'parent':
        return 'parent';
      case 'staff':
        return 'staff';
      default:
        return 'student'; // fallback
    }
  };

  const sidebarRole = getSidebarRole(user?.role);

  const toggleSidebar = () => {
    // If we are collapsing on desktop while the cursor is inside,
    // suppress hover expansion until the next mouseleave
    if (!isCollapsed) {
      setSuppressHover(true);
      setIsHoverExpanded(false);
      setIsCollapsed(true);
      return;
    }
    // Expanding via button clears suppression
    setSuppressHover(false);
    setIsCollapsed(false);
  };

  // Development mode bypass
  const showInDev = isDevMockEnabled();
  const devRole = 'Superadmin'; // Default role for development

  // Early return if no user or no sidebar items for role (unless in dev mode)
  if (!showInDev && (!user || !sidebarItems[sidebarRole])) {
    return null;
  }

  // Use dev role if in development mode without user
  const effectiveRole = showInDev && !user ? devRole : sidebarRole;

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
    sidebar-scroll group
    fixed md:relative top-0 left-0 z-50 md:z-auto
    h-screen border-r border-gray-200 px-4 py-2 bg-white
    transition-all duration-300 ease-in-out
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
          // Leaving the sidebar clears suppression so next enter can expand
          if (suppressHover) setSuppressHover(false);
        }}
      >
        {/* Logo and Toggle Container */}
        <div
          className='flex flex-col gap-4 items-center justify-between mt-4 mb-8'
          onMouseEnter={() => setIsHoveringLogo(true)}
          onMouseLeave={() => setIsHoveringLogo(false)}
        >
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
        <nav className='space-y-6 pb-20 md:pb-6 lg:pb-4'>
          {sidebarItems[effectiveRole]?.map(
            (
              section: {
                title: string;
                items: Array<{ label: string; icon: string; path: string }>;
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
                    (item: { label: string; icon: string; path: string }) => {
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
                      const isActive =
                        pathname === item.path ||
                        pathname.startsWith(item.path + '/');
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.path}
                            onClick={onToggle} // Close sidebar when navigation link is clicked on mobile
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                              text-foreground hover:bg-muted-hover hover:font-bold
                              ${isCollapsed && !expandedByHover ? 'justify-center' : ''}
                              ${isActive ? 'bg-gray-100 font-bold text-primary' : ''}`}
                            title={isCollapsed ? item.label : ''}
                          >
                            <Icon
                              size={16}
                              className={`flex-shrink-0 text-gray-500`}
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

        {/* My Account Link at the end */}
        {isDevMockEnabled() && !user && (
          <div className='mb-4 mt-2'>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/dashboard/system/myprofile/devuser'
                  onClick={onToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                    text-foreground hover:bg-muted-hover hover:font-bold
                    ${isCollapsed && !expandedByHover ? 'justify-center' : ''}`}
                  title={isCollapsed ? 'My Account' : ''}
                >
                  <Icons.UserCog
                    size={16}
                    className='flex-shrink-0 text-gray-500'
                  />
                  {(!isCollapsed || expandedByHover) && (
                    <span className='truncate'>My Account</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}
        {user && (
          <div className='mb-4 mt-2'>
            <ul className='space-y-2'>
              <li>
                <Link
                  href={`/dashboard/system/myprofile/${user.id}`}
                  onClick={onToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                    text-foreground hover:bg-muted-hover hover:font-bold
                    ${isCollapsed && !expandedByHover ? 'justify-center' : ''}`}
                  title={isCollapsed ? 'My Account' : ''}
                >
                  <Icons.UserCog
                    size={16}
                    className='flex-shrink-0 text-gray-500'
                  />
                  {(!isCollapsed || expandedByHover) && (
                    <span className='truncate'>My Account</span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </aside>
    </>
  );
}
