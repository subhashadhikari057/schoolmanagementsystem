'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, User, Users } from 'lucide-react';
import { API_CONFIG } from '@/constants/api';

interface Student {
  id: string;
  rollNumber: string;
  email: string;
  user: {
    fullName: string;
  };
}

interface StudentSelectorProps {
  selectedStudents: Student[];
  onStudentsChange: (students: Student[]) => void;
  placeholder?: string;
  multiple?: boolean;
  className?: string;
}

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const StudentSelector: React.FC<StudentSelectorProps> = ({
  selectedStudents,
  onStudentsChange,
  placeholder = 'Search students...',
  multiple = true,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchStudents = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/v1/fees/students/search?q=${encodeURIComponent(query)}&limit=10`,
        { credentials: 'include' },
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchStudents]);

  const handleStudentSelect = (student: Student) => {
    if (multiple) {
      const isAlreadySelected = selectedStudents.some(s => s.id === student.id);
      if (!isAlreadySelected) {
        onStudentsChange([...selectedStudents, student]);
      }
    } else {
      onStudentsChange([student]);
    }
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleStudentRemove = (studentId: string) => {
    onStudentsChange(selectedStudents.filter(s => s.id !== studentId));
  };

  const filteredSuggestions = suggestions.filter(
    student => !selectedStudents.some(selected => selected.id === student.id),
  );

  return (
    <div className={`relative ${className}`}>
      <div className='space-y-2'>
        {/* Search Input */}
        <div className='relative'>
          <input
            type='text'
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={placeholder}
            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 pl-9'
          />
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        </div>

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm font-medium text-gray-700'>
              <Users className='h-4 w-4' />
              Selected Students ({selectedStudents.length})
            </div>
            <div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto'>
              {selectedStudents.map(student => (
                <div
                  key={student.id}
                  className='flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-200'
                >
                  <User className='h-3 w-3' />
                  <span>
                    #{student.rollNumber} {student.user.fullName}
                  </span>
                  <button
                    type='button'
                    onClick={() => handleStudentRemove(student.id)}
                    className='hover:bg-blue-100 rounded p-0.5'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen &&
        (searchTerm.trim().length >= 2 || suggestions.length > 0) && (
          <div className='absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto'>
            {isLoading ? (
              <div className='px-4 py-2 text-gray-500 text-sm'>
                Searching...
              </div>
            ) : filteredSuggestions.length > 0 ? (
              <ul>
                {filteredSuggestions.map(student => (
                  <li
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
                  >
                    <User className='h-4 w-4 text-gray-500 mr-2' />
                    <div>
                      <div className='font-medium'>
                        #{student.rollNumber} {student.user.fullName}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {student.email}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm.trim().length >= 2 ? (
              <div className='px-4 py-2 text-gray-500 text-sm'>
                No students found
              </div>
            ) : null}
          </div>
        )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className='fixed inset-0 z-0'
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default StudentSelector;
