'use client';

import React from 'react';
import ComplaintsAndLeavePage from '@/app/dashboard/student/complaints&leave/page';

export default function TeacherComplaintsAndLeavePage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Complaints & Leave Requests</h1>
      <p className='text-gray-500 mb-6'>
        As a teacher, you can approve or reject leave requests that have been
        approved by parents.
      </p>
      {/* Teacher can approve/reject parent-approved leave requests */}
      <ComplaintsAndLeavePage userRole='teacher' />
    </div>
  );
}
