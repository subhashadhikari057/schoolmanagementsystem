'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Eye,
} from 'lucide-react';

interface PromotionState {
  status: 'idle' | 'loading' | 'running' | 'completed' | 'error' | 'empty';
  progress: number;
  message?: string;
}

interface PromotionProgressTabProps {
  promotionState: PromotionState;
  totalPromotions: number;
  totalStaying: number;
  totalGraduating: number;
  onPreviewPromotion: () => void;
  onStartPromotion: () => void;
}

export default function PromotionProgressTab({
  promotionState,
  totalPromotions,
  totalStaying,
  totalGraduating,
  onPreviewPromotion,
  onStartPromotion,
}: PromotionProgressTabProps) {
  return (
    <div className='space-y-6'>
      {/* Promotion Status */}
      {promotionState.status !== 'idle' && (
        <Card className='border-gray-200 shadow-lg'>
          <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg'>
            <CardTitle className='flex items-center gap-3'>
              {promotionState.status === 'running' ? (
                <Clock className='w-5 h-5 text-blue-600 animate-pulse' />
              ) : promotionState.status === 'completed' ? (
                <CheckCircle className='w-5 h-5 text-green-600' />
              ) : promotionState.status === 'error' ? (
                <XCircle className='w-5 h-5 text-red-600' />
              ) : (
                <RefreshCw className='w-5 h-5 text-blue-600 animate-spin' />
              )}
              Promotion Progress
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='w-full'>
                <Progress
                  value={promotionState.progress}
                  className='h-3 bg-gray-200'
                />
              </div>
              <div className='text-sm text-gray-600'>
                {promotionState.message ||
                  (promotionState.status === 'running'
                    ? `Processing student promotions... ${promotionState.progress}%`
                    : promotionState.status === 'completed'
                      ? `Promotion completed successfully! ${totalPromotions} students promoted.`
                      : 'Ready to start promotion process')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className='border-gray-200 shadow-lg'>
        <CardContent className='p-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='text-sm text-gray-600'>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8'>
                <div className='text-center lg:text-left'>
                  <span className='font-bold text-green-600 text-lg'>
                    {totalPromotions}
                  </span>
                  <div className='text-gray-500'>students will be promoted</div>
                </div>
                <div className='text-center lg:text-left'>
                  <span className='font-bold text-orange-600 text-lg'>
                    {totalStaying}
                  </span>
                  <div className='text-gray-500'>students will stay</div>
                </div>
                <div className='text-center lg:text-left'>
                  <span className='font-bold text-purple-600 text-lg'>
                    {totalGraduating}
                  </span>
                  <div className='text-gray-500'>students will graduate</div>
                </div>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                variant='outline'
                onClick={onPreviewPromotion}
                disabled={promotionState.status === 'running'}
                className='gap-2'
              >
                <Eye className='w-4 h-4' />
                Preview Changes
              </Button>
              <Button
                onClick={onStartPromotion}
                disabled={promotionState.status === 'running'}
                className='gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              >
                <Play className='w-4 h-4' />
                {promotionState.status === 'running'
                  ? 'Processing...'
                  : 'Start Promotion'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
