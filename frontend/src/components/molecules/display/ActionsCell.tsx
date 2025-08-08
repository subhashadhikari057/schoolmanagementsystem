import React from 'react';
import { Eye, Edit, Clock, Link, Trash2 } from 'lucide-react';

interface ActionsCellProps {
  onAction?: (action: string) => void;
  entityType?:
    | 'student'
    | 'teacher'
    | 'parent'
    | 'staff'
    | 'subject'
    | 'id-card';
}

const ActionsCell: React.FC<ActionsCellProps> = ({
  onAction,
  entityType = 'student',
}) => {
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
      icon: Clock,
      action: 'schedule',
      title: 'Schedule',
      color: 'text-orange-600 hover:text-orange-800',
    },
    {
      icon: Link,
      action: 'link',
      title: 'Share Link',
      color: 'text-purple-600 hover:text-purple-800',
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
        // For subjects: view, edit, delete (no schedule, no link)
        return allActions.filter(action =>
          ['view', 'edit', 'delete'].includes(action.action),
        );
      case 'id-card':
        // For ID cards: view, edit, print, regenerate
        return [
          allActions.find(a => a.action === 'view')!,
          allActions.find(a => a.action === 'edit')!,
          {
            icon: Clock,
            action: 'print',
            title: 'Print',
            color: 'text-indigo-600 hover:text-indigo-800',
          },
        ];
      default:
        // For students, teachers, parents, staff: all actions except delete
        return allActions.filter(action => action.action !== 'delete');
    }
  };

  const actions = getActionsForEntity(entityType);

  return (
    <div className='flex items-center gap-1'>
      {actions.map(({ icon: Icon, action, title, color }, index) => (
        <button
          key={action}
          onClick={() => onAction?.(action)}
          className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${color}`}
          title={title}
        >
          <Icon className='h-4 w-4' />
        </button>
      ))}
    </div>
  );
};

export default ActionsCell;
