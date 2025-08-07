/**
 * =============================================================================
 * Utilities Export Index
 * =============================================================================
 * Centralized export for all utility functions
 * =============================================================================
 */

export * from './api';
export * from './confirmation-toast';

// Common utility functions
export function cn(
  ...classes: (string | undefined | null | boolean)[]
): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  return dateObj.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return first + last || '?';
}

/**
 * Returns true if dev mock mode is enabled (for local frontend development without backend).
 * Controlled by NODE_ENV=development and NEXT_PUBLIC_DEV_SIDEBAR=true in .env.local
 */
export function isDevMockEnabled() {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_DEV_SIDEBAR === 'true'
  );
}
