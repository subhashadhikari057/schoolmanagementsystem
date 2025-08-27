import React, { useState, useEffect } from 'react';
import { X, Upload, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { complaintService } from '@/api/services/complaint.service';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';

interface TeacherComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (complaintData: any, attachments: File[]) => Promise<void>;
}

const TeacherComplaintModal: React.FC<TeacherComplaintModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ADMINISTRATIVE',
    priority: 'MEDIUM',
    recipientType: 'ADMINISTRATION',
    recipientId: '',
    studentId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const { user } = useAuth();

  const complaintTypes = [
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'BEHAVIORAL', label: 'Behavioral' },
    { value: 'FACILITY', label: 'Facility' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'ADMINISTRATIVE', label: 'Administrative' },
    { value: 'OTHER', label: 'Other' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  const recipientTypes = [
    { value: 'ADMINISTRATION', label: 'Administration/Office' },
    { value: 'PARENT', label: 'Parent' },
  ];

  // Load students when modal opens
  useEffect(() => {
    if (open && user?.id) {
      loadStudentsForClassTeacher();
    }
  }, [open, user?.id]);

  const loadStudentsForClassTeacher = async () => {
    if (!user?.id) return;

    setLoadingStudents(true);
    try {
      // Get the current teacher record to get the teacher ID
      const teacherResponse = await teacherService.getCurrentTeacher();
      if (teacherResponse.success && teacherResponse.data) {
        const teacherId = teacherResponse.data.id;

        // Get students for this teacher where they are the class teacher
        const studentsResponse =
          await teacherService.getStudentsForClassTeacher(teacherId);
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        } else {
          console.error('Failed to load students:', studentsResponse);
          toast.error('Failed to load students');
        }
      } else {
        console.error('Failed to get teacher info:', teacherResponse);
        toast.error('Failed to get teacher information');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.recipientType === 'PARENT' && !formData.studentId) {
      newErrors.studentId =
        'Please select a student when complaining to a parent';
    }

    if (
      formData.recipientType === 'PARENT' &&
      formData.studentId &&
      selectedStudent
    ) {
      if (!selectedStudent.parents || selectedStudent.parents.length === 0) {
        newErrors.studentId =
          'Selected student has no parents linked. Cannot create complaint to parent.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean the data before submitting - convert empty strings to undefined
      const cleanData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        recipientType: formData.recipientType,
        recipientId:
          formData.recipientType === 'PARENT' &&
          selectedStudent?.parents?.[0]?.parent?.user?.id
            ? selectedStudent.parents[0].parent.user.id
            : undefined,
      };

      await onSubmit(cleanData, attachments);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'ADMINISTRATIVE',
        priority: 'MEDIUM',
        recipientType: 'ADMINISTRATION',
        recipientId: '',
        studentId: '',
      });
      setAttachments([]);
      setSelectedStudent(null);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating complaint:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file: File) => {
      const validation = complaintService.validateFile(file);
      if (!validation.isValid) {
        toast.error(`File "${file.name}": ${validation.error}`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        type: 'ADMINISTRATIVE',
        priority: 'MEDIUM',
        recipientType: 'ADMINISTRATION',
        recipientId: '',
        studentId: '',
      });
      setAttachments([]);
      setSelectedStudent(null);
      setErrors({});
      onClose();
    }
  };

  return open ? (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl'>
        {/* Header */}
        <div className='bg-gradient-to-r from-orange-50 to-red-100 p-6 border-b border-orange-200'>
          <div className='flex justify-between items-start'>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>
                Create New Complaint
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                Report administrative issues or parent/student concerns
              </p>
              <p className='text-xs text-orange-700 mt-2 bg-orange-200 px-2 py-1 rounded'>
                <strong>Note:</strong> When complaining to parents, you can only
                select students from your class where you are the class teacher.
                This ensures proper communication channels and accountability.
              </p>
            </div>
            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md'
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Title */}
            <div>
              <label className='block mb-2 font-medium'>
                Complaint Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder='Enter complaint title...'
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className='block mb-2 font-medium'>
                Description <span className='text-red-500'>*</span>
              </label>
              <textarea
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={4}
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder='Describe the issue in detail...'
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Complaint Type */}
            <div>
              <label className='block mb-2 font-medium'>Complaint Type</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({ ...prev, type: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {complaintTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className='block mb-2 font-medium'>Priority</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.priority}
                onChange={e =>
                  setFormData(prev => ({ ...prev, priority: e.target.value }))
                }
                disabled={isSubmitting}
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Type */}
            <div>
              <label className='block mb-2 font-medium'>Recipient</label>
              <select
                className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                value={formData.recipientType}
                onChange={e => {
                  const newRecipientType = e.target.value;
                  // If trying to select parent but no students available, switch to administration
                  if (newRecipientType === 'PARENT' && students.length === 0) {
                    toast.error(
                      'Cannot select parent recipient - no students available in your class',
                    );
                    return;
                  }
                  setFormData(prev => ({
                    ...prev,
                    recipientType: newRecipientType,
                  }));
                }}
                disabled={isSubmitting}
              >
                {recipientTypes.map(recipient => (
                  <option
                    key={recipient.value}
                    value={recipient.value}
                    disabled={
                      recipient.value === 'PARENT' && students.length === 0
                    }
                  >
                    {recipient.value === 'PARENT' && students.length === 0
                      ? `${recipient.label} (No students available)`
                      : recipient.label}
                  </option>
                ))}
              </select>
              {formData.recipientType === 'PARENT' && (
                <p className='text-xs text-blue-600 mt-1'>
                  <strong>Note:</strong> You can only complain to parents of
                  students in your class where you are the class teacher. This
                  restriction ensures proper communication channels and
                  accountability.
                </p>
              )}
            </div>

            {/* Parent Selection - Only show when parent is selected */}
            {formData.recipientType === 'PARENT' && (
              <div>
                <div className='mb-2'>
                  <label className='block font-medium'>
                    Select Student <span className='text-red-500'>*</span>
                  </label>
                  <p className='text-xs text-gray-600 mt-1'>
                    You can only complain to parents of students in your class
                    where you are the class teacher. This ensures proper
                    communication channels and accountability.
                  </p>
                </div>
                <select
                  className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 ${
                    errors.studentId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  value={formData.studentId}
                  onChange={e => {
                    const studentId = e.target.value;
                    setFormData(prev => ({ ...prev, studentId }));
                    // Find the selected student to get parent info
                    const student = students.find(s => s.id === studentId);
                    setSelectedStudent(student);
                  }}
                  disabled={isSubmitting || loadingStudents}
                >
                  <option value=''>Select a student...</option>
                  {loadingStudents ? (
                    <option value='' disabled>
                      Loading students...
                    </option>
                  ) : students.length === 0 ? (
                    <option value='' disabled>
                      No students found in your class where you are the class
                      teacher
                    </option>
                  ) : (
                    students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.user.fullName} - {student.className} (Roll:{' '}
                        {student.rollNumber})
                      </option>
                    ))
                  )}
                </select>
                {errors.studentId && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.studentId}
                  </p>
                )}
                {students.length === 0 && !loadingStudents && (
                  <p className='text-sm text-orange-600 mt-2'>
                    <strong>Note:</strong> You don't have any students assigned
                    to your class where you are the class teacher. You can only
                    create complaints to administration or contact an
                    administrator to assign you as a class teacher.
                  </p>
                )}
                {selectedStudent && (
                  <div className='text-sm text-gray-600 mt-1'>
                    <p>
                      <strong>Student:</strong> {selectedStudent.user.fullName}
                    </p>
                    <p>
                      <strong>Class:</strong> {selectedStudent.className}
                    </p>
                    <p>
                      <strong>Roll Number:</strong> {selectedStudent.rollNumber}
                    </p>
                    {selectedStudent.parents &&
                    selectedStudent.parents.length > 0 ? (
                      <div className='mt-2'>
                        <p>
                          <strong>Parents:</strong>
                        </p>
                        {selectedStudent.parents.map(
                          (parentLink: any, index: number) => (
                            <div key={index} className='ml-2 text-xs'>
                              • {parentLink.parent.user.fullName} (
                              {parentLink.parent.user.email})
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className='text-orange-600'>
                        No parents linked to this student
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* File Attachments */}
            <div>
              <label className='block mb-2 font-medium'>
                Attachments (Optional)
              </label>
              <div className='space-y-3'>
                {/* File Upload */}
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400'>
                  <input
                    type='file'
                    multiple
                    onChange={handleFileChange}
                    className='hidden'
                    id='file-upload'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'
                  />
                  <label htmlFor='file-upload' className='cursor-pointer'>
                    <div className='flex flex-col items-center'>
                      <Upload className='h-8 w-8 text-gray-400 mb-2' />
                      <p className='text-sm text-gray-600'>
                        <span className='text-blue-600 font-medium'>
                          Click to upload files
                        </span>{' '}
                        (Max 5 files, 10MB each)
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        Supported: Images, PDF, DOC, DOCX
                      </p>
                    </div>
                  </label>
                </div>

                {/* File List */}
                {attachments.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-gray-700'>
                      Selected Files:
                    </p>
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between bg-gray-50 p-3 rounded-lg'
                      >
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-gray-500' />
                          <span className='text-sm text-gray-700'>
                            {file.name}
                          </span>
                          <span className='text-xs text-gray-500'>
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeAttachment(index)}
                          className='text-red-500 hover:text-red-700 p-1'
                        >
                          <XCircle className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                onClick={handleClose}
                className='bg-white text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.description.trim()
                }
              >
                {isSubmitting ? 'Creating...' : 'Create Complaint'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null;
};

export default TeacherComplaintModal;
