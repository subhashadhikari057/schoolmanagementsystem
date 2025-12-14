'use client';

import React, { useEffect, useState } from 'react';
import { noticeService, Notice } from '@/api/services/notice.service';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import Button from '@/components/atoms/form-controls/Button';
import { AlertCircle, Eye, FileText, Bell, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { NoticePriority, NoticePriorityLabels } from '@sms/shared-types';

// Modal for viewing a notice
interface NoticeViewModalProps {
  notice: Notice;
  onClose: () => void;
}

const NoticeViewModal: React.FC<NoticeViewModalProps> = ({
  notice,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isReadMarked, setIsReadMarked] = useState(false);

  useEffect(() => {
    // Mark notice as read when viewing it
    const markAsRead = async () => {
      try {
        await noticeService.markNoticeAsRead(notice.id);
        setIsReadMarked(true);
      } catch (error) {
        console.error('Error marking notice as read:', error);
      }
    };

    markAsRead();
  }, [notice.id]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  // Format date with time
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to get styled badge for file type
  const getFileTypeBadge = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';
    let icon = <FileText className='w-4 h-4' />;

    // Style based on file type
    if (['pdf'].includes(extension || '')) {
      bgColor = 'bg-red-50';
      textColor = 'text-red-600';
    } else if (['doc', 'docx'].includes(extension || '')) {
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-600';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      bgColor = 'bg-green-50';
      textColor = 'text-green-600';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      bgColor = 'bg-purple-50';
      textColor = 'text-purple-600';
    }

    return (
      <span
        className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium flex items-center gap-1`}
      >
        {icon}
        {extension?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8'>
      <div className='bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto shadow-xl animate-in fade-in duration-300'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='mb-2 flex items-center gap-2'>
                {isReadMarked && (
                  <span className='bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                    <Eye className='w-3 h-3' />
                    <span>Read</span>
                  </span>
                )}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium 
                  ${
                    notice.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700'
                      : notice.priority === 'HIGH'
                        ? 'bg-red-100 text-red-600'
                        : notice.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                  }`}
                >
                  {notice.priority.toLowerCase()}
                </span>
                {notice.category && (
                  <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                    {notice.category.toLowerCase()}
                  </span>
                )}
              </div>

              <h2 className='text-xl font-bold text-gray-800'>
                {notice.title}
              </h2>

              <div className='mt-2 text-sm text-gray-600 flex items-center gap-2'>
                <span>By {notice.createdBy?.fullName || 'Admin'}</span>
                <span className='inline-block w-1 h-1 rounded-full bg-gray-400'></span>
                <span>
                  {formatDateTime(notice.createdAt || notice.publishDate)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className='text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:shadow-md transition-all'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Recipients */}
          <div className='bg-gray-50 p-3 rounded-lg'>
            <div className='text-sm font-medium text-gray-700 mb-1'>
              Recipients:
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700'>
                {notice.recipientType === 'SPECIFIC_PARENT'
                  ? 'Specific Person'
                  : 'Collection'}
              </span>
              {notice.selectedClass && (
                <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700'>
                  {notice.selectedClass.grade} {notice.selectedClass.section}
                </span>
              )}
            </div>
          </div>

          {/* Notice Content */}
          <div className='prose prose-blue max-w-none text-gray-700 bg-white p-4 rounded-lg border border-gray-200'>
            {notice.content}
          </div>

          {/* Attachments */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='text-md font-semibold mb-3 flex items-center gap-2 text-gray-700'>
                <svg
                  className='w-5 h-5 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                  ></path>
                </svg>
                Attachments ({notice.attachments.length})
              </h3>

              <ul className='space-y-2'>
                {notice.attachments.map(attachment => (
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
                      {getFileTypeBadge(attachment.originalName)}
                      <a
                        href={attachment.url}
                        target='_blank'
                        rel='noreferrer'
                        className='bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1'
                      >
                        <svg
                          className='w-3 h-3'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                          ></path>
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                          ></path>
                        </svg>
                        View Attachment
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Info */}
          <div className='flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200 mt-6'>
            <div className='flex flex-col gap-1'>
              <div className='font-medium text-gray-700'>Notice Period:</div>
              <div className='flex items-center gap-2'>
                <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs'>
                  Published: {formatDateTime(notice.publishDate)}
                </span>
                <span className='bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs'>
                  Expires: {formatDateTime(notice.expiryDate)}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ParentNoticesTabProps {
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  searchTerm?: string;
}

export default function ParentNoticesTab({
  categoryFilter,
  setCategoryFilter,
  searchTerm = '',
}: ParentNoticesTabProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchTerm);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Update query when searchTerm prop changes
  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);

  // Fetch notices from the backend
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const params: Record<string, unknown> = { page, limit: 10 };

        // Add query params if available
        if (query) params.search = query;
        if (priorityFilter !== 'all')
          params.priority = priorityFilter.toUpperCase();
        if (categoryFilter !== 'all') params.category = categoryFilter;

        // Fetch notices
        const response = await noticeService.getMyNotices(params);

        if (response.success && response.data) {
          setNotices(response.data.notices);
          setTotalPages(response.data.pagination.pages);
        } else {
          toast.error('Failed to load notices');
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
        toast.error('Error loading notices');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [page, query, priorityFilter, categoryFilter]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      // Refetch notices when the refresh event is triggered
      const fetchNotices = async () => {
        try {
          const params: Record<string, unknown> = { page, limit: 10 };
          if (query) params.search = query;
          if (priorityFilter !== 'all')
            params.priority = priorityFilter.toUpperCase();
          if (categoryFilter !== 'all') params.category = categoryFilter;

          const response = await noticeService.getMyNotices(params);
          if (response.success && response.data) {
            setNotices(response.data.notices);
            setTotalPages(response.data.pagination.pages);
          }
        } catch (error) {
          console.error('Error refreshing notices:', error);
        }
      };

      fetchNotices();
    };

    // Add event listener for notice refreshes
    if (typeof window !== 'undefined') {
      window.addEventListener('notices:refresh', handleRefresh);

      // Clean up
      return () => {
        window.removeEventListener('notices:refresh', handleRefresh);
      };
    }
  }, [page, query, priorityFilter, categoryFilter]);

  // Priority options for filter dropdown
  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...Object.entries(NoticePriorityLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'GENERAL', label: 'General' },
    { value: 'ACADEMIC', label: 'Academic' },
    { value: 'EXAMINATION', label: 'Examination' },
    { value: 'FEE', label: 'Fee' },
    { value: 'EVENT', label: 'Event' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'MEETING', label: 'Meeting' },
    { value: 'ANNOUNCEMENT', label: 'Announcement' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700';
      case 'HIGH':
        return 'bg-red-100 text-red-600';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // View notice details
  const handleViewNotice = (notice: Notice) => {
    setSelectedNotice(notice);
  };

  // Check if a notice is expired
  const isNoticeExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  // Get notice relevance for children
  const getNoticeRelevance = (notice: Notice) => {
    // This would be based on the child's class, etc. For now we'll use a simple check
    if (notice.recipientType === 'PARENT' || notice.recipientType === 'ALL') {
      return true;
    }
    return !!notice.selectedClassId; // If it's for a class, it's relevant to the child
  };

  return (
    <div className='space-y-6'>
      {/* Search and Filters - Hidden on mobile since it's handled in the parent page */}
      <div className='hidden sm:flex flex-col sm:flex-row gap-3 items-center w-full'>
        <div className='w-full sm:flex-1'>
          <LabeledInputField
            label=''
            placeholder='Search notices...'
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full'
          />
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Dropdown
            type='filter'
            title='Category'
            options={categoryOptions}
            selectedValue={categoryFilter}
            onSelect={setCategoryFilter}
            className='max-w-xs w-full sm:w-auto'
          />
          <Dropdown
            type='filter'
            title='Priority'
            options={priorityOptions}
            selectedValue={priorityFilter}
            onSelect={setPriorityFilter}
            className='max-w-xs w-full sm:w-auto'
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
        </div>
      )}

      {/* Notices List */}
      {!loading && notices.length > 0 && (
        <div className='space-y-4'>
          {notices.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl border ${
                isNoticeExpired(notice.expiryDate)
                  ? 'border-gray-200 opacity-70'
                  : 'border-gray-200'
              } p-6 shadow-sm`}
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3 flex-wrap'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}
                    >
                      {notice.priority.toLowerCase()}
                    </span>
                    {notice.category && (
                      <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700'>
                        {notice.category.toLowerCase()}
                      </span>
                    )}
                    {isNoticeExpired(notice.expiryDate) && (
                      <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                        Expired
                      </span>
                    )}
                    {getNoticeRelevance(notice) && (
                      <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 flex items-center gap-1'>
                        <User className='w-3 h-3' />
                        <span>Child-related</span>
                      </span>
                    )}
                  </div>

                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {notice.title}
                  </h3>

                  <p className='text-gray-600 line-clamp-2 mb-3'>
                    {notice.content}
                  </p>

                  <div className='flex items-center gap-6 text-sm text-gray-600 flex-wrap'>
                    <div className='flex items-center gap-2'>
                      <Bell className='w-4 h-4' />
                      <span>By {notice.createdBy?.fullName || 'Admin'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>
                        {new Date(notice.publishDate).toLocaleDateString()}
                      </span>
                    </div>
                    {notice.attachments && notice.attachments.length > 0 && (
                      <div className='flex items-center gap-1'>
                        <FileText className='w-4 h-4' />
                        <span>{notice.attachments.length} attachment(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex gap-3'>
                  <Button
                    label='View Details'
                    onClick={() => handleViewNotice(notice)}
                    className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2'
                  >
                    <Eye className='w-4 h-4' />
                    <span>View Details</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center mt-6'>
              <nav className='flex space-x-2'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && notices.length === 0 && (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-600'>No notices found</p>
            <p className='text-gray-400 text-sm mt-1'>
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}

      {/* Notice View Modal */}
      {selectedNotice && (
        <NoticeViewModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
}
