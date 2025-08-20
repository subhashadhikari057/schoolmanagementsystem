// types/index.ts
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Scheduled';
}
