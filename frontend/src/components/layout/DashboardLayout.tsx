'use client';

import { useState, useEffect } from 'react';
import Sidebar from "../organisms/navigation/Sidebar";
import Navbar from "../organisms/navigation/Navbar";
import { useAuth } from '@/hooks/useAuth';
import LabeledInputField from "../molecules/forms/LabeledInputField";
type UserRole = 'Superadmin' | 'teacher' | 'student' | 'parent';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {role} = useAuth();

  // Track if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
        }
        if (isSearchOpen) {
          setIsSearchOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen, isSearchOpen]);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Hidden on mobile by default, overlay when open */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onToggle={toggleMobileSidebar}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar should always be clear */}
        <Navbar 
          onMenuClick={toggleMobileSidebar}
          onSearchClick={toggleSearch}
        />
        
        {/* Main content with blur effect when sidebar is open on mobile only */}
        <div 
          className={`flex-1 overflow-auto transition-all duration-300 ${
            isMobileSidebarOpen && isMobile ? 'blur-sm' : ''
          }`}
          onClick={() => {
            // Close sidebar when clicking on main content area on mobile
            if (isMobileSidebarOpen && isMobile) {
              setIsMobileSidebarOpen(false);
            }
          }}
        >
          <main className="px-4 sm:px-6 py-4 sm:py-6 bg-background">
            {children}
          </main>
        </div>
        
        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="md:hidden fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white w-full max-w-md mx-4 rounded-lg p-6 shadow-lg">
              <div className="mb-6">
                <LabeledInputField
                  label="Search"
                  type="search"
                  value=""
                  onChange={() => {}}
                  placeholder="Search..."
                />
              </div>
              <button
                onClick={toggleSearch}
                className="w-full py-3 text-center text-secondary text-sm hover:text-primary transition-colors border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


