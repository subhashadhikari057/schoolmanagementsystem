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

  const childOptions = (children || []).map(child => ({
    value: child.studentId || child.id,
    label: `${child.fullName} ${child.className ? `(${child.className})` : ''}`,
  }));

  const structureItems = (() => {
    const breakdown = currentFee?.computedFee?.breakdown as any;
    if (Array.isArray(breakdown?.items)) return breakdown.items;
    if (Array.isArray(breakdown)) return breakdown;
    return [];
  })();

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
          </div>
        </div>
        <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div>
              <h3 className='font-semibold text-gray-800'>Fee Structure</h3>
              <p className='text-sm text-gray-500'>
                Showing the current fee structure for the selected child&apos;s
                class.
              </p>
            </div>
            {currentFee?.computedFee && (
              <div className='text-right'>
                <div className='text-xs uppercase text-gray-500'>
                  Total Payable (per current period)
                </div>
                <div className='text-xl font-bold text-blue-700'>
                  रु {currentFee.computedFee.finalPayable.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {feeLoading ? (
            <div className='text-gray-500'>Loading fee structure...</div>
          ) : feeError ? (
            <div className='text-red-600'>{feeError}</div>
          ) : !currentFee ? (
            <div className='text-gray-500'>Select a child to view fees.</div>
          ) : structureItems.length === 0 ? (
            <div className='text-gray-500'>
              No fee structure is assigned for this class yet.
            </div>
          ) : (
            <div className='space-y-3'>
              {structureItems.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className='border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50'
                >
                  <div>
                    <div className='font-medium text-gray-900'>
                      {item.label || item.category || 'Item'}
                    </div>
                    {item.frequency && (
                      <div className='text-xs text-gray-500'>
                        {item.frequency}
                      </div>
                    )}
                  </div>
                  <div className='text-base font-semibold text-blue-700'>
                    रु {Number(item.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentFee?.computedFee && (
            <div className='grid sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100'>
              <SummaryRow
                label='Base Amount'
                value={currentFee.computedFee.baseAmount}
              />
              <SummaryRow
                label='Scholarship Deduction'
                value={currentFee.computedFee.scholarshipDeduction}
                valueClass='text-green-700'
                prefix='-'
              />
              <SummaryRow
                label='Extra Charges'
                value={currentFee.computedFee.extraCharges}
              />
              <SummaryRow
                label='Final Payable'
                value={currentFee.computedFee.finalPayable}
                valueClass='text-blue-700 font-bold'
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
  prefix = '',
}: {
  label: string;
  value: number;
  valueClass?: string;
  prefix?: string;
}) {
  return (
    <div className='flex items-center justify-between text-sm text-gray-700'>
      <span>{label}</span>
      <span className={`font-semibold ${valueClass ?? ''}`}>
        {prefix}रु {Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}
