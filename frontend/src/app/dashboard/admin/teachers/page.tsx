'use client';

import React, { useState, useEffect } from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  Teacher,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';

const TeachersPage = () => {
  // State for managing real data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats from real data
  const calculateStats = (teachersData: Teacher[]) => {
    const total = teachersData.length;
    const active = teachersData.filter(t => t.status === 'Active').length;
    const onLeave = teachersData.filter(t => t.status === 'On Leave').length;
    const newHires = teachersData.filter(t => {
      if (!t.joinedDate) return false;
      const joinDate = new Date(t.joinedDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return joinDate >= threeMonthsAgo;
    }).length;

    return [
      {
        icon: Users,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        value: total.toString(),
        label: 'Total Teachers',
        change: '3.1%',
        isPositive: true,
      },
      {
        icon: GraduationCap,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        value: active.toString(),
        label: 'Active Teachers',
        change: '1.8%',
        isPositive: true,
      },
      {
        icon: Calendar,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        value: onLeave.toString(),
        label: 'On Leave',
        change: '5.2%',
        isPositive: false,
      },
      {
        icon: BookOpen,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        value: newHires.toString(),
        label: 'New Hires',
        change: '15.3%',
        isPositive: true,
      },
    ];
  };

  const teacherStats = calculateStats(teachers);

  // Load teachers from backend
  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await teacherService.getAllTeachers();

      if (response.success && response.data) {
        // Map backend data to frontend Teacher interface
        const mappedTeachers: Teacher[] = response.data.map(
          (teacher, index) => ({
            id: index + 1, // Frontend uses numeric IDs
            name: teacher.fullName,
            faculty: teacher.department || 'General',
            subjects: teacher.subjects?.map(s => s.name) || [],
            status:
              teacher.employmentStatus === 'active'
                ? 'Active'
                : teacher.employmentStatus === 'on_leave'
                  ? 'On Leave'
                  : 'Inactive',
            avatar: teacher.profilePhotoUrl,
            teacherId: teacher.employeeId || teacher.id,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address || teacher.contactInfo?.address || '',
            designation: teacher.designation,
            department: teacher.department,
            experience: teacher.experienceYears
              ? `${teacher.experienceYears} years`
              : '',
            joinedDate: teacher.employmentDate || teacher.createdAt,
            salary: teacher.totalSalary,
            classTeacher: teacher.classAssignments
              ?.map(ca => `${ca.className} ${ca.sectionName}`)
              .join(', '),
            subjects_detailed:
              teacher.subjects?.map(s => ({
                name: s.name,
                grade: 'Multiple', // Would need more detailed mapping
              })) || [],

            // Extended fields from backend
            qualification: teacher.qualification,
            specialization: teacher.specialization,
            employmentStatus: teacher.employmentStatus,
            employmentDate: teacher.employmentDate,
            experienceYears: teacher.experienceYears,

            // Personal Information
            dateOfBirth: teacher.dateOfBirth,
            gender: teacher.gender,
            bloodGroup: teacher.bloodGroup,

            // Salary Information
            basicSalary: teacher.basicSalary,
            allowances: teacher.allowances,
            totalSalary: teacher.totalSalary,

            // Class Teacher Status
            isClassTeacher: teacher.isClassTeacher,

            // Additional Information
            languagesKnown: teacher.languagesKnown,
            certifications: teacher.certifications,
            previousExperience: teacher.previousExperience,

            // Profile Information
            bio: teacher.bio,
            contactInfo: teacher.contactInfo,
            socialLinks: teacher.socialLinks,

            // System fields
            isActive: teacher.isActive,
            lastLoginAt: teacher.lastLoginAt,

            // Subject and class assignments
            subjectAssignments: teacher.subjects,
            classAssignments: teacher.classAssignments,
          }),
        );

        setTeachers(mappedTeachers);
      } else {
        throw new Error(response.message || 'Failed to load teachers');
      }
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.message || 'Failed to load teachers');
      toast.error('Failed to load teachers', {
        description: 'Unable to fetch teacher data. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(teachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeachers = teachers.slice(startIndex, endIndex);

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Teacher Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Teacher Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && teachers.length === 0) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
          <div className='max-w-7xl mx-auto'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
              Teacher Management
            </h1>
            <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
              Manage All Teacher Related Info Here
            </p>
          </div>
        </div>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <AlertCircle className='h-8 w-8 text-red-500 mx-auto mb-4' />
            <p className='text-gray-900 font-semibold mb-2'>
              Failed to load teachers
            </p>
            <p className='text-gray-600 mb-4'>{error}</p>
            <button
              onClick={loadTeachers}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Teacher Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Teacher Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={teacherStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* Teacher List - Now using Generic List with real data */}
          <GenericList<Teacher>
            config={getListConfig('teachers')}
            data={currentTeachers}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={teachers.length}
            itemsPerPage={itemsPerPage}
            customActions={<ActionButtons pageType='teachers' />}
          />
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
