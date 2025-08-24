'use client';
import React from 'react';
import { useFinanceStore } from '@/store/finance';
import PermissionGate from '@/components/auth/PermissionGate';

const tabs = [
  { id: 0, label: 'Fee Structures' },
  { id: 1, label: 'Scholarships & Charges' },
];

export const FeeManagementLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeTab, setActiveTab } = useFinanceStore();
  return (
    <PermissionGate required={['FINANCE_MANAGE_FEES']}>
      {' '}
      {/* broad finance gate; sub-tabs may add more */}
      <div className='min-h-screen bg-gray-50'>
        <div className='px-4 pt-4'>
          <nav className='text-xs text-gray-500 mb-4' aria-label='Breadcrumb'>
            <ol className='flex items-center space-x-1'>
              <li>
                <span>Dashboard</span>
              </li>
              <li>/</li>
              <li>
                <span>Admin</span>
              </li>
              <li>/</li>
              <li>
                <span>Finance</span>
              </li>
              <li>/</li>
              <li className='font-medium text-gray-700'>Fee Management</li>
            </ol>
          </nav>
          <div className='border-b border-gray-200 mb-6'>
            <div className='flex space-x-8'>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative py-3 text-sm font-medium transition-colors ${activeTab === t.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t.label}
                  <span
                    className={`absolute left-0 -bottom-px h-0.5 w-full transform transition-all ${activeTab === t.id ? 'bg-blue-600 scale-x-100' : 'bg-transparent scale-x-0'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </div>
    </PermissionGate>
  );
};
