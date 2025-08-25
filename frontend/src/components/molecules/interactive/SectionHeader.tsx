'use client';

import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { ChevronDown, Filter, CheckCircle } from 'lucide-react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { SectionHeaderProps } from '@/types/SectionHeader';

export default function SectionHeader({
  title,
  actionText,
  onActionClick,
  showFilter = false,
  onFilterChange,
}: SectionHeaderProps) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const filterOptions = ['All', 'Active', 'Inactive', 'Scheduled'];

  return (
    <div className='flex items-center justify-between mb-6'>
      <div className='flex items-center gap-4'>
        <SectionTitle text={title} />

        {showFilter && (
          <Listbox
            value={selectedFilter}
            onChange={value => {
              setSelectedFilter(value);
              onFilterChange?.(value);
            }}
          >
            <div className='relative'>
              <Listbox.Button className='relative w-32 cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md border border-gray-300 text-sm'>
                <span className='flex items-center gap-2'>
                  <Filter className='w-4 h-4 text-gray-400' />
                  <span className='block truncate'>{selectedFilter}</span>
                </span>
                <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                  <ChevronDown
                    className='h-5 w-5 text-gray-400'
                    aria-hidden='true'
                  />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave='transition ease-in duration-100'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <Listbox.Options className='absolute mt-1 max-h-60 w-full z-10 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm'>
                  {filterOptions.map((option, idx) => (
                    <Listbox.Option
                      key={idx}
                      value={option}
                      className={({ active }) =>
                        `cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                          >
                            {option}
                          </span>
                          {selected && (
                            <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600'>
                              <CheckCircle className='h-5 w-5' />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        )}
      </div>

      {actionText && (
        <button
          onClick={onActionClick}
          className='text-sm text-blue-600 hover:text-blue-800 font-medium'
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
