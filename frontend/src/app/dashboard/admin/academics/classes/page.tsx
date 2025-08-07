'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  GraduationCap,
  Calendar,
  School,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import AddClassModal from '@/components/organisms/modals/AddClassModal';
import EditClassModal from '@/components/organisms/modals/EditClassModal';
import { classService, type ClassResponse } from '@/api/services/class.service';

const ClassManagementPage = () => {
  // State management
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [selectedClassData, setSelectedClassData] =
    useState<ClassResponse | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async (showToast = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await classService.getAllClasses();
      setClasses(response.data);

      if (showToast) {
        toast.success('Classes refreshed successfully!', {
          description: `Found ${response.data.length} classes`,
          duration: 3000,
        });
      }
    } catch (err: any) {
      console.error('Error loading classes:', err);
      const errorMessage = err.message || 'Failed to load classes';
      setError(errorMessage);

      toast.error('Failed to load classes', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    // Check if class exists in current data
    const classExists = classes.some(classItem => classItem.id === classId);

    if (!classExists) {
      toast.warning('Class data may be outdated', {
        description: 'Refreshing data and try again',
        duration: 3000,
      });
      await loadClasses();
      return;
    }

    // Mobile-first Sonner confirmation
    toast.custom(
      t => (
        <div className='bg-white border border-red-200 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-5 max-w-sm sm:max-w-md mx-2 sm:mx-0'>
          <div className='flex items-start space-x-2 sm:space-x-3 lg:space-x-4'>
            <div className='flex-shrink-0'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <Trash2 className='w-5 h-5 sm:w-6 sm:h-6 text-red-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2'>
                Delete Class?
              </h3>
              <p className='text-sm text-gray-600 mb-1'>
                Are you sure you want to delete{' '}
                <span className='font-medium'>"{className}"</span>?
              </p>
              <p className='text-xs text-gray-500 mb-3 sm:mb-4'>
                This action cannot be undone.
              </p>
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                <button
                  onClick={async () => {
                    toast.dismiss(t);

                    // Show loading toast
                    const loadingToast = toast.loading('Deleting class...', {
                      description: `Removing "${className}" from the system`,
                    });

                    try {
                      await classService.deleteClass(classId);

                      // Dismiss loading toast and show success
                      toast.dismiss(loadingToast);
                      toast.success('Class deleted successfully!', {
                        description: `"${className}" has been removed`,
                        duration: 5000,
                      });

                      await loadClasses(); // Refresh data
                    } catch (err: any) {
                      console.error('Error deleting class:', err);

                      // Dismiss loading toast and show error
                      toast.dismiss(loadingToast);
                      toast.error('Failed to delete class', {
                        description: err.message || 'Please try again.',
                        duration: 6000,
                      });
                    }
                  }}
                  className='flex-1 sm:flex-none bg-red-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg hover:bg-red-700 transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center'
                >
                  Delete Class
                </button>
                <button
                  onClick={() => toast.dismiss(t)}
                  className='flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
      },
    );
  };

  const handleEditClass = (classData: ClassResponse) => {
    setSelectedClassData(classData);
    setIsEditClassModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadClasses(); // Refresh data after successful operation
  };

  // Calculate stats
  const totalClasses = classes.length;
  const activeClasses = classes.length; // Assuming all loaded classes are active
  const totalStudents = classes.reduce((acc, c) => acc + (c.capacity || 0), 0); // Using capacity as estimated students

  const classStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: totalClasses.toString(),
      label: 'Total Classes',
      change: '3.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: activeClasses.toString(),
      label: 'Active Classes',
      change: '1.8%',
      isPositive: true,
    },
    {
      icon: BookOpen,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: totalStudents.toString(),
      label: 'Total Capacity',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: GraduationCap,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value:
        totalClasses > 0
          ? Math.round(totalStudents / totalClasses).toString()
          : '0',
      label: 'Avg Capacity/Class',
      change: '2.1%',
      isPositive: true,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6'>
            <div className='space-y-1 sm:space-y-0'>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
                Classes Management
              </h1>
              <p className='text-sm sm:text-base text-gray-600'>
                Manage your academic classes and their details
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
              <button
                onClick={() => loadClasses(true)}
                className='flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium min-h-[40px] sm:min-h-auto'
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsAddClassModalOpen(true)}
                className='flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium min-h-[40px] sm:min-h-auto'
              >
                <Plus size={16} />
                <span>Add Class</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={classStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-2 sm:px-4 lg:px-6 mt-2 sm:mt-4 lg:mt-6 mb-4 sm:mb-6 lg:mb-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white rounded-lg shadow border border-gray-200'>
            <div className='p-3 sm:p-4 lg:p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Classes
              </h2>

              {/* Loading State */}
              {isLoading && (
                <div className='space-y-6 animate-pulse'>
                  {/* Loading Skeleton for Classes */}
                  {[1, 2, 3].map(item => (
                    <div
                      key={item}
                      className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'
                    >
                      {/* Header Skeleton */}
                      <div className='p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-100'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-4'>
                            <div className='w-10 h-10 bg-gray-200 rounded-xl'></div>
                            <div className='flex items-center space-x-3'>
                              <div className='w-12 h-12 bg-gray-300 rounded-xl'></div>
                              <div className='space-y-2'>
                                <div className='h-6 bg-gray-300 rounded w-24'></div>
                                <div className='h-4 bg-gray-200 rounded w-32'></div>
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-10 h-10 bg-gray-200 rounded-xl'></div>
                            <div className='w-10 h-10 bg-gray-200 rounded-xl'></div>
                            <div className='w-10 h-10 bg-gray-200 rounded-xl'></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className='text-center py-12'>
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl'>
                      <Trash2 size={32} className='text-red-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Failed to load classes
                      </h3>
                      <p className='text-gray-500 mb-4'>{error}</p>
                      <button
                        onClick={() => loadClasses()}
                        className='flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors mx-auto'
                      >
                        <RefreshCw size={16} />
                        <span>Try Again</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && classes.length === 0 && (
                <div className='text-center py-12'>
                  <div className='flex flex-col items-center space-y-4'>
                    <div className='flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl'>
                      <School size={32} className='text-blue-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        No classes yet
                      </h3>
                      <p className='text-gray-500 mb-4'>
                        Create your first class to start organizing students
                      </p>
                      <button
                        onClick={() => setIsAddClassModalOpen(true)}
                        className='flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto'
                      >
                        <Plus size={20} />
                        <span>Create Your First Class</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Classes List */}
              {!isLoading && !error && classes.length > 0 && (
                <div className='space-y-6'>
                  {classes.map((classItem, index) => (
                    <div
                      key={classItem.id}
                      className='group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden'
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      {/* Decorative Background Elements */}
                      <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full blur-3xl opacity-20 -translate-y-16 translate-x-16'></div>
                      <div className='absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-50 to-pink-100 rounded-full blur-2xl opacity-30 translate-y-10 -translate-x-10'></div>

                      {/* Mobile-first Class Header */}
                      <div className='relative p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-100'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
                          <div className='flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1'>
                            <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                              <div className='flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0'>
                                <School
                                  size={20}
                                  className='sm:w-6 sm:h-6 text-white'
                                />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate'>
                                  Grade {classItem.grade} Section{' '}
                                  {classItem.section}
                                </h3>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600'>
                                  <div className='flex items-center space-x-1'>
                                    <Users
                                      size={12}
                                      className='sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0'
                                    />
                                    <span>Capacity: {classItem.capacity}</span>
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    <Calendar
                                      size={12}
                                      className='sm:w-3.5 sm:h-3.5 text-purple-500 flex-shrink-0'
                                    />
                                    <span className='truncate'>
                                      Created{' '}
                                      {new Date(
                                        classItem.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Mobile-first action buttons */}
                          <div className='flex items-center justify-between sm:justify-end gap-2 sm:gap-3'>
                            {/* Action buttons - always visible on mobile */}
                            <div className='flex items-center gap-1.5 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200'>
                              <button
                                onClick={() => handleEditClass(classItem)}
                                className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-200 hover:scale-105'
                                title='Edit Class'
                              >
                                <Edit2 size={14} className='sm:w-4 sm:h-4' />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClass(
                                    classItem.id,
                                    `Grade ${classItem.grade} Section ${classItem.section}`,
                                  )
                                }
                                className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-200 hover:scale-105'
                                title='Delete Class'
                              >
                                <Trash2 size={14} className='sm:w-4 sm:h-4' />
                              </button>
                            </div>

                            {/* Status Badge */}
                            <div className='flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-full shadow-sm border border-gray-200'>
                              <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse'></div>
                              <span className='text-xs sm:text-sm font-medium text-gray-700'>
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddClassModal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        onSuccess={handleModalSuccess}
        existingClasses={classes}
      />

      <EditClassModal
        isOpen={isEditClassModalOpen}
        onClose={() => {
          setIsEditClassModalOpen(false);
          setSelectedClassData(null);
        }}
        onSuccess={handleModalSuccess}
        classData={selectedClassData}
        existingClasses={classes}
      />
    </div>
  );
};

export default ClassManagementPage;
