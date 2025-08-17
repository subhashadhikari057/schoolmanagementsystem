'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  Users,
  Mail,
  Phone,
  GraduationCap,
} from 'lucide-react';
import {
  parentService,
  ParentSearchResult,
} from '@/api/services/parent.service';
import { debounce } from 'lodash';

interface ParentSearchSelectProps {
  value?: string;
  onChange: (parentId: string | undefined) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const ParentSearchSelect: React.FC<ParentSearchSelectProps> = ({
  value,
  onChange,
  placeholder = 'Search for existing parent...',
  label,
  required = false,
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<ParentSearchResult[]>([]);
  const [selectedParent, setSelectedParent] =
    useState<ParentSearchResult | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Debounced search function
  const searchParents = async (term: string) => {
    if (!term || term.length < 2) {
      setParents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await parentService.searchForLinking(term, 20);
      if (response.success) {
        setParents(response.data);
      }
    } catch (error) {
      console.error('Error searching parents:', error);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchParents, 300), []);

  // Handle search term change
  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      debouncedSearch(term);
    },
    [debouncedSearch],
  );

  // Handle parent selection
  const handleSelectParent = useCallback(
    (parent: ParentSearchResult) => {
      setSelectedParent(parent);
      onChange(parent.id);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onChange],
  );

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedParent(null);
    onChange(undefined);
    setSearchTerm('');
  }, [onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Find selected parent when value changes
  useEffect(() => {
    if (value && !selectedParent) {
      // If we have a value but no selected parent, clear the selection
      setSelectedParent(null);
    } else if (!value && selectedParent) {
      setSelectedParent(null);
    } else if (selectedParent && selectedParent.id !== value) {
      setSelectedParent(null);
    }
  }, [value, selectedParent]);

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}

      <div ref={dropdownRef} className='relative'>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 text-left border rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
        >
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <Users className='h-4 w-4 text-gray-400 flex-shrink-0' />
            {selectedParent ? (
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-900 truncate'>
                  {selectedParent.fullName}
                </div>
                <div className='text-sm text-gray-500 truncate'>
                  {selectedParent.email}
                  {selectedParent.existingChildren.length > 0 && (
                    <span className='ml-2 text-green-600'>
                      ({selectedParent.existingChildren.length} child
                      {selectedParent.existingChildren.length !== 1
                        ? 'ren'
                        : ''}
                      )
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className='text-gray-500 truncate'>{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* Clear Button */}
        {selectedParent && !disabled && (
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              handleClearSelection();
            }}
            className='absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden'>
            {/* Search Input */}
            <div className='p-3 border-b border-gray-200'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  ref={searchInputRef}
                  type='text'
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder='Search by name, email, or phone...'
                  className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400'
                />
              </div>
            </div>

            {/* Results */}
            <div className='max-h-60 overflow-y-auto'>
              {loading ? (
                <div className='p-4 text-center text-gray-500'>
                  <div className='inline-flex items-center'>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Searching parents...
                  </div>
                </div>
              ) : parents.length > 0 ? (
                parents.map(parent => (
                  <button
                    key={parent.id}
                    type='button'
                    onClick={() => handleSelectParent(parent)}
                    className='w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-gray-900 mb-1'>
                          {parent.fullName}
                        </div>
                        <div className='space-y-1'>
                          <div className='flex items-center text-sm text-gray-600'>
                            <Mail className='w-3 h-3 mr-1 flex-shrink-0' />
                            <span className='truncate'>{parent.email}</span>
                          </div>
                          {parent.phone && (
                            <div className='flex items-center text-sm text-gray-600'>
                              <Phone className='w-3 h-3 mr-1 flex-shrink-0' />
                              <span>{parent.phone}</span>
                            </div>
                          )}
                          {parent.occupation && (
                            <div className='text-sm text-gray-600'>
                              Occupation: {parent.occupation}
                            </div>
                          )}
                          {parent.existingChildren.length > 0 && (
                            <div className='mt-2'>
                              <div className='text-xs text-gray-500 mb-1'>
                                Existing children:
                              </div>
                              <div className='space-y-1'>
                                {parent.existingChildren.map(child => (
                                  <div
                                    key={child.id}
                                    className='flex items-center text-xs text-green-600'
                                  >
                                    <GraduationCap className='w-3 h-3 mr-1 flex-shrink-0' />
                                    <span className='truncate'>
                                      {child.name} ({child.class}) -{' '}
                                      {child.relationship}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedParent?.id === parent.id && (
                        <Check className='w-4 h-4 text-green-600 flex-shrink-0 mt-1' />
                      )}
                    </div>
                  </button>
                ))
              ) : searchTerm.length >= 2 ? (
                <div className='p-4 text-center text-gray-500'>
                  <Users className='w-8 h-8 mx-auto text-gray-300 mb-2' />
                  <p>No parents found</p>
                  <p className='text-sm'>Try different search terms</p>
                </div>
              ) : (
                <div className='p-4 text-center text-gray-500'>
                  <Search className='w-8 h-8 mx-auto text-gray-300 mb-2' />
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};

export default ParentSearchSelect;
