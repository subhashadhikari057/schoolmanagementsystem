'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FeeItemDraft {
  id: string;
  label: string;
  category: string;
  amount: number;
}
export interface FeeStructureDraft {
  id: string;
  name: string;
  version: number;
  effectiveFrom?: string;
  status: 'draft' | 'published';
  items: FeeItemDraft[];
  total: number;
}
export interface ScholarshipDraft {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  assignedCount: number;
  status: 'active' | 'inactive';
}
export interface FineDraft {
  id: string;
  reason: string;
  type: 'FINE' | 'DUE';
  amount: number;
  appliedCount: number;
  createdAt: string;
}

interface FinanceState {
  // Tab index
  activeTab: number;
  setActiveTab: (i: number) => void;

  // Fee structures
  feeStructures: FeeStructureDraft[];
  selectedStructureId: string | null;
  setSelectedStructureId: (id: string | null) => void;
  upsertStructure: (s: FeeStructureDraft) => void;
  deleteStructure: (id: string) => void;

  // Builder working copy
  builder: FeeStructureDraft | null;
  setBuilder: (b: FeeStructureDraft | null) => void;
  updateBuilderItem: (id: string, patch: Partial<FeeItemDraft>) => void;
  addBuilderItem: () => void;
  removeBuilderItem: (id: string) => void;
  recalcBuilderTotal: () => void;

  // Scholarships
  scholarships: ScholarshipDraft[];
  upsertScholarship: (s: ScholarshipDraft) => void;

  // Fines / Dues
  fines: FineDraft[];
  upsertFine: (f: FineDraft) => void;

  // UI state
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  historyTargetId: string | null;
  setHistoryTargetId: (id: string | null) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, _get) => ({
      activeTab: 0,
      setActiveTab: i => set({ activeTab: i }),

      feeStructures: [],
      selectedStructureId: null,
      setSelectedStructureId: id => set({ selectedStructureId: id }),
      upsertStructure: s => {
        set(state => ({
          feeStructures: state.feeStructures.some(fs => fs.id === s.id)
            ? state.feeStructures.map(fs => (fs.id === s.id ? s : fs))
            : [...state.feeStructures, s],
        }));
      },
      deleteStructure: id =>
        set(state => ({
          feeStructures: state.feeStructures.filter(f => f.id !== id),
          selectedStructureId:
            state.selectedStructureId === id ? null : state.selectedStructureId,
        })),

      builder: null,
      setBuilder: b => set({ builder: b }),
      updateBuilderItem: (id, patch) =>
        set(state => ({
          builder: state.builder
            ? {
                ...state.builder,
                items: state.builder.items.map(it =>
                  it.id === id ? { ...it, ...patch } : it,
                ),
              }
            : null,
        })),
      addBuilderItem: () =>
        set(state => ({
          builder: state.builder
            ? {
                ...state.builder,
                items: [
                  ...state.builder.items,
                  {
                    id: 'temp-' + Date.now(),
                    label: '',
                    category: 'GENERAL',
                    amount: 0,
                  },
                ],
              }
            : null,
        })),
      removeBuilderItem: id =>
        set(state => ({
          builder: state.builder
            ? {
                ...state.builder,
                items: state.builder.items.filter(i => i.id !== id),
              }
            : null,
        })),
      recalcBuilderTotal: () =>
        set(state => ({
          builder: state.builder
            ? {
                ...state.builder,
                total: state.builder.items.reduce(
                  (a, b) => a + (Number(b.amount) || 0),
                  0,
                ),
              }
            : null,
        })),

      scholarships: [],
      upsertScholarship: s =>
        set(state => ({
          scholarships: state.scholarships.some(x => x.id === s.id)
            ? state.scholarships.map(x => (x.id === s.id ? s : x))
            : [...state.scholarships, s],
        })),

      fines: [],
      upsertFine: f =>
        set(state => ({
          fines: state.fines.some(x => x.id === f.id)
            ? state.fines.map(x => (x.id === f.id ? f : x))
            : [...state.fines, f],
        })),

      showHistory: false,
      setShowHistory: v => set({ showHistory: v }),
      historyTargetId: null,
      setHistoryTargetId: id => set({ historyTargetId: id }),
    }),
    {
      name: 'finance-store',
      partialize: s => ({
        activeTab: s.activeTab,
        feeStructures: s.feeStructures,
        scholarships: s.scholarships,
        fines: s.fines,
      }),
    },
  ),
);
