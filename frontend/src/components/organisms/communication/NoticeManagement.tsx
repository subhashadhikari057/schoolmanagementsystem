'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import {
  Megaphone,
  CheckCircle2,
  FileText,
  Users,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  GenericList,
  type ListConfiguration,
  type BaseItem,
} from '@/components/templates/GenericList';
import { noticeService, type Notice } from '@/api/services/notice.service';
import { toast } from 'sonner';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import SectionTitle from '@/components/atoms/display/SectionTitle';

type Row = BaseItem & {
  id: string;
  title: string;
  content: string;
  author: string;
  files: number;
  recipients: string;
  read: number;
  total: number;
  status: string;
  priority: string;
  date: string; // publish
  expiry: string;
  attachments?: Array<{
    url: string;
    originalName: string;
    mimeType: string;
    filename: string;
  }>;
};

const NoticeManagement: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [viewing, setViewing] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Calculate stats from the data
  const statsConfig = useMemo(() => {
    const totalNotices = totalItems;
    const activeNotices = rows.filter(notice => {
      const isExpired = new Date(notice.expiry) < new Date();
      return !isExpired;
    }).length;
    const draftNotices = rows.filter(
      notice => notice.status === 'DRAFT',
    ).length;
    const recipientsToday = rows.reduce((total, notice) => {
      const today = new Date().toDateString();
      const publishDate = new Date(notice.date).toDateString();
      return today === publishDate ? total + (notice.total || 0) : total;
    }, 0);

    return [
      {
        icon: Megaphone,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        label: 'Total Notices',
        value: totalNotices.toString() || '0',
        change: '',
        isPositive: true,
      },
      {
        icon: CheckCircle2,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        label: 'Active Notices',
        value: activeNotices.toString(),
        change: '',
        isPositive: true,
      },
      {
        icon: FileText,
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        label: 'Draft Notices',
        value: draftNotices.toString(),
        change: '',
        isPositive: true,
      },
      {
        icon: Users,
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600',
        label: 'Recipients Today',
        value: recipientsToday.toString(),
        change: '',
        isPositive: true,
      },
    ];
  }, [rows, totalItems]);

  const handleDeleteNotice = async (notice: Row) => {
    try {
      const response = await noticeService.deleteNotice(notice.id);
      if (response.success) {
        toast.success('Notice deleted successfully');
        fetchData(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to delete notice');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
    }
  };

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    notice: Row | null;
  }>({
    isOpen: false,
    notice: null,
  });

  const confirmDelete = (notice: Row) => {
    setDeleteModal({ isOpen: true, notice });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.notice) {
      await handleDeleteNotice(deleteModal.notice);
      setDeleteModal({ isOpen: false, notice: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, notice: null });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit };

      // Add search parameter if query exists
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }

      // Add priority filter if not 'all'
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }

      const res = await noticeService.getAllNotices(params);
      if (res.success && res.data) {
        setTotalItems(res.data.pagination.total);
        setTotalPages(res.data.pagination.pages);
        let mapped: Row[] = res.data.notices.map((n: Notice) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          author: n.createdBy?.fullName || '—',
          files: n.attachments?.length || 0,
          recipients: n.recipientType,
          read: Array.isArray(n.recipients)
            ? n.recipients.filter(r => !!r.readAt).length
            : 0,
          total:
            n.recipientCount ||
            (Array.isArray(n.recipients) ? n.recipients.length : 0),
          status: n.status,
          priority: n.priority,
          date: n.publishDate,
          expiry: n.expiryDate,
          attachments: n.attachments,
        }));

        // Apply status filter on client side
        if (statusFilter !== 'all') {
          mapped = mapped.filter(notice => {
            if (statusFilter === 'draft') {
              return notice.status === 'DRAFT';
            } else if (statusFilter === 'published') {
              return notice.status === 'PUBLISHED';
            } else if (statusFilter === 'archived') {
              return notice.status === 'ARCHIVED';
            } else if (statusFilter === 'active') {
              const isExpired = new Date(notice.expiry) < new Date();
              return !isExpired && notice.status === 'PUBLISHED';
            } else if (statusFilter === 'inactive') {
              const isExpired = new Date(notice.expiry) < new Date();
              return isExpired || notice.status === 'ARCHIVED';
            }
            return true;
          });
        }

        setRows(mapped);
      } else {
        toast.error('Failed to load notices');
      }
    } catch (e) {
      console.error('Failed to fetch notices:', e);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchQuery, statusFilter, priorityFilter]);

  // Auto-refresh: periodic polling and react to global refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'notices:refresh',
        handleRefresh as EventListener,
      );
    }
    const intervalId = setInterval(() => {
      fetchData();
    }, 15000); // 15s polling
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'notices:refresh',
          handleRefresh as EventListener,
        );
      }
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config: ListConfiguration<Row> = useMemo(
    () => ({
      title: 'Notice Management',
      searchPlaceholder: 'Search notices by title or content...',
      enableSelection: false,
      searchValue: searchQuery,
      onSearchChange: setSearchQuery,
      primaryFilter: {
        title: 'Status',
        value: statusFilter,
        onChange: setStatusFilter,
        options: [
          { value: 'all', label: 'All Status' },
          { value: 'draft', label: 'Drafts' },
          { value: 'published', label: 'Published' },
          { value: 'archived', label: 'Archived' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
      secondaryFilter: {
        title: 'Priority',
        value: priorityFilter,
        onChange: setPriorityFilter,
        options: [
          { value: 'all', label: 'All Priorities' },
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'URGENT', label: 'Urgent' },
        ],
      },
      columns: [
        {
          key: 'title',
          header: 'Notice Details',
          render: (item: Row) => (
            <div className='py-1'>
              <div className='font-medium text-sm'>{item.title}</div>
              <div className='text-gray-500 text-[11px] truncate max-w-xs'>
                {item.content}
              </div>
              <div className='text-[10px] text-gray-400 mt-1'>
                By: {item.author}
              </div>
            </div>
          ),
        },
        {
          key: 'recipients',
          header: 'Recipients ',
          render: (item: Row) => (
            <div className='text-[11px] py-1'>
              <div className='uppercase'>{item.recipients}</div>
              <div className='text-green-600 font-medium'>
                {item.total} recipients
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status & Priority',
          render: (item: Row) => {
            const isExpired = new Date(item.expiry) < new Date();
            const getStatusBadge = () => {
              switch (item.status) {
                case 'DRAFT':
                  return (
                    <span className='inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700'>
                      Draft
                    </span>
                  );
                case 'PUBLISHED': {
                  const computed = isExpired ? 'Inactive' : 'Active';
                  return (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${computed === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {computed}
                    </span>
                  );
                }
                case 'ARCHIVED':
                  return (
                    <span className='inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700'>
                      Archived
                    </span>
                  );
                default:
                  return (
                    <span className='inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700'>
                      {item.status}
                    </span>
                  );
              }
            };
            return (
              <div className='flex gap-2 items-center py-1'>
                {getStatusBadge()}
                {(() => {
                  const p = item.priority;
                  const cls =
                    p === 'URGENT'
                      ? 'bg-red-100 text-red-700'
                      : p === 'HIGH'
                        ? 'bg-red-100 text-red-600'
                        : p === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700';
                  return (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${cls}`}
                    >
                      {p.toLowerCase()}
                    </span>
                  );
                })()}
              </div>
            );
          },
        },
        {
          key: 'date',
          header: 'Publish / Expiry',
          render: (item: Row) => (
            <div className='text-[11px] text-gray-600 py-1'>
              <div>{new Date(item.date).toLocaleString()}</div>
              <div className='text-gray-400'>
                → {new Date(item.expiry).toLocaleString()}
              </div>
            </div>
          ),
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (item: Row) => (
            <div className='flex items-center gap-2 py-1'>
              <button
                type='button'
                aria-label='View'
                className='text-gray-600 hover:text-blue-600 transition-colors'
                onClick={() => setViewing(item)}
              >
                <Eye size={14} />
              </button>
              <button
                type='button'
                aria-label='Edit'
                className='text-gray-600 hover:text-green-600 transition-colors'
                onClick={() => setEditing(item)}
              >
                <Pencil size={14} />
              </button>
              <button
                type='button'
                aria-label='Delete'
                className='text-gray-600 hover:text-red-600 transition-colors'
                onClick={() => confirmDelete(item)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ),
        },
      ],
    }),
    [priorityFilter, searchQuery, statusFilter],
  );

  return (
    <div className='space-y-6'>
      {/* Section Title */}
      <div className='mb-6'>
        <SectionTitle
          text='Notice Management'
          className='mb-1 text-3xl font-bold'
        />
        <p className='text-sm text-gray-500 mt-1'>
          Manage All Notice Related Information Here
        </p>
      </div>

      <Statsgrid stats={statsConfig} />
      <GenericList<Row>
        config={config}
        data={rows}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={setPage}
        onSearch={setSearchQuery}
        onPrimaryFilterChange={setStatusFilter}
        onSecondaryFilterChange={setPriorityFilter}
        customActions={<ActionButtons pageType='notices' />}
      />
      {loading && <div className='text-sm text-gray-500 px-2'>Loading...</div>}
      {viewing && (
        <NoticeViewModal notice={viewing} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <NoticeEditModal
          notice={editing}
          onClose={() => {
            setEditing(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.notice && (
        <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            {/* Header */}
            <div className='flex items-center gap-3 px-6 py-4 border-b border-gray-200'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-red-600'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Delete Notice
              </h3>
            </div>

            {/* Content */}
            <div className='px-6 py-4'>
              <p className='text-gray-700'>
                Are you sure you want to delete "{deleteModal.notice.title}"?
                This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className='flex justify-end gap-3 px-6 py-4 border-t border-gray-200'>
              <button
                onClick={handleCancelDelete}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className='px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeManagement;

// Lightweight view modal
function NoticeViewModal({
  notice,
  onClose,
}: {
  notice: Row;
  onClose: () => void;
}) {
  const [detail, setDetail] = React.useState<Row | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [previewImage, setPreviewImage] = React.useState<{
    url: string;
    name?: string;
  } | null>(null);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        // If we already have attachments, use current data
        if (notice.attachments && notice.attachments.length > 0) {
          if (!ignore) setDetail(notice);
          return;
        }
        const res = await noticeService.getNoticeById(notice.id);
        if (res.success && res.data && !ignore) {
          const n = res.data as Notice;
          const mapped: Row = {
            id: n.id,
            title: n.title,
            content: n.content,
            author: n.createdBy?.fullName || '—',
            files: n.attachments?.length || 0,
            recipients: n.recipientType,
            read: 0,
            total: n.recipientCount || 0,
            status: n.status,
            priority: n.priority,
            date: n.publishDate,
            expiry: n.expiryDate,
            attachments: n.attachments,
          };
          setDetail(mapped);
        } else if (!ignore) {
          // If we get an error response, display an error message
          toast.error(res.message || 'Failed to load notice details');
          onClose(); // Close the modal if we can't load the details
        }
      } catch (e) {
        console.error('Failed to load notice details:', e);
        toast.error('Failed to load notice details. Please try again.');
        if (!ignore) onClose(); // Close the modal on error
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [notice]);

  const data = detail || notice;
  return (
    <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-white flex items-center justify-between'>
          <div className='font-semibold text-base'>Notice Details</div>
          <button onClick={onClose} className='text-white/90 hover:text-white'>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className='p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]'>
          {/* Basic Info */}
          <div className='space-y-4'>
            <div className='md:col-span-3'>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-2'>
                Title
              </div>
              <div className='text-lg font-semibold text-gray-900'>
                {data.title}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Priority
                </div>
                <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {data.priority.toLowerCase()}
                </div>
              </div>
              <div>
                <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Recipients
                </div>
                <div className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                  {data.recipients}
                </div>
              </div>
              <div>
                <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                  Attachments
                </div>
                <div className='text-sm text-gray-900'>{data.files}</div>
              </div>
            </div>
          </div>

          {/* Date and Author Info */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                Publish Date
              </div>
              <div className='text-sm text-gray-900'>
                {new Date(data.date).toLocaleString()}
              </div>
            </div>
            <div>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                Expiry Date
              </div>
              <div className='text-sm text-gray-900'>
                {new Date(data.expiry).toLocaleString()}
              </div>
            </div>
            <div>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                Author
              </div>
              <div className='text-sm text-gray-900'>{data.author}</div>
            </div>
          </div>

          {/* Content */}
          <div className='space-y-3'>
            <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Content
            </div>
            <div className='text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-4'>
              {data.content}
            </div>
          </div>

          {/* Attachments Preview */}
          {data.attachments && data.attachments.length > 0 && (
            <div className='space-y-3'>
              <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                Attachments
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                {data.attachments.map((att, idx) => {
                  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(
                    att.originalName || att.filename || '',
                  );
                  return (
                    <div
                      key={idx}
                      className='group relative overflow-hidden rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200'
                    >
                      {isImage ? (
                        <img
                          src={att.url}
                          alt={att.originalName}
                          className='w-full h-32 object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-105'
                          onClick={() =>
                            setPreviewImage({
                              url: att.url,
                              name: att.originalName,
                            })
                          }
                        />
                      ) : (
                        <div className='h-32 flex items-center justify-center text-xs text-gray-500 bg-gray-100'>
                          <div className='text-center'>
                            <div className='text-2xl mb-1'>📄</div>
                            <div className='text-xs'>
                              {att.originalName || 'Attachment'}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className='px-3 py-2 flex items-center justify-between'>
                        <span className='truncate text-xs text-gray-700 font-medium'>
                          {att.originalName}
                        </span>
                        <a
                          className='text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors'
                          href={att.url}
                          target='_blank'
                          rel='noreferrer'
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {loading && (
            <div className='text-xs text-gray-500 px-1'>
              Loading attachments…
            </div>
          )}
          {previewImage && (
            <div className='fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4'>
              <div className='relative max-w-5xl w-full'>
                <button
                  onClick={() => setPreviewImage(null)}
                  className='absolute -top-4 -right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full w-8 h-8 shadow flex items-center justify-center'
                  aria-label='Close preview'
                >
                  ✕
                </button>
                <img
                  src={previewImage.url}
                  alt={previewImage.name || 'Preview'}
                  className='w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white'
                />
                {previewImage.name && (
                  <div className='text-center text-white text-sm mt-2'>
                    {previewImage.name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced edit modal with draft/publish functionality
function NoticeEditModal({
  notice,
  onClose,
}: {
  notice: Row;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(notice.title);
  const [content, setContent] = React.useState(notice.content);
  const [priority, setPriority] = React.useState(
    notice.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  );
  const [saving, setSaving] = React.useState(false);

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const response = await noticeService.updateNotice(notice.id, {
        title,
        content,
        priority,
        status: 'DRAFT' as any,
      });
      if (response.success) {
        toast.success('Notice saved as draft');
        onClose();
      } else {
        toast.error(response.message || 'Failed to save draft');
      }
    } catch (e) {
      console.error('Failed to save draft:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const response = await noticeService.updateNotice(notice.id, {
        title,
        content,
        priority,
        status: 'PUBLISHED' as any,
        publishDate: new Date().toISOString(), // Set publish date to now when publishing
        expiryDate: notice.expiry, // Keep the existing expiry date
      });
      if (response.success) {
        toast.success('Notice published successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to publish notice');
      }
    } catch (e) {
      console.error('Failed to publish notice:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to publish notice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-white flex items-center justify-between'>
          <div className='font-semibold text-base'>Edit Notice</div>
          <button onClick={onClose} className='text-white/90 hover:text-white'>
            ✕
          </button>
        </div>

        <div className='p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)]'>
          {/* Title */}
          <div className='space-y-2'>
            <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Title
            </div>
            <input
              className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Priority */}
          <div className='space-y-2'>
            <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Priority
            </div>
            <select
              className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
            >
              <option value='LOW'>Low</option>
              <option value='MEDIUM'>Medium</option>
              <option value='HIGH'>High</option>
              <option value='URGENT'>Urgent</option>
            </select>
          </div>

          {/* Content */}
          <div className='space-y-2'>
            <div className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Content
            </div>
            <textarea
              className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[140px] focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className='flex justify-between items-center px-6 py-4 border-t border-gray-100'>
          <div className='text-xs text-gray-500'>
            Current Status:{' '}
            <span
              className={`font-medium ${
                notice.status === 'DRAFT'
                  ? 'text-yellow-600'
                  : notice.status === 'PUBLISHED'
                    ? 'text-green-600'
                    : 'text-gray-600'
              }`}
            >
              {notice.status}
            </span>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
