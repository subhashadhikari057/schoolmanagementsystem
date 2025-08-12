'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { debounce } from 'lodash';

interface FilterOption {
  value: string;
  label: string;
}

export interface TeacherFilters {
  search: string;
  designation: string;
  subjects: string;
  employeeId?: string; // Added for employee ID search
}

interface TeacherSearchFilterProps {
  onFilterChange: (filters: TeacherFilters) => void;
  designations: FilterOption[];
  subjects: FilterOption[];
  initialFilters?: Partial<TeacherFilters>;
  className?: string;
}

const TeacherSearchFilter: React.FC<TeacherSearchFilterProps> = ({
  onFilterChange,
  designations,
  subjects,
  initialFilters = {},
  className = '',
}) => {
  const [filters, setFilters] = useState<TeacherFilters>({
    search: initialFilters.search || '',
    designation: initialFilters.designation || '',
    subjects: initialFilters.subjects || '',
  });

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.designation) count++;
    if (filters.subjects) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Create a stable debounced function that doesn't recreate on every render
  const debouncedSearchFn = useMemo(
    () =>
      debounce((searchValue: string, currentFilters: TeacherFilters) => {
        setFilters(prev => ({ ...prev, search: searchValue }));
        onFilterChange({ ...currentFilters, search: searchValue });
      }, 500),
    [onFilterChange],
  );

  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearchFn.cancel();
    };
  }, [debouncedSearchFn]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update local state immediately for UI feedback
    setFilters(prev => ({ ...prev, search: value }));
    // Debounce the actual search/filter operation
    debouncedSearchFn(value, filters);
  };

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    filterName: keyof TeacherFilters,
  ) => {
    const value = e.target.value;
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      designation: '',
      subjects: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Clear a specific filter
  const clearFilter = (filterName: keyof TeacherFilters) => {
    const newFilters = { ...filters, [filterName]: '' };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Search Input */}
        <div className='relative flex-grow'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search size={18} className='text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search teachers by name, email, phone, employee ID...'
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filter Toggle Button */}
        <div className='flex items-center'>
          <button
            type='button'
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
              isFilterExpanded || activeFiltersCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className='inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full'>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear All Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type='button'
              onClick={clearFilters}
              className='ml-2 text-sm text-gray-600 hover:text-gray-900'
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      {isFilterExpanded && (
        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Designation Filter */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Designation
            </label>
            <div className='relative'>
              <select
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                value={filters.designation}
                onChange={e => handleFilterChange(e, 'designation')}
              >
                <option value=''>All Designations</option>
                {designations &&
                  designations.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {filters.designation && (
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => clearFilter('designation')}
                >
                  <X size={16} className='text-gray-400 hover:text-gray-600' />
                </button>
              )}
            </div>
          </div>

          {/* Subjects Filter */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Subject
            </label>
            <div className='relative'>
              <select
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                value={filters.subjects}
                onChange={e => handleFilterChange(e, 'subjects')}
              >
                <option value=''>All Subjects</option>
                {subjects &&
                  subjects.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {filters.subjects && (
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => clearFilter('subjects')}
                >
                  <X size={16} className='text-gray-400 hover:text-gray-600' />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className='mt-4 flex flex-wrap gap-2'>
          {filters.designation && (
            <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              Designation:{' '}
              {(designations &&
                designations.find(d => d.value === filters.designation)
                  ?.label) ||
                filters.designation}
              <button
                type='button'
                className='ml-1 inline-flex'
                onClick={() => clearFilter('designation')}
              >
                <X size={12} />
              </button>
            </div>
          )}
          {filters.subjects && (
            <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              Subject:{' '}
              {(subjects &&
                subjects.find(s => s.value === filters.subjects)?.label) ||
                filters.subjects}
              <button
                type='button'
                className='ml-1 inline-flex'
                onClick={() => clearFilter('subjects')}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherSearchFilter;
