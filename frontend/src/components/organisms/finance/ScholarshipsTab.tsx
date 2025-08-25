'use client';
import React from 'react';
import { useFinanceStore } from '@/store/finance';
import { Plus } from 'lucide-react';

export const ScholarshipsTab: React.FC = () => {
  const { scholarships, upsertScholarship } = useFinanceStore();
  const add = () =>
    upsertScholarship({
      id: 'temp-' + Date.now(),
      name: 'New Scholarship',
      type: 'PERCENTAGE',
      value: 10,
      assignedCount: 0,
      status: 'active',
    });
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>Scholarships</h2>
        <button
          onClick={add}
          className='inline-flex items-center text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700'
        >
          <Plus className='w-3 h-3 mr-1' />
          New Scholarship
        </button>
      </div>
      <div className='bg-white rounded-lg border shadow-sm overflow-hidden'>
        <table className='min-w-full border-separate border-spacing-0 text-xs'>
          <thead className='bg-gray-50 text-gray-600'>
            <tr>
              {['Name', 'Type', 'Value', 'Assigned', 'Status'].map(h => (
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
            {scholarships.length === 0 && (
              <tr>
                <td colSpan={5} className='px-3 py-4 text-center text-gray-500'>
                  No scholarships.
                </td>
              </tr>
            )}
            {scholarships.map(s => (
              <tr key={s.id} className='hover:bg-gray-50'>
                <td className='px-3 py-2 font-medium'>{s.name}</td>
                <td className='px-3 py-2'>{s.type}</td>
                <td className='px-3 py-2'>
                  {s.type === 'PERCENTAGE' ? s.value + '%' : s.value.toFixed(2)}
                </td>
                <td className='px-3 py-2'>{s.assignedCount}</td>
                <td className='px-3 py-2'>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
