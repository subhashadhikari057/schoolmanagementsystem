'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  Save,
  ArrowUp,
  ArrowDown,
  Calculator,
  Calendar,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { TeacherService } from '@/api/services/teacher.service';
import { StaffService } from '@/api/services/staff.service';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';

interface AddSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  basicSalary: number;
  allowances: number;
  currentSalary: number;
  type: 'teacher' | 'staff';
}

interface SalaryAdjustment {
  method: 'flat' | 'percent';
  percentage?: number;
  amount: number;
  direction: 'promotion' | 'demotion';
  newSalary: number;
  difference: number;
  percentChange: number;
  effectiveDate: string;
  effectiveDateBS: string;
}

const AddSalaryModal: React.FC<AddSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<'search' | 'adjust'>('search');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // API service instances
  const teacherService = new TeacherService();
  const staffService = new StaffService();

  // Salary adjustment state
  const [adjustment, setAdjustment] = useState<SalaryAdjustment>({
    method: 'flat',
    percentage: undefined,
    amount: 0,
    direction: 'promotion',
    newSalary: 0,
    difference: 0,
    percentChange: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    effectiveDateBS: '',
  });

  // Initialize Nepali date
  useEffect(() => {
    try {
      const today = new Date();
      const bsDate = ad2bs(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate(),
      );
      setAdjustment(prev => ({
        ...prev,
        effectiveDateBS: `${bsDate.year}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.date).padStart(2, '0')}`,
      }));
    } catch (error) {
      console.error('Error converting to BS date:', error);
    }
  }, []);

  // Load employees from backend APIs
  const loadEmployees = async () => {
    if (!searchTerm.trim()) {
      setFilteredEmployees([]);
      return;
    }

    setIsLoadingEmployees(true);
    try {
      // Fetch teachers and staff concurrently
      const [teachersResponse, staffResponse] = await Promise.allSettled([
        teacherService.getAllTeachers(),
        staffService.getAllStaff(),
      ]);

      let allEmployees: Employee[] = [];

      // Debug: Log the API responses to understand the data structure
      console.log('Modal - Teachers API Response:', teachersResponse);
      console.log('Modal - Staff API Response:', staffResponse);

      // Process teachers
      if (
        teachersResponse.status === 'fulfilled' &&
        teachersResponse.value.success
      ) {
        console.log('Modal - Raw Teachers Data:', teachersResponse.value.data);
        // Handle both direct array and paginated response
        const teacherList = Array.isArray(teachersResponse.value.data)
          ? teachersResponse.value.data
          : teachersResponse.value.data.data;

        const teachers = teacherList.map((teacher: any) => {
          // Extract name properly from different possible formats
          let teacherName = 'Unknown Teacher';
          if (teacher.fullName) {
            teacherName = teacher.fullName;
          } else if (teacher.name) {
            teacherName = teacher.name;
          } else if (teacher.firstName || teacher.lastName) {
            teacherName =
              `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
          }

          return {
            id: teacher.id,
            employeeId:
              teacher.employeeId || teacher.teacherId || `TCH${teacher.id}`,
            name: teacherName,
            role: teacher.designation || 'Teacher',
            department: teacher.department || teacher.subject || 'Academic',
            basicSalary:
              teacher.basicSalary ||
              teacher.salary ||
              teacher.currentSalary ||
              0,
            allowances: teacher.allowances || 0,
            currentSalary:
              teacher.totalSalary ||
              (teacher.basicSalary || teacher.salary || 0) +
                (teacher.allowances || 0),
            type: 'teacher' as const,
          };
        });
        allEmployees = [...allEmployees, ...teachers];
      }

      // Process staff
      if (staffResponse.status === 'fulfilled' && staffResponse.value.success) {
        console.log('Modal - Raw Staff Data:', staffResponse.value.data.data);
        const staff =
          staffResponse.value.data.data?.map((staffMember: any) => {
            // Extract name properly from different possible formats
            let staffName = 'Unknown Staff';
            if (staffMember.fullName) {
              staffName = staffMember.fullName;
            } else if (staffMember.name) {
              staffName = staffMember.name;
            } else if (staffMember.firstName || staffMember.lastName) {
              staffName =
                `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
            }

            return {
              id: staffMember.id,
              employeeId:
                staffMember.employeeId ||
                staffMember.staffId ||
                `STF${staffMember.id}`,
              name: staffName,
              role:
                staffMember.designation ||
                staffMember.position ||
                staffMember.role ||
                'Staff',
              department: staffMember.department || 'Administration',
              basicSalary:
                staffMember.basicSalary ||
                staffMember.salary ||
                staffMember.currentSalary ||
                0,
              allowances: staffMember.allowances || 0,
              currentSalary:
                staffMember.totalSalary ||
                (staffMember.basicSalary || staffMember.salary || 0) +
                  (staffMember.allowances || 0),
              type: 'staff' as const,
            };
          }) || [];
        allEmployees = [...allEmployees, ...staff];
      }

      // Filter employees based on search term
      const filtered = allEmployees.filter(
        emp =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      setFilteredEmployees(filtered);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees', {
        description: 'Please try again or check your connection.',
      });
      setFilteredEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Debounced employee search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        loadEmployees().finally(() => setIsSearching(false));
      } else {
        setFilteredEmployees([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Calculate salary adjustment
  useEffect(() => {
    if (!selectedEmployee) return;

    let newSalary = selectedEmployee.currentSalary;
    let adjustmentAmount = adjustment.amount;

    if (adjustment.method === 'percent' && adjustment.percentage) {
      adjustmentAmount =
        (selectedEmployee.currentSalary * adjustment.percentage) / 100;
    }

    if (adjustment.direction === 'promotion') {
      newSalary = selectedEmployee.currentSalary + adjustmentAmount;
    } else {
      newSalary = selectedEmployee.currentSalary - adjustmentAmount;
    }

    const difference = newSalary - selectedEmployee.currentSalary;
    const percentChange = (difference / selectedEmployee.currentSalary) * 100;

    setAdjustment(prev => ({
      ...prev,
      newSalary: Math.max(0, newSalary),
      difference,
      percentChange,
    }));
  }, [
    selectedEmployee,
    adjustment.method,
    adjustment.percentage,
    adjustment.amount,
    adjustment.direction,
  ]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('search');
      setSelectedEmployee(null);
      setSearchTerm('');
      setFilteredEmployees([]);

      // Reset adjustment with current date
      const today = new Date();
      try {
        const bsDate = ad2bs(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
        );
        setAdjustment({
          method: 'flat',
          percentage: undefined,
          amount: 0,
          direction: 'promotion',
          newSalary: 0,
          difference: 0,
          percentChange: 0,
          effectiveDate: today.toISOString().split('T')[0],
          effectiveDateBS: `${bsDate.year}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.date).padStart(2, '0')}`,
        });
      } catch (error) {
        console.error('Error converting to BS date:', error);
        setAdjustment({
          method: 'flat',
          percentage: undefined,
          amount: 0,
          direction: 'promotion',
          newSalary: 0,
          difference: 0,
          percentChange: 0,
          effectiveDate: today.toISOString().split('T')[0],
          effectiveDateBS: '',
        });
      }
    }
  }, [isOpen]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCurrentStep('adjust');
    setAdjustment(prev => ({
      ...prev,
      newSalary: employee.currentSalary,
    }));
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedEmployee(null);
  };

  const handleAdjustmentChange = (
    field: keyof SalaryAdjustment,
    value: any,
  ) => {
    setAdjustment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      const salaryData = {
        basicSalary: selectedEmployee.basicSalary,
        allowances:
          selectedEmployee.allowances +
          (adjustment.direction === 'promotion'
            ? adjustment.amount
            : -adjustment.amount),
        changeType: (adjustment.direction === 'promotion'
          ? 'PROMOTION'
          : 'DEMOTION') as 'PROMOTION' | 'DEMOTION',
        changeReason: `Salary ${adjustment.direction} - ${adjustment.method === 'percent' ? `${adjustment.percentage}% adjustment` : `NPR ${adjustment.amount.toLocaleString()} adjustment`}`,
        effectiveMonth: new Date().toISOString(),
      };

      let response;
      if (selectedEmployee.type === 'teacher') {
        response = await teacherService.updateTeacherSalary(
          selectedEmployee.id,
          salaryData,
        );
      } else {
        response = await staffService.updateStaffSalary(
          selectedEmployee.id,
          salaryData,
        );
      }

      if (response.success) {
        toast.success('Salary adjustment recorded successfully', {
          description: `${selectedEmployee.name}'s salary has been ${adjustment.direction === 'promotion' ? 'increased' : 'decreased'} by ${Math.abs(adjustment.percentChange).toFixed(1)}%.`,
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update salary');
      }
    } catch (error: any) {
      console.error('Error saving salary adjustment:', error);
      toast.error('Failed to save salary adjustment', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Format NPR currency
  const formatNPR = (amount: number) => {
    return `NPR ${amount.toLocaleString('en-NP')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-4xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            {currentStep === 'search' ? 'Select Employee' : 'Salary Adjustment'}
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            {currentStep === 'search'
              ? 'Search and select an employee to adjust their salary'
              : `Adjust salary for ${selectedEmployee?.name}`}
          </p>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {currentStep === 'search' ? (
            <EmployeeSearchStep
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filteredEmployees={filteredEmployees}
              isSearching={isSearching || isLoadingEmployees}
              onEmployeeSelect={handleEmployeeSelect}
              formatCurrency={formatNPR}
            />
          ) : (
            <SalaryAdjustmentStep
              employee={selectedEmployee!}
              adjustment={adjustment}
              onAdjustmentChange={handleAdjustmentChange}
              onBack={handleBackToSearch}
              formatCurrency={formatNPR}
            />
          )}
        </div>

        {/* Footer */}
        {currentStep === 'adjust' && (
          <div className='bg-gray-50 px-4 sm:px-6 py-4 rounded-b-xl flex justify-between items-center sticky bottom-0'>
            <button
              type='button'
              onClick={handleBackToSearch}
              className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
            >
              ← Back to Search
            </button>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={saving || adjustment.difference === 0}
                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    Save & Create
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Employee Search Step Component
interface EmployeeSearchStepProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredEmployees: Employee[];
  isSearching: boolean;
  onEmployeeSelect: (employee: Employee) => void;
  formatCurrency: (amount: number) => string;
}

const EmployeeSearchStep: React.FC<EmployeeSearchStepProps> = ({
  searchTerm,
  onSearchChange,
  filteredEmployees,
  isSearching,
  onEmployeeSelect,
  formatCurrency,
}) => {
  return (
    <div className='space-y-6'>
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
        <input
          type='text'
          placeholder='Search employees by ID, name, or role...'
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
        {isSearching && (
          <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400' />
        )}
      </div>

      {/* Search Results */}
      <div className='space-y-4'>
        {!searchTerm ? (
          <div className='text-center py-8 text-gray-500'>
            <Search className='h-12 w-12 mx-auto mb-3 text-gray-300' />
            <p>Start typing to search for employees...</p>
            <p className='text-sm mt-1'>
              Search through teachers and staff members
            </p>
          </div>
        ) : filteredEmployees.length === 0 && !isSearching ? (
          <div className='text-center py-8 text-gray-500'>
            <User className='h-12 w-12 mx-auto mb-3 text-gray-300' />
            <p>No employees found matching "{searchTerm}"</p>
            <p className='text-sm mt-1'>Try adjusting your search terms</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {filteredEmployees.map(employee => (
              <div
                key={employee.id}
                onClick={() => onEmployeeSelect(employee)}
                className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <User className='h-4 w-4 text-gray-400' />
                      <span className='font-medium text-gray-900'>
                        {employee.name}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          employee.type === 'teacher'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {employee.type}
                      </span>
                    </div>
                    <div className='space-y-1 text-sm text-gray-600'>
                      <div className='flex justify-between'>
                        <span>ID:</span>
                        <span className='font-medium'>
                          {employee.employeeId}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Role:</span>
                        <span className='font-medium'>{employee.role}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Department:</span>
                        <span className='font-medium'>
                          {employee.department}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Basic:</span>
                        <span className='font-medium'>
                          {formatCurrency(employee.basicSalary)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Allowance:</span>
                        <span className='font-medium'>
                          {formatCurrency(employee.allowances)}
                        </span>
                      </div>
                      <div className='flex justify-between border-t pt-1 mt-2'>
                        <span className='font-semibold'>Current Salary:</span>
                        <span className='font-semibold text-green-600'>
                          {formatCurrency(employee.currentSalary)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Salary Adjustment Step Component
interface SalaryAdjustmentStepProps {
  employee: Employee;
  adjustment: SalaryAdjustment;
  onAdjustmentChange: (field: keyof SalaryAdjustment, value: any) => void;
  onBack: () => void;
  formatCurrency: (amount: number) => string;
}

const SalaryAdjustmentStep: React.FC<SalaryAdjustmentStepProps> = ({
  employee,
  adjustment,
  onAdjustmentChange,
  formatCurrency,
}) => {
  return (
    <div className='space-y-6'>
      {/* Employee Info Header */}
      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <div className='flex items-center gap-3'>
          <User className='h-8 w-8 text-blue-600' />
          <div>
            <h3 className='font-semibold text-blue-900'>{employee.name}</h3>
            <p className='text-sm text-blue-700'>
              {employee.employeeId} • {employee.role} • {employee.department}
            </p>
            <span
              className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                employee.type === 'teacher'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {employee.type}
            </span>
          </div>
        </div>
      </div>

      {/* Employee Details Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
          <div className='text-center'>
            <Coins className='h-8 w-8 text-blue-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-blue-900'>
              {formatCurrency(employee.basicSalary)}
            </div>
            <div className='text-sm text-blue-700'>Basic</div>
          </div>
        </div>

        <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
          <div className='text-center'>
            <TrendingUp className='h-8 w-8 text-green-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-green-900'>
              {formatCurrency(employee.allowances)}
            </div>
            <div className='text-sm text-green-700'>Allowance</div>
          </div>
        </div>

        <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
          <div className='text-center'>
            <Calculator className='h-8 w-8 text-purple-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-purple-900'>
              {formatCurrency(employee.currentSalary)}
            </div>
            <div className='text-sm text-purple-700'>Current Salary</div>
          </div>
        </div>
      </div>

      {/* Adjustment Controls */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-semibold mb-4'>Salary Adjustment</h3>

        <div className='space-y-4'>
          {/* Direction Buttons */}
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => onAdjustmentChange('direction', 'promotion')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                adjustment.direction === 'promotion'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowUp className='h-4 w-4' />
              Promote
            </button>
            <button
              type='button'
              onClick={() => onAdjustmentChange('direction', 'demotion')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                adjustment.direction === 'demotion'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ArrowDown className='h-4 w-4' />
              Demote
            </button>
          </div>

          {/* Method Selection */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Method</label>
            <select
              value={adjustment.method}
              onChange={e =>
                onAdjustmentChange(
                  'method',
                  e.target.value as 'flat' | 'percent',
                )
              }
              className='w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='flat'>Flat (±Allowance)</option>
              <option value='percent'>Percent</option>
            </select>
          </div>

          {/* Input Based on Method */}
          {adjustment.method === 'percent' ? (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Percentage (%)
              </label>
              <input
                type='number'
                min='0'
                max='100'
                step='0.1'
                value={adjustment.percentage || ''}
                onChange={e =>
                  onAdjustmentChange(
                    'percentage',
                    parseFloat(e.target.value) || 0,
                  )
                }
                className='w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter percentage (e.g., 10.5)'
              />
            </div>
          ) : (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Amount (NPR)
              </label>
              <input
                type='number'
                min='0'
                step='100'
                value={adjustment.amount || ''}
                onChange={e =>
                  onAdjustmentChange('amount', parseFloat(e.target.value) || 0)
                }
                className='w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter amount in NPR'
              />
            </div>
          )}

          {/* Effective Date */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Effective Date (Nepali Calendar)
            </label>
            <div className='space-y-2'>
              {adjustment.effectiveDateBS && (
                <div className='text-sm font-medium text-orange-700 bg-orange-50 p-2 rounded border border-orange-200'>
                  <span className='font-bold'>Selected BS Date:</span>{' '}
                  {adjustment.effectiveDateBS} BS
                </div>
              )}

              {/* Nepali Date Input */}
              <div className='grid grid-cols-3 gap-2'>
                <div>
                  <label className='text-xs text-gray-600'>Year (BS)</label>
                  <input
                    type='number'
                    min='2070'
                    max='2090'
                    value={
                      adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[0])
                        : new Date().getFullYear() + 57
                    }
                    onChange={e => {
                      const year = parseInt(e.target.value);
                      const month = adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[1])
                        : 6;
                      const day = adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[2])
                        : 17;

                      try {
                        const bsDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const adDate = bs2ad(year, month, day);
                        const adDateString = `${adDate.year}-${String(adDate.month).padStart(2, '0')}-${String(adDate.date).padStart(2, '0')}`;

                        onAdjustmentChange('effectiveDateBS', bsDateString);
                        onAdjustmentChange('effectiveDate', adDateString);
                      } catch (error) {
                        console.error('Error converting BS to AD:', error);
                      }
                    }}
                    className='w-full py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm'
                    placeholder='2081'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Month (BS)</label>
                  <select
                    value={
                      adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[1])
                        : 6
                    }
                    onChange={e => {
                      const month = parseInt(e.target.value);
                      const year = adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[0])
                        : new Date().getFullYear() + 57;
                      const day = Math.min(
                        adjustment.effectiveDateBS
                          ? parseInt(adjustment.effectiveDateBS.split('-')[2])
                          : 17,
                        30,
                      );

                      try {
                        const bsDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const adDate = bs2ad(year, month, day);
                        const adDateString = `${adDate.year}-${String(adDate.month).padStart(2, '0')}-${String(adDate.date).padStart(2, '0')}`;

                        onAdjustmentChange('effectiveDateBS', bsDateString);
                        onAdjustmentChange('effectiveDate', adDateString);
                      } catch (error) {
                        console.error('Error converting BS to AD:', error);
                      }
                    }}
                    className='w-full py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm'
                  >
                    <option value={1}>Baisakh</option>
                    <option value={2}>Jestha</option>
                    <option value={3}>Ashadh</option>
                    <option value={4}>Shrawan</option>
                    <option value={5}>Bhadra</option>
                    <option value={6}>Ashwin</option>
                    <option value={7}>Kartik</option>
                    <option value={8}>Mangsir</option>
                    <option value={9}>Poush</option>
                    <option value={10}>Magh</option>
                    <option value={11}>Falgun</option>
                    <option value={12}>Chaitra</option>
                  </select>
                </div>

                <div>
                  <label className='text-xs text-gray-600'>Day (BS)</label>
                  <input
                    type='number'
                    min='1'
                    max='32'
                    value={
                      adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[2])
                        : 17
                    }
                    onChange={e => {
                      const day = parseInt(e.target.value);
                      const year = adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[0])
                        : new Date().getFullYear() + 57;
                      const month = adjustment.effectiveDateBS
                        ? parseInt(adjustment.effectiveDateBS.split('-')[1])
                        : 6;

                      try {
                        const bsDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const adDate = bs2ad(year, month, day);
                        const adDateString = `${adDate.year}-${String(adDate.month).padStart(2, '0')}-${String(adDate.date).padStart(2, '0')}`;

                        onAdjustmentChange('effectiveDateBS', bsDateString);
                        onAdjustmentChange('effectiveDate', adDateString);
                      } catch (error) {
                        console.error('Error converting BS to AD:', error);
                      }
                    }}
                    className='w-full py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm'
                    placeholder='17'
                  />
                </div>
              </div>

              {adjustment.effectiveDate && (
                <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded border'>
                  <span className='font-medium'>Equivalent AD Date:</span>{' '}
                  {new Date(adjustment.effectiveDate).toLocaleDateString(
                    'en-NP',
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200'>
        <h3 className='text-lg font-semibold mb-4 text-indigo-900'>
          Preview Changes
        </h3>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
            <div
              className={`text-lg font-bold ${
                adjustment.difference >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {adjustment.difference >= 0 ? '+' : ''}
              {formatCurrency(Math.abs(adjustment.difference))}
            </div>
            <div className='text-xs text-gray-600'>Difference</div>
          </div>

          <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
            <div className='text-lg font-bold text-blue-600'>
              {formatCurrency(adjustment.newSalary)}
            </div>
            <div className='text-xs text-gray-600'>Updated Salary</div>
          </div>

          <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
            <div
              className={`text-lg font-bold ${
                adjustment.percentChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {adjustment.percentChange >= 0 ? '+' : ''}
              {adjustment.percentChange.toFixed(1)}%
            </div>
            <div className='text-xs text-gray-600'>
              {adjustment.percentChange >= 0 ? 'Increase' : 'Decrease'} %
            </div>
          </div>

          <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
            <div
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                adjustment.direction === 'promotion'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {adjustment.direction === 'promotion' ? 'Promotion' : 'Demotion'}
            </div>
            <div className='text-xs text-gray-600 mt-1'>Direction</div>
          </div>
        </div>

        {/* Additional Info */}
        {(adjustment.amount > 0 ||
          (adjustment.percentage && adjustment.percentage > 0)) && (
          <div className='mt-4 p-3 bg-white rounded-lg'>
            <div className='text-sm text-gray-700 space-y-2'>
              <div>
                <strong>Summary:</strong>{' '}
                {adjustment.direction === 'promotion'
                  ? 'Increasing'
                  : 'Decreasing'}{' '}
                {employee.name}'s salary
                {adjustment.method === 'percent'
                  ? ` by ${adjustment.percentage}% (${formatCurrency(Math.abs(adjustment.difference))})`
                  : ` by ${formatCurrency(adjustment.amount)}`}
                .
              </div>
              <div className='flex flex-wrap gap-4 text-xs'>
                {adjustment.effectiveDateBS ? (
                  <>
                    <span className='text-orange-700 font-medium'>
                      <strong>Effective Date:</strong>{' '}
                      {adjustment.effectiveDateBS} BS
                    </span>
                    <span className='text-gray-500'>
                      <strong>AD:</strong>{' '}
                      {new Date(adjustment.effectiveDate).toLocaleDateString(
                        'en-NP',
                      )}
                    </span>
                  </>
                ) : (
                  <span>
                    <strong>Effective Date:</strong>{' '}
                    {new Date(adjustment.effectiveDate).toLocaleDateString(
                      'en-NP',
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddSalaryModal;
