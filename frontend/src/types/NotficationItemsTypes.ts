export interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'info' | 'warning' | 'success' | 'error';
    icon: React.ReactNode;
    read: boolean;
  }