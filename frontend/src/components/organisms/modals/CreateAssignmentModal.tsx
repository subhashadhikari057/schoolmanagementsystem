import React, { useState, useEffect, useCallback } from 'react';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { assignmentService } from '@/api/services/assignment.service';
import { classService } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { teacherService } from '@/api/services/teacher.service';
import { CreateAssignmentRequest } from '@/api/types/assignment';
import { useAuth } from '@/hooks/useAuth';
import { Users, AlertCircle } from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Dynamic data interfaces
interface ClassOption {
  id: string;
  label: string;
  students: number;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface TeacherClassResponse {
  class: {
    id: string;
    grade: number;
    section: string;
    currentEnrollment?: number;
  };
}

interface TeacherSubjectResponse {
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface ClassResponse {
  id: string;
  grade: number;
  section: string;
  currentEnrollment?: number;
}

interface SubjectResponse {
  id: string;
  name: string;
  code: string;
}

interface TeacherResponse {
  id: string;
  fullName: string;
  email: string;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user and auth context
  const { user } = useAuth();

  // Dynamic data state
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Check if current user is a teacher
  const isTeacher = user?.role === 'teacher';
  const isAdminOrSuperAdmin =
    user?.role === 'admin' || user?.role === 'superadmin';

  // Form state - only fields that match backend DTO
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Assignment details - matching CreateAssignmentDto
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Load classes, subjects, and teachers based on user role
  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    setError(null);

    try {
      if (isTeacher && user?.id) {
        // For teachers: First get their teacher record to get teacher ID
        const teacherResponse = await teacherService.getCurrentTeacher();
        const teacherId = teacherResponse.data.id;

        // Then load only their assigned classes and subjects
        const [classesResponse, subjectsResponse] = await Promise.all([
          teacherService.getTeacherClasses(teacherId),
          teacherService.getTeacherSubjects(teacherId),
        ]);

        // Transform teacher's classes data
        const transformedClasses: ClassOption[] = classesResponse.data.map(
          (item: TeacherClassResponse) => ({
            id: item.class.id,
            label: `Grade ${item.class.grade} - Section ${item.class.section}`,
            students: item.class.currentEnrollment || 0,
          }),
        );

        // Transform teacher's subjects data
        const transformedSubjects: SubjectOption[] = subjectsResponse.data.map(
          (assignment: TeacherSubjectResponse) => ({
            id: assignment.subject.id,
            name: assignment.subject.name,
            code: assignment.subject.code,
          }),
        );

        setClasses(transformedClasses);
        setSubjects(transformedSubjects);
        setTeachers([]); // Teachers don't need to see other teachers

        // Auto-assign teacher to themselves
        setSelectedTeacher(teacherId);
      } else if (isAdminOrSuperAdmin) {
        // For admins: Load all classes, subjects, and teachers
        const [classesResponse, subjectsResponse, teachersResponse] =
          await Promise.all([
            classService.getAllClasses(),
            subjectService.getAllSubjects(),
            teacherService.getAllTeachers(),
          ]);

        // Transform classes data
        const transformedClasses: ClassOption[] = classesResponse.data.map(
          (cls: ClassResponse) => ({
            id: cls.id,
            label: `Grade ${cls.grade} - Section ${cls.section}`,
            students: cls.currentEnrollment || 0,
          }),
        );

        // Transform subjects data
        const transformedSubjects: SubjectOption[] = subjectsResponse.data.map(
          (subject: SubjectResponse) => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
          }),
        );

        // Transform teachers data
        const transformedTeachers: TeacherOption[] = teachersResponse.data.map(
          (teacher: TeacherResponse) => ({
            id: teacher.id,
            name: teacher.fullName,
            email: teacher.email,
          }),
        );

        setClasses(transformedClasses);
        setSubjects(transformedSubjects);
        setTeachers(transformedTeachers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load required data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, [isTeacher, isAdminOrSuperAdmin, user]);

  // Load initial data when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      loadInitialData();
    }
  }, [isOpen, user, loadInitialData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Reset form to initial state
  const resetForm = () => {
    setSelectedClasses([]);
    setSelectedSubject('');
    setSelectedTeacher('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields (only title, classId, subjectId are required in backend)
      if (!title.trim()) {
        throw new Error('Assignment title is required');
      }
      if (!selectedSubject) {
        throw new Error('Subject is required');
      }
      if (selectedClasses.length === 0) {
        throw new Error('At least one class must be selected');
      }

      // Prepare assignment data for each selected class
      const assignments = selectedClasses.map(classId => {
        const assignmentData: CreateAssignmentRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          classId: classId,
          subjectId: selectedSubject,
          teacherId: selectedTeacher || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          additionalMetadata: undefined, // Can be used for future extensions
        };
        return assignmentData;
      });

      // Create assignments for all selected classes
      const results = await Promise.all(
        assignments.map(assignment =>
          assignmentService.createAssignment(assignment),
        ),
      );

      // Check if all assignments were created successfully
      const allSuccessful = results.every(result => result.success);

      if (allSuccessful) {
        onSuccess?.();
        onClose();
        resetForm();
      } else {
        throw new Error('Some assignments failed to create');
      }
    } catch (error: unknown) {
      console.error('Failed to create assignment:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create assignment. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Single form content - matching backend DTO structure
  const formContent = (
    <div className='space-y-6'>
      {/* Basic Assignment Information */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Assignment Title *
            </label>
            <Input
              placeholder='e.g., Chapter 5 Mathematics'
              className='focus:border-blue-500 focus:ring-blue-500'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Due Date
            </label>
            <Input
              type='date'
              className='focus:border-blue-500 focus:ring-blue-500'
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div
          className={`grid gap-4 ${isAdminOrSuperAdmin ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Subject *
            </label>
            <Dropdown
              placeholder={
                loadingData ? 'Loading subjects...' : 'Select subject'
              }
              options={[
                { value: '', label: 'Select subject' },
                ...subjects.map(subject => ({
                  value: subject.id,
                  label: `${subject.name} (${subject.code})`,
                })),
              ]}
              className='w-full'
              selectedValue={selectedSubject}
              onSelect={setSelectedSubject}
              type='filter'
            />
          </div>
          {isAdminOrSuperAdmin && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Assign to Teacher (Optional)
              </label>
              <Dropdown
                placeholder={
                  loadingData
                    ? 'Loading teachers...'
                    : 'Auto-assign to current teacher'
                }
                options={[
                  { value: '', label: 'Auto-assign to current teacher' },
                  ...teachers.map(teacher => ({
                    value: teacher.id,
                    label: teacher.name,
                  })),
                ]}
                className='w-full'
                selectedValue={selectedTeacher}
                onSelect={setSelectedTeacher}
                type='filter'
              />
            </div>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Description
          </label>
          <Textarea
            className='min-h-[100px] focus:border-blue-500 focus:ring-blue-500'
            rows={4}
            placeholder='Provide a clear description of the assignment...'
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Assign to Classes Section */}
      <div className='space-y-4'>
        <label className='block text-sm font-medium text-gray-700 mb-3'>
          Assign to Classes *
        </label>
        {loadingData ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-gray-600'>Loading classes...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <p>No classes available</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {classes.map(cls => (
              <label
                key={cls.id}
                className={`flex items-center border rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 gap-3 shadow-sm hover:shadow-md
                  ${
                    selectedClasses.includes(cls.id)
                      ? 'border-blue-600 bg-blue-50 shadow-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                  }
                `}
                style={{ minHeight: '64px' }}
              >
                <input
                  type='checkbox'
                  checked={selectedClasses.includes(cls.id)}
                  onChange={() =>
                    setSelectedClasses(
                      selectedClasses.includes(cls.id)
                        ? selectedClasses.filter(id => id !== cls.id)
                        : [...selectedClasses, cls.id],
                    )
                  }
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                />
                <div className='flex flex-col justify-center flex-1'>
                  <div className='font-medium text-sm text-gray-900 leading-tight'>
                    {cls.label}
                  </div>
                  <div className='text-xs text-gray-500 leading-tight mt-0.5'>
                    {cls.students} students
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative border border-gray-200 my-8 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg
                className='w-5 h-5 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            Create New Assignment
          </h2>
          <button
            className='text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors'
            onClick={onClose}
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className='px-6 py-6'>{formContent}</div>

        {/* Error Display */}
        {error && (
          <div className='px-6 py-4 border-t border-gray-200'>
            <div className='flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0' />
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className='px-6 py-4 flex justify-end gap-3 border-t border-gray-200 bg-gray-50 rounded-b-xl'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || loadingData}
            className='px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2'
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                Creating...
              </>
            ) : (
              'Create Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
