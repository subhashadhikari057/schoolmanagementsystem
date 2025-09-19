import { Bell, Menu, Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState, useEffect } from 'react';
import { sidebarItems } from '@/constants/sidebaritems';
import ProfileDropdown from '@/components/molecules/interactive/Dropdown';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import { usePathname } from 'next/navigation';
import { useScheduleStore } from '@/store/schedule';

interface NavbarProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export default function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<
    { label: string; icon: string; path: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();
  // Schedule store for dynamic dashboard content
  const scheduleStore = useScheduleStore();

  // Show search bar only on main dashboard page for each role
  const dashboardPaths = [
    '/dashboard/admin',
    '/dashboard/teacher',
    '/dashboard/student',
    '/dashboard/parent',
  ];
  const showSearchBar = dashboardPaths.includes(pathname);

  // Determine dashboard type from pathname
  let dashboardType: 'Superadmin' | 'teacher' | 'student' | 'parent' =
    'Superadmin';
  if (pathname.startsWith('/dashboard/teacher')) dashboardType = 'teacher';
  else if (pathname.startsWith('/dashboard/student')) dashboardType = 'student';
  else if (pathname.startsWith('/dashboard/parent')) dashboardType = 'parent';

  // Helper: get dashboard page/component titles, descriptions, stat/section labels, and dynamic content
  function getDashboardContent(
    type: string,
  ): { label: string; path: string; icon: string }[] {
    // Only aggregate sidebar items for all dashboards
    const sidebar = (sidebarItems as any)[type] || [];
    const content: { label: string; path: string; icon: string }[] = [];
    sidebar.forEach((section: any) => {
      section.items.forEach((item: any) => {
        content.push({
          label: item.label,
          path: item.path,
          icon: item.icon || 'Search',
        });
      });
    });
    return content;
  }

  // Search handler for corresponding dashboard
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    // Get all dashboard content for current dashboard
    const items = getDashboardContent(dashboardType);
    // Fuzzy search by label and path
    const results = items.filter(
      item =>
        item.label.toLowerCase().includes(value.toLowerCase()) ||
        (item.path && item.path.toLowerCase().includes(value.toLowerCase())),
    );
    setSearchResults(
      results.map(item => ({
        label: item.label,
        path: item.path,
        icon: item.icon || 'Search',
      })),
    );
    setShowDropdown(results.length > 0);
  };
  return (
    <header className='flex justify-between items-center px-3 md:px-6  bg-white shadow-sm z-10 relative'>
      {/* Mobile Left Section - Hamburger */}
      <div className='flex items-center md:hidden'>
        <button
          onClick={onMenuClick}
          className='p-2 rounded-lg hover:bg-muted-hover text-primary transition-colors'
          aria-label='Toggle menu'
        >
          <Menu className='w-6 h-6' />
        </button>
      </div>

      {/* Desktop Search Bar */}
      <div className='hidden md:flex items-center gap-3 flex-1 max-w-sm'>
        <div className='flex-1'>
          {showSearchBar && (
            <div className='relative'>
              <LabeledInputField
                type='search'
                placeholder='Search dashboard...'
                value={searchTerm}
                onChange={handleSearchChange}
                icon={<Search className='text-primary cursor-pointer' />}
              />
              {showDropdown && (
                <div className='absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 w-[340px] min-w-[260px] max-w-[360px]'>
                  <div className='py-2'>
                    {searchResults.length === 0 ? (
                      <div className='px-4 py-2 text-gray-500 text-sm'>
                        No results found
                      </div>
                    ) : (
                      <>
                        {searchResults.slice(0, 7).map(item => {
                          const Icon =
                            (Icons as any)[item.icon] || Icons.Search;
                          let description =
                            'Navigate to ' + item.label + ' page.';
                          if (item.label === 'Dashboard')
                            description = 'Main dashboard overview.';
                          if (item.label === 'Parents')
                            description = 'Manage and view parent information.';
                          if (item.label === 'Students')
                            description =
                              'Manage and view student information.';
                          if (item.label === 'Teachers')
                            description =
                              'Manage and view teacher information.';
                          if (item.label === 'Staff')
                            description = 'Manage and view staff information.';
                          if (item.label === 'Classes')
                            description = 'View and manage academic classes.';
                          if (item.label === 'Subjects')
                            description = 'View and manage academic subjects.';
                          if (item.label === 'Attendance')
                            description =
                              'Track and manage attendance records.';
                          if (item.label === 'Assignments')
                            description = 'View and manage assignments.';
                          if (item.label === 'Exams')
                            description = 'View and manage exams.';
                          if (item.label === 'Notices')
                            description = 'View important notices.';
                          if (
                            item.label === 'Complaints and leaves' ||
                            item.label === 'Complaints' ||
                            item.label === 'Complaints and Requests'
                          )
                            description =
                              'Submit or review complaints and leave requests.';
                          if (item.label === 'Fees')
                            description = 'View and manage fee information.';
                          if (item.label === 'TimeTable')
                            description = 'View class timetable.';
                          if (item.label === 'ID Management')
                            description =
                              'Generate and manage student/teacher IDs.';
                          if (item.label === 'Academic Calendar')
                            description = 'View academic calendar and events.';
                          if (item.label === 'Finance Overview')
                            description = 'Overview of school finances.';
                          if (item.label === 'Fee Management')
                            description = 'Manage fee collection and records.';
                          if (item.label === 'Expenses')
                            description = 'Track and manage expenses.';
                          if (item.label === 'Reports')
                            description = 'View school reports.';
                          if (item.label === 'Analytics')
                            description = 'View analytics and statistics.';
                          if (item.label === 'Notifications')
                            description = 'View system notifications.';
                          if (item.label === 'Settings')
                            description = 'System settings and configuration.';
                          return (
                            <a
                              key={item.path + item.label}
                              href={item.path}
                              className='flex items-start gap-3 px-4 py-3 hover:bg-blue-50 text-gray-800 text-sm cursor-pointer rounded-md transition-colors'
                              onClick={() => {
                                setSearchTerm('');
                                setShowDropdown(false);
                              }}
                              style={{ textDecoration: 'none' }}
                            >
                              <Icon size={20} className='text-gray-400 mt-1' />
                              <div className='flex flex-col'>
                                <span className='font-semibold text-base'>
                                  {item.label}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  {description}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                        {searchResults.length > 7 && (
                          <div className='px-4 py-2 text-center text-xs text-blue-600 cursor-pointer hover:underline'>
                            More results available...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Center - Logo */}
      <div className='flex-1 flex justify-center md:hidden'>
        <div className='text-lg font-bold text-gray-800'>🎓 SMS</div>
      </div>

      {/* Right Section */}
      <div className='flex items-center gap-2'>
        {/* Mobile Search Icon */}
        {showSearchBar && (
          <button
            onClick={onSearchClick}
            className='md:hidden p-2 rounded-lg hover:bg-muted-hover text-primary transition-colors'
            aria-label='Search'
          >
            <Search className='w-5 h-5' />
          </button>
        )}

        {/* Desktop Notifications */}
        <div className='hidden sm:flex items-center gap-3'>
          <Bell className='text-secondary w-5 h-5' />
        </div>
        <div className='hidden sm:block w-[1.5px] h-6 bg-border ml-3' />
        {/* ProfileDropdown - Desktop only */}
        <div className='hidden md:block'>
          <ProfileDropdown className='mx-2 md:mx-3 my-1' />
        </div>
      </div>
    </header>
  );
}
