'use client';

import React from 'react';

export interface SimpleTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SimpleTabsProps {
  tabs: SimpleTabItem[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

const SimpleTabs: React.FC<SimpleTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className='flex space-x-1 rounded-xl bg-gray-100 p-1'>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onChange(index)}
            className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === index
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            {tab.icon && <span className='mr-2'>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleTabs;
