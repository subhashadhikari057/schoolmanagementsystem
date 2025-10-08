'use client';

import React from 'react';
import ExpensesandSalaries from '@/components/organisms/finance/ExpensesandSalaries';

/**
 * Salary Management Page
 *
 * Features:
 * - Separate tabs for Teachers and Staff
 * - Role-specific salary adjustment modals:
 *   - AddTeacherSalaryModal for teacher salary adjustments
 *   - AddStaffSalaryModal for staff salary adjustments
 * - Each modal handles its respective API endpoints and validation
 */
export default function SalaryManagementPage() {
  return <ExpensesandSalaries />;
}
