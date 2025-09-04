'use client';

import React, { useState, useEffect } from 'react';
import { classService } from '@/api/services/class.service';
import { roomService } from '@/api/services/room.service';
import {
  Loader2,
  Plus,
  Search,
  QrCode,
  Upload,
  Building2,
  Package,
  AlertTriangle,
  Wrench,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import type { Room, AssetSearchFilters } from '@/types/asset.types';

// Import modals
import ClassFormModal from '@/components/organisms/modals/ClassFormModal';
import AddAssetModal from './modals/AddAssetModal';
import ImportCSVModal from './modals/ImportCSVModal';
// Room detail will live on its own page now

// Mock data for demonstration
const mockRooms: Room[] = [
  {
    id: '1',
    roomNo: '101',
    name: 'Computer Lab A',
    floor: 1,
    building: 'Main Building',
    capacity: 30,
    type: 'Laboratory',
    assets: [],
    totalAssets: 25,
    totalDamaged: 2,
    totalValue: 125000,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
  },
  {
    id: '2',
    roomNo: '102',
    name: 'Science Lab',
    floor: 1,
    building: 'Science Building',
    capacity: 25,
    type: 'Laboratory',
    assets: [],
    totalAssets: 15,
    totalDamaged: 1,
    totalValue: 85000,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
  },
  {
    id: '3',
    roomNo: '201',
    name: 'Library',
    floor: 2,
    building: 'Main Building',
    capacity: 100,
    type: 'Study Area',
    assets: [],
    totalAssets: 50,
    totalDamaged: 0,
    totalValue: 75000,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
  },
  {
    id: '4',
    roomNo: '301',
    name: 'Classroom 101',
    floor: 3,
    building: 'Academic Building',
    capacity: 35,
    type: 'Classroom',
    assets: [],
    totalAssets: 20,
    totalDamaged: 1,
    totalValue: 45000,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-09-01T10:30:00Z',
  },
];

const AssetTab: React.FC = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(mockRooms);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<AssetSearchFilters>({});

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isImportCSVModalOpen, setIsImportCSVModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = rooms;

    if (searchQuery) {
      filtered = filtered.filter(
        room =>
          room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.building?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredRooms(filtered);
  }, [rooms, searchQuery, filters]);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer fetching rooms directly - this returns all rooms, including those
      // created via the room API (not only rooms attached to classes).
      const roomResp = await roomService.getAllRooms();
      if (
        roomResp &&
        roomResp.success &&
        roomResp.data &&
        roomResp.data.rooms
      ) {
        const roomsData: Room[] = roomResp.data.rooms.map(r => ({
          id: r.id,
          roomNo: r.roomNo,
          name: r.name,
          floor: r.floor || 1,
          building: r.building,
          capacity: r.capacity ?? 0,
          type: 'Classroom',
          assets: [],
          totalAssets: 0,
          totalDamaged: 0,
          totalValue: 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt ?? r.createdAt,
        }));
        setRooms(roomsData.length > 0 ? roomsData : mockRooms);
        return;
      }

      // Fallback: if room list endpoint isn't available, use classService to
      // derive rooms from classes (this only returns rooms attached to classes).
      const clsResp = await classService.getAllClasses();
      if (clsResp.success && clsResp.data) {
        const roomsData: Room[] = clsResp.data
          .filter(cls => cls.room)
          .map(cls => ({
            id: cls.roomId,
            roomNo: cls.room?.roomNo || '',
            name: cls.room?.name,
            floor: cls.room?.floor || 1,
            building: cls.room?.building,
            capacity: cls.capacity,
            type: 'Classroom',
            assets: [],
            totalAssets: Math.floor(Math.random() * 30) + 5,
            totalDamaged: Math.floor(Math.random() * 3),
            totalValue: Math.floor(Math.random() * 100000) + 25000,
            createdAt: cls.createdAt,
            updatedAt: cls.updatedAt || cls.createdAt,
          }));
        setRooms(roomsData.length > 0 ? roomsData : mockRooms);
      } else {
        setRooms(mockRooms);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms(mockRooms); // Fallback to mock data
      toast.error('Using demo data', {
        description: 'Connected to demo asset data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleRoomClick = (room: Room) => {
    // Navigate to the dedicated room page
    router.push(`/dashboard/admin/finance/assets/${room.id}`);
  };

  const getStatusBadgeVariant = (count: number, total: number) => {
    if (count === 0) return 'default';
    const percentage = (count / total) * 100;
    if (percentage < 10) return 'secondary';
    if (percentage < 25) return 'outline';
    return 'destructive';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center p-12'>
        <Loader2 className='h-12 w-12 animate-spin text-blue-500 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Loading Asset Management
        </h3>
        <p className='text-sm text-gray-500 text-center'>
          Please wait while we load your rooms and assets...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8 text-center'>
        <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4'>
          <AlertTriangle className='h-8 w-8 text-red-600' />
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Error Loading Assets
        </h3>
        <p className='text-sm text-gray-500 mb-4'>{error}</p>
        <Button onClick={loadRooms}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Asset Management</h1>
          <p className='text-sm text-gray-600 mt-1'>
            Manage rooms and assets across your school
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          {/* Global Search */}
          <div className='relative flex-1 min-w-0 lg:w-80'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Search assets...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* QR Scan Button (mobile only) */}
          {isMobile && (
            <Button
              variant='outline'
              size='sm'
              className='flex items-center space-x-2'
            >
              <QrCode className='h-4 w-4' />
              <span>Scan QR</span>
            </Button>
          )}

          {/* Action Buttons */}
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsImportCSVModalOpen(true)}
            className='flex items-center space-x-2'
          >
            <Upload className='h-4 w-4' />
            <span>Import CSV</span>
          </Button>

          <Button
            onClick={() => setIsClassModalOpen(true)}
            className='flex items-center space-x-2'
          >
            <Plus className='h-4 w-4' />
            <span>Add Room</span>
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className='p-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <h3 className='font-medium text-gray-900'>Filters</h3>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center space-x-2'>
              <label
                htmlFor='building'
                className='text-sm font-medium text-gray-700'
              >
                Building
              </label>
              <select
                id='building'
                className='text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                onChange={e =>
                  setFilters({
                    ...filters,
                    roomId: e.target.value || undefined,
                  })
                }
              >
                <option value=''>All Buildings</option>
                <option value='main'>Main Building</option>
                <option value='science'>Science Building</option>
                <option value='academic'>Academic Building</option>
              </select>
            </div>

            <div className='flex items-center space-x-2'>
              <label
                htmlFor='floor'
                className='text-sm font-medium text-gray-700'
              >
                Floor
              </label>
              <select
                id='floor'
                className='text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>All Floors</option>
                <option value='1'>1st Floor</option>
                <option value='2'>2nd Floor</option>
                <option value='3'>3rd Floor</option>
              </select>
            </div>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearchQuery('');
                setFilters({});
              }}
              className='text-gray-600 hover:text-gray-900'
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className='text-center py-12'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4'>
            <Building2 className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No rooms found
          </h3>
          <p className='text-sm text-gray-500 mb-6'>
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Get started by creating your first room.'}
          </p>
          <Button onClick={() => setIsClassModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Create Room
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {filteredRooms.map(room => (
            <Card
              key={room.id}
              className='group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border border-gray-200 bg-white rounded-xl overflow-hidden'
              onClick={() => handleRoomClick(room)}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors'>
                      <Package className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                        Room {room.roomNo}
                      </h3>
                      {room.name && (
                        <p className='text-sm text-gray-600'>{room.name}</p>
                      )}
                    </div>
                  </div>

                  {room.totalDamaged > 0 && (
                    <Badge
                      variant={getStatusBadgeVariant(
                        room.totalDamaged,
                        room.totalAssets,
                      )}
                    >
                      {room.totalDamaged}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className='pt-0'>
                <div className='space-y-3'>
                  {/* Location Info */}
                  <div className='flex items-center text-sm text-gray-600'>
                    <Building2 className='h-4 w-4 mr-2' />
                    <span>{room.building || 'Main Building'}</span>
                    <span className='mx-2'>•</span>
                    <span>Floor {room.floor}</span>
                  </div>

                  {/* Asset Summary */}
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center space-x-4'>
                      <div className='flex items-center'>
                        <CheckCircle className='h-4 w-4 text-green-500 mr-1' />
                        <span className='text-gray-600'>
                          {room.totalAssets - room.totalDamaged} OK
                        </span>
                      </div>
                      {room.totalDamaged > 0 && (
                        <div className='flex items-center'>
                          <AlertTriangle className='h-4 w-4 text-red-500 mr-1' />
                          <span className='text-gray-600'>
                            {room.totalDamaged} Issues
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div className='pt-2 border-t border-gray-100'>
                    <p className='text-sm text-gray-600'>Total Value</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {formatCurrency(room.totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='pt-0'>
                <div className='flex items-center justify-between w-full'>
                  <span className='text-sm text-gray-500'>
                    {room.totalAssets} assets
                  </span>
                  <div className='flex items-center space-x-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={e => {
                        e.stopPropagation();
                        // pre-select room so AddAssetModal knows the target
                        setSelectedRoom(room);
                        setIsAddAssetModalOpen(true);
                      }}
                      className='opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <Plus className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={e => {
                        e.stopPropagation();
                        // navigate to the room page
                        router.push(
                          `/dashboard/admin/finance/assets/${room.id}`,
                        );
                      }}
                      className='opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modals & Drawer (wired) */}
      {/* Use ClassFormModal's Create Room (step 2) so create flow matches admin class flow */}
      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSuccess={() => {
          setIsClassModalOpen(false);
          loadRooms();
        }}
        initialStep={2}
        initialRoomOption={'new'}
        onRoomCreated={room => {
          // Convert AvailableRoom to Room format for AssetTab
          const assetRoom: Room = {
            id: room.id,
            roomNo: room.roomNo,
            name: room.name,
            floor: room.floor,
            building: room.building,
            capacity: room.capacity,
            type: 'classroom',
            assets: [],
            totalAssets: 0,
            totalDamaged: 0,
            totalValue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setRooms(prev => [assetRoom, ...prev]);
          setFilteredRooms(prev => [assetRoom, ...prev]);
          toast.success('Room added');
          setIsClassModalOpen(false);
        }}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={() => {
          setIsAddAssetModalOpen(false);
          // reload or refresh counts - keep demo: reload rooms
          loadRooms();
        }}
        targetRoomId={selectedRoom?.id}
      />

      <ImportCSVModal
        isOpen={isImportCSVModalOpen}
        onClose={() => setIsImportCSVModalOpen(false)}
        onSuccess={() => {
          setIsImportCSVModalOpen(false);
          loadRooms();
        }}
      />

      {/* Room detail moved to its own page. Drawer removed in favor of dedicated route. */}
    </div>
  );
};

export default AssetTab;
