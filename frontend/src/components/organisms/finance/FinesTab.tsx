'use client';
import React from 'react';
import { useFinanceStore } from '@/store/finance';
import { Plus } from 'lucide-react';

export const FinesTab: React.FC = () => {
  const { fines, upsertFine } = useFinanceStore();
  const add = () =>
    upsertFine({
      id: 'temp-' + Date.now(),
      reason: 'New Fine',
      type: 'FINE',
      amount: 25,
      appliedCount: 0,
      createdAt: new Date().toISOString(),
    });
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>Dues & Fines</h2>
        <button
          onClick={add}
          className='inline-flex items-center text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700'
        >
          <Plus className='w-3 h-3 mr-1' />
          Apply Fine/Due
        </button>
      </div>
      <div className='bg-white rounded-lg border shadow-sm overflow-hidden'>
        <table className='min-w-full border-separate border-spacing-0 text-xs'>
          <thead className='bg-gray-50 text-gray-600'>
            <tr>
              {['Reason', 'Type', 'Amount', 'Applied', 'Date'].map(h => (
                <th
                  key={h}
                  className='text-left font-medium px-3 py-2 border-b'
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 && (
              <tr>
                <td colSpan={5} className='px-3 py-4 text-center text-gray-500'>
                  No fines or dues.
                </td>
              </tr>
            )}
            {fines.map(f => (
              <tr key={f.id} className='hover:bg-gray-50'>
                <td className='px-3 py-2 font-medium'>{f.reason}</td>
                <td className='px-3 py-2'>{f.type}</td>
                <td className='px-3 py-2'>{f.amount.toFixed(2)}</td>
                <td className='px-3 py-2'>{f.appliedCount}</td>
                <td className='px-3 py-2'>
                  {new Date(f.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinesTab;
