'use client';

import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/molecules/cards/StatCard';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  X,
  Calendar,
  MessageSquare,
  CheckCircle,
  Edit3,
  Search,
} from 'lucide-react';
import { GenericList } from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import {
  complaintService,
  Complaint,
  ComplaintQueryParams,
} from '@/api/services/complaint.service';
import { teacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';
import Button from '@/components/atoms/form-controls/Button';
import { useAuth } from '@/hooks/useAuth';
import SectionTitle from '@/components/atoms/display/SectionTitle';

const ComplaintManagement: React.FC = () => {
  // Helper function to format status display
  const formatStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      default:
        return status;
    }
  }, []);

  // Helper function to get complaint type color
  const getComplaintTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-800';
      case 'BEHAVIORAL':
        return 'bg-orange-100 text-orange-800';
      case 'FACILITY':
        return 'bg-purple-100 text-purple-800';
      case 'SAFETY':
        return 'bg-red-100 text-red-800';
      case 'BULLYING':
        return 'bg-pink-100 text-pink-800';
      case 'DISCIPLINARY':
        return 'bg-indigo-100 text-indigo-800';
      case 'FINANCIAL':
        return 'bg-amber-100 text-amber-800';
      case 'ADMINISTRATIVE':
        return 'bg-teal-100 text-teal-800';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [teacherSelectionModalOpen, setTeacherSelectionModalOpen] =
    useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [complaintToAssign, setComplaintToAssign] = useState<Complaint | null>(
    null,
  );
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(
    null,
  );

  const { user } = useAuth();

  // Load complaints on component mount
  useEffect(() => {
    loadComplaints();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = complaints;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        complaint => complaint.status === statusFilter,
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(
        complaint => complaint.priority === priorityFilter,
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        complaint =>
          complaint.title.toLowerCase().includes(searchLower) ||
          complaint.description.toLowerCase().includes(searchLower) ||
          complaint.complainant?.fullName.toLowerCase().includes(searchLower) ||
          complaint.type.toLowerCase().includes(searchLower) ||
          (complaint._count?.responses &&
            complaint._count.responses.toString().includes(searchLower)),
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  // Load responses when modal opens
  useEffect(() => {
    if (detailModalOpen && selectedComplaint) {
      loadResponses(selectedComplaint.id);
    }
  }, [detailModalOpen, selectedComplaint]);

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const response = await complaintService.getAllComplaints({
        limit: 100,
        page: 1,
        recipientType: 'ADMINISTRATION', // Only show complaints assigned to administration
      });

      if (response.success && response.data) {
        const complaintsData = response.data.complaints;
        setComplaints(complaintsData);

        // Calculate stats
        setStats({
          total: complaintsData.length,
          pending: complaintsData.filter(c => c.status === 'OPEN').length,
          inProgress: complaintsData.filter(c => c.status === 'IN_PROGRESS')
            .length,
          resolved: complaintsData.filter(
            c =>
              c.status === 'RESOLVED' ||
              c.status === 'CLOSED' ||
              c.status === 'CANCELLED',
          ).length,
        });

        // Set filtered complaints initially
        setFilteredComplaints(complaintsData);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplaintAction = async (
    action: string,
    complaint: Complaint,
  ) => {
    switch (action) {
      case 'view':
        // Handle view action - open detail modal
        setSelectedComplaint(complaint);
        setDetailModalOpen(true);
        break;
      case 'edit': {
        // Handle edit action - allow status update
        const newStatus = prompt(
          `Current status: ${formatStatusDisplay(complaint.status)}\n\nEnter new status (OPEN, IN PROGRESS, RESOLVED, CLOSED, CANCELLED):`,
        );
        if (newStatus && newStatus.trim()) {
          try {
            await complaintService.updateComplaint(complaint.id, {
              status: newStatus.trim() as any,
            });
            toast.success('Complaint status updated successfully');
            await loadComplaints(); // Refresh the list
          } catch (error) {
            console.error('Error updating complaint:', error);
            toast.error('Failed to update complaint status');
          }
        }
        break;
      }
      case 'delete':
        // Handle delete action - open delete confirmation modal
        openDeleteModal(complaint);
        break;
      case 'assign':
        // Handle assign action - open teacher selection modal
        setComplaintToAssign(complaint);
        setTeacherSelectionModalOpen(true);
        loadTeachers();
        break;
      default:
        break;
    }
  };

  // Load responses for the selected complaint
  const loadResponses = useCallback(async (complaintId: string) => {
    setLoadingResponses(true);
    try {
      const response = await complaintService.getResponses(complaintId);
      if (response.success && response.data) {
        const responsesData = (response.data as any).responses || response.data;
        setResponses(responsesData);
      }
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error('Failed to load responses');
    } finally {
      setLoadingResponses(false);
    }
  }, []);

  // Handle status update from modal
  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: newStatus as any,
      });
      toast.success('Status updated successfully');
      await loadComplaints(); // Refresh the list
      if (selectedComplaint) {
        setSelectedComplaint({
          ...selectedComplaint,
          status: newStatus as any,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle assignment from modal
  const handleAssignment = async (complaintId: string, teacherId: string) => {
    try {
      await complaintService.assignComplaint(complaintId, teacherId);
      toast.success('Complaint assigned successfully');
      await loadComplaints(); // Refresh the list
      if (selectedComplaint) {
        setSelectedComplaint({ ...selectedComplaint, assignedToId: teacherId });
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
      toast.error('Failed to assign complaint');
    }
  };

  // Load teachers for assignment - only get what we need
  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const response = await teacherService.getAllTeachers();
      if (response.success && response.data) {
        // Only keep the essential fields we need for assignment
        const essentialTeachers = response.data.map(teacher => ({
          id: teacher.id,
          userId: teacher.userId,
          fullName: teacher.fullName,
          email: teacher.email,
          employeeId: teacher.employeeId,
        }));
        setTeachers(essentialTeachers);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Handle teacher assignment
  const handleTeacherAssignment = async (teacher: any) => {
    if (!complaintToAssign) return;

    try {
      // The backend now includes userId in the teacher data
      if (!teacher.userId) {
        toast.error('Teacher data is incomplete. Please try again.');
        return;
      }

      await complaintService.assignComplaint(
        complaintToAssign.id,
        teacher.userId,
      );
      toast.success('Complaint assigned successfully');
      await loadComplaints(); // Refresh the list
      closeTeacherSelectionModal();
    } catch (error) {
      console.error('Error assigning complaint:', error);
      toast.error('Failed to assign complaint');
    }
  };

  // Close teacher selection modal
  const closeTeacherSelectionModal = () => {
    setTeacherSelectionModalOpen(false);
    setComplaintToAssign(null);
    setTeachers([]);
    setTeacherSearchTerm('');
  };

  // Close modal and reset state
  const closeModal = () => {
    setDetailModalOpen(false);
    setSelectedComplaint(null);
    setResponses([]);
    setNewResponse('');
    setSubmittingResponse(false);
    setResponseModalOpen(false);
  };

  // Open delete confirmation modal
  const openDeleteModal = (complaint: Complaint) => {
    setComplaintToDelete(complaint);
    setDeleteModalOpen(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setComplaintToDelete(null);
    setDeletingComplaint(false);
  };

  // Handle complaint deletion
  const handleDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    try {
      setDeletingComplaint(true);
      await complaintService.deleteComplaint(complaintToDelete.id);
      toast.success('Complaint deleted successfully');
      await loadComplaints(); // Refresh the list
      closeDeleteModal();

      // If the deleted complaint was the selected one, close the detail modal
      if (selectedComplaint?.id === complaintToDelete.id) {
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    } finally {
      setDeletingComplaint(false);
    }
  };

  // Open status update modal
  const openStatusUpdateModal = () => {
    setStatusUpdateModalOpen(true);
    setNewStatus(selectedComplaint?.status || '');
  };

  // Close status update modal
  const closeStatusUpdateModal = () => {
    setStatusUpdateModalOpen(false);
    setNewStatus('');
    setUpdatingStatus(false);
  };

  // Handle status update from modal
  const handleStatusUpdateFromModal = async () => {
    if (!selectedComplaint || !newStatus.trim()) return;

    try {
      setUpdatingStatus(true);
      await complaintService.updateComplaint(selectedComplaint.id, {
        status: newStatus.trim() as any,
      });
      toast.success('Status updated successfully');
      await loadComplaints(); // Refresh the list
      if (selectedComplaint) {
        setSelectedComplaint({
          ...selectedComplaint,
          status: newStatus.trim() as any,
        });
      }
      closeStatusUpdateModal();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle submitting a new response
  const handleSubmitResponse = useCallback(
    async (complaintId: string, content: string) => {
      try {
        // Create the response using the complaint service
        await complaintService.createResponse(complaintId, {
          content: content.trim(),
        });

        toast.success('Response submitted successfully');

        // Refresh responses
        await loadResponses(complaintId);
      } catch (error) {
        console.error('Error submitting response:', error);
        toast.error('Failed to submit response');
        throw error;
      }
    },
    [loadResponses],
  );

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handle primary filter change (status)
  const handlePrimaryFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  // Handle secondary filter change (priority)
  const handleSecondaryFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
  }, []);

  // Teacher Selection Modal
  const TeacherSelectionModal = () => {
    if (!teacherSelectionModalOpen || !complaintToAssign) return null;

    const filteredTeachers = teachers.filter(
      teacher =>
        teacher.fullName
          ?.toLowerCase()
          .includes(teacherSearchTerm.toLowerCase()) ||
        teacher.email
          ?.toLowerCase()
          .includes(teacherSearchTerm.toLowerCase()) ||
        teacher.employeeId
          ?.toLowerCase()
          .includes(teacherSearchTerm.toLowerCase()),
    );

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
        <div className='bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto shadow-xl animate-in fade-in duration-300'>
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-50 to-indigo-100 p-6 border-b border-purple-200'>
            <div className='flex justify-between items-center'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>
                  Assign Complaint to Teacher
                </h2>
                <p className='text-gray-600 mt-1'>
                  Select a teacher to assign: "{complaintToAssign.title}"
                </p>
              </div>
              <button
                onClick={closeTeacherSelectionModal}
                className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className='p-6 border-b border-gray-200'>
            <div className='relative'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={20}
              />
              <input
                type='text'
                placeholder='Search teachers by name, email, or employee ID...'
                value={teacherSearchTerm}
                onChange={e => setTeacherSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Teachers List */}
          <div className='p-6'>
            {loadingTeachers ? (
              <div className='text-center py-8'>
                <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
                <p className='mt-2 text-gray-600'>Loading teachers...</p>
              </div>
            ) : filteredTeachers.length > 0 ? (
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {filteredTeachers.map(teacher => (
                  <div
                    key={teacher.id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                        <User className='text-purple-600' size={20} />
                      </div>
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {teacher.fullName || 'Unknown'}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {teacher.email || 'No email'}
                        </p>
                        {teacher.employeeId && (
                          <p className='text-xs text-gray-400'>
                            Employee ID: {teacher.employeeId}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleTeacherAssignment(teacher)}
                      className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg'
                    >
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <p className='text-gray-500'>
                  {teacherSearchTerm
                    ? 'No teachers found matching your search.'
                    : 'No teachers available.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='border-t border-gray-200 p-6 bg-gray-50'>
            <div className='flex justify-end'>
              <Button
                onClick={closeTeacherSelectionModal}
                className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg'
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Super Admin Complaint Detail Modal
  const SuperAdminComplaintDetailModal = () => {
    if (!detailModalOpen || !selectedComplaint) return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'OPEN':
          return 'bg-yellow-100 text-yellow-800';
        case 'IN_PROGRESS':
          return 'bg-blue-100 text-blue-800';
        case 'RESOLVED':
          return 'bg-green-100 text-green-800';
        case 'CLOSED':
          return 'bg-purple-100 text-purple-800';
        case 'CANCELLED':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-indigo-100 text-indigo-700';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'URGENT':
          return 'bg-red-100 text-red-800';
        case 'HIGH':
          return 'bg-orange-100 text-orange-800';
        case 'MEDIUM':
          return 'bg-yellow-100 text-yellow-800';
        case 'LOW':
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-teal-100 text-teal-700';
      }
    };

    const formatPriorityDisplay = (priority: string) => {
      return priority?.toLowerCase() || 'unknown';
    };

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
        <div className='bg-white rounded-xl max-w-3xl w-full max-h-[75vh] overflow-hidden shadow-2xl animate-in fade-in duration-300 flex flex-col'>
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-50 to-indigo-100 p-6 border-b border-purple-200'>
            <div className='flex justify-between items-start'>
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}
                  >
                    {selectedComplaint.priority?.toLowerCase() || 'unknown'}
                  </span>

                  <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                    {selectedComplaint.type?.toLowerCase() || 'unknown'}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}
                  >
                    {formatStatusDisplay(selectedComplaint.status)}
                  </span>
                </div>

                <h2 className='text-xl font-bold text-gray-800'>
                  {selectedComplaint.title || 'Untitled Complaint'}
                </h2>
                <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                  <span className='font-medium'>From:</span>
                  <span>
                    {selectedComplaint.complainant?.fullName || 'Unknown'}
                  </span>
                  <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                  <span className='font-medium'>To:</span>
                  <span>
                    {selectedComplaint.recipientType === 'ADMINISTRATION'
                      ? 'Administration'
                      : selectedComplaint.recipientType === 'PARENT'
                        ? 'Parent'
                        : selectedComplaint.recipientType === 'CLASS_TEACHER'
                          ? 'Class Teacher'
                          : 'Unknown'}
                    {selectedComplaint.assignedTo && (
                      <span className='ml-1 text-gray-500'>
                        ({selectedComplaint.assignedTo.fullName})
                      </span>
                    )}
                  </span>
                </div>

                <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                  <span>
                    By {selectedComplaint.complainant?.fullName || 'Unknown'}
                  </span>
                  <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                  <span>
                    {selectedComplaint.createdAt
                      ? new Date(
                          selectedComplaint.createdAt,
                        ).toLocaleDateString()
                      : 'Unknown date'}
                  </span>
                </div>
              </div>

              <button
                onClick={closeModal}
                className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='p-4 space-y-4 overflow-y-auto flex-1'>
            {/* Complaint Details */}
            <div className='space-y-4'>
              <div>
                <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                  <FileText className='mr-2' size={18} />
                  Complaint Details
                </h3>
                <div className='bg-gray-50 p-3 rounded-lg'>
                  <p className='text-gray-700 whitespace-pre-wrap text-sm'>
                    {selectedComplaint.description}
                  </p>
                </div>
              </div>

              <div>
                <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                  <User className='mr-2' size={18} />
                  Complainant Information
                </h3>
                <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Name:</span>
                    <span className='font-medium'>
                      {selectedComplaint.complainant?.fullName || 'Unknown'}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Email:</span>
                    <span className='font-medium'>
                      {selectedComplaint.complainant?.email || 'N/A'}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Type:</span>
                    <span className='font-medium'>
                      {selectedComplaint.complainantType || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-base font-semibold text-gray-800 mb-2 flex items-center'>
                  <Calendar className='mr-2' size={18} />
                  Timeline
                </h3>
                <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Created:</span>
                    <span className='font-medium'>
                      {selectedComplaint.createdAt
                        ? new Date(selectedComplaint.createdAt).toLocaleString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            },
                          )
                        : 'Unknown'}
                    </span>
                  </div>
                  {selectedComplaint.assignedAt && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Assigned:</span>
                      <span className='font-medium'>
                        {new Date(selectedComplaint.assignedAt).toLocaleString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}
                      </span>
                    </div>
                  )}
                  {selectedComplaint.resolvedAt && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Resolved:</span>
                      <span className='font-medium'>
                        {new Date(selectedComplaint.resolvedAt).toLocaleString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}
                      </span>
                    </div>
                  )}
                  {selectedComplaint.updatedAt && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Last Updated:</span>
                      <span className='font-medium'>
                        {new Date(selectedComplaint.updatedAt).toLocaleString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedComplaint.assignedTo && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                    <UserPlus className='mr-2' size={20} />
                    Assigned To
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <User className='text-gray-500' size={16} />
                      <span className='font-medium'>
                        {selectedComplaint.assignedTo.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedComplaint.resolution && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                    <CheckCircle className='mr-2' size={20} />
                    Resolution
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <p className='text-gray-700 whitespace-pre-wrap'>
                      {selectedComplaint.resolution}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {selectedComplaint.attachments &&
              selectedComplaint.attachments.length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                    <FileText className='mr-2' size={20} />
                    Attachments ({selectedComplaint.attachments.length})
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <ul className='space-y-2'>
                      {selectedComplaint.attachments.map(attachment => (
                        <li
                          key={attachment.id}
                          className='flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 transition-colors'
                        >
                          <div className='flex items-center gap-2'>
                            <FileText className='w-5 h-5 text-blue-500' />
                            <span className='text-sm text-gray-700'>
                              {attachment.originalName}
                            </span>
                          </div>

                          <div className='flex items-center gap-3'>
                            <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1'>
                              <FileText className='w-4 h-4' />
                              {attachment.mimeType
                                ?.split('/')[1]
                                ?.toUpperCase() || 'FILE'}
                            </span>
                            <a
                              href={attachment.url}
                              target='_blank'
                              rel='noreferrer'
                              className='bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1'
                            >
                              <Eye className='w-3 h-3' />
                              View
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            {/* Responses Section */}
            <div>
              <h3 className='text-lg font-semibold text-gray-800 mb-3 flex items-center'>
                <MessageSquare className='mr-2' size={20} />
                Responses ({responses.length})
              </h3>
              <div className='bg-gray-50 p-4 rounded-lg'>
                {loadingResponses ? (
                  <div className='text-center py-4'>
                    <div className='inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
                    <p className='mt-2 text-gray-600'>Loading responses...</p>
                  </div>
                ) : responses.length > 0 ? (
                  <div className='space-y-4'>
                    {responses.map((response, index) => (
                      <div
                        key={index}
                        className='bg-white p-4 rounded-lg border border-gray-200'
                      >
                        <div className='flex justify-between items-start mb-2'>
                          <div className='flex items-center gap-2'>
                            <User className='text-gray-500' size={16} />
                            <span className='font-medium'>
                              {response.responder?.fullName || 'Unknown'}
                            </span>
                            <span className='text-sm text-gray-500'>
                              ({response.respondentType || 'Unknown'})
                            </span>
                          </div>
                          <span className='text-sm text-gray-500'>
                            {response.createdAt
                              ? new Date(response.createdAt).toLocaleString(
                                  'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  },
                                )
                              : 'Unknown date'}
                          </span>
                        </div>
                        <p className='text-gray-700'>{response.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500 text-center py-4'>
                    No responses yet
                  </p>
                )}

                {/* Add Response Button */}
                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <div className='flex justify-between items-center'>
                    <h4 className='text-base font-medium text-gray-800 flex items-center'>
                      <MessageSquare className='mr-2' size={18} />
                      Responses
                    </h4>
                    <Button
                      onClick={() => setResponseModalOpen(true)}
                      className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                    >
                      <MessageSquare size={16} />
                      Add Response
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className='border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0'>
            <div className='flex flex-wrap gap-3 justify-between items-center'>
              <div className='flex flex-wrap gap-3'>
                <Button
                  onClick={() => {
                    setTeacherSelectionModalOpen(true);
                    setComplaintToAssign(selectedComplaint);
                    loadTeachers();
                  }}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                >
                  <UserPlus size={16} />
                  Assign to Teacher
                </Button>

                <Button
                  onClick={openStatusUpdateModal}
                  className='bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                >
                  <Edit3 size={16} />
                  Update Status
                </Button>

                {selectedComplaint.status !== 'RESOLVED' && (
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedComplaint.id, 'RESOLVED')
                    }
                    className='bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                  >
                    <CheckCircle size={16} />
                    Mark as Resolved
                  </Button>
                )}

                <Button
                  onClick={() => openDeleteModal(selectedComplaint)}
                  className='bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 min-w-[120px] justify-center text-sm'
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>

              <Button
                onClick={closeModal}
                className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg'
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Transform complaints to match the expected format for GenericList
  const transformedComplaints = complaints.map(complaint => {
    return {
      id: complaint.id,
      title: complaint.title || 'Untitled Complaint',
      description: complaint.description,
      categories: [complaint.type],
      files: complaint._count?.attachments || 0,
      submittedBy: {
        name: complaint.complainant?.fullName || 'Unknown',
        role: complaint.complainantType || 'Student',
      },
      assignedTo: complaint.assignedTo
        ? {
            name: complaint.assignedTo.fullName,
            role: 'Teacher',
          }
        : null,
      status:
        complaint.status === 'IN_PROGRESS' ? 'IN PROGRESS' : complaint.status,
      priority: complaint.priority,
      // Add original complaint data for actions
      originalComplaint: complaint,
    };
  });

  const statsData = [
    {
      icon: FileText,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      label: 'Total Complaints',
      value: stats.total.toString(),
      change: '',
      isPositive: true,
    },
    {
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      label: 'Pending Review',
      value: stats.pending.toString(),
      change: '',
      isPositive: true,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      label: 'IN PROGRESS',
      value: stats.inProgress.toString(),
      change: '',
      isPositive: true,
    },
    {
      icon: CheckCircle2,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      label: 'Resolved',
      value: stats.resolved.toString(),
      change: '',
      isPositive: true,
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <SectionTitle
          text='Complaint Management'
          className='mb-1 text-3xl font-bold'
        />
        <p className='text-sm text-gray-500 mt-1 mb-6'>
          Monitor all complaints in the school
        </p>
        <Statsgrid stats={statsData} />
      </div>

      {loading ? (
        <div className='text-center py-8'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          <p className='mt-2 text-gray-600'>Loading complaints...</p>
        </div>
      ) : (
        <GenericList
          config={getListConfig('complaints')}
          data={filteredComplaints.map(complaint => {
            return {
              id: complaint.id,
              title: complaint.title || 'Untitled Complaint',
              description: complaint.description,
              categories: [complaint.type],
              files: complaint._count?.attachments || 0,
              responses: complaint._count?.responses || 0,
              submittedBy: {
                name: complaint.complainant?.fullName || 'Unknown',
                role: complaint.complainantType || 'Student',
              },
              assignedTo: complaint.assignedTo
                ? {
                    name: complaint.assignedTo.fullName,
                    role: 'Teacher',
                  }
                : null,
              status:
                complaint.status === 'IN_PROGRESS'
                  ? 'IN PROGRESS'
                  : complaint.status,
              priority: complaint.priority,
              originalComplaint: complaint,
            };
          })}
          currentPage={1}
          totalPages={1}
          totalItems={filteredComplaints.length}
          itemsPerPage={10}
          onSearch={handleSearch}
          onPrimaryFilterChange={handlePrimaryFilterChange}
          onSecondaryFilterChange={handleSecondaryFilterChange}
          onItemAction={(action, item) =>
            handleComplaintAction(action, item.originalComplaint)
          }
        />
      )}

      {/* Super Admin Complaint Detail Modal */}
      <SuperAdminComplaintDetailModal />

      {/* Teacher Selection Modal */}
      <TeacherSelectionModal />

      {/* Status Update Modal */}
      {statusUpdateModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-xl max-w-md w-full shadow-2xl animate-in fade-in duration-300'>
            {/* Header */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-100 p-6 border-b border-green-200'>
              <div className='flex justify-between items-center'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>
                    Update Complaint Status
                  </h2>
                  <p className='text-gray-600 mt-1'>
                    Current status:{' '}
                    <span className='font-medium'>
                      {selectedComplaint?.status
                        ? formatStatusDisplay(selectedComplaint.status)
                        : 'Unknown'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={closeStatusUpdateModal}
                  className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='p-6'>
              <div className='space-y-4'>
                <div>
                  <label
                    htmlFor='status'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    New Status
                  </label>
                  <select
                    id='status'
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  >
                    <option value='IN_PROGRESS'>IN PROGRESS</option>
                    <option value='RESOLVED'>RESOLVED</option>
                    <option value='CLOSED'>CLOSED</option>
                    <option value='CANCELLED'>CANCELLED</option>
                  </select>
                </div>

                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <div className='flex items-start'>
                    <div className='flex-shrink-0'>
                      <AlertCircle className='h-5 w-5 text-blue-400' />
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-blue-800'>
                        Status Guidelines
                      </h3>
                      <div className='mt-2 text-sm text-blue-700'>
                        <ul className='list-disc list-inside space-y-1'>
                          <li>
                            <strong>IN PROGRESS:</strong> Complaint is being
                            actively worked on
                          </li>
                          <li>
                            <strong>RESOLVED:</strong> Complaint has been
                            resolved successfully
                          </li>
                          <li>
                            <strong>CLOSED:</strong> Complaint is closed (no
                            further action needed)
                          </li>
                          <li>
                            <strong>CANCELLED:</strong> Complaint was cancelled
                            (invalid or withdrawn)
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 p-6 bg-gray-50 flex justify-end space-x-3'>
              <Button
                onClick={closeStatusUpdateModal}
                className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg'
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdateFromModal}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                disabled={updatingStatus || !newStatus.trim()}
              >
                {updatingStatus ? (
                  <>
                    <div className='inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit3 size={16} />
                    Update Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Response Modal */}
      {responseModalOpen && selectedComplaint && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='bg-white rounded-xl max-w-2xl w-full shadow-2xl animate-in fade-in duration-300'>
            {/* Header */}
            <div className='bg-gradient-to-r from-purple-50 to-indigo-100 p-6 border-b border-purple-200'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>
                    Admin Response
                  </h2>
                  <p className='text-sm text-gray-600 mt-1'>
                    {selectedComplaint.title || 'Untitled Complaint'}
                  </p>
                  <div className='text-sm text-gray-600 mt-1'>
                    <span className='font-medium'>From:</span>{' '}
                    {selectedComplaint.complainant?.fullName || 'Unknown'} •{' '}
                    <span className='font-medium'>To:</span>{' '}
                    {selectedComplaint.recipientType === 'ADMINISTRATION'
                      ? 'Administration'
                      : selectedComplaint.recipientType === 'PARENT'
                        ? 'Parent'
                        : selectedComplaint.recipientType === 'CLASS_TEACHER'
                          ? 'Class Teacher'
                          : 'Unknown'}
                    {selectedComplaint.assignedTo && (
                      <span className='ml-1 text-gray-500'>
                        ({selectedComplaint.assignedTo.fullName})
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setResponseModalOpen(false)}
                  className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='p-6'>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!newResponse.trim()) return;

                  try {
                    setSubmittingResponse(true);
                    await handleSubmitResponse(
                      selectedComplaint.id,
                      newResponse,
                    );
                    setNewResponse('');
                    setResponseModalOpen(false);
                  } catch (error) {
                    // Error is already handled in handleSubmitResponse
                  } finally {
                    setSubmittingResponse(false);
                  }
                }}
                className='space-y-6'
              >
                {/* Response Content */}
                <div>
                  <label className='block mb-2 font-medium'>
                    Response <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    className='w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none'
                    rows={6}
                    value={newResponse}
                    onChange={e => setNewResponse(e.target.value)}
                    placeholder='Type your response here...'
                    required
                    disabled={submittingResponse}
                  />
                </div>

                {/* Submit buttons */}
                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    type='button'
                    onClick={() => setResponseModalOpen(false)}
                    className='bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300'
                    disabled={submittingResponse}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    className='bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700'
                    disabled={submittingResponse || !newResponse.trim()}
                  >
                    {submittingResponse ? 'Submitting...' : 'Submit Response'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && complaintToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-xl max-w-lg w-full shadow-2xl animate-in fade-in duration-300'>
            {/* Header */}
            <div className='bg-gradient-to-r from-red-50 to-pink-100 p-6 border-b border-red-200 rounded-t-xl'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                    <AlertCircle className='h-6 w-6 text-red-600' />
                    Delete Student Complaint
                  </h2>
                  <p className='text-red-600 mt-2 font-medium'>
                    ⚠️ This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
                  disabled={deletingComplaint}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='p-6'>
              <div className='space-y-6'>
                {/* Warning Section */}
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      <AlertCircle className='h-5 w-5 text-red-600' />
                    </div>
                    <div>
                      <h3 className='text-sm font-semibold text-red-800 mb-2'>
                        Important Warning
                      </h3>
                      <p className='text-sm text-red-700 leading-relaxed'>
                        This complaint is related to a student's concern that
                        needs to be addressed and resolved. Deleting it will
                        remove all evidence of the issue and may impact the
                        student's academic experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-sm font-medium text-gray-800 mb-2'>
                    Complaint Details:
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Title:</span>
                      <span className='font-medium text-gray-800'>
                        "{complaintToDelete.title || 'Untitled Complaint'}"
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>From:</span>
                      <span className='font-medium text-gray-800'>
                        {complaintToDelete.complainant?.fullName || 'Unknown'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>To:</span>
                      <span className='font-medium text-gray-800'>
                        {complaintToDelete.recipientType === 'ADMINISTRATION'
                          ? 'Administration'
                          : complaintToDelete.recipientType === 'PARENT'
                            ? 'Parent'
                            : complaintToDelete.recipientType ===
                                'CLASS_TEACHER'
                              ? 'Class Teacher'
                              : 'Unknown'}
                        {complaintToDelete.assignedTo && (
                          <span className='ml-1 text-gray-500'>
                            ({complaintToDelete.assignedTo.fullName})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Student:</span>
                      <span className='font-medium text-gray-800'>
                        {complaintToDelete.complainant?.fullName || 'Unknown'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Type:</span>
                      <span className='font-medium text-gray-800 capitalize'>
                        {complaintToDelete.type?.toLowerCase() || 'Unknown'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Priority:</span>
                      <span className='font-medium text-gray-800 capitalize'>
                        {complaintToDelete.priority?.toLowerCase() || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final Warning */}
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      <AlertCircle className='h-5 w-5 text-yellow-600' />
                    </div>
                    <div>
                      <p className='text-sm text-yellow-800 leading-relaxed'>
                        <strong>Final Warning:</strong> This will permanently
                        remove the complaint, all responses, attachments, and
                        any resolution history. Consider resolving the issue
                        instead of deleting it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3'>
              <Button
                onClick={closeDeleteModal}
                className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium'
                disabled={deletingComplaint}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteComplaint}
                className='bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2'
                disabled={deletingComplaint}
              >
                {deletingComplaint ? (
                  <>
                    <div className='inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintManagement;
