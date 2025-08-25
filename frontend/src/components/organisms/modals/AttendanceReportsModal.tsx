import React from 'react';
import Button from '@/components/atoms/form-controls/Button';
import Label from '@/components/atoms/display/Label';
import SectionTitle from '@/components/atoms/display/SectionTitle';

interface AttendanceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AttendanceReportsModal({
  isOpen,
  onClose,
}: AttendanceReportsModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
        <SectionTitle text='Attendance Reports' level={2} />
        <Label className='text-gray-600 mb-4'>
          Generate and view attendance reports.
        </Label>
        <div className='flex justify-end space-x-2'>
          <Button
            onClick={onClose}
            className='px-4 py-2 bg-gray-500 text-white rounded'
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
