'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/molecules/NotificationContainer';

interface BackupContextType {
  toast: ReturnType<typeof useToast>;
}

const BackupContext = createContext<BackupContextType | undefined>(undefined);

export const useBackupContext = () => {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackupContext must be used within a BackupProvider');
  }
  return context;
};

interface BackupProviderProps {
  children: ReactNode;
}

export const BackupProvider: React.FC<BackupProviderProps> = ({ children }) => {
  const toast = useToast();

  const value: BackupContextType = useMemo(
    () => ({
      toast,
    }),
    [toast],
  );

  return (
    <BackupContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </BackupContext.Provider>
  );
};
