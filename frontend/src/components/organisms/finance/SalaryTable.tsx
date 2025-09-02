'use client';

import React, { useState, useMemo, useEffect } from 'react';
import GenericList, { BaseItem } from '@/components/templates/GenericList';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { TeacherService } from '@/api/services/teacher.service';
import { StaffService } from '@/api/services/staff.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SalaryData extends BaseItem {
  id: string | number;
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
  employeeType: 'teacher' | 'staff';
  [key: string]: unknown;
}

const SalaryTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Initialize service instances
  const teacherService = new TeacherService();
  const staffService = new StaffService();

  // Fetch teachers and staff data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);

        // Fetch teachers and staff in parallel
        const [teachersResponse, staffResponse] = await Promise.all([
          teacherService.getAllTeachers(),
          staffService.getAllStaff(),
        ]);

        const combinedSalaryData: SalaryData[] = [];

        // Debug: Log the API responses to understand the data structure
        console.log('Teachers API Response:', teachersResponse);
        console.log('Staff API Response:', staffResponse);

        // Process teachers data
        if (teachersResponse.success && teachersResponse.data) {
          console.log('Raw Teachers Data:', teachersResponse.data);
          const teacherSalaries = teachersResponse.data.map(
            (teacher: any, index: number) => {
              // Extract name properly from different possible formats
              let teacherName = 'Unknown Teacher';
              if (teacher.name) {
                teacherName = teacher.name;
              } else if (teacher.firstName || teacher.lastName) {
                teacherName =
                  `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
              } else if (teacher.fullName) {
                teacherName = teacher.fullName;
              }

              return {
                id: `teacher_${teacher.id || index}`,
                employeeId:
                  teacher.teacherId ||
                  teacher.id ||
                  `TCH${String(index + 1).padStart(3, '0')}`,
                name: teacherName,
                role: 'Teacher',
                department: teacher.department || teacher.subject || 'Academic',
                basicSalary:
                  teacher.basicSalary ||
                  teacher.salary ||
                  teacher.currentSalary ||
                  50000,
                allowances:
                  teacher.allowances ||
                  Math.floor(
                    (teacher.basicSalary ||
                      teacher.salary ||
                      teacher.currentSalary ||
                      50000) * 0.2,
                  ),
                deductions: teacher.deductions || 0,
                amount:
                  (teacher.basicSalary ||
                    teacher.salary ||
                    teacher.currentSalary ||
                    50000) +
                  (teacher.allowances ||
                    Math.floor(
                      (teacher.basicSalary ||
                        teacher.salary ||
                        teacher.currentSalary ||
                        50000) * 0.2,
                    )) -
                  (teacher.deductions || 0),
                date: new Date().toISOString().split('T')[0],
                status: Math.random() > 0.3 ? 'Paid' : 'Pending',
                payPeriod: new Date().toISOString().slice(0, 7),
                employeeType: 'teacher' as const,
              };
            },
          );
          combinedSalaryData.push(...teacherSalaries);
        }

        // Process staff data
        if (staffResponse.success && staffResponse.data) {
          console.log('Raw Staff Data:', staffResponse.data);
          const staffSalaries = staffResponse.data.map(
            (staff: any, index: number) => {
              // Extract name properly from different possible formats
              let staffName = 'Unknown Staff';
              if (staff.name) {
                staffName = staff.name;
              } else if (staff.firstName || staff.lastName) {
                staffName =
                  `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
              } else if (staff.fullName) {
                staffName = staff.fullName;
              }

              return {
                id: `staff_${staff.id || index}`,
                employeeId:
                  staff.staffId ||
                  staff.id ||
                  `STF${String(index + 1).padStart(3, '0')}`,
                name: staffName,
                role: staff.position || staff.role || staff.jobTitle || 'Staff',
                department: staff.department || 'Administration',
                basicSalary:
                  staff.basicSalary ||
                  staff.salary ||
                  staff.currentSalary ||
                  40000,
                allowances:
                  staff.allowances ||
                  Math.floor(
                    (staff.basicSalary ||
                      staff.salary ||
                      staff.currentSalary ||
                      40000) * 0.15,
                  ),
                deductions: staff.deductions || 0,
                amount:
                  (staff.basicSalary ||
                    staff.salary ||
                    staff.currentSalary ||
                    40000) +
                  (staff.allowances ||
                    Math.floor(
                      (staff.basicSalary ||
                        staff.salary ||
                        staff.currentSalary ||
                        40000) * 0.15,
                    )) -
                  (staff.deductions || 0),
                date: new Date().toISOString().split('T')[0],
                status: Math.random() > 0.3 ? 'Paid' : 'Pending',
                payPeriod: new Date().toISOString().slice(0, 7),
                employeeType: 'staff' as const,
              };
            },
          );
          combinedSalaryData.push(...staffSalaries);
        }

        setSalaryData(combinedSalaryData);

        if (combinedSalaryData.length === 0) {
          toast.info('No employee data found');
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        toast.error('Failed to load employee salary data');
        setSalaryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

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
        { value: 'admin', label: 'Admin' },
        { value: 'clerk', label: 'Clerk' },
        { value: 'coordinator', label: 'Coordinator' },
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
            NPR {item.amount.toLocaleString('en-NP')}
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
    let filtered = salaryData;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (salary: SalaryData) =>
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
        (salary: SalaryData) =>
          salary.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(
        (salary: SalaryData) =>
          salary.role.toLowerCase() === roleFilter.toLowerCase(),
      );
    }

    return filtered;
  }, [salaryData, searchTerm, statusFilter, roleFilter]);

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
      {loading ? (
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          <span className='ml-2 text-gray-600'>Loading salary data...</span>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default SalaryTable;
