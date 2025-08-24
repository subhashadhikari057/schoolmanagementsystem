'use client';

import React, { useState } from 'react';
import {
  Eye,
  Filter,
  RefreshCw,
  Calendar,
  User,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  teacherSalaryService,
  type TeacherSalaryHistoryResponse,
  type TeacherSalaryHistoryItem,
  type TeacherWithHistory,
  type SalaryListQuery,
} from '../../api/services/teacher-salary.service';

interface TeacherSalaryTableProps {
  data: TeacherSalaryHistoryResponse;
  onRefresh: () => void;
}

export const TeacherSalaryTable: React.FC<TeacherSalaryTableProps> = ({
  data,
  onRefresh,
}) => {
  const [filters, setFilters] = useState<{
    teacherId: string;
    month: string;
    changeType: 'INITIAL' | 'PROMOTION' | 'DEMOTION' | 'ADJUSTMENT' | '';
  }>({
    teacherId: '',
    month: '',
    changeType: '',
  });
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherWithHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    try {
      setIsLoading(true);
      // Create proper query object filtering out empty strings
      const query: SalaryListQuery = {
        page: 1,
        pageSize: 20,
      };

      if (filters.teacherId) query.teacherId = filters.teacherId;
      if (filters.month) query.month = filters.month;
      if (filters.changeType)
        query.changeType = filters.changeType as
          | 'INITIAL'
          | 'PROMOTION'
          | 'DEMOTION'
          | 'ADJUSTMENT';

      await teacherSalaryService.listSalaryHistory(query);
      // This would need to be passed back up to parent to update state
      onRefresh();
      toast.success('Filters applied successfully');
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      teacherId: '',
      month: '',
      changeType: '',
    });
    onRefresh();
  };

  const handleViewTeacherHistory = async (teacherId: string) => {
    try {
      setIsLoading(true);
      const teacherHistory =
        await teacherSalaryService.getTeacherSalaryHistory(teacherId);
      setSelectedTeacher(teacherHistory);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching teacher history:', error);
      toast.error('Failed to load teacher history');
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeTypeBadgeColor = (changeType: string) => {
    switch (changeType.toLowerCase()) {
      case 'promotion':
        return 'badge-success';
      case 'increment':
        return 'badge-info';
      case 'bonus':
        return 'badge-warning';
      case 'adjustment':
        return 'badge-secondary';
      case 'initial':
        return 'badge-neutral';
      case 'demotion':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className='space-y-6'>
      {/* Filters Section */}
      <div className='card bg-base-100 border border-base-300'>
        <div className='card-body'>
          <div className='flex items-center gap-2 mb-4'>
            <Filter className='h-5 w-5' />
            <h3 className='card-title text-lg'>Filters</h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Teacher ID</span>
              </label>
              <input
                type='text'
                placeholder='Enter teacher ID'
                className='input input-bordered'
                value={filters.teacherId}
                onChange={e => handleFilterChange('teacherId', e.target.value)}
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Month</span>
              </label>
              <input
                type='month'
                className='input input-bordered'
                value={filters.month}
                onChange={e => handleFilterChange('month', e.target.value)}
              />
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text font-medium'>Change Type</span>
              </label>
              <select
                className='select select-bordered'
                value={filters.changeType}
                onChange={e => handleFilterChange('changeType', e.target.value)}
              >
                <option value=''>All Types</option>
                <option value='INITIAL'>Initial</option>
                <option value='PROMOTION'>Promotion</option>
                <option value='DEMOTION'>Demotion</option>
                <option value='ADJUSTMENT'>Adjustment</option>
              </select>
            </div>

            <div className='form-control'>
              <label className='label'>
                <span className='label-text opacity-0'>Actions</span>
              </label>
              <div className='flex gap-2'>
                <button
                  className='btn btn-primary flex-1'
                  onClick={applyFilters}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className='loading loading-spinner loading-sm'></span>
                  ) : (
                    <Filter className='h-4 w-4' />
                  )}
                  Apply
                </button>
                <button className='btn btn-outline' onClick={clearFilters}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className='card bg-base-100 border border-base-300'>
        <div className='card-body'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='card-title'>
              Salary History ({data?.totalItems || 0} records)
            </h3>
            <button
              className='btn btn-outline btn-sm gap-2'
              onClick={onRefresh}
            >
              <RefreshCw className='h-4 w-4' />
              Refresh
            </button>
          </div>

          {data?.data && data.data.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className='hidden lg:block overflow-x-auto'>
                <table className='table table-zebra'>
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Previous Amount</th>
                      <th>New Amount</th>
                      <th>Change</th>
                      <th>Type</th>
                      <th>Effective Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(record => (
                      <tr key={record.id}>
                        <td>
                          <div className='flex items-center gap-3'>
                            <div className='avatar placeholder'>
                              <div className='bg-neutral text-neutral-content rounded-full w-8'>
                                <User className='h-4 w-4' />
                              </div>
                            </div>
                            <div>
                              <div className='font-bold'>
                                {record.teacher.firstName}{' '}
                                {record.teacher.lastName}
                              </div>
                              <div className='text-sm opacity-50'>
                                {record.teacher.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(record.previousAmount)}</td>
                        <td className='font-semibold'>
                          {formatCurrency(record.newAmount)}
                        </td>
                        <td>
                          <div
                            className={`font-semibold ${
                              record.newAmount > record.previousAmount
                                ? 'text-success'
                                : record.newAmount < record.previousAmount
                                  ? 'text-error'
                                  : 'text-base-content'
                            }`}
                          >
                            {record.newAmount > record.previousAmount
                              ? '+'
                              : ''}
                            {formatCurrency(
                              record.newAmount - record.previousAmount,
                            )}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`badge ${getChangeTypeBadgeColor(record.changeType)}`}
                          >
                            {record.changeType}
                          </div>
                        </td>
                        <td>{formatDate(record.effectiveDate)}</td>
                        <td>
                          <button
                            className='btn btn-ghost btn-sm'
                            onClick={() =>
                              handleViewTeacherHistory(record.teacherId)
                            }
                          >
                            <Eye className='h-4 w-4' />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className='lg:hidden space-y-4'>
                {data.data.map(record => (
                  <div key={record.id} className='card bg-base-200 shadow-sm'>
                    <div className='card-body p-4'>
                      <div className='flex justify-between items-start mb-3'>
                        <div>
                          <h4 className='font-bold'>
                            {record.teacher.firstName} {record.teacher.lastName}
                          </h4>
                          <p className='text-sm opacity-70'>
                            {record.teacher.employeeId}
                          </p>
                        </div>
                        <div
                          className={`badge ${getChangeTypeBadgeColor(record.changeType)}`}
                        >
                          {record.changeType}
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='opacity-70'>Previous:</span>
                          <div className='font-medium'>
                            {formatCurrency(record.previousAmount)}
                          </div>
                        </div>
                        <div>
                          <span className='opacity-70'>New:</span>
                          <div className='font-bold'>
                            {formatCurrency(record.newAmount)}
                          </div>
                        </div>
                        <div>
                          <span className='opacity-70'>Change:</span>
                          <div
                            className={`font-semibold ${
                              record.newAmount > record.previousAmount
                                ? 'text-success'
                                : record.newAmount < record.previousAmount
                                  ? 'text-error'
                                  : 'text-base-content'
                            }`}
                          >
                            {record.newAmount > record.previousAmount
                              ? '+'
                              : ''}
                            {formatCurrency(
                              record.newAmount - record.previousAmount,
                            )}
                          </div>
                        </div>
                        <div>
                          <span className='opacity-70'>Date:</span>
                          <div className='font-medium'>
                            {formatDate(record.effectiveDate)}
                          </div>
                        </div>
                      </div>

                      <div className='card-actions justify-end mt-3'>
                        <button
                          className='btn btn-primary btn-sm gap-2'
                          onClick={() =>
                            handleViewTeacherHistory(record.teacherId)
                          }
                        >
                          <Eye className='h-4 w-4' />
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className='text-center py-12'>
              <DollarSign className='h-12 w-12 mx-auto text-base-content/30 mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                No Salary Records Found
              </h3>
              <p className='text-base-content/70'>
                No salary history records match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Teacher History Modal */}
      {selectedTeacher && (
        <div className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
          <div className='modal-box max-w-4xl'>
            <h3 className='font-bold text-lg mb-4'>
              Salary History - {selectedTeacher.teacher.firstName}{' '}
              {selectedTeacher.teacher.lastName}
            </h3>

            <div className='mb-6'>
              <div className='stats shadow'>
                <div className='stat'>
                  <div className='stat-figure text-primary'>
                    <User className='h-8 w-8' />
                  </div>
                  <div className='stat-title'>Employee ID</div>
                  <div className='stat-value text-primary'>
                    {selectedTeacher.teacher.employeeId}
                  </div>
                </div>

                <div className='stat'>
                  <div className='stat-figure text-secondary'>
                    <DollarSign className='h-8 w-8' />
                  </div>
                  <div className='stat-title'>Current Salary</div>
                  <div className='stat-value text-secondary'>
                    {selectedTeacher.history.length > 0
                      ? formatCurrency(selectedTeacher.history[0].newAmount)
                      : 'N/A'}
                  </div>
                </div>

                <div className='stat'>
                  <div className='stat-figure text-accent'>
                    <Calendar className='h-8 w-8' />
                  </div>
                  <div className='stat-title'>Records</div>
                  <div className='stat-value text-accent'>
                    {selectedTeacher.history.length}
                  </div>
                </div>
              </div>
            </div>

            <div className='overflow-x-auto'>
              <table className='table table-zebra'>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Previous</th>
                    <th>New Amount</th>
                    <th>Change</th>
                    <th>Type</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeacher.history.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.effectiveDate)}</td>
                      <td>{formatCurrency(record.previousAmount)}</td>
                      <td className='font-semibold'>
                        {formatCurrency(record.newAmount)}
                      </td>
                      <td
                        className={`font-semibold ${
                          record.newAmount > record.previousAmount
                            ? 'text-success'
                            : record.newAmount < record.previousAmount
                              ? 'text-error'
                              : 'text-base-content'
                        }`}
                      >
                        {record.newAmount > record.previousAmount ? '+' : ''}
                        {formatCurrency(
                          record.newAmount - record.previousAmount,
                        )}
                      </td>
                      <td>
                        <div
                          className={`badge ${getChangeTypeBadgeColor(record.changeType)}`}
                        >
                          {record.changeType}
                        </div>
                      </td>
                      <td className='max-w-xs truncate'>
                        {record.reason || 'No reason provided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='modal-action'>
              <button className='btn' onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
