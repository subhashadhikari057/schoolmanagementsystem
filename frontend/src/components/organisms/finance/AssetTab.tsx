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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import type { Room, AssetSearchFilters } from '@/types/asset.types';
import { GraduationCap, Users, Trash2 } from 'lucide-react';

// Import modals
import RoomCreateModal from '@/components/organisms/finance/modals/RoomCreateModal';
import AddAssetModal from './modals/AddAssetModal';
import ImportCSVModal from './modals/ImportCSVModal';
// Room detail will live on its own page now

const AssetTab: React.FC = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<AssetSearchFilters>({});
  // Local UI filters (building/floor) for client-side filtering only
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isImportCSVModalOpen, setIsImportCSVModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deletingRoomIds, setDeletingRoomIds] = useState<Set<string>>(
    new Set(),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomPendingDelete, setRoomPendingDelete] = useState<Room | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        room =>
          room.roomNo.toLowerCase().includes(q) ||
          room.name?.toLowerCase().includes(q) ||
          room.building?.toLowerCase().includes(q),
      );
    }

    // Building filter
    if (selectedBuilding) {
      filtered = filtered.filter(
        r =>
          (r.building || '').toLowerCase() === selectedBuilding.toLowerCase(),
      );
    }

    // Floor filter
    if (selectedFloor) {
      const floorNum = parseInt(selectedFloor, 10);
      if (!Number.isNaN(floorNum)) {
        filtered = filtered.filter(r => Number(r.floor) === floorNum);
      }
    }

    setFilteredRooms(filtered);
  }, [rooms, searchQuery, filters, selectedBuilding, selectedFloor]);

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
        // Map basic rooms
        let roomsData: Room[] = roomResp.data.rooms.map(r => ({
          id: String(r.id),
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

        // Also fetch classes to annotate assigned classes per room
        try {
          const clsResp = await classService.getAllClasses();
          if (clsResp.success && clsResp.data) {
            const byRoom = new Map<
              string,
              Array<{
                id: string;
                name?: string;
                grade: number;
                section: string;
                shift: 'morning' | 'day';
                currentEnrollment?: number;
              }>
            >();
            for (const c of clsResp.data) {
              if (!c.roomId) continue;
              const key = String(c.roomId);
              const arr = byRoom.get(key) || [];
              arr.push({
                id: c.id,
                name: c.name,
                grade: c.grade,
                section: c.section,
                shift: c.shift,
                currentEnrollment: c.currentEnrollment,
              });
              byRoom.set(key, arr);
            }
            roomsData = roomsData.map(r => ({
              ...r,
              assignedClasses: (byRoom.get(String(r.id)) || []).sort(
                (a, b) =>
                  a.grade - b.grade || a.section.localeCompare(b.section),
              ),
            }));
          }
        } catch (e) {
          // ignore class fetch errors for now; rooms still render
        }
        setRooms(roomsData);
        return;
      }

      // Fallback: if room list endpoint isn't available, use classService to
      // derive rooms from classes (this only returns rooms attached to classes).
      const clsResp = await classService.getAllClasses();
      if (clsResp.success && clsResp.data) {
        // Group classes by roomId to form rooms with aggregated assignedClasses
        const grouped = new Map<
          string,
          {
            base: Omit<
              Room,
              | 'assets'
              | 'totalAssets'
              | 'totalDamaged'
              | 'totalValue'
              | 'createdAt'
              | 'updatedAt'
              | 'assignedClasses'
            > & {
              assets: [];
              totalAssets: number;
              totalDamaged: number;
              totalValue: number;
              createdAt: string;
              updatedAt: string;
            };
            classes: Array<{
              id: string;
              name?: string;
              grade: number;
              section: string;
              shift: 'morning' | 'day';
              currentEnrollment?: number;
            }>;
          }
        >();

        for (const cls of clsResp.data) {
          if (!cls.room) continue;
          const key = String(cls.roomId);
          if (!grouped.has(key)) {
            grouped.set(key, {
              base: {
                id: key,
                roomNo: cls.room.roomNo || '',
                name: cls.room.name,
                floor: cls.room.floor || 1,
                building: cls.room.building,
                capacity: cls.capacity,
                type: 'Classroom',
                assets: [],
                totalAssets: Math.floor(Math.random() * 30) + 5,
                totalDamaged: Math.floor(Math.random() * 3),
                totalValue: Math.floor(Math.random() * 100000) + 25000,
                createdAt: cls.createdAt,
                updatedAt: cls.updatedAt || cls.createdAt,
              },
              classes: [],
            });
          }
          grouped.get(key)!.classes.push({
            id: cls.id,
            name: cls.name,
            grade: cls.grade,
            section: cls.section,
            shift: cls.shift,
            currentEnrollment: cls.currentEnrollment,
          });
        }

        const roomsData: Room[] = Array.from(grouped.values()).map(
          ({ base, classes }) => ({
            ...base,
            assignedClasses: classes.sort(
              (a, b) => a.grade - b.grade || a.section.localeCompare(b.section),
            ),
          }),
        );

        setRooms(roomsData);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setRooms([]); // No fallback data - show empty state
      toast.error('Failed to load rooms', {
        description: 'Unable to connect to asset management service',
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

  const performDeleteRoom = async (room: Room) => {
    setDeletingRoomIds(prev => new Set(prev).add(String(room.id)));
    try {
      const res = await roomService.deleteRoom(String(room.id));
      if (res && res.success) {
        setRooms(prev => prev.filter(r => String(r.id) !== String(room.id)));
        toast.success('Room deleted');
        setDeleteDialogOpen(false);
        setRoomPendingDelete(null);
        setDeleteConfirmText('');
      } else {
        toast.error('Failed to delete room', {
          description: (res as any)?.message || 'Server rejected the request',
        });
      }
    } catch (e) {
      toast.error('Failed to delete room');
    } finally {
      setDeletingRoomIds(prev => {
        const copy = new Set(prev);
        copy.delete(String(room.id));
        return copy;
      });
      // Refresh from server to ensure counts remain accurate
      loadRooms();
    }
  };

  const openDeleteDialog = (room: Room) => {
    setRoomPendingDelete(room);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  const formatClassInfo = (c: {
    name?: string;
    grade: number;
    section: string;
    shift: 'morning' | 'day';
    currentEnrollment?: number;
  }) => {
    const shiftLabel = c.shift === 'morning' ? 'Morning' : 'Day';
    const gradeSec = `Class ${c.grade}${(c.section || '').toUpperCase()}`;
    return `${gradeSec} • ${shiftLabel}`;
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
      {/* Header Section wrapped in a white, borderless card */}
      <Card className='bg-white border-0 shadow-sm rounded-xl'>
        <CardContent className='p-4'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Asset Management
              </h1>
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
                onClick={() => setIsRoomModalOpen(true)}
                className='flex items-center space-x-2'
              >
                <Plus className='h-4 w-4' />
                <span>Add Room</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className='p-4 bg-white shadow-sm border-0 rounded-xl'>
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
                value={selectedBuilding}
                onChange={e => setSelectedBuilding(e.target.value)}
              >
                <option value=''>All Buildings</option>
                <option value='Main Building'>Main Building</option>
                <option value='Science Building'>Science Building</option>
                <option value='Academic Building'>Academic Building</option>
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
                value={selectedFloor}
                onChange={e => setSelectedFloor(e.target.value)}
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
                setSelectedBuilding('');
                setSelectedFloor('');
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
          <Button onClick={() => setIsRoomModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Create Room
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {filteredRooms.map(room => (
            <Card
              key={room.id}
              className='group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 bg-white rounded-xl overflow-hidden'
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
                      {room.assignedClasses &&
                      room.assignedClasses.length > 0 ? (
                        <div className='mt-0.5 space-y-0.5'>
                          {room.assignedClasses.map(c => (
                            <p
                              key={c.id}
                              className='text-xs text-gray-500 flex items-center'
                            >
                              <GraduationCap className='h-3.5 w-3.5 mr-1.5' />
                              {formatClassInfo(c)}
                              {typeof c.currentEnrollment === 'number' && (
                                <span className='ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-700 border border-gray-200'>
                                  <Users className='h-3 w-3' />
                                  {c.currentEnrollment}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className='text-xs text-gray-400 mt-0.5'>
                          No class assigned
                        </p>
                      )}
                    </div>
                  </div>

                  {(room.totalDamaged ?? 0) > 0 && (
                    <Badge
                      variant={getStatusBadgeVariant(
                        room.totalDamaged ?? 0,
                        room.totalAssets ?? 0,
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
                          {(room.totalAssets ?? 0) - (room.totalDamaged ?? 0)}{' '}
                          OK
                        </span>
                      </div>
                      {(room.totalDamaged ?? 0) > 0 && (
                        <div className='flex items-center'>
                          <AlertTriangle className='h-4 w-4 text-red-500 mr-1' />
                          <span className='text-gray-600'>
                            {room.totalDamaged ?? 0} Issues
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div className='pt-2 border-t border-gray-100'>
                    <p className='text-sm text-gray-600'>Total Value</p>
                    <p className='text-lg font-semibold text-gray-900'>
                      {formatCurrency(room.totalValue ?? 0)}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className='pt-0'>
                <div className='flex items-center justify-between w-full'>
                  <span className='text-sm text-gray-500'>
                    {room.totalAssets ?? 0} assets
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
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={e => {
                        e.stopPropagation();
                        openDeleteDialog(room);
                      }}
                      disabled={deletingRoomIds.has(String(room.id))}
                      className='opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700'
                      title={`Delete Room ${room.roomNo}`}
                      aria-label='Delete room'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {/* Create Room modal: matches fields used during class creation */}
      <RoomCreateModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onSuccess={room => {
          setRooms(prev => [room, ...prev]);
          setFilteredRooms(prev => [room, ...prev]);
          toast.success('Room added');
          setIsRoomModalOpen(false);
          // Sync with server to refresh derived counts if needed
          loadRooms();
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
        roomId={selectedRoom?.id || rooms[0]?.id || ''}
        onClose={() => setIsImportCSVModalOpen(false)}
        onSuccess={() => {
          setIsImportCSVModalOpen(false);
          loadRooms();
        }}
      />

      {/* Room detail moved to its own page. Drawer removed in favor of dedicated route. */}

      {/* Delete Room Confirm Dialog (GitHub-style) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roomPendingDelete
                ? `Delete Room ${roomPendingDelete.roomNo}${roomPendingDelete.name ? ` - ${roomPendingDelete.name}` : ''}?`
                : 'Delete Room'}
            </DialogTitle>
            <DialogDescription>
              {roomPendingDelete && (
                <>
                  <span className='block'>
                    {[
                      roomPendingDelete.building,
                      roomPendingDelete.floor
                        ? `Floor ${roomPendingDelete.floor}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </span>
                  {roomPendingDelete.assignedClasses &&
                  roomPendingDelete.assignedClasses.length > 0 ? (
                    <span className='mt-1 block text-red-600'>
                      This room has {roomPendingDelete.assignedClasses.length}{' '}
                      assigned class(es).
                    </span>
                  ) : null}
                  <span className='mt-2 block'>
                    This action cannot be undone. Please type
                    <span className='mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800'>
                      {`Room ${roomPendingDelete.roomNo}`}
                    </span>
                    to confirm deletion.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Input
              placeholder={
                roomPendingDelete
                  ? `Type: Room ${roomPendingDelete.roomNo}`
                  : 'Type room label'
              }
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setDeleteDialogOpen(false);
                setRoomPendingDelete(null);
                setDeleteConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={
                !roomPendingDelete ||
                deleteConfirmText.trim() !==
                  `Room ${roomPendingDelete.roomNo}` ||
                deletingRoomIds.has(String(roomPendingDelete?.id || ''))
              }
              onClick={() =>
                roomPendingDelete && performDeleteRoom(roomPendingDelete)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetTab;
