'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  feeManagementApi,
  FeeStructure,
} from '@/api/services/complete-fee-api.service';
import {
  GenericList,
  ListConfiguration,
} from '@/components/templates/GenericList';
import { getListConfig } from '@/components/templates/listConfigurations';
import Link from 'next/link';
import PermissionGate from '@/components/auth/PermissionGate';
import CreateFeeStructureModal from '@/components/organisms/modals/CreateFeeStructureModal';
import ViewFeeStructureModal from '@/components/organisms/modals/ViewFeeStructureModal';
import EditFeeStructureModal from '@/components/organisms/modals/EditFeeStructureModal';
import FeeStructureHistoryModal from '@/components/organisms/modals/FeeStructureHistoryModal';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}
const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(message: string, type: 'success' | 'error') {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }
  const view = (
    <div className='fixed top-2 right-2 z-50 space-y-2'>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-3 py-2 rounded text-sm shadow ${t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { push, view };
};

// Enhanced FeeStructure interface for the row data
interface FeeStructureRow {
  [key: string]: unknown;
  id: string;
  classId: string;
  academicYear: string;
  name: string;
  status: string;
  effectiveFrom: string;
  createdAt: string;
  totalAnnual?: string;
  latestVersion: number;
  grade?: number;
  section?: string;
  assignedClasses: Array<{
    id: string;
    grade: number | null;
    section: string | null;
  }>;
  studentCount: number;
  items: Array<{
    id: string;
    label: string;
    amount: string | number;
    category?: string;
    frequency?: string;
    isOptional?: boolean;
  }>;
}

const FeeManagementAdminPage: React.FC = () => {
  const [rows, setRows] = useState<FeeStructureRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const { push, view } = useToasts();

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [viewTarget, setViewTarget] = useState<FeeStructureRow | null>(null);
  const [editTarget, setEditTarget] = useState<FeeStructureRow | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FeeStructureRow | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeManagementApi.getFeeStructures({
        page,
        pageSize,
      });
      // Map the response data to include additional properties
      setRows(
        res.data.map((r: FeeStructure) => ({
          ...r,
          assignedClasses: [
            { id: r.classId || '', grade: null, section: null },
          ],
          items: r.items || [],
          studentCount: 0,
          totalAnnual: '0',
          latestVersion: 1,
        })),
      );
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      push((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, push]);

  useEffect(() => {
    load();
  }, [page]);

  // Handle actions from GenericList
  const handleFeeStructureAction = (
    action: string,
    feeStructure: FeeStructureRow,
  ) => {
    switch (action) {
      case 'view':
        setViewTarget(feeStructure);
        break;
      case 'edit':
        setEditTarget(feeStructure);
        break;
      case 'history':
        setHistoryTarget(feeStructure);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Get configuration for GenericList
  const listConfig: ListConfiguration<FeeStructureRow> =
    getListConfig('fee-structures');

  return (
    <PermissionGate required={['FINANCE_MANAGE_FEES']}>
      <div className='p-4'>
        {view}

        {/* Action Bar */}
        <div className='mb-6 flex flex-wrap gap-3 items-center'>
          <button
            onClick={() => setShowCreate(true)}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors'
          >
            New Fee Structure
          </button>
          <Link
            href='/admin/fees/scholarships'
            className='px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors'
          >
            Scholarships
          </Link>
          <Link
            href='/admin/fees/charges'
            className='px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors'
          >
            Dues & Fines
          </Link>
        </div>

        {/* Fee Structures List */}
        {loading ? (
          <div className='text-center py-8'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
            <p className='mt-2 text-gray-600'>Loading fee structures...</p>
          </div>
        ) : (
          <GenericList<FeeStructureRow>
            config={listConfig}
            data={rows}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemAction={handleFeeStructureAction}
          />
        )}

        {/* Modals */}
        {showCreate && (
          <CreateFeeStructureModal
            isOpen={showCreate}
            onClose={() => setShowCreate(false)}
            onSuccess={() => {
              push('Fee structure created successfully', 'success');
              setShowCreate(false);
              load();
            }}
          />
        )}

        {viewTarget && (
          <ViewFeeStructureModal
            isOpen={!!viewTarget}
            onClose={() => setViewTarget(null)}
            structure={viewTarget}
          />
        )}

        {editTarget && (
          <EditFeeStructureModal
            isOpen={!!editTarget}
            onClose={() => setEditTarget(null)}
            onSuccess={async () => {
              push('Fee structure updated successfully', 'success');
              setEditTarget(null);
              await load();
            }}
            structure={editTarget}
          />
        )}

        {historyTarget && (
          <FeeStructureHistoryModal
            isOpen={!!historyTarget}
            onClose={() => setHistoryTarget(null)}
            structureId={historyTarget?.id || null}
            structureName={historyTarget?.name}
          />
        )}
      </div>
    </PermissionGate>
  );
};

export default FeeManagementAdminPage;
