'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface StaffFilters {
  search: string;
  designation: string;
  department: string;
}

interface StaffSearchFilterProps {
  onFilterChange: (filters: StaffFilters) => void;
  designations: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  initialFilters?: StaffFilters;
  className?: string;
}

const StaffSearchFilter: React.FC<StaffSearchFilterProps> = ({
  onFilterChange,
  designations,
  departments,
  initialFilters = { search: '', designation: '', department: '' },
  className = '',
}) => {
  const [filters, setFilters] = useState<StaffFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Update local state when initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      designation: '',
      department: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Toggle filter visibility
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
            placeholder='Search by name, email, employee ID...'
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
            {(filters.search || filters.designation || filters.department) && (
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
            {/* Designation Filter */}
            <div>
              <label
                htmlFor='designation'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Designation
              </label>
              <select
                id='designation'
                name='designation'
                value={filters.designation}
                onChange={handleInputChange}
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
              >
                <option value=''>All Designations</option>
                {designations.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label
                htmlFor='department'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Department
              </label>
              <select
                id='department'
                name='department'
                value={filters.department}
                onChange={handleInputChange}
                className='block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
              >
                <option value=''>All Departments</option>
                {departments.map(option => (
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

export default StaffSearchFilter;
