'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Info,
  School,
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';

interface ClassSummary {
  class: string;
  totalStudents: number;
  eligibleStudents: number;
  selectedForStay: number;
}

interface PromotionOverviewTabProps {
  classSummary: ClassSummary[];
  totalStudents: number;
  totalPromotions: number;
  totalStaying: number;
  totalGraduating: number;
}

export default function PromotionOverviewTab({
  classSummary,
  totalStudents,
  totalPromotions,
  totalStaying,
  totalGraduating,
}: PromotionOverviewTabProps) {
  return (
    <div className='space-y-6'>
      {/* Quick Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Total Students
              </p>
              <p className='text-3xl font-bold text-gray-900 mt-1'>
                {totalStudents}
              </p>
            </div>
            <div className='bg-blue-100 p-3 rounded-lg'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Will be Promoted
              </p>
              <p className='text-3xl font-bold text-green-600 mt-1'>
                {totalPromotions}
              </p>
            </div>
            <div className='bg-green-100 p-3 rounded-lg'>
              <TrendingUp className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Will Graduate</p>
              <p className='text-3xl font-bold text-purple-600 mt-1'>
                {totalGraduating}
              </p>
            </div>
            <div className='bg-purple-100 p-3 rounded-lg'>
              <Award className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Will Stay</p>
              <p className='text-3xl font-bold text-orange-600 mt-1'>
                {totalStaying}
              </p>
            </div>
            <div className='bg-orange-100 p-3 rounded-lg'>
              <Clock className='w-6 h-6 text-orange-600' />
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Info */}
      <Alert className='bg-blue-50 border-blue-200 rounded-lg'>
        <Info className='h-4 w-4 text-blue-600' />
        <AlertDescription className='text-blue-800'>
          <strong>How it works:</strong> All eligible students will be
          automatically promoted to the next class. Students who don't meet
          promotion criteria or are manually selected will stay in their current
          class.
          <br />
          <span className='text-sm font-medium'>
            Data source: Live backend database with real student records
          </span>
        </AlertDescription>
      </Alert>

      {/* Class-wise Promotion Summary */}
      <Card className='border-gray-200 shadow-lg'>
        <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg'>
          <div className='flex items-center gap-3'>
            <School className='w-5 h-5 text-blue-600' />
            <CardTitle className='text-xl'>
              Promotion Summary by Class
            </CardTitle>
          </div>
          <CardDescription>
            Overview of students moving to the next grade
          </CardDescription>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {classSummary.map(summary => (
              <div
                key={summary.class}
                className='flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 transition-all duration-200'
              >
                <div className='flex items-center gap-4 mb-4 lg:mb-0'>
                  <div className='bg-white border border-gray-200 rounded-lg p-3'>
                    <span className='text-lg font-bold text-gray-900'>
                      Grade {summary.class}
                    </span>
                  </div>
                  <ArrowRight className='w-5 h-5 text-gray-400' />
                  <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3'>
                    <span className='text-lg font-bold'>
                      {summary.class === '12'
                        ? 'Graduate'
                        : `Grade ${parseInt(summary.class) + 1}`}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-8 text-sm'>
                  <div className='text-center lg:text-left'>
                    <div className='font-medium text-green-600 text-lg'>
                      {summary.eligibleStudents - summary.selectedForStay}
                    </div>
                    <div className='text-gray-600'>Promoting</div>
                  </div>
                  <div className='text-center lg:text-left'>
                    <div className='font-medium text-orange-600 text-lg'>
                      {summary.totalStudents -
                        summary.eligibleStudents +
                        summary.selectedForStay}
                    </div>
                    <div className='text-gray-600'>Staying</div>
                  </div>
                  <div className='text-center lg:text-left col-span-2 lg:col-span-1'>
                    <div className='text-gray-500 text-sm'>
                      of {summary.totalStudents} total students
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
