import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/atoms/interactive/Select';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import {
  Menu,
  Download,
  Plus,
  Eye,
  Edit,
  Copy,
  Share,
  MoreVertical,
} from 'lucide-react';

interface TimetableHeaderProps {
  grade: string;
  section: string;
  teacherName: string;
  employeeId: string;
  room: string;
  weekCount: string;
  onGradeChange: (grade: string) => void;
  onSectionChange: (section: string) => void;
  onBulkManage: () => void;
  onExport: () => void;
  onCreateSchedule: () => void;
  onViewDetails: () => void;
  onEditSchedule: () => void;
  onDuplicate: () => void;
  onExportAction: () => void;
}

const gradeOptions = [
  { value: 'Grade 10', label: 'Grade 10' },
  { value: 'Grade 11', label: 'Grade 11' },
  { value: 'Grade 12', label: 'Grade 12' },
];

const sectionOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

const actionMenuOptions = [
  { value: 'view', label: 'View Details', icon: <Eye size={16} /> },
  { value: 'edit', label: 'Edit Schedule', icon: <Edit size={16} /> },
  { value: 'duplicate', label: 'Duplicate', icon: <Copy size={16} /> },
  { value: 'export', label: 'Export', icon: <Share size={16} /> },
];

export default function TimetableHeader({
  grade,
  section,
  teacherName,
  employeeId,
  room,
  weekCount,
  onGradeChange,
  onSectionChange,
  onBulkManage,
  onExport,
  onCreateSchedule,
  onViewDetails,
  onEditSchedule,
  onDuplicate,
  onExportAction,
}: TimetableHeaderProps) {
  const [showActionMenu, setShowActionMenu] = useState(false);

  const handleActionSelect = (action: string) => {
    switch (action) {
      case 'view':
        onViewDetails();
        break;
      case 'edit':
        onEditSchedule();
        break;
      case 'duplicate':
        onDuplicate();
        break;
      case 'export':
        onExportAction();
        break;
    }
    setShowActionMenu(false);
  };

  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Class Timetable Viewer
            </h1>
            <p className='text-sm text-gray-600'>
              View detailed class schedules with teacher and room information
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={onBulkManage}
              leftIcon={<Menu size={16} />}
            >
              Bulk Manager
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={onExport}
              leftIcon={<Download size={16} />}
            >
              Export Current
            </Button>
            <Button
              size='sm'
              onClick={onCreateSchedule}
              leftIcon={<Plus size={16} />}
            >
              Create Schedule
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Grade and Section Selectors */}
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Grade:
              </label>
              <Select
                options={gradeOptions}
                value={grade}
                onChange={e => onGradeChange(e.target.value)}
                className='w-full'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Section:
              </label>
              <Select
                options={sectionOptions}
                value={section}
                onChange={e => onSectionChange(e.target.value)}
                className='w-full'
              />
            </div>
          </div>

          {/* Teacher Information */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>{employeeId}</span>
              <span className='text-sm text-gray-600'>Room {room}</span>
            </div>
            <h3 className='font-semibold text-lg'>{teacherName}</h3>
            <p className='text-sm text-gray-600'>{weekCount}/week</p>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2 lg:justify-end'>
            <Button variant='outline' size='sm' onClick={onViewDetails}>
              View Details
            </Button>
            <Button variant='outline' size='sm' onClick={onEditSchedule}>
              Edit Schedule
            </Button>
            <Button variant='outline' size='sm' onClick={onDuplicate}>
              Duplicate
            </Button>
            <Button variant='outline' size='sm' onClick={onExportAction}>
              Export
            </Button>

            <div className='relative'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowActionMenu(!showActionMenu)}
              >
                <MoreVertical size={16} />
              </Button>

              {showActionMenu && (
                <Dropdown
                  type='filter'
                  options={actionMenuOptions}
                  onSelect={handleActionSelect}
                  className='absolute right-0 top-full mt-1 z-10'
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
