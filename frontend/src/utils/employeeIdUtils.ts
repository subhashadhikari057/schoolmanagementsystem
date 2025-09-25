/**
 * =============================================================================
 * Employee ID Utilities
 * =============================================================================
 * Utilities for generating and formatting employee IDs
 * =============================================================================
 */

/**
 * Generate a formatted employee ID for teachers
 * Format: T-YYYY-NNNN (e.g., T-2025-0004)
 */
export const generateTeacherEmployeeId = (
  existingIds: string[] = [],
): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `T-${currentYear}-`;

  // Extract existing sequence numbers for the current year
  const existingNumbers = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => {
      const match = id.match(/T-\d{4}-(\d{4})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  // Find the next available number
  const maxNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNumber = maxNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Generate a formatted employee ID for staff
 * Format: S-YYYY-NNNN (e.g., S-2025-0001)
 */
export const generateStaffEmployeeId = (existingIds: string[] = []): string => {
  const currentYear = new Date().getFullYear();
  const prefix = `S-${currentYear}-`;

  // Extract existing sequence numbers for the current year
  const existingNumbers = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => {
      const match = id.match(/S-\d{4}-(\d{4})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  // Find the next available number
  const maxNumber =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  const nextNumber = maxNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Generate a temporary employee ID when backend ID is not available
 * This should ideally be replaced by backend-generated IDs
 */
export const generateTempEmployeeId = (
  type: 'teacher' | 'staff',
  index: number = 0,
): string => {
  const currentYear = new Date().getFullYear();
  const prefix = type === 'teacher' ? 'T' : 'S';
  const randomSuffix = String(
    Math.floor(Math.random() * 1000) + index + 1,
  ).padStart(4, '0');

  return `${prefix}-${currentYear}-${randomSuffix}`;
};

/**
 * Validate if an employee ID follows the correct format
 */
export const isValidEmployeeId = (
  id: string,
  type?: 'teacher' | 'staff',
): boolean => {
  if (type === 'teacher') {
    return /^T-\d{4}-\d{4}$/.test(id);
  } else if (type === 'staff') {
    return /^S-\d{4}-\d{4}$/.test(id);
  } else {
    // General validation for any employee ID
    return /^[TS]-\d{4}-\d{4}$/.test(id);
  }
};

/**
 * Format an employee ID for display
 */
export const formatEmployeeIdForDisplay = (id: string): string => {
  if (!id) return 'N/A';

  // If it's already in the correct format, return as is
  if (isValidEmployeeId(id)) {
    return id;
  }

  // If it's a legacy format, try to detect type and convert
  if (id.startsWith('TCH') || id.startsWith('T-') || id.includes('teacher')) {
    return generateTempEmployeeId('teacher');
  } else if (
    id.startsWith('STF') ||
    id.startsWith('S-') ||
    id.includes('staff')
  ) {
    return generateTempEmployeeId('staff');
  }

  // Fallback: return as is
  return id;
};

/**
 * Extract the year from an employee ID
 */
export const getYearFromEmployeeId = (id: string): number | null => {
  const match = id.match(/[TS]-(\d{4})-\d{4}/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Extract the sequence number from an employee ID
 */
export const getSequenceFromEmployeeId = (id: string): number | null => {
  const match = id.match(/[TS]-\d{4}-(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Get the employee type from an employee ID
 */
export const getEmployeeTypeFromId = (
  id: string,
): 'teacher' | 'staff' | null => {
  if (id.startsWith('T-')) return 'teacher';
  if (id.startsWith('S-')) return 'staff';
  return null;
};
