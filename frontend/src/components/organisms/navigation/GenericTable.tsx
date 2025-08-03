import React, { ReactNode } from 'react';
import { Pagination } from './Pagination';
import StatusBadge from '@/components/atoms/data/StatusBadge';
import { Eye, Edit } from 'lucide-react';

export interface BaseItem {
  id: number | string;
  [key: string]: any;
}

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string;
}

export interface TableAction<T = any> {
  icon: ReactNode;
  action: string;
  className?: string;
  title?: string;
}

export interface GenericTableProps<T extends BaseItem = BaseItem> {
  data: T[];
  columns: TableColumn<T>[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  emptyMessage?: string;
  onItemAction?: (action: string, item: T) => void;
  customActions?: TableAction<T>[];
}

export const GenericTable = <T extends BaseItem>({
  data,
  columns,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  emptyMessage = "No data available",
  onItemAction,
  customActions
}: GenericTableProps<T>) => {
  
  const defaultActions: TableAction<T>[] = [
    {
      icon: <Eye size={16} className="text-blue-500" />,
      action: "view",
      title: "View"
    },
    {
      icon: <Edit size={16} className="text-green-500" />,
      action: "edit",
      title: "Edit"
    }
  ];

  const actions = customActions || defaultActions;

  const renderCellContent = (item: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = item[column.key];
    
    // Auto-detect and render status fields
    if (column.key.toLowerCase().includes('status') && typeof value === 'string') {
      return <StatusBadge status={value as any} />;
    }
    
    // Auto-render arrays as comma-separated strings
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value;
  };

  const handleAction = (action: string, item: T) => {
    onItemAction?.(action, item);
  };

  const renderMobileCard = (item: T) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {renderCellContent(item, columns[0])}
          </h3>
          {columns[1] && (
            <p className="text-xs text-gray-500 mt-1">
              {columns[1].mobileLabel || columns[1].header}: {renderCellContent(item, columns[1])}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Show status if any column contains status */}
          {columns.find(col => col.key.toLowerCase().includes('status')) && (
            <div>
              {renderCellContent(item, columns.find(col => col.key.toLowerCase().includes('status'))!)}
            </div>
          )}
        </div>
      </div>
      
      {/* Show additional fields in grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {columns.slice(2, 4).map((column) => (
          <div key={column.key}>
            <p className="text-xs text-gray-500">{column.header}</p>
            <p className="text-sm font-medium text-gray-900">
              {renderCellContent(item, column)}
            </p>
          </div>
        ))}
      </div>
      
      {/* Actions and remaining fields */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {columns.slice(4).map((column) => (
            <div key={column.key}>
              <p className="text-xs text-gray-500">{column.header}</p>
              <p className="text-sm font-medium text-gray-900">
                {renderCellContent(item, column)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action.action, item)}
              className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${action.className || ''}`}
              title={action.title}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Mobile Card Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            data.map((item) => (
              <div key={item.id}>
                {renderMobileCard(item)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td 
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {actions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleAction(action.action, item)}
                              className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${action.className || ''}`}
                              title={action.title}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default GenericTable;
