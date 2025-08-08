'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Code,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subjectService, teacherService, classService } from '@/api/services';
import {
  CreateSubjectRequest,
  ClassAssignment,
  SubjectResponse,
} from '@/api/types/subject';
import { TeacherListResponse } from '@/api/types/teacher';
import { ClassResponse } from '@/api/services/class.service';

interface AddSubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editSubject?: SubjectResponse | null; // Add edit mode
}

interface SubjectFormData {
  name: string;
  code: string;
  subjectType: 'compulsory' | 'optional';
  maxMarks: string;
  passMarks: string;
  assignedClasses: string[]; // Array of class IDs
  assignedTeachers: string[]; // Array of teacher IDs
}

const AddSubjectFormModal: React.FC<AddSubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editSubject = null,
}) => {
  const isEditMode = !!editSubject;
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    subjectType: 'compulsory',
    maxMarks: '',
    passMarks: '',
    assignedClasses: [],
    assignedTeachers: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherListResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch classes and teachers when modal opens, populate form if editing
  useEffect(() => {
    if (isOpen) {
      fetchClassesAndTeachers();

      // Populate form if editing
      if (isEditMode && editSubject) {
        setFormData({
          name: editSubject.name,
          code: editSubject.code,
          subjectType:
            editSubject.description === 'optional' ? 'optional' : 'compulsory',
          maxMarks: editSubject.maxMarks?.toString() || '',
          passMarks: editSubject.passMarks?.toString() || '',
          assignedClasses:
            editSubject.assignedClasses?.map(
              assignment => assignment.class.id,
            ) || [],
          assignedTeachers:
            editSubject.teacherAssignments?.map(
              assignment => assignment.teacher.id,
            ) || [],
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          code: '',
          subjectType: 'compulsory',
          maxMarks: '',
          passMarks: '',
          assignedClasses: [],
          assignedTeachers: [],
        });
      }
    }
  }, [isOpen, isEditMode, editSubject]);

  const fetchClassesAndTeachers = async () => {
    try {
      setLoadingData(true);
      console.log('Fetching classes and teachers...');

      // Fetch classes and teachers with proper error handling
      const classesPromise = classService.getAllClasses().catch(error => {
        console.error('Classes API error:', error);
        return {
          success: false,
          message: error.message || 'Failed to fetch classes',
          data: null,
        };
      });

      const teachersPromise = teacherService.getAllTeachers().catch(error => {
        console.error('Teachers API error:', error);
        return {
          success: false,
          message: error.message || 'Failed to fetch teachers',
          data: null,
        };
      });

      const [classesResponse, teachersResponse] = await Promise.all([
        classesPromise,
        teachersPromise,
      ]);

      console.log('Classes response:', classesResponse);
      console.log('Teachers response:', teachersResponse);

      // Handle classes response
      if (classesResponse.success && classesResponse.data) {
        console.log('Setting classes:', classesResponse.data);
        setClasses(classesResponse.data);
      } else {
        console.error('Classes fetch failed:', classesResponse.message);
        if (
          classesResponse.message?.includes('401') ||
          classesResponse.message?.includes('Unauthorized')
        ) {
          toast.error(
            'Authentication required. Please login to access classes.',
          );
        } else {
          toast.error(classesResponse.message || 'Failed to load classes');
        }
      }

      // Handle teachers response
      if (teachersResponse.success && teachersResponse.data) {
        console.log('Setting teachers:', teachersResponse.data);
        setTeachers(teachersResponse.data);
      } else {
        console.error('Teachers fetch failed:', teachersResponse.message);
        if (
          teachersResponse.message?.includes('401') ||
          teachersResponse.message?.includes('Unauthorized')
        ) {
          toast.error(
            'Authentication required. Please login to access teachers.',
          );
        } else {
          toast.error(teachersResponse.message || 'Failed to load teachers');
        }
      }
    } catch (error) {
      console.error('Error fetching classes and teachers:', error);
      toast.error(
        'Failed to load classes and teachers: ' + (error as Error).message,
      );
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof SubjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Class management functions
  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(id => id !== classId)
        : [...prev.assignedClasses, classId],
    }));
  };

  // Teacher management functions
  const handleTeacherToggle = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTeachers: prev.assignedTeachers.includes(teacherId)
        ? prev.assignedTeachers.filter(id => id !== teacherId)
        : [...prev.assignedTeachers, teacherId],
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Subject name is required';
    if (!formData.code.trim()) return 'Subject code is required';

    if (formData.maxMarks && isNaN(Number(formData.maxMarks))) {
      return 'Maximum marks must be a valid number';
    }
    if (formData.maxMarks && Number(formData.maxMarks) < 1) {
      return 'Maximum marks must be at least 1';
    }

    if (formData.passMarks && isNaN(Number(formData.passMarks))) {
      return 'Pass marks must be a valid number';
    }
    if (formData.passMarks && Number(formData.passMarks) < 1) {
      return 'Pass marks must be at least 1';
    }

    if (
      formData.maxMarks &&
      formData.passMarks &&
      Number(formData.passMarks) >= Number(formData.maxMarks)
    ) {
      return 'Pass marks must be less than maximum marks';
    }

    // No additional validation needed for class/teacher assignments
    // They are optional and can be empty arrays

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare class assignments from selected classes
      const classAssignments: ClassAssignment[] = formData.assignedClasses.map(
        classId => ({
          classId,
          teacherId: undefined, // No specific teacher per class (using general assignment)
        }),
      );

      // Prepare data for API call
      const requestData: CreateSubjectRequest = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.subjectType, // Store subject type as description
        maxMarks: formData.maxMarks ? Number(formData.maxMarks) : undefined,
        passMarks: formData.passMarks ? Number(formData.passMarks) : undefined,
        classAssignments:
          classAssignments.length > 0 ? classAssignments : undefined,
        teacherIds:
          formData.assignedTeachers.length > 0
            ? formData.assignedTeachers
            : undefined,
      };

      console.log(
        `${isEditMode ? 'Updating' : 'Creating'} subject with data:`,
        requestData,
      );
      const response = isEditMode
        ? await subjectService.updateSubject(editSubject!.id, requestData)
        : await subjectService.createSubject(requestData);
      console.log(
        `Subject ${isEditMode ? 'update' : 'creation'} response:`,
        response,
      );

      if (response.success) {
        let successMessage = `Subject "${formData.name}" has been ${isEditMode ? 'updated' : 'created'} successfully!`;

        // Show summary of assignments
        if (
          formData.assignedClasses.length > 0 ||
          formData.assignedTeachers.length > 0
        ) {
          const assignmentSummary = [];
          if (formData.assignedClasses.length > 0) {
            assignmentSummary.push(
              `${formData.assignedClasses.length} class${formData.assignedClasses.length > 1 ? 'es' : ''}`,
            );
          }
          if (formData.assignedTeachers.length > 0) {
            assignmentSummary.push(
              `${formData.assignedTeachers.length} teacher${formData.assignedTeachers.length > 1 ? 's' : ''} selected`,
            );
          }

          if (assignmentSummary.length > 0) {
            successMessage += ` Assigned to: ${assignmentSummary.join(', ')}.`;
          }
        }

        toast.success(successMessage);
        onSuccess();
        onClose();

        // Reset form
        setFormData({
          name: '',
          code: '',
          subjectType: 'compulsory',
          maxMarks: '',
          passMarks: '',
          assignedClasses: [],
          assignedTeachers: [],
        });
      } else {
        toast.error(
          response.message ||
            `Failed to ${isEditMode ? 'update' : 'create'} subject`,
        );
      }
    } catch (error: any) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} subject:`,
        error,
      );
      toast.error(
        error?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} subject. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='modal-scroll-blend modal-sidebar-blend rounded-2xl w-full max-w-2xl max-h-[85vh] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-500 to-red-600 p-4 border-b border-gray-100 sticky top-0 z-10'>
          <div className='absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-orange-200/40 to-red-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-1.5 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg'>
                <BookOpen className='text-white' size={20} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  {isEditMode ? 'Edit Subject' : 'Add New Subject'}
                </h2>
                <p className='text-orange-100 text-xs mt-1'>
                  {isEditMode
                    ? 'Update subject information'
                    : 'Create comprehensive subject profiles'}
                </p>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='p-2 text-orange-100 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50'
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className='p-4' onClick={e => e.stopPropagation()}>
          <form
            onSubmit={handleSubmit}
            className='space-y-6'
            onClick={e => e.stopPropagation()}
          >
            {/* Basic Information */}
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <FileText size={20} className='mr-3 text-blue-500' />
                Subject Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject Name <span className='text-red-500'>*</span>
                  </label>
                  <Input
                    type='text'
                    value={formData.name}
                    onChange={e => {
                      e.stopPropagation();
                      handleInputChange('name', e.target.value);
                    }}
                    placeholder='e.g., Advanced Mathematics'
                    className='w-full'
                    disabled={isSubmitting}
                    onClick={e => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject Code <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Code className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      type='text'
                      value={formData.code}
                      onChange={e => {
                        e.stopPropagation();
                        handleInputChange('code', e.target.value.toUpperCase());
                      }}
                      placeholder='e.g., MATH101'
                      className='w-full pl-10'
                      disabled={isSubmitting}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    Subject Type <span className='text-red-500'>*</span>
                  </label>
                  <div className='flex gap-4'>
                    <label
                      className='flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors'
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type='radio'
                        name='subjectType'
                        value='compulsory'
                        checked={formData.subjectType === 'compulsory'}
                        onChange={e => {
                          e.stopPropagation();
                          handleInputChange(
                            'subjectType',
                            e.target.value as 'compulsory' | 'optional',
                          );
                        }}
                        className='h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500'
                        disabled={isSubmitting}
                      />
                      <span className='ml-3 text-sm font-medium text-gray-700'>
                        Compulsory Subject
                      </span>
                    </label>

                    <label
                      className='flex items-center p-3 border border-gray-300 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors'
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type='radio'
                        name='subjectType'
                        value='optional'
                        checked={formData.subjectType === 'optional'}
                        onChange={e => {
                          e.stopPropagation();
                          handleInputChange(
                            'subjectType',
                            e.target.value as 'compulsory' | 'optional',
                          );
                        }}
                        className='h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500'
                        disabled={isSubmitting}
                      />
                      <span className='ml-3 text-sm font-medium text-gray-700'>
                        Optional Subject
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Marks Configuration */}
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <TrendingUp size={20} className='mr-3 text-green-500' />
                Assessment Configuration
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Maximum Marks
                  </label>
                  <div className='relative'>
                    <TrendingUp className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      type='number'
                      min='1'
                      value={formData.maxMarks}
                      onChange={e => {
                        e.stopPropagation();
                        handleInputChange('maxMarks', e.target.value);
                      }}
                      placeholder='Default: 100'
                      className='w-full pl-10'
                      disabled={isSubmitting}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pass Marks
                  </label>
                  <div className='relative'>
                    <TrendingDown className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      type='number'
                      min='1'
                      value={formData.passMarks}
                      onChange={e => {
                        e.stopPropagation();
                        handleInputChange('passMarks', e.target.value);
                      }}
                      placeholder='Default: 40'
                      className='w-full pl-10'
                      disabled={isSubmitting}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Class Selection */}
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <GraduationCap size={20} className='mr-3 text-purple-500' />
                Class Selection
              </h3>

              {loadingData ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600'></div>
                  <span className='ml-3 text-gray-600'>Loading classes...</span>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                  {classes.length === 0 ? (
                    <div className='col-span-full text-center py-8 text-gray-500'>
                      <GraduationCap className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                      <p>No classes available</p>
                    </div>
                  ) : (
                    classes
                      .filter(cls => !cls.deletedAt)
                      .map(cls => (
                        <label
                          key={cls.id}
                          className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors'
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type='checkbox'
                            checked={formData.assignedClasses.includes(cls.id)}
                            onChange={() => handleClassToggle(cls.id)}
                            className='rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                            disabled={isSubmitting}
                          />
                          <span className='text-sm text-gray-700'>
                            Grade {cls.grade} - Section {cls.section}
                          </span>
                        </label>
                      ))
                  )}
                </div>
              )}

              {formData.assignedClasses.length > 0 && (
                <div className='mt-4 p-3 bg-purple-50 rounded-lg'>
                  <p className='text-sm text-purple-700'>
                    Selected {formData.assignedClasses.length} class
                    {formData.assignedClasses.length > 1 ? 'es' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Teacher Selection */}
            <div className='bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                <Users size={20} className='mr-3 text-blue-500' />
                Teacher Assignment (Optional)
              </h3>

              {loadingData ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                  <span className='ml-3 text-gray-600'>
                    Loading teachers...
                  </span>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {teachers.length === 0 ? (
                    <div className='col-span-full text-center py-8 text-gray-500'>
                      <Users className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                      <p>No teachers available</p>
                    </div>
                  ) : (
                    teachers
                      .filter(teacher => teacher.isActive)
                      .map(teacher => (
                        <label
                          key={teacher.id}
                          className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors'
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type='checkbox'
                            checked={formData.assignedTeachers.includes(
                              teacher.id,
                            )}
                            onChange={() => handleTeacherToggle(teacher.id)}
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            disabled={isSubmitting}
                          />
                          <div className='flex-1'>
                            <span className='text-sm font-medium text-gray-700 block'>
                              {teacher.fullName}
                            </span>
                            {teacher.designation && (
                              <span className='text-xs text-gray-500'>
                                {teacher.designation}
                              </span>
                            )}
                          </div>
                        </label>
                      ))
                  )}
                </div>
              )}

              {formData.assignedTeachers.length > 0 && (
                <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                  <p className='text-sm text-blue-700'>
                    Selected {formData.assignedTeachers.length} teacher
                    {formData.assignedTeachers.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className='sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 p-6 -mx-6 -mb-6'>
              <div className='flex items-center justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={e => {
                    e.stopPropagation();
                    onClose();
                  }}
                  disabled={isSubmitting}
                  className='px-6 py-2 hover:bg-gray-50 transition-colors duration-200'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-8 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  {isSubmitting ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <BookOpen className='h-4 w-4' />
                      {isEditMode ? 'Update Subject' : 'Create Subject'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { AddSubjectFormModal };
export default AddSubjectFormModal;
