'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface ClassFilters {
  search: string;
  grade: string;
  section: string;
  hasTeacher: string;
}

interface ClassSearchFilterProps {
  onFilterChange: (filters: ClassFilters) => void;
  initialFilters?: ClassFilters;
  className?: string;
}

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const ClassSearchFilter: React.FC<ClassSearchFilterProps> = ({
  onFilterChange,
  initialFilters,
  className = '',
}) => {
  const [filters, setFilters] = useState<ClassFilters>(
    initialFilters || {
      search: '',
      grade: '',
      section: '',
      hasTeacher: '',
    },
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Apply initial filters on mount
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  // Clear filters
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      grade: '',
      section: '',
      hasTeacher: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return (
      filters.search.trim() !== '' ||
      filters.grade !== '' ||
      filters.section !== '' ||
      filters.hasTeacher !== ''
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='relative flex-grow'>
          <input
            type='text'
            name='search'
            value={filters.search}
            onChange={handleInputChange}
            placeholder='Search by class name, grade, section, room, or teacher...'
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
          />
          <Search
            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            size={18}
          />
          {filters.search && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, search: '' }));
              }}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 border ${
              isExpanded
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 bg-white text-gray-700'
            } rounded-md flex items-center gap-2 hover:bg-gray-50`}
          >
            <Filter size={16} />
            <span>Filters</span>
            {hasActiveFilters() && !isExpanded && (
              <span className='inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full'>
                {(filters.grade ? 1 : 0) +
                  (filters.section ? 1 : 0) +
                  (filters.hasTeacher ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={handleApplyFilters}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Apply
          </button>
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className='p-4 bg-white border border-gray-200 rounded-md shadow-sm'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Grade
              </label>
              <select
                name='grade'
                value={filters.grade}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>All Grades</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Section
              </label>
              <select
                name='section'
                value={filters.section}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>All Sections</option>
                {SECTIONS.map(section => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Has Class Teacher
              </label>
              <select
                name='hasTeacher'
                value={filters.hasTeacher}
                onChange={handleInputChange}
                className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value=''>All</option>
                <option value='yes'>Yes</option>
                <option value='no'>No</option>
              </select>
            </div>
          </div>
          <div className='mt-4 flex justify-end'>
            <button
              onClick={handleClearFilters}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-2'
            >
              Clear All
            </button>
            <button
              onClick={handleApplyFilters}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSearchFilter;
