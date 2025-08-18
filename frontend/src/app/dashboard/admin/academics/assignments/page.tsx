/**
 * =============================================================================
 * Admin Assignment Management Page
 * =============================================================================
 * Admin page for managing all assignments across all classes
 * =============================================================================
 */

import React from 'react';
import AdminAssignmentManagement from '../../../../../components/organisms/admin/AdminAssignmentManagement';

export default function AdminAssignmentsPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminAssignmentManagement />
    </div>
  );
}

export const metadata = {
  title: 'Assignment Management - Admin Dashboard',
  description: 'Manage all assignments across all classes and subjects',
};
