import ToggleButton from '@/components/atoms/form-controls/ToggleButton';
import { Select } from '../../atoms/interactive/Select';

export const FilterGroup = () => {
  const facultyOptions = [
    { value: 'all', label: 'All Faculty' },
    { value: 'science', label: 'Science' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'arts', label: 'Arts' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'on-leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <div className="flex gap-3">
      <Select options={facultyOptions} />
      <Select options={statusOptions} />
      <ToggleButton >Filters</ToggleButton>
    </div>
  );
};