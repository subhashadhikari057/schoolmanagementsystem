'use client';
import React, { useState, useEffect } from 'react';
import { feeService } from '@/api/services/fee.service';
import { feeStructureItemInputSchema } from '@sms/shared-types';

interface Props {
  structureId: string | null;
  open: boolean;
  onClose: () => void;
  onRevised: () => void;
}

export const ReviseFeeStructureModal: React.FC<Props> = ({
  structureId,
  open,
  onClose,
  onRevised,
}) => {
  const [items, setItems] = useState<
    { category: string; label: string; amount: number; frequency: string }[]
  >([]);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setItems([]);
      setEffectiveFrom('');
      setChangeReason('');
      setError(null);
    }
  }, [open]);

  function addItem() {
    setItems(i => [
      ...i,
      { category: 'GENERAL', label: '', amount: 0, frequency: 'MONTHLY' },
    ]);
  }
  function updateItem(idx: number, key: string, val: any) {
    setItems(arr =>
      arr.map((it, i) => (i === idx ? { ...it, [key]: val } : it)),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!structureId) return;
    setLoading(true);
    setError(null);
    try {
      if (!effectiveFrom) throw new Error('Effective date required');
      if (items.length === 0) throw new Error('At least one item');
      items.forEach(it => feeStructureItemInputSchema.parse(it));
      await feeService.reviseStructure(structureId, {
        effectiveFrom,
        changeReason,
        items,
      });
      onRevised();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  if (!open) return null;
  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded shadow-lg w-full max-w-2xl p-4 space-y-4'>
        <h2 className='text-lg font-semibold'>Revise Fee Structure</h2>
        {error && <div className='text-red-600 text-sm'>{error}</div>}
        <form
          onSubmit={submit}
          className='space-y-3 max-h-[70vh] overflow-y-auto pr-2'
        >
          <div>
            <label className='block text-xs'>Effective From</label>
            <input
              type='date'
              className='border px-2 py-1 rounded'
              value={effectiveFrom}
              onChange={e => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-xs'>Change Reason</label>
            <textarea
              className='border px-2 py-1 rounded w-full'
              rows={2}
              value={changeReason}
              onChange={e => setChangeReason(e.target.value)}
            />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium'>Items</span>
            <button
              type='button'
              onClick={addItem}
              className='text-xs bg-gray-200 px-2 py-1 rounded'
            >
              Add
            </button>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className='grid grid-cols-5 gap-2 items-end'>
              <input
                className='border px-2 py-1 rounded col-span-1'
                placeholder='Category'
                value={it.category}
                onChange={e => updateItem(idx, 'category', e.target.value)}
              />
              <input
                className='border px-2 py-1 rounded col-span-2'
                placeholder='Label'
                value={it.label}
                onChange={e => updateItem(idx, 'label', e.target.value)}
              />
              <input
                type='number'
                className='border px-2 py-1 rounded'
                placeholder='Amount'
                value={it.amount}
                onChange={e =>
                  updateItem(idx, 'amount', parseFloat(e.target.value) || 0)
                }
              />
              <select
                className='border px-2 py-1 rounded'
                value={it.frequency}
                onChange={e => updateItem(idx, 'frequency', e.target.value)}
              >
                <option value='MONTHLY'>Monthly</option>
                <option value='TERM'>Term</option>
                <option value='ANNUAL'>Annual</option>
                <option value='ONE_TIME'>One Time</option>
              </select>
            </div>
          ))}
          <div className='flex justify-end gap-2 pt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-3 py-1 text-sm rounded border'
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className='px-3 py-1 text-sm rounded bg-blue-600 text-white'
            >
              {loading ? 'Saving...' : 'Save Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
