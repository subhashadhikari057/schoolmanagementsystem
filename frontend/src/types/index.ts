/**
 * =============================================================================
 * Type Definitions Export Index
 * =============================================================================
 * Centralized export for all TypeScript type definitions
 * =============================================================================
 */

export * from './user-role';
export * from './api';
export * from './auth';

// Common UI types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface FormFieldProps extends ComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: unknown }>;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalProps extends ComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  width?: number | string;
  destroyOnClose?: boolean;
  maskClosable?: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}
