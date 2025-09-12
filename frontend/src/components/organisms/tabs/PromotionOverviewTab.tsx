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
  targetClassName?: string; // Optional for backward compatibility
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
          {classSummary.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <School className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>
                No classes found. Please ensure classes are created and have
                students assigned.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {classSummary.map(summary => {
                // Use targetClassName if available, otherwise extract from class name
                let isGraduating = false;
                let nextGrade = 'Next Grade';

                if (summary.targetClassName) {
                  // Use backend's targetClassName for accurate display
                  isGraduating = summary.targetClassName === 'Graduate';
                  nextGrade = summary.targetClassName;
                } else {
                  // Fallback: Extract grade number from class name
                  const gradeMatch =
                    summary.class.match(/Grade (\d+)/i) ||
                    summary.class.match(/(\d+)/);
                  const currentGrade = gradeMatch
                    ? parseInt(gradeMatch[1])
                    : null;
                  isGraduating = Boolean(currentGrade && currentGrade >= 12);
                  nextGrade = isGraduating
                    ? 'Graduate'
                    : currentGrade
                      ? `Grade ${currentGrade + 1}`
                      : 'Next Grade';
                }

                return (
                  <div
                    key={summary.class}
                    className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300'
                  >
                    {/* Class Header */}
                    <div className='flex items-center justify-between mb-3'>
                      <div className='bg-blue-50 px-3 py-1 rounded-full'>
                        <span className='text-sm font-semibold text-blue-700'>
                          {summary.class}
                        </span>
                      </div>
                      <ArrowRight className='w-4 h-4 text-gray-400' />
                      <div
                        className={`px-3 py-1 rounded-full ${isGraduating ? 'bg-purple-50' : 'bg-green-50'}`}
                      >
                        <span
                          className={`text-sm font-semibold ${isGraduating ? 'text-purple-700' : 'text-green-700'}`}
                        >
                          {nextGrade}
                        </span>
                      </div>
                    </div>

                    {/* Student Stats */}
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs text-gray-500'>
                          Total Students
                        </span>
                        <span className='font-bold text-gray-900'>
                          {summary.totalStudents}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-xs text-gray-500'>
                          Will {isGraduating ? 'Graduate' : 'Promote'}
                        </span>
                        <span
                          className={`font-bold ${isGraduating ? 'text-purple-600' : 'text-green-600'}`}
                        >
                          {summary.eligibleStudents - summary.selectedForStay}
                        </span>
                      </div>
                      {summary.selectedForStay > 0 && (
                        <div className='flex justify-between items-center'>
                          <span className='text-xs text-gray-500'>
                            Will Stay
                          </span>
                          <span className='font-bold text-orange-600'>
                            {summary.selectedForStay}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className='mt-3 pt-3 border-t border-gray-100'>
                      <div className='flex items-center gap-2 text-xs text-gray-500 mb-1'>
                        <span>Promotion Rate</span>
                        <span className='ml-auto font-medium'>
                          {summary.totalStudents > 0
                            ? Math.round(
                                ((summary.eligibleStudents -
                                  summary.selectedForStay) /
                                  summary.totalStudents) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className={`h-2 rounded-full ${isGraduating ? 'bg-purple-500' : 'bg-green-500'}`}
                          style={{
                            width:
                              summary.totalStudents > 0
                                ? `${((summary.eligibleStudents - summary.selectedForStay) / summary.totalStudents) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
