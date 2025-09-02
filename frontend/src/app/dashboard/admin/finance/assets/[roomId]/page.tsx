'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoomDetailPage from '@/components/organisms/finance/RoomDetailPage';
import { roomService } from '@/api/services/room.service';
import type { Room } from '@/types/asset.types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomDetailPageWrapper() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params?.roomId ?? '');

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await roomService.getRoomById(roomId);
        if (mounted && res.success && res.data) {
          const d: any = res.data;
          setRoom({
            id: d.id || roomId,
            roomNo: d.roomNo || d.roomNo || '',
            name: d.name || d.roomName || '',
            floor: d.floor ?? 1,
            building: d.building || d.buildingName || '',
            capacity: d.capacity ?? 0,
            type: (d.type as any) || 'Classroom',
            assets: (d.assets as any) || [],
            totalAssets: d.totalAssets ?? (d.assets ? d.assets.length : 0) ?? 0,
            totalDamaged: d.totalDamaged ?? 0,
            totalValue: d.totalValue ?? 0,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
          });
        } else {
          // fallback: show basic room info
          setRoom({
            id: roomId,
            roomNo: roomId,
            name: 'Room',
            floor: 1,
            building: 'Main Building',
            capacity: 0,
            type: 'Classroom',
            assets: [],
            totalAssets: 0,
            totalDamaged: 0,
            totalValue: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load room details');
        setRoom(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (roomId) load();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin text-gray-500' />
        <span className='ml-2 text-gray-600'>Loading room...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className='p-8 text-center'>
        <h3 className='text-lg font-medium'>Room not found</h3>
        <p className='text-sm text-gray-500 mt-2'>
          Try returning to the rooms list.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full py-6 px-4'>
      <RoomDetailPage
        room={room}
        onAssetUpdate={() => {
          /* optional reload */
        }}
      />
    </div>
  );
}
