'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

// Ethnicity data from the provided list
const ETHNICITY_OPTIONS = [
  'Kshetri',
  'Brahman - Hill',
  'Magar',
  'Tharu',
  'Tamang',
  'Bishwokarma',
  'Musalman',
  'Newa: (Newar)',
  'Yadav',
  'Rai',
  'Pariyar',
  'Gurung',
  'Thakuri',
  'Mijar',
  'Teli',
  'Yakthung/Limbu',
  'Chamar/Harijan/Ram',
  'Koiri/Kushwaha',
  'Kurmi',
  'Musahar',
  'Dhanuk',
  'Dusadh/Pasawan/Pasi',
  'Brahman - Tarai',
  'Mallaha',
  'Sanyasi/Dasnami',
  'Kewat',
  'Kanu',
  'Hajam/Thakur',
  'Kalwar',
  'Rajbansi',
  'Sherpa',
  'Kumal',
  'Tatma/Tatwa',
  'Khatwe',
  'Gharti/Bhujel',
  'Majhi',
  'Nuniya',
  'Sundi',
  'Dhobi',
  'Lohar',
  'Bin',
  'Kumhar',
  'Sonar',
  'Chepang/Praja',
  'Ranatharu',
  'Danuwar',
  'Sunuwar',
  'Haluwai',
  'Baraee',
  'Bantar/Sardar',
  'Kahar',
  'Santhal',
  'Baniyan',
  'Kathabaniyan',
  'Badhaee/Badhee',
  'Oraon/Kudukh',
  'Rajput',
  'Amat',
  'Gangai',
  'Lodh',
  'Gaderi/Bhediyar',
  'Ghale',
  'Marwadi',
  'Kayastha',
  'Kulung',
  'Thami',
  'Bhumihar',
  'Rajbhar',
  'Rauniyar',
  'Dhimal',
  'Khawas',
  'Tajpuriya',
  'Kori',
  'Dom',
  'Mali',
  'Darai',
  'Yakkha',
  'Bhote',
  'Bantawa',
  'Rajdhob',
  'Dhunia',
  'Pahari',
  'Bangali',
  'Gondh/Gond',
  'Chamling',
  'Chhantyal/Chhantel',
  'Thakali',
  'Badi',
  'Bote',
  'Pun',
  'Hyolmo/Yholmopa',
  'Khatik',
  'Yamphu',
  'Kewarat',
  'Baram / Baramu',
  'Dev',
  'Nachhiring',
  'Gaine',
  'Bahing',
  'Thulung',
  'Jirel',
  'Khaling',
  'Aathpahariya',
  'Dolpo',
  'Sarbaria',
  'Mewahang',
  'Byasi/Sauka',
  'Dura',
  'Meche',
  'Raji',
  'Sampang',
  'Chai/Khulaut',
  'Chumba/Nubri',
  'Dhankar/ Dharikar',
  'Munda',
  'Lepcha',
  'Pattharkatta/ Kushwadiya',
  'Hayu',
  'Beldar',
  'Halkhor',
  'Natuwa',
  'Loharung',
  'Kamar',
  'Dhandi',
  'Done',
  'Mugal/Mugum',
  'Punjabi/Sikh',
  'Karmarong',
  'Chidimar',
  'Kisan',
  'Lhopa',
  'Kalar',
  'Phree',
  'Koche',
  'Topkegola',
  'Raute',
  'Walung',
  'Lhomi',
  'Surel',
  'Kusunda',
  'Bankariya',
  'Nurang',
  'Others',
  'Foreigner',
];

interface EthnicitySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  label?: string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 8;
const DROPDOWN_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT;

export default function EthnicitySelect({
  value = '',
  onChange,
  placeholder = 'Select ethnicity...',
  disabled = false,
  className = '',
  error,
  required = false,
  label,
}: EthnicitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [scrollTop, setScrollTop] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Debounced search with useMemo for performance
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return ETHNICITY_OPTIONS;

    const term = searchTerm.toLowerCase().trim();
    return ETHNICITY_OPTIONS.filter(option =>
      option.toLowerCase().includes(term),
    );
  }, [searchTerm]);

  // Virtual scrolling calculations
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + VISIBLE_ITEMS + 2, // Buffer items
      filteredOptions.length,
    );

    return {
      startIndex,
      endIndex,
      items: filteredOptions.slice(startIndex, endIndex),
    };
  }, [filteredOptions, scrollTop]);

  const totalHeight = filteredOptions.length * ITEM_HEIGHT;
  const offsetY = visibleItems.startIndex * ITEM_HEIGHT;

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle option selection
  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, handleSelect],
  );

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const itemTop = highlightedIndex * ITEM_HEIGHT;
      const itemBottom = itemTop + ITEM_HEIGHT;
      const visibleTop = scrollTop;
      const visibleBottom = scrollTop + DROPDOWN_HEIGHT;

      if (itemTop < visibleTop) {
        setScrollTop(itemTop);
        listRef.current.scrollTop = itemTop;
      } else if (itemBottom > visibleBottom) {
        const newScrollTop = itemBottom - DROPDOWN_HEIGHT;
        setScrollTop(newScrollTop);
        listRef.current.scrollTop = newScrollTop;
      }
    }
  }, [highlightedIndex, scrollTop]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
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
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 text-left border rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
        >
          <span className={`truncate ${!value ? 'text-gray-500' : ''}`}>
            {value || placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden'>
            {/* Search Input */}
            <div className='p-2 border-b border-gray-200'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  ref={searchInputRef}
                  type='text'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(-1);
                    setScrollTop(0);
                    if (listRef.current) {
                      listRef.current.scrollTop = 0;
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder='Search ethnicity...'
                  className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                />
              </div>
            </div>

            {/* Virtual Scrolled List */}
            <div
              ref={listRef}
              className='overflow-y-auto'
              style={{ height: Math.min(DROPDOWN_HEIGHT, totalHeight) }}
              onScroll={handleScroll}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {visibleItems.items.length > 0 ? (
                    visibleItems.items.map((option, index) => {
                      const actualIndex = visibleItems.startIndex + index;
                      const isSelected = value === option;
                      const isHighlighted = highlightedIndex === actualIndex;

                      return (
                        <button
                          key={option}
                          type='button'
                          onClick={() => handleSelect(option)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors duration-150 ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600'
                              : isHighlighted
                                ? 'bg-gray-100'
                                : ''
                          }`}
                          style={{ height: ITEM_HEIGHT }}
                        >
                          <span className='truncate'>{option}</span>
                          {isSelected && (
                            <Check className='w-4 h-4 text-blue-600 flex-shrink-0' />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div
                      className='px-3 py-2 text-sm text-gray-500 text-center'
                      style={{ height: ITEM_HEIGHT }}
                    >
                      No ethnicity found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results count */}
            {searchTerm && (
              <div className='px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50'>
                {filteredOptions.length} result
                {filteredOptions.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
}
