'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { feeService } from '@/api/services/fee.service';

// Types
interface ScholarshipDetails {
  id: string;
  name: string;
  description?: string;
  type: 'MERIT' | 'NEED_BASED' | 'SPORTS' | 'OTHER';
  valueType: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  eligibilityCriteria?: string;
  deadline?: string;
  totalAmount?: number;
  assignments: ScholarshipAssignment[];
}

interface ScholarshipAssignment {
  id: string;
  effectiveFrom: string;
  expiresAt?: string;
  isActive: boolean;
  student: {
    id: string;
    rollNumber: string;
    user: {
      fullName: string;
      email: string;
    };
    class: {
      name: string;
      grade: number;
      section: string;
    };
  };
}

export default function ScholarshipDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const scholarshipId = params.id as string;

  // State
  const [scholarship, setScholarship] = useState<ScholarshipDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch scholarship details
  useEffect(() => {
    fetchScholarshipDetails();
  }, [scholarshipId]);

  const fetchScholarshipDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // For development: Check if we have a valid scholarship ID first
      if (!scholarshipId) {
        throw new Error('No scholarship ID provided');
      }

      // Try to get existing scholarships first to see if this ID exists
      const existingScholarships = await feeService.listScholarships();
      const scholarshipExists = existingScholarships.find(
        s => s.id === scholarshipId,
      );

      if (!scholarshipExists) {
        throw new Error('Scholarship not found in the system');
      }

      // For now, create mock data based on the existing scholarship
      const mockScholarshipDetails: ScholarshipDetails = {
        id: scholarshipExists.id,
        name: scholarshipExists.name,
        description: `This is a detailed description for ${scholarshipExists.name}. It provides financial assistance to eligible students based on merit and academic performance.`,
        type: scholarshipExists.type as
          | 'MERIT'
          | 'NEED_BASED'
          | 'SPORTS'
          | 'OTHER',
        valueType: scholarshipExists.valueType as 'PERCENTAGE' | 'FIXED',
        value: parseFloat(scholarshipExists.value),
        isActive: scholarshipExists.isActive,
        createdAt: scholarshipExists.createdAt,
        updatedAt: new Date().toISOString(),
        eligibilityCriteria:
          'Minimum 3.5 GPA, Regular attendance, Good conduct record',
        deadline: '2025-12-31',
        totalAmount:
          scholarshipExists.valueType === 'PERCENTAGE'
            ? undefined
            : parseFloat(scholarshipExists.value) * 50, // Mock calculation
        assignments: [
          // Mock student assignments
          {
            id: '1',
            effectiveFrom: '2025-01-01',
            expiresAt: '2025-12-31',
            isActive: true,
            student: {
              id: 'student-1',
              rollNumber: 'S001',
              user: {
                fullName: 'John Doe',
                email: 'john.doe@school.edu',
              },
              class: {
                name: 'Grade 10-A',
                grade: 10,
                section: 'A',
              },
            },
          },
          {
            id: '2',
            effectiveFrom: '2025-01-01',
            expiresAt: '2025-12-31',
            isActive: false,
            student: {
              id: 'student-2',
              rollNumber: 'S002',
              user: {
                fullName: 'Jane Smith',
                email: 'jane.smith@school.edu',
              },
              class: {
                name: 'Grade 10-B',
                grade: 10,
                section: 'B',
              },
            },
          },
          {
            id: '3',
            effectiveFrom: '2025-01-01',
            expiresAt: '2025-12-31',
            isActive: true,
            student: {
              id: 'student-3',
              rollNumber: 'S003',
              user: {
                fullName: 'Mike Johnson',
                email: 'mike.johnson@school.edu',
              },
              class: {
                name: 'Grade 11-A',
                grade: 11,
                section: 'A',
              },
            },
          },
        ],
      };

      setScholarship(mockScholarshipDetails);
    } catch (err) {
      console.error('Error fetching scholarship details:', err);
      setError('Failed to load scholarship details');
      toast.error('Failed to load scholarship details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudentStatus = async (
    assignmentId: string,
    currentStatus: boolean,
  ) => {
    try {
      setUpdating(assignmentId);

      // For development: Mock the toggle operation
      // In production, this would call: await feeService.toggleScholarshipAssignment(assignmentId, !currentStatus);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local state
      setScholarship(prev =>
        prev
          ? {
              ...prev,
              assignments: prev.assignments.map(assignment =>
                assignment.id === assignmentId
                  ? { ...assignment, isActive: !currentStatus }
                  : assignment,
              ),
            }
          : null,
      );

      toast.success(
        `Student scholarship ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      );
    } catch (err) {
      console.error('Error updating student status:', err);
      toast.error('Failed to update student status');
    } finally {
      setUpdating(null);
    }
  };

  // Filter students
  const filteredStudents =
    scholarship?.assignments.filter(assignment => {
      const matchesSearch =
        assignment.student.user.fullName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.student.rollNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.student.class.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && assignment.isActive) ||
        (statusFilter === 'inactive' && !assignment.isActive);

      return matchesSearch && matchesStatus;
    }) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MERIT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SPORTS':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'NEED_BASED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200';
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50/50 flex items-center justify-center'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200/60 p-8 max-w-md w-full mx-4'>
          <div className='flex flex-col items-center text-center'>
            <div className='p-4 bg-blue-100 rounded-full mb-4'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Loading Scholarship Details
            </h3>
            <p className='text-gray-600'>
              Please wait while we fetch the scholarship information and student
              assignments...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className='min-h-screen bg-gray-50/50 flex items-center justify-center'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200/60 p-8 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='p-4 bg-red-100 rounded-full w-fit mx-auto mb-4'>
              <XCircle className='h-8 w-8 text-red-600' />
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-3'>
              Scholarship Not Found
            </h2>
            <p className='text-gray-600 mb-6'>
              The scholarship you're looking for doesn't exist or has been
              removed from the system.
            </p>
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <button
                onClick={() => router.back()}
                className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium'
              >
                <ArrowLeft className='h-4 w-4' />
                Go Back
              </button>
              <button
                onClick={() =>
                  router.push('/dashboard/admin/finance/fee-management')
                }
                className='inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium'
              >
                View All Scholarships
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
        <div className='px-6 py-4'>
          {/* Breadcrumb */}
          <nav className='flex items-center gap-2 mb-4 text-sm'>
            <button
              onClick={() => router.push('/dashboard')}
              className='text-gray-500 hover:text-blue-600 transition-colors font-medium'
            >
              Home
            </button>
            <span className='text-gray-300'>/</span>
            <button
              onClick={() =>
                router.push('/dashboard/admin/finance/fee-management')
              }
              className='text-gray-500 hover:text-blue-600 transition-colors font-medium'
            >
              Fee Management
            </button>
            <span className='text-gray-300'>/</span>
            <span className='text-gray-900 font-semibold'>
              Scholarship Details
            </span>
          </nav>

          {/* Header Content */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-start gap-4'>
              <button
                onClick={() => router.back()}
                className='flex-shrink-0 p-2.5 rounded-xl hover:bg-gray-100 transition-colors group border border-gray-200'
                title='Go back'
              >
                <ArrowLeft className='h-5 w-5 text-gray-600 group-hover:text-gray-800' />
              </button>
              <div className='min-w-0 flex-1'>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 truncate'>
                  {scholarship.name}
                </h1>
                <p className='text-gray-600 mt-1 text-sm sm:text-base'>
                  Comprehensive scholarship management and student assignments
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
              <span
                className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border ${getStatusColor(scholarship.isActive)}`}
              >
                {scholarship.isActive ? (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className='h-4 w-4 mr-2' />
                    Inactive
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarship Details Section */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200/60'>
          <h2 className='text-xl font-bold text-gray-900 flex items-center gap-3'>
            <div className='p-2 bg-blue-600 rounded-xl'>
              <Award className='h-5 w-5 text-white' />
            </div>
            Scholarship Information
          </h2>
          <p className='text-gray-600 text-sm mt-1'>
            Complete details and configuration
          </p>
        </div>

        <div className='p-6'>
          {/* Key Metrics Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200/60'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-700 text-sm font-medium'>
                    Scholarship Value
                  </p>
                  <p className='text-2xl font-bold text-blue-900 mt-1'>
                    {scholarship.valueType === 'PERCENTAGE'
                      ? `${scholarship.value}%`
                      : `₹${scholarship.value.toLocaleString()}`}
                  </p>
                </div>
                <div className='p-3 bg-blue-600 rounded-lg'>
                  <DollarSign className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200/60'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-700 text-sm font-medium'>
                    Total Students
                  </p>
                  <p className='text-2xl font-bold text-green-900 mt-1'>
                    {scholarship.assignments.length}
                  </p>
                </div>
                <div className='p-3 bg-green-600 rounded-lg'>
                  <Users className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200/60'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-emerald-700 text-sm font-medium'>
                    Active Students
                  </p>
                  <p className='text-2xl font-bold text-emerald-900 mt-1'>
                    {scholarship.assignments.filter(a => a.isActive).length}
                  </p>
                </div>
                <div className='p-3 bg-emerald-600 rounded-lg'>
                  <CheckCircle className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>

            <div className='bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200/60'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-amber-700 text-sm font-medium'>Created</p>
                  <p className='text-lg font-bold text-amber-900 mt-1'>
                    {new Date(scholarship.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  </p>
                </div>
                <div className='p-3 bg-amber-600 rounded-lg'>
                  <Calendar className='h-6 w-6 text-white' />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Scholarship Title
              </label>
              <p className='text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border'>
                {scholarship.name}
              </p>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Type
              </label>
              <span
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border ${getTypeColor(scholarship.type)}`}
              >
                {scholarship.type.replace('_', ' ')}
              </span>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Value Structure
              </label>
              <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg border'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <DollarSign className='h-4 w-4 text-green-600' />
                </div>
                <div>
                  <span className='text-gray-900 font-semibold text-lg'>
                    {scholarship.valueType === 'PERCENTAGE'
                      ? `${scholarship.value}%`
                      : `₹${scholarship.value.toLocaleString()}`}
                  </span>
                  <p className='text-gray-500 text-xs'>
                    {scholarship.valueType === 'PERCENTAGE'
                      ? 'Percentage discount'
                      : 'Fixed amount'}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Status
              </label>
              <span
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(scholarship.isActive)}`}
              >
                {scholarship.isActive ? (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Active & Available
                  </>
                ) : (
                  <>
                    <XCircle className='h-4 w-4 mr-2' />
                    Inactive
                  </>
                )}
              </span>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Creation Date
              </label>
              <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg border'>
                <Calendar className='h-4 w-4 text-gray-400' />
                <span className='text-gray-900 font-medium'>
                  {new Date(scholarship.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Assignment Coverage
              </label>
              <div className='flex items-center gap-3 bg-gray-50 p-3 rounded-lg border'>
                <Users className='h-4 w-4 text-blue-600' />
                <div>
                  <span className='text-gray-900 font-semibold'>
                    {scholarship.assignments.length} students
                  </span>
                  <p className='text-gray-500 text-xs'>
                    {scholarship.assignments.filter(a => a.isActive).length}{' '}
                    active,{' '}
                    {scholarship.assignments.filter(a => !a.isActive).length}{' '}
                    disabled
                  </p>
                </div>
              </div>
            </div>
          </div>

          {scholarship.description && (
            <div className='mt-8 p-6 bg-blue-50/50 rounded-xl border border-blue-200/40'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Description
              </label>
              <p className='text-gray-700 leading-relaxed'>
                {scholarship.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-5 border-b border-gray-200/60'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h2 className='text-xl font-bold text-gray-900 flex items-center gap-3'>
                <div className='p-2 bg-green-600 rounded-xl'>
                  <Users className='h-5 w-5 text-white' />
                </div>
                Student Assignments
              </h2>
              <p className='text-gray-600 text-sm mt-1'>
                Manage individual student scholarship assignments (
                {filteredStudents.length} students)
              </p>
            </div>

            {/* Search and Filter Controls */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0'>
              <div className='relative min-w-0 flex-1 sm:w-64'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search students...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white'
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className='px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white min-w-0'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active Only</option>
                <option value='inactive'>Disabled Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className='p-6'>
          {/* Students Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    #
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    Student Information
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    Class Details
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    Roll Number
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    Assignment Status
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    Quick Actions
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                    More Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-16 text-center'>
                      <div className='flex flex-col items-center justify-center'>
                        <div className='p-4 bg-gray-100 rounded-full mb-4'>
                          <Users className='h-8 w-8 text-gray-400' />
                        </div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                          No students found
                        </h3>
                        <p className='text-gray-500 max-w-sm'>
                          {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your search criteria or filters to find students.'
                            : 'No students have been assigned to this scholarship yet.'}
                        </p>
                        {(searchTerm || statusFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                            }}
                            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((assignment, index) => (
                    <tr
                      key={assignment.id}
                      className='hover:bg-gray-50/50 transition-colors'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full'>
                          <span className='text-sm font-semibold text-gray-600'>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                            <span className='text-white font-semibold text-sm'>
                              {assignment.student.user.fullName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .substring(0, 2)}
                            </span>
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>
                              {assignment.student.user.fullName}
                            </p>
                            <p className='text-sm text-gray-500 truncate'>
                              {assignment.student.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm'>
                          <div className='font-semibold text-gray-900'>
                            Grade {assignment.student.class.grade}
                          </div>
                          <div className='text-gray-500'>
                            Section {assignment.student.class.section}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border'>
                          {assignment.student.rollNumber}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            assignment.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {assignment.isActive ? (
                            <>
                              <CheckCircle className='h-3 w-3 mr-1' />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className='h-3 w-3 mr-1' />
                              Disabled
                            </>
                          )}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <button
                          onClick={() =>
                            handleToggleStudentStatus(
                              assignment.id,
                              assignment.isActive,
                            )
                          }
                          disabled={updating === assignment.id}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            assignment.isActive
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updating === assignment.id ? (
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                          ) : assignment.isActive ? (
                            <PowerOff className='h-3.5 w-3.5' />
                          ) : (
                            <Power className='h-3.5 w-3.5' />
                          )}
                          {assignment.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <button
                            className='p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-200'
                            title='View Student Details'
                          >
                            <Eye className='h-4 w-4' />
                          </button>
                          <button
                            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors border border-transparent hover:border-gray-200'
                            title='More Actions'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          {scholarship.assignments.length > 0 && (
            <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200'>
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200/60'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-blue-700 text-sm font-semibold'>
                      Total Assigned
                    </p>
                    <p className='text-3xl font-bold text-blue-900 mt-1'>
                      {scholarship.assignments.length}
                    </p>
                    <p className='text-blue-600 text-xs mt-1'>
                      Students enrolled
                    </p>
                  </div>
                  <div className='p-3 bg-blue-600 rounded-lg'>
                    <Users className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>

              <div className='bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200/60'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-green-700 text-sm font-semibold'>
                      Currently Active
                    </p>
                    <p className='text-3xl font-bold text-green-900 mt-1'>
                      {scholarship.assignments.filter(a => a.isActive).length}
                    </p>
                    <p className='text-green-600 text-xs mt-1'>
                      Receiving benefits
                    </p>
                  </div>
                  <div className='p-3 bg-green-600 rounded-lg'>
                    <CheckCircle className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>

              <div className='bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200/60'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-red-700 text-sm font-semibold'>
                      Disabled
                    </p>
                    <p className='text-3xl font-bold text-red-900 mt-1'>
                      {scholarship.assignments.filter(a => !a.isActive).length}
                    </p>
                    <p className='text-red-600 text-xs mt-1'>
                      Temporarily suspended
                    </p>
                  </div>
                  <div className='p-3 bg-red-600 rounded-lg'>
                    <XCircle className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
