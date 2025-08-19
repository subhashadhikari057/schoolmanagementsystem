/**
 * =============================================================================
 * Teacher Attendance Page
 * =============================================================================
 * Attendance management page for teachers in the dashboard
 * =============================================================================
 */

import { ClassSelectionPage } from '@/components/organisms/attendance/ClassSelectionPage';

export default function TeacherAttendancePage() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Attendance Management
          </h1>
          <p className='text-gray-600 mt-1'>
            Take daily attendance and manage student records
          </p>
        </div>
      </div>

      <ClassSelectionPage />
    </div>
  );
}
