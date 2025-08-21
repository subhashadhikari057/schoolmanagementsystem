export function getEnumValues<T extends Record<string, string>>(
  enumObject: T,
): string[] {
  return Object.values(enumObject);
}
