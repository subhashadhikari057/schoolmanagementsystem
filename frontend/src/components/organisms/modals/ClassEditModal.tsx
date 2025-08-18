'use client';

import React, { useState, useEffect } from 'react';
import { X, School, Search, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  classService,
  AvailableTeacher,
  UpdateClassRequest,
} from '@/api/services/class.service';

interface ClassData {
  id: string;
  name?: string;
  grade: number;
  section: string;
  capacity: number;
  roomId: string;
  classTeacherId?: string;
  shift?: 'morning' | 'day';
  room?: {
    roomNo: string;
    name?: string;
    floor: number;
    building?: string;
  };
  classTeacher?: {
    id: string;
    fullName: string;
    email: string;
    employeeId?: string;
  };
  studentCount?: number;
  status: 'Active' | 'Inactive';
}

interface ClassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData: ClassData | null;
}

interface FormData {
  name: string;
  capacity: number;
  classTeacherId: string;
}

const ClassEditModal: React.FC<ClassEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    capacity: 30,
    classTeacherId: '',
  });

  const [teachers, setTeachers] = useState<AvailableTeacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<AvailableTeacher[]>(
    [],
  );
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

  // Initialize form data when modal opens or classData changes
  useEffect(() => {
    if (isOpen && classData) {
      setFormData({
        name:
          classData.name ||
          `Grade ${classData.grade} Section ${classData.section}`,
        capacity: classData.capacity,
        classTeacherId: classData.classTeacherId || '',
      });

      // Set the teacher search term to the current teacher's name
      if (classData.classTeacher?.fullName) {
        setTeacherSearchTerm(classData.classTeacher.fullName);
      }
    }
  }, [isOpen, classData]);

  // Load teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  // Filter teachers based on search term
  useEffect(() => {
    if (!teacherSearchTerm) {
      setFilteredTeachers(teachers);
      return;
    }

    const filtered = teachers.filter(
      teacher =>
        teacher.fullName
          .toLowerCase()
          .includes(teacherSearchTerm.toLowerCase()) ||
        (teacher.employeeId &&
          teacher.employeeId
            .toLowerCase()
            .includes(teacherSearchTerm.toLowerCase())) ||
        teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase()),
    );

    setFilteredTeachers(filtered);
  }, [teacherSearchTerm, teachers]);

  const loadTeachers = async () => {
    try {
      const response = await classService.getAvailableTeachers();
      if (response.success && response.data) {
        // Include the current class teacher in the list if not already available
        let teachersList = [...response.data];

        if (
          classData?.classTeacher &&
          !teachersList.find(t => t.id === classData.classTeacher!.id)
        ) {
          teachersList.push({
            id: classData.classTeacher.id,
            fullName: classData.classTeacher.fullName || '',
            email: classData.classTeacher.email || '',
            employeeId: classData.classTeacher.employeeId,
          });
        }

        setTeachers(teachersList);
        setFilteredTeachers(teachersList);
      }
    } catch (error) {
      console.error('Failed to load available teachers:', error);
      toast.error('Failed to load available teachers');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 30,
      classTeacherId: '',
    });
    setTeacherSearchTerm('');
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value, 10) || 0 : value,
    }));

    if (error) setError(null);
  };

  const handleTeacherSelect = (teacher: AvailableTeacher) => {
    setFormData(prev => ({
      ...prev,
      classTeacherId: teacher.id,
    }));
    setTeacherSearchTerm(teacher.fullName);
    setIsTeacherDropdownOpen(false);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Class name is required';
    if (!formData.capacity || formData.capacity < 1)
      return 'Please enter a valid capacity';
    if (!formData.classTeacherId) return 'Please select a class teacher';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classData) return;

    const error = validateForm();
    if (error) {
      setError(error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare update data - only include fields that have changed
      const updateData: UpdateClassRequest = {};

      if (
        formData.name !==
        (classData.name ||
          `Grade ${classData.grade} Section ${classData.section}`)
      ) {
        updateData.name = formData.name;
      }

      if (formData.capacity !== classData.capacity) {
        updateData.capacity = formData.capacity;
      }

      if (formData.classTeacherId !== classData.classTeacherId) {
        updateData.classTeacherId = formData.classTeacherId;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes detected');
        onClose();
        return;
      }

      const response = await classService.updateClass(classData.id, updateData);

      if (response.success) {
        toast.success('Class updated successfully', {
          description: `${formData.name} has been updated.`,
        });

        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error(response.message || 'Failed to update class');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error updating class:', error);

      let errorMessage = 'Failed to update class';
      let errorDescription = 'An unexpected error occurred';

      if (error.message) {
        if (error.message.includes('already assigned')) {
          errorMessage = 'Teacher Assignment Issue';
          errorDescription =
            'The selected teacher is already assigned as a class teacher to another class. Please choose a different teacher.';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'Class Name Issue';
          errorDescription =
            'A class with this name already exists. Please choose a different name.';
        } else {
          errorDescription = error.message;
        }
      }

      toast.error(errorMessage, {
        description: errorDescription,
      });
      setError(errorDescription);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto'
      onClick={() => !isLoading && onClose()}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-teal-200/30 rounded-full blur-2xl' />
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-emerald-200/40 to-cyan-200/40 rounded-full blur-xl' />
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg'>
                <School size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>Edit Class</h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Update class name, capacity, and teacher assignment
                </p>
              </div>
            </div>
            <button
              onClick={() => !isLoading && onClose()}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Current Class Info */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <h3 className='text-sm font-semibold text-gray-700 mb-2'>
                Current Class Information
              </h3>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-500'>Grade:</span>{' '}
                  <span className='font-medium'>{classData.grade}</span>
                </div>
                <div>
                  <span className='text-gray-500'>Section:</span>{' '}
                  <span className='font-medium'>{classData.section}</span>
                </div>
                <div>
                  <span className='text-gray-500'>Shift:</span>{' '}
                  <span className='font-medium capitalize'>
                    {classData.shift?.toLowerCase() || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className='text-gray-500'>Room:</span>{' '}
                  <span className='font-medium'>
                    {classData.room?.roomNo || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className='space-y-6'>
              <div>
                <label className='text-sm font-medium leading-none mb-2 block'>
                  Class Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='Enter class name'
                  className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200'
                />
              </div>

              <div>
                <label className='text-sm font-medium leading-none mb-2 block'>
                  Capacity <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  name='capacity'
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min={1}
                  max={100}
                  className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Current enrollment: {classData.studentCount || 0} students
                </p>
              </div>

              <div>
                <label className='text-sm font-medium leading-none mb-2 block'>
                  Class Teacher <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='relative'>
                    <input
                      type='text'
                      value={teacherSearchTerm}
                      onChange={e => {
                        setTeacherSearchTerm(e.target.value);
                        setIsTeacherDropdownOpen(true);
                      }}
                      onFocus={() => setIsTeacherDropdownOpen(true)}
                      placeholder='Search for a teacher...'
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 pl-9'
                    />
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                  </div>

                  {isTeacherDropdownOpen && (
                    <div className='absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto'>
                      {filteredTeachers.length > 0 ? (
                        <ul>
                          {filteredTeachers.map(teacher => (
                            <li
                              key={teacher.id}
                              onClick={() => handleTeacherSelect(teacher)}
                              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                                formData.classTeacherId === teacher.id
                                  ? 'bg-green-50'
                                  : ''
                              }`}
                            >
                              <User className='h-4 w-4 text-gray-500 mr-2' />
                              <div>
                                <div className='font-medium'>
                                  {teacher.fullName}
                                </div>
                                <div className='text-xs text-gray-500'>
                                  {teacher.employeeId
                                    ? `ID: ${teacher.employeeId} • `
                                    : ''}
                                  {teacher.email}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className='px-4 py-2 text-gray-500'>
                          No teachers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className='flex items-center justify-end pt-4 border-t border-gray-200 space-x-3'>
              <button
                type='button'
                onClick={() => !isLoading && onClose()}
                disabled={isLoading}
                className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Updating...
                  </>
                ) : (
                  'Update Class'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassEditModal;
