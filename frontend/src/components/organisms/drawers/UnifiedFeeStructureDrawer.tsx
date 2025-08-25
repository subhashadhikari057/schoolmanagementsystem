'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { feeService } from '@/api/services/fee.service';
import { ReviseFeeStructureModal } from '@/components/organisms/modals/ReviseFeeStructureModal';
import { X } from 'lucide-react';

interface UnifiedDrawerProps {
  structureId: string;
  open: boolean;
  initialTab?: 'view' | 'revise' | 'history';
  onClose: () => void;
  onRevised: () => void;
}
interface HistoryEntry {
  id: string;
  version: number;
  effectiveFrom: string;
  totalAnnual?: string;
  changeReason?: string;
}
interface StructureLite {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  effectiveFrom: string;
  classId: string;
}

export const UnifiedFeeStructureDrawer: React.FC<UnifiedDrawerProps> = ({
  structureId,
  open,
  initialTab = 'view',
  onClose,
  onRevised,
}) => {
  const [tab, setTab] = useState<'view' | 'revise' | 'history'>(initialTab);
  const [detail, setDetail] = useState<StructureLite | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRevise, setShowRevise] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await feeService.listStructures({ page: 1, pageSize: 200 });
      const found = list.data?.data?.find(
        (s: { id: string }) => s.id === structureId,
      ) as StructureLite | undefined;
      setDetail(found || null);
      const hist = await feeService.history(structureId);
      setHistory(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [structureId]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      load();
    } else {
      setDetail(null);
      setHistory([]);
    }
  }, [open, structureId, initialTab, load]);

  const diffBlocks = useMemo(() => {
    if (history.length < 2) return [];
    const sorted = [...history].sort((a, b) => a.version - b.version);
    const blocks: {
      prev: HistoryEntry;
      curr: HistoryEntry;
      changes: string[];
    }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const ch: string[] = [];
      if (prev.totalAnnual !== curr.totalAnnual)
        ch.push(`Annual Total: ${prev.totalAnnual} -> ${curr.totalAnnual}`);
      if (prev.changeReason !== curr.changeReason && curr.changeReason)
        ch.push(`Reason: ${curr.changeReason}`);
      blocks.push({ prev, curr, changes: ch });
    }
    return blocks;
  }, [history]);

  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex'>
      <div className='flex-1 bg-black/40' onClick={onClose} />
      <div className='w-full max-w-3xl h-full bg-white shadow-xl flex flex-col border-l animate-in slide-in-from-right'>
        <div className='px-5 py-4 border-b flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h2 className='text-lg font-semibold'>Fee Structure</h2>
            <nav className='flex gap-2 text-xs'>
              {(['view', 'revise', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full border ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={onClose} className='p-2 rounded hover:bg-gray-100'>
            <X className='h-5 w-5' />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto'>
          {loading && (
            <div className='p-6 text-sm text-gray-500'>Loading...</div>
          )}
          {!loading && tab === 'view' && detail && (
            <div className='p-6 space-y-6 text-sm'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <span className='font-medium text-gray-700'>Name:</span>{' '}
                  {detail.name}
                </div>
                <div>
                  <span className='font-medium text-gray-700'>
                    Academic Year:
                  </span>{' '}
                  {detail.academicYear}
                </div>
                <div>
                  <span className='font-medium text-gray-700'>Status:</span>{' '}
                  {detail.status}
                </div>
                <div>
                  <span className='font-medium text-gray-700'>
                    Effective From:
                  </span>{' '}
                  {new Date(detail.effectiveFrom).toLocaleDateString()}
                </div>
                <div className='col-span-2'>
                  <span className='font-medium text-gray-700'>Class ID:</span>{' '}
                  {detail.classId}
                </div>
              </div>
              <div className='text-xs text-gray-500'>
                Use the History tab to see revisions and the Revise tab to
                create a new version.
              </div>
            </div>
          )}
          {!loading && tab === 'history' && (
            <div className='p-6 space-y-4 text-sm'>
              {history.length === 0 && (
                <div className='text-gray-500'>No history.</div>
              )}
              {history.length > 0 && (
                <div className='space-y-3'>
                  {history
                    .sort((a, b) => b.version - a.version)
                    .map(h => (
                      <div key={h.id} className='border rounded p-3'>
                        <div className='flex justify-between'>
                          <span className='font-medium'>
                            Version {h.version}
                          </span>
                          <span>
                            {new Date(h.effectiveFrom).toLocaleDateString()}
                          </span>
                        </div>
                        <div className='text-gray-600'>
                          Annual Total: {h.totalAnnual}
                        </div>
                        {h.changeReason && (
                          <div className='text-gray-500 italic text-xs'>
                            {h.changeReason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {diffBlocks.length > 0 && (
                <div className='pt-4'>
                  <h4 className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>
                    Differences
                  </h4>
                  <div className='space-y-2 text-xs'>
                    {diffBlocks.map((b, i) => (
                      <div key={i} className='border rounded p-2 bg-gray-50'>
                        <div className='font-medium'>
                          {b.prev.version} → {b.curr.version}
                        </div>
                        {b.changes.length === 0 && (
                          <div className='text-gray-500'>
                            No tracked differences.
                          </div>
                        )}
                        {b.changes.map((c, ci) => (
                          <div key={ci}>• {c}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'revise' && (
            <div className='p-4'>
              <button
                onClick={() => setShowRevise(true)}
                className='px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700'
              >
                Start Revision
              </button>
              <p className='mt-2 text-xs text-gray-500'>
                A revision creates a new version snapshot; previous versions are
                retained.
              </p>
            </div>
          )}
        </div>
      </div>
      {showRevise && (
        <ReviseFeeStructureModal
          structureId={structureId}
          open={showRevise}
          onClose={() => {
            setShowRevise(false);
          }}
          onRevised={() => {
            setShowRevise(false);
            onRevised();
            load();
            setTab('history');
          }}
        />
      )}
    </div>
  );
};

export default UnifiedFeeStructureDrawer;
