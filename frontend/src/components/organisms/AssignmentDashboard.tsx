import React, { useState } from 'react';
import { FiClipboard, FiEye } from 'react-icons/fi';
import MarkAttendanceModal from './modals/MarkAttendanceModal';
const FiClipboardIcon = FiClipboard as any;

const stats = [
  {
    label: 'Active Assignments',
    value: 24,
    color: 'bg-blue-100',
    iconBg: 'bg-blue-600',
    icon: <FiClipboardIcon className='text-white' />,
  },
  {
    label: 'Submissions Today',
    value: 156,
    color: 'bg-green-100',
    iconBg: 'bg-green-500',
    icon: <FiClipboardIcon className='text-white' />,
  },
  {
    label: 'Pending Review',
    value: 89,
    color: 'bg-yellow-100',
    iconBg: 'bg-yellow-400',
    icon: <FiClipboardIcon className='text-white' />,
  },
  {
    label: 'Overdue',
    value: 12,
    color: 'bg-red-100',
    iconBg: 'bg-red-500',
    icon: <FiClipboardIcon className='text-white' />,
  },
];

const AssignmentDashboard: React.FC<{ onCreate: () => void }> = ({
  onCreate,
}) => {
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

  return (
    <>
      <div className='p-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 flex flex-col items-start shadow-sm border ${stat.color}`}
            >
              <div className={`rounded-full p-2 mb-2 ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <div className='text-sm text-gray-600 font-medium'>
                {stat.label}
              </div>
              <div className='text-2xl font-bold'>{stat.value}</div>
            </div>
          ))}
        </div>
        <div className='bg-white rounded-lg shadow-sm border flex flex-col items-center justify-center py-16'>
          <FiClipboardIcon className='text-5xl text-gray-300 mb-4' />
          <div className='text-lg font-semibold mb-2'>
            Assignment Management
          </div>
          <div className='text-gray-500 mb-6'>
            Create, assign, and track student assignments and submissions
          </div>
          <div className='flex gap-3'>
            <button
              className='px-5 py-2 rounded bg-blue-600 text-white font-medium'
              onClick={onCreate}
            >
              + Create Assignment
            </button>
            <button
              className='px-5 py-2 rounded border font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors'
              onClick={() => setIsAttendanceModalOpen(true)}
            >
              <FiEye /> View All Assignments
            </button>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />
    </>
  );
};

export default AssignmentDashboard;
