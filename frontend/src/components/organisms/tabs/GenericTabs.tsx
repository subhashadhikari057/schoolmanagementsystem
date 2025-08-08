// components/organisms/Tabs.tsx
import { useState } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import ReusableButton from '@/components/atoms/form-controls/Button';

interface TabItem {
  name: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  className?: string;
}

export default function Tabs({
  tabs,
  defaultIndex = 0,
  className = '',
}: TabsProps) {
  return (
    <div className={` w-full ${className}`}>
      <TabGroup defaultIndex={defaultIndex}>
        <TabList className='flex rounded-full items-center justify-between mb-4 bg-white shadow-sm p-1'>
          {tabs.map((tab, idx) => (
            <Tab key={tab.name} className='flex-1 focus:outline-none'>
              {({ selected }) => (
                <ReusableButton
                  onClick={() => {}}
                  label={tab.name}
                  as='div'
                  className={`w-full px-8 py-2 rounded-full font-medium transition-colors duration-200 text-center ${
                    selected
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                />
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => (
            <TabPanel key={tab.name} className='p-4 rounded-md'>
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
