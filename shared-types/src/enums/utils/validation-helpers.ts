/**
 * Generate mock status for testing
 */
export const generateMockStatus = <T extends Record<string, string>>(
  enumObject: T
): T[keyof T] => {
  const values = Object.values(enumObject);
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
};