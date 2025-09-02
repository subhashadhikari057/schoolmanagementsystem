'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { roomService } from '@/api/services/room.service';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Layers, ChevronLeft, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { expenseCategories } from '@/constants/expenseCategories';

type Asset = {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  condition?: string;
  notes?: string;
};

export default function EditRoomAssetsPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = String(params?.roomId ?? '');

  const [loading, setLoading] = useState(true);
  const [roomNo, setRoomNo] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);

  const categoryMap = useMemo(
    () => Object.fromEntries(expenseCategories.map(c => [c.value, c.label])),
    [],
  );

  useEffect(() => {
    let mounted = true;
    async function loadRoom() {
      setLoading(true);
      try {
        const res = await roomService.getRoomById(roomId);
        if (mounted && res.success && res.data) {
          setRoomNo(res.data.roomNo);
        }
        // TODO: integrate assets fetch by room when API/service is available
        if (mounted) setAssets([]);
      } catch (e) {
        toast.error('Failed to load room details');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (roomId) loadRoom();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const handleAssetChange = (
    id: string,
    key: keyof Asset,
    value: string | number,
  ) => {
    setAssets(prev =>
      prev.map(a => (a.id === id ? { ...a, [key]: value } : a)),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Assets updated', {
      description: `Assets for room ${roomNo} have been updated`,
    });
    router.push('/dashboard/admin/finance/expenses');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin text-gray-500' />
        <span className='ml-2 text-gray-600'>Loading room...</span>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.back()}
          className='shrink-0'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Layers className='h-6 w-6 text-blue-600' /> Edit Room Assets
          </h1>
          <p className='text-gray-600'>
            Update details of existing assets in this room.
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-sm text-gray-600'>Room</span>
        <span className='px-2 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200'>
          {roomNo}
        </span>
      </div>

      <Card className='shadow-sm'>
        <form onSubmit={handleSave}>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold'>Assets</h2>
                <p className='text-sm text-gray-500'>
                  Only edits are allowed here.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            {assets.length === 0 ? (
              <div className='text-center py-10 border rounded-lg bg-gray-50'>
                <Tag className='h-8 w-8 mx-auto text-gray-400' />
                <p className='mt-2 text-gray-600'>
                  No assets found for this room.
                </p>
                <p className='text-sm text-gray-500'>
                  Use the Add Asset button from the previous page to create one.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-4'>
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    className='rounded-xl border p-4 shadow-sm bg-white'
                  >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={asset.name}
                          onChange={e =>
                            handleAssetChange(asset.id, 'name', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={asset.category ?? ''}
                          onValueChange={val =>
                            handleAssetChange(asset.id, 'category', val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select a category' />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type='number'
                          min={0}
                          value={asset.quantity}
                          onChange={e =>
                            handleAssetChange(
                              asset.id,
                              'quantity',
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className='md:col-span-2'>
                        <Label>Condition</Label>
                        <Input
                          value={asset.condition ?? ''}
                          onChange={e =>
                            handleAssetChange(
                              asset.id,
                              'condition',
                              e.target.value,
                            )
                          }
                          placeholder='e.g., Good, Needs repair'
                        />
                      </div>
                    </div>
                    <div className='mt-4'>
                      <Label>Notes</Label>
                      <Textarea
                        rows={3}
                        value={asset.notes ?? ''}
                        onChange={e =>
                          handleAssetChange(asset.id, 'notes', e.target.value)
                        }
                      />
                    </div>
                    <div className='mt-3 text-xs text-gray-500'>
                      Selected category:{' '}
                      {asset.category ? categoryMap[asset.category] : 'None'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className='flex items-center justify-between bg-gray-50 rounded-b-xl'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button type='submit' disabled={assets.length === 0}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
