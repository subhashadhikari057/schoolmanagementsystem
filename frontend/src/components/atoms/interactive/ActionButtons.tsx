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
} from 'lucide-react';
import AddTeacherFormModal from '@/components/organisms/modals/AddTeacherFormModal';
import AddStudentFormModal from '@/components/organisms/modals/AddStudentFormModal';
import AddStaffFormModal from '@/components/organisms/modals/AddStaffFormModal';

import AddSubjectFormModal from '@/components/organisms/modals/AddSubjectFormModal';
import GenerateIDCardModal from '@/components/organisms/modals/GenerateIDCardModal';
import AddClassModal from '@/components/organisms/modals/AddClassModal';
import GenerateEmailModal from '@/components/organisms/modals/GenerateEmailModal';

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
    | 'fee-management';
  onRefresh?: () => void;
  onAddNew?: () => void;
  events?: any[]; // For calendar events
}

const getActionButtonsConfig = (
  pageType: string,
  openAddModal: () => void,
  openSendCommModal?: () => void,
): ActionButtonConfig[] => {
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
      : [
          {
            id: 'import',
            label: 'Import',
            variant: 'import',
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
            icon: <Upload size={16} />,
            onClick: () => {
              if (pageType === 'subjects') {
                alert(
                  `📚 Import ${pageType} functionality will allow you to bulk upload subject data from CSV/Excel files. Feature coming soon!`,
                );
              } else if (pageType === 'id-cards') {
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
            className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
            icon: <Download size={16} />,
            onClick: () => {
              if (pageType === 'subjects') {
                alert(
                  `📊 Export all subject data including syllabus, schedules, and teacher assignments. Download will start shortly!`,
                );
              } else if (pageType === 'id-cards') {
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

  // Only add the "Add" button if not parents page
  if (pageType !== 'parents') {
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
  );

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
      <div className='grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full'>
        {actionButtonsConfig.map(button => (
          <div
            key={button.id}
            onClick={button.onClick}
            className='w-full sm:w-auto'
          >
            <ToggleButton className={button.className + ' w-full sm:w-auto'}>
              <div className='flex items-center gap-2 justify-center'>
                {button.icon}
                <span className='hidden sm:inline'>{button.label}</span>
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
