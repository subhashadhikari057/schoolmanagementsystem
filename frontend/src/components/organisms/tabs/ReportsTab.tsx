'use client';

import React from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import Button from '@/components/atoms/form-controls/Button';
import { FileText, BarChart3, User, TrendingUp } from 'lucide-react';

interface ReportOption {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

export default function ReportsTab() {
  const reportOptions: ReportOption[] = [
    {
      id: '1',
      title: 'Class Performance Report',
      description: 'Detailed analysis of class-wise performance',
      color: 'bg-blue-500',
      icon: <FileText className='w-6 h-6 text-white' />,
    },
    {
      id: '2',
      title: 'Subject Analysis Report',
      description: 'Subject-wise performance breakdown',
      color: 'bg-green-500',
      icon: <BarChart3 className='w-6 h-6 text-white' />,
    },
    {
      id: '3',
      title: 'Student Progress Report',
      description: 'Individual student progress tracking',
      color: 'bg-purple-500',
      icon: <User className='w-6 h-6 text-white' />,
    },
    {
      id: '4',
      title: 'Comparative Analysis',
      description: 'Compare performance across periods',
      color: 'bg-orange-500',
      icon: <TrendingUp className='w-6 h-6 text-white' />,
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <SectionTitle
            text='Report Generation'
            level={3}
            className='text-xl font-semibold text-gray-900'
          />
          <Label className='text-gray-600'>
            Generate comprehensive reports for analysis and insights
          </Label>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left Panel: Generate Reports */}
        <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
          <SectionTitle
            text='Generate Reports'
            level={4}
            className='text-lg font-semibold text-gray-900 mb-6'
          />

          <div className='space-y-4'>
            {reportOptions.map(option => (
              <div
                key={option.id}
                className='flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 border border-gray-100'
              >
                <div
                  className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}
                >
                  {option.icon}
                </div>
                <div className='flex-1'>
                  <div className='font-medium text-gray-900 mb-1'>
                    {option.title}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {option.description}
                  </div>
                </div>
                <Button
                  label='Generate'
                  className='bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200'
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Quick Stats */}
        <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
          <SectionTitle
            text='Quick Stats'
            level={4}
            className='text-lg font-semibold text-gray-900 mb-6'
          />

          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Highest Score</div>
                  <div className='text-lg font-bold text-green-600'>93.75%</div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-red-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-red-600 transform rotate-180' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Lowest Score</div>
                  <div className='text-lg font-bold text-red-600'>68%</div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <BarChart3 className='w-5 h-5 text-blue-600' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Pass Rate</div>
                  <div className='text-lg font-bold text-blue-600'>91%</div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-purple-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                  <User className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <div className='text-sm text-gray-600'>Class Average</div>
                  <div className='text-lg font-bold text-purple-600'>82.1%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Report Options */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
        <SectionTitle
          text='Custom Reports'
          level={4}
          className='text-lg font-semibold text-gray-900 mb-4'
        />
        <Label className='text-gray-600 mb-4'>
          Create custom reports with specific parameters and date ranges
        </Label>

        <div className='flex flex-wrap gap-4'>
          <Button
            label='Export to PDF'
            className='bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-red-700'
          />
          <Button
            label='Export to Excel'
            className='bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-green-700'
          />
          <Button
            label='Schedule Report'
            className='bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700'
          />
          <Button
            label='Share Report'
            className='bg-purple-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-700'
          />
        </div>
      </div>
    </div>
  );
}
