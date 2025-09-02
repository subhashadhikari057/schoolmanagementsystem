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

// Import additional modals
// import ReplaceAssetModal from '../modals/ReplaceAssetModal';

interface RoomDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onAssetUpdate: () => void;
}

// Mock asset data for demonstration
const mockAssetModels: AssetModel[] = [
  {
    id: '1',
    name: 'Dell OptiPlex 7080',
    category: 'electronics',
    description: 'Desktop computer for educational use',
    manufacturer: 'Dell',
    modelNumber: 'OP7080-MT',
    totalQuantity: 20,
    okCount: 18,
    damagedCount: 1,
    underRepairCount: 1,
    retiredCount: 0,
    totalValue: 17999.8,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
    items: [
      {
        id: '1-1',
        serialNumber: 'DOT001',
        tagNumber: 'TAG001',
        status: 'ok',
        purchaseDate: '2024-01-15',
        cost: 899.99,
        warranty: '3 years',
        vendor: 'TechCorp Solutions',
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-09-01T10:30:00Z',
      },
      {
        id: '1-2',
        serialNumber: 'DOT002',
        tagNumber: 'TAG002',
        status: 'damaged',
        purchaseDate: '2024-01-15',
        cost: 899.99,
        warranty: '3 years',
        vendor: 'TechCorp Solutions',
        lastEvent: {
          type: 'Damage Report',
          date: '2024-08-15',
          description: 'Screen cracked during transport',
        },
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-08-15T14:20:00Z',
      },
    ],
  },
  {
    id: '2',
    name: 'Office Chair',
    category: 'furniture',
    description: 'Ergonomic office chair for student seating',
    manufacturer: 'Steelcase',
    modelNumber: 'Series1',
    totalQuantity: 25,
    okCount: 24,
    damagedCount: 1,
    underRepairCount: 0,
    retiredCount: 0,
    totalValue: 6249.75,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
    items: [],
  },
];

const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = ({
  isOpen,
  onClose,
  room,
  onAssetUpdate,
}) => {
  const [assetModels, setAssetModels] = useState<AssetModel[]>(mockAssetModels);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && room) {
      // In a real implementation, fetch asset models for this room
      loadRoomAssets();
    }
  }, [isOpen, room]);

  const loadRoomAssets = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual service
      await new Promise(resolve => setTimeout(resolve, 500));
      setAssetModels(mockAssetModels);
    } catch (error) {
      console.error('Error loading room assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModelExpansion = (modelId: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelId)) {
      newExpanded.delete(modelId);
    } else {
      newExpanded.add(modelId);
    }
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

  if (!isOpen || !room) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200'
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 animate-in slide-in-from-right ${
          window.innerWidth < 768 ? 'w-full' : 'w-2/3 max-w-4xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
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
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='text-white hover:bg-white/20 rounded-lg'
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
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

        {/* Content */}
        <div className='flex-1 overflow-hidden flex flex-col h-[calc(100vh-200px)]'>
          {/* Filters */}
          <div className='p-4 border-b border-gray-200 bg-gray-50'>
            <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
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
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className='text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='all'>All Status</option>
                  <option value='ok'>Working</option>
                  <option value='damaged'>Damaged</option>
                  <option value='under_repair'>Under Repair</option>
                </select>
                <Button size='sm' className='flex items-center space-x-2'>
                  <Plus className='h-4 w-4' />
                  <span>Add Asset</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Asset Models List */}
          <div className='flex-1 overflow-y-auto'>
            {loading ? (
              <div className='flex items-center justify-center p-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3'></div>
                <span>Loading assets...</span>
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
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Add First Asset
                </Button>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {filteredModels.map(model => (
                  <div key={model.id} className='bg-white'>
                    {/* Model Header */}
                    <div
                      className='flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer'
                      onClick={() => toggleModelExpansion(model.id)}
                    >
                      <div className='flex items-center space-x-4 flex-1 min-w-0'>
                        <div className='flex items-center'>
                          {expandedModels.has(model.id) ? (
                            <ChevronDown className='h-5 w-5 text-gray-400' />
                          ) : (
                            <ChevronRight className='h-5 w-5 text-gray-400' />
                          )}
                        </div>

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
                      </div>

                      <div className='flex items-center space-x-6'>
                        <div className='text-right'>
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

                        <div className='text-right'>
                          <div className='text-sm font-semibold text-gray-900'>
                            {formatCurrency(model.totalValue)}
                          </div>
                          <div className='text-xs text-gray-500'>
                            Total Value
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Item Details */}
                    {expandedModels.has(model.id) && (
                      <div className='border-t border-gray-100 bg-gray-50'>
                        {model.items.length === 0 ? (
                          <div className='p-4 text-center text-gray-500 text-sm'>
                            No individual items to display
                          </div>
                        ) : (
                          <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                              <thead className='bg-gray-100'>
                                <tr>
                                  <th className='px-4 py-2 text-left font-medium text-gray-700'>
                                    Serial/Tag
                                  </th>
                                  <th className='px-4 py-2 text-left font-medium text-gray-700'>
                                    Status
                                  </th>
                                  <th className='px-4 py-2 text-left font-medium text-gray-700'>
                                    Warranty
                                  </th>
                                  <th className='px-4 py-2 text-left font-medium text-gray-700'>
                                    Last Event
                                  </th>
                                  <th className='px-4 py-2 text-right font-medium text-gray-700'>
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className='divide-y divide-gray-200'>
                                {model.items.map(item => (
                                  <tr key={item.id} className='hover:bg-white'>
                                    <td className='px-4 py-3'>
                                      <div>
                                        <div className='font-mono text-xs font-medium'>
                                          {item.serialNumber}
                                        </div>
                                        <div className='text-xs text-gray-500'>
                                          {item.tagNumber}
                                        </div>
                                      </div>
                                    </td>
                                    <td className='px-4 py-3'>
                                      <div
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                                      >
                                        {getStatusIcon(item.status)}
                                        <span className='ml-1 capitalize'>
                                          {item.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </td>
                                    <td className='px-4 py-3 text-xs text-gray-600'>
                                      {item.warranty}
                                    </td>
                                    <td className='px-4 py-3'>
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
                                    <td className='px-4 py-3'>
                                      <div className='flex items-center justify-end space-x-1'>
                                        <Button size='sm' variant='ghost'>
                                          <Eye className='h-4 w-4' />
                                        </Button>
                                        <Button size='sm' variant='ghost'>
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
                                        <Button size='sm' variant='ghost'>
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

        {/* Replace Asset Modal - Comment out until we create it */}
        {/*
        <ReplaceAssetModal
          isOpen={isReplaceModalOpen}
          onClose={() => {
            setIsReplaceModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSuccess={() => {
            setIsReplaceModalOpen(false);
            setSelectedItem(null);
            loadRoomAssets();
            onAssetUpdate();
          }}
        />
        */}
      </div>
    </>
  );
};

export default RoomDetailDrawer;
