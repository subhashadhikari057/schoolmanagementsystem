/**
 * =============================================================================
 * Staff Search Filter Component
 * =============================================================================
 * Advanced search and filtering for staff members
 * =============================================================================
 */

import React, { useState, useCallback } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { debounce } from 'lodash';

export interface StaffFilters {
  search: string;
  department: string;
  employmentStatus: string;
  designation: string;
  experienceRange: string;
  salaryRange: string;
}

interface StaffSearchFilterProps {
  filters: StaffFilters;
  onFiltersChange: (filters: StaffFilters) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'administration', label: 'Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'security', label: 'Security' },
  { value: 'library', label: 'Library' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'transport', label: 'Transport' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'academic_support', label: 'Academic Support' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'terminated', label: 'Terminated' },
];

const DESIGNATION_OPTIONS = [
  { value: '', label: 'All Designations' },
  { value: 'Administrative Officer', label: 'Administrative Officer' },
  { value: 'Finance Manager', label: 'Finance Manager' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Librarian', label: 'Librarian' },
  { value: 'Lab Assistant', label: 'Lab Assistant' },
  { value: 'Security Guard', label: 'Security Guard' },
  { value: 'Maintenance Staff', label: 'Maintenance Staff' },
  { value: 'Canteen Manager', label: 'Canteen Manager' },
  { value: 'Transport Coordinator', label: 'Transport Coordinator' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Academic Coordinator', label: 'Academic Coordinator' },
];

const EXPERIENCE_RANGES = [
  { value: '', label: 'Any Experience' },
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6-10', label: '6-10 years' },
  { value: '11-15', label: '11-15 years' },
  { value: '16+', label: '16+ years' },
];

const SALARY_RANGES = [
  { value: '', label: 'Any Salary' },
  { value: '0-30000', label: '$0 - $30,000' },
  { value: '30001-50000', label: '$30,001 - $50,000' },
  { value: '50001-70000', label: '$50,001 - $70,000' },
  { value: '70001-100000', label: '$70,001 - $100,000' },
  { value: '100001+', label: '$100,001+' },
];

const StaffSearchFilter: React.FC<StaffSearchFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      onFiltersChange({ ...filters, search: searchTerm });
    }, 300),
    [filters, onFiltersChange],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const handleFilterChange = (key: keyof StaffFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'search' && value !== '',
  );

  const hasAnyFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 space-y-4'>
      {/* Search Bar */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Search staff by name, email, or designation...'
            defaultValue={filters.search}
            onChange={handleSearchChange}
            disabled={isLoading}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          />
        </div>

        <div className='flex gap-2'>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center px-4 py-2 border rounded-md font-medium text-sm transition-colors duration-200 ${
              showAdvanced || hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            <Filter className='h-4 w-4 mr-2' />
            Filters
            <ChevronDown
              className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                showAdvanced ? 'rotate-180' : ''
              }`}
            />
          </button>

          {hasAnyFilters && (
            <button
              onClick={onClearFilters}
              className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-medium text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isLoading}
            >
              <X className='h-4 w-4 mr-2' />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className='border-t border-gray-200 pt-4 space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {/* Department Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Department
              </label>
              <select
                value={filters.department}
                onChange={e => handleFilterChange('department', e.target.value)}
                disabled={isLoading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {DEPARTMENT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Employment Status
              </label>
              <select
                value={filters.employmentStatus}
                onChange={e =>
                  handleFilterChange('employmentStatus', e.target.value)
                }
                disabled={isLoading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {EMPLOYMENT_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Designation
              </label>
              <select
                value={filters.designation}
                onChange={e =>
                  handleFilterChange('designation', e.target.value)
                }
                disabled={isLoading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {DESIGNATION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Range Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Experience
              </label>
              <select
                value={filters.experienceRange}
                onChange={e =>
                  handleFilterChange('experienceRange', e.target.value)
                }
                disabled={isLoading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {EXPERIENCE_RANGES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary Range Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Salary Range
              </label>
              <select
                value={filters.salaryRange}
                onChange={e =>
                  handleFilterChange('salaryRange', e.target.value)
                }
                disabled={isLoading}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {SALARY_RANGES.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className='flex flex-wrap gap-2 pt-2 border-t border-gray-100'>
              <span className='text-xs font-medium text-gray-500'>
                Active filters:
              </span>
              {Object.entries(filters).map(([key, value]) => {
                if (key === 'search' || !value) return null;

                const getFilterLabel = () => {
                  switch (key) {
                    case 'department':
                      return (
                        DEPARTMENT_OPTIONS.find(opt => opt.value === value)
                          ?.label || value
                      );
                    case 'employmentStatus':
                      return (
                        EMPLOYMENT_STATUS_OPTIONS.find(
                          opt => opt.value === value,
                        )?.label || value
                      );
                    case 'designation':
                      return (
                        DESIGNATION_OPTIONS.find(opt => opt.value === value)
                          ?.label || value
                      );
                    case 'experienceRange':
                      return (
                        EXPERIENCE_RANGES.find(opt => opt.value === value)
                          ?.label || value
                      );
                    case 'salaryRange':
                      return (
                        SALARY_RANGES.find(opt => opt.value === value)?.label ||
                        value
                      );
                    default:
                      return value;
                  }
                };

                return (
                  <span
                    key={key}
                    className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                  >
                    {getFilterLabel()}
                    <button
                      onClick={() =>
                        handleFilterChange(key as keyof StaffFilters, '')
                      }
                      className='ml-1 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-blue-200 transition-colors duration-200'
                    >
                      <X className='h-2 w-2' />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffSearchFilter;
