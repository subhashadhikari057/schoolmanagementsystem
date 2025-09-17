'use client';
import React, { useState } from 'react';
import ToggleButton from '../form-controls/ToggleButton';
import {
  Download,
  Upload,
  Mail,
  MessageSquare,
  Plus,
  Printer,
  Edit,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { csrfService } from '@/api/services/csrf.service';
import AddTeacherFormModal from '@/components/organisms/modals/AddTeacherFormModal';
import AddStudentFormModal from '@/components/organisms/modals/AddStudentFormModal';
import AddStaffFormModal from '@/components/organisms/modals/AddStaffFormModal';

import AddSubjectFormModal from '@/components/organisms/modals/AddSubjectFormModal';
import GenerateIDCardModal from '@/components/organisms/modals/GenerateIDCardModal';
import AddClassModal from '@/components/organisms/modals/AddClassModal';
import GenerateEmailModal from '@/components/organisms/modals/GenerateEmailModal';
import CreateFeeStructureModal from '@/components/organisms/modals/CreateFeeStructureModal';
import type { CalendarEvent } from '@/components/organisms/calendar/types/calendar.types';

interface ActionButtonConfig {
  id: string;
  label: string;
  variant: string;
  className?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

import AddEventModal from '@/components/organisms/modals/AddEventModal';
import ManageEventsModal from '@/components/organisms/modals/ManageEventsModal';
import CreateNoticeModal from '@/components/organisms/modals/CreateNoticeModal';
import AddExpenseModal from '@/components/organisms/modals/AddExpenseModal';
import AddSalaryModal from '@/components/organisms/modals/AddSalaryModal';
import { teacherService } from '@/api/services/teacher.service';
import { staffService } from '@/api/services/staff.service';

interface ActionButtonsProps {
  pageType:
    | 'students'
    | 'teachers'
    | 'parents'
    | 'staff'
    | 'subjects'
    | 'id-cards'
    | 'classes'
    | 'reports'
    | 'calendar'
    | 'notices'
    | 'complaints'
    | 'leave-requests'
    | 'leave-types'
    | 'fee-management'
    | 'expenses'
    | 'salaries';
  onRefresh?: () => void;
  onAddNew?: () => void;
  events?: CalendarEvent[]; // For calendar events
  hideMassEmails?: boolean;
  hideSendCommunication?: boolean;
}

const getActionButtonsConfig = (
  pageType: string,
  openAddModal: () => void,
  openSendCommModal?: () => void,
  onRefresh?: () => void,
): ActionButtonConfig[] => {
  if (pageType === 'expenses') {
    return [
      {
        id: 'import-expenses',
        label: 'Import Expenses',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => alert('Import Expenses feature coming soon!'),
      },
      {
        id: 'export-expenses',
        label: 'Export Data',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Expenses feature coming soon!'),
      },
      {
        id: 'add-expense',
        label: 'Add Expense',
        className: 'bg-red-600 text-white hover:bg-red-700 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'salaries') {
    return [
      {
        id: 'import-salaries',
        label: 'Import Salaries',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => alert('Import Salaries feature coming soon!'),
      },
      {
        id: 'export-salaries',
        label: 'Export Data',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Salaries feature coming soon!'),
      },
      {
        id: 'add-salary',
        label: 'Add Salary',
        className: 'bg-green-600 text-white hover:bg-green-700 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'fee-management') {
    return [
      {
        id: 'import-structure',
        label: 'Import Structure',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => alert('Import Structure feature coming soon!'),
      },
      {
        id: 'export-data',
        label: 'Export Data',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Data feature coming soon!'),
      },
      {
        id: 'create-structure',
        label: 'Create Structure',
        className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'students') {
    return [
      {
        id: 'download-template',
        label: 'Download Template',
        variant: 'secondary',
        className: 'bg-green-50 text-green-700 hover:bg-green-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Downloading...';
              button.setAttribute('disabled', 'true');
            }

            // Download template from backend
            const backendUrl =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(
              `${backendUrl}/api/v1/student-import/import/template`,
              {
                method: 'GET',
                credentials: 'include',
              },
            );

            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `student_import_template.csv`;
              a.click();
              window.URL.revokeObjectURL(url);

              toast.success('✅ Template downloaded successfully!', {
                description:
                  'Use this template to format your student data for import.',
                duration: 4000,
              });
            } else {
              toast.error('❌ Failed to download template', {
                description: 'Please try again or contact support.',
                duration: 5000,
              });
            }
          } catch (error) {
            toast.error(
              `❌ Template download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Download Template';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'import-students',
        label: 'Import Students',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => {
          // Create a file input element for CSV upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              try {
                // Show loading state
                const button = document.querySelector(
                  '[data-id="import-students"]',
                );
                if (button) {
                  button.textContent = 'Importing...';
                  button.setAttribute('disabled', 'true');
                }

                // Create FormData for upload
                const formData = new FormData();
                formData.append('file', file);

                // Get CSRF token and add to headers
                const csrfToken = await csrfService.getToken();
                const headers: Record<string, string> = {
                  'X-CSRF-Token': csrfToken,
                };

                // Upload to backend with CSRF token
                const backendUrl =
                  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                const response = await fetch(
                  `${backendUrl}/api/v1/student-import/import`,
                  {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    headers,
                  },
                );

                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    toast.success(
                      `🎉 Import successful! ${result.successfulImports} students imported successfully.`,
                      {
                        description: `Check the backend console for student and parent passwords.`,
                        duration: 6000,
                      },
                    );
                    // Refresh the page to show new students
                    window.location.reload();
                  } else {
                    toast.error(`❌ Import failed: ${result.message}`, {
                      description: `${result.failedImports} students failed to import.`,
                      duration: 5000,
                    });
                  }
                } else {
                  const error = await response.text();
                  toast.error(`❌ Import failed: ${error}`, {
                    description: 'Please check your CSV format and try again.',
                    duration: 5000,
                  });
                }
              } catch (error) {
                toast.error(
                  `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  {
                    description:
                      'An unexpected error occurred. Please try again.',
                    duration: 5000,
                  },
                );
              } finally {
                // Reset button state
                const button = document.querySelector(
                  '[data-id="import-students"]',
                );
                if (button) {
                  button.textContent = 'Import Students';
                  button.removeAttribute('disabled');
                }
              }
            }
          };
          input.click();
        },
      },
      {
        id: 'export-students',
        label: 'Export Students',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector(
              '[data-id="export-students"]',
            );
            if (button) {
              button.textContent = 'Exporting...';
              button.setAttribute('disabled', 'true');
            }

            // Get current filters from URL or page state
            const urlParams = new URLSearchParams(window.location.search);
            const classId = urlParams.get('classId') || '';
            const search = urlParams.get('search') || '';
            const academicStatus = urlParams.get('academicStatus') || '';

            // Build export URL with filters
            const backendUrl =
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const exportUrl = new URL(
              '/api/v1/student-import/export',
              backendUrl,
            );
            if (classId) exportUrl.searchParams.set('classId', classId);
            if (search) exportUrl.searchParams.set('search', search);
            if (academicStatus)
              exportUrl.searchParams.set('academicStatus', academicStatus);

            // Get CSRF token for the request
            const csrfToken = await csrfService.getToken();
            const headers: Record<string, string> = {
              'X-CSRF-Token': csrfToken,
            };

            // Trigger download with CSRF token
            const response = await fetch(exportUrl.toString(), {
              method: 'GET',
              credentials: 'include',
              headers,
            });

            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);

              toast.success('✅ Export successful! Student data downloaded.', {
                description: 'Your CSV file has been downloaded successfully.',
                duration: 4000,
              });
            } else {
              const error = await response.text();
              toast.error(`❌ Export failed: ${error}`, {
                description: 'Please try again or contact support.',
                duration: 5000,
              });
            }
          } catch (error) {
            toast.error(
              `❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector(
              '[data-id="export-students"]',
            );
            if (button) {
              button.textContent = 'Export Students';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'refresh-students',
        label: 'Refresh',
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg',
        icon: <RefreshCw size={16} />,
        onClick: () => {
          if (onRefresh) {
            onRefresh();
          } else if (typeof window !== 'undefined') {
            // Fallback refresh if onRefresh is not available
            window.location.reload();
          }
        },
      },
      {
        id: 'add-student',
        label: 'Add Student',
        className: 'bg-green-600 text-white hover:bg-green-700 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'teachers') {
    return [
      {
        id: 'download-template',
        label: 'Download Template',
        variant: 'secondary',
        className: 'bg-green-50 text-green-700 hover:bg-green-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Downloading...';
              button.setAttribute('disabled', 'true');
            }

            // Download template from backend
            const blob = await teacherService.getImportTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teacher_import_template.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('✅ Template downloaded successfully!', {
              description:
                'Use this template to format your teacher data for import.',
              duration: 4000,
            });
          } catch (error) {
            toast.error(
              `❌ Template download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Download Template';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'import-teachers',
        label: 'Import Teachers',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => {
          // Create a file input element for CSV upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              try {
                // Show loading state
                const button = document.querySelector(
                  '[data-id="import-teachers"]',
                );
                if (button) {
                  button.textContent = 'Importing...';
                  button.setAttribute('disabled', 'true');
                }

                // Use the teacher service to import
                const response = await teacherService.importTeachersFromCSV(
                  file,
                  {
                    skipDuplicates: true,
                    updateExisting: false,
                  },
                );

                if (response.success) {
                  toast.success(
                    `🎉 Import successful! ${response.data.successfulImports} teachers imported successfully.`,
                    {
                      description: `Check the backend console for teacher passwords.`,
                      duration: 6000,
                    },
                  );
                  // Refresh the page to show new teachers
                  window.location.reload();
                } else {
                  toast.error(`❌ Import failed: ${response.message}`, {
                    description: `${response.data.failedImports} teachers failed to import.`,
                    duration: 5000,
                  });
                }
              } catch (error) {
                toast.error(
                  `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  {
                    description:
                      'An unexpected error occurred. Please try again.',
                    duration: 5000,
                  },
                );
              } finally {
                // Reset button state
                const button = document.querySelector(
                  '[data-id="import-teachers"]',
                );
                if (button) {
                  button.textContent = 'Import Teachers';
                  button.removeAttribute('disabled');
                }
              }
            }
          };
          input.click();
        },
      },
      {
        id: 'export-teachers',
        label: 'Export Teachers',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector(
              '[data-id="export-teachers"]',
            );
            if (button) {
              button.textContent = 'Exporting...';
              button.setAttribute('disabled', 'true');
            }

            // Get current filters from URL or page state
            const urlParams = new URLSearchParams(window.location.search);
            const department = urlParams.get('department') || '';
            const search = urlParams.get('search') || '';
            const designation = urlParams.get('designation') || '';

            // Use the teacher service to export
            const blob = await teacherService.exportTeachersToCSV({
              department: department || undefined,
              search: search || undefined,
              designation: designation || undefined,
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('✅ Export successful! Teacher data downloaded.', {
              description: 'Your CSV file has been downloaded successfully.',
              duration: 4000,
            });
          } catch (error) {
            toast.error(
              `❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector(
              '[data-id="export-teachers"]',
            );
            if (button) {
              button.textContent = 'Export Teachers';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'refresh-teachers',
        label: 'Refresh',
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg',
        icon: <RefreshCw size={16} />,
        onClick: () => {
          if (onRefresh) {
            onRefresh();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
          }
        },
      },
      {
        id: 'add-teacher',
        label: 'Add Teacher',
        className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'staff') {
    return [
      {
        id: 'download-template',
        label: 'Download Template',
        variant: 'secondary',
        className: 'bg-green-50 text-green-700 hover:bg-green-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Downloading...';
              button.setAttribute('disabled', 'true');
            }

            // Download template from backend
            const blob = await staffService.downloadImportTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `staff_import_template.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('✅ Template downloaded successfully!', {
              description:
                'Use this template to format your staff data for import.',
              duration: 4000,
            });
          } catch (error) {
            toast.error(
              `❌ Template download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector(
              '[data-id="download-template"]',
            );
            if (button) {
              button.textContent = 'Download Template';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'import-staff',
        label: 'Import Staff',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => {
          // Create a file input element for CSV upload
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv';
          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              try {
                // Show loading state
                const button = document.querySelector(
                  '[data-id="import-staff"]',
                );
                if (button) {
                  button.textContent = 'Importing...';
                  button.setAttribute('disabled', 'true');
                }

                // Use the staff service to import
                const response = await staffService.importStaffFromCSV(file, {
                  skipDuplicates: true,
                  updateExisting: false,
                });

                if (response.success) {
                  toast.success(
                    `🎉 Import successful! ${response.data.successfulImports} staff imported successfully.`,
                    {
                      description: `Check the backend console for staff account details.`,
                      duration: 6000,
                    },
                  );
                  // Refresh the page to show new staff
                  window.location.reload();
                } else {
                  toast.error(`❌ Import failed: ${response.message}`, {
                    description: `${response.data.failedImports} staff failed to import.`,
                    duration: 5000,
                  });
                }
              } catch (error) {
                toast.error(
                  `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  {
                    description:
                      'An unexpected error occurred. Please try again.',
                    duration: 5000,
                  },
                );
              } finally {
                // Reset button state
                const button = document.querySelector(
                  '[data-id="import-staff"]',
                );
                if (button) {
                  button.textContent = 'Import Staff';
                  button.removeAttribute('disabled');
                }
              }
            }
          };
          input.click();
        },
      },
      {
        id: 'export-staff',
        label: 'Export Staff',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: async () => {
          try {
            // Show loading state
            const button = document.querySelector('[data-id="export-staff"]');
            if (button) {
              button.textContent = 'Exporting...';
              button.setAttribute('disabled', 'true');
            }

            // Get current filters from URL or page state
            const urlParams = new URLSearchParams(window.location.search);
            const department = urlParams.get('department') || '';
            const search = urlParams.get('search') || '';
            const designation = urlParams.get('designation') || '';
            const employmentStatus = urlParams.get('employmentStatus') || '';

            // Use the staff service to export
            const blob = await staffService.exportStaffToCSV({
              department: department || undefined,
              search: search || undefined,
              designation: designation || undefined,
              employmentStatus: employmentStatus || undefined,
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('✅ Export successful! Staff data downloaded.', {
              description: 'Your CSV file has been downloaded successfully.',
              duration: 4000,
            });
          } catch (error) {
            toast.error(
              `❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              {
                description: 'An unexpected error occurred. Please try again.',
                duration: 5000,
              },
            );
          } finally {
            // Reset button state
            const button = document.querySelector('[data-id="export-staff"]');
            if (button) {
              button.textContent = 'Export Staff';
              button.removeAttribute('disabled');
            }
          }
        },
      },
      {
        id: 'refresh-staff',
        label: 'Refresh',
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg',
        icon: <RefreshCw size={16} />,
        onClick: () => {
          if (onRefresh) {
            onRefresh();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
          }
        },
      },
      {
        id: 'add-staff',
        label: 'Add Staff',
        className: 'bg-orange-600 text-white hover:bg-orange-700 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'leave-requests') {
    return [
      {
        id: 'export-report',
        label: 'Export Report',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Leave Report feature coming soon!'),
      },
      {
        id: 'bulk-actions',
        label: 'Bulk Actions',
        variant: 'primary',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Plus size={16} />,
        onClick: () => alert('Bulk actions feature coming soon!'),
      },
    ];
  }

  if (pageType === 'leave-types') {
    return [
      {
        id: 'import-types',
        label: 'Import Types',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => alert('Import Leave Types feature coming soon!'),
      },
      {
        id: 'export-types',
        label: 'Export Types',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Leave Types feature coming soon!'),
      },
      {
        id: 'add-leave-type',
        label: 'Add Leave Type',
        className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }
  if (pageType === 'notices') {
    return [
      {
        id: 'import-notices',
        label: 'Import Notices',
        variant: 'import',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Upload size={16} />,
        onClick: () => alert('Import Notices feature coming soon!'),
      },
      {
        id: 'export-notices',
        label: 'Export Data',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Notices feature coming soon!'),
      },
      {
        id: 'add-notice',
        label: 'Create Notice',
        className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
        variant: 'primary',
        icon: <Plus size={16} />,
        onClick: openAddModal,
      },
    ];
  }

  if (pageType === 'complaints') {
    return [
      {
        id: 'export-report',
        label: 'Export Report',
        variant: 'export',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Download size={16} />,
        onClick: () => alert('Export Complaint Report feature coming soon!'),
      },
      {
        id: 'assign-bulk',
        label: 'Assign Bulk',
        variant: 'primary',
        className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
        icon: <Plus size={16} />,
        onClick: () => alert('Bulk assignment feature coming soon!'),
      },
    ];
  }

  // ...existing code...
  // (rest of the function remains unchanged for other pageTypes)

  if (pageType === 'reports') {
    return [
      {
        id: 'generate-report',
        label: 'Generate Report',
        variant: 'primary',
        className:
          'bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600',
        icon: (
          <svg
            width='24'
            height='24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            viewBox='0 0 24 24'
          >
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
            <line x1='16' y1='13' x2='8' y2='13' />
            <line x1='16' y1='17' x2='8' y2='17' />
            <polyline points='10 9 9 9 8 9' />
          </svg>
        ),
        onClick: () => alert('Generate Report action!'),
      },
    ];
  }

  // ...existing code...
  // (rest of the function remains unchanged for other pageTypes)

  const baseButtons: ActionButtonConfig[] =
    pageType === 'calendar'
      ? [
          {
            id: 'manage-events',
            label: 'Manage Events',
            variant: 'secondary',
            className:
              'bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg',
            icon: <Edit size={16} />,
            onClick: () => {}, // will be patched in ActionButtons
          },
        ]
      : pageType === 'students'
        ? [] // Students have their own specific configuration
        : pageType === 'subjects'
          ? [] // Remove import/export for subjects
          : [
              {
                id: 'import',
                label: 'Import',
                variant: 'import',
                className:
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
                icon: <Upload size={16} />,
                onClick: () => {
                  if (pageType === 'id-cards') {
                    alert(
                      `🆔 Import ID card data - Bulk upload card holder information and generate cards automatically. Feature coming soon!`,
                    );
                  } else {
                    alert(
                      `📥 Import ${pageType} data from external files. This feature is under development.`,
                    );
                  }
                },
              },
              {
                id: 'export',
                label: 'Export Data',
                variant: 'export',
                className:
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
                icon: <Download size={16} />,
                onClick: () => {
                  if (pageType === 'id-cards') {
                    alert(
                      `🃏 Export ID card data - Download all card information, print logs, and templates. Export starting now!`,
                    );
                  } else {
                    alert(
                      `📤 Export ${pageType} data to CSV/PDF format. Processing your request...`,
                    );
                  }
                },
              },
            ];

  const additionalButtons: ActionButtonConfig[] = [];

  if (
    pageType === 'students' ||
    pageType === 'parents' ||
    pageType === 'teachers'
  ) {
    additionalButtons.push({
      id: 'mass-emails',
      label: 'Mass Generate Emails',
      variant: 'emails',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <Mail size={16} />,
      onClick: () => {}, // will be patched in ActionButtons
    });
  }

  if (pageType === 'id-cards') {
    additionalButtons.push({
      id: 'print-selected',
      label: 'Print Selected',
      variant: 'secondary',
      className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg',
      icon: <Printer size={16} />,
      onClick: () =>
        alert(
          '📱 Print Selected - Send the selected ID cards to the printer for immediate printing!',
        ),
    });
  }

  if (
    pageType === 'staff' ||
    pageType === 'parents' ||
    pageType === 'teachers' ||
    pageType === 'students'
  ) {
    additionalButtons.push({
      id: 'send-communication',
      label: 'Send Communication',
      variant: 'communication',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <MessageSquare size={16} />,
      onClick: openSendCommModal || (() => {}),
    });
  }

  // Only add the "Add" button if not parents page and not students (students have their own config)
  if (pageType !== 'parents' && pageType !== 'students') {
    let addButtonLabel = '';
    if (pageType === 'subjects') addButtonLabel = 'Subject';
    else if (pageType === 'id-cards') addButtonLabel = 'ID Card';
    else if (pageType === 'calendar') addButtonLabel = 'Event';
    else if (pageType === 'notices') addButtonLabel = 'Notice';
    else
      addButtonLabel = pageType.charAt(0).toUpperCase() + pageType.slice(1, 7);

    additionalButtons.push({
      id: `add-${pageType === 'subjects' ? 'subject' : pageType === 'id-cards' ? 'id-card' : pageType === 'calendar' ? 'event' : pageType === 'notices' ? 'notice' : pageType.slice(0, -1)}`,
      label: `Add ${addButtonLabel}`,
      className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
      variant: 'primary',
      icon: <Plus size={16} />,
      onClick: openAddModal,
    });
  }

  return [...baseButtons, ...additionalButtons];
};

import SendCommunicationModal from '@/components/organisms/modals/SendCommunicationModal';

export const ActionButtons = ({
  pageType,
  onRefresh,
  onAddNew,
  events = [],
  hideMassEmails = false,
  hideSendCommunication = false,
}: ActionButtonsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageEventsModalOpen, setIsManageEventsModalOpen] = useState(false);
  const [isSendCommModalOpen, setIsSendCommModalOpen] = useState(false);
  const [isMassEmailModalOpen, setIsMassEmailModalOpen] = useState(false);

  const openMassEmailModal = () => setIsMassEmailModalOpen(true);
  const closeMassEmailModal = () => setIsMassEmailModalOpen(false);
  const openManageEventsModal = () => setIsManageEventsModalOpen(true);
  const closeManageEventsModal = () => setIsManageEventsModalOpen(false);
  const openAddModal = () => {
    if (onAddNew) {
      onAddNew();
    } else {
      setIsModalOpen(true);
    }
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSuccess = () => {
    console.log(`${pageType} added successfully`);
    if (onRefresh) {
      onRefresh();
    }
  };

  const actionButtonsConfig = getActionButtonsConfig(
    pageType,
    openAddModal,
    pageType === 'staff' ||
      pageType === 'parents' ||
      pageType === 'teachers' ||
      pageType === 'students'
      ? () => setIsSendCommModalOpen(true)
      : undefined,
    onRefresh,
  );

  // Filter out specific buttons if requested via props
  const filteredButtons = actionButtonsConfig.filter(b => {
    if (hideMassEmails && b.id === 'mass-emails') return false;
    if (hideSendCommunication && b.id === 'send-communication') return false;
    return true;
  });

  // Patch the onClick for Mass Generate Emails button if present
  if (
    pageType === 'students' ||
    pageType === 'parents' ||
    pageType === 'teachers'
  ) {
    const idx = actionButtonsConfig.findIndex(b => b.id === 'mass-emails');
    if (idx !== -1) {
      actionButtonsConfig[idx].onClick = openMassEmailModal;
    }
  }

  // Patch the onClick for Manage Events button if present
  if (pageType === 'calendar') {
    const idx = actionButtonsConfig.findIndex(b => b.id === 'manage-events');
    if (idx !== -1) {
      actionButtonsConfig[idx].onClick = openManageEventsModal;
    }
  }

  return (
    <>
      <div className='flex flex-col sm:flex-row gap-2 w-full'>
        {filteredButtons.map(button => (
          <div
            key={button.id}
            onClick={button.onClick}
            className='w-full sm:w-auto'
          >
            <ToggleButton
              className={
                button.className +
                ' w-full sm:w-auto text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2'
              }
              data-id={button.id}
            >
              <div className='flex items-center gap-1 sm:gap-2 justify-center'>
                {button.icon}
                <span className='text-xs sm:text-sm font-medium'>
                  {button.label}
                </span>
              </div>
            </ToggleButton>
          </div>
        ))}
      </div>

      {pageType === 'subjects' ? (
        <AddSubjectFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'id-cards' ? (
        <GenerateIDCardModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'classes' ? (
        <AddClassModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'calendar' ? (
        <AddEventModal open={isModalOpen} onClose={closeModal} />
      ) : pageType === 'notices' ? (
        <CreateNoticeModal open={isModalOpen} onClose={closeModal} />
      ) : pageType === 'teachers' ? (
        <AddTeacherFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'students' ? (
        <AddStudentFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'staff' ? (
        <AddStaffFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'fee-management' ? (
        <CreateFeeStructureModal
          isOpen={isModalOpen}
          onClose={() => {
            closeModal();
          }}
          onSuccess={() => {
            console.log('CreateFeeStructureModal onSuccess called');
            handleSuccess();
            // Add a small delay to ensure backend has committed the transaction
            setTimeout(() => {
              console.log('Calling onRefresh after delay');
              onRefresh?.();
            }, 500);
          }}
        />
      ) : pageType === 'expenses' ? (
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : pageType === 'salaries' ? (
        <AddSalaryModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : null}

      {/* Manage Events Modal for Calendar */}
      {pageType === 'calendar' && (
        <ManageEventsModal
          isOpen={isManageEventsModalOpen}
          onClose={closeManageEventsModal}
          onEventUpdated={handleSuccess}
          events={events}
        />
      )}

      {(pageType === 'staff' ||
        pageType === 'parents' ||
        pageType === 'teachers' ||
        pageType === 'students') && (
        <SendCommunicationModal
          open={isSendCommModalOpen}
          onClose={() => setIsSendCommModalOpen(false)}
        />
      )}

      {(pageType === 'students' ||
        pageType === 'parents' ||
        pageType === 'teachers') && (
        <GenerateEmailModal
          open={isMassEmailModalOpen}
          onClose={closeMassEmailModal}
          userType={
            pageType === 'students'
              ? 'student'
              : pageType === 'parents'
                ? 'parent'
                : 'teacher'
          }
        />
      )}
    </>
  );
};
