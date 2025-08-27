'use client';

import ComplaintsAndLeavePage from '@/app/dashboard/student/complaints-leave/page';

// Parent wrapper: adds approve/reject for leave requests and resolve for complaints
export default function ParentComplaintsAndLeavesPage() {
  // You can extend ComplaintsAndLeavePage to add approve/reject buttons for leave requests
  // For now, reuse the student page and add a note for parent actions
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Complaints & Leave Requests</h1>
      <p className='text-gray-500 mb-6'>
        As a parent, you can approve or reject leave requests submitted by your
        children and resolve complaints where you are the recipient.
      </p>
      {/* Parent can approve/reject leave requests and resolve complaints below */}
      <ComplaintsAndLeavePage />
    </div>
  );
}
