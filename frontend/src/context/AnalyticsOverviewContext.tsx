'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AnalyticsOverviewContextType {
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
  toggleAnalytics: () => void;
}

const AnalyticsOverviewContext = createContext<
  AnalyticsOverviewContextType | undefined
>(undefined);

export const AnalyticsOverviewProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showAnalytics, setShowAnalytics] = useState(true);
  const toggleAnalytics = () => setShowAnalytics(prev => !prev);
  return (
    <AnalyticsOverviewContext.Provider
      value={{ showAnalytics, setShowAnalytics, toggleAnalytics }}
    >
      {children}
    </AnalyticsOverviewContext.Provider>
  );
};

export const useAnalyticsOverview = () => {
  const ctx = useContext(AnalyticsOverviewContext);
  if (!ctx)
    throw new Error(
      'useAnalyticsOverview must be used within AnalyticsOverviewProvider',
    );
  return ctx;
};
