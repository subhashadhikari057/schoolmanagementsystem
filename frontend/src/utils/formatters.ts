/**
 * Format a date string to a human-readable format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
};

/**
 * Format a currency value
 * @param value Number to format as currency
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value?: number | string,
  currency = 'USD',
): string => {
  if (value === undefined || value === null) return 'N/A';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numValue);
};

/**
 * Format a phone number to a standard format
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export const formatPhone = (phone?: string): string => {
  if (!phone) return 'N/A';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export const truncateString = (str?: string, maxLength = 50): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};
