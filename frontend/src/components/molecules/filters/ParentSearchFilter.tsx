'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      occupation: '',
      status: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Search Bar */}
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400' />
          </div>
          <input
            type='text'
            name='search'
            value={filters.search}
            onChange={handleInputChange}
            placeholder='Search by name, email, phone...'
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
          />
          {filters.search && (
            <button
              type='button'
              onClick={() => {
                setFilters(prev => ({ ...prev, search: '' }));
                onFilterChange({ ...filters, search: '' });
              }}
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
            >
              <X className='h-4 w-4 text-gray-400 hover:text-gray-600' />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className='flex justify-between items-center'>
          <button
            type='button'
            onClick={toggleFilters}
            className='flex items-center text-sm text-gray-600 hover:text-gray-900'
          >
            <Filter className='h-4 w-4 mr-1' />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <div className='flex space-x-2'>
            {(filters.search || filters.occupation || filters.status) && (
              <button
                type='button'
                onClick={handleClearFilters}
                className='px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Clear Filters
              </button>
            )}
            <button
              type='submit'
              className='px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Search
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4'>
            {/* Occupation Filter */}
            <div>
              <label
                htmlFor='occupation'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Occupation
              </label>
              <select
                id='occupation'
                name='occupation'
                value={filters.occupation}
                onChange={handleInputChange}
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
              >
                <option value=''>All Occupations</option>
                {occupations.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor='status'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Status
              </label>
              <select
                id='status'
                name='status'
                value={filters.status}
                onChange={handleInputChange}
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
              >
                <option value=''>All Statuses</option>
                {statuses.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ParentSearchFilter;
