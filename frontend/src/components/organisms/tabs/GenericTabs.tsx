// components/organisms/Tabs.tsx
'use client';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import ReusableButton from '@/components/atoms/form-controls/Button';

interface TabItem {
  name: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultIndex?: number;
  selectedIndex?: number; // For controlled state
  onChange?: (index: number) => void; // For controlled state
  className?: string;
}

export default function Tabs({
  tabs,
  defaultIndex = 0,
  selectedIndex,
  onChange,
  className = '',
}: TabsProps) {
  // Use controlled state if provided, otherwise use defaultIndex
  const isControlled = selectedIndex !== undefined && onChange !== undefined;

  return (
    <div className={` w-full ${className}`}>
      <TabGroup
        selectedIndex={isControlled ? selectedIndex : undefined}
        defaultIndex={isControlled ? undefined : defaultIndex}
        onChange={isControlled ? onChange : undefined}
      >
        <TabList className='flex rounded-full items-center justify-between mb-2 bg-white shadow-sm p-2 overflow-x-auto no-scrollbar'>
          {tabs.map((tab, _idx) => (
            <Tab key={tab.name} className='flex-1 focus:outline-none'>
              {({ selected }) => (
                <ReusableButton
                  onClick={() => {}}
                  label={tab.name}
                  as='div'
                  className={`w-full min-w-max px-8 sm:px-10 py-3 rounded-full font-medium transition-colors duration-200 text-center ${
                    selected
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white !text-black hover:bg-gray-100'
                  }`}
                />
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map(tab => (
            <TabPanel key={tab.name} className='pt-2 px-6 pb-6 rounded-md'>
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
