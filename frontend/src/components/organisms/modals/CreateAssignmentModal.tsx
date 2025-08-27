import React, { useState, useEffect, useCallback, useRef } from 'react';
import Input from '@/components/atoms/form-controls/Input';
import Textarea from '@/components/atoms/form-controls/Textarea';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { assignmentService } from '@/api/services/assignment.service';
import { classService } from '@/api/services/class.service';
import { subjectService } from '@/api/services/subject.service';
import { teacherService } from '@/api/services/teacher.service';
import {
  CreateAssignmentRequest,
  AssignmentResponse,
  AssignmentAttachment,
} from '@/api/types/assignment';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  AlertCircle,
  Upload,
  X,
  FileText,
  Image,
  File,
} from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editAssignment?: AssignmentResponse | any;
  preSelectedClass?: {
    id: string;
    name: string;
  };
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
  editAssignment,
  preSelectedClass,
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

  // Normalize role to handle backend inconsistencies (e.g., TEACHER -> teacher)
  const normalizedRole = user?.role?.toLowerCase().replace(/_/g, '');

  // Check if current user is a teacher
  const isTeacher = normalizedRole === 'teacher';
  const isAdminOrSuperAdmin =
    normalizedRole === 'admin' || normalizedRole === 'superadmin';

  // Form state - only fields that match backend DTO
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Assignment details - matching CreateAssignmentDto
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to populate form with edit data or pre-selected class
  useEffect(() => {
    if (isOpen) {
      if (editAssignment) {
        console.log('Populating form with edit data:', editAssignment);
        setTitle(editAssignment.title);
        setDescription(editAssignment.description || '');

        // Safely handle date conversion - use originalDueDate if available
        const dateToConvert =
          (editAssignment as any).originalDueDate !== undefined
            ? (editAssignment as any).originalDueDate
            : editAssignment.dueDate;

        const safeDueDate = dateToConvert
          ? (() => {
              // Handle the case where dueDate might be a display string like "No due date"
              if (
                typeof dateToConvert === 'string' &&
                (dateToConvert === 'No due date' ||
                  dateToConvert.includes('No due date'))
              ) {
                return '';
              }

              const date = new Date(dateToConvert);
              return isNaN(date.getTime())
                ? ''
                : date.toISOString().split('T')[0];
            })()
          : '';

        setDueDate(safeDueDate);

        // Extract IDs from the assignment data structure
        const classId = editAssignment.class?.id || '';
        const subjectId = editAssignment.subject?.id || '';
        const teacherId = editAssignment.teacher?.id || '';

        console.log('Extracted IDs:', { classId, subjectId, teacherId });

        setSelectedClasses([classId]);
        setSelectedSubject(subjectId);
        setSelectedTeacher(teacherId);
      } else if (preSelectedClass) {
        // If we have a pre-selected class, set it
        setSelectedClasses([preSelectedClass.id]);
      } else {
        // Reset form for create mode
        resetForm();
      }
    }
  }, [editAssignment, isOpen, preSelectedClass]);

  // Effect to populate form after data is loaded (for edit mode)
  useEffect(() => {
    if (isOpen && editAssignment && subjects.length > 0 && classes.length > 0) {
      // Re-populate form with edit data after subjects and classes are loaded
      const subjectId = editAssignment.subject?.id || '';
      const classId = editAssignment.class?.id || '';
      const teacherId = editAssignment.teacher?.id || '';

      console.log('Re-populating form after data load:', {
        subjectId,
        classId,
        teacherId,
      });
      console.log(
        'Available subjects:',
        subjects.map(s => ({ id: s.id, name: s.name })),
      );
      console.log(
        'Available classes:',
        classes.map(c => ({ id: c.id, label: c.label })),
      );

      // Only set if the IDs exist in the loaded data
      if (subjectId && subjects.some(s => s.id === subjectId)) {
        console.log('Setting selected subject:', subjectId);
        setSelectedSubject(subjectId);
      } else {
        console.log('Subject ID not found in available subjects:', subjectId);
      }
      if (classId && classes.some(c => c.id === classId)) {
        console.log('Setting selected class:', classId);
        setSelectedClasses([classId]);
      } else {
        console.log('Class ID not found in available classes:', classId);
      }
      if (teacherId && teachers.some(t => t.id === teacherId)) {
        console.log('Setting selected teacher:', teacherId);
        setSelectedTeacher(teacherId);
      } else {
        console.log('Teacher ID not found in available teachers:', teacherId);
      }
    }
  }, [isOpen, editAssignment, subjects, classes, teachers]);

  // Load classes, subjects, and teachers based on user role
  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    setError(null);

    try {
      if (isTeacher && user?.id) {
        // For teachers: Load their own assigned classes and subjects directly
        const [classesResponse, subjectsResponse, teacherResponse] =
          await Promise.all([
            teacherService.getMyClasses(),
            teacherService.getMySubjects(),
            teacherService.getCurrentTeacher(),
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

        console.log('Teacher subjects loaded:', transformedSubjects);
        setClasses(transformedClasses);
        setSubjects(transformedSubjects);
        setTeachers([]); // Teachers don't need to see other teachers

        // Auto-assign teacher to themselves
        setSelectedTeacher(teacherResponse.data.id);

        // If a class is pre-selected, set it
        if (preSelectedClass) {
          setSelectedClasses([preSelectedClass.id]);
        }
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

        console.log('Admin subjects loaded:', transformedSubjects);

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
  }, [isTeacher, isAdminOrSuperAdmin, user, preSelectedClass]);

  // Load initial data when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      loadInitialData();
    }
  }, [isOpen, user, loadInitialData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setSelectedClasses([]);
    setSelectedSubject('');
    setSelectedTeacher('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setSelectedFiles([]);
    setFileErrors([]);
    setError(null);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      const validation = assignmentService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + validFiles.length > 5) {
      newErrors.push('Maximum 5 files allowed');
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    setFileErrors(newErrors);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className='w-4 h-4' />;
    } else if (file.type.includes('pdf')) {
      return <FileText className='w-4 h-4' />;
    } else {
      return <File className='w-4 h-4' />;
    }
  };

  const formatFileSize = (bytes: number) => {
    return assignmentService.formatFileSize(bytes);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');

    const files = Array.from(e.dataTransfer.files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      const validation = assignmentService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + validFiles.length > 5) {
      newErrors.push('Maximum 5 files allowed');
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    setFileErrors(newErrors);
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

      if (editAssignment) {
        // Update existing assignment
        const assignmentData: CreateAssignmentRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          classId: selectedClasses[0], // For edit, only one class
          subjectId: selectedSubject,
          teacherId: selectedTeacher || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          additionalMetadata: undefined,
        };

        const result = await assignmentService.updateAssignment(
          editAssignment.id,
          assignmentData,
        );

        if (result.success) {
          // Handle attachments replacement - only when new files are selected
          if (selectedFiles.length > 0) {
            try {
              // First, delete all existing attachments if there are any
              if (
                editAssignment.attachments &&
                editAssignment.attachments.length > 0
              ) {
                console.log(
                  'Deleting existing attachments:',
                  editAssignment.attachments.length,
                );
                const deletePromises = editAssignment.attachments.map(
                  (attachment: AssignmentAttachment) =>
                    assignmentService
                      .deleteAssignmentAttachment(
                        editAssignment.id,
                        attachment.id,
                      )
                      .catch(error => {
                        console.error(
                          `Failed to delete attachment ${attachment.id}:`,
                          error,
                        );
                        return null; // Continue with other deletions
                      }),
                );
                await Promise.all(deletePromises);
                console.log('Existing attachments deleted');
              }

              // Then upload new attachments
              console.log('Uploading new attachments:', selectedFiles.length);
              await assignmentService.uploadAssignmentAttachments(
                editAssignment.id,
                selectedFiles,
              );
              console.log('New attachments uploaded');
            } catch (uploadError) {
              console.error('Failed to handle attachments:', uploadError);
              // Don't fail the entire operation if file upload fails
            }
          } else {
            // No new files selected - keep existing attachments unchanged
            console.log(
              'No new files selected - keeping existing attachments unchanged',
            );
          }

          onSuccess?.();
          onClose();
          resetForm();
        } else {
          throw new Error('Failed to update assignment');
        }
      } else {
        // Create new assignments for all selected classes
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

        // Debug: Log the results to understand the structure
        console.log('Assignment creation results:', results);

        // Check if all assignments were created successfully
        const allSuccessful = results.every(result => result.success);

        if (allSuccessful) {
          // Upload attachments to all created assignments if files are selected
          if (selectedFiles.length > 0) {
            console.log('Uploading attachments to assignments...');
            const uploadPromises = results.map((result, index) => {
              console.log(`Result ${index}:`, result);
              if (result.success && result.data) {
                // Try different possible structures
                const assignmentId =
                  result.data.assignment?.id || (result.data as any).id;
                if (assignmentId) {
                  console.log(`Uploading to assignment ID: ${assignmentId}`);
                  return assignmentService
                    .uploadAssignmentAttachments(assignmentId, selectedFiles)
                    .catch(uploadError => {
                      console.error(
                        'Failed to upload attachments:',
                        uploadError,
                      );
                      // Don't fail the entire operation if file upload fails
                      return null;
                    });
                } else {
                  console.log(
                    `No assignment ID found in result ${index}:`,
                    result.data,
                  );
                }
              } else {
                console.log(`Skipping upload for result ${index}:`, result);
              }
              return Promise.resolve(null);
            });

            // Wait for all uploads to complete (but don't fail if some fail)
            const uploadResults = await Promise.all(uploadPromises);
            const successfulUploads = uploadResults.filter(
              result => result !== null,
            ).length;
            console.log(
              `All uploads completed. ${successfulUploads} out of ${results.length} assignments received attachments.`,
            );
          }

          onSuccess?.();
          onClose();
          resetForm();
        } else {
          throw new Error('Some assignments failed to create');
        }
      }
    } catch (error: unknown) {
      const action = editAssignment ? 'update' : 'create';
      console.error(`Failed to ${action} assignment:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${action} assignment. Please try again.`;
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

        {/* File Upload Section */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Attachments (Optional)
          </label>
          <div className='space-y-3'>
            {/* File Upload Area */}
            <div
              className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors'
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp'
                onChange={handleFileSelect}
                className='hidden'
              />
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='flex flex-col items-center justify-center w-full space-y-2'
              >
                <Upload className='w-8 h-8 text-gray-400' />
                <div className='text-sm text-gray-600'>
                  <span className='font-medium text-blue-600 hover:text-blue-500'>
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </div>
                <div className='text-xs text-gray-500'>
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, Images (max
                  10MB each, up to 5 files)
                </div>
              </button>
            </div>

            {/* File Errors */}
            {fileErrors.length > 0 && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                <div className='text-sm text-red-700'>
                  <div className='font-medium mb-1'>File upload errors:</div>
                  <ul className='list-disc list-inside space-y-1'>
                    {fileErrors.map((error, index) => (
                      <li key={index} className='text-xs'>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className='space-y-2'>
                <div className='text-sm font-medium text-gray-700'>
                  Selected Files ({selectedFiles.length}/5):
                </div>
                <div className='space-y-2'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='text-gray-500'>{getFileIcon(file)}</div>
                        <div className='flex flex-col'>
                          <div className='text-sm font-medium text-gray-900 truncate max-w-xs'>
                            {file.name}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeFile(index)}
                        className='text-gray-400 hover:text-red-500 transition-colors'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign to Classes Section */}
      {preSelectedClass ? (
        <div className='space-y-4'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='text-sm font-medium text-blue-900 mb-1'>
              Creating assignment for:
            </div>
            <div className='text-lg font-semibold text-blue-800'>
              {preSelectedClass.name}
            </div>
          </div>
        </div>
      ) : (
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
      )}
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
            {editAssignment ? 'Edit Assignment' : 'Create New Assignment'}
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
                {editAssignment ? 'Updating...' : 'Creating...'}
              </>
            ) : editAssignment ? (
              'Update Assignment'
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
