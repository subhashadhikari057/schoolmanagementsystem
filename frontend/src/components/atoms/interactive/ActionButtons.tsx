import React, { useState } from 'react';
import ToggleButton from '../form-controls/ToggleButton';
import {
  Download,
  Upload,
  Mail,
  MessageSquare,
  Plus,
  Calendar,
  Users,
  CreditCard,
  Printer,
  QrCode,
} from 'lucide-react';
import AddUserFormModal, {
  UserType,
} from '@/components/organisms/modals/AddUserFormModal';
import AddSubjectFormModal from '@/components/organisms/modals/AddSubjectFormModal';
import GenerateIDCardModal from '@/components/organisms/modals/GenerateIDCardModal';
import AddClassModal from '@/components/organisms/modals/AddClassModal';

interface ActionButtonConfig {
  id: string;
  label: string;
  variant: string;
  className?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ActionButtonsProps {
  pageType:
    | 'students'
    | 'teachers'
    | 'parents'
    | 'staff'
    | 'subjects'
    | 'id-cards'
    | 'classes';
}

const getActionButtonsConfig = (
  pageType: string,
  openAddModal: () => void,
): ActionButtonConfig[] => {
  const baseButtons: ActionButtonConfig[] = [
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

  // Add additional buttons based on page type
  const additionalButtons: ActionButtonConfig[] = [];

  if (pageType === 'students') {
    additionalButtons.push({
      id: 'mass-emails',
      label: 'Mass Generate Emails',
      variant: 'emails',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <Mail size={16} />,
      onClick: () =>
        alert(
          '📧 Mass Email Generation - Create bulk email accounts for all selected students with automated password distribution!',
        ),
    });
  }

  if (pageType === 'subjects') {
    additionalButtons.push(
      {
        id: 'subject-schedule',
        label: 'Schedule',
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg',
        icon: <Calendar size={16} />,
        onClick: () =>
          alert(
            '📅 Subject Schedule Management - Configure class timings, room assignments, and recurring schedules for all subjects!',
          ),
      },
      {
        id: 'assign-teachers',
        label: 'Assign Teachers',
        variant: 'secondary',
        className: 'bg-green-50 text-green-700 hover:bg-green-100 rounded-lg',
        icon: <Users size={16} />,
        onClick: () =>
          alert(
            '👥 Teacher Assignment - Link qualified teachers to subjects based on expertise and availability!',
          ),
      },
    );
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
    pageType !== 'staff' &&
    pageType !== 'subjects' &&
    pageType !== 'id-cards' &&
    pageType !== 'classes'
  ) {
    additionalButtons.push({
      id: 'send-communication',
      label: 'Send Communication',
      variant: 'communication',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <MessageSquare size={16} />,
      onClick: () =>
        alert(
          `📢 Send Communication - Broadcast messages, announcements, and updates to all ${pageType}!`,
        ),
    });
  }

  // Add the primary action button
  const addButtonLabel =
    pageType === 'subjects'
      ? 'Subject'
      : pageType === 'id-cards'
        ? 'ID Card'
        : pageType.charAt(0).toUpperCase() + pageType.slice(1, 7);

  additionalButtons.push({
    id: `add-${pageType === 'subjects' ? 'subject' : pageType === 'id-cards' ? 'id-card' : pageType.slice(0, -1)}`,
    label: `Add ${addButtonLabel}`,
    className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
    variant: 'primary',
    icon: <Plus size={16} />,
    onClick: openAddModal,
  });

  return [...baseButtons, ...additionalButtons];
};

export const ActionButtons = ({ pageType }: ActionButtonsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openAddModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSuccess = () => {
    // This will be called when the form is successfully submitted
    // You can add additional logic here like refreshing the list
    console.log(`${pageType} added successfully`);
    // You might want to trigger a refresh of the parent component data here
  };

  const actionButtonsConfig = getActionButtonsConfig(pageType, openAddModal);

  // Convert plural pageType to singular userType
  const getUserType = (pageType: string): UserType => {
    switch (pageType) {
      case 'teachers':
        return 'teacher';
      case 'students':
        return 'student';
      case 'parents':
        return 'parent';
      case 'staff':
        return 'staff'; // Staff is already singular
      default:
        return 'student'; // fallback
    }
  };

  const userType = getUserType(pageType);

  return (
    <>
      <div className='flex gap-2'>
        {actionButtonsConfig.map(button => (
          <div key={button.id} onClick={button.onClick}>
            <ToggleButton className={button.className}>
              <div className='flex items-center gap-2'>
                {button.icon}
                <span>{button.label}</span>
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
      ) : (
        <AddUserFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={handleSuccess}
          userType={userType}
        />
      )}
    </>
  );
};
