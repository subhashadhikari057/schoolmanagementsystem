'use client';

import { useState } from 'react';
import Sidebar from "../organisms/Sidebar";
import Navbar from "../organisms/Navbar";
import SearchBar from "../molecules/LabeledInputField";
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'Superadmin' | 'teacher' | 'student' | 'parent';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {role} = useAuth();

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
        
        {/* Main content with blur effect when sidebar is open */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${
          isMobileSidebarOpen ? 'filter blur-sm' : ''
        }`}>
          <main className="px-4 sm:px-6 py-4 sm:py-6 bg-background">
            {children}
          </main>
        </div>
        
        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="md:hidden fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white w-full max-w-md mx-4 rounded-lg p-6 shadow-lg">
              <div className="mb-6">
                <SearchBar />
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