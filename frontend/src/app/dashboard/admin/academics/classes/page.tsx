'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Layers,
  Calendar,
  School,
  TrendingUp,
  Award,
  Clock,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import AddClassModal from '@/components/organisms/modals/AddClassModal';
import AddSectionModal from '@/components/organisms/modals/AddSectionModal';
import EditClassModal from '@/components/organisms/modals/EditClassModal';
import EditSectionModal from '@/components/organisms/modals/EditSectionModal';
import { classService, type ClassResponse } from '@/api/services/class.service';
import {
  sectionService,
  type SectionResponse,
} from '@/api/services/section.service';

const ClassManagementPage = () => {
  // State management
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [selectedClassData, setSelectedClassData] =
    useState<ClassResponse | null>(null);
  const [selectedSectionData, setSelectedSectionData] =
    useState<SectionResponse | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async (showToast = false) => {
    setIsLoading(true);
    setError(null);

    let loadingToast: string | number | undefined;
    if (showToast) {
      loadingToast = toast.loading('Refreshing data...', {
        duration: Infinity,
      });
    }

    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        setClasses(response.data);
        // Don't auto-expand classes - keep them minimized
        setExpandedClasses(new Set());

        if (showToast && loadingToast) {
          toast.dismiss(loadingToast);
          toast.success('Data refreshed successfully!', {
            duration: 3000,
            description: `Loaded ${response.data.length} classes`,
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes and sections');

      if (showToast && loadingToast) {
        toast.dismiss(loadingToast);
      }

      // Show error toast for failed data loading
      toast.error('Failed to load data', {
        description:
          'Unable to load classes and sections. Please check your connection.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => loadClasses(true),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    // Mobile-first Sonner confirmation
    toast.custom(
      t => (
        <div className='bg-white border border-red-200 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 lg:p-5 max-w-sm sm:max-w-md mx-2 sm:mx-0'>
          <div className='flex items-start space-x-2 sm:space-x-3 lg:space-x-4'>
            <div className='flex-shrink-0'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <GraduationCap className='w-5 h-5 sm:w-6 sm:h-6 text-red-600' />
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
              <p className='text-xs text-red-600 font-medium mb-3 sm:mb-4'>
                ⚠️ This will also delete all sections within this class.
              </p>
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                <button
                  onClick={async () => {
                    toast.dismiss(t);

                    // Show loading toast
                    const loadingToast = toast.loading('Deleting class...', {
                      description: `Removing "${className}" and all its sections`,
                    });

                    try {
                      await classService.deleteClass(classId);

                      // Dismiss loading toast and show success
                      toast.dismiss(loadingToast);
                      toast.success('Class deleted successfully!', {
                        description: `"${className}" and all its sections have been removed`,
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

  const handleDeleteSection = async (
    sectionId: string,
    sectionName: string,
  ) => {
    // Check if section exists in current data
    const sectionExists = classes.some(classItem =>
      classItem.sections?.some(section => section.id === sectionId),
    );

    if (!sectionExists) {
      toast.warning('Section data may be outdated', {
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
                Delete Section?
              </h3>
              <p className='text-sm text-gray-600 mb-1'>
                Are you sure you want to delete{' '}
                <span className='font-medium'>"{sectionName}"</span>?
              </p>
              <p className='text-xs text-gray-500 mb-3 sm:mb-4'>
                This action cannot be undone.
              </p>
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                <button
                  onClick={async () => {
                    toast.dismiss(t);

                    // Show loading toast
                    const loadingToast = toast.loading('Deleting section...', {
                      description: `Removing "${sectionName}" from the class`,
                    });

                    try {
                      await sectionService.deleteSection(sectionId);

                      // Dismiss loading toast and show success
                      toast.dismiss(loadingToast);
                      toast.success('Section deleted successfully!', {
                        description: `"${sectionName}" has been removed`,
                        duration: 5000,
                      });

                      await loadClasses(); // Refresh data
                    } catch (err: any) {
                      console.error('Error deleting section:', err);

                      // Dismiss loading toast and show error
                      toast.dismiss(loadingToast);
                      toast.error('Failed to delete section', {
                        description: err.message || 'Please try again.',
                        duration: 6000,
                      });
                    }
                  }}
                  className='flex-1 sm:flex-none bg-red-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-medium rounded-lg hover:bg-red-700 transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center'
                >
                  Delete Section
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

  const toggleClassExpanded = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const handleAddSection = (classId: string) => {
    setSelectedClassId(classId);
    setIsAddSectionModalOpen(true);
  };

  const handleEditClass = (classData: ClassResponse) => {
    setSelectedClassData(classData);
    setIsEditClassModalOpen(true);
  };

  const handleEditSection = (sectionData: SectionResponse) => {
    // Find the parent class for this section
    const parentClass = classes.find(classItem =>
      classItem.sections?.some(section => section.id === sectionData.id),
    );

    // Add class information to section data
    const enrichedSectionData = {
      ...sectionData,
      class: parentClass
        ? {
            id: parentClass.id,
            name: parentClass.name,
          }
        : undefined,
    } as SectionResponse;

    setSelectedSectionData(enrichedSectionData);
    setIsEditSectionModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadClasses(); // Refresh data after successful operation
  };

  // Calculate stats
  const totalClasses = classes.length;
  const totalSections = classes.reduce(
    (acc, c) => acc + (c.sections?.length || 0),
    0,
  );
  const activeClasses = classes.length; // Assuming all loaded classes are active
  const avgSectionsPerClass =
    totalClasses > 0 ? (totalSections / totalClasses).toFixed(1) : '0';

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
      value: totalSections.toString(),
      label: 'Total Sections',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      value: avgSectionsPerClass,
      label: 'Avg Sections/Class',
      change: '2.1%',
      isPositive: true,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
                Class and Section Management
              </h1>
              <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
                Manage all class and section related information here
              </p>
            </div>
            <div className='flex gap-2 mt-4 sm:mt-0'>
              <button
                onClick={() => {
                  loadClasses(true);
                }}
                className='px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-2'
                title='Refresh data to get latest information'
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => setIsAddClassModalOpen(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2'
              >
                <Plus size={16} />
                Add Class
              </button>
              <button
                onClick={() => setIsAddSectionModalOpen(true)}
                className='px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2'
              >
                <Plus size={16} />
                Add Section
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
                Classes & Sections
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

                      {/* Content Skeleton */}
                      <div className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {[1, 2].map(section => (
                            <div
                              key={section}
                              className='bg-gray-50 rounded-xl p-4'
                            >
                              <div className='flex items-center space-x-3 mb-3'>
                                <div className='w-8 h-8 bg-gray-300 rounded-lg'></div>
                                <div className='space-y-1 flex-1'>
                                  <div className='h-4 bg-gray-300 rounded w-16'></div>
                                  <div className='h-3 bg-gray-200 rounded w-20'></div>
                                </div>
                              </div>
                              <div className='grid grid-cols-2 gap-2'>
                                <div className='h-12 bg-gray-200 rounded-lg'></div>
                                <div className='h-12 bg-gray-200 rounded-lg'></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading Message */}
                  <div className='flex items-center justify-center py-8'>
                    <div className='flex items-center space-x-3'>
                      <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent'></div>
                      <span className='text-gray-600 font-medium'>
                        Loading classes and sections...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className='relative bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden'>
                  <div className='absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50'></div>
                  <div className='relative p-6'>
                    <div className='flex items-center space-x-3 mb-4'>
                      <div className='flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl'>
                        <svg
                          className='w-5 h-5 text-red-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-red-900'>
                          Connection Error
                        </h3>
                        <p className='text-red-700 mt-1'>{error}</p>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button
                        onClick={() => {
                          loadClasses(true);
                        }}
                        className='flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                          />
                        </svg>
                        <span>Retry Connection</span>
                      </button>

                      {error.includes('Session expired') && (
                        <button
                          onClick={() => (window.location.href = '/auth/login')}
                          className='flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                            />
                          </svg>
                          <span>Go to Login</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && classes.length === 0 && (
                <div className='relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden'>
                  {/* Decorative Background */}
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'></div>
                  <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32'></div>
                  <div className='absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100 to-pink-200 rounded-full blur-2xl opacity-30 translate-y-24 -translate-x-24'></div>

                  <div className='relative text-center py-16 px-8'>
                    <div className='flex flex-col items-center space-y-6 max-w-md mx-auto'>
                      {/* Icon */}
                      <div className='flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl'>
                        <GraduationCap size={40} className='text-white' />
                      </div>

                      {/* Content */}
                      <div className='space-y-3'>
                        <h3 className='text-2xl font-bold text-gray-900'>
                          Ready to get started?
                        </h3>
                        <p className='text-gray-600 text-lg leading-relaxed'>
                          Create your first class to begin organizing students
                          and managing your academic structure.
                        </p>
                      </div>

                      {/* Features List */}
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm'>
                        <div className='flex items-center space-x-2 text-gray-600'>
                          <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                          <span className='text-sm'>Organize students</span>
                        </div>
                        <div className='flex items-center space-x-2 text-gray-600'>
                          <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                          <span className='text-sm'>Create sections</span>
                        </div>
                        <div className='flex items-center space-x-2 text-gray-600'>
                          <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                          <span className='text-sm'>Assign teachers</span>
                        </div>
                        <div className='flex items-center space-x-2 text-gray-600'>
                          <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                          <span className='text-sm'>Track progress</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => setIsAddClassModalOpen(true)}
                        className='flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105'
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
                            <button
                              onClick={() => toggleClassExpanded(classItem.id)}
                              className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-800 hover:scale-105 flex-shrink-0'
                            >
                              {expandedClasses.has(classItem.id) ? (
                                <ChevronDown
                                  size={16}
                                  className='sm:w-5 sm:h-5'
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className='sm:w-5 sm:h-5'
                                />
                              )}
                            </button>

                            <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                              <div className='flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0'>
                                <School
                                  size={20}
                                  className='sm:w-6 sm:h-6 text-white'
                                />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate'>
                                  {classItem.name}
                                </h3>
                                <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600'>
                                  <div className='flex items-center space-x-1'>
                                    <Layers
                                      size={12}
                                      className='sm:w-3.5 sm:h-3.5 text-indigo-500 flex-shrink-0'
                                    />
                                    <span>
                                      {classItem.sections?.length || 0} sections
                                    </span>
                                  </div>
                                  <div className='flex items-center space-x-1'>
                                    <Calendar
                                      size={12}
                                      className='sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0'
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
                                onClick={() => handleAddSection(classItem.id)}
                                className='flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl transition-all duration-200 hover:scale-105'
                                title='Add Section'
                              >
                                <Plus size={14} className='sm:w-4 sm:h-4' />
                              </button>
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
                                    classItem.name,
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

                      {/* Mobile-first Sections List */}
                      {expandedClasses.has(classItem.id) && (
                        <div className='relative p-3 sm:p-4 lg:p-6 bg-white'>
                          {classItem.sections &&
                          classItem.sections.length > 0 ? (
                            <div className='space-y-3 sm:space-y-4'>
                              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4'>
                                <h4 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2'>
                                  <Layers
                                    size={16}
                                    className='sm:w-[18px] sm:h-[18px] text-indigo-600'
                                  />
                                  <span>Sections</span>
                                </h4>
                                <button
                                  onClick={() => handleAddSection(classItem.id)}
                                  className='flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[36px] sm:min-h-auto'
                                >
                                  <Plus size={14} />
                                  <span>Add Section</span>
                                </button>
                              </div>

                              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                                {classItem.sections.map(
                                  (section, sectionIndex) => (
                                    <div
                                      key={section.id}
                                      className='group relative bg-gradient-to-br from-white to-gray-50 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1'
                                      style={{
                                        animationDelay: `${index * 100 + sectionIndex * 50}ms`,
                                      }}
                                    >
                                      {/* Section Card Background - hidden on mobile for performance */}
                                      <div className='hidden sm:block absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-xl opacity-20 -translate-y-8 translate-x-8'></div>

                                      <div className='relative'>
                                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3'>
                                          <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                                            <div className='flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md flex-shrink-0'>
                                              <Layers
                                                size={12}
                                                className='sm:w-3.5 sm:h-3.5 text-white'
                                              />
                                            </div>
                                            <div className='min-w-0 flex-1'>
                                              <h5 className='font-semibold text-gray-900 text-sm sm:text-base truncate'>
                                                {section.name}
                                              </h5>
                                              <p className='text-xs text-gray-500 flex items-center space-x-1'>
                                                <Clock size={10} />
                                                <span className='truncate'>
                                                  Created{' '}
                                                  {new Date(
                                                    section.createdAt,
                                                  ).toLocaleDateString()}
                                                </span>
                                              </p>
                                            </div>
                                          </div>

                                          {/* Mobile-first action buttons */}
                                          <div className='flex items-center gap-1.5 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 self-end sm:self-auto'>
                                            <button
                                              onClick={() =>
                                                handleEditSection(section)
                                              }
                                              className='flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-md sm:rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm hover:shadow-md'
                                              title='Edit Section'
                                            >
                                              <Edit2
                                                size={11}
                                                className='sm:w-3 sm:h-3'
                                              />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteSection(
                                                  section.id,
                                                  section.name,
                                                )
                                              }
                                              className='flex items-center justify-center w-7 h-7 bg-red-500 text-white rounded-md sm:rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm hover:shadow-md'
                                              title='Delete Section'
                                            >
                                              <Trash2
                                                size={11}
                                                className='sm:w-3 sm:h-3'
                                              />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Section Stats */}
                                        <div className='grid grid-cols-2 gap-2 mt-3'>
                                          <div className='bg-blue-50 rounded-lg p-2 text-center'>
                                            <div className='text-lg font-bold text-blue-600'>
                                              0
                                            </div>
                                            <div className='text-xs text-blue-500'>
                                              Students
                                            </div>
                                          </div>
                                          <div className='bg-green-50 rounded-lg p-2 text-center'>
                                            <div className='text-lg font-bold text-green-600'>
                                              0
                                            </div>
                                            <div className='text-xs text-green-500'>
                                              Teachers
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className='text-center py-12'>
                              <div className='flex flex-col items-center space-y-4'>
                                <div className='flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl'>
                                  <Layers size={32} className='text-gray-400' />
                                </div>
                                <div>
                                  <h4 className='text-lg font-medium text-gray-900 mb-2'>
                                    No sections yet
                                  </h4>
                                  <p className='text-gray-500 mb-4'>
                                    Create your first section to organize
                                    students in this class
                                  </p>
                                  <button
                                    onClick={() =>
                                      handleAddSection(classItem.id)
                                    }
                                    className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto'
                                  >
                                    <Plus size={16} />
                                    <span>Create First Section</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => {
          setIsAddSectionModalOpen(false);
          setSelectedClassId(undefined);
        }}
        onSuccess={handleModalSuccess}
        preSelectedClassId={selectedClassId}
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
      <EditSectionModal
        isOpen={isEditSectionModalOpen}
        onClose={() => {
          setIsEditSectionModalOpen(false);
          setSelectedSectionData(null);
        }}
        onSuccess={handleModalSuccess}
        sectionData={selectedSectionData}
      />
    </div>
  );
};

export default ClassManagementPage;
