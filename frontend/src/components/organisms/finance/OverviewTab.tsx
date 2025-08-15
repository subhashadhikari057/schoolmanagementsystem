import React from 'react';

interface CollectionSummary {
  totalExpected: number;
  collected: number;
  outstanding: number;
  overdue: number;
  collectedPercent: number;
  title?: string;
}

interface PaymentMethod {
  label: string;
  value: number;
  percent: number;
  color: string;
  icon?: React.ReactNode;
}

interface GradeCollection {
  grade: string;
  students: number;
  collected: number;
  total: number;
  percent: number;
}

interface OverviewTabProps {
  collectionSummary: CollectionSummary;
  paymentMethods?: PaymentMethod[];
  gradeCollections: GradeCollection[];
  summaryTitle?: string;
  gradeTitle?: string;
}

function OverviewTab({
  collectionSummary,
  paymentMethods = [],
  gradeCollections,
  summaryTitle = 'Collection Summary',
  gradeTitle = 'Grade-wise Collection Status',
}: OverviewTabProps) {
  return (
    <div className='space-y-6'>
      {/* Top Row: Collection Summary & Payment Methods */}
      <div
        className={`grid grid-cols-1 ${paymentMethods.length > 0 ? 'md:grid-cols-2' : ''} gap-4`}
      >
        {/* Collection Summary */}
        <div className='bg-white rounded-lg shadow p-5 flex flex-col gap-2'>
          <div className='flex items-center justify-between mb-2'>
            <span className='font-semibold text-gray-900'>
              {(collectionSummary?.title ?? summaryTitle) ||
                'Collection Summary'}
            </span>
            <span className='text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold'>
              {collectionSummary?.collectedPercent ?? 0}% Collected
            </span>
          </div>
          <div className='text-xs text-gray-500 mb-1'>Total Expected</div>
          <div className='text-2xl font-bold text-gray-900 mb-2'>
            ${collectionSummary?.totalExpected?.toLocaleString?.() ?? '0'}
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-gray-500'>Collected</span>
            <span className='text-lg font-semibold text-green-600'>
              ${collectionSummary?.collected?.toLocaleString?.() ?? '0'}
            </span>
          </div>
          <div className='w-full h-2 bg-blue-100 rounded-full my-2'>
            <div
              className='h-2 rounded-full bg-blue-500'
              style={{ width: `${collectionSummary?.collectedPercent ?? 0}%` }}
            ></div>
          </div>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-yellow-600 font-semibold'>Outstanding</span>
            <span className='text-yellow-600 font-bold'>
              ${collectionSummary?.outstanding?.toLocaleString?.() ?? '0'}
            </span>
          </div>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-red-600 font-semibold'>Overdue</span>
            <span className='text-red-600 font-bold'>
              ${collectionSummary?.overdue?.toLocaleString?.() ?? '0'}
            </span>
          </div>
        </div>
        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
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
        )}
      </div>
      {/* Grade-wise Collection Status */}
      <div className='bg-white rounded-lg shadow p-5'>
        <span className='font-semibold text-gray-900 block mb-4'>
          {gradeTitle}
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
