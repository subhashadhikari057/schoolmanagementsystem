'use client';
import React, { useEffect, useState } from 'react';
import { useFinanceStore, FeeStructureDraft } from '@/store/finance';
import { Plus, Save, Send, History, Eye, Edit } from 'lucide-react';
import ViewFeeStructureModal from '@/components/organisms/modals/ViewFeeStructureModal';
import EditFeeStructureModal from '@/components/organisms/modals/EditFeeStructureModal';
import FeeStructureHistoryModal from '@/components/organisms/modals/FeeStructureHistoryModal';

const emptyStructure = (): FeeStructureDraft => ({
  id: 'temp-' + Date.now(),
  name: 'New Structure',
  version: 1,
  status: 'draft',
  items: [],
  total: 0,
});

export const FeeStructuresTab: React.FC = () => {
  const {
    feeStructures,
    selectedStructureId,
    setSelectedStructureId,
    builder,
    setBuilder,
    addBuilderItem,
    updateBuilderItem,
    removeBuilderItem,
    recalcBuilderTotal,
    upsertStructure,
    setShowHistory,
    setHistoryTargetId,
  } = useFinanceStore();

  // Modal states for new functionality
  const [viewTarget, setViewTarget] = useState<FeeStructureDraft | null>(null);
  const [editTarget, setEditTarget] = useState<FeeStructureDraft | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FeeStructureDraft | null>(
    null,
  );

  useEffect(() => {
    if (!builder && selectedStructureId) {
      const found = feeStructures.find(f => f.id === selectedStructureId);
      if (found) setBuilder({ ...found });
    }
  }, [builder, selectedStructureId, feeStructures, setBuilder]);

  const createNew = () => {
    const s = emptyStructure();
    upsertStructure(s);
    setSelectedStructureId(s.id);
    setBuilder(s);
  };

  const publish = () => {
    if (!builder) return;
    upsertStructure({ ...builder, status: 'published' });
  };
  const saveDraft = () => {
    if (!builder) return;
    upsertStructure({ ...builder, status: 'draft' });
  };
  const openHistory = () => {
    if (!selectedStructureId) return;
    setHistoryTargetId(selectedStructureId);
    setShowHistory(true);
  };

  useEffect(() => {
    recalcBuilderTotal();
  }, [builder?.items, recalcBuilderTotal]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
      <div className='lg:col-span-3'>
        <div className='bg-white rounded-lg border shadow-sm flex flex-col h-[640px]'>
          <div className='p-4 border-b flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-gray-800'>
              Fee Structures
            </h3>
            <button
              onClick={createNew}
              className='inline-flex items-center text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700'
            >
              <Plus className='w-3 h-3 mr-1' />
              New
            </button>
          </div>
          <div className='flex-1 overflow-auto divide-y'>
            {feeStructures.length === 0 && (
              <div className='p-4 text-xs text-gray-500'>
                No structures yet.
              </div>
            )}
            {feeStructures.map(fs => (
              <div
                key={fs.id}
                className={`w-full text-left group transition-colors ${selectedStructureId === fs.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}`}
              >
                <div className='p-3'>
                  <button
                    onClick={() => {
                      setSelectedStructureId(fs.id);
                      setBuilder({ ...fs });
                    }}
                    className='w-full text-left'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium text-gray-800 truncate'>
                        {fs.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${fs.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {fs.status}
                      </span>
                    </div>
                    <div className='mt-1 flex items-center justify-between text-[11px] text-gray-500'>
                      <span>v{fs.version}</span>
                      <span>Total: {fs.total.toFixed(2)}</span>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className='flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setViewTarget(fs);
                      }}
                      className='p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
                      title='View Details'
                    >
                      <Eye className='h-3 w-3' />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditTarget(fs);
                      }}
                      className='p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors'
                      title='Edit Structure'
                    >
                      <Edit className='h-3 w-3' />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setHistoryTarget(fs);
                      }}
                      className='p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors'
                      title='View History'
                    >
                      <History className='h-3 w-3' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='lg:col-span-9'>
        <div className='bg-white rounded-lg border shadow-sm p-6 space-y-6'>
          <div className='flex items-start justify-between flex-wrap gap-4'>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                Structure Builder
              </h2>
              <p className='text-xs text-gray-500 mt-1'>
                Define line items and publish when ready.
              </p>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={saveDraft}
                disabled={!builder}
                className='inline-flex items-center text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40'
              >
                <Save className='w-3 h-3 mr-1' />
                Save Draft
              </button>
              <button
                onClick={publish}
                disabled={!builder}
                className='inline-flex items-center text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
              >
                <Send className='w-3 h-3 mr-1' />
                Publish
              </button>
              <button
                onClick={openHistory}
                disabled={!selectedStructureId}
                className='inline-flex items-center text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40'
              >
                <History className='w-3 h-3 mr-1' />
                History
              </button>
            </div>
          </div>

          {!builder && (
            <div className='p-6 border-2 border-dashed rounded-md text-center text-xs text-gray-500'>
              Select or create a structure to begin.
            </div>
          )}

          {builder && (
            <div className='space-y-6'>
              <div className='grid gap-2'>
                {builder.items.map(item => (
                  <div
                    key={item.id}
                    className='grid grid-cols-12 gap-2 items-center group'
                  >
                    <input
                      value={item.label}
                      onChange={e =>
                        updateBuilderItem(item.id, { label: e.target.value })
                      }
                      placeholder='Label'
                      className='col-span-5 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    />
                    <select
                      value={item.category}
                      onChange={e =>
                        updateBuilderItem(item.id, { category: e.target.value })
                      }
                      className='col-span-3 px-2 py-1.5 text-xs border rounded'
                    >
                      <option value='GENERAL'>General</option>
                      <option value='LAB'>Lab</option>
                      <option value='TRANSPORT'>Transport</option>
                      <option value='HOSTEL'>Hostel</option>
                    </select>
                    <input
                      type='number'
                      value={item.amount}
                      onChange={e =>
                        updateBuilderItem(item.id, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className='col-span-3 px-2 py-1.5 text-xs border rounded text-right'
                    />
                    <button
                      onClick={() => removeBuilderItem(item.id)}
                      className='opacity-0 group-hover:opacity-100 text-red-500 text-xs px-1'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <button
                  onClick={addBuilderItem}
                  className='text-xs text-blue-600 hover:underline'
                >
                  + Add Item
                </button>
              </div>
              <div className='flex justify-end border-t pt-4 text-sm'>
                <span className='font-medium text-gray-700'>
                  Total: {builder.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {viewTarget && (
        <ViewFeeStructureModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          structure={{
            ...viewTarget,
            academicYear: '2024-2025', // Default or get from context
            createdAt: new Date().toISOString(),
            classId: '', // Default
            assignedClasses: [],
            studentCount: 0,
            effectiveFrom: viewTarget.effectiveFrom || new Date().toISOString(),
            latestVersion: viewTarget.version,
            totalAnnual: viewTarget.total,
          }}
        />
      )}

      {editTarget && (
        <EditFeeStructureModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          structure={{
            ...editTarget,
            academicYear: '2024-2025', // Default or get from context
            classId: '', // Default
            assignedClasses: [],
            effectiveFrom: editTarget.effectiveFrom || new Date().toISOString(),
          }}
          onSuccess={_updatedStructure => {
            // Refresh the fee structures list
            const state = useFinanceStore.getState();
            if (state.feeStructures) {
              // Re-fetch or update local state as needed
              window.location.reload(); // Simple refresh for now
            }
            setEditTarget(null);
          }}
        />
      )}

      {historyTarget && (
        <FeeStructureHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          structureId={historyTarget.id}
          structureName={historyTarget.name}
        />
      )}
    </div>
  );
};
