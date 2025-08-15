'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  User,
  Search,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { parentService } from '@/api/services/parent.service';
import { studentService } from '@/api/services/student.service';

interface ParentChildLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'link-to-parent' | 'link-to-student';
  parentId?: string;
  studentId?: string;
}

interface Parent {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  occupation?: string;
  children: Array<{
    id: string;
    fullName: string;
    className: string;
    relationship: string;
    isPrimary: boolean;
  }>;
}

interface Student {
  id: string;
  fullName: string;
  className: string;
  rollNumber: string;
  email: string;
}

interface LinkingFormData {
  parentId: string;
  studentId: string;
  relationship: string;
  isPrimary: boolean;
}

const initialFormData: LinkingFormData = {
  parentId: '',
  studentId: '',
  relationship: 'father',
  isPrimary: false,
};

// Input field component
const LabeledInput: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  icon,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <div className='relative'>
      {icon && (
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex h-10 w-full rounded-md border ${
          error ? 'border-red-500' : 'border-gray-300'
        } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
          icon ? 'pl-10' : ''
        }`}
        aria-invalid={error ? 'true' : 'false'}
      />
    </div>
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

// Select field component
const LabeledSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required,
  disabled,
  error,
}) => (
  <div>
    <label className='text-sm font-medium leading-none mb-2 block'>
      {label}
      {required && <span className='text-red-500 ml-1'>*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border ${
        error ? 'border-red-500' : 'border-gray-300'
      } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
      aria-invalid={error ? 'true' : 'false'}
    >
      <option value=''>{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
  </div>
);

export default function ParentChildLinkingModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  parentId,
  studentId,
}: ParentChildLinkingModalProps) {
  const [formData, setFormData] = useState<LinkingFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Search states
  const [parentSearch, setParentSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadAvailableParents();
      loadAvailableStudents();

      // Pre-fill form based on mode
      if (mode === 'link-to-parent' && parentId) {
        setFormData(prev => ({ ...prev, parentId }));
      } else if (mode === 'link-to-student' && studentId) {
        setFormData(prev => ({ ...prev, studentId }));
      }
    }
  }, [isOpen, mode, parentId, studentId]);

  // Filter parents based on search
  useEffect(() => {
    if (parentSearch.trim()) {
      const filtered = availableParents.filter(
        parent =>
          parent.fullName.toLowerCase().includes(parentSearch.toLowerCase()) ||
          parent.email.toLowerCase().includes(parentSearch.toLowerCase()),
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(availableParents);
    }
  }, [parentSearch, availableParents]);

  // Filter students based on search
  useEffect(() => {
    if (studentSearch.trim()) {
      const filtered = availableStudents.filter(
        student =>
          student.fullName
            .toLowerCase()
            .includes(studentSearch.toLowerCase()) ||
          student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
          student.rollNumber
            .toLowerCase()
            .includes(studentSearch.toLowerCase()),
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(availableStudents);
    }
  }, [studentSearch, availableStudents]);

  const loadAvailableParents = async () => {
    try {
      setSearchLoading(true);
      const response = await parentService.getAllParents({ limit: 100 });
      if (response.success) {
        setAvailableParents(response.data.parents);
      }
    } catch (error) {
      console.error('Failed to load parents:', error);
      toast.error('Failed to load available parents');
    } finally {
      setSearchLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const response = await parentService.getParentChildren('available'); // This would be a new endpoint
      if (response.success) {
        setAvailableStudents(response.data);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      // For now, let's use a mock response
      setAvailableStudents([]);
    }
  };

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]:
          type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: '',
        }));
      }
    },
    [errors],
  );

  // Handle checkbox change
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    },
    [],
  );

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.parentId) newErrors.parentId = 'Parent is required';
    if (!formData.studentId) newErrors.studentId = 'Student is required';
    if (!formData.relationship)
      newErrors.relationship = 'Relationship is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);

    try {
      const response = await parentService.addChildToParent(formData.parentId, {
        studentId: formData.studentId,
        relationship: formData.relationship,
      });

      if (response.success) {
        // If this should be primary parent, set it
        if (formData.isPrimary) {
          await parentService.setPrimaryParent(
            formData.parentId,
            formData.studentId,
          );
        }

        toast.success('Parent and child linked successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to link parent and child');
      }
    } catch (error: any) {
      console.error('Error linking parent and child:', error);
      toast.error(error.message || 'Failed to link parent and child');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = useCallback(() => {
    if (loading) return;
    setFormData(initialFormData);
    setErrors({});
    setParentSearch('');
    setStudentSearch('');
    onClose();
  }, [loading, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, handleClose]);

  if (!isOpen) return null;

  const selectedParent = availableParents.find(p => p.id === formData.parentId);
  const selectedStudent = availableStudents.find(
    s => s.id === formData.studentId,
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between text-white'>
          <div className='flex items-center'>
            <Users size={24} className='mr-3' />
            <div>
              <h2 className='text-xl font-bold'>Link Parent & Child</h2>
              <p className='text-blue-100 text-sm'>
                {mode === 'link-to-parent'
                  ? 'Add a child to this parent'
                  : 'Link an existing parent to this student'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className='p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50'
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Parent Selection */}
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <User size={20} className='mr-3 text-green-600' />
                Select Parent
              </h3>

              {mode !== 'link-to-parent' && (
                <div className='mb-4'>
                  <LabeledInput
                    label='Search Parents'
                    name='parentSearch'
                    value={parentSearch}
                    onChange={e => setParentSearch(e.target.value)}
                    placeholder='Search by name or email...'
                    icon={<Search size={16} />}
                  />
                </div>
              )}

              <div className='space-y-2'>
                {mode === 'link-to-parent' ? (
                  <div className='p-4 bg-white rounded-lg border border-green-200'>
                    <p className='font-medium text-gray-900'>
                      {selectedParent?.fullName || 'Loading parent...'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedParent?.email}
                    </p>
                    {selectedParent?.children &&
                      selectedParent.children.length > 0 && (
                        <div className='mt-2'>
                          <p className='text-xs text-gray-500'>
                            Current children:
                          </p>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {selectedParent.children.map(child => (
                              <span
                                key={child.id}
                                className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
                              >
                                {child.fullName} ({child.relationship})
                                {child.isPrimary && (
                                  <UserCheck size={12} className='ml-1' />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className='max-h-40 overflow-y-auto space-y-2'>
                    {filteredParents.map(parent => (
                      <div
                        key={parent.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.parentId === parent.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            parentId: parent.id,
                          }))
                        }
                      >
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {parent.fullName}
                            </p>
                            <p className='text-sm text-gray-600'>
                              {parent.email}
                            </p>
                            {parent.occupation && (
                              <p className='text-xs text-gray-500'>
                                {parent.occupation}
                              </p>
                            )}
                          </div>
                          {parent.children.length > 0 && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800'>
                              {parent.children.length} child
                              {parent.children.length > 1 ? 'ren' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredParents.length === 0 && (
                      <div className='text-center py-8 text-gray-500'>
                        <AlertCircle
                          size={48}
                          className='mx-auto mb-2 text-gray-300'
                        />
                        <p>No parents found</p>
                        {parentSearch && (
                          <p className='text-sm'>
                            Try adjusting your search terms
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Student Selection */}
            <div className='bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <User size={20} className='mr-3 text-orange-600' />
                Select Student
              </h3>

              {mode !== 'link-to-student' && (
                <div className='mb-4'>
                  <LabeledInput
                    label='Search Students'
                    name='studentSearch'
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder='Search by name, email, or roll number...'
                    icon={<Search size={16} />}
                  />
                </div>
              )}

              <div className='space-y-2'>
                {mode === 'link-to-student' ? (
                  <div className='p-4 bg-white rounded-lg border border-orange-200'>
                    <p className='font-medium text-gray-900'>
                      {selectedStudent?.fullName || 'Loading student...'}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedStudent?.className} - Roll:{' '}
                      {selectedStudent?.rollNumber}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {selectedStudent?.email}
                    </p>
                  </div>
                ) : (
                  <div className='max-h-40 overflow-y-auto space-y-2'>
                    {filteredStudents.map(student => (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.studentId === student.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            studentId: student.id,
                          }))
                        }
                      >
                        <div className='flex justify-between items-start'>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {student.fullName}
                            </p>
                            <p className='text-sm text-gray-600'>
                              {student.className} - Roll: {student.rollNumber}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className='text-center py-8 text-gray-500'>
                        <AlertCircle
                          size={48}
                          className='mx-auto mb-2 text-gray-300'
                        />
                        <p>No students found</p>
                        {studentSearch && (
                          <p className='text-sm'>
                            Try adjusting your search terms
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Relationship Details */}
            <div className='bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <Users size={20} className='mr-3 text-purple-600' />
                Relationship Details
              </h3>

              <div className='space-y-4'>
                <LabeledSelect
                  label='Relationship'
                  name='relationship'
                  value={formData.relationship}
                  onChange={handleInputChange}
                  options={[
                    { value: 'father', label: 'Father' },
                    { value: 'mother', label: 'Mother' },
                    { value: 'guardian', label: 'Guardian' },
                    { value: 'stepfather', label: 'Step Father' },
                    { value: 'stepmother', label: 'Step Mother' },
                    { value: 'grandfather', label: 'Grandfather' },
                    { value: 'grandmother', label: 'Grandmother' },
                    { value: 'uncle', label: 'Uncle' },
                    { value: 'aunt', label: 'Aunt' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder='Select relationship'
                  required
                  error={errors.relationship}
                />

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='isPrimary'
                    name='isPrimary'
                    checked={formData.isPrimary}
                    onChange={handleCheckboxChange}
                    className='rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                  />
                  <label
                    htmlFor='isPrimary'
                    className='text-sm font-medium text-gray-700'
                  >
                    Set as primary parent for this student
                  </label>
                </div>
                <p className='text-xs text-gray-500'>
                  Primary parents receive all school communications and can make
                  decisions for the student.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className='flex justify-end space-x-4 pt-6 border-t'>
              <button
                type='button'
                onClick={handleClose}
                disabled={loading}
                className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading || !formData.parentId || !formData.studentId}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Linking...
                  </>
                ) : (
                  <>
                    <Plus size={16} className='mr-2' />
                    Link Parent & Child
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
