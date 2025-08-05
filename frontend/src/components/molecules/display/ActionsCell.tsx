import React from 'react';
import { Eye, Edit, Clock, Link } from 'lucide-react';

interface ActionsCellProps {
  onAction?: (action: string) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({ onAction }) => {
  const actions = [
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
  ];

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
