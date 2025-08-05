import React, { useState } from 'react';
import ToggleButton from '../form-controls/ToggleButton';
import { Download, Upload, Mail, MessageSquare, Plus } from 'lucide-react';
import AddUserFormModal, {
  UserType,
} from '@/components/organisms/modals/AddUserFormModal';

interface ActionButtonConfig {
  id: string;
  label: string;
  variant: string;
  className?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ActionButtonsProps {
  pageType: 'students' | 'teachers' | 'parents' | 'staff';
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
      onClick: () => console.log(`Import ${pageType} clicked`),
    },
    {
      id: 'export',
      label: 'Export Data',
      variant: 'export',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <Download size={16} />,
      onClick: () => console.log(`Export ${pageType} clicked`),
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
      onClick: () => console.log('Mass Generate Emails clicked'),
    });
  }

  if (pageType !== 'staff') {
    additionalButtons.push({
      id: 'send-communication',
      label: 'Send Communication',
      variant: 'communication',
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
      icon: <MessageSquare size={16} />,
      onClick: () => console.log('Send Communication clicked'),
    });
  }

  // Add the primary action button
  const addButtonLabel =
    pageType.charAt(0).toUpperCase() + pageType.slice(1, 7);
  additionalButtons.push({
    id: `add-${pageType.slice(0, -1)}`,
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

      <AddUserFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        userType={userType}
      />
    </>
  );
};
