'use client';

import ChartCard from '@/components/atoms/display/ChartCard';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import ReusableButton from '@/components/atoms/form-controls/Button';

export default function ExaminationManagementPanel({
  onCreateExam,
}: {
  onCreateExam: () => void;
}) {
  return (
    <ChartCard className='p-8 flex flex-col items-center gap-6'>
      <SectionTitle
        text='Examination Management'
        className='text-center text-lg font-semibold'
      />
      <p className='text-gray-500 text-center text-base mb-2'>
        Schedule exams, manage results, and generate report cards
      </p>
      <div className='flex flex-row gap-4 mt-2 w-full justify-center'>
        <ReusableButton
          onClick={onCreateExam}
          className='flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm shadow-sm min-w-[120px] h-12'
        >
          <span className='text-base'>+</span>
          <span className='leading-none'>Create Exam</span>
        </ReusableButton>
        <ReusableButton className='flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm min-w-[120px] h-12'>
          <span className='text-base'>📅</span>
          <span className='leading-none'>Exam Schedule</span>
        </ReusableButton>
        <ReusableButton className='flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm min-w-[120px] h-12'>
          <span className='text-base'>👁️</span>
          <span className='leading-none'>View Results</span>
        </ReusableButton>
      </div>
    </ChartCard>
  );
}
