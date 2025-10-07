'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  RotateCcw,
  Move,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  HelpCircle,
  Info,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  RoomWithAssets,
  AssetModelWithItems,
  AssetItem,
  AssetStatus,
} from '@/types/asset.types';

// Import modals
import ReplaceAssetModal from '../modals/ReplaceAssetModal';
import AddAssetModal from '../modals/AddAssetModal';
import AssetDetailsModal from '../modals/AssetDetailsModal';
import EditAssetModal from '../modals/EditAssetModal';
import MoveAssetModal from '../modals/MoveAssetModal';
import QuickAddUnitsModal from '../modals/QuickAddUnitsModal';
import ReportDamageModal from '../modals/ReportDamageModal';

interface AssetsTabProps {
  room: RoomWithAssets;
  searchQuery: string;
  statusFilter: AssetStatus | 'all';
  onAssetUpdate?: () => void;
  onNotification?: (
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
  ) => void;
  onSearchChange?: (query: string) => void;
  onStatusFilterChange?: (status: AssetStatus | 'all') => void;
  onOpenAddAsset?: () => void;
}

const AssetsTab: React.FC<AssetsTabProps> = ({
  room,
  searchQuery,
  statusFilter,
  onAssetUpdate,
  onNotification,
  onSearchChange,
  onStatusFilterChange,
  onOpenAddAsset,
}) => {
  const [assetModels, setAssetModels] = useState<AssetModelWithItems[]>([]);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  // Helper content for guidance
  const helpContent = {
    title: 'Asset Management Guide',
    sections: [
      {
        title: 'Adding Assets',
        content:
          "Click 'Add Asset Model' to register a new type of asset (e.g., projectors, desks). You can then add individual items of that model.",
      },
      {
        title: 'Managing Items',
        content:
          "Click the '+' button next to any model to quickly add more units. Use the expand arrow to view individual asset items and their details.",
      },
      {
        title: 'Asset Status',
        content:
          'Track asset condition: In Service (working), Damaged (needs attention), Under Repair (being fixed), Replaced/Disposed (end of life).',
      },
      {
        title: 'Quick Actions',
        content:
          'Use the action buttons on each item to view details, edit information, replace damaged items, or move assets between rooms.',
      },
    ],
  };

  // Bulk action handlers
  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const allItems = filteredModels.flatMap(model =>
      model.items.map(item => item.id),
    );
    if (selectedItems.size === allItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems));
    }
  };

  const handleBulkAction = (action: 'move' | 'repair' | 'delete') => {
    onNotification?.(
      'info',
      `Bulk ${action} for ${selectedItems.size} items (Feature coming soon)`,
    );
    setSelectedItems(new Set());
  };

  // Modal states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isReportDamageModalOpen, setIsReportDamageModalOpen] = useState(false);
  const [quickAddModel, setQuickAddModel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    // Load asset models for this room
    async function loadRoomAssets() {
      setLoading(true);
      try {
        // TODO: Load real asset models from API
        setAssetModels(room.assets || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRoomAssets();
  }, [room]);

  const toggleModelExpansion = (modelId: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelId)) newExpanded.delete(modelId);
    else newExpanded.add(modelId);
    setExpandedModels(newExpanded);
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'IN_SERVICE':
        return 'text-green-600 bg-green-50';
      case 'DAMAGED':
        return 'text-red-600 bg-red-50';
      case 'UNDER_REPAIR':
        return 'text-yellow-600 bg-yellow-50';
      case 'REPLACED':
      case 'DISPOSED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case 'IN_SERVICE':
        return <CheckCircle className='h-4 w-4' />;
      case 'DAMAGED':
        return <AlertTriangle className='h-4 w-4' />;
      case 'UNDER_REPAIR':
        return <Clock className='h-4 w-4' />;
      default:
        return <Package className='h-4 w-4' />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredModels = assetModels.filter(model => {
    const matchesSearch =
      !searchQuery ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'IN_SERVICE' && model.okCount > 0) ||
      (statusFilter === 'DAMAGED' && model.damagedCount > 0) ||
      (statusFilter === 'UNDER_REPAIR' && model.underRepairCount > 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='w-full'>
      {/* Tab Header with Contextual Actions */}
      <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
            <Package className='h-5 w-5 mr-2 text-blue-600' />
            Asset Inventory
          </h2>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <span>
              {filteredModels.length} model
              {filteredModels.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span>
              {filteredModels.reduce(
                (sum, model) => sum + model.totalQuantity,
                0,
              )}{' '}
              total items
            </span>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              onOpenAddAsset?.();
            }}
            className='bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Asset Model
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowHelp(!showHelp)}
            className='bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            title='Show help and guidance'
          >
            <HelpCircle className='h-4 w-4 mr-2' />
            Help
          </Button>

          {/* Search and Filter Controls */}
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search assets...'
                value={searchQuery}
                onChange={e => onSearchChange?.(e.target.value)}
                className='pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48'
              />
              <Package className='h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400' />
            </div>

            <select
              value={String(statusFilter)}
              onChange={e =>
                onStatusFilterChange?.(e.target.value as AssetStatus | 'all')
              }
              className='px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='IN_SERVICE'>In Service</option>
              <option value='DAMAGED'>Damaged</option>
              <option value='UNDER_REPAIR'>Under Repair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contextual Help Panel */}
      {showHelp && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center'>
              <Info className='h-5 w-5 text-blue-600 mr-2' />
              <h3 className='font-semibold text-blue-900'>
                {helpContent.title}
              </h3>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className='text-blue-400 hover:text-blue-600 transition-colors'
            >
              ×
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {helpContent.sections.map((section, index) => (
              <div
                key={index}
                className='bg-white rounded-md p-3 border border-blue-100'
              >
                <h4 className='font-medium text-blue-900 mb-2'>
                  {section.title}
                </h4>
                <p className='text-sm text-blue-700 leading-relaxed'>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
          <div className='mt-4 p-3 bg-white rounded-md border border-blue-100'>
            <div className='flex items-center text-sm text-blue-700'>
              <HelpCircle className='h-4 w-4 mr-2' />
              <span className='font-medium'>Tip:</span>
              <span className='ml-1'>
                Press{' '}
                <kbd className='px-1 py-0.5 bg-blue-100 rounded text-xs font-mono'>
                  ?
                </kbd>{' '}
                anytime to toggle keyboard shortcuts
              </span>
            </div>
          </div>
        </div>
      )}

      <div className='bg-white rounded-lg shadow w-full'>
        {loading ? (
          <div className='flex items-center justify-center p-8'>
            Loading assets...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className='text-center py-12'>
            <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No assets found
            </h3>
            <p className='text-sm text-gray-500 mb-6'>
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'This room has no assets yet'}
            </p>
            <Button
              onClick={() => {
                onOpenAddAsset?.();
              }}
            >
              <Plus className='h-4 w-4 mr-2' />
              Add First Asset
            </Button>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {/* Table Headers */}
            <div className='grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider'>
              <div className='col-span-1'></div> {/* Expand icon */}
              <div className='col-span-4'>Model</div>
              <div className='col-span-2'>Category</div>
              <div className='col-span-2'>Qty</div>
              <div className='col-span-2'>Total Value</div>
              <div className='col-span-1'>Actions</div>
            </div>

            {filteredModels.map(model => (
              <div key={model.id} className='w-full'>
                <div
                  className='grid grid-cols-12 gap-4 items-center px-4 py-4 hover:bg-gray-50 cursor-pointer group w-full'
                  onClick={() => toggleModelExpansion(model.id)}
                >
                  {/* Expand/Collapse Icon */}
                  <div className='col-span-1 flex items-center justify-center'>
                    {expandedModels.has(model.id) ? (
                      <ChevronDown className='h-5 w-5 text-gray-400' />
                    ) : (
                      <ChevronRight className='h-5 w-5 text-gray-400' />
                    )}
                  </div>

                  {/* Model Info */}
                  <div className='col-span-4'>
                    <div className='flex items-center space-x-2'>
                      <h3 className='text-sm font-semibold text-gray-900 truncate'>
                        {model.name}
                      </h3>
                    </div>
                    {model.brand && (
                      <p className='text-xs text-gray-500 mt-1'>
                        {model.brand}
                        {model.modelNo && ` • ${model.modelNo}`}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className='col-span-2'>
                    <Badge variant='secondary' className='text-xs'>
                      {model.category}
                    </Badge>
                  </div>

                  {/* Quantity and Status */}
                  <div className='col-span-2'>
                    <div className='text-sm font-medium text-gray-900'>
                      {model.totalQuantity} Total
                    </div>
                    <div className='flex items-center space-x-2 text-xs text-gray-500 mt-1'>
                      <span className='flex items-center'>
                        <div className='w-2 h-2 bg-green-500 rounded-full mr-1'></div>
                        {model.okCount} OK
                      </span>
                      {model.damagedCount > 0 && (
                        <span className='flex items-center'>
                          <div className='w-2 h-2 bg-red-500 rounded-full mr-1'></div>
                          {model.damagedCount} Damaged
                        </span>
                      )}
                      {model.underRepairCount > 0 && (
                        <span className='flex items-center'>
                          <div className='w-2 h-2 bg-yellow-500 rounded-full mr-1'></div>
                          {model.underRepairCount} Repair
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className='col-span-2'>
                    <div className='text-sm font-semibold text-gray-900'>
                      {formatCurrency(model.totalValue)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='col-span-1 flex items-center justify-end'>
                    <button
                      type='button'
                      className='p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 focus:outline-none'
                      title='Quick Add Units'
                      onClick={e => {
                        e.stopPropagation();
                        setQuickAddModel({ id: model.id, name: model.name });
                        setIsQuickAddOpen(true);
                      }}
                    >
                      <Plus className='h-4 w-4' />
                    </button>
                  </div>
                </div>

                {/* Expanded Items List */}
                {expandedModels.has(model.id) && (
                  <div className='border-t border-gray-100 bg-gray-50 w-full'>
                    {model.items.length === 0 ? (
                      <div className='p-4 text-center text-gray-500 text-sm'>
                        No individual items to display
                      </div>
                    ) : (
                      <div className='overflow-x-auto w-full'>
                        <table className='min-w-full divide-y divide-gray-200'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Serial/Tag
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Status
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                Warranty
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
                            {model.items.map(item => (
                              <tr key={item.id} className='hover:bg-gray-50'>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  <div>
                                    <div className='font-mono text-xs font-medium'>
                                      {item.serial || 'N/A'}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      {item.tag}
                                    </div>
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                                  <div
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                                  >
                                    {getStatusIcon(item.status)}
                                    <span className='ml-1 capitalize'>
                                      {item.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-xs text-gray-600'>
                                  {item.warrantyExpiry
                                    ? new Date(
                                        item.warrantyExpiry,
                                      ).toLocaleDateString()
                                    : 'N/A'}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  {item.lastEvent ? (
                                    <div className='text-xs'>
                                      <div className='font-medium text-gray-900'>
                                        {item.lastEvent.type}
                                      </div>
                                      <div className='text-gray-500'>
                                        {new Date(
                                          item.lastEvent.at,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className='text-xs text-gray-400'>
                                      No recent events
                                    </span>
                                  )}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='flex items-center justify-end space-x-1'>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setIsDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className='h-4 w-4' />
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setIsEditOpen(true);
                                      }}
                                    >
                                      <Edit className='h-4 w-4' />
                                    </Button>
                                    {item.status === 'IN_SERVICE' && (
                                      <Button
                                        size='sm'
                                        variant='ghost'
                                        onClick={() => {
                                          setSelectedItem(item);
                                          setIsReportDamageModalOpen(true);
                                        }}
                                        title='Report damaged asset'
                                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                      >
                                        <AlertTriangle className='h-4 w-4' />
                                      </Button>
                                    )}
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setIsReplaceModalOpen(true);
                                      }}
                                    >
                                      <RotateCcw className='h-4 w-4' />
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setIsMoveOpen(true);
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportDamageModal
        isOpen={isReportDamageModalOpen}
        onClose={() => {
          setIsReportDamageModalOpen(false);
          setSelectedItem(null);
        }}
        asset={selectedItem}
        modelName={selectedItem ? getModelName(selectedItem.modelId) : ''}
        onSuccess={updatedAsset => {
          if (updatedAsset && selectedItem) {
            // Update the asset in the list with the updated status
            setAssetModels(prev =>
              prev.map(model => ({
                ...model,
                items: model.items.map(item =>
                  item.id === updatedAsset.id ? updatedAsset : item,
                ),
                // Update counts
                okCount: model.items.some(item => item.id === updatedAsset.id)
                  ? model.okCount - 1
                  : model.okCount,
                damagedCount: model.items.some(
                  item => item.id === updatedAsset.id,
                )
                  ? model.damagedCount + 1
                  : model.damagedCount,
              })),
            );
          }
          setIsReportDamageModalOpen(false);
          setSelectedItem(null);
          if (onAssetUpdate) onAssetUpdate();

          // Show notification
          if (onNotification) {
            onNotification(
              'info',
              'Damage report submitted successfully. The asset has been moved to the Damaged & Repairs tab.',
            );
          }
        }}
      />

      <QuickAddUnitsModal
        isOpen={isQuickAddOpen && !!quickAddModel}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddModel(null);
        }}
        onSuccess={(createdItems: any[]) => {
          // Update the model with new items
          setAssetModels(prev =>
            prev.map(m =>
              m.id === quickAddModel?.id
                ? {
                    ...m,
                    items: [...m.items, ...createdItems],
                    totalQuantity: m.totalQuantity + createdItems.length,
                    okCount: m.okCount + createdItems.length,
                    totalValue:
                      m.totalValue +
                      createdItems.reduce(
                        (s: any, it: any) => s + (it.cost || 0),
                        0,
                      ),
                  }
                : m,
            ),
          );
          setIsQuickAddOpen(false);
          setQuickAddModel(null);
          if (onAssetUpdate) onAssetUpdate();
        }}
        modelName={quickAddModel?.name || ''}
        modelId={quickAddModel?.id || ''}
      />

      <ReplaceAssetModal
        isOpen={isReplaceModalOpen}
        onClose={() => {
          setIsReplaceModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={createdItem => {
          if (createdItem && selectedItem) {
            setAssetModels(prev =>
              prev.map(model => ({
                ...model,
                items: model.items.map(it =>
                  it.id === selectedItem.id ? createdItem : it,
                ),
              })),
            );
          }
          setIsReplaceModalOpen(false);
          setSelectedItem(null);
          if (onAssetUpdate) onAssetUpdate();
        }}
      />

      <AssetDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />

      <EditAssetModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={() => {
          setIsEditOpen(false);
          setSelectedItem(null);
          if (onAssetUpdate) onAssetUpdate();
        }}
      />

      <MoveAssetModal
        isOpen={isMoveOpen}
        onClose={() => {
          setIsMoveOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={movedItem => {
          if (movedItem) {
            setAssetModels(prev =>
              prev.map(model => ({
                ...model,
                items: model.items.filter(it => it.id !== movedItem.id),
                totalQuantity: Math.max(
                  0,
                  model.totalQuantity -
                    (model.items.some(it => it.id === movedItem.id) ? 1 : 0),
                ),
              })),
            );
          }
          setIsMoveOpen(false);
          setSelectedItem(null);
          if (onAssetUpdate) onAssetUpdate();
        }}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={createdModels => {
          if (Array.isArray(createdModels) && createdModels.length) {
            setAssetModels(prev => [...createdModels, ...prev]);
          }
          setIsAddAssetModalOpen(false);
          if (onAssetUpdate) onAssetUpdate();
        }}
        targetRoomId={room.id}
      />
    </div>
  );
};

export default AssetsTab;
