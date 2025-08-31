'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  GraduationCap,
  UserCog,
  Loader2,
  ChevronRight,
  X,
} from 'lucide-react';
import { personSearchService, Person } from '@/services/person-search.service';

// Person interface is now imported from the service

interface PersonSearchProps {
  personType: 'student' | 'teacher' | 'staff';
  onPersonSelect: (person: Person) => void;
  onBack: () => void;
}

// Real API integration - no more mock data needed

export default function PersonSearch({
  personType,
  onPersonSelect,
  onBack,
}: PersonSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (term: string, page: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await personSearchService.searchPersons({
          type: personType,
          search: term.trim() || undefined,
          page,
          limit: 20,
        });

        setPersons(response.persons);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error('Error searching persons:', err);
        setError('Failed to search persons. Please try again.');
        setPersons([]);
      } finally {
        setIsLoading(false);
      }
    },
    [personType],
  );

  // Load initial data when component mounts or person type changes
  useEffect(() => {
    debouncedSearch('', 1);
  }, [personType, debouncedSearch]);

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchTerm, 1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, debouncedSearch]);

  const getPersonIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <GraduationCap className='w-5 h-5 text-blue-600' />;
      case 'teacher':
        return <User className='w-5 h-5 text-green-600' />;
      case 'staff':
        return <UserCog className='w-5 h-5 text-purple-600' />;
      default:
        return <User className='w-5 h-5 text-gray-600' />;
    }
  };

  const getPersonTypeColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 capitalize'>
            Select {personType}
          </h3>
          <p className='text-sm text-gray-600'>
            Search and select a {personType} to generate their ID card
          </p>
        </div>
        <Button variant='outline' onClick={onBack}>
          <X className='w-4 h-4 mr-2' />
          Back
        </Button>
      </div>

      {/* Search Bar */}
      <Card className='p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
          <Input
            placeholder={`Search ${personType}s by name, ${personType === 'student' ? 'roll number' : 'employee ID'}, or email...`}
            className='pl-10 pr-10'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0'
              onClick={clearSearch}
            >
              <X className='w-4 h-4' />
            </Button>
          )}
        </div>

        {searchTerm && (
          <div className='mt-2 text-sm text-gray-600'>
            {isLoading ? (
              <div className='flex items-center'>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                Searching...
              </div>
            ) : (
              `Found ${persons.length} result${persons.length !== 1 ? 's' : ''}`
            )}
          </div>
        )}
      </Card>

      {/* Results */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className='p-4 animate-pulse'>
                <div className='space-y-3'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gray-200 rounded-full'></div>
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                      <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                    </div>
                  </div>
                  <div className='h-8 bg-gray-200 rounded'></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className='p-8 text-center'>
            <div className='space-y-3'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto'>
                <X className='w-8 h-8 text-red-400' />
              </div>
              <div>
                <h4 className='text-lg font-medium text-gray-900'>
                  Search Error
                </h4>
                <p className='text-sm text-gray-600 mt-1'>{error}</p>
              </div>
              <Button
                variant='outline'
                onClick={() => debouncedSearch(searchTerm, 1)}
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : persons.length === 0 ? (
          <Card className='p-8 text-center'>
            <div className='space-y-3'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
                <Search className='w-8 h-8 text-gray-400' />
              </div>
              <div>
                <h4 className='text-lg font-medium text-gray-900'>
                  No {personType}s found
                </h4>
                <p className='text-sm text-gray-600 mt-1'>
                  {searchTerm
                    ? `No ${personType}s match your search criteria. Try different keywords.`
                    : `No ${personType}s available in the system.`}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {persons.map(person => (
              <Card
                key={person.id}
                className='p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-300'
                onClick={() => onPersonSelect(person)}
              >
                <div className='space-y-4'>
                  {/* Person Info */}
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                      {getPersonIcon(person.type)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h4 className='font-medium text-gray-900 truncate'>
                        {person.name}
                      </h4>
                      <p className='text-sm text-gray-600 truncate'>
                        {person.info}
                      </p>
                    </div>
                    <Badge className={getPersonTypeColor(person.type)}>
                      {person.type}
                    </Badge>
                  </div>

                  {/* Additional Info */}
                  <div className='space-y-2 text-sm'>
                    {person.rollNumber && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Roll Number:</span>
                        <span className='font-medium'>{person.rollNumber}</span>
                      </div>
                    )}
                    {person.employeeId && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Employee ID:</span>
                        <span className='font-medium'>{person.employeeId}</span>
                      </div>
                    )}
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Email:</span>
                      <span className='font-medium text-xs truncate ml-2'>
                        {person.email}
                      </span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    className='w-full'
                    onClick={e => {
                      e.stopPropagation();
                      onPersonSelect(person);
                    }}
                  >
                    Select {person.name}
                    <ChevronRight className='w-4 h-4 ml-2' />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
