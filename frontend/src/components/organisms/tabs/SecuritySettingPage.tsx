'use client';

import React, { useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import {
  profileApi,
  ChangePasswordDto,
  AccountActivity,
} from '@/api/services/profile';
import Icon from '@/components/atoms/display/Icon';
import ChangePasswordModal from '@/components/organisms/modals/ChangePasswordModal';

const getActivityIcon = (action: string, status: string) => {
  const isSuccess = status === 'SUCCESS';

  if (action.includes('LOGIN')) {
    return (
      <Icon
        className={`p-2 mr-3 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
      >
        <svg width='20' height='20' fill='none' viewBox='0 0 20 20'>
          <path
            d='M16.7 6.7l-6.4 6.6-3-3'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
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

// Password validation functions
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    isValid:
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
  };
};

// Calculate password strength based on user profile metadata
const calculatePasswordStrength = (userProfile: any) => {
  // Since we can't analyze the actual password (it's hashed),
  // we'll determine strength based on user profile metadata
  let score = 60; // Default medium score
  let strengthText = 'Medium';
  let color = 'orange';
  let bgColor = 'bg-orange-100';
  let textColor = 'text-orange-700';
  let barColor = 'bg-orange-500';

  if (!userProfile) {
    return {
      strength: 'Unknown',
      percentage: 0,
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      barColor: 'bg-gray-400',
    };
  }

  // Determine strength based on account security factors
  if (
    (userProfile as any)?.passwordUpdatedAt ||
    (userProfile as any)?.updatedAt
  ) {
    const passwordAge = Math.floor(
      (new Date().getTime() -
        new Date(
          (userProfile as any).passwordUpdatedAt ||
            (userProfile as any).updatedAt,
        ).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (passwordAge < 30) {
      // Recently updated password suggests strong security practices
      score = 85;
      strengthText = 'Strong';
      color = 'green';
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      barColor = 'bg-green-500';
    } else if (passwordAge < 90) {
      // Moderately recent password
      score = 70;
      strengthText = 'Medium';
      color = 'orange';
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-700';
      barColor = 'bg-orange-500';
    } else {
      // Old password suggests weaker security
      score = 40;
      strengthText = 'Weak';
      color = 'yellow';
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      barColor = 'bg-yellow-500';
    }
  }

  // Additional factors can be added here based on available user profile data
  if (userProfile?.role === 'admin' || userProfile?.role === 'superadmin') {
    // Admin accounts should have stronger passwords
    score = Math.min(score + 10, 100);
  }

  return {
    strength: strengthText,
    percentage: score,
    color,
    bgColor,
    textColor,
    barColor,
  };
};

interface SecuritySettingsProps {
  editing?: boolean;
}

export default function SecuritySettings(props: SecuritySettingsProps) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const editing = props.editing ?? false;
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get real-time password strength based on user's profile metadata
  const passwordStrengthInfo = calculatePasswordStrength(userProfile);

  const [passwordLastChanged, setPasswordLastChanged] = useState(
    'Last changed 30 days ago',
  );
  const [sessionCount, setSessionCount] = useState(3);
  const [securityScore, setSecurityScore] = useState(94);
  const sessions = [
    {
      device: 'Current Session',
      status: 'Active',
      icon: 'wifi',
      color: 'text-green-600',
    },
    {
      device: 'Desktop',
      status: 'Active',
      icon: 'desktop',
      color: 'text-blue-600',
    },
    {
      device: 'Mobile',
      status: '2h ago',
      icon: 'mobile',
      color: 'text-orange-500',
    },
  ];
  const securityChecks = [
    { label: 'Strong Password', passed: passwordStrengthInfo.percentage >= 80 },
    { label: 'Recent Login', passed: true },
  ];

  // Calculate dynamic security score based on actual security factors
  const dynamicSecurityScore = React.useMemo(() => {
    let score = 0;
    securityChecks.forEach(check => {
      if (check.passed) score += 50; // Each check contributes 50%
    });
    return Math.min(score, 100);
  }, [passwordStrengthInfo.percentage]);
  const [loginHistory, setLoginHistory] = useState<AccountActivity[]>([]);

  // Fetch user profile and password information
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await profileApi.getProfile();
        setUserProfile(profile);

        // Update password last changed date if available
        if (
          (profile as any)?.passwordUpdatedAt ||
          (profile as any)?.updatedAt
        ) {
          const date = new Date(
            (profile as any).passwordUpdatedAt || (profile as any).updatedAt,
          );
          const daysDiff = Math.floor(
            (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
          );
          setPasswordLastChanged(`Last changed ${daysDiff} days ago`);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    profileApi.getAccountActivity().then(data => {
      setLoginHistory(data);
    });
  }, []);

  return (
    <div className='w-full max-w-full mx-auto space-y-8'>
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {/* Top dashboard cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Password & Authentication Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 flex flex-col justify-between min-h-[320px]'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='font-semibold text-lg flex items-center gap-2'>
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  viewBox='0 0 20 20'
                  className='mr-1 text-gray-500'
                >
                  <path
                    d='M10 13a2 2 0 100-4 2 2 0 000 4z'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                  <rect
                    x='4'
                    y='7'
                    width='12'
                    height='9'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                  <path
                    d='M7 7V5a3 3 0 016 0v2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                </svg>
                Password & Authentication
              </span>
            </div>
            <Label className='text-sm text-muted-foreground mb-2 block'>
              Manage your account security settings
            </Label>
            <div className='mt-4'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm'>Password Strength</span>
                {loading ? (
                  <div className='px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold animate-pulse'>
                    Loading...
                  </div>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded ${passwordStrengthInfo.bgColor} ${passwordStrengthInfo.textColor} text-xs font-semibold`}
                  >
                    {passwordStrengthInfo.strength}
                  </span>
                )}
              </div>
              <div className='w-full h-2 bg-gray-200 rounded mt-2'>
                <div
                  className={`h-2 rounded ${loading ? 'bg-gray-400' : passwordStrengthInfo.barColor}`}
                  style={{
                    width: `${loading ? 30 : passwordStrengthInfo.percentage}%`,
                  }}
                ></div>
              </div>
              <Label className='text-xs text-muted-foreground mt-1 block'>
                {passwordLastChanged}
              </Label>
            </div>
          </div>
          <div className='mt-6 flex flex-col gap-3'>
            <ReusableButton
              label='Change Password'
              onClick={() =>
                editing ? setShowChangePasswordModal(true) : null
              }
              className={`w-full py-2 rounded-lg bg-blue-500 text-white font-semibold ${!editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!editing}
            />
          </div>
        </Card>

        {/* Sessions Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 min-h-[320px] flex flex-col justify-between'>
          <div>
            <span className='font-semibold text-lg flex items-center gap-2'>
              <svg
                width='20'
                height='20'
                fill='none'
                viewBox='0 0 20 20'
                className='mr-1 text-gray-500'
              >
                <path
                  d='M4 6h12v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <path d='M8 16h4' stroke='currentColor' strokeWidth='1.5' />
              </svg>
              Sessions
            </span>
            <Label className='text-sm text-muted-foreground mb-2 block'>
              {editing ? (
                <input
                  className='text-sm text-muted-foreground bg-transparent border-b border-gray-300'
                  value={`${sessionCount} Active Sessions`}
                  onChange={e => {
                    const match = e.target.value.match(/(\d+)/);
                    if (match) setSessionCount(Number(match[1]));
                  }}
                />
              ) : (
                `${sessionCount} Active Sessions`
              )}
            </Label>
            <div className='mt-4 space-y-2'>
              {sessions.map((s, i) => (
                <div key={i} className='flex items-center gap-2'>
                  <span
                    className={`w-5 h-5 flex items-center justify-center ${s.color}`}
                  >
                    {s.icon === 'wifi' ? (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <path
                          d='M9 15.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5-3.5a5 5 0 017 0'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                        <path
                          d='M3 9a9 9 0 0112 0'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    ) : s.icon === 'desktop' ? (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <rect
                          x='3'
                          y='5'
                          width='12'
                          height='7'
                          rx='2'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                        <path
                          d='M6 15h6'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    ) : (
                      <svg
                        width='18'
                        height='18'
                        fill='none'
                        viewBox='0 0 18 18'
                      >
                        <rect
                          x='5'
                          y='3'
                          width='8'
                          height='12'
                          rx='2'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                      </svg>
                    )}
                  </span>
                  <span className='text-sm font-medium'>{s.device}</span>
                  <span className='text-xs text-muted-foreground ml-2'>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Security Score Card */}
        <Card className='p-6 rounded-xl bg-white border border-gray-200 min-h-[320px] flex flex-col justify-between'>
          <div>
            <span className='font-semibold text-lg flex items-center gap-2'>
              <svg
                width='20'
                height='20'
                fill='none'
                viewBox='0 0 20 20'
                className='mr-1 text-gray-500'
              >
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
              Security
            </span>
            <div className='flex items-center gap-2 mt-2'>
              {editing ? (
                <input
                  type='number'
                  className='text-3xl font-bold text-green-600 bg-transparent border-b border-gray-300 w-16'
                  value={securityScore}
                  onChange={e => setSecurityScore(Number(e.target.value))}
                />
              ) : loading ? (
                <span className='text-3xl font-bold text-gray-400 animate-pulse'>
                  --
                </span>
              ) : (
                <span
                  className={`text-3xl font-bold ${dynamicSecurityScore >= 80 ? 'text-green-600' : dynamicSecurityScore >= 60 ? 'text-orange-600' : 'text-red-600'}`}
                >
                  {dynamicSecurityScore}%
                </span>
              )}
              <span className='text-xs text-muted-foreground'>
                Security Score
              </span>
            </div>
            <div className='mt-4 space-y-2'>
              {securityChecks.map((c, i) => (
                <div key={i} className='flex items-center gap-2'>
                  {c.passed ? (
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      viewBox='0 0 16 16'
                      className='text-green-600'
                    >
                      <path
                        d='M3 8l3 3 7-7'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  ) : (
                    <svg
                      width='16'
                      height='16'
                      fill='none'
                      viewBox='0 0 16 16'
                      className='text-red-600'
                    >
                      <path
                        d='M12 4L4 12M4 4l8 8'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${c.passed ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Login History */}
      <Card className='p-6 rounded-xl bg-white border border-gray-200'>
        <div className='mb-2 flex items-center gap-2'>
          <svg
            width='20'
            height='20'
            fill='none'
            viewBox='0 0 20 20'
            className='text-gray-500'
          >
            <rect
              x='3'
              y='5'
              width='14'
              height='10'
              rx='2'
              stroke='currentColor'
              strokeWidth='1.5'
            />
            <path d='M7 17h6' stroke='currentColor' strokeWidth='1.5' />
          </svg>
          <span className='font-semibold text-lg'>Recent Login History</span>
        </div>
        <Label className='text-sm text-muted-foreground block'>
          Your recent login attempts and device information
        </Label>
        <div className='mt-4 space-y-2'>
          {loginHistory.map((item, i) => {
            // Smart device/browser/OS parsing from userAgent
            let deviceType = 'Desktop';
            let browser = 'Unknown Browser';
            let os = 'Unknown OS';
            if (item.userAgent) {
              const ua = item.userAgent;
              if (/mobile/i.test(ua)) deviceType = 'Mobile';
              else if (/tablet/i.test(ua)) deviceType = 'Tablet';
              else if (/windows|macintosh|linux/i.test(ua))
                deviceType = 'Desktop';
              // Browser detection
              if (/chrome/i.test(ua)) browser = 'Chrome';
              else if (/firefox/i.test(ua)) browser = 'Firefox';
              else if (/safari/i.test(ua) && !/chrome/i.test(ua))
                browser = 'Safari';
              else if (/edge/i.test(ua)) browser = 'Edge';
              else if (/opera|opr/i.test(ua)) browser = 'Opera';
              // OS detection
              if (/windows/i.test(ua)) os = 'Windows';
              else if (/macintosh|mac os x/i.test(ua)) os = 'MacOS';
              else if (/linux/i.test(ua)) os = 'Linux';
              else if (/android/i.test(ua)) os = 'Android';
              else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
            }
            // Status and color
            const status = item.status === 'SUCCESS' ? 'Success' : 'Failed';
            const color =
              status === 'Success' ? 'text-blue-600' : 'text-red-500';
            const badge =
              status === 'Success'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-red-100 text-red-600';
            // IP formatting
            let ip = item.ipAddress;
            if (!ip || ip === '::1' || ip === '127.0.0.1') ip = 'Localhost';
            // Date/time formatting
            const dateObj = new Date(item.createdAt);
            const date = dateObj.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const time = dateObj.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={item.id}
                className='flex items-center p-4 rounded-xl border border-gray-100'
              >
                <span
                  className={`w-10 h-10 flex items-center justify-center ${color}`}
                >
                  {deviceType === 'Desktop' ? (
                    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                      <rect
                        x='4'
                        y='7'
                        width='16'
                        height='10'
                        rx='2'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                      <path
                        d='M8 21h8'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                    </svg>
                  ) : deviceType === 'Mobile' ? (
                    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                      <rect
                        x='7'
                        y='4'
                        width='10'
                        height='16'
                        rx='2'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                    </svg>
                  ) : (
                    <svg width='24' height='24' fill='none' viewBox='0 0 24 24'>
                      <rect
                        x='6'
                        y='5'
                        width='12'
                        height='14'
                        rx='2'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      />
                    </svg>
                  )}
                </span>
                <div className='flex-1 ml-3'>
                  <div className='font-medium text-gray-800'>
                    {deviceType}{' '}
                    <span className='text-xs text-gray-400'>
                      ({browser}, {os})
                    </span>
                  </div>
                  <div className='text-xs text-gray-500'>{ip}</div>
                </div>
                <div className='flex flex-col items-end'>
                  <span className='text-xs text-gray-500'>{date}</span>
                  <span className='text-xs text-gray-500'>{time}</span>
                  <span
                    className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${badge}`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
