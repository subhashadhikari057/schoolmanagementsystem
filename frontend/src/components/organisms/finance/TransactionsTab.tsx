import React from 'react';

const transactions = [
  {
    name: 'Emily Johnson',
    type: 'Fee Payment',
    method: 'Online',
    date: '2025-01-28',
    amount: 1250,
    status: 'Completed',
    receipt: 'RCP001234',
  },
  {
    name: 'James Smith',
    type: 'Partial Payment',
    method: 'Bank Transfer',
    date: '2025-01-28',
    amount: 850,
    status: 'Completed',
    receipt: 'RCP001235',
  },
  {
    name: 'Sarah Wilson',
    type: 'Full Payment',
    method: 'Card',
    date: '2025-01-27',
    amount: 2100,
    status: 'Completed',
    receipt: 'RCP001236',
  },
];

function TransactionsTab() {
  return (
    <div className='bg-white rounded-lg shadow p-5'>
      <div className='flex items-center justify-between mb-4'>
        <span className='font-semibold text-gray-900'>Recent Transactions</span>
        <button className='flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100'>
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <path d='M15 12H9M12 9v6' />
          </svg>
          View All Transactions
        </button>
      </div>
      <div className='divide-y divide-gray-100'>
        {transactions.map(tx => (
          <div
            key={tx.receipt}
            className='flex items-center justify-between py-4'
          >
            <div className='flex items-center gap-3'>
              <span className='inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600'>
                <svg
                  width='22'
                  height='22'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 8v8M8 12h8' />
                  <circle cx='12' cy='12' r='10' />
                </svg>
              </span>
              <div>
                <div className='font-medium text-gray-900'>{tx.name}</div>
                <div className='text-xs text-gray-500 flex gap-2'>
                  <span>{tx.type}</span>
                  <span>•</span>
                  <span>{tx.method}</span>
                  <span>•</span>
                  <span>{tx.date}</span>
                </div>
              </div>
            </div>
            <div className='text-right min-w-[120px]'>
              <div className='font-semibold text-gray-900'>${tx.amount}</div>
              <div className='flex items-center gap-2 justify-end mt-1'>
                <span className='bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold'>
                  {tx.status}
                </span>
                <span className='text-xs text-gray-400'>{tx.receipt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionsTab;
