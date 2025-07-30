/**
 * Status validation helper
 */
export const validateStatus = <T extends Record<string, string>>(
  enumObject: T,
  value: string
): value is T[keyof T] => {
  return Object.values(enumObject).includes(value as T[keyof T]);
};