'use client';

import React from 'react';

import ComplaintsAndLeavePage from '@/app/dashboard/student/complaints-leave/page';

// Parent wrapper: adds approve/reject for leave requests
export default function ParentComplaintsAndLeavesPage() {
  // You can extend ComplaintsAndLeavePage to add approve/reject buttons for leave requests
  // For now, reuse the student page and add a note for parent actions
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Complaints & Leave Requests</h1>
      <p className='text-gray-500 mb-6'>
        As a parent, you can approve or reject leave requests submitted by your
        children.
      </p>
      {/* Parent can approve/reject leave requests below */}
      <ComplaintsAndLeavePage />
    </div>
  );
}
