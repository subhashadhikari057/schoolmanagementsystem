import { Bell, Mail, Menu, Search } from 'lucide-react';
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
                <div className='absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-64 overflow-auto'>
                  {searchResults.map(item => {
                    const Icon = (Icons as any)[item.icon] || Icons.Search;
                    return (
                      <a
                        key={item.path + item.label}
                        href={item.path}
                        className='flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-gray-800 text-sm cursor-pointer'
                        onClick={() => {
                          setSearchTerm('');
                          setShowDropdown(false);
                        }}
                      >
                        <Icon size={16} className='text-gray-400' />
                        <span className='font-semibold'>{item.label}</span>
                        <span className='ml-2 text-gray-400'>{item.path}</span>
                      </a>
                    );
                  })}
                  {searchResults.length === 0 && (
                    <div className='px-4 py-2 text-gray-500 text-sm'>
                      No results found
                    </div>
                  )}
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
          <Mail className='text-secondary w-5 h-5' />
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
