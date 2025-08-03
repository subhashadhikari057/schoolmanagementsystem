export function validateRequired<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    throw new Error('Value is required');
  }
  return value;
}