import React from 'react';

interface ClassPerformance {
  className: string;
  subject: string;
  average: number;
  color: string;
}

interface ClassPerformanceOverviewProps {
  data: ClassPerformance[];
  title?: string;
}

export default function ClassPerformanceOverview({
  data,
  title = 'Class Performance Overview',
}: ClassPerformanceOverviewProps) {
  return (
    <div className='bg-white rounded-xl border border-gray-200 p-6 max-w-7xl mx-auto'>
      <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4'>
        {title}
      </h3>
      <div className='space-y-6'>
        {data.map((item, idx) => (
          <div key={idx} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-medium text-gray-900'>
                {item.className} - {item.subject}
              </span>
              <span className='bg-black text-white text-xs font-semibold px-3 py-1 rounded-full'>
                {item.average}% avg
              </span>
            </div>
            <div className='w-full h-2 bg-gray-200 rounded-full'>
              <div
                className={`h-2 rounded-full`}
                style={{
                  width: `${item.average}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
