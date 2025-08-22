'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  GenericList,
  ListConfiguration,
  BaseItem,
} from '@/components/templates/GenericList';
import { noticeService, type Notice } from '@/api/services/notice.service';

type NoticeRow = BaseItem & {
  id: string;
  title: string;
  content: string;
  priority: string;
  recipientType: string;
  category?: string;
  publishDate: string;
  expiryDate: string;
  status: string;
  recipientCount: number;
  attachments: number;
  createdBy?: string;
};

const AdminNoticesPage: React.FC = () => {
  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'EXPIRED'
  >('all');
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  >('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const res = await noticeService.getAllNotices(params);
      if (res.success && res.data) {
        setTotalItems(res.data.pagination.total);
        setTotalPages(res.data.pagination.pages);
        const mapped: NoticeRow[] = res.data.notices.map((n: Notice) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          recipientType: n.recipientType,
          category: n.category,
          publishDate: n.publishDate,
          expiryDate: n.expiryDate,
          status: n.status,
          recipientCount: n.recipientCount,
          attachments: n.attachments?.length || 0,
          createdBy: n.createdBy?.fullName,
        }));
        setRows(mapped);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, priorityFilter]);

  const config: ListConfiguration<NoticeRow> = useMemo(
    () => ({
      title: 'Notices',
      searchPlaceholder: 'Search notices by title or content...',
      enableSelection: false,
      columns: [
        {
          key: 'title',
          header: 'Notice',
          render: (item: NoticeRow) => (
            <div>
              <div className='font-semibold'>{item.title}</div>
              <div className='text-gray-500 text-xs line-clamp-2'>
                {item.content}
              </div>
            </div>
          ),
        },
        {
          key: 'priority',
          header: 'Priority',
          render: (item: NoticeRow) => {
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
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}
              >
                {p.toLowerCase()}
              </span>
            );
          },
        },
        {
          key: 'recipientType',
          header: 'Recipients',
          render: (item: NoticeRow) => (
            <span className='text-xs capitalize'>
              {item.recipientType.toLowerCase()}
            </span>
          ),
        },
        {
          key: 'publishDate',
          header: 'Publish / Expiry',
          render: (item: NoticeRow) => (
            <div className='text-xs text-gray-600'>
              <div>{new Date(item.publishDate).toLocaleString()}</div>
              <div className='text-gray-400'>
                → {new Date(item.expiryDate).toLocaleString()}
              </div>
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item: NoticeRow) => (
            <span className='text-xs font-medium capitalize'>
              {item.status.toLowerCase()}
            </span>
          ),
        },
        {
          key: 'recipientCount',
          header: 'Recipients',
          render: (item: NoticeRow) => (
            <span className='text-xs'>{item.recipientCount}</span>
          ),
        },
        {
          key: 'attachments',
          header: 'Files',
          render: (item: NoticeRow) => (
            <span className='text-xs'>{item.attachments}</span>
          ),
        },
      ],
      emptyMessage: loading ? 'Loading notices...' : 'No notices found',
      primaryFilter: {
        title: 'Status',
        options: [
          { value: 'all', label: 'All Status' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'ARCHIVED', label: 'Archived' },
          { value: 'EXPIRED', label: 'Expired' },
        ],
      },
      secondaryFilter: {
        title: 'Priority',
        options: [
          { value: 'all', label: 'All Priorities' },
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'URGENT', label: 'Urgent' },
        ],
      },
    }),
    [loading],
  );

  return (
    <div className='py-4'>
      <GenericList<NoticeRow>
        config={config}
        data={rows}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onSearch={value => {
          setPage(1);
          setSearch(value);
        }}
        onPrimaryFilterChange={value => {
          setPage(1);
          setStatusFilter(value as any);
        }}
        onSecondaryFilterChange={value => {
          setPage(1);
          setPriorityFilter(value as any);
        }}
        onPageChange={p => setPage(p)}
      />
    </div>
  );
};

export default AdminNoticesPage;
