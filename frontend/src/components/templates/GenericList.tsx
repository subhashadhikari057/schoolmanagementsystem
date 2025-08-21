'use client';
import React, { ReactNode, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { ActionButtons } from '../atoms/interactive/ActionButtons';
import LabeledInputField from '../molecules/forms/LabeledInputField';
import Dropdown from '../molecules/interactive/Dropdown';
import SectionTitle from '../atoms/display/SectionTitle';
import GenericTable from './GenericTable';

// Base interfaces for any data type
export interface BaseItem {
  id: number | string;
  [key: string]: unknown;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface TableColumn<T = BaseItem> {
  key: string;
  header: string;
  render?: (
    item: T,
    isSelected?: boolean,
    onSelect?: (id: string | number) => void,
    onSubjectAction?: (action: string, subject: T) => void,
  ) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

export interface ListConfiguration<T = BaseItem> {
  title: string;
  searchPlaceholder: string;
  enableSelection?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  primaryFilter: {
    title: string;
    value?: string;
    onChange?: (value: string) => void;
    options: FilterOption[];
  };
  secondaryFilter: {
    title: string;
    value?: string;
    onChange?: (value: string) => void;
    options: FilterOption[];
  };
  columns: TableColumn<T>[];
  emptyMessage?: string;
  searchFields?: string[];
}

export interface GenericListProps<T extends BaseItem = BaseItem> {
  config: ListConfiguration<T>;
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onSearch?: (term: string) => void;
  onPrimaryFilterChange?: (value: string) => void;
  onSecondaryFilterChange?: (value: string) => void;
  onItemAction?: (action: string, item: T) => void;
  onSubjectAction?: (action: string, item: T) => void; // For subjects-specific actions
  onPageChange?: (page: number) => void;
  customActions?: ReactNode;
  selectedItems?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

export const GenericList = <T extends BaseItem>({
  config,
  data,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onSearch,
  onPrimaryFilterChange,
  onSecondaryFilterChange,
  onItemAction,
  onSubjectAction,
  onPageChange,
  customActions,
  selectedItems = [],
  onSelectionChange,
}: GenericListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState(config.searchValue || '');
  const [primaryFilter, setPrimaryFilter] = useState(
    config.primaryFilter.value || 'all',
  );
  const [secondaryFilter, setSecondaryFilter] = useState(
    config.secondaryFilter.value || 'all',
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    config.onSearchChange?.(value);
    onSearch?.(value);
  };

  const handlePrimaryFilterChange = (value: string) => {
    setPrimaryFilter(value);
    config.primaryFilter.onChange?.(value);
    onPrimaryFilterChange?.(value);
  };

  const handleSecondaryFilterChange = (value: string) => {
    setSecondaryFilter(value);
    config.secondaryFilter.onChange?.(value);
    onSecondaryFilterChange?.(value);
  };

  // Sync local state with controlled values
  React.useEffect(() => {
    if (config.searchValue !== undefined) {
      setSearchTerm(config.searchValue);
    }
  }, [config.searchValue]);

  React.useEffect(() => {
    if (config.primaryFilter.value !== undefined) {
      setPrimaryFilter(config.primaryFilter.value);
    }
  }, [config.primaryFilter.value]);

  React.useEffect(() => {
    if (config.secondaryFilter.value !== undefined) {
      setSecondaryFilter(config.secondaryFilter.value);
    }
  }, [config.secondaryFilter.value]);

  return (
    <div className='px-1 sm:px-2 lg:px-0 max-w-7xl mx-auto'>
      <div className='bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow mb-4 sm:mb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6'>
          <SectionTitle
            level={1}
            className='text-lg sm:text-xl lg:text-2xl font-semibold'
            text={config.title}
          />
          <div className='flex-shrink-0'>{customActions}</div>
        </div>

        {/* Search and Filters */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6'>
          {/* Search Field */}
          <div className='flex-1 max-w-sm'>
            <LabeledInputField
              type='search'
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              icon={<Search className='text-primary cursor-pointer' />}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
            <Dropdown
              type='filter'
              title={config.primaryFilter.title}
              options={config.primaryFilter.options}
              selectedValue={primaryFilter}
              onSelect={handlePrimaryFilterChange}
              placeholder={config.primaryFilter.title}
              icon={<Filter size={16} />}
            />
            <Dropdown
              type='filter'
              title={config.secondaryFilter.title}
              options={config.secondaryFilter.options}
              selectedValue={secondaryFilter}
              onSelect={handleSecondaryFilterChange}
              placeholder={config.secondaryFilter.title}
              icon={<Filter size={16} />}
            />
          </div>
        </div>

        {/* Generic Table */}
        <GenericTable
          data={data}
          columns={config.columns}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          emptyMessage={config.emptyMessage || 'No data available'}
          onItemAction={onItemAction}
          onSubjectAction={onSubjectAction}
          onPageChange={onPageChange}
          enableSelection={config.enableSelection}
          selectedItems={selectedItems}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </div>
  );
};

export default GenericList;
