import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value?: string;
  onChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}
const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
}) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return; // click on trigger toggles separately
      }
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onChange: onValueChange,
        open,
        setOpen,
        triggerRef,
        contentRef,
      }}
    >
      <div className='relative inline-block w-full'>{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<
  React.HTMLAttributes<HTMLButtonElement>
> = ({ className, children, ...props }) => {
  const ctx = React.useContext(SelectContext);
  return (
    <button
      ref={ctx?.triggerRef}
      type='button'
      aria-haspopup='listbox'
      aria-expanded={ctx?.open || false}
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={cn(
        'border rounded px-2 py-1 text-sm w-full flex justify-between items-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500',
        className,
      )}
      {...props}
    >
      {children}
      <span className='ml-2 select-none text-gray-400'>
        {ctx?.open ? '▲' : '▼'}
      </span>
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({
  placeholder,
}) => {
  const ctx = React.useContext(SelectContext);
  return <span className='truncate'>{ctx?.value || placeholder || ''}</span>;
};

export const SelectContent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx?.open) return null;
  return (
    <div
      ref={ctx.contentRef}
      className='absolute z-50 mt-1 w-full border rounded shadow-sm bg-white p-1 max-h-60 overflow-auto text-sm animate-in fade-in-0'
      role='listbox'
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<{
  value: string;
  children?: React.ReactNode;
}> = ({ value, children }) => {
  const ctx = React.useContext(SelectContext);
  const selected = ctx?.value === value;
  return (
    <div
      role='option'
      aria-selected={selected}
      onClick={() => {
        ctx?.onChange?.(value);
        ctx?.setOpen(false);
        ctx?.triggerRef.current?.focus();
      }}
      className={cn(
        'px-2 py-1 rounded cursor-pointer select-none',
        selected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100',
      )}
    >
      {children}
    </div>
  );
};

export default Select;
