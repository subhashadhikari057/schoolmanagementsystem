'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Bell,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  RoomWithAssets,
  AssetStatus,
  AssetModelWithItems,
} from '@/types/asset.types';

// Tab components
import AssetsTab from './tabs/AssetsTab';
import AcquisitionTab from './tabs/AcquisitionTab';
import DamagedRepairsTab from './tabs/DamagedRepairsTab';
// Modals
import AddAssetModal from './modals/AddAssetModal';
import ImportCSVModal from './modals/ImportCSVModal';

// Dynamic import for Record Acquisition Modal
const RecordAcquisitionModal = React.lazy(
  () => import('./modals/RecordAcquisitionModal'),
);

interface RoomDetailPageProps {
  room: RoomWithAssets;
  onAssetUpdate?: () => void;
}

const RoomDetailPage: React.FC<RoomDetailPageProps> = ({
  room,
  onAssetUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');

  // Modal states
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isRecordAcquisitionModalOpen, setIsRecordAcquisitionModalOpen] =
    useState(false);
  const [isImportCSVModalOpen, setIsImportCSVModalOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Enhanced state for UX improvements
  const [lastUpdated] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'success' | 'warning' | 'error' | 'info';
      message: string;
      timestamp: Date;
    }>
  >([]);

  // Enhanced mock data for demonstration
  const roomWithMockData = useMemo(() => {
    const mockAssetModels: AssetModelWithItems[] = [
      {
        id: 'model-001',
        name: 'Interactive Projector',
        brand: 'Epson',
        modelNo: 'BrightLink 695Wi',
        category: 'electronics',
        items: [
          {
            id: 'item-001',
            modelId: 'model-001',
            roomId: room.id,
            serial: 'EP2023001',
            tag: 'PROJ-001',
            status: 'IN_SERVICE',
            warrantyExpiry: '2025-12-31',
            location: { type: 'ROOM', roomId: room.id },
            acquisitionId: 'acq-001',
            lastEvent: {
              type: 'MAINTENANCE_CHECK',
              at: '2024-10-01T10:00:00Z',
              note: 'Regular maintenance performed',
            },
          },
          {
            id: 'item-002',
            modelId: 'model-001',
            roomId: room.id,
            serial: 'EP2023002',
            tag: 'PROJ-002',
            status: 'DAMAGED',
            warrantyExpiry: '2025-12-31',
            location: {
              type: 'ROOM',
              roomId: room.id,
              note: 'Lamp needs replacement',
            },
            acquisitionId: 'acq-001',
            lastEvent: {
              type: 'DAMAGE_REPORT',
              at: '2024-09-28T14:30:00Z',
              note: 'Lamp burnt out during class',
            },
          },
        ],
        totalQuantity: 2,
        okCount: 1,
        damagedCount: 1,
        underRepairCount: 0,
        replacedCount: 0,
        disposedCount: 0,
        totalValue: 2500,
        manufacturer: 'Epson Corporation',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-10-01T10:00:00Z',
      },
      {
        id: 'model-002',
        name: 'Student Desk & Chair Set',
        brand: 'SchoolMaster',
        modelNo: 'SM-DESK-40',
        category: 'furniture',
        items: [
          {
            id: 'item-003',
            modelId: 'model-002',
            roomId: room.id,
            tag: 'DESK-001',
            status: 'IN_SERVICE',
            location: { type: 'ROOM', roomId: room.id },
            acquisitionId: 'acq-002',
          },
          {
            id: 'item-004',
            modelId: 'model-002',
            roomId: room.id,
            tag: 'DESK-002',
            status: 'IN_SERVICE',
            location: { type: 'ROOM', roomId: room.id },
            acquisitionId: 'acq-002',
          },
          {
            id: 'item-005',
            modelId: 'model-002',
            roomId: room.id,
            tag: 'DESK-003',
            status: 'UNDER_REPAIR',
            location: { type: 'VENDOR', note: 'Sent for chair repair' },
            acquisitionId: 'acq-002',
            lastEvent: {
              type: 'REPAIR_STARTED',
              at: '2024-10-05T08:00:00Z',
              note: 'Chair mechanism broken, sent to vendor',
            },
          },
        ],
        totalQuantity: 3,
        okCount: 2,
        damagedCount: 0,
        underRepairCount: 1,
        replacedCount: 0,
        disposedCount: 0,
        totalValue: 450,
        manufacturer: 'SchoolMaster Furniture',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-10-05T08:00:00Z',
      },
    ];

    return {
      ...room,
      assets: mockAssetModels,
      totalAssets: mockAssetModels.reduce(
        (sum, model) => sum + model.totalQuantity,
        0,
      ),
      totalDamaged: mockAssetModels.reduce(
        (sum, model) => sum + model.damagedCount + model.underRepairCount,
        0,
      ),
      totalValue: mockAssetModels.reduce(
        (sum, model) => sum + model.totalValue,
        0,
      ),
    };
  }, [room]);

  // Intelligent KPI calculations
  const roomMetrics = useMemo(() => {
    const workingAssets =
      roomWithMockData.totalAssets - roomWithMockData.totalDamaged;
    const healthPercentage =
      roomWithMockData.totalAssets > 0
        ? Math.round((workingAssets / roomWithMockData.totalAssets) * 100)
        : 100;

    // Calculate trends (mock for now - would come from API)
    const assetTrend: 'up' | 'down' | 'neutral' =
      roomWithMockData.totalAssets > 0 ? 'up' : 'neutral';
    const healthTrend: 'up' | 'down' | 'neutral' =
      healthPercentage >= 95
        ? 'up'
        : healthPercentage >= 80
          ? 'neutral'
          : 'down';

    // Priority indicators
    const criticalIssues =
      roomWithMockData.assets?.reduce((count, model) => {
        return (
          count +
          (model.items?.filter(item => item.status === 'DAMAGED').length || 0)
        );
      }, 0) || 0;

    const warrantyExpiring =
      roomWithMockData.assets?.reduce((count, model) => {
        return (
          count +
          (model.items?.filter(item => {
            if (!item.warrantyExpiry) return false;
            const daysLeft = Math.ceil(
              (new Date(item.warrantyExpiry).getTime() - new Date().getTime()) /
                (1000 * 3600 * 24),
            );
            return daysLeft >= 0 && daysLeft <= 30;
          }).length || 0)
        );
      }, 0) || 0;

    return {
      totalAssets: roomWithMockData.totalAssets,
      workingAssets,
      issuesCount: roomWithMockData.totalDamaged,
      damagedAssets: roomWithMockData.totalDamaged,
      totalValue: roomWithMockData.totalValue,
      healthPercentage,
      assetTrend,
      healthTrend,
      criticalIssues,
      warrantyExpiring,
      avgAssetValue:
        roomWithMockData.totalAssets > 0
          ? roomWithMockData.totalValue / roomWithMockData.totalAssets
          : 0,
      acquisitionCount: roomWithMockData.assets?.length || 0,
    };
  }, [roomWithMockData]);

  // Smart notification system
  const addNotification = useCallback(
    (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
      const notification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    },
    [],
  );

  // Enhanced keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('assets');
            addNotification('info', 'Switched to Assets tab (Ctrl+1)');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('acquisition');
            addNotification('info', 'Switched to Acquisition tab (Ctrl+2)');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('damaged');
            addNotification('info', 'Switched to Damaged/Repairs tab (Ctrl+3)');
            break;
          case 'k': {
            e.preventDefault();
            const searchInput = document.querySelector(
              'input[placeholder*="search" i]',
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
              addNotification('info', 'Search focused (Ctrl+K)');
            }
            break;
          }
          case 'n': {
            e.preventDefault();
            if (e.shiftKey) {
              setIsRecordAcquisitionModalOpen(true);
              addNotification(
                'info',
                'Opening acquisition form... (Ctrl+Shift+N)',
              );
            } else {
              setIsAddAssetModalOpen(true);
              addNotification('info', 'Opening add asset form... (Ctrl+N)');
            }
            break;
          }
        }
      }

      if (e.key === 'Escape') {
        if (notifications.length > 0) {
          setNotifications([]);
          addNotification('info', 'Notifications cleared');
        } else if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        }
      }

      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowKeyboardShortcuts(!showKeyboardShortcuts);
        addNotification(
          'info',
          showKeyboardShortcuts
            ? 'Shortcuts hidden'
            : 'Shortcuts shown (Press ? again to hide)',
        );
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [addNotification, notifications.length, showKeyboardShortcuts]);

  // Enhanced search and filter logic (kept for future use)
  const smartSearchAndFilter = useCallback(
    (models: any[], query: string, status: AssetStatus | 'all') => {
      return models.filter(model => {
        const matchesSearch =
          !query ||
          model.name.toLowerCase().includes(query.toLowerCase()) ||
          model.brand?.toLowerCase().includes(query.toLowerCase()) ||
          model.category.toLowerCase().includes(query.toLowerCase());

        const matchesStatus =
          status === 'all' ||
          (status === 'IN_SERVICE' && model.okCount > 0) ||
          (status === 'DAMAGED' && model.damagedCount > 0) ||
          (status === 'UNDER_REPAIR' && model.underRepairCount > 0);

        return matchesSearch && matchesStatus;
      });
    },
    [],
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      default:
        return <Target className='h-4 w-4 text-gray-500' />;
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className='w-full'>
      {/* Breadcrumb */}
      <div className='mb-4 text-sm text-gray-600'>
        <span>Asset Management</span>
        <span className='mx-2'>&gt;</span>
        <span className='font-medium text-gray-900'>
          {room.name || `Room ${room.roomNo}`}
        </span>
        <span className='mx-2'>&gt;</span>
        <span className='text-blue-600 capitalize'>
          {activeTab.replace('_', ' ')}
        </span>
        {lastUpdated && (
          <span className='ml-4 text-xs text-gray-400'>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Enhanced Notification Bar */}
      {notifications.length > 0 && (
        <div className='mb-4 space-y-2'>
          {notifications.slice(0, 2).map(notification => (
            <div
              key={notification.id}
              className={`${
                notification.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200 shadow-green-100'
                  : notification.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 shadow-yellow-100'
                    : notification.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200 shadow-red-100'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 shadow-blue-100'
              } flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transform transition-all duration-300 ease-out shadow-md hover:scale-[1.02] cursor-default`}
            >
              <div
                className={`${
                  notification.type === 'success'
                    ? 'bg-green-100'
                    : notification.type === 'warning'
                      ? 'bg-yellow-100'
                      : notification.type === 'error'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                } p-1 rounded-full flex-shrink-0`}
              >
                {notification.type === 'success' && (
                  <CheckCircle2 className='h-4 w-4' />
                )}
                {notification.type === 'warning' && (
                  <AlertCircle className='h-4 w-4' />
                )}
                {notification.type === 'error' && (
                  <AlertTriangle className='h-4 w-4' />
                )}
                {notification.type === 'info' && <Bell className='h-4 w-4' />}
              </div>
              <span className='font-medium flex-1'>{notification.message}</span>
              <button
                onClick={() =>
                  setNotifications(prev =>
                    prev.filter(n => n.id !== notification.id),
                  )
                }
                className='ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50'
                title='Dismiss notification'
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <div className='mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-gray-900 flex items-center'>
              <Target className='h-4 w-4 mr-2' />
              Keyboard Shortcuts
            </h3>
            <button
              onClick={() => setShowKeyboardShortcuts(false)}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              x
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Switch to Assets</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+1
                </kbd>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Switch to Acquisition</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+2
                </kbd>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Switch to Damaged/Repairs</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+3
                </kbd>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Focus Search</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+K
                </kbd>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Add Asset</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+N
                </kbd>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Record Acquisition</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  Ctrl+Shift+N
                </kbd>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Toggle Help</span>
                <kbd className='px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono'>
                  ?
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Header (Always Visible) */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg'>
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-white/20 rounded-lg'>
              <Building2 className='h-6 w-6' />
            </div>
            <div>
              <h2 className='text-xl font-bold'>
                {room.name || `Room ${room.roomNo}`}
              </h2>
              <p className='text-blue-100 text-sm'>
                {room.type && `${room.type} - `}
                {room.building}
                {room.floor && ` - Floor ${room.floor}`}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced KPIs */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 w-full'>
          <div className='bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20'>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-2xl font-bold'>
                {roomMetrics.totalAssets}
              </div>
              {getTrendIcon(roomMetrics.assetTrend)}
            </div>
            <div className='text-blue-100 text-sm'>Total Assets</div>
            <div className='text-xs text-blue-200 mt-1'>
              Avg: {formatCurrency(roomMetrics.avgAssetValue)}
            </div>
          </div>

          <div className='bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20'>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-2xl font-bold text-green-200'>
                {roomMetrics.workingAssets}
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(roomMetrics.healthPercentage)}`}
              >
                {roomMetrics.healthPercentage}%
              </div>
            </div>
            <div className='text-blue-100 text-sm'>Working Assets</div>
            <div className='text-xs text-blue-200 mt-1'>
              Health:{' '}
              {roomMetrics.healthPercentage >= 95
                ? 'Excellent'
                : roomMetrics.healthPercentage >= 80
                  ? 'Good'
                  : 'Needs Attention'}
            </div>
          </div>

          <div className='bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20'>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-2xl font-bold text-red-200'>
                {roomMetrics.issuesCount}
              </div>
              {roomMetrics.criticalIssues > 0 && (
                <div className='bg-red-500/20 text-red-200 px-2 py-1 rounded-full text-xs flex items-center space-x-1'>
                  <Zap className='h-3 w-3' />
                  <span>{roomMetrics.criticalIssues}</span>
                </div>
              )}
            </div>
            <div className='text-blue-100 text-sm'>Issues</div>
            <div className='text-xs text-blue-200 mt-1'>
              {roomMetrics.criticalIssues > 0
                ? `${roomMetrics.criticalIssues} Critical`
                : 'All Clear'}
            </div>
          </div>

          <div className='bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20'>
            <div className='flex items-center justify-between mb-2'>
              <div className='text-2xl font-bold'>
                {formatCurrency(roomMetrics.totalValue)}
              </div>
              {roomMetrics.warrantyExpiring > 0 && (
                <div className='bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full text-xs flex items-center space-x-1'>
                  <Clock className='h-3 w-3' />
                  <span>{roomMetrics.warrantyExpiring}</span>
                </div>
              )}
            </div>
            <div className='text-blue-100 text-sm'>Total Value</div>
            <div className='text-xs text-blue-200 mt-1'>
              {roomMetrics.warrantyExpiring > 0
                ? `${roomMetrics.warrantyExpiring} Warranty Expiring`
                : 'All Current'}
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className='flex justify-end items-center gap-3 mt-6'>
          <Button
            variant='secondary'
            size='sm'
            className='bg-white/20 hover:bg-white/30 text-white border-white/20 transition-all duration-200'
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            title='Keyboard shortcuts (?)'
          >
            <Target className='h-4 w-4 mr-2' />
            Help
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className='bg-white rounded-lg shadow-sm mt-6 overflow-hidden'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <div className='border-b border-gray-200 bg-gray-50/50'>
            <TabsList className='w-full justify-start bg-transparent p-0 h-auto'>
              <TabsTrigger
                value='assets'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4 font-medium transition-all duration-200 hover:bg-white/80'
              >
                <Package className='h-4 w-4 mr-2' />
                Assets
              </TabsTrigger>
              <TabsTrigger
                value='acquisition'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4 font-medium transition-all duration-200 hover:bg-white/80'
              >
                <ShoppingCart className='h-4 w-4 mr-2' />
                Acquisition
              </TabsTrigger>
              <TabsTrigger
                value='damaged'
                className='rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4 font-medium transition-all duration-200 hover:bg-white/80'
              >
                <AlertTriangle className='h-4 w-4 mr-2' />
                Damaged/Repairs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className='p-6'>
            <TabsContent value='assets' className='mt-0'>
              <AssetsTab
                room={roomWithMockData}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                onAssetUpdate={onAssetUpdate}
                onNotification={addNotification}
                onSearchChange={setSearchQuery}
                onStatusFilterChange={setStatusFilter}
                onOpenAddAsset={() => setIsAddAssetModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value='acquisition' className='mt-0'>
              <AcquisitionTab
                room={roomWithMockData}
                onNotification={addNotification}
                onOpenRecordAcquisition={() =>
                  setIsRecordAcquisitionModalOpen(true)
                }
                onOpenImportCSV={() => setIsImportCSVModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value='damaged' className='mt-0'>
              <DamagedRepairsTab
                room={roomWithMockData}
                onNotification={addNotification}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Modals */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={() => {
          setIsAddAssetModalOpen(false);
          if (onAssetUpdate) onAssetUpdate();
        }}
        targetRoomId={roomWithMockData.id}
      />

      <React.Suspense fallback={<div>Loading...</div>}>
        <RecordAcquisitionModal
          isOpen={isRecordAcquisitionModalOpen}
          onClose={() => setIsRecordAcquisitionModalOpen(false)}
          onSuccess={() => {
            setIsRecordAcquisitionModalOpen(false);
            if (onAssetUpdate) onAssetUpdate();
          }}
          roomId={room.id}
        />
      </React.Suspense>

      <ImportCSVModal
        isOpen={isImportCSVModalOpen}
        onClose={() => setIsImportCSVModalOpen(false)}
        onSuccess={() => {
          setIsImportCSVModalOpen(false);
          if (onAssetUpdate) onAssetUpdate();
        }}
        roomId={room.id}
      />
    </div>
  );
};

export default RoomDetailPage;
