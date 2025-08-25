'use client';
import React, { useEffect, useState } from 'react';
import { feeService } from '@/api/services/fee.service';

interface HistoryEntry {
  id: string;
  version: number;
  effectiveFrom: string;
  totalAnnual?: string;
  changeReason?: string;
}

interface Props {
  structureId: string | null;
  open: boolean;
  onClose: () => void;
}

export const FeeStructureHistoryDrawer: React.FC<Props> = ({
  structureId,
  open,
  onClose,
}) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && structureId) {
      (async () => {
        setLoading(true);
        try {
          const data = await feeService.history(structureId);
          setEntries(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, structureId]);
  if (!open) return null;
  return (
    <div className='fixed inset-0 flex justify-end z-40'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='relative bg-white w-full max-w-md h-full shadow-lg flex flex-col'>
        <div className='p-4 border-b flex justify-between items-center'>
          <h3 className='font-semibold'>Revision History</h3>
          <button onClick={onClose} className='text-sm'>
            Close
          </button>
        </div>
        <div className='flex-1 overflow-y-auto p-4 space-y-3 text-sm'>
          {loading && <div>Loading...</div>}
          {!loading && entries.length === 0 && <div>No history.</div>}
          {entries.map(e => (
            <div key={e.id} className='border rounded p-2'>
              <div className='flex justify-between'>
                <span>Version {e.version}</span>
                <span>{new Date(e.effectiveFrom).toLocaleDateString()}</span>
              </div>
              <div className='text-gray-500'>Annual Total: {e.totalAnnual}</div>
              {e.changeReason && (
                <div className='italic text-xs'>{e.changeReason}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
