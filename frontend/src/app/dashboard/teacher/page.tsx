'use client';

import { AuthGuard } from '@/components/layout/auth-guard';
import { UserRole } from '@sms/shared-types';

export default function TeacherDashboard() {
  return (
    <AuthGuard requiredRole={[UserRole.TEACHER]}>
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h1 className='text-3xl font-bold text-gray-900 mb-6'>
              Teacher Dashboard
            </h1>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              <div className='bg-blue-50 p-6 rounded-lg'>
                <h2 className='text-xl font-semibold text-blue-900 mb-2'>
                  My Classes
                </h2>
                <p className='text-blue-700'>
                  Manage your classes and students
                </p>
              </div>
              <div className='bg-green-50 p-6 rounded-lg'>
                <h2 className='text-xl font-semibold text-green-900 mb-2'>
                  Assignments
                </h2>
                <p className='text-green-700'>Create and grade assignments</p>
              </div>
              <div className='bg-purple-50 p-6 rounded-lg'>
                <h2 className='text-xl font-semibold text-purple-900 mb-2'>
                  Attendance
                </h2>
                <p className='text-purple-700'>Track student attendance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
