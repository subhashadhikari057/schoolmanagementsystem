'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import {
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  Edit2,
  Eye,
  Trash2,
  Paperclip,
  FileText,
} from 'lucide-react';
import { assignmentService } from '@/api/services/assignment.service';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { AssignmentResponse } from '@/api/types/assignment';
import CreateAssignmentModal from '../modals/CreateAssignmentModal';
import ViewAssignmentModal from '../modals/ViewAssignmentModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProcessedAssignment {
  id: string;
  title: string;
  class: string;
  subject: string;
  dueDate: string; // Display string
  originalDueDate: string | null; // Original date for editing
  totalStudents: number;
  submissions: number;
  graded: number;
  attachments: number;
  attachmentDetails?: Array<{
    id: string;
    filename: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  originalData: AssignmentResponse;
}

interface AllAssignmentsTabProps {
  refreshTrigger?: number;
  statusFilter: string;
}

export default function AllAssignmentsTab({
  refreshTrigger,
}: AllAssignmentsTabProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'incomplete' | 'completed'
  >('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // API data state
  const [assignments, setAssignments] = useState<ProcessedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<ProcessedAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

  const loadAssignments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get the teacher record to get teacher ID
      let teacherResponse;
      try {
        teacherResponse = await teacherService.getCurrentTeacher();
      } catch (teacherError) {
        console.error('Failed to get teacher data:', teacherError);
        setError(
          'Failed to load teacher information. Please check your authentication.',
        );
        setLoading(false);
        return;
      }

      const teacherId = teacherResponse.data.id;

      let response;
      try {
        response = await assignmentService.getAssignmentsByTeacher(teacherId);
      } catch (assignmentError) {
        console.error('Failed to get assignments:', assignmentError);
        setError(
          'Failed to load assignments. Please check your connection and try again.',
        );
        setLoading(false);
        return;
      }

      const assignmentData = response.data;

      // Debug: Log raw assignment data (commented out for production)
      // console.log('Raw assignment data:', assignmentData.map(a => ({
      //   id: a.id,
      //   title: a.title,
      //   class: a.class,
      //   classId: a.class?.id,
      //   hasClass: !!a.class,
      //   hasStudents: !!a.class?.students?.length,
      //   studentCount: a.class?.students?.length || 0,
      //   students: a.class?.students
      // })));

      // Process assignments data
      const processedAssignments: ProcessedAssignment[] = assignmentData.map(
        (assignment: AssignmentResponse) => {
          const submissionCount = assignment._count?.submissions || 0;
          const gradedCount =
            assignment.submissions?.filter(sub => sub.isCompleted).length || 0;

          // Try to get student count from multiple sources
          let totalStudents = 0;
          if (assignment?.class?.students?.length) {
            totalStudents = assignment.class.students.length;
          } else {
            // Fallback: we'll need to fetch class details separately
            totalStudents = 0; // Will be updated if we can fetch class details
          }

          // Get attachment count and details
          const attachmentCount = assignment.attachments?.length || 0;
          const attachmentDetails =
            assignment.attachments?.map(attachment => ({
              id: attachment.id,
              filename: attachment.filename,
              originalName: attachment.originalName,
              url: attachment.url,
              mimeType: attachment.mimeType,
              size: attachment.size,
            })) || [];

          // Determine status
          let status: 'active' | 'completed' | 'overdue' = 'active';
          if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
            status = 'overdue';
          } else if (
            submissionCount === totalStudents &&
            gradedCount === submissionCount &&
            totalStudents > 0
          ) {
            status = 'completed';
          }

          // Get priority from metadata
          const priority =
            ((assignment.additionalMetadata as Record<string, unknown>)
              ?.priority as 'low' | 'medium' | 'high') || 'medium';

          return {
            id: assignment.id,
            title: assignment.title,
            class: `Grade ${assignment.class.grade} - Section ${assignment.class.section}`,
            subject: assignment.subject.name,
            dueDate: assignment.dueDate
              ? (() => {
                  const dueDate = new Date(assignment.dueDate);
                  const now = new Date();
                  const daysDiff = Math.ceil(
                    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                  );

                  const dateString = dueDate.toLocaleDateString();

                  if (daysDiff < 0) {
                    return `${dateString} (Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''})`;
                  } else if (daysDiff === 0) {
                    return `${dateString} (Due Today)`;
                  } else if (daysDiff === 1) {
                    return `${dateString} (Due Tomorrow)`;
                  } else {
                    return `${dateString} (Due in ${daysDiff} days)`;
                  }
                })()
              : 'No due date',
            originalDueDate: assignment.dueDate || null, // Store original date for editing
            totalStudents,
            submissions: submissionCount,
            graded: gradedCount,
            attachments: attachmentCount,
            attachmentDetails,
            status,
            priority,
            originalData: assignment,
          };
        },
      );

      // Note: We already have student data from the backend, so we don't need to fetch class details separately
      // The backend's findAll method includes students in the class data

      // Sort assignments by creation date (most recent first)
      const sortedAssignments = processedAssignments.sort((a, b) => {
        const dateA = new Date(a.originalData.createdAt || 0);
        const dateB = new Date(b.originalData.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setAssignments(sortedAssignments);

      // Debug: Log assignment data to understand student count issues (commented out for production)
      // console.log('Processed assignments:', processedAssignments.map(a => ({
      //   id: a.id,
      //   title: a.title,
      //   class: a.class,
      //   classId: a.originalData.class?.id,
      //   totalStudents: a.totalStudents,
      //   hasStudentsInClass: !!a.originalData.class?.students?.length,
      //   studentCount: a.originalData.class?.students?.length || 0,
      //   students: a.originalData.class?.students
      // })));

      // Extract unique subjects and classes for filters
      const uniqueSubjects = [
        ...new Set(processedAssignments.map(a => a.subject)),
      ];
      const uniqueClasses = [
        ...new Set(processedAssignments.map(a => a.class)),
      ];
      setSubjects(uniqueSubjects);
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load assignments data
  useEffect(() => {
    loadAssignments();
  }, [loadAssignments, refreshTrigger, internalRefreshTrigger]);

  // Modal handlers
  const handleViewClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteModalOpen(true);
  };

  const handleViewSubmissions = (assignment: ProcessedAssignment) => {
    router.push(
      `/dashboard/teacher/academics/assignments/${assignment.id}/submissions`,
    );
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedAssignment(null);
    setInternalRefreshTrigger(prev => prev + 1);
    toast.success('Assignment updated successfully');
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    try {
      setIsDeleting(true);
      await assignmentService.deleteAssignment(selectedAssignment.id);

      setSelectedAssignment(null);
      setIsDeleteModalOpen(false);
      setInternalRefreshTrigger(prev => prev + 1);

      toast.success('Assignment deleted successfully');
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete assignment',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesQuery =
        query === '' ||
        assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.class.toLowerCase().includes(query.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && assignment.status === 'completed') ||
        (statusFilter === 'incomplete' && assignment.status !== 'completed');

      const matchesSubject =
        subjectFilter === 'all' || assignment.subject === subjectFilter;

      const matchesClass =
        classFilter === 'all' || assignment.class === classFilter;

      return matchesQuery && matchesStatus && matchesSubject && matchesClass;
    });
  }, [assignments, query, statusFilter, subjectFilter, classFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-orange-100 text-orange-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Helpers for safe percentages
  const pct = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 100) : 0;
  const pctRaw = (num: number, den: number) =>
    den > 0 ? (num / den) * 100 : 0;

  return (
    <div className='space-y-6 px-3 sm:px-0'>
      {/* Search and Filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            label=''
            placeholder='Search by title, class, or subject...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full'
          />
        </div>

        {/* Filters: stack on mobile, inline on larger screens */}
        <div className='grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto'>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'incomplete', label: 'Incomplete' },
            ]}
            selectedValue={statusFilter}
            onSelect={value =>
              setStatusFilter(value as 'all' | 'incomplete' | 'completed')
            }
            className='w-full'
          />
          <Dropdown
            type='filter'
            title='Filter Subject'
            options={[
              { value: 'all', label: 'All Subjects' },
              ...subjects.map(subject => ({
                value: subject,
                label: subject,
              })),
            ]}
            selectedValue={subjectFilter}
            onSelect={value => setSubjectFilter(value)}
            className='w-full'
          />
          <Dropdown
            type='filter'
            title='Filter Class'
            options={[
              { value: 'all', label: 'All Classes' },
              ...classes.map(cls => ({
                value: cls,
                label: cls,
              })),
            ]}
            selectedValue={classFilter}
            onSelect={value => setClassFilter(value)}
            className='w-full sm:max-w-xs'
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {loading ? (
          <div className='col-span-full flex items-center justify-center py-16 sm:py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600 text-sm sm:text-base'>
                Loading assignments...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className='col-span-full flex items-center justify-center py-12'>
            <div className='text-center max-w-md px-4'>
              <AlertCircle className='h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 mb-4 text-sm sm:text-base'>{error}</p>
              <Button
                onClick={loadAssignments}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2'
              >
                <RefreshCw className='w-4 h-4' />
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className='col-span-full flex items-center justify-center py-12'>
            <div className='text-center px-4'>
              <Calendar className='h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600 text-sm sm:text-base'>
                {assignments.length === 0
                  ? 'No assignments found. Create your first assignment to get started!'
                  : 'No assignments match your current filters.'}
              </p>
            </div>
          </div>
        ) : (
          filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className='bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow h-[280px] flex flex-col'
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        assignment.status,
                      )}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          assignment.status === 'active'
                            ? 'bg-blue-500'
                            : assignment.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                        }`}
                      />
                      {assignment.status === 'active'
                        ? 'Active'
                        : assignment.status === 'completed'
                          ? 'Completed'
                          : 'Overdue'}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {assignment.subject}
                    </span>
                  </div>

                  <h3
                    className='text-base font-semibold text-gray-900 mb-2 overflow-hidden text-ellipsis min-h-[3rem]'
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {assignment.title}
                  </h3>

                  <div className='flex items-center gap-4 text-sm text-gray-600'>
                    <div className='flex items-center gap-1.5'>
                      <Users className='w-4 h-4' />
                      <span>{assignment.class}</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='w-4 h-4' />
                      <span
                        className={
                          assignment.status === 'overdue'
                            ? 'text-red-600 font-medium'
                            : ''
                        }
                      >
                        {assignment.dueDate}
                      </span>
                    </div>
                    {assignment.attachments > 0 && (
                      <div className='flex items-center gap-1.5'>
                        <Paperclip className='w-4 h-4' />
                        <span>{assignment.attachments}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex gap-1'>
                  <button
                    onClick={() => handleViewClick(assignment)}
                    className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
                    title='View Details'
                  >
                    <Eye className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleEditClick(assignment)}
                    className='p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors'
                    title='Edit Assignment'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(assignment)}
                    className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                    title='Delete Assignment'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>

              {/* Spacer to push content to bottom */}
              <div className='flex-grow'></div>

              {/* Progress Summary */}
              <div className='mt-4 pt-4 border-t border-gray-100'>
                <div className='flex items-center justify-between text-sm mb-4'>
                  <div className='flex items-center gap-4'>
                    <span className='text-gray-600'>
                      <span className='font-medium text-blue-600'>
                        {assignment.submissions}
                      </span>
                      /{assignment.totalStudents} submitted
                    </span>
                    {assignment.submissions > 0 && (
                      <span className='text-gray-600'>
                        <span className='font-medium text-green-600'>
                          {assignment.graded}
                        </span>
                        /{assignment.submissions} graded
                      </span>
                    )}
                  </div>
                  {assignment.submissions > assignment.graded &&
                    assignment.submissions > 0 && (
                      <span className='text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full'>
                        {assignment.submissions - assignment.graded} pending
                      </span>
                    )}
                </div>

                {/* View Submissions Button */}
                <button
                  onClick={() => handleViewSubmissions(assignment)}
                  className='w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2'
                >
                  <FileText className='w-4 h-4' />
                  View Submissions
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedAssignment && (
        <>
          <ViewAssignmentModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedAssignment(null);
            }}
            assignment={selectedAssignment.originalData}
          />

          <CreateAssignmentModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedAssignment(null);
            }}
            onSuccess={handleEditSuccess}
            editAssignment={selectedAssignment.originalData}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              if (!isDeleting) {
                setSelectedAssignment(null);
              }
            }}
            onConfirm={handleDelete}
            title='Delete Assignment'
            message={`Are you sure you want to delete "${selectedAssignment.title}"? This action cannot be undone.`}
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
}
