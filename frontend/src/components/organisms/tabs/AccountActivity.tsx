import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import ReusableButton from '@/components/atoms/form-controls/Button';
import Icon from '@/components/atoms/display/Icon';
import { profileApi, AccountActivity } from '@/api/services/profile';

const getActivityIcon = (action: string, status: string) => {
  const isSuccess = status === 'SUCCESS';

  if (action.includes('UPDATE') || action.includes('CREATE')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M10 2v16M2 10h16'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  if (action.includes('PASSWORD')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <circle
            cx='10'
            cy='10'
            r='8'
            stroke='currentColor'
            strokeWidth='1.5'
          />
          <path
            d='M10 6v4l2 2'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  if (action.includes('DELETE')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-red-100 text-red-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m-6 0v10m-4-10v10'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  if (action.includes('EXPORT') || action.includes('DOWNLOAD')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M12 3v13m0 0l-4-4m4 4l4-4M3 21h18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </Icon>
    );
  }

  return (
    <Icon
      className={`p-2 mr-3 ${isSuccess ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}
    >
      <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
        <path
          d='M10 2a8 8 0 100 16 8 8 0 000-16z'
          stroke='currentColor'
          strokeWidth='1.5'
        />
        <path
          d='M10 6v4l2 2'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      </svg>
    </Icon>
  );
};

const formatActivityTitle = (action: string) => {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatActivityDescription = (activity: AccountActivity) => {
  const date = new Date(activity.createdAt).toLocaleDateString();
  const time = new Date(activity.createdAt).toLocaleTimeString();
  const device = activity.userAgent ? 'Web Browser' : 'Unknown Device';
  const ip = activity.ipAddress || 'Unknown IP';

  return `${date} at ${time} - ${device} (${ip})`;
};

export default function AccountActivityComponent() {
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getAccountActivity();

      // Filter out login-related activities and show everything else
      const nonLoginActivities = data.filter(
        activity =>
          !activity.action.includes('LOGIN') &&
          !activity.action.includes('AUTH') &&
          activity.module !== 'AUTH',
      );

      setActivities(nonLoginActivities);
    } catch (err) {
      setError('Failed to load account activity');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='w-full max-w-full mx-auto'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <SectionTitle
              text='Account Activity'
              className='text-lg font-semibold'
              level={2}
            />
            <Label className='mt-1'>
              Your recent account activity and system interactions (excluding
              login activities)
            </Label>
          </div>
        </div>
        <div className='space-y-3'>
          {[...Array(5)].map((_, i) => (
            <Card
              key={i}
              className='flex items-center p-4 rounded-xl bg-white border border-gray-100'
            >
              <div className='animate-pulse'>
                <div className='w-12 h-12 bg-gray-200 rounded mr-3'></div>
              </div>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-1/3 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-full mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <div>
          <SectionTitle
            text='Account Activity'
            className='text-lg font-semibold'
            level={2}
          />
          <Label className='mt-1'>
            Your recent account activity and system interactions (excluding
            login activities)
          </Label>
        </div>
        <ReusableButton
          label='Refresh'
          onClick={loadActivities}
          className='bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center'
        >
          <svg
            className='mr-1'
            width='16'
            height='16'
            fill='none'
            viewBox='0 0 16 16'
          >
            <path
              d='M8 3v10M3 8h10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
          Refresh
        </ReusableButton>
      </div>

      {error && (
        <div className='p-4 bg-red-50 border border-red-200 rounded-md mb-4'>
          <Label className='text-red-600'>{error}</Label>
        </div>
      )}

      {activities.length === 0 ? (
        <div className='text-center py-8'>
          <Label className='text-gray-500'>
            No activity found (excluding login activities)
          </Label>
        </div>
      ) : (
        <div className='space-y-3'>
          {activities.map(activity => (
            <Card
              key={activity.id}
              className='flex items-center p-4 rounded-xl bg-white border border-gray-100'
            >
              {getActivityIcon(activity.action, activity.status)}
              <div>
                <div className='font-medium text-gray-800'>
                  {formatActivityTitle(activity.action)}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {formatActivityDescription(activity)}
                </div>
                {activity.module && (
                  <div className='text-xs text-blue-600 mt-1'>
                    Module: {activity.module}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className='flex justify-center mt-6'>
        <ReusableButton
          label='Load More Activity'
          onClick={loadActivities}
          className='bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center'
        >
          <svg
            className='mr-1'
            width='16'
            height='16'
            fill='none'
            viewBox='0 0 16 16'
          >
            <path
              d='M8 3v10M3 8h10'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
          Load More Activity
        </ReusableButton>
      </div>
    </div>
  );
}
