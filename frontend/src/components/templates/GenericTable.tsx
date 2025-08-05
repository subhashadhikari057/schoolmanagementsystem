import React, { ReactNode } from 'react';
import { Pagination } from '../organisms/navigation/Pagination';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import { Eye, Edit } from 'lucide-react';

export interface BaseItem {
  id: number | string;
  [key: string]: unknown;
}

export interface TableColumn<T = BaseItem> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

export interface GenericTableProps<T extends BaseItem> {
  data: T[];
  columns: TableColumn<T>[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  emptyMessage?: string;
  onItemAction?: (action: string, item: T) => void;
}

const GenericTable = <T extends BaseItem>({
  data,
  columns,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  onItemAction,
}: GenericTableProps<T>) => {
  // Auto-detect status fields
  const isStatusField = (key: string, value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const statusPattern = /status|state|condition/i;
    return (
      statusPattern.test(key) ||
      [
        'active',
        'inactive',
        'pending',
        'suspended',
        'warning',
        'on leave',
      ].includes(value.toLowerCase())
    );
  };

  const renderCellValue = (key: string, value: unknown): ReactNode => {
    if (value === null || value === undefined) return '-';

    // Handle arrays (like subjects, linkedStudents)
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '-';
    }

    // Handle status fields with badges
    if (isStatusField(key, value)) {
      return <StatusBadge status={String(value)} />;
    }

    return String(value);
  };

  const renderCellContent = (item: T, column: TableColumn<T>): ReactNode => {
    // Use custom render function if provided
    if (column.render) {
      return column.render(item);
    }
    // Fall back to default rendering
    return renderCellValue(column.key, item[column.key]);
  };

  const handleAction = (action: string, item: T) => {
    if (onItemAction) {
      onItemAction(action, item);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      {data.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500'>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className='hidden lg:block overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {data.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className='lg:hidden'>
            {data.map(item => (
              <div
                key={item.id}
                className='p-4 border-b border-gray-200 last:border-b-0'
              >
                <div className='space-y-2'>
                  {columns.map(column => (
                    <div key={column.key} className='flex justify-between'>
                      <span className='text-sm font-medium text-gray-500'>
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className='text-sm text-gray-900'>
                        {renderCellContent(item, column)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GenericTable;
