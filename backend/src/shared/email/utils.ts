export const normalizeAddresses = (input?: string | string[]) => {
  if (!input) {
    return [] as string[];
  }

  const arr = Array.isArray(input) ? input : [input];
  return arr
    .map(value => value?.toString().trim())
    .filter((value): value is string => Boolean(value?.length));
};

export const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
