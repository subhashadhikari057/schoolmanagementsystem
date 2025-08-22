import React from 'react';
import StatCard from '../../molecules/cards/StatCard';

interface ChildSummaryCardsProps {
  child:
    | {
        attendance: number;
        dueFees: number;
        upcomingAssignments: number;
        nextExam: string;
      }
    | undefined;
}

const ChildSummaryCards: React.FC<ChildSummaryCardsProps> = ({ child }) => {
  if (!child) return null;
  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
      <StatCard
        label='Attendance'
        value={`${child.attendance}%`}
        change={0}
        isPositive={true}
        className='[&_*:is(.stat-label)]:block'
      />
      <StatCard
        label='Due Fees'
        value={`₹${child.dueFees}`}
        change={0}
        isPositive={child.dueFees === 0}
        className='[&_*:is(.stat-label)]:block'
      />
      <StatCard
        label='Upcoming Assignments'
        value={child.upcomingAssignments}
        change={0}
        isPositive={true}
        className='[&_*:is(.stat-label)]:block'
      />
      <StatCard
        label='Next Exam'
        value={child.nextExam}
        change={0}
        isPositive={true}
        className='[&_*:is(.stat-label)]:block'
      />
    </div>
  );
};

export default ChildSummaryCards;
