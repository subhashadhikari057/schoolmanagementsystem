'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  RotateCcw,
  Move,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Shield,
  Building2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type {
  Room,
  AssetModel,
  AssetItem,
  AssetStatus,
} from '@/types/asset.types';
import ReplaceAssetModal from './modals/ReplaceAssetModal';
import AddAssetModal from './modals/AddAssetModal';
import AssetDetailsModal from './modals/AssetDetailsModal';
import EditAssetModal from './modals/EditAssetModal';
import MoveAssetModal from './modals/MoveAssetModal';
import QuickAddUnitsModal from './modals/QuickAddUnitsModal';

interface RoomDetailPageProps {
  room: Room;
  onAssetUpdate?: () => void;
}

const RoomDetailPage: React.FC<RoomDetailPageProps> = ({
  room,
  onAssetUpdate,
}) => {
  const [assetModels, setAssetModels] = useState<AssetModel[]>([]);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  // Quick Add Units modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddModel, setQuickAddModel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    // load assets for page view if needed
    async function loadRoomAssets() {
      setLoading(true);
      try {
        await new Promise(r => setTimeout(r, 300));
        // TODO: Load real asset models from API
        setAssetModels([]);
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
      case 'ok':
        return 'text-green-600 bg-green-50';
      case 'damaged':
        return 'text-red-600 bg-red-50';
      case 'under_repair':
        return 'text-yellow-600 bg-yellow-50';
      case 'retired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className='h-4 w-4' />;
      case 'damaged':
        return <AlertTriangle className='h-4 w-4' />;
      case 'under_repair':
        return <Clock className='h-4 w-4' />;
      default:
        return <Package className='h-4 w-4' />;
    }
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
      model.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ok' && model.okCount > 0) ||
      (statusFilter === 'damaged' && model.damagedCount > 0) ||
      (statusFilter === 'under_repair' && model.underRepairCount > 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-white/20 rounded-lg'>
              <Building2 className='h-6 w-6' />
            </div>
            <div>
              <h2 className='text-xl font-bold'>Room {room.roomNo}</h2>
              <p className='text-blue-100 text-sm'>
                {room.name} • {room.building} • Floor {room.floor}
              </p>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 w-full'>
          <div className='bg-white/10 rounded-lg p-3'>
            <div className='text-2xl font-bold'>{room.totalAssets}</div>
            <div className='text-blue-100 text-sm'>Total Assets</div>
          </div>
          <div className='bg-white/10 rounded-lg p-3'>
            <div className='text-2xl font-bold text-green-200'>
              {room.totalAssets - room.totalDamaged}
            </div>
            <div className='text-blue-100 text-sm'>Working</div>
          </div>
          <div className='bg-white/10 rounded-lg p-3'>
            <div className='text-2xl font-bold text-red-200'>
              {room.totalDamaged}
            </div>
            <div className='text-blue-100 text-sm'>Issues</div>
          </div>
          <div className='bg-white/10 rounded-lg p-3'>
            <div className='text-2xl font-bold'>
              {formatCurrency(room.totalValue)}
            </div>
            <div className='text-blue-100 text-sm'>Total Value</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className='p-4 border-b border-gray-200 bg-gray-50 w-full'>
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full'>
          <div className='flex-1 min-w-0'>
            <Input
              placeholder='Search assets by name or model...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <select
              value={String(statusFilter)}
              onChange={e => setStatusFilter(e.target.value as any)}
              className='text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='ok'>Working</option>
              <option value='damaged'>Damaged</option>
              <option value='under_repair'>Under Repair</option>
            </select>
            <Button
              size='sm'
              className='flex items-center space-x-2'
              onClick={() => setIsAddAssetModalOpen(true)}
            >
              <Plus className='h-4 w-4' />
              <span>Add Asset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Models list styled like GenericTable */}
      <div className='p-4 w-full'>
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
              <Button onClick={() => setIsAddAssetModalOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add First Asset
              </Button>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {filteredModels.map(model => (
                <div key={model.id} className='w-full'>
                  <div
                    className='flex items-center px-4 py-4 hover:bg-gray-50 cursor-pointer group w-full'
                    onClick={() => toggleModelExpansion(model.id)}
                  >
                    {/* Expand/Collapse Icon */}
                    <div className='flex items-center justify-center mr-3'>
                      {expandedModels.has(model.id) ? (
                        <ChevronDown className='h-5 w-5 text-gray-400' />
                      ) : (
                        <ChevronRight className='h-5 w-5 text-gray-400' />
                      )}
                    </div>

                    {/* Name, Category, Manufacturer */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2'>
                        <h3 className='text-lg font-semibold text-gray-900 truncate'>
                          {model.name}
                        </h3>
                        <Badge variant='secondary' className='text-xs'>
                          {model.category}
                        </Badge>
                      </div>
                      {model.manufacturer && (
                        <p className='text-sm text-gray-500 mt-1'>
                          {model.manufacturer}{' '}
                          {model.modelNumber && `• ${model.modelNumber}`}
                        </p>
                      )}
                    </div>

                    {/* Quantity and Status - Center-right aligned */}
                    <div className='ml-auto mr-6 flex flex-col items-end'>
                      <div className='text-sm font-medium text-gray-900'>
                        {model.totalQuantity} Total
                      </div>
                      <div className='flex items-center space-x-3 text-xs text-gray-500 mt-1'>
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

                    {/* Value aligned at far right */}
                    <div className='flex items-center'>
                      <div className='flex flex-col items-end mr-3'>
                        <div className='text-sm font-semibold text-gray-900'>
                          {formatCurrency(model.totalValue)}
                        </div>
                        <div className='text-xs text-gray-500'>Total Value</div>
                      </div>

                      {/* Quick Add at far right */}
                      <button
                        type='button'
                        className='p-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 focus:outline-none'
                        title='Quick Add Units'
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation();
                          setQuickAddModel({ id: model.id, name: model.name });
                          setIsQuickAddOpen(true);
                        }}
                      >
                        <Plus className='h-4 w-4' />
                      </button>
                    </div>
                    {/* Quick Add Units Modal (keep outside click area) */}
                    <QuickAddUnitsModal
                      isOpen={isQuickAddOpen && !!quickAddModel}
                      onClose={() => {
                        setIsQuickAddOpen(false);
                        setQuickAddModel(null);
                      }}
                      onSuccess={(createdItems: any[]) => {
                        // find the model and append created items
                        setAssetModels(prev =>
                          prev.map(m =>
                            m.id === quickAddModel?.id
                              ? {
                                  ...m,
                                  items: [...m.items, ...createdItems],
                                  totalQuantity:
                                    m.totalQuantity + createdItems.length,
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
                  </div>
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
                                        {item.serialNumber}
                                      </div>
                                      <div className='text-xs text-gray-500'>
                                        {item.tagNumber}
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
                                    {item.warranty}
                                  </td>
                                  <td className='px-6 py-4 whitespace-nowrap'>
                                    {item.lastEvent ? (
                                      <div className='text-xs'>
                                        <div className='font-medium text-gray-900'>
                                          {item.lastEvent.type}
                                        </div>
                                        <div className='text-gray-500'>
                                          {new Date(
                                            item.lastEvent.date,
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
      </div>

      {/* Modals */}
      <ReplaceAssetModal
        isOpen={isReplaceModalOpen}
        onClose={() => {
          setIsReplaceModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={createdItem => {
          // replace the selected item in state with createdItem
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
          // remove moved item from its current model (we're moving out)
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
            // append created models to assetModels
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

export default RoomDetailPage;
