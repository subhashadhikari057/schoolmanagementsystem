import React from 'react';

import StatCard from '@/components/molecules/cards/StatCard';
import Button from '@/components/atoms/form-controls/Button';

type StatItem = {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  value: string;
  label: string;
  change: string;
  isPositive: boolean;
};

type ClassItem = {
  status: string;
  title: string;
  subtitle: string;
  tone: 'green' | 'blue' | 'gray';
};

type AssignmentItem = {
  title: string;
  subject: string;
  className: string;
  submissions: string;
  onClick?: () => void;
};

export default function Statsgrid({
  stats = [],
  variant = 'default',
  items = [],
  actionLabel = 'Learn More',
  className = '',
  itemClassName = '',
  cardClassName = '',
  classesSize = 'md',
}: {
  stats?: StatItem[];
  variant?: 'default' | 'classes' | 'assignments' | 'solid';
  items?: Array<ClassItem | AssignmentItem>;
  actionLabel?: string;
  className?: string; // container grid classes override
  itemClassName?: string; // applied to each rendered card for classes/assignments
  cardClassName?: string; // forwarded to StatCard (default/solid)
  classesSize?: 'md' | 'lg';
}) {
  const containerGrid =
    className ||
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6';
  if (variant === 'classes') {
    const classItems = items as ClassItem[];
    const cardPadding =
      classesSize === 'lg'
        ? 'px-4 py-4 sm:px-6 sm:py-5'
        : 'px-3 py-3 sm:px-4 sm:py-4';
    const statusSize =
      classesSize === 'lg'
        ? 'h-6 px-3 text-[11px] sm:h-7 sm:px-4 sm:text-[12px]'
        : 'h-5 px-2 text-[10px] sm:h-6 sm:px-3 sm:text-[11px]';
    const titleSize =
      classesSize === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';
    const subtitleSize =
      classesSize === 'lg' ? 'text-xs sm:text-sm' : 'text-xs';
    return (
      <div
        className={
          className ||
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
        }
      >
        {classItems.map((c, idx) => (
          <div
            key={idx}
            className={`rounded-lg border ${
              c.tone === 'green'
                ? 'border-green-200 bg-green-500 text-white'
                : c.tone === 'blue'
                  ? 'border-blue-200 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-900'
            } ${cardPadding} shadow-sm hover:shadow transition-shadow ${itemClassName}`}
          >
            <div
              className={`inline-flex items-center justify-center ${statusSize} rounded-full uppercase font-semibold mb-2 sm:mb-3 whitespace-nowrap ${
                c.tone === 'green'
                  ? 'bg-white text-green-700'
                  : c.tone === 'blue'
                    ? 'bg-white text-blue-700'
                    : 'bg-none text-gray-600'
              }`}
            >
              {c.status}
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex-1 min-w-0'>
                <div
                  className={`${titleSize} font-semibold ${
                    c.tone === 'green' || c.tone === 'blue'
                      ? 'text-white'
                      : 'text-gray-900'
                  } truncate`}
                >
                  {c.title}
                </div>
                <div
                  className={`${subtitleSize} ${
                    c.tone === 'green' || c.tone === 'blue'
                      ? 'text-white/90'
                      : 'text-gray-500'
                  } truncate mt-0.5`}
                >
                  {c.subtitle}
                </div>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  c.tone === 'green' || c.tone === 'blue'
                    ? 'bg-white'
                    : 'bg-gray-400'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'assignments') {
    const assignmentItems = items as AssignmentItem[];
    return (
      <div
        className={
          className || 'grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'
        }
      >
        {assignmentItems.map((a, idx) => (
          <div
            key={idx}
            className={`rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${itemClassName}`}
          >
            <div className={`flex items-start justify-between mb-2`}>
              <div
                className={`text-sm sm:text-base font-medium text-gray-900 line-clamp-2 flex-1 min-w-0 pr-2`}
              >
                {a.title}
              </div>
            </div>
            <div className={`text-xs text-gray-500 mb-3 truncate`}>
              Subject: {a.subject} • {a.className}
            </div>
            <div className='flex items-center justify-between gap-2'>
              <span className={`text-xs text-gray-500 truncate flex-1`}>
                {a.submissions}
              </span>
              <Button
                className={`px-3 py-1.5 border text-xs font-medium rounded-md bg-green-600 text-white border-green-600 hover:bg-green-700 flex-shrink-0`}
                label={actionLabel}
                onClick={a.onClick}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div className={containerGrid}>
        {stats.map((s, i) => (
          <StatCard
            key={i}
            variant='solid'
            bgColor={s.bgColor}
            label={s.label}
            value={s.value}
            change={s.change}
            className={`${cardClassName}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${containerGrid} mb-3 sm:mb-4 lg:mb-6 w-full`}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          bgColor={stat.bgColor}
          iconColor={stat.iconColor}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          isPositive={stat.isPositive}
          className={`${cardClassName}`}
        />
      ))}
    </div>
  );
}
