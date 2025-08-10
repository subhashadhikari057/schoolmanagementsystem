import React from 'react';

// ...existing mock data from FinanceOverview...
const collectionSummary = {
  totalExpected: 2847500,
  collected: 2662300,
  outstanding: 185200,
  overdue: 45600,
  collectedPercent: 93.5,
};

const paymentMethods = [
  {
    label: 'Online Payments',
    value: 1847200,
    percent: 69.4,
    color: '#2F80ED',
    icon: (
      <span className='inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2'>
        <svg
          width='18'
          height='18'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <rect x='3' y='7' width='18' height='13' rx='2' />
          <path d='M16 3v4M8 3v4' />
        </svg>
      </span>
    ),
  },
  {
    label: 'Bank Transfer',
    value: 542100,
    percent: 20.4,
    color: '#22C55E',
    icon: (
      <span className='inline-block w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2'>
        <svg
          width='18'
          height='18'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <path d='M3 10v10h18V10' />
          <path d='M12 2L2 7h20L12 2z' />
        </svg>
      </span>
    ),
  },
  {
    label: 'Cash/Cheque',
    value: 273000,
    percent: 10.2,
    color: '#A78BFA',
    icon: (
      <span className='inline-block w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2'>
        <svg
          width='18'
          height='18'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <rect x='2' y='7' width='20' height='10' rx='2' />
          <path d='M6 11h.01M18 11h.01' />
        </svg>
      </span>
    ),
  },
];

const gradeCollections = [
  {
    grade: 'Grade 9',
    students: 712,
    collected: 589400,
    total: 623000,
    percent: 94.6,
  },
  {
    grade: 'Grade 10',
    students: 689,
    collected: 645200,
    total: 690800,
    percent: 93.4,
  },
  {
    grade: 'Grade 11',
    students: 756,
    collected: 702100,
    total: 756000,
    percent: 92.9,
  },
  {
    grade: 'Grade 12',
    students: 690,
    collected: 725600,
    total: 777700,
    percent: 93.3,
  },
];

function OverviewTab() {
  return (
    <div className='space-y-6'>
      {/* Top Row: Collection Summary & Payment Methods */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Collection Summary */}
        <div className='bg-white rounded-lg shadow p-5 flex flex-col gap-2'>
          <div className='flex items-center justify-between mb-2'>
            <span className='font-semibold text-gray-900'>
              Collection Summary
            </span>
            <span className='text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold'>
              {collectionSummary.collectedPercent}% Collected
            </span>
          </div>
          <div className='text-xs text-gray-500 mb-1'>Total Expected</div>
          <div className='text-2xl font-bold text-gray-900 mb-2'>
            ${collectionSummary.totalExpected.toLocaleString()}
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-gray-500'>Collected</span>
            <span className='text-lg font-semibold text-green-600'>
              ${collectionSummary.collected.toLocaleString()}
            </span>
          </div>
          <div className='w-full h-2 bg-blue-100 rounded-full my-2'>
            <div
              className='h-2 rounded-full bg-blue-500'
              style={{ width: `${collectionSummary.collectedPercent}%` }}
            ></div>
          </div>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-yellow-600 font-semibold'>Outstanding</span>
            <span className='text-yellow-600 font-bold'>
              ${collectionSummary.outstanding.toLocaleString()}
            </span>
          </div>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-red-600 font-semibold'>Overdue</span>
            <span className='text-red-600 font-bold'>
              ${collectionSummary.overdue.toLocaleString()}
            </span>
          </div>
        </div>
        {/* Payment Methods */}
        <div className='bg-white rounded-lg shadow p-5 flex flex-col gap-2'>
          <span className='font-semibold text-gray-900 mb-2'>
            Payment Methods
          </span>
          {paymentMethods.map(method => (
            <div
              key={method.label}
              className='flex items-center justify-between mb-1'
            >
              <div className='flex items-center'>
                {method.icon}
                <span className='text-sm text-gray-700 font-medium'>
                  {method.label}
                </span>
              </div>
              <div className='text-right'>
                <span className='font-semibold text-gray-900'>
                  ${method.value.toLocaleString()}
                </span>
                <span className='ml-2 text-xs text-gray-500'>
                  {method.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Grade-wise Collection Status */}
      <div className='bg-white rounded-lg shadow p-5'>
        <span className='font-semibold text-gray-900 block mb-4'>
          Grade-wise Collection Status
        </span>
        <div className='space-y-4'>
          {gradeCollections.map(grade => (
            <div key={grade.grade} className='flex flex-col gap-1'>
              <div className='flex items-center mb-1'>
                <span className='font-medium text-gray-800 mr-2 w-24'>
                  {grade.grade}
                </span>
                <span className='bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full mr-2'>
                  {grade.students} students
                </span>
                <span className='ml-auto font-semibold text-gray-700'>
                  ${grade.collected.toLocaleString()} / $
                  {grade.total.toLocaleString()}
                </span>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${grade.percent >= 94 ? 'bg-green-100 text-green-700' : grade.percent >= 93 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
                >
                  {grade.percent}%
                </span>
              </div>
              <div className='w-full h-2 bg-blue-100 rounded-full'>
                <div
                  className='h-2 rounded-full bg-blue-500'
                  style={{ width: `${grade.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
