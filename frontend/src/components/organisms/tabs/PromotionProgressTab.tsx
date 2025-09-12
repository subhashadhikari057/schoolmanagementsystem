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
  batchId?: string;
  processedStudents?: number;
  totalStudents?: number;
  promotedStudents?: number;
  retainedStudents?: number;
  graduatedStudents?: number;
  failedStudents?: number;
  errors?: string[];
}

interface PromotionProgressTabProps {
  promotionState: PromotionState;
  totalPromotions: number;
  totalStaying: number;
  totalGraduating: number;
  onPreviewPromotion: () => void;
  onStartPromotion: () => void;
  onRevertPromotion?: (batchId: string) => void;
  onRefreshPreview?: () => void;
  onCleanupStuckBatches?: () => void;
}

export default function PromotionProgressTab({
  promotionState,
  totalPromotions,
  totalStaying,
  totalGraduating,
  onPreviewPromotion,
  onStartPromotion,
  onRevertPromotion,
  onRefreshPreview,
  onCleanupStuckBatches,
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
                      ? `Promotion completed successfully!`
                      : 'Ready to start promotion process')}
              </div>

              {/* Detailed Progress Stats */}
              {promotionState.status === 'running' &&
                promotionState.processedStudents !== undefined && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-blue-600'>
                        {promotionState.processedStudents || 0}/
                        {promotionState.totalStudents || 0}
                      </div>
                      <div className='text-xs text-gray-500'>Processed</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-green-600'>
                        {promotionState.promotedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-500'>Promoted</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-purple-600'>
                        {promotionState.graduatedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-500'>Graduated</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-red-600'>
                        {promotionState.failedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-500'>Failed</div>
                    </div>
                  </div>
                )}

              {/* Final Results */}
              {promotionState.status === 'completed' &&
                promotionState.processedStudents !== undefined && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-green-600'>
                        {promotionState.processedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-600'>
                        Total Processed
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-green-600'>
                        {promotionState.promotedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-600'>Promoted</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-purple-600'>
                        {promotionState.graduatedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-600'>Graduated</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-orange-600'>
                        {promotionState.retainedStudents || 0}
                      </div>
                      <div className='text-xs text-gray-600'>Retained</div>
                    </div>
                  </div>
                )}

              {/* Error Display */}
              {promotionState.errors && promotionState.errors.length > 0 && (
                <div className='mt-4 p-4 bg-red-50 rounded-lg border border-red-200'>
                  <h4 className='text-sm font-medium text-red-800 mb-2'>
                    Errors encountered:
                  </h4>
                  <div className='text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto'>
                    {promotionState.errors.map((error, index) => (
                      <div key={index} className='flex items-start gap-2'>
                        <span className='text-red-500'>•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>

                  {/* Revert Button for Failed/Incomplete Promotions */}
                  {promotionState.batchId &&
                    (promotionState.status === 'error' ||
                      (promotionState.failedStudents &&
                        promotionState.failedStudents > 0) ||
                      (promotionState.errors &&
                        promotionState.errors.length > 0)) &&
                    onRevertPromotion && (
                      <div className='mt-3 pt-3 border-t border-red-200'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            onRevertPromotion(promotionState.batchId!)
                          }
                          className='text-red-700 border-red-300 hover:bg-red-50'
                        >
                          <XCircle className='w-4 h-4 mr-2' />
                          Revert Promotion
                        </Button>
                        <p className='text-xs text-red-600 mt-1'>
                          This will undo all completed promotions in this batch
                        </p>
                      </div>
                    )}
                </div>
              )}
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
              {onRefreshPreview && (
                <Button
                  variant='outline'
                  onClick={onRefreshPreview}
                  disabled={promotionState.status === 'running'}
                  className='gap-2'
                >
                  <RefreshCw className='w-4 h-4' />
                  Refresh Preview
                </Button>
              )}
              {onCleanupStuckBatches && (
                <Button
                  variant='outline'
                  onClick={onCleanupStuckBatches}
                  disabled={promotionState.status === 'running'}
                  className='gap-2 text-orange-600 border-orange-200 hover:bg-orange-50'
                >
                  <XCircle className='w-4 h-4' />
                  Fix Stuck Batches
                </Button>
              )}
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
