'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GenericList from '@/components/templates/GenericList';
import ParentSearchFilter, {
  ParentFilters,
} from '@/components/molecules/filters/ParentSearchFilter';
import {
  getListConfig,
  Parent,
} from '@/components/templates/listConfigurations';
// import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import {
  Users,
  UserCheck,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  parentService,
  ParentResponse,
  ParentQueryParams,
} from '@/api/services/parent.service';
import ParentViewModal from '@/components/organisms/modals/ParentViewModal';
import ParentEditModal from '@/components/organisms/modals/ParentEditModal';

const ParentsPage = () => {
  // State for parents data
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ParentFilters>({
    search: '',
    occupation: '',
    status: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });

  // Transform backend ParentResponse to frontend Parent interface
  const transformParentData = (
    backendParent: ParentResponse,
  ): Parent | null => {
    // Filter out soft-deleted children (children with deletedAt not null)
    const activeChildren = (backendParent.children || []).filter(
      child => !child.deletedAt || child.deletedAt === null,
    );

    // If parent has no active children, don't include them in the list
    // (This handles the case where all children were soft-deleted)
    if (activeChildren.length === 0) {
      return null;
    }

    const linkedStudents = activeChildren.map(child => child.id);

    return {
      id: backendParent.id,
      userId: backendParent.userId,
      name: backendParent.fullName,
      fullName: backendParent.fullName,
      email: backendParent.email,
      phone: backendParent.phone,
      accountStatus: backendParent.deletedAt ? 'Inactive' : 'Active',
      occupation: backendParent.profile?.occupation,
      workPlace: backendParent.profile?.workPlace,
      workPhone: backendParent.profile?.workPhone,
      job: backendParent.profile?.occupation,
      profile: backendParent.profile,
      children: activeChildren.map(child => ({
        ...child,
        name: child.fullName,
        grade: child.classId || 'N/A',
        studentId: child.id,
        profilePhotoUrl: child.profilePhotoUrl,
        avatar: child.avatar,
      })),
      linkedStudents,
      contact: backendParent.phone,
      address: backendParent.profile?.address
        ? `${backendParent.profile.address.street || ''} ${backendParent.profile.address.city || ''}`.trim()
        : undefined,
      createdAt: backendParent.createdAt,
      updatedAt: backendParent.updatedAt,
      deletedAt: backendParent.deletedAt,
    };
  };

  // Fetch parents data from backend
  const fetchParents = useCallback(
    async (page: number = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        const params: ParentQueryParams = {
          page,
          limit: itemsPerPage,
        };

        const response = await parentService.getAllParents(params);

        if (response.success && response.data) {
          const transformedParents = response.data.parents
            .map(transformParentData)
            .filter((parent): parent is Parent => parent !== null);
          setParents(transformedParents);
          setTotalPages(response.data.totalPages);
          setTotalItems(response.data.total);
          setCurrentPage(response.data.page);

          // Calculate stats
          const activeParents = transformedParents.filter(
            p => p.accountStatus === 'Active',
          ).length;
          const inactiveParents = transformedParents.filter(
            p => p.accountStatus === 'Inactive',
          ).length;
          const pendingParents = transformedParents.filter(
            p => p.accountStatus === 'Pending',
          ).length;

          setStats({
            total: response.data.total,
            active: activeParents,
            inactive: inactiveParents,
            pending: pendingParents,
          });
        } else {
          setError(response.message || 'Failed to fetch parents data');
          toast.error('Failed to load parents data');
        }
      } catch (err) {
        console.error('Error fetching parents:', err);
        setError('Failed to fetch parents data');
        toast.error('Failed to load parents data');
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage],
  );

  // Load data on component mount and page changes
  useEffect(() => {
    fetchParents(currentPage);
  }, [currentPage, fetchParents]);

  // Filter parents when filters or parents change
  useEffect(() => {
    let filtered = parents;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          p.phone?.toLowerCase().includes(searchLower),
      );
    }
    if (filters.occupation) {
      filtered = filtered.filter(p => p.occupation === filters.occupation);
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.accountStatus === filters.status);
    }
    setFilteredParents(filtered);
  }, [filters, parents]);
  // Occupation and status options for filter
  const occupationOptions = Array.from(
    new Set(
      parents
        .map(p => p.occupation)
        .filter((o): o is string => typeof o === 'string' && o.length > 0),
    ),
  ).map(o => ({ value: o, label: o }));
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Pending', label: 'Pending' },
  ];

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Action handlers for parent rows
  const handleParentAction = (action: string, parent: Parent) => {
    switch (action) {
      case 'view':
        setSelectedParent(parent);
        setIsViewModalOpen(true);
        break;
      case 'edit':
        setSelectedParent(parent);
        setIsEditModalOpen(true);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${parent.name}?`)) {
          handleDeleteParent(parent);
        }
        break;
      case 'status':
        toast.info(`Toggle status for: ${parent.name}`);
        // TODO: Call status change API
        break;
      default:
        console.log('Action:', action, 'for parent:', parent.id);
    }
  };

  // Handle parent deletion
  const handleDeleteParent = async (parent: Parent) => {
    try {
      setIsLoading(true);
      const response = await parentService.deleteParent(parent.id);

      if (response.success) {
        toast.success(`Parent ${parent.name} deleted successfully`);
        fetchParents(currentPage); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to delete parent');
      }
    } catch (err) {
      console.error('Error deleting parent:', err);
      toast.error('Failed to delete parent');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful edit
  const handleEditSuccess = () => {
    fetchParents(currentPage); // Refresh the list
  };

  // Parent-specific stats data using real data
  const parentStats = [
    {
      icon: Users,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      value: stats.total.toString(),
      label: 'Total Parents',
      change: '2.1%',
      isPositive: true,
    },
    {
      icon: UserCheck,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      value: stats.active.toString(),
      label: 'Active Parents',
      change: '1.5%',
      isPositive: true,
    },
    {
      icon: Phone,
      bgColor: 'bg-yellow-600',
      iconColor: 'text-white',
      value: stats.pending.toString(),
      label: 'Pending Verification',
      change: '8.2%',
      isPositive: false,
    },
    {
      icon: Mail,
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      value: stats.inactive.toString(),
      label: 'Inactive',
      change: '0.5%',
      isPositive: false,
    },
  ];

  // Loading component
  if (isLoading && parents.length === 0) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>Loading parents data...</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error && parents.length === 0) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='h-8 w-8 mx-auto mb-4 text-red-600' />
          <p className='text-gray-600 mb-4'>Failed to load parents data</p>
          <button
            onClick={() => fetchParents(currentPage)}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='w-full'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            Parent Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Manage All Parent Related Info Here
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='w-full'>
          <Statsgrid stats={parentStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='w-full'>
          {/* Parent Search Bar & Filters */}
          <ParentSearchFilter
            onFilterChange={setFilters}
            occupations={occupationOptions}
            statuses={statusOptions}
            initialFilters={filters}
          />
          <div className='mt-4'></div>
          {/* Parent List - Using Filtered Data */}
          <GenericList<Parent>
            config={getListConfig('parents')}
            data={filteredParents}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemAction={handleParentAction}
            // customActions={<ActionButtons pageType='parents' hideMassEmails hideSendCommunication />}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Parent View Modal */}
      <ParentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        parent={selectedParent}
      />

      {/* Parent Edit Modal */}
      <ParentEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        parent={selectedParent}
      />
    </div>
  );
};

export default ParentsPage;
