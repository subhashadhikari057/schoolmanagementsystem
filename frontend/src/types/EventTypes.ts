// types/index.ts
export interface Event {
  id: string;
  title: string;
  date: string;
  endDate?: string; // Add support for multi-day events
  time: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Scheduled';
  type?: string; // Add type field for event categorization
}
