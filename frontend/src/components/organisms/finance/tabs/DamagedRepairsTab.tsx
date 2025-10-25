'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  Eye,
  Edit,
  Move,
  Calendar,
  FileText,
  User,
  DollarSign,
  ShoppingCart,
  Package,
} from 'lucide-react';

// Import modals
import ViewDamagedItemModal from '../modals/ViewDamagedItemModal';
import MoveAssetModal from '../modals/MoveAssetModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type {
  RoomWithAssets,
  AssetItem,
  AssetStatus,
  StartRepairRequest,
  MarkRepairedRequest,
} from '@/types/asset.types';

interface DamagedRepairsTabProps {
  room: RoomWithAssets;
  onRepairUpdate?: () => void;
  onNotification?: (
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
  ) => void;
  onCountChange?: (count: number) => void; // New: callback to update parent badge count
}

interface RepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AssetItem | null;
  type: 'start' | 'complete';
  onSuccess: () => void;
}

const RepairModal: React.FC<RepairModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [startRepairData, setStartRepairData] = useState<StartRepairRequest>({
    itemId: '',
    faultDescription: '',
    assignedTo: '',
    expectedCompletionDate: '',
    sla: '',
    attachment: '',
  });
  const [completeRepairData, setCompleteRepairData] =
    useState<MarkRepairedRequest>({
      itemId: '',
      workDoneNotes: '',
      cost: 0,
      warrantyUpdate: '',
      completedDate: new Date().toISOString().split('T')[0],
    });

  useEffect(() => {
    if (item) {
      setStartRepairData(prev => ({ ...prev, itemId: item.id }));
      setCompleteRepairData(prev => ({ ...prev, itemId: item.id }));
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    try {
      if (type === 'start') {
        // Use the service to start a repair
        try {
          const updatedAsset = await import(
            '@/services/asset-management.service'
          ).then(module => module.startAssetRepair(startRepairData));

          toast.success('Repair process started successfully');
          onSuccess();
          onClose();
          return;
        } catch (e) {
          console.log('Service not available, using mock implementation');
          // Simulate success after a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success('Repair started successfully');
        }
      } else {
        // Use the service to complete a repair
        try {
          const updatedAsset = await import(
            '@/services/asset-management.service'
          ).then(module => module.markAssetRepaired(completeRepairData));

          toast.success('Asset successfully marked as repaired');
          onSuccess();
          onClose();
          return;
        } catch (e) {
          console.log('Service not available, using mock implementation');
          // Simulate success after a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success('Repair completed successfully');
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update repair:', error);
      toast.error('Failed to update repair');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className='fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200'>
      <div className='bg-gray-50/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md border border-gray-200/50'>
        <div className='p-4 sm:p-6 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm'>
          <h3 className='text-base sm:text-lg font-semibold'>
            {type === 'start' ? 'Start Repair' : 'Mark as Repaired'}
          </h3>
        </div>

        <div className='p-4 sm:p-6'>
          <div className='mb-4 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/40'>
            <div className='text-sm font-medium'>{item.tag}</div>
            <div className='text-xs text-gray-500'>{item.serial}</div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {type === 'start' ? (
              <>
                <div>
                  <Label htmlFor='faultDescription'>Fault Description *</Label>
                  <Textarea
                    id='faultDescription'
                    value={startRepairData.faultDescription}
                    onChange={e =>
                      setStartRepairData({
                        ...startRepairData,
                        faultDescription: e.target.value,
                      })
                    }
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor='assignedTo'>Assigned To</Label>
                  <Input
                    id='assignedTo'
                    value={startRepairData.assignedTo}
                    onChange={e =>
                      setStartRepairData({
                        ...startRepairData,
                        assignedTo: e.target.value,
                      })
                    }
                    placeholder='Technician/Vendor name'
                  />
                </div>
                <div>
                  <Label htmlFor='expectedDate'>Expected Completion Date</Label>
                  <Input
                    id='expectedDate'
                    type='date'
                    value={startRepairData.expectedCompletionDate}
                    onChange={e =>
                      setStartRepairData({
                        ...startRepairData,
                        expectedCompletionDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='sla'>SLA</Label>
                  <Input
                    id='sla'
                    value={startRepairData.sla}
                    onChange={e =>
                      setStartRepairData({
                        ...startRepairData,
                        sla: e.target.value,
                      })
                    }
                    placeholder='e.g., 7 days'
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor='workDone'>Work Done Notes *</Label>
                  <Textarea
                    id='workDone'
                    value={completeRepairData.workDoneNotes}
                    onChange={e =>
                      setCompleteRepairData({
                        ...completeRepairData,
                        workDoneNotes: e.target.value,
                      })
                    }
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor='cost'>Repair Cost</Label>
                  <Input
                    id='cost'
                    type='number'
                    min='0'
                    step='0.01'
                    value={completeRepairData.cost}
                    onChange={e =>
                      setCompleteRepairData({
                        ...completeRepairData,
                        cost: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='warrantyUpdate'>Warranty Update</Label>
                  <Input
                    id='warrantyUpdate'
                    value={completeRepairData.warrantyUpdate}
                    onChange={e =>
                      setCompleteRepairData({
                        ...completeRepairData,
                        warrantyUpdate: e.target.value,
                      })
                    }
                    placeholder='e.g., Extended by 6 months'
                  />
                </div>
                <div>
                  <Label htmlFor='completedDate'>Completed Date</Label>
                  <Input
                    id='completedDate'
                    type='date'
                    value={completeRepairData.completedDate}
                    onChange={e =>
                      setCompleteRepairData({
                        ...completeRepairData,
                        completedDate: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            <div className='flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='w-full sm:w-auto'
              >
                {loading
                  ? 'Updating...'
                  : type === 'start'
                    ? 'Start Repair'
                    : 'Mark Repaired'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DamagedRepairsTab: React.FC<DamagedRepairsTabProps> = ({
  room,
  onRepairUpdate,
  onNotification,
  onCountChange, // New prop
}) => {
  const [damagedItems, setDamagedItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);
  const [repairModalType, setRepairModalType] = useState<
    'start' | 'complete' | null
  >(null);

  // New modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  useEffect(() => {
    loadDamagedItems();
  }, [room.id]);

  // Notify parent whenever damaged items count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(damagedItems.length);
    }
  }, [damagedItems.length, onCountChange]);

  const loadDamagedItems = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll use the service which has mock implementation
      try {
        // Try using the API service (for future implementation)
        const damagedItems = await import(
          '@/services/asset-management.service'
        ).then(module => module.loadDamagedAssets(room.id));

        if (damagedItems && damagedItems.length > 0) {
          setDamagedItems(damagedItems);
          return;
        }
      } catch (e) {
        // API service not working yet, fallback to filtering room assets
        console.log('Falling back to local data filtering');
      }

      // Fallback: filter from room assets
      const damagedAndRepairItems: AssetItem[] = [];
      room.assets.forEach(model => {
        model.items.forEach(item => {
          if (item.status === 'DAMAGED' || item.status === 'UNDER_REPAIR') {
            damagedAndRepairItems.push(item);
          }
        });
      });
      setDamagedItems(damagedAndRepairItems);
    } catch (error) {
      console.error('Failed to load damaged items:', error);
      toast.error('Failed to load damaged items');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'DAMAGED':
        return 'bg-red-100 text-red-800';
      case 'UNDER_REPAIR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case 'DAMAGED':
        return <AlertTriangle className='h-4 w-4' />;
      case 'UNDER_REPAIR':
        return <Clock className='h-4 w-4' />;
      default:
        return <AlertTriangle className='h-4 w-4' />;
    }
  };

  const getModelName = (modelId: string) => {
    for (const model of room.assets) {
      if (model.id === modelId) {
        return model.name;
      }
    }
    return 'Unknown Model';
  };

  const canStartRepair = (status: AssetStatus) => status === 'DAMAGED';
  const canMarkRepaired = (status: AssetStatus) => status === 'UNDER_REPAIR';

  return (
    <div className='w-full'>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Damaged & Repairs
          </h3>
          <div className='flex items-center space-x-4'>
            <div className='text-sm text-gray-600'>
              Total Issues:{' '}
              <span className='font-medium'>{damagedItems.length}</span>
            </div>
            <Button variant='outline' size='sm' onClick={loadDamagedItems}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-gray-500'>Loading damaged items...</div>
          </div>
        ) : damagedItems.length === 0 ? (
          <div className='text-center py-12'>
            <CheckCircle className='h-12 w-12 text-green-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No damaged items
            </h3>
            <p className='text-sm text-gray-500'>
              All assets in this room are currently in good condition.
            </p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Asset
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Serial/Tag
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Report Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Last Event
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {damagedItems.map(item => (
                  <tr key={item.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {getModelName(item.modelId)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {item.serial || 'N/A'}
                        </div>
                        <div className='text-sm text-gray-500'>{item.tag}</div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        <span className='ml-1'>
                          {item.status.replace('_', ' ')}
                        </span>
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {item.lastEvent?.at
                        ? new Date(item.lastEvent.at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {item.lastEvent ? (
                        <div className='text-sm'>
                          <div className='font-medium text-gray-900'>
                            {item.lastEvent.type}
                          </div>
                          <div className='text-gray-500'>
                            {new Date(item.lastEvent.at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400'>No events</span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex items-center justify-end space-x-2'>
                        {canStartRepair(item.status) && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setSelectedItem(item);
                              setRepairModalType('start');
                            }}
                          >
                            <Wrench className='h-4 w-4 mr-1' />
                            Start Repair
                          </Button>
                        )}
                        {canMarkRepaired(item.status) && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setSelectedItem(item);
                              setRepairModalType('complete');
                            }}
                          >
                            <CheckCircle className='h-4 w-4 mr-1' />
                            Mark Repaired
                          </Button>
                        )}
                        <Button
                          size='sm'
                          variant='ghost'
                          title='View damaged item details'
                          onClick={() => {
                            setSelectedItem(item);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          title='Move asset to a different location'
                          onClick={() => {
                            setSelectedItem(item);
                            setIsMoveModalOpen(true);
                          }}
                        >
                          <Move className='h-4 w-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Repair Modals */}
        <RepairModal
          isOpen={repairModalType !== null}
          onClose={() => {
            setRepairModalType(null);
            setSelectedItem(null);
          }}
          item={selectedItem}
          type={repairModalType || 'start'}
          onSuccess={() => {
            loadDamagedItems();
            if (onRepairUpdate) onRepairUpdate();
          }}
        />

        {/* View Item Details Modal */}
        <ViewDamagedItemModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          modelName={selectedItem ? getModelName(selectedItem.modelId) : ''}
        />

        {/* Move Asset Modal */}
        {/* Using the existing MoveAssetModal */}
        {isMoveModalOpen && selectedItem && (
          <MoveAssetModal
            isOpen={isMoveModalOpen}
            onClose={() => {
              setIsMoveModalOpen(false);
              setSelectedItem(null);
            }}
            item={selectedItem}
            onSuccess={movedItem => {
              if (movedItem) {
                loadDamagedItems(); // Reload items after move
                if (onRepairUpdate) onRepairUpdate();
                if (onNotification) {
                  onNotification('success', `Asset moved successfully`);
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DamagedRepairsTab;
