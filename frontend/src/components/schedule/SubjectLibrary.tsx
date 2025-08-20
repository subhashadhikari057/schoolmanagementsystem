'use client';

import React, { useState, useMemo } from 'react';
import { Search, Book, User, GraduationCap } from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
// Use real API data instead of mock data
import { useDraggable } from '@dnd-kit/core';

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  gradeLevel: number;
}

interface SubjectCardProps {
  subject: Subject;
}

function SubjectCard({ subject }: SubjectCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `subject-${subject.id}`,
    data: {
      type: 'subject',
      subject,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-md border mb-2 cursor-grab ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{
        backgroundColor: `${subject.color}15`, // Very light version of the color
        borderColor: `${subject.color}40`,
      }}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <div
            className='w-3 h-3 rounded-full mr-2'
            style={{ backgroundColor: subject.color }}
          ></div>
          <span className='font-medium text-sm'>{subject.name}</span>
        </div>
        <span className='text-xs text-gray-500 font-mono'>{subject.code}</span>
      </div>
      <div className='mt-1 text-xs text-gray-500'>
        Grade {subject.gradeLevel}
      </div>
      <div className='mt-1 text-xs text-right italic'>Drag to assign</div>
    </div>
  );
}

export default function SubjectLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'subject' | 'teacher' | 'class'
  >('all');
  const { selectedGrade } = useScheduleStore();

  // Use real data from API instead of mock data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load subjects from API
  React.useEffect(() => {
    const loadSubjects = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call when available
        // const response = await subjectService.getSubjects();
        // if (response.success && response.data) {
        //   setSubjects(response.data);
        // }

        // For now, use empty array until API is available
        setSubjects([]);
      } catch (error) {
        console.error('Error loading subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // Filter subjects based on search term and selected grade
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      // Filter by grade level
      if (subject.gradeLevel !== selectedGrade) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          subject.name.toLowerCase().includes(search) ||
          subject.code.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [searchTerm, selectedGrade, subjects]);

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!searchTerm) return [];

    const search = searchTerm.toLowerCase();
    return teachers.filter(
      teacher =>
        teacher.fullName?.toLowerCase().includes(search) ||
        teacher.employeeId?.toLowerCase().includes(search),
    );
  }, [searchTerm, teachers]);

  // Filter classes based on search term
  const filteredClasses = useMemo(() => {
    if (!searchTerm) return [];

    const search = searchTerm.toLowerCase();
    return classes.filter(
      cls =>
        cls.name?.toLowerCase().includes(search) ||
        `Grade ${cls.grade} Section ${cls.section}`
          .toLowerCase()
          .includes(search),
    );
  }, [searchTerm, classes]);

  return (
    <div className='bg-white rounded-lg shadow h-full'>
      <div className='p-4 border-b'>
        <h3 className='text-lg font-medium text-gray-800 mb-2'>
          Subject Library
        </h3>
        <p className='text-sm text-gray-600 mb-4'>
          Drag subjects to the timetable to assign them to slots
        </p>

        {/* Search */}
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-4 w-4 text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search subjects, teachers...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Filter buttons */}
        <div className='flex mt-3 space-x-2'>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs rounded-full flex items-center ${
              filterType === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('subject')}
            className={`px-3 py-1 text-xs rounded-full flex items-center ${
              filterType === 'subject'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Book className='h-3 w-3 mr-1' />
            Subjects
          </button>
          <button
            onClick={() => setFilterType('teacher')}
            className={`px-3 py-1 text-xs rounded-full flex items-center ${
              filterType === 'teacher'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className='h-3 w-3 mr-1' />
            Teachers
          </button>
          <button
            onClick={() => setFilterType('class')}
            className={`px-3 py-1 text-xs rounded-full flex items-center ${
              filterType === 'class'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <GraduationCap className='h-3 w-3 mr-1' />
            Classes
          </button>
        </div>
      </div>

      <div
        className='p-4 overflow-y-auto'
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {/* Show filtered subjects */}
        {(filterType === 'all' || filterType === 'subject') && (
          <>
            {filteredSubjects.length > 0 && (
              <div className='mb-4'>
                <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
                  <Book className='h-4 w-4 mr-1' />
                  Subjects ({filteredSubjects.length})
                </h4>
                {filteredSubjects.map(subject => (
                  <SubjectCard key={subject.id} subject={subject} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Show filtered teachers */}
        {(filterType === 'all' || filterType === 'teacher') &&
          filteredTeachers.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
                <User className='h-4 w-4 mr-1' />
                Teachers ({filteredTeachers.length})
              </h4>
              {filteredTeachers.map(teacher => (
                <div
                  key={teacher.id}
                  className='p-3 rounded-md border border-gray-200 bg-gray-50 mb-2'
                >
                  <div className='font-medium text-sm'>{teacher.fullName}</div>
                  <div className='text-xs text-gray-500'>
                    ID: {teacher.employeeId}
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    Subjects: {teacher.subjects.length}
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Show filtered classes */}
        {(filterType === 'all' || filterType === 'class') &&
          filteredClasses.length > 0 && (
            <div className='mb-4'>
              <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
                <GraduationCap className='h-4 w-4 mr-1' />
                Classes ({filteredClasses.length})
              </h4>
              {filteredClasses.map(cls => (
                <div
                  key={cls.id}
                  className='p-3 rounded-md border border-gray-200 bg-gray-50 mb-2'
                >
                  <div className='font-medium text-sm'>{cls.name}</div>
                  <div className='text-xs text-gray-500'>
                    Grade {cls.grade} Section {cls.section}
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Empty state */}
        {((filterType === 'subject' && filteredSubjects.length === 0) ||
          (filterType === 'teacher' && filteredTeachers.length === 0) ||
          (filterType === 'class' && filteredClasses.length === 0) ||
          (filterType === 'all' &&
            filteredSubjects.length === 0 &&
            filteredTeachers.length === 0 &&
            filteredClasses.length === 0)) && (
          <div className='text-center py-8'>
            <Search className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No results found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
          </div>
        )}
      </div>

      <div className='p-4 border-t bg-gray-50'>
        <div className='text-xs text-gray-500'>
          <p className='mb-1'>
            <span className='font-medium'>Tip:</span> Drag subjects from the
            library to the timetable.
          </p>
          <p>
            <span className='font-medium'>Note:</span> Only subjects for Grade{' '}
            {selectedGrade} are shown.
          </p>
        </div>
      </div>
    </div>
  );
}
