'use client';

import React from 'react';

import ComplaintsAndLeavePage from '@/app/dashboard/student/complaints-leave/page';

// Parent wrapper: adds approve/reject for leave requests
export default function ParentComplaintsAndLeavesPage() {
  // Pass userRole='parent' to show parent-specific functionality
  // Parents can approve/reject leave requests and resolve complaints
  return (
    <div className='w-full p-6'>
      <h1 className='text-2xl font-bold mb-4'>Complaints & Leave Requests</h1>
      <p className='text-gray-500 mb-6'>
        As a parent, you can approve or reject leave requests submitted by your
        children. If approved, the request will be sent to the teacher for final
        approval.
      </p>
      {/* Parent can approve/reject leave requests and resolve complaints below */}
      <ComplaintsAndLeavePage />
    </div>
  );
}
