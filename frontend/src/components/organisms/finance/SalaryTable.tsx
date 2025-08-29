'use client';

import React, { useState, useMemo } from 'react';
import GenericList, { BaseItem } from '@/components/templates/GenericList';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';

interface SalaryData extends BaseItem {
  id: number;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  amount: number; // total salary
  date: string;
  status: string;
  payPeriod: string;
  [key: string]: unknown;
}

const allSalaryData: SalaryData[] = [
  {
    id: 1,
    employeeId: 'EMP001',
    name: 'John Doe',
    role: 'Teacher',
    department: 'Academic',
    basicSalary: 6000,
    allowances: 1500,
    deductions: 0,
    amount: 7500,
    date: '2025-08-01',
    status: 'Paid',
    payPeriod: '2025-08',
  },
  {
    id: 2,
    employeeId: 'EMP002',
    name: 'Jane Smith',
    role: 'Accountant',
    department: 'Finance',
    basicSalary: 5500,
    allowances: 1000,
    deductions: 0,
    amount: 6500,
    date: '2025-08-01',
    status: 'Paid',
    payPeriod: '2025-08',
  },
  {
    id: 3,
    employeeId: 'EMP003',
    name: 'Sam Wilson',
    role: 'Staff',
    department: 'Administration',
    basicSalary: 4500,
    allowances: 500,
    deductions: 0,
    amount: 5000,
    date: '2025-08-01',
    status: 'Pending',
    payPeriod: '2025-08',
  },
];

const SalaryTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const salaryListConfig = {
    title: 'Salaries',
    searchPlaceholder: 'Search salaries...',
    searchValue: searchTerm,
    onSearchChange: setSearchTerm,
    primaryFilter: {
      title: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    secondaryFilter: {
      title: 'Role',
      value: roleFilter,
      onChange: setRoleFilter,
      options: [
        { value: 'all', label: 'All' },
        { value: 'teacher', label: 'Teacher' },
        { value: 'accountant', label: 'Accountant' },
        { value: 'staff', label: 'Staff' },
        { value: 'principal', label: 'Principal' },
        { value: 'librarian', label: 'Librarian' },
        { value: 'security', label: 'Security' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
    columns: [
      { key: 'employeeId', header: 'Employee ID' },
      { key: 'name', header: 'Name' },
      {
        key: 'role',
        header: 'Role',
        render: (item: SalaryData) => (
          <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium'>
            {item.role}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Total Salary',
        render: (item: SalaryData) => (
          <span className='font-semibold text-green-600'>
            ${item.amount.toLocaleString()}
          </span>
        ),
      },
      { key: 'date', header: 'Pay Date' },
      {
        key: 'status',
        header: 'Status',
        render: (item: SalaryData) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === 'Paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {item.status}
          </span>
        ),
      },
    ],
    emptyMessage: 'No salaries found.',
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = allSalaryData;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        salary =>
          salary.name.toLowerCase().includes(searchLower) ||
          salary.employeeId.toLowerCase().includes(searchLower) ||
          salary.role.toLowerCase().includes(searchLower) ||
          salary.department.toLowerCase().includes(searchLower) ||
          salary.status.toLowerCase().includes(searchLower) ||
          salary.amount.toString().includes(searchLower) ||
          salary.payPeriod.includes(searchLower),
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        salary => salary.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(
        salary => salary.role.toLowerCase() === roleFilter.toLowerCase(),
      );
    }

    return filtered;
  }, [searchTerm, statusFilter, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  return (
    <div className='space-y-6 bg-white'>
      <GenericList
        config={salaryListConfig}
        data={paginatedData}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        customActions={<ActionButtons pageType='salaries' />}
      />
    </div>
  );
};

export default SalaryTable;
