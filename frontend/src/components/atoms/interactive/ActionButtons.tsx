import ToggleButton from "../form-controls/ToggleButton";

interface ActionButtonConfig {
  id: string;
  label: string;
  variant: string;
  className?: string;
  onClick: () => void;
}

const actionButtonsConfig: ActionButtonConfig[] = [
  {
    id: 'import',
    label: 'Import',
    variant: 'import',
    className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
    onClick: () => console.log('Import clicked')
  },
  {
    id: 'export',
    label: 'Export',
    variant: 'export',
    className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
    onClick: () => console.log('Export clicked')
  },
  {
    id: 'add-teacher',
    label: '+ Add Teacher',
    className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
    variant: 'primary',
    onClick: () => console.log('Add Teacher clicked')
  }
];

export const ActionButtons = () => {
  return (
    <div className="flex gap-2">
      {actionButtonsConfig.map((button) => (
        <div key={button.id} onClick={button.onClick}>
          <ToggleButton 
            className={button.className}
          >
            {button.label}
          </ToggleButton>
        </div>
      ))}
    </div>
  );
};