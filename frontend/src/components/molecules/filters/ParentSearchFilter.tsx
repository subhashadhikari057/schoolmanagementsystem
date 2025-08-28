'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { debounce } from 'lodash';

export interface ParentFilters {
  search: string;
  occupation: string;
  status: string;
}

interface ParentSearchFilterProps {
  onFilterChange: (filters: ParentFilters) => void;
  occupations: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
  initialFilters?: ParentFilters;
  className?: string;
}

const ParentSearchFilter: React.FC<ParentSearchFilterProps> = ({
  onFilterChange,
  occupations,
  statuses,
  initialFilters = { search: '', occupation: '', status: '' },
  className = '',
}) => {
  const [filters, setFilters] = useState<ParentFilters>(initialFilters);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (filters.occupation) count++;
    if (filters.status) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const debouncedSearchFn = useMemo(
    () =>
      debounce((searchValue: string, currentFilters: ParentFilters) => {
        setFilters(prev => ({ ...prev, search: searchValue }));
        onFilterChange({ ...currentFilters, search: searchValue });
      }, 500),
    [onFilterChange],
  );

  useEffect(() => {
    return () => {
      debouncedSearchFn.cancel();
    };
  }, [debouncedSearchFn]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    debouncedSearchFn(value, filters);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    filterName: keyof ParentFilters,
  ) => {
    const value = e.target.value;
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      occupation: '',
      status: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const clearFilter = (filterName: keyof ParentFilters) => {
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
            placeholder='Search parents by name, email, phone...'
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
          {/* Occupation Filter */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Occupation
            </label>
            <div className='relative'>
              <select
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                value={filters.occupation}
                onChange={e => handleFilterChange(e, 'occupation')}
              >
                <option value=''>All Occupations</option>
                {occupations &&
                  occupations.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {filters.occupation && (
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => clearFilter('occupation')}
                >
                  <X size={16} className='text-gray-400 hover:text-gray-600' />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Status
            </label>
            <div className='relative'>
              <select
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                value={filters.status}
                onChange={e => handleFilterChange(e, 'status')}
              >
                <option value=''>All Statuses</option>
                {statuses &&
                  statuses.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              {filters.status && (
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => clearFilter('status')}
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
          {filters.occupation && (
            <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              Occupation:{' '}
              {(occupations &&
                occupations.find(o => o.value === filters.occupation)?.label) ||
                filters.occupation}
              <button
                type='button'
                className='ml-1 inline-flex'
                onClick={() => clearFilter('occupation')}
              >
                <X size={12} />
              </button>
            </div>
          )}
          {filters.status && (
            <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              Status:{' '}
              {(statuses &&
                statuses.find(s => s.value === filters.status)?.label) ||
                filters.status}
              <button
                type='button'
                className='ml-1 inline-flex'
                onClick={() => clearFilter('status')}
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

export default ParentSearchFilter;
