'use client';

import React, { useMemo, useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import {
  Users,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { parentService } from '@/api/services/parent.service';
import { assignmentService } from '@/api/services/assignment.service';
import { submissionService } from '@/api/services/submission.service';
import ViewAssignmentModal from '../modals/ViewAssignmentModal';
import SubmitAssignmentModal from '../modals/SubmitAssignmentModal';
import { AssignmentResponse } from '@/api/types/assignment';
import { ViewMySubmissionModal } from '../modals/ViewMySubmissionModal';

// Backend assignments state
const initialAssignments: StudentAssignment[] = [];

interface StudentAssignment {
  id: string;
  title: string;
  class: string;
  subject: string;
  dueDate: string;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  submissions: number;
  graded: number;
  totalStudents: number;
  description?: string;
  attachments?: any[];
  originalAssignment?: AssignmentResponse;
  // Add submission info for parent view
  submissionStatus?: 'submitted' | 'not_submitted';
  submission?: any;
}

interface Child {
  id: string;
  name: string;
  classId: string;
  className: string;
  grade: string;
  section: string;
}

interface ParentAssignmentsTabProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

// Mock children data as fallback
const mockChildren = [
  {
    id: '1',
    name: 'John Doe',
    classId: 'class1',
    className: '10',
    grade: '10',
    section: 'A',
  },
  {
    id: '2',
    name: 'Jane Doe',
    classId: 'class2',
    className: '7',
    grade: '7',
    section: 'B',
  },
];

export default function ParentAssignmentsTab({
  statusFilter,
  setStatusFilter,
}: ParentAssignmentsTabProps) {
  // Add a try-catch to handle potential hook issues
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (error) {
    console.error('Error using useAuth hook:', error);
  }
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [assignments, setAssignments] =
    useState<StudentAssignment[]>(initialAssignments);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>(mockChildren);
  const [selectedChild, setSelectedChild] = useState<string>(
    mockChildren[0].id,
  );

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMySubmissionModalOpen, setViewMySubmissionModalOpen] =
    useState(false);

  // Fetch parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) {
        console.log('No user ID available, skipping children fetch');
        setLoading(false);
        return;
      }

      console.log('Current user:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      try {
        console.log('Fetching parent data for user:', user.id);

        // Use the new API to get children data
        const response = await parentService.getMyChildrenAssignments();
        console.log('Parent children response:', response);

        if (!response.success || !response.data) {
          console.log('No parent data found, using mock data');
          return;
        }

        const { children: allChildren } = response.data;
        console.log('Children data from API response:', allChildren);

        if (allChildren && allChildren.length > 0) {
          console.log('Raw children data from API response:', allChildren);

          const transformedChildren = allChildren.map((child: any) => {
            console.log('Processing child:', child);

            // Parse class name properly - expect format like "1-A" or "10-A"
            let grade = '';
            let section = '';

            if (child.className) {
              const parts = child.className.split('-');
              if (parts.length >= 2) {
                grade = parts[0];
                section = parts[1];
              } else {
                grade = child.className;
                section = '';
              }
            }

            return {
              id: child.id,
              name: child.fullName || 'Unknown',
              classId: child.classId || '',
              className: child.className || '',
              grade: grade,
              section: section,
            };
          });

          console.log('Transformed children:', transformedChildren);
          setChildren(transformedChildren);

          if (transformedChildren.length > 0) {
            const firstChildId = transformedChildren[0].id;
            console.log('Setting selected child to:', firstChildId);
            setSelectedChild(firstChildId);
          }
        } else {
          console.log('No children found in parent data, using mock data');
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        console.log('Using mock data due to error');
      }
    };

    fetchChildren();
  }, [user?.id]);

  // Fetch assignments for selected child
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedChild || selectedChild === '1' || selectedChild === '2') {
        console.log(
          'Skipping assignment fetch for mock child ID:',
          selectedChild,
        );
        setAssignments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching assignments for child ID:', selectedChild);

        // Use the new efficient API that gets assignments for the selected child only
        const response =
          await parentService.getMyChildrenAssignments(selectedChild);
        console.log('Parent assignments response:', response);

        if (!response.success || !response.data) {
          console.log('No assignments found');
          setAssignments([]);
          setLoading(false);
          return;
        }

        const { assignments: allAssignments } = response.data;

        // Since we're filtering by childId in the API, all assignments are for the selected child
        const childAssignments = allAssignments || [];

        console.log('Assignments for selected child:', childAssignments);

        if (childAssignments.length > 0) {
          // Map backend assignments to StudentAssignment type
          const mappedAssignments = childAssignments.map((assignment: any) => {
            // Since we filtered by childId, there should only be one childStatus
            const childStatus = assignment.childStatuses[0];

            let status: 'active' | 'completed' | 'overdue' = 'active';

            if (childStatus?.submissionStatus === 'submitted') {
              if (childStatus.submission?.isCompleted) {
                status = 'completed';
              } else {
                status = 'active';
              }
            } else if (
              assignment.dueDate &&
              new Date(assignment.dueDate) < new Date()
            ) {
              status = 'overdue';
            }

            return {
              id: assignment.id,
              title: assignment.title,
              class: `Grade ${assignment.class.grade} - Section ${assignment.class.section}`,
              subject: assignment.subject.name,
              dueDate: assignment.dueDate || '',
              status,
              priority: 'medium' as 'low' | 'medium' | 'high',
              // Remove confusing submission counts - just show individual status
              submissions: 0, // Not needed for parent view
              graded: 0, // Not needed for parent view
              totalStudents: 0, // Not needed for parent view
              description: assignment.description,
              attachments: assignment.attachments,
              originalAssignment: assignment,
              // Add submission info for the modal
              submissionStatus:
                childStatus?.submissionStatus || 'not_submitted',
              submission: childStatus?.submission || null,
            };
          });
          setAssignments(mappedAssignments);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedChild, children, refreshTrigger]);

  // Handle view assignment
  const handleViewAssignment = (assignment: StudentAssignment) => {
    if (assignment.originalAssignment) {
      setSelectedAssignment(assignment.originalAssignment);
      setViewModalOpen(true);
    }
  };

  // Handle submit assignment (disabled for parents)
  const handleSubmitAssignment = (assignment: StudentAssignment) => {
    // This is disabled for parents - they can't submit assignments
    console.log('Submit assignment disabled for parents');
  };

  const handleViewMySubmission = (assignment: StudentAssignment) => {
    if (assignment.originalAssignment) {
      setSelectedAssignment(assignment.originalAssignment);
      setViewMySubmissionModalOpen(true);
    }
  };

  // Handle submission success
  const handleSubmissionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Extract unique subjects for filter
  const subjects = useMemo(() => {
    return [...new Set(assignments.map(a => a.subject))];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesQuery =
        assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.class.toLowerCase().includes(query.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' &&
          assignment.submissionStatus === 'not_submitted') ||
        (statusFilter === 'submitted' &&
          assignment.submissionStatus === 'submitted') ||
        (statusFilter === 'overdue' && assignment.status === 'overdue');

      const matchesSubject =
        subjectFilter === 'all' || assignment.subject === subjectFilter;

      return matchesQuery && matchesStatus && matchesSubject;
    });
  }, [query, statusFilter, subjectFilter, assignments]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className='w-4 h-4' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'overdue':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const getAttachmentCount = (assignment: StudentAssignment) => {
    return assignment.attachments?.length || 0;
  };

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <div className='text-gray-500'>Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Child Selection */}
      <div className='flex items-center gap-4 mb-6'>
        <div className='text-sm text-gray-600'>Viewing assignments for:</div>
        <Dropdown
          options={children.map((c: Child) => ({
            label: `${c.name} (Class ${c.grade}${c.section ? `-${c.section}` : ''})`,
            value: c.id,
          }))}
          selectedValue={selectedChild}
          onSelect={setSelectedChild}
          className='min-w-[200px] rounded-lg px-4 py-2'
          title='Select Child'
          type='filter'
        />
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-row gap-3 items-center w-full'>
          <div className='flex-1'>
            <LabeledInputField
              label=''
              placeholder='Search assignments...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full hidden sm:block'
            />
          </div>
          <Dropdown
            type='filter'
            title='Filter Status'
            options={[
              { value: 'all', label: 'All Assignments' },
              { value: 'pending', label: 'Not Submitted' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            className='max-w-xs'
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
            className='max-w-xs'
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {filteredAssignments.length === 0 ? (
          <div className='col-span-full flex items-center justify-center py-12'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                No assignments match your current filters.
              </p>
            </div>
          </div>
        ) : (
          filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow'
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-1 line-clamp-2'>
                    {assignment.title}
                  </h3>
                  <p className='text-sm text-gray-600 mb-2'>
                    {assignment.subject} • {assignment.class}
                  </p>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(assignment.status)}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status === 'active' && 'Active'}
                      {assignment.status === 'completed' && 'Completed'}
                      {assignment.status === 'overdue' && 'Overdue'}
                    </span>
                  </div>
                </div>
                {getAttachmentCount(assignment) > 0 && (
                  <div className='flex items-center gap-1 text-gray-500'>
                    <Paperclip className='w-4 h-4' />
                    <span className='text-sm'>
                      {getAttachmentCount(assignment)}
                    </span>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className='mb-4'>
                <p className='text-sm text-gray-600'>
                  <Calendar className='w-4 h-4 inline mr-1' />
                  {formatDueDate(assignment.dueDate)}
                </p>
              </div>

              {/* Submission Status - Clean and Simple */}
              <div className='mb-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600'>Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      assignment.submissionStatus === 'submitted'
                        ? assignment.submission?.isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {assignment.submissionStatus === 'submitted'
                      ? assignment.submission?.isCompleted
                        ? 'Submitted & Completed'
                        : 'Submitted'
                      : 'Not Submitted'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className='flex gap-2'>
                <Button
                  onClick={() => handleViewAssignment(assignment)}
                  className='flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-3 rounded-xl text-sm transition-colors duration-200 flex items-center justify-center'
                >
                  <Eye className='w-4 h-4 mr-2' />
                  View
                </Button>

                {/* View submission button - only show if child has submitted */}
                {assignment.submissionStatus === 'submitted' && (
                  <Button
                    onClick={() => handleViewMySubmission(assignment)}
                    className='flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-3 rounded-xl text-sm transition-colors duration-200 flex items-center justify-center'
                  >
                    <FileText className='w-4 h-4 mr-2' />
                    View Submission
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedAssignment && (
        <ViewAssignmentModal
          assignment={selectedAssignment}
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          userRole='parent'
        />
      )}

      {/* View My Submission Modal */}
      {selectedAssignment && (
        <ViewMySubmissionModal
          isOpen={viewMySubmissionModalOpen}
          onClose={() => setViewMySubmissionModalOpen(false)}
          assignmentId={selectedAssignment.id}
          childId={selectedChild}
        />
      )}
    </div>
  );
}
