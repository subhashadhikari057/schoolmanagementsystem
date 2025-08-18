import React from 'react';
import Dropdown from '@/components/molecules/interactive/Dropdown';

interface ChildSwitcherProps {
  children: Array<{ id: string; name: string; class: string; section: string }>;
  activeChildId: string;
  setActiveChildId: (id: string) => void;
}

const ChildSwitcher: React.FC<ChildSwitcherProps> = ({
  children,
  activeChildId,
  setActiveChildId,
}) => (
  <div className='mb-6 flex items-center gap-4'>
    <span className='font-medium'>Switch Child:</span>
    <Dropdown
      type='filter'
      options={children.map(child => ({
        value: child.id,
        label: `${child.name} (Class ${child.class}${child.section})`,
      }))}
      selectedValue={activeChildId}
      onSelect={setActiveChildId}
      placeholder='Select Child'
    />
  </div>
);

export default ChildSwitcher;
