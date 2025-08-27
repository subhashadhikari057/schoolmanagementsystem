'use client';

import React, { useState, useEffect } from 'react';
import { GenericList } from '@/components/templates/GenericList';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import LeaveTypeModal from '@/components/organisms/modals/LeaveTypeModal';
import { Plus, Edit, Trash2, Eye, List, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import { QueryLeaveTypeRequest } from '@/api/services/leave-type.service';
import { showConfirmation } from '@/utils/confirmation-toast';

export default function LeaveTypesPage() {
  const {
    leaveTypes,
    stats,
    loading,
    error,
    fetchLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    toggleStatus,
    totalTypes,
    paidTypes,
    activeTypes,
    inactiveTypes,
  } = useLeaveTypes();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedLeaveType, setSelectedLeaveType] = useState<any>(null);

  // Calculate stats dynamically from hook data
  const statsData = [
    {
      icon: List,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: totalTypes.toString(),
      label: 'Total Leave Types',
      change: '2 new',
      isPositive: true,
    },
    {
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: paidTypes.toString(),
      label: 'Paid Leave Types',
      change: '1 new',
      isPositive: true,
    },
    {
      icon: List,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: activeTypes.toString(),
      label: 'Active Types',
      change: '100%',
      isPositive: true,
    },
    {
      icon: List,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: inactiveTypes.toString(),
      label: 'Inactive Types',
      change: '16.7%',
      isPositive: false,
    },
  ];

  // Handle actions
  const handleViewLeaveType = (leaveType: any) => {
    toast.info(`Viewing details for ${leaveType.name}`);
    // TODO: Implement view modal
  };

  const handleEditLeaveType = (leaveType: any) => {
    setSelectedLeaveType(leaveType);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteLeaveType = async (leaveType: any) => {
    showConfirmation({
      title: `Delete Leave Type "${leaveType.name}"?`,
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteLeaveType(leaveType.id);
          // State is automatically updated by the hook
        } catch (error) {
          // Error handling is done in the hook
        }
      },
    });
  };

  const handleToggleStatus = async (leaveType: any) => {
    const action = leaveType.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const actionText =
      leaveType.status === 'ACTIVE' ? 'Deactivate' : 'Activate';

    showConfirmation({
      title: `${actionText} Leave Type`,
      message: `Are you sure you want to ${action} "${leaveType.name}"?`,
      confirmText: actionText,
      type: 'warning',
      onConfirm: async () => {
        try {
          await toggleStatus(leaveType.id);
          // State is automatically updated by the hook
        } catch (error) {
          // Error handling is done in the hook
        }
      },
    });
  };

  const handleAddNewLeaveType = () => {
    setSelectedLeaveType(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    // State is automatically updated by the hook
    // No need to refresh manually
  };

  const handleRefresh = async () => {
    try {
      await fetchLeaveTypes();
      toast.success('Leave types refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh leave types');
    }
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      fetchLeaveTypes();
      return;
    }

    const query: QueryLeaveTypeRequest = {
      name: term,
    };
    fetchLeaveTypes(query);
  };

  const handlePrimaryFilterChange = (value: string) => {
    if (value === 'all') {
      fetchLeaveTypes();
      return;
    }

    const query: QueryLeaveTypeRequest = {
      status: value.toUpperCase(),
    };
    fetchLeaveTypes(query);
  };

  const handleSecondaryFilterChange = (value: string) => {
    if (value === 'all') {
      fetchLeaveTypes();
      return;
    }

    const query: QueryLeaveTypeRequest = {
      isPaid: value === 'true',
    };
    fetchLeaveTypes(query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // TODO: Implement pagination
  };

  // Custom configuration for leave types
  const leaveTypesConfig = {
    title: 'Leave Type Management',
    searchPlaceholder: 'Search leave types by name or description...',
    primaryFilter: {
      title: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    secondaryFilter: {
      title: 'Paid Leave',
      options: [
        { value: 'all', label: 'All' },
        { value: 'true', label: 'Paid' },
        { value: 'false', label: 'Unpaid' },
      ],
    },
    columns: [
      {
        key: 'name',
        header: 'Leave Type Name',
        render: (item: any) => (
          <div className='font-medium text-gray-900'>{item.name}</div>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        render: (item: any) => (
          <div className='text-sm text-gray-600 max-w-xs truncate'>
            {item.description}
          </div>
        ),
      },
      {
        key: 'maxDays',
        header: 'Max Days',
        render: (item: any) => (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            {item.maxDays} days
          </span>
        ),
      },
      {
        key: 'isPaid',
        header: 'Paid Leave',
        render: (item: any) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.isPaid
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.isPaid ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (item: any) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (item: any) => (
          <div className='flex items-center gap-2'>
            <button
              onClick={() => handleViewLeaveType(item)}
              className='p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded'
              title='View Details'
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleEditLeaveType(item)}
              className='p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded'
              title='Edit Leave Type'
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleToggleStatus(item)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                item.status === 'ACTIVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  item.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <button
              onClick={() => handleDeleteLeaveType(item)}
              className='p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded'
              title='Delete Leave Type'
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    emptyMessage: 'No leave types found',
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Mobile-optimized header */}
      <div className='px-3 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4'>
        <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>
          Leave Type Management
        </h1>
        <p className='text-xs sm:text-sm lg:text-base text-gray-600 mt-1'>
          Manage different types of leave available in the system.
        </p>
      </div>

      <div className='px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8'>
        <div className='max-w-7xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6 mt-4 sm:mt-5 lg:mt-6'>
          {/* Stats Grid */}
          <Statsgrid stats={statsData} />

          <GenericList
            config={leaveTypesConfig}
            data={leaveTypes}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalTypes}
            itemsPerPage={itemsPerPage}
            onSearch={handleSearch}
            onPrimaryFilterChange={handlePrimaryFilterChange}
            onSecondaryFilterChange={handleSecondaryFilterChange}
            onPageChange={handlePageChange}
            customActions={
              <ActionButtons
                pageType='leave-types'
                onRefresh={handleRefresh}
                onAddNew={handleAddNewLeaveType}
              />
            }
          />
        </div>
      </div>

      {/* Leave Type Modal */}
      <LeaveTypeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        leaveType={selectedLeaveType}
        mode={modalMode}
        onCreateLeaveType={createLeaveType}
        onUpdateLeaveType={updateLeaveType}
      />
    </div>
  );
}
