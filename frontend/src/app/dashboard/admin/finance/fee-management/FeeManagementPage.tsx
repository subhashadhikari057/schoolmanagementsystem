'use client';
import React from 'react';
import { FeeStructuresTab } from '@/components/organisms/finance/FeeStructuresTab';
import { ScholarshipsCharges } from '@/components/fees/ScholarshipsCharges';
import { useFinanceStore } from '@/store/finance';
import { FeeManagementLayout } from '@/components/organisms/finance/FeeManagementLayout';

export const FeeManagementPage: React.FC = () => {
  const { activeTab } = useFinanceStore();
  return (
    <FeeManagementLayout>
      {activeTab === 0 && <FeeStructuresTab />}
      {activeTab === 1 && <ScholarshipsCharges />}
    </FeeManagementLayout>
  );
};

export default FeeManagementPage;
