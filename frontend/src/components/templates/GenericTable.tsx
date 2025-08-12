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
  render?: (
    item: T,
    isSelected?: boolean,
    onSelect?: (id: string | number) => void,
    onSubjectAction?: (action: string, subject: T) => void,
  ) => ReactNode;
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
  onSubjectAction?: (action: string, subject: T) => void;
  onPageChange?: (page: number) => void;
  enableSelection?: boolean;
  selectedItems?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
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
  onSubjectAction,
  onPageChange,
  enableSelection = false,
  selectedItems = [],
  onSelectionChange,
}: GenericTableProps<T>) => {
  // Selection handling
  const handleItemSelect = (itemId: string | number) => {
    if (!onSelectionChange) return;

    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];

    onSelectionChange(newSelectedItems);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allIds = data.map(item => item.id);
    const isAllSelected = allIds.every(id => selectedItems.includes(id));

    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

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
      const isSelected = selectedItems.includes(item.id);
      return column.render(item, isSelected, handleItemSelect, onSubjectAction);
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
    <div className='bg-white rounded-lg shadow overflow-hidden w-full'>
      {data.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500'>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className='hidden lg:block w-full overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      {column.key === 'selection' && enableSelection ? (
                        <input
                          type='checkbox'
                          checked={
                            data.length > 0 &&
                            data.every(item => selectedItems.includes(item.id))
                          }
                          onChange={handleSelectAll}
                          className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                        />
                      ) : (
                        column.header
                      )}
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
          <div className='lg:hidden w-full'>
            {data.map(item => (
              <div
                key={item.id}
                className='p-3 sm:p-4 border-b border-gray-200 last:border-b-0 bg-white'
              >
                <div className='space-y-2'>
                  {columns.map(column => (
                    <div
                      key={column.key}
                      className='flex flex-col xs:flex-row xs:justify-between gap-1'
                    >
                      <span className='text-xs font-medium text-gray-500'>
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className='text-sm text-gray-900 break-words'>
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
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GenericTable;
