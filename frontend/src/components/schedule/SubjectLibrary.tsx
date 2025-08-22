import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Book, User, Clock } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { useScheduleStore } from '@/store/schedule';
import { classSubjectService } from '@/api/services/class-subject.service';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxMarks: number;
  passMarks: number;
}

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  subject: Subject;
  teacher?: {
    id: string;
    userId: string;
    employeeId?: string;
    designation: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

interface DraggableSubjectProps {
  subject: Subject;
  classSubject?: ClassSubject;
  isAssigned: boolean;
  isEditMode: boolean;
}

const DraggableSubject: React.FC<DraggableSubjectProps> = ({
  subject,
  classSubject,
  isAssigned,
  isEditMode,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `subject-${subject.id}`,
      disabled: !isEditMode, // Only allow dragging in edit mode
      data: {
        type: 'subject',
        subject,
        classSubject,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const assignedTeacher = classSubject?.teacher;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? listeners : {})}
      {...(isEditMode ? attributes : {})}
      className={`
        p-3 rounded-lg border transition-all duration-200
        ${isEditMode ? 'cursor-move' : 'cursor-default'}
        ${isDragging ? 'opacity-50 shadow-lg transform rotate-2' : ''}
        ${
          isAssigned
            ? 'bg-green-50 border-green-200 hover:bg-green-100'
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        }
        ${isEditMode ? 'hover:shadow-md' : ''}
      `}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center space-x-2'>
            <Book className='w-4 h-4 text-blue-600' />
            <h4 className='font-semibold text-gray-900'>{subject.name}</h4>
            <span className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded'>
              {subject.code}
            </span>
          </div>

          {subject.description && (
            <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
              {subject.description}
            </p>
          )}

          {assignedTeacher && (
            <div className='mt-2 flex items-center text-xs text-gray-500'>
              <User className='w-3 h-3 mr-1' />
              {assignedTeacher.user.fullName} ({assignedTeacher.designation})
            </div>
          )}
        </div>

        <div className='flex flex-col items-end space-y-1'>
          <span
            className={`
            text-xs px-2 py-1 rounded-full
            ${
              isAssigned
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }
          `}
          >
            {isAssigned ? 'Assigned' : 'Available'}
          </span>

          <div className='text-xs text-gray-500'>{subject.maxMarks} marks</div>
        </div>
      </div>

      {!isEditMode && (
        <div className='mt-2 text-xs text-gray-400 italic'>
          Switch to Edit Mode to drag subjects
        </div>
      )}
    </div>
  );
};

export const SubjectLibrary: React.FC = () => {
  const {
    selectedClassId,
    classSubjects,
    availableSubjects,
    isLoadingSubjects,
    isEditMode,
    subjectFilter,
    teacherFilter,
    timetableSlots,
    setClassSubjects,
    setAvailableSubjects,
    setIsLoadingSubjects,
    setSubjectFilter,
    setTeacherFilter,
  } = useScheduleStore();

  const [viewMode, setViewMode] = useState<'all' | 'assigned' | 'unassigned'>(
    'all',
  );

  // Load class subjects when class is selected
  const loadClassSubjects = useCallback(async () => {
    // Don't make API call if no class is selected
    if (!selectedClassId || selectedClassId === null) {
      setClassSubjects([]);
      setAvailableSubjects([]);
      setIsLoadingSubjects(false);
      return;
    }

    setIsLoadingSubjects(true);
    try {
      // Load class subjects from the backend
      const response = await classSubjectService.getClassSubjects({
        classId: selectedClassId,
        includeTeacher: true,
        includeSubjectDetails: true,
      });

      if (response.success && response.data) {
        // Map the response data to match our interfaces
        const mappedClassSubjects = response.data.map(cs => ({
          ...cs,
          teacherId: cs.teacherId || undefined, // Convert null to undefined
          subject: {
            ...cs.subject!,
            description: cs.subject?.description || undefined, // Convert null to undefined
          },
          teacher: cs.teacher
            ? {
                ...cs.teacher,
                employeeId: cs.teacher.employeeId || undefined,
              }
            : undefined,
        }));

        setClassSubjects(mappedClassSubjects);

        // Extract unique subjects for the subject library
        const subjects = mappedClassSubjects
          .filter(cs => cs.subject) // Filter out entries without subjects
          .map(cs => ({
            ...cs.subject,
            description: cs.subject.description || undefined,
          }));

        setAvailableSubjects(subjects);
      } else {
        console.error('Failed to load class subjects:', response.error);
        setClassSubjects([]);
        setAvailableSubjects([]);
      }
    } catch (error) {
      console.error('Error loading class subjects:', error);
      setClassSubjects([]);
      setAvailableSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [
    selectedClassId,
    setClassSubjects,
    setAvailableSubjects,
    setIsLoadingSubjects,
  ]);

  useEffect(() => {
    loadClassSubjects();
  }, [selectedClassId, loadClassSubjects]);

  // Get assigned subject IDs from timetable
  const assignedSubjectIds = new Set(
    timetableSlots.filter(slot => slot.subjectId).map(slot => slot.subjectId!),
  );

  // Filter subjects based on search and view mode
  const filteredSubjects = availableSubjects.filter(subject => {
    // Search filter
    const matchesSearch =
      !subjectFilter ||
      subject.name.toLowerCase().includes(subjectFilter.toLowerCase()) ||
      subject.code.toLowerCase().includes(subjectFilter.toLowerCase()) ||
      (subject.description &&
        subject.description
          .toLowerCase()
          .includes(subjectFilter.toLowerCase()));

    // View mode filter
    const isAssigned = assignedSubjectIds.has(subject.id);
    const matchesViewMode =
      viewMode === 'all' ||
      (viewMode === 'assigned' && isAssigned) ||
      (viewMode === 'unassigned' && !isAssigned);

    return matchesSearch && matchesViewMode;
  });

  // Filter by teacher if specified
  const finalFilteredSubjects = filteredSubjects.filter(subject => {
    if (!teacherFilter) return true;

    const classSubject = classSubjects.find(cs => cs.subject.id === subject.id);
    return (
      classSubject?.teacher?.user.fullName
        .toLowerCase()
        .includes(teacherFilter.toLowerCase()) ||
      classSubject?.teacher?.designation
        .toLowerCase()
        .includes(teacherFilter.toLowerCase())
    );
  });

  // Group subjects by assigned status for better organization
  const assignedSubjects = finalFilteredSubjects.filter(subject =>
    assignedSubjectIds.has(subject.id),
  );
  const unassignedSubjects = finalFilteredSubjects.filter(
    subject => !assignedSubjectIds.has(subject.id),
  );

  if (!selectedClassId) {
    return (
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='text-center text-gray-500'>
          <Book className='w-12 h-12 mx-auto mb-3 text-gray-300' />
          <p>Please select a class to view subjects</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow'>
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
            <Book className='w-5 h-5 mr-2' />
            Subject Library
          </h3>

          {!isEditMode && (
            <div className='text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200'>
              View Mode - Switch to Edit Mode to drag subjects
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className='space-y-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search subjects...'
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <div className='flex '>
            {/* <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by teacher..."
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div> */}

            <select
              value={viewMode}
              onChange={e =>
                setViewMode(e.target.value as 'all' | 'assigned' | 'unassigned')
              }
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='all'>All Subjects</option>
              <option value='assigned'>Assigned</option>
              <option value='unassigned'>Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      <div className='p-4'>
        {isLoadingSubjects ? (
          <div className='flex justify-center items-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        ) : finalFilteredSubjects.length === 0 ? (
          <div className='text-center text-gray-500 py-8'>
            <Book className='w-12 h-12 mx-auto mb-3 text-gray-300' />
            <p>No subjects found</p>
            <p className='text-sm'>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Unassigned Subjects */}
            {unassignedSubjects.length > 0 && (
              <div>
                <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
                  <Clock className='w-4 h-4 mr-1' />
                  Available Subjects ({unassignedSubjects.length})
                </h4>
                <div className='grid grid-cols-1 gap-2'>
                  {unassignedSubjects.map(subject => {
                    const classSubject = classSubjects.find(
                      cs => cs.subject.id === subject.id,
                    );
                    return (
                      <DraggableSubject
                        key={subject.id}
                        subject={subject}
                        classSubject={classSubject}
                        isAssigned={false}
                        isEditMode={isEditMode}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assigned Subjects */}
            {assignedSubjects.length > 0 && (
              <div>
                <h4 className='text-sm font-medium text-gray-700 mb-2 flex items-center'>
                  <Book className='w-4 h-4 mr-1' />
                  Assigned Subjects ({assignedSubjects.length})
                </h4>
                <div className='grid grid-cols-1 gap-2'>
                  {assignedSubjects.map(subject => {
                    const classSubject = classSubjects.find(
                      cs => cs.subject.id === subject.id,
                    );
                    return (
                      <DraggableSubject
                        key={subject.id}
                        subject={subject}
                        classSubject={classSubject}
                        isAssigned={true}
                        isEditMode={isEditMode}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
