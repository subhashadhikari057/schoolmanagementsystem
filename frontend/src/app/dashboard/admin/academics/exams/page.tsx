'use client';

import ExaminationManagementPanel from '@/components/organisms/examination/ExaminationManagementPanel';
import { useState } from 'react';
import CreateExamModal from '@/components/organisms/modals/CreateExamModal';

import StatCard from '@/components/molecules/cards/StatCard';
import { CalendarDays, CheckCircle2, Clock, Users } from 'lucide-react';

function ExamSummaryCards() {
  const cards = [
    {
      label: 'Upcoming Exams',
      value: 8,
      icon: CalendarDays,
      bgColor: 'bg-blue-100',
      iconColor: 'text-white',
      change: '+2',
      isPositive: true,
    },
    {
      label: 'Completed Exams',
      value: 24,
      icon: CheckCircle2,
      bgColor: 'bg-green-100',
      iconColor: 'text-white',
      change: '+5',
      isPositive: true,
    },
    {
      label: 'Results Pending',
      value: 3,
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-white',
      change: '-1',
      isPositive: false,
    },
    {
      label: 'Total Students',
      value: 2847,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-white',
      change: '+120',
      isPositive: true,
    },
  ];
  return (
    <div className='flex flex-wrap gap-6 mb-8'>
      {cards.map(c => (
        <StatCard
          key={c.label}
          icon={c.icon}
          bgColor={c.bgColor}
          iconColor={c.iconColor}
          label={c.label}
          value={c.value}
          change={c.change}
          isPositive={c.isPositive}
          className='flex-1 min-w-[220px] max-w-xs'
        />
      ))}
    </div>
  );
}
export default function ExamsPage() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className='min-h-screen bg-background'>
      <div className='px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <ExamSummaryCards />
        </div>
      </div>
      <div className='flex justify-center mt-6 sm:mt-10 lg:mt-12 px-3 sm:px-4 lg:px-6 pb-6'>
        <div className='w-full max-w-2xl'>
          <ExaminationManagementPanel onCreateExam={() => setShowModal(true)} />
        </div>
      </div>
      <CreateExamModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
