'use client';

import React, { useState } from 'react';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import Button from '@/components/atoms/form-controls/Button';
import StatusBadge from '@/components/atoms/data/StatusBadge';
// Removed Panel import
import { useRouter } from 'next/navigation';

// Mock data for complaints
const mockComplaints = [
  {
    id: '1',
    title: 'Difficulty understanding Science concepts',
    date: '2023-08-15',
    time: 'N/A',
    location: 'Class 8-A',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Lab equipment safety concerns',
    date: '2023-08-14',
    time: 'N/A',
    location: 'Class 7-B',
    status: 'approved',
  },
];

// Mock data for leave requests
const mockLeaveRequests = [
  {
    id: '1',
    title: 'Annual Leave',
    date: '2023-08-20',
    time: '3 days',
    location: 'Family wedding celebration',
    status: 'approved',
  },
  {
    id: '2',
    title: 'Sick Leave',
    date: '2023-08-15',
    time: '1 day',
    location: 'Doctor appointment for routine checkup',
    status: 'pending',
  },
];

// Modal for submitting complaint/leave
interface ModalProps {
  open: boolean;
  onClose: () => void;
  type: 'complaint' | 'leave';
  onSubmit: (
    value:
      | { complaintTitle: string; complaintDetails: string }
      | {
          leaveType: string;
          startDate: string;
          endDate: string;
          reason: string;
          emergencyContact: string;
        },
  ) => void;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, type, onSubmit }) => {
  // Leave request form state
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  // Complaint form state
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');

  return open ? (
    <div className='fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-lg font-bold mb-4'>
          Submit {type === 'complaint' ? 'Complaint' : 'Leave Request'}
        </h2>
        {type === 'leave' ? (
          <form
            className='space-y-6 w-full'
            onSubmit={e => {
              e.preventDefault();
              onSubmit({
                leaveType,
                startDate,
                endDate,
                reason,
                emergencyContact,
              });
              onClose();
            }}
          >
            <div>
              <label className='block mb-2 font-medium'>
                Leave Type <span className='text-red-500'>*</span>
              </label>
              <select
                className='w-full border rounded p-2 mb-4'
                value={leaveType}
                onChange={e => setLeaveType(e.target.value)}
                required
              >
                <option value=''>Select leave type</option>
                <option value='annual'>Annual Leave</option>
                <option value='sick'>Sick Leave</option>
                <option value='casual'>Casual Leave</option>
                <option value='emergency'>Emergency Leave</option>
              </select>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block mb-2 font-medium'>
                  Start Date <span className='text-red-500'>*</span>
                </label>
                <input
                  type='date'
                  className='w-full border rounded p-2 mb-4'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className='block mb-2 font-medium'>
                  End Date <span className='text-red-500'>*</span>
                </label>
                <input
                  type='date'
                  className='w-full border rounded p-2 mb-4'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className='block mb-2 font-medium'>
                Reason for Leave <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className='w-full border rounded p-2 mb-4'
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                placeholder='Please provide a detailed reason for your leave request...'
              />
            </div>
            <div>
              <label className='block mb-2 font-medium'>
                Emergency Contact (Optional)
              </label>
              <input
                type='text'
                className='w-full border rounded p-2 mb-4'
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder='Contact number in case of emergency'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                onClick={onClose}
                className='bg-gray-200 text-gray-700 px-4 py-2 rounded'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-blue-600 text-white px-4 py-2 rounded'
              >
                Submit
              </Button>
            </div>
          </form>
        ) : (
          <form
            className='space-y-6 w-full'
            onSubmit={e => {
              e.preventDefault();
              onSubmit({ complaintTitle, complaintDetails });
              onClose();
            }}
          >
            <div>
              <label className='block mb-2 font-medium'>
                Complaint Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                className='w-full border rounded p-2 mb-4'
                value={complaintTitle}
                onChange={e => setComplaintTitle(e.target.value)}
                required
                placeholder='Short summary of your complaint'
              />
            </div>
            <div>
              <label className='block mb-2 font-medium'>
                Complaint Details <span className='text-red-500'>*</span>
              </label>
              <textarea
                className='w-full border rounded p-2 mb-4'
                rows={4}
                value={complaintDetails}
                onChange={e => setComplaintDetails(e.target.value)}
                required
                placeholder='Describe your issue or concern in detail...'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                onClick={onClose}
                className='bg-gray-200 text-gray-700 px-4 py-2 rounded'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-blue-600 text-white px-4 py-2 rounded'
              >
                Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  ) : null;
};

export const ComplaintsAndLeavePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'complaint' | 'leave'>('leave');
  const [complaints, setComplaints] = useState(mockComplaints);
  const [leaveRequests, setLeaveRequests] = useState(mockLeaveRequests);
  const router = useRouter();

  // Tab content with approved/unapproved sections
  // Custom card list for complaints and leave requests
  interface CardListProps {
    title: string;
    items: Array<{
      id: string;
      title: string;
      date: string;
      time: string;
      location: string;
      status: string;
    }>;
  }

  const CardList = ({ title, items }: CardListProps) => (
    <div className='mb-6'>
      <h4 className='font-semibold mb-2'>{title}</h4>
      <div className='flex flex-col gap-4'>
        {items.length === 0 ? (
          <div className='text-gray-500 text-sm'>No items found.</div>
        ) : (
          items.map((event: CardListProps['items'][0]) => (
            <div
              key={event.id}
              className='bg-white rounded-lg p-6 shadow border flex flex-col gap-2'
            >
              <div className='flex justify-between items-center mb-2'>
                <span className='font-medium'>{event.title}</span>
                <StatusBadge status={event.status} />
              </div>
              <div className='text-sm text-gray-500 mb-1'>
                Date: {event.date} {event.time !== 'N/A' && `• ${event.time}`} •{' '}
                {event.location}
              </div>
              <Button className='bg-gray-100 text-gray-700 px-4 py-2 rounded w-fit'>
                View Details
              </Button>
              {/* Parent approve/reject buttons for leave requests */}
              {title.toLowerCase().includes('leave') &&
                event.status === 'pending' && (
                  <div className='flex gap-2 mt-2'>
                    <Button
                      className='bg-green-500 text-white px-4 py-2 rounded'
                      onClick={() => handleParentAction(event.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      className='bg-red-500 text-white px-4 py-2 rounded'
                      onClick={() => handleParentAction(event.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
  // Parent action handler for leave requests
  const handleParentAction = (id: string, newStatus: string) => {
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)),
    );
  };

  const tabs = [
    {
      name: 'Complaints',
      content: (
        <>
          <div className='mb-2 flex justify-between items-center'>
            <span className='text-sm text-gray-500'>
              Total: {complaints.length}
            </span>
            <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
              {complaints.filter(c => c.status === 'pending').length} pending
            </span>
          </div>
          <CardList
            title='Approved Complaints'
            items={complaints.filter(c => c.status === 'approved')}
          />
          <CardList
            title='Unapproved (Pending) Complaints'
            items={complaints.filter(c => c.status === 'pending')}
          />
        </>
      ),
    },
    {
      name: 'Leave Requests',
      content: (
        <>
          <div className='mb-2 flex justify-between items-center'>
            <span className='text-sm text-gray-500'>
              Total: {leaveRequests.length}
            </span>
            <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>
              {leaveRequests.filter(l => l.status === 'pending').length} pending
            </span>
          </div>
          <CardList
            title='Approved Leave Requests'
            items={leaveRequests.filter(l => l.status === 'approved')}
          />
          <CardList
            title='Unapproved (Pending) Leave Requests'
            items={leaveRequests.filter(l => l.status === 'pending')}
          />
        </>
      ),
    },
  ];

  // Add new complaint or leave request
  const handleSubmit = (value: any) => {
    if (modalType === 'complaint') {
      setComplaints([
        ...complaints,
        {
          id: String(complaints.length + 1),
          title: value.complaintTitle,
          date: new Date().toISOString().slice(0, 10),
          time: 'N/A',
          location: 'Class 10-A',
          status: 'pending',
        },
      ]);
    } else {
      setLeaveRequests([
        ...leaveRequests,
        {
          id: String(leaveRequests.length + 1),
          title: value.reason,
          date: value.startDate,
          time: `${value.startDate} to ${value.endDate}`,
          location: value.leaveType,
          status: 'pending',
        },
      ]);
    }
  };

  return (
    <div className='p-4 sm:p-6'>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        onSubmit={handleSubmit}
      />
      <div className='mb-6'>
        <SectionTitle text='Requests' className='mb-1' />
        <p className='text-gray-500'>Manage complaints and leave requests</p>
      </div>
      {/* Stats Overview */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-blue-500 rounded-lg p-4 text-white text-center'>
          <h3 className='text-2xl font-bold'>
            {complaints.filter(c => c.status === 'pending').length}
          </h3>
          <p className='text-sm'>Pending Complaints</p>
        </div>
        <div className='bg-blue-500 rounded-lg p-4 text-white text-center'>
          <h3 className='text-2xl font-bold'>
            {leaveRequests.filter(l => l.status === 'pending').length}
          </h3>
          <p className='text-sm'>Pending Leave</p>
        </div>
      </div>
      {/* Quick Actions */}
      <div className='mb-6'>
        <h2 className='text-lg font-medium mb-4'>Quick Actions</h2>
        <div className='flex gap-4'>
          <div className='rounded-lg p-4 w-full'>
            <button
              type='button'
              onClick={() => {
                setModalType('leave');
                setModalOpen(true);
              }}
              className='flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              <div className='rounded-full bg-blue-100 p-3'>
                <CalendarDays className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h3 className='font-medium'>Request Leave</h3>
                <p className='text-sm text-gray-500'>
                  Apply for personal leave
                </p>
              </div>
            </button>
          </div>
          <div className='rounded-lg p-4 w-full'>
            <button
              type='button'
              onClick={() => {
                setModalType('complaint');
                setModalOpen(true);
              }}
              className='flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              <div className='rounded-full bg-yellow-100 p-3'>
                <AlertCircle className='h-6 w-6 text-yellow-600' />
              </div>
              <div>
                <h3 className='font-medium'>Submit a Complaint</h3>
                <p className='text-sm text-gray-500'>
                  Raise a concern or issue
                </p>
              </div>
            </button>
          </div>
        </div>
        {/* Overview */}
        <div className='mb-6'>
          <h2 className='text-lg font-medium mb-4'>Overview</h2>
          <Tabs tabs={tabs} defaultIndex={activeTab} />
        </div>
      </div>
    </div>
  );
};

export default ComplaintsAndLeavePage;
