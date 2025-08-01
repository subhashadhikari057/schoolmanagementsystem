import React, { ReactNode, useState } from 'react';
import { Search, Filter } from "lucide-react";
import { ActionButtons } from "../atoms/interactive/ActionButtons";
import LabeledInputField from "../molecules/forms/LabeledInputField";
import Dropdown from "../molecules/interactive/Dropdown";
import SectionTitle from "../atoms/display/SectionTitle";
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
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

export interface ListConfiguration {
  title: string;
  searchPlaceholder: string;
  primaryFilter: {
    title: string;
    options: FilterOption[];
  };
  secondaryFilter: {
    title: string;
    options: FilterOption[];
  };
  columns: TableColumn[];
  emptyMessage?: string;
}

export interface GenericListProps<T extends BaseItem = BaseItem> {
  config: ListConfiguration;
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onSearch?: (term: string) => void;
  onPrimaryFilterChange?: (value: string) => void;
  onSecondaryFilterChange?: (value: string) => void;
  onItemAction?: (action: string, item: T) => void;
  customActions?: ReactNode;
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
  customActions
}: GenericListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState("all");
  const [secondaryFilter, setSecondaryFilter] = useState("all");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handlePrimaryFilterChange = (value: string) => {
    setPrimaryFilter(value);
    onPrimaryFilterChange?.(value);
  };

  const handleSecondaryFilterChange = (value: string) => {
    setSecondaryFilter(value);
    onSecondaryFilterChange?.(value);
  };

  return (
    <div className="px-1 sm:px-2 lg:px-0 mr-4 lg:mr-0">
      <div className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <SectionTitle 
            level={1} 
            className="text-lg sm:text-xl lg:text-2xl font-bold" 
            text={config.title} 
          />
          <div className="flex-shrink-0">
            {customActions || <ActionButtons />}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Search Field */}
          <div className="flex-1 max-w-sm">
            <LabeledInputField
              type="search"
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              icon={<Search className="text-primary cursor-pointer" />}
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Dropdown
              type="filter"
              title={config.primaryFilter.title}
              options={config.primaryFilter.options}
              selectedValue={primaryFilter}
              onSelect={handlePrimaryFilterChange}
              placeholder={config.primaryFilter.title}
              icon={<Filter size={16} />}
            />
            <Dropdown
              type="filter"
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
          emptyMessage={config.emptyMessage || "No data available"}
          onItemAction={onItemAction}
        />
      </div>
    </div>
  );
};

export default GenericList;
