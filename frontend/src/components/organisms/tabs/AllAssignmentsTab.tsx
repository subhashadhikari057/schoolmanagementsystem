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
} from 'lucide-react';
import { assignmentService } from '@/api/services/assignment.service';
import { teacherService } from '@/api/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { AssignmentResponse } from '@/api/types/assignment';
import CreateAssignmentModal from '../modals/CreateAssignmentModal';
import ViewAssignmentModal from '../modals/ViewAssignmentModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { toast } from 'sonner';

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
      const teacherResponse = await teacherService.getCurrentTeacher();
      const teacherId = teacherResponse.data.id;

      const response =
        await assignmentService.getAssignmentsByTeacher(teacherId);
      const assignmentData = response.data;

      // Process assignments data
      const processedAssignments: ProcessedAssignment[] = assignmentData.map(
        (assignment: AssignmentResponse) => {
          const submissionCount = assignment._count?.submissions || 0;
          const gradedCount =
            assignment.submissions?.filter(sub => sub.isCompleted).length || 0;
          const totalStudents = assignment?.class?.students?.length || 0;

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
              ? new Date(assignment.dueDate).toLocaleDateString()
              : 'No due date',
            originalDueDate: assignment.dueDate || null, // Store original date for editing
            totalStudents,
            submissions: submissionCount,
            graded: gradedCount,
            status,
            priority,
            originalData: assignment,
          };
        },
      );

      setAssignments(processedAssignments);

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
      <div className='space-y-4'>
        {loading ? (
          <div className='flex items-center justify-center py-16 sm:py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-600 text-sm sm:text-base'>
                Loading assignments...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
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
          <div className='flex items-center justify-center py-12'>
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
              className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm'
            >
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4'>
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-2'>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${getStatusColor(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${getPriorityColor(
                        assignment.priority,
                      )}`}
                    >
                      {assignment.priority} priority
                    </span>
                    <span className='inline-block px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-gray-100 text-gray-700'>
                      {assignment.subject}
                    </span>
                  </div>

                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2'>
                    {assignment.title}
                  </h3>

                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600'>
                    <div className='flex items-center gap-1.5'>
                      <Users className='w-4 h-4 shrink-0' />
                      <span className='truncate'>{assignment.class}</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='w-4 h-4 shrink-0' />
                      <span>Due: {assignment.dueDate}</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Users className='w-4 h-4 shrink-0' />
                      <span>{assignment.totalStudents} students</span>
                    </div>
                  </div>
                </div>

                <div className='flex gap-1.5 sm:gap-2'>
                  <button
                    onClick={() => handleViewClick(assignment)}
                    className='p-2 sm:p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors'
                    title='View Details'
                    aria-label='View details'
                  >
                    <Eye className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleEditClick(assignment)}
                    className='p-2 sm:p-2.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors'
                    title='Edit Assignment'
                    aria-label='Edit assignment'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(assignment)}
                    className='p-2 sm:p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors'
                    title='Delete Assignment'
                    aria-label='Delete assignment'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>

              {/* Progress Bars */}
              <div className='space-y-3'>
                <div>
                  <div className='flex justify-between text-xs sm:text-sm mb-1'>
                    <span className='text-gray-600'>Submissions</span>
                    <span className='text-gray-900'>
                      {assignment.submissions}/{assignment.totalStudents} (
                      {pct(assignment.submissions, assignment.totalStudents)}
                      %)
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${pctRaw(
                          assignment.submissions,
                          assignment.totalStudents,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex justify-between text-xs sm:text-sm mb-1'>
                    <span className='text-gray-600'>Graded</span>
                    <span className='text-gray-900'>
                      {assignment.graded}/{assignment.submissions} (
                      {pct(assignment.graded, assignment.submissions)}%)
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${pctRaw(
                          assignment.graded,
                          assignment.submissions,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pending Review */}
              {assignment.status === 'active' &&
                assignment.submissions > assignment.graded && (
                  <div className='mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200'>
                    <span className='text-orange-600 text-xs sm:text-sm font-medium'>
                      {assignment.submissions - assignment.graded} pending
                      review
                    </span>
                  </div>
                )}
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
            editAssignment={selectedAssignment}
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
