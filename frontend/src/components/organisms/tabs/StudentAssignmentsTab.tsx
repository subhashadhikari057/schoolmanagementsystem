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
  Upload,
  CheckCircle,
  Clock,
  FileText,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { studentService } from '@/api/services/student.service';
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
}

interface StudentAssignmentsTabProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export default function StudentAssignmentsTab({
  statusFilter,
  setStatusFilter,
}: StudentAssignmentsTabProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [assignments, setAssignments] =
    useState<StudentAssignment[]>(initialAssignments);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMySubmissionModalOpen, setViewMySubmissionModalOpen] =
    useState(false);

  // Fetch student info and assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // Get student profile to get classId
        const studentRes = await studentService.getStudentByUserId(user.id);
        const student = studentRes.data;
        if (!student?.classId) {
          setAssignments([]);
          setLoading(false);
          return;
        }
        // Get assignments for student's class
        const assignmentRes = await assignmentService.getAllAssignments({
          classId: student.classId,
        });
        // Map backend assignments to StudentAssignment type
        const mappedAssignments = (assignmentRes.data || []).map(a => {
          let status: 'active' | 'completed' | 'overdue' = 'active';

          // Check if assignment is completed (graded)
          if (
            a.submissions &&
            a.submissions.some(s => s.studentId === student.id && s.isCompleted)
          ) {
            status = 'completed';
          }
          // Check if assignment is overdue (due date has passed)
          else if (a.dueDate && new Date(a.dueDate) < new Date()) {
            status = 'overdue';
          }
          // Otherwise it's active
          return {
            id: a.id,
            title: a.title,
            class: `Grade ${a.class.grade} - Section ${a.class.section}`,
            subject: a.subject.name,
            dueDate: a.dueDate || '',
            status,
            priority: 'medium' as 'low' | 'medium' | 'high',
            submissions:
              a.submissions &&
              a.submissions.some(s => s.studentId === student.id)
                ? 1
                : 0,
            graded:
              a.submissions &&
              a.submissions.some(
                s => s.studentId === student.id && s.isCompleted,
              )
                ? 1
                : 0,
            totalStudents: a.class.students?.length || 0,
            description: a.description,
            attachments: a.attachments,
            originalAssignment: a,
          };
        });
        setAssignments(mappedAssignments);
      } catch (err) {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user, refreshTrigger]);

  // Handle view assignment
  const handleViewAssignment = (assignment: StudentAssignment) => {
    if (assignment.originalAssignment) {
      setSelectedAssignment(assignment.originalAssignment);
      setViewModalOpen(true);
    }
  };

  // Handle submit assignment
  const handleSubmitAssignment = (assignment: StudentAssignment) => {
    // Prevent submission if assignment is overdue
    if (assignment.status === 'overdue') {
      return;
    }

    if (assignment.originalAssignment) {
      setSelectedAssignment(assignment.originalAssignment);
      setSubmitModalOpen(true);
    }
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
        (statusFilter === 'pending' && assignment.status === 'active') ||
        (statusFilter === 'submitted' && assignment.submissions === 1) ||
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

  return (
    <div className='space-y-6'>
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
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'rejected', label: 'Rejected' },
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
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 group'
            >
              {/* Header with status */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  {getStatusIcon(assignment.status)}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}
                  >
                    {assignment.status}
                  </span>
                </div>
              </div>

              {/* Subject badge */}
              <div className='mb-4'>
                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                  {assignment.subject}
                </span>
              </div>

              {/* Title */}
              <h3 className='text-lg font-semibold text-gray-900 mb-3 line-clamp-2'>
                {assignment.title}
              </h3>

              {/* Class, Due Date, and Attachments */}
              <div className='space-y-2 mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Users className='w-4 h-4' />
                  <span>{assignment.class}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-4 h-4' />
                  <span
                    className={
                      assignment.status === 'overdue'
                        ? 'text-red-600 font-medium'
                        : ''
                    }
                  >
                    {formatDueDate(assignment.dueDate)}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Paperclip className='w-4 h-4' />
                  <span>
                    {getAttachmentCount(assignment)} attachment
                    {getAttachmentCount(assignment) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Progress indicators */}
              <div className='space-y-3 mb-6'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-600'>Submission</span>
                    <span
                      className={`font-medium ${assignment.submissions === 1 ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {assignment.submissions === 1
                        ? 'Submitted'
                        : 'Not Submitted'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${assignment.submissions === 1 ? 'bg-green-600' : 'bg-gray-400'}`}
                      style={{
                        width: assignment.submissions === 1 ? '100%' : '0%',
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span className='text-gray-600'>Graded</span>
                    <span
                      className={`font-medium ${assignment.graded === 1 ? 'text-blue-600' : 'text-gray-500'}`}
                    >
                      {assignment.graded === 1 ? 'Graded' : 'Not Graded'}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${assignment.graded === 1 ? 'bg-blue-600' : 'bg-gray-400'}`}
                      style={{ width: assignment.graded === 1 ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex gap-2'>
                <Button
                  onClick={() => handleViewAssignment(assignment)}
                  className='flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
                >
                  <Eye className='w-4 h-4' />
                  View
                </Button>

                {assignment.submissions === 1 && (
                  <Button
                    onClick={() => handleViewMySubmission(assignment)}
                    className='flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
                  >
                    <FileText className='w-4 h-4' />
                    My Submission
                  </Button>
                )}

                <Button
                  onClick={() => handleSubmitAssignment(assignment)}
                  disabled={assignment.status === 'overdue'}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                    assignment.status === 'overdue'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Upload className='w-4 h-4' />
                  {assignment.status === 'overdue'
                    ? 'Submission Closed'
                    : assignment.submissions === 1
                      ? 'Resubmit'
                      : 'Submit'}
                </Button>
              </div>

              {/* Overdue notice */}
              {assignment.status === 'overdue' && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='flex items-center gap-2 text-red-600 text-sm font-medium'>
                    <AlertCircle className='w-4 h-4' />
                    Assignment Overdue
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* View Assignment Modal */}
      {selectedAssignment && (
        <ViewAssignmentModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
        />
      )}

      {/* Submit Assignment Modal */}
      {selectedAssignment && (
        <SubmitAssignmentModal
          isOpen={submitModalOpen}
          onClose={() => {
            setSubmitModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      )}

      {/* View My Submission Modal */}
      {selectedAssignment && (
        <ViewMySubmissionModal
          isOpen={viewMySubmissionModalOpen}
          onClose={() => {
            setViewMySubmissionModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignmentId={selectedAssignment.id}
        />
      )}
    </div>
  );
}
