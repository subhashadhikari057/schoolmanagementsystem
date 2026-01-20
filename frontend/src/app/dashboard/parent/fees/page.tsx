'use client';
import React, { useState, useEffect } from 'react';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { PageLoader } from '@/components/atoms/loading';
import {
  parentService,
  type ParentResponse,
} from '@/api/services/parent.service';
import {
  feeService,
  type CurrentStudentFeeResponse,
} from '@/api/services/fee.service';

export default function ParentFeesPage() {
  const [children, setChildren] = useState<ParentResponse['children']>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [currentFee, setCurrentFee] =
    useState<CurrentStudentFeeResponse | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentService.getMyProfile();
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to load children');
        }
        const kids = res.data.children || [];
        setChildren(kids);
        setSelectedChild(kids[0]?.studentId || kids[0]?.id || null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load children';
        setError(message);
        setChildren([]);
        setSelectedChild(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const childOptions = (children || []).map(child => ({
    value: child.studentId || child.id,
    label: `${child.fullName} ${child.className ? `(${child.className})` : ''}`,
  }));
  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Due', label: 'Due' },
  ];
  const feesRaw =
    currentFee && currentFee.computedFee
      ? [
          {
            month: currentFee.currentMonth,
            amount: currentFee.computedFee.finalPayable,
            status: 'Due',
            dueDate: '',
          },
        ]
      : [];
  const fees =
    statusFilter === 'All'
      ? feesRaw
      : feesRaw.filter(fee => fee.status === statusFilter);

  useEffect(() => {
    const fetchFees = async () => {
      if (!selectedChild) {
        setCurrentFee(null);
        return;
      }
      try {
        setFeeLoading(true);
        setFeeError(null);
        const res =
          await feeService.getCurrentFeesForParentChild(selectedChild);
        setCurrentFee(res);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load fees';
        setFeeError(message);
        setCurrentFee(null);
      } finally {
        setFeeLoading(false);
      }
    };

    fetchFees();
  }, [selectedChild]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-600'>
        {error}
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className='min-h-screen flex items-center justify-center text-gray-600'>
        No children found for this parent account.
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f7f8fa] px-3 sm:px-4 lg:px-8 pt-8 pb-12'>
      <div className='w-full'>
        <div className='flex flex-col sm:flex-row items-center justify-between mb-6 gap-4'>
          <SectionTitle
            text="My Child's Fees"
            className='text-xl font-bold text-gray-900'
          />
          <div className='flex gap-3 items-center'>
            <Dropdown
              type='filter'
              options={childOptions}
              selectedValue={selectedChild ?? undefined}
              onSelect={value => setSelectedChild(value)}
              className='min-w-[220px]'
              placeholder='Select Child'
            />
            <Dropdown
              type='filter'
              options={statusOptions}
              selectedValue={statusFilter}
              onSelect={setStatusFilter}
              className='min-w-[120px]'
              placeholder='Status'
            />
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-4'>
          <h3 className='font-semibold text-gray-800 mb-4'>Fee Notices</h3>
          <div className='space-y-3'>
            {feeLoading ? (
              <div className='text-gray-500'>Loading fees...</div>
            ) : feeError ? (
              <div className='text-red-600'>{feeError}</div>
            ) : fees.length === 0 ? (
              <div className='text-gray-500'>No fee data found.</div>
            ) : (
              fees.map((fee, idx) => (
                <div
                  key={idx}
                  className='border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 hover:bg-blue-50 transition-all'
                >
                  <div>
                    <div className='font-medium text-gray-900'>{fee.month}</div>
                    <div className='text-xs text-gray-500'>
                      Due Date: {fee.dueDate || '—'}
                    </div>
                  </div>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0'>
                    <span className='text-base font-bold text-blue-700'>
                      {typeof fee.amount === 'number'
                        ? `₹${fee.amount.toLocaleString()}`
                        : fee.amount}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
