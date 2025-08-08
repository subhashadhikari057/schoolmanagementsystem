'use client';

import React, { useState, useEffect } from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Subject,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  UserCheck,
  AlertCircle,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { subjectService } from '@/api/services';
import { SubjectResponse } from '@/api/types/subject';
import SubjectDetailModal from '@/components/organisms/modals/SubjectDetailModal';
import AddSubjectFormModal from '@/components/organisms/modals/AddSubjectFormModal';
import { toast } from 'sonner';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedSubject, setSelectedSubject] =
    useState<SubjectResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load subjects from API
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const response = await subjectService.getAllSubjects();
        if (response.success && response.data) {
          console.log('Subject API Response:', response.data);
          // Debug: Check each subject's teacher assignments
          response.data.forEach((subject, index) => {
            console.log(`Subject ${index + 1}: ${subject.name}`);
            console.log('- Teacher Assignments:', subject.teacherAssignments);
            console.log('- Class Assignments:', subject.assignedClasses);
          });
          setSubjects(response.data);
        } else {
          setError(response.message || 'Failed to load subjects');
        }
      } catch (err: any) {
        console.error('Error loading subjects:', err);
        setError(err?.message || 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // Transform subjects data for the list component
  const transformedSubjects: Subject[] = subjects.map((subject, index) => {
    // Extract class assignments
    const assignedClasses = subject.assignedClasses || [];

    // Create grade/class strings with display limit (10A format)
    const allGradeClasses = assignedClasses.map(assignment => {
      return `${assignment.class.grade}${assignment.class.section}`;
    });

    // Show max 2 classes, then "+X more"
    const gradeClasses =
      allGradeClasses.length <= 2
        ? allGradeClasses
        : [
            ...allGradeClasses.slice(0, 2),
            `+${allGradeClasses.length - 2} more`,
          ];

    // Extract teacher names from teacherAssignments (general assignments)
    const teacherAssignments = subject.teacherAssignments || [];

    const allTeachers = teacherAssignments.map(assignment => {
      // Extract first name for compact display
      const fullName = assignment.teacher.user.fullName;
      const firstName = fullName.split(' ')[0];
      return firstName;
    });

    // Show max 2 teachers, then "+X more"
    const teachers =
      allTeachers.length <= 2
        ? allTeachers
        : [...allTeachers.slice(0, 2), `+${allTeachers.length - 2} more`];

    return {
      id: index + 1, // Using index since Subject interface expects number
      name: subject.name,
      code: subject.code,
      faculty:
        subject.description === 'compulsory'
          ? 'Compulsory Subject'
          : subject.description === 'optional'
            ? 'Optional Subject'
            : 'Compulsory Subject',
      credits: 0, // Not available in backend data
      status: 'Active', // Default status
      gradeClasses, // Now shows max 2 + "X more"
      teachers, // Now shows max 2 + "X more"
      examConfig: `${subject.maxMarks || 100} marks, Pass: ${subject.passMarks || 40}`,
    };
  });

  // Subject-specific stats data - will be dynamic based on real data
  const subjectStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: subjects.length.toString(),
      label: 'Total Subjects',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: subjects.filter(s => !s.deletedAt).length.toString(),
      label: 'Active Subjects',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '0', // Will be updated when curriculum is implemented
      label: 'Class Assignments',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '0', // Will be updated when curriculum is implemented
      label: 'Teachers Assigned',
      change: '2.1%',
      isPositive: true,
    },
  ];

  // Handle refresh after creating/updating subjects
  const handleRefresh = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (err) {
      console.error('Error refreshing subjects:', err);
    }
  };

  // Handle subject actions (view, edit, delete)
  const handleSubjectAction = async (action: string, subject: Subject) => {
    const originalSubject = subjects.find(s => s.name === subject.name);
    if (!originalSubject) {
      toast.error('Subject not found');
      return;
    }

    switch (action) {
      case 'view':
        setSelectedSubject(originalSubject);
        setIsDetailModalOpen(true);
        break;

      case 'edit':
        setEditingSubject(originalSubject);
        setIsEditModalOpen(true);
        break;

      case 'delete':
        await handleDeleteSubject(originalSubject);
        break;

      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle delete subject with confirmation and proper error handling
  const handleDeleteSubject = async (subject: SubjectResponse) => {
    // Show Sonner confirmation toast
    toast.custom(
      t => (
        <div className='bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-md'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-4 h-4 text-red-600'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
            </div>
            <div className='ml-3 flex-1'>
              <h3 className='text-sm font-medium text-gray-900'>
                Delete Subject "{subject.name}"?
              </h3>
              <div className='mt-2 text-sm text-gray-700'>
                <p>This will also remove:</p>
                <ul className='mt-1 list-disc list-inside text-xs'>
                  <li>All class assignments for this subject</li>
                  <li>All teacher assignments for this subject</li>
                </ul>
                <p className='mt-2 font-medium text-red-700'>
                  This action cannot be undone.
                </p>
              </div>
              <div className='mt-4 flex space-x-2'>
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    performDeleteSubject(subject);
                  }}
                  className='px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                >
                  Delete
                </button>
                <button
                  onClick={() => toast.dismiss(t)}
                  className='px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Keep open until user decides
      },
    );
  };

  // Actual deletion logic separated from confirmation
  const performDeleteSubject = async (subject: SubjectResponse) => {
    try {
      const deleteToast = toast.loading(
        `Deleting subject "${subject.name}"...`,
      );

      const response = await subjectService.deleteSubject(subject.id);

      if (response.success) {
        toast.dismiss(deleteToast);

        // Show success message with details
        if (
          response.data?.affectedRelations &&
          response.data.affectedRelations.length > 0
        ) {
          toast.success(
            'Subject and related assignments deleted successfully',
            {
              description: `Removed: ${response.data.affectedRelations.join(', ')}`,
              duration: 5000,
            },
          );
        } else {
          toast.success('Subject deleted successfully', {
            description: `"${subject.name}" has been removed from the system`,
          });
        }

        // Refresh the subjects list
        await handleRefresh();
      } else {
        toast.dismiss(deleteToast);
        toast.error('Failed to delete subject', {
          description: response.message || 'An unexpected error occurred',
        });
      }
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      toast.error('Failed to delete subject', {
        description:
          err?.message || 'Please check your connection and try again',
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(transformedSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubjects = transformedSubjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Subject Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Subject Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={subjectStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Loading State */}
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>Loading subjects...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
              <div className='flex items-center'>
                <AlertCircle className='h-5 w-5 text-red-600 mr-2' />
                <span className='text-red-800'>{error}</span>
              </div>
            </div>
          )}

          {/* Subject List */}
          {!loading && !error && (
            <GenericList<Subject>
              config={getListConfig('subjects')}
              data={currentSubjects}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={transformedSubjects.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onSubjectAction={handleSubjectAction}
              customActions={
                <ActionButtons pageType='subjects' onRefresh={handleRefresh} />
              }
            />
          )}

          {/* Empty State */}
          {!loading && !error && subjects.length === 0 && (
            <div className='text-center py-12'>
              <BookOpen className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No subjects found
              </h3>
              <p className='text-gray-600 mb-4'>
                Get started by creating your first subject.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Detail Modal */}
      <SubjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSubject(null);
        }}
        subject={selectedSubject}
      />

      {/* Edit Subject Modal */}
      <AddSubjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSubject(null);
        }}
        onSuccess={() => {
          handleRefresh();
          setIsEditModalOpen(false);
          setEditingSubject(null);
        }}
        editSubject={editingSubject}
      />
    </div>
  );
};

export default SubjectsPage;
