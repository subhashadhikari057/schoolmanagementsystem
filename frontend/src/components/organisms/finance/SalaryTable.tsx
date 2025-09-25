'use client';

import React, { useState, useMemo, useEffect } from 'react';
import GenericList, { BaseItem } from '@/components/templates/GenericList';
import { TeacherService } from '@/api/services/teacher.service';
import { StaffService } from '@/api/services/staff.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import AddTeacherSalaryModal from '@/components/organisms/modals/AddTeacherSalaryModal';
import AddStaffSalaryModal from '@/components/organisms/modals/AddStaffSalaryModal';
import { generateTempEmployeeId } from '@/utils/employeeIdUtils';

interface SalaryTableProps {
  employeeType?: 'teacher' | 'staff';
}

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

const SalaryTable: React.FC<SalaryTableProps> = ({ employeeType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTeacherSalaryModalOpen, setIsAddTeacherSalaryModalOpen] =
    useState(false);
  const [isAddStaffSalaryModalOpen, setIsAddStaffSalaryModalOpen] =
    useState(false);
  const itemsPerPage = 10;

  // Fetch teachers and staff data
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    // Initialize service instances inside useEffect to avoid dependency issues
    const teacherService = new TeacherService();
    const staffService = new StaffService();

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
        // Handle different response formats - sometimes data is directly in data, sometimes in data.data
        const teachersArray = Array.isArray(teachersResponse.data)
          ? teachersResponse.data
          : Array.isArray(teachersResponse.data.data)
            ? teachersResponse.data.data
            : [];

        const teacherSalaries = teachersArray.map(
          (teacher: any, index: number) => {
            // Extract name properly from different possible formats
            let teacherName = 'Unknown Teacher';
            if (teacher.name) {
              teacherName = teacher.name as string;
            } else if (teacher.firstName || teacher.lastName) {
              teacherName =
                `${(teacher.firstName as string) || ''} ${(teacher.lastName as string) || ''}`.trim();
            } else if (teacher.fullName) {
              teacherName = teacher.fullName as string;
            }

            const basicSalary = Number(
              teacher.basicSalary ||
                teacher.salary ||
                teacher.currentSalary ||
                50000,
            );
            const allowances =
              Number(teacher.allowances) || Math.floor(basicSalary * 0.2);
            const deductions = Number(teacher.deductions) || 0;

            return {
              id: `teacher_${teacher.id || index}`,
              employeeId: String(
                teacher.employeeId || generateTempEmployeeId('teacher', index),
              ),
              name: teacherName,
              role: 'Teacher',
              department: String(
                teacher.department || teacher.subject || 'Academic',
              ),
              basicSalary,
              allowances,
              deductions,
              amount: basicSalary + allowances - deductions,
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
        // Handle different response formats - sometimes data is directly in data, sometimes in data.data
        const staffArray = Array.isArray(staffResponse.data)
          ? staffResponse.data
          : Array.isArray(staffResponse.data.data)
            ? staffResponse.data.data
            : [];

        const staffSalaries = staffArray.map((staff: any, index: number) => {
          // Extract name properly from different possible formats
          let staffName = 'Unknown Staff';
          if (staff.name) {
            staffName = staff.name as string;
          } else if (staff.firstName || staff.lastName) {
            staffName =
              `${(staff.firstName as string) || ''} ${(staff.lastName as string) || ''}`.trim();
          } else if (staff.fullName) {
            staffName = staff.fullName as string;
          }

          const basicSalary = Number(
            staff.basicSalary || staff.salary || staff.currentSalary || 40000,
          );
          const allowances =
            Number(staff.allowances) || Math.floor(basicSalary * 0.15);
          const deductions = Number(staff.deductions) || 0;

          return {
            id: `staff_${staff.id || index}`,
            employeeId: String(
              staff.employeeId || generateTempEmployeeId('staff', index),
            ),
            name: staffName,
            role: String(
              staff.position || staff.role || staff.jobTitle || 'Staff',
            ),
            department: String(staff.department || 'Administration'),
            basicSalary,
            allowances,
            deductions,
            amount: basicSalary + allowances - deductions,
            date: new Date().toISOString().split('T')[0],
            status: Math.random() > 0.3 ? 'Paid' : 'Pending',
            payPeriod: new Date().toISOString().slice(0, 7),
            employeeType: 'staff' as const,
          };
        });
        combinedSalaryData.push(...staffSalaries);
      }

      setSalaryData(combinedSalaryData);

      if (combinedSalaryData.length === 0) {
        toast.info(
          'No staff or teachers found. Please add staff or teachers first to manage salaries.',
        );
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Check if it's a specific API error
      if (error instanceof Error && error.message.includes('qualification')) {
        toast.error(
          'Database schema issue detected. Please contact system administrator.',
        );
      } else {
        toast.error('Failed to load employee salary data');
      }
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on employeeType prop
  const filteredByType = useMemo(() => {
    if (!employeeType) return salaryData;
    return salaryData.filter(
      employee => employee.employeeType === employeeType,
    );
  }, [salaryData, employeeType]);

  const salaryListConfig = {
    title: employeeType
      ? `${employeeType.charAt(0).toUpperCase() + employeeType.slice(1)} Salaries`
      : 'Salaries',
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
      options:
        employeeType === 'teacher'
          ? [
              { value: 'all', label: 'All' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'principal', label: 'Principal' },
              { value: 'coordinator', label: 'Coordinator' },
            ]
          : employeeType === 'staff'
            ? [
                { value: 'all', label: 'All' },
                { value: 'accountant', label: 'Accountant' },
                { value: 'staff', label: 'Staff' },
                { value: 'librarian', label: 'Librarian' },
                { value: 'security', label: 'Security' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'admin', label: 'Admin' },
                { value: 'clerk', label: 'Clerk' },
              ]
            : [
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
    emptyMessage: employeeType
      ? `No ${employeeType}s found. Please add ${employeeType}s first to manage their salaries.`
      : 'No staff or teachers found. Please add staff or teachers first to manage their salaries.',
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = filteredByType;

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
  }, [filteredByType, searchTerm, statusFilter, roleFilter]);

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
          customActions={
            <button
              onClick={() => {
                if (employeeType === 'teacher') {
                  setIsAddTeacherSalaryModalOpen(true);
                } else if (employeeType === 'staff') {
                  setIsAddStaffSalaryModalOpen(true);
                } else {
                  // If no specific type, default to teacher modal
                  setIsAddTeacherSalaryModalOpen(true);
                }
              }}
              className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              Add{' '}
              {employeeType
                ? employeeType.charAt(0).toUpperCase() + employeeType.slice(1)
                : 'Employee'}{' '}
              Salary
            </button>
          }
        />
      )}

      {/* Add Salary Modals - Conditional based on employee type */}
      {employeeType === 'teacher' && (
        <AddTeacherSalaryModal
          isOpen={isAddTeacherSalaryModalOpen}
          onClose={() => setIsAddTeacherSalaryModalOpen(false)}
          onSuccess={() => {
            setIsAddTeacherSalaryModalOpen(false);
            fetchEmployeeData(); // Refresh the data after successful salary adjustment
          }}
        />
      )}

      {employeeType === 'staff' && (
        <AddStaffSalaryModal
          isOpen={isAddStaffSalaryModalOpen}
          onClose={() => setIsAddStaffSalaryModalOpen(false)}
          onSuccess={() => {
            setIsAddStaffSalaryModalOpen(false);
            fetchEmployeeData(); // Refresh the data after successful salary adjustment
          }}
        />
      )}

      {/* Default modal for when no specific employee type is selected */}
      {!employeeType && (
        <AddTeacherSalaryModal
          isOpen={isAddTeacherSalaryModalOpen}
          onClose={() => setIsAddTeacherSalaryModalOpen(false)}
          onSuccess={() => {
            setIsAddTeacherSalaryModalOpen(false);
            fetchEmployeeData(); // Refresh the data after successful salary adjustment
          }}
        />
      )}
    </div>
  );
};

export default SalaryTable;
