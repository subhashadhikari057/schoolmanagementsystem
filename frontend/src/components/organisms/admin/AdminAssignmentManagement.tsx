'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import CreateAssignmentModal from '../modals/CreateAssignmentModal';
import { assignmentService } from '@/api/services/assignment.service';
import { AssignmentResponse } from '@/api/types/assignment';
import Button from '@/components/atoms/form-controls/Button';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { toast } from 'sonner';
import ViewAssignmentModal from '../modals/ViewAssignmentModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

interface ProcessedAssignment {
  id: string;
  title: string;
  description?: string;
  class: string;
  subject: string;
  teacher: string;
  dueDate: string;
  totalStudents: number;
  submissions: number;
  status: 'active' | 'overdue' | 'completed';
  createdAt: string;
  // Store original IDs for editing
  classId: string;
  subjectId: string;
  teacherId: string;
  originalData: AssignmentResponse;
}

export default function AdminAssignmentManagement() {
  const [assignments, setAssignments] = useState<ProcessedAssignment[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<ProcessedAssignment | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'overdue' | 'completed'
  >('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Stats data
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    overdue: 0,
    completed: 0,
    totalSubmissions: 0,
  });

  const loadAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await assignmentService.getAllAssignments();
      const assignmentData = response.data;

      // Process assignments data
      const processedAssignments: ProcessedAssignment[] = assignmentData.map(
        (assignment: AssignmentResponse) => {
          const dueDate = assignment.dueDate
            ? new Date(assignment.dueDate)
            : null;
          const now = new Date();

          let status: 'active' | 'overdue' | 'completed' = 'active';
          if (dueDate && dueDate < now) {
            status = 'overdue';
          }

          return {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            class: `${assignment.class.grade} - ${assignment.class.section}`,
            subject: assignment.subject.name,
            teacher: assignment.teacher?.user?.fullName || 'Unassigned',
            dueDate: dueDate ? dueDate.toLocaleDateString() : 'No due date',
            totalStudents: assignment.class.students?.length || 0,
            submissions: assignment._count?.submissions || 0,
            status,
            createdAt: new Date(assignment.createdAt).toLocaleDateString(),
            // Store original IDs for editing (from the raw assignment object)
            classId: (assignment as any).classId || assignment.class.id,
            subjectId: (assignment as any).subjectId || '',
            teacherId: (assignment as any).teacherId || '',
            originalData: assignment,
          };
        },
      );

      setAssignments(processedAssignments);

      // Update stats
      setStats({
        total: processedAssignments.length,
        active: processedAssignments.filter(a => a.status === 'active').length,
        overdue: processedAssignments.filter(a => a.status === 'overdue')
          .length,
        completed: processedAssignments.filter(a => a.status === 'completed')
          .length,
        totalSubmissions: processedAssignments.reduce(
          (sum, a) => sum + a.submissions,
          0,
        ),
      });
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments, refreshTrigger]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success('Assignment created successfully');
  };

  const handleEditClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsCreateModalOpen(true);
  };

  const handleViewClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (assignment: ProcessedAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    try {
      setIsDeleting(true);
      await assignmentService.deleteAssignment(selectedAssignment.id);

      // Clear selected assignment
      setSelectedAssignment(null);
      setIsDeleteModalOpen(false);

      // Refresh the list
      setRefreshTrigger(prev => prev + 1);

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

  // Extract unique classes and subjects for filter options
  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(assignments.map(a => a.class))];
    return classes.sort();
  }, [assignments]);

  const uniqueSubjects = useMemo(() => {
    const subjects = [...new Set(assignments.map(a => a.subject))];
    return subjects.sort();
  }, [assignments]);

  // Filter assignments based on search and filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch =
        searchQuery === '' ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.teacher.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || assignment.status === statusFilter;
      const matchesClass =
        classFilter === 'all' || assignment.class === classFilter;
      const matchesSubject =
        subjectFilter === 'all' || assignment.subject === subjectFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesSubject;
    });
  }, [assignments, searchQuery, statusFilter, classFilter, subjectFilter]);

  const statsData = [
    {
      label: 'Total Assignments',
      value: stats.total.toString(),
      icon: BookOpen,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      change: '',
      isPositive: true,
    },
    {
      label: 'Active',
      value: stats.active.toString(),
      icon: Clock,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      change: '',
      isPositive: true,
    },
    {
      label: 'Overdue',
      value: stats.overdue.toString(),
      icon: Clock,
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
      change: '',
      isPositive: true,
    },
    {
      label: 'Total Submissions',
      value: stats.totalSubmissions.toString(),
      icon: CheckCircle,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      change: '',
      isPositive: true,
    },
  ];

  const AllAssignmentsContent = () => (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Assignment
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Class
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Subject
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Teacher
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Due Date
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} className='px-6 py-8 text-center'>
                  <div className='text-gray-500'>
                    {assignments.length === 0 ? (
                      <div>
                        <BookOpen className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                        <p>
                          No assignments found. Create your first assignment to
                          get started!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>No assignments match your current filters.</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setClassFilter('all');
                            setSubjectFilter('all');
                          }}
                          className='mt-2 text-blue-600 hover:text-blue-800'
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssignments.map(assignment => (
                <tr key={assignment.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {assignment.title}
                      </div>
                      {assignment.description && (
                        <div className='text-sm text-gray-500 truncate max-w-xs'>
                          {assignment.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {assignment.class}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {assignment.subject}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {assignment.teacher}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {assignment.dueDate}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                    ${
                      assignment.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    <div className='flex items-center space-x-3'>
                      <button
                        onClick={() => handleViewClick(assignment)}
                        className='text-blue-600 hover:text-blue-800'
                      >
                        <Eye className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleEditClick(assignment)}
                        className='text-yellow-600 hover:text-yellow-800'
                      >
                        <Edit2 className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(assignment)}
                        className='text-red-600 hover:text-red-800'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Assignment Management
          </h1>
          <p className='text-gray-600'>
            Manage all assignments across all classes
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedAssignment(null);
            setIsCreateModalOpen(true);
          }}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          Create Assignment
        </Button>
      </div>

      {/* Stats Grid */}
      <Statsgrid stats={statsData} />

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className='bg-white p-4 rounded-lg border border-gray-200'>
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='flex-1'>
            <LabeledInputField
              label=''
              placeholder='Search by title, class, subject, or teacher name...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full'
            />
          </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Dropdown
              type='filter'
              title='Status'
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'completed', label: 'Completed' },
              ]}
              selectedValue={statusFilter}
              onSelect={value => setStatusFilter(value as typeof statusFilter)}
              className='min-w-[140px]'
            />
            <Dropdown
              type='filter'
              title='Class'
              options={[
                { value: 'all', label: 'All Classes' },
                ...uniqueClasses.map(cls => ({ value: cls, label: cls })),
              ]}
              selectedValue={classFilter}
              onSelect={setClassFilter}
              className='min-w-[140px]'
            />
            <Dropdown
              type='filter'
              title='Subject'
              options={[
                { value: 'all', label: 'All Subjects' },
                ...uniqueSubjects.map(subj => ({ value: subj, label: subj })),
              ]}
              selectedValue={subjectFilter}
              onSelect={setSubjectFilter}
              className='min-w-[140px]'
            />
          </div>
        </div>
        {(searchQuery ||
          statusFilter !== 'all' ||
          classFilter !== 'all' ||
          subjectFilter !== 'all') && (
          <div className='mt-3 flex items-center justify-between'>
            <p className='text-sm text-gray-600'>
              Showing {filteredAssignments.length} of {assignments.length}{' '}
              assignments
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setClassFilter('all');
                setSubjectFilter('all');
              }}
              className='text-sm text-blue-600 hover:text-blue-800'
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Assignment Table (no tabs) */}
      <AllAssignmentsContent />

      {/* Modals */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSuccess={handleCreateSuccess}
        editAssignment={selectedAssignment}
      />

      {selectedAssignment && (
        <ViewAssignmentModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment.originalData}
          userRole='admin'
        />
      )}

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
        message={`Are you sure you want to delete "${selectedAssignment?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
