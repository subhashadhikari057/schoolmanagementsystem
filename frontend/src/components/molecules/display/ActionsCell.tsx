import React from 'react';
import { Eye, Edit, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

interface ActionsCellProps {
  onAction?: (action: string) => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  entityType?:
    | 'student'
    | 'teacher'
    | 'parent'
    | 'staff'
    | 'subject'
    | 'id-card';
  status?: 'Active' | 'On Leave' | 'Inactive' | 'Suspended' | 'Transferred';
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
}

const ActionsCell: React.FC<ActionsCellProps> = ({
  onAction,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  entityType = 'student',
  status = 'Active',
  viewLabel,
  editLabel,
  deleteLabel,
}) => {
  const isActive = status === 'Active';

  const getAllActions = () => [
    {
      icon: Eye,
      action: 'view',
      title: 'View Details',
      color: 'text-blue-600 hover:text-blue-800',
    },
    {
      icon: Edit,
      action: 'edit',
      title: 'Edit',
      color: 'text-green-600 hover:text-green-800',
    },
    {
      icon: isActive ? ToggleRight : ToggleLeft,
      action: 'toggle-status',
      title: isActive ? 'Deactivate' : 'Activate',
      color: isActive
        ? 'text-orange-600 hover:text-orange-800'
        : 'text-emerald-600 hover:text-emerald-800',
    },
    {
      icon: Trash2,
      action: 'delete',
      title: 'Delete',
      color: 'text-red-600 hover:text-red-800',
    },
  ];

  const getActionsForEntity = (type: string) => {
    const allActions = getAllActions();

    switch (type) {
      case 'subject':
        // For subjects: view, edit, delete (no status toggle)
        return allActions.filter(action =>
          ['view', 'edit', 'delete'].includes(action.action),
        );
      case 'id-card':
        // For ID cards: view, edit, print
        return [
          allActions.find(a => a.action === 'view')!,
          allActions.find(a => a.action === 'edit')!,
          {
            icon: ToggleRight,
            action: 'print',
            title: 'Print',
            color: 'text-indigo-600 hover:text-indigo-800',
          },
        ];
      case 'teacher':
        // For teachers: view, edit, toggle-status, delete
        return allActions;
      case 'staff':
        // For staff: view, edit, delete (no status toggle for now)
        return allActions.filter(action =>
          ['view', 'edit', 'delete'].includes(action.action),
        );
      default:
        // For students, parents: view, edit, toggle-status
        return allActions.filter(action => action.action !== 'delete');
    }
  };

  const actions = getActionsForEntity(entityType);

  return (
    <div className='flex items-center gap-1'>
      {actions.map(({ icon: Icon, action, title, color }, index) => {
        const handleClick = () => {
          // Use specific handlers if provided, otherwise fall back to generic onAction
          switch (action) {
            case 'view':
              onView ? onView() : onAction?.(action);
              break;
            case 'edit':
              onEdit ? onEdit() : onAction?.(action);
              break;
            case 'delete':
              onDelete ? onDelete() : onAction?.(action);
              break;
            case 'toggle-status':
              onToggleStatus ? onToggleStatus() : onAction?.(action);
              break;
            default:
              onAction?.(action);
          }
        };

        return (
          <button
            key={action}
            onClick={handleClick}
            className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${color}`}
            title={title}
          >
            <Icon className='h-4 w-4' />
          </button>
        );
      })}
    </div>
  );
};

export { ActionsCell };
export default ActionsCell;
