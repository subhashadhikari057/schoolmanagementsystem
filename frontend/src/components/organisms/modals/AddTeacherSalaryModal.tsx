'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  User,
  Loader2,
  Coins,
  TrendingUp,
  Calculator,
  ArrowUp,
  ArrowDown,
  GraduationCap,
} from 'lucide-react';
import { TeacherService } from '@/api/services/teacher.service';
import { toast } from 'sonner';
import { ad2bs, bs2ad } from 'hamro-nepali-patro';
import { generateTempEmployeeId } from '@/utils/employeeIdUtils';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';

interface AddTeacherSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  basicSalary: number;
  allowances: number;
  currentSalary: number;
  subject?: string;
  designation?: string;
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

const AddTeacherSalaryModal: React.FC<AddTeacherSalaryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<'search' | 'adjust'>('search');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // API service instance
  const teacherService = new TeacherService();

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

  // Load teachers from backend API
  const loadTeachers = async () => {
    if (!searchTerm.trim()) {
      setFilteredTeachers([]);
      return;
    }

    setIsLoadingTeachers(true);
    try {
      const response = await teacherService.getAllTeachers();

      console.log('Teacher Modal - API Response:', response);

      if (response.success) {
        const teacherList = Array.isArray(response.data)
          ? response.data
          : response.data.data;

        const teachers = teacherList.map((teacher: any, index: number) => {
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
              teacher.employeeId || generateTempEmployeeId('teacher', index),
            name: teacherName,
            role: teacher.designation || 'Teacher',
            department: teacher.department || teacher.subject || 'Academic',
            subject: teacher.subject || '',
            designation: teacher.designation || 'Teacher',
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
          };
        });

        // Filter teachers based on search term
        const filtered = teachers.filter(
          (teacher: Teacher) =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.employeeId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            teacher.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.department
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (teacher.subject &&
              teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())),
        );

        setFilteredTeachers(filtered);
      } else {
        throw new Error(response.message || 'Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers', {
        description: 'Please try again or check your connection.',
      });
      setFilteredTeachers([]);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // Debounced teacher search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        loadTeachers().finally(() => setIsSearching(false));
      } else {
        setFilteredTeachers([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Calculate salary adjustment
  useEffect(() => {
    if (!selectedTeacher) return;

    let newSalary = selectedTeacher.currentSalary;
    let adjustmentAmount = adjustment.amount;

    if (adjustment.method === 'percent' && adjustment.percentage) {
      adjustmentAmount =
        (selectedTeacher.currentSalary * adjustment.percentage) / 100;
    }

    if (adjustment.direction === 'promotion') {
      newSalary = selectedTeacher.currentSalary + adjustmentAmount;
    } else {
      newSalary = selectedTeacher.currentSalary - adjustmentAmount;
    }

    const difference = newSalary - selectedTeacher.currentSalary;
    const percentChange = (difference / selectedTeacher.currentSalary) * 100;

    setAdjustment(prev => ({
      ...prev,
      newSalary: Math.max(0, newSalary),
      difference,
      percentChange,
    }));
  }, [
    selectedTeacher,
    adjustment.method,
    adjustment.percentage,
    adjustment.amount,
    adjustment.direction,
  ]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('search');
      setSelectedTeacher(null);
      setSearchTerm('');
      setFilteredTeachers([]);

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

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setCurrentStep('adjust');
    setAdjustment(prev => ({
      ...prev,
      newSalary: teacher.currentSalary,
    }));
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedTeacher(null);
  };

  const handleAdjustmentChange = (
    field: keyof SalaryAdjustment,
    value: any,
  ) => {
    setAdjustment(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) return;

    setSaving(true);
    try {
      const salaryData = {
        basicSalary: selectedTeacher.basicSalary,
        allowances:
          selectedTeacher.allowances +
          (adjustment.direction === 'promotion'
            ? adjustment.amount
            : -adjustment.amount),
        changeType: (adjustment.direction === 'promotion'
          ? 'PROMOTION'
          : 'DEMOTION') as 'PROMOTION' | 'DEMOTION',
        changeReason: `Teacher salary ${adjustment.direction} - ${adjustment.method === 'percent' ? `${adjustment.percentage}% adjustment` : `NPR ${adjustment.amount.toLocaleString()} adjustment`}`,
        effectiveMonth: new Date().toISOString(),
      };

      const response = await teacherService.updateTeacherSalary(
        selectedTeacher.id,
        salaryData,
      );

      if (response.success) {
        toast.success('Teacher salary adjustment recorded successfully', {
          description: `${selectedTeacher.name}'s salary has been ${adjustment.direction === 'promotion' ? 'increased' : 'decreased'} by ${Math.abs(adjustment.percentChange).toFixed(1)}%.`,
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to update teacher salary');
      }
    } catch (error: any) {
      console.error('Error saving teacher salary adjustment:', error);
      toast.error('Failed to save teacher salary adjustment', {
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
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <div className='flex items-center gap-3'>
            <GraduationCap className='h-6 w-6 text-blue-600' />
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
                {currentStep === 'search'
                  ? 'Select Teacher'
                  : 'Teacher Salary Adjustment'}
              </h2>
              <p className='text-gray-600 mt-1 text-sm sm:text-base'>
                {currentStep === 'search'
                  ? 'Search and select a teacher to adjust their salary'
                  : `Adjust salary for ${selectedTeacher?.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {currentStep === 'search' ? (
            <TeacherSearchStep
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filteredTeachers={filteredTeachers}
              isSearching={isSearching || isLoadingTeachers}
              onTeacherSelect={handleTeacherSelect}
              formatCurrency={formatNPR}
            />
          ) : (
            <TeacherSalaryAdjustmentStep
              teacher={selectedTeacher!}
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
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Coins className='h-4 w-4 mr-2' />
                    Update Teacher Salary
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

// Teacher Search Step Component
interface TeacherSearchStepProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredTeachers: Teacher[];
  isSearching: boolean;
  onTeacherSelect: (teacher: Teacher) => void;
  formatCurrency: (amount: number) => string;
}

const TeacherSearchStep: React.FC<TeacherSearchStepProps> = ({
  searchTerm,
  onSearchChange,
  filteredTeachers,
  isSearching,
  onTeacherSelect,
  formatCurrency,
}) => {
  return (
    <div className='space-y-6'>
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
        <input
          type='text'
          placeholder='Search teachers by ID, name, subject, or designation...'
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
            <GraduationCap className='h-12 w-12 mx-auto mb-3 text-gray-300' />
            <p>Start typing to search for teachers...</p>
            <p className='text-sm mt-1'>
              Search by name, employee ID, subject, or designation
            </p>
          </div>
        ) : filteredTeachers.length === 0 && !isSearching ? (
          <div className='text-center py-8 text-gray-500'>
            <User className='h-12 w-12 mx-auto mb-3 text-gray-300' />
            <p>No teachers found matching "{searchTerm}"</p>
            <p className='text-sm mt-1'>Try adjusting your search terms</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {filteredTeachers.map(teacher => (
              <div
                key={teacher.id}
                onClick={() => onTeacherSelect(teacher)}
                className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <GraduationCap className='h-4 w-4 text-blue-600' />
                      <h3 className='font-semibold text-gray-900'>
                        {teacher.name}
                      </h3>
                    </div>
                    <div className='space-y-1 text-sm text-gray-600'>
                      <p>
                        <span className='font-medium'>ID:</span>{' '}
                        {teacher.employeeId}
                      </p>
                      <p>
                        <span className='font-medium'>Role:</span>{' '}
                        {teacher.role}
                      </p>
                      {teacher.subject && (
                        <p>
                          <span className='font-medium'>Subject:</span>{' '}
                          {teacher.subject}
                        </p>
                      )}
                      <p>
                        <span className='font-medium'>Department:</span>{' '}
                        {teacher.department}
                      </p>
                    </div>
                    <div className='mt-3 flex items-center justify-between'>
                      <div className='text-sm'>
                        <div className='text-gray-600'>Current Salary</div>
                        <div className='font-semibold text-blue-600'>
                          {formatCurrency(teacher.currentSalary)}
                        </div>
                      </div>
                      <span className='inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800'>
                        Teacher
                      </span>
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

// Teacher Salary Adjustment Step Component
interface TeacherSalaryAdjustmentStepProps {
  teacher: Teacher;
  adjustment: SalaryAdjustment;
  onAdjustmentChange: (field: keyof SalaryAdjustment, value: any) => void;
  onBack: () => void;
  formatCurrency: (amount: number) => string;
}

const TeacherSalaryAdjustmentStep: React.FC<
  TeacherSalaryAdjustmentStepProps
> = ({ teacher, adjustment, onAdjustmentChange, formatCurrency }) => {
  return (
    <div className='space-y-6'>
      {/* Teacher Info Header */}
      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <div className='flex items-center gap-3'>
          <GraduationCap className='h-8 w-8 text-blue-600' />
          <div>
            <h3 className='font-semibold text-blue-900'>{teacher.name}</h3>
            <p className='text-sm text-blue-700'>
              {teacher.employeeId} • {teacher.role} • {teacher.department}
            </p>
            {teacher.subject && (
              <p className='text-sm text-blue-600'>
                Subject: {teacher.subject}
              </p>
            )}
            <span className='inline-block px-2 py-1 text-xs rounded-full mt-1 bg-blue-100 text-blue-800'>
              Teacher
            </span>
          </div>
        </div>
      </div>

      {/* Teacher Details Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
          <div className='text-center'>
            <Coins className='h-8 w-8 text-blue-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-blue-900'>
              {formatCurrency(teacher.basicSalary)}
            </div>
            <div className='text-sm text-blue-700'>Basic Salary</div>
          </div>
        </div>

        <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
          <div className='text-center'>
            <TrendingUp className='h-8 w-8 text-green-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-green-900'>
              {formatCurrency(teacher.allowances)}
            </div>
            <div className='text-sm text-green-700'>Allowances</div>
          </div>
        </div>

        <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
          <div className='text-center'>
            <Calculator className='h-8 w-8 text-purple-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-purple-900'>
              {formatCurrency(teacher.currentSalary)}
            </div>
            <div className='text-sm text-purple-700'>Current Total</div>
          </div>
        </div>
      </div>

      {/* Adjustment Controls */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-semibold mb-4'>
          Teacher Salary Adjustment
        </h3>

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
              <option value='flat'>Flat Amount (±Allowance)</option>
            </select>
          </div>

          {/* Amount Input */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Adjustment Amount (NPR)
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

          {/* Effective Date */}
          <div className='space-y-2'>
            <NepaliDatePicker
              label='Effective Date (From which date to increase/decrease)'
              value={adjustment.effectiveDateBS}
              onChange={bsDate => {
                try {
                  if (bsDate) {
                    const [year, month, day] = bsDate.split('-').map(Number);
                    const ad = bs2ad(year, month, day);
                    const adDate = new Date(ad.year, ad.month - 1, ad.date);
                    onAdjustmentChange(
                      'effectiveDate',
                      adDate.toISOString().split('T')[0],
                    );
                    onAdjustmentChange('effectiveDateBS', bsDate);
                  }
                } catch (error) {
                  console.error('Date conversion error:', error);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className='bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200'>
        <h3 className='text-lg font-semibold mb-4 text-indigo-900'>
          Preview Teacher Salary Changes
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
            <div className='text-xs text-gray-600'>New Total Salary</div>
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
        {adjustment.amount > 0 && (
          <div className='mt-4 p-3 bg-white rounded-lg'>
            <div className='text-sm text-gray-700 space-y-2'>
              <div>
                <strong>{teacher.name}</strong>'s salary will be{' '}
                <span
                  className={
                    adjustment.direction === 'promotion'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {adjustment.direction === 'promotion'
                    ? 'increased'
                    : 'decreased'}
                </span>{' '}
                by <strong>{formatCurrency(adjustment.amount)}</strong>.
              </div>
              <div className='flex flex-wrap gap-4 text-xs'>
                <span>
                  <strong>Basic:</strong> {formatCurrency(teacher.basicSalary)}
                </span>
                <span>
                  <strong>New Allowances:</strong>{' '}
                  {formatCurrency(
                    teacher.allowances +
                      (adjustment.direction === 'promotion'
                        ? adjustment.amount
                        : -adjustment.amount),
                  )}
                </span>
                <span>
                  <strong>Subject:</strong> {teacher.subject || 'Not specified'}
                </span>
                <span>
                  <strong>Effective:</strong> {adjustment.effectiveDateBS} BS
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTeacherSalaryModal;
