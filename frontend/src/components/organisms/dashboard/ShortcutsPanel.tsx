'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Icon from '@/components/atoms/display/Icon';
import Label from '@/components/atoms/display/Label';
import {
  UserPlus,
  Users,
  MessageSquare,
  Download,
  LucideIcon,
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  icon: LucideIcon;
  label: string;
  action: () => void;
}

interface ShortcutsPanelProps {
  onAssignSubject?: () => void;
  onAssignFaculty?: () => void;
  onComplainBox?: () => void;
  onDownloadBulkData?: () => void;
  labels?: {
    assignSubject?: string;
    assignFaculty?: string;
    complainBox?: string;
    downloadBulkData?: string;
  };
}

export default function ShortcutsPanel({
  onAssignSubject,
  onAssignFaculty,
  onComplainBox,
  onDownloadBulkData,
  labels,
}: ShortcutsPanelProps) {
  const shortcuts: ShortcutItem[] = [
    {
      id: 'assign-subject',
      icon: UserPlus,
      label: labels?.assignSubject || 'Assign Subject',
      action: onAssignSubject || (() => console.log('Assign Subject clicked')),
    },
    {
      id: 'assign-faculty',
      icon: Users,
      label: labels?.assignFaculty || 'Assign Faculty',
      action: onAssignFaculty || (() => console.log('Assign Faculty clicked')),
    },
    {
      id: 'complain-box',
      icon: MessageSquare,
      label: labels?.complainBox || 'Complain Box',
      action: onComplainBox || (() => console.log('Complain Box clicked')),
    },
    {
      id: 'download-bulk',
      icon: Download,
      label: labels?.downloadBulkData || 'Download Bulk Data',
      action:
        onDownloadBulkData || (() => console.log('Download Bulk Data clicked')),
    },
  ];

  return (
    <div className='rounded-xl p-3 sm:p-4'>
      <SectionTitle
        text='Shortcuts'
        className='text-base sm:text-lg font-semibold text-gray-900 mb-3'
      />

      <div className='space-y-2 sm:space-y-3'>
        {shortcuts.map(shortcut => (
          <div
            key={shortcut.id}
            onClick={shortcut.action}
            className='w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-border/20 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200 text-left cursor-pointer'
          >
            <Icon className='flex-shrink-0'>
              <shortcut.icon className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
            </Icon>
            <Label className='text-xs sm:text-sm font-medium text-gray-700 truncate'>
              {shortcut.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
