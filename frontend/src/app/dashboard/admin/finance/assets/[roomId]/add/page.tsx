'use client';

import React, { useEffect, useState } from 'react';
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
import { Loader2, Layers, ChevronLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { expenseCategories } from '@/constants/expenseCategories';

export default function AddAssetPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = String(params?.roomId ?? '');

  const [loading, setLoading] = useState(true);
  const [roomNo, setRoomNo] = useState<string>('');

  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [assetUnits, setAssetUnits] = useState<
    Array<{
      id: string;
      serialNumber: string;
      tagNumber: string;
    }>
  >([{ id: '1', serialNumber: '', tagNumber: '' }]);

  useEffect(() => {
    let mounted = true;
    async function loadRoom() {
      setLoading(true);
      try {
        const res = await roomService.getRoomById(roomId);
        if (mounted && res.success && res.data) {
          setRoomNo(res.data.roomNo);
        }
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

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    const currentUnits = [...assetUnits];

    if (newQuantity > currentUnits.length) {
      // Add more units
      for (let i = currentUnits.length; i < newQuantity; i++) {
        currentUnits.push({
          id: String(i + 1),
          serialNumber: '',
          tagNumber: '',
        });
      }
    } else if (newQuantity < currentUnits.length) {
      // Remove excess units
      currentUnits.splice(newQuantity);
    }

    setAssetUnits(currentUnits);
  };

  const handleUnitChange = (
    unitId: string,
    field: 'serialNumber' | 'tagNumber',
    value: string,
  ) => {
    setAssetUnits(prev =>
      prev.map(unit =>
        unit.id === unitId ? { ...unit, [field]: value } : unit,
      ),
    );
  };

  const generateSerialNumbers = () => {
    setAssetUnits(prev =>
      prev.map(unit => ({
        ...unit,
        serialNumber:
          unit.serialNumber ||
          `SN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        tagNumber:
          unit.tagNumber ||
          `TAG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all units have serial numbers
    const emptySerials = assetUnits.filter(unit => !unit.serialNumber.trim());
    if (emptySerials.length > 0) {
      toast.error('Please provide serial numbers for all units');
      return;
    }

    // Check for duplicate serial numbers
    const serialNumbers = assetUnits.map(unit => unit.serialNumber.trim());
    const duplicates = serialNumbers.filter(
      (serial, index) => serialNumbers.indexOf(serial) !== index,
    );
    if (duplicates.length > 0) {
      toast.error('Serial numbers must be unique');
      return;
    }

    toast.success('Asset added', {
      description: `${assetName} with ${quantity} units added to room ${roomNo}`,
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
    <div className='max-w-3xl mx-auto space-y-6'>
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
            <Layers className='h-6 w-6 text-blue-600' /> Add Asset
          </h1>
          <p className='text-gray-600'>Create a new asset for this room.</p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-sm text-gray-600'>Room</span>
        <span className='px-2 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200'>
          {roomNo}
        </span>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <h2 className='text-lg font-semibold'>Asset Details</h2>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='assetName'>Asset Name</Label>
                <Input
                  id='assetName'
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  required
                  placeholder='e.g., Projector'
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='quantity'>Quantity</Label>
                <Input
                  id='quantity'
                  type='number'
                  min={1}
                  value={quantity}
                  onChange={e => handleQuantityChange(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor='purchaseDate'>Purchase Date</Label>
                <Input
                  id='purchaseDate'
                  type='date'
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='condition'>Condition</Label>
                <Input
                  id='condition'
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  placeholder='e.g., Good / Needs repair'
                />
              </div>
              <div>
                <Label>Room</Label>
                <Input value={roomNo} readOnly />
              </div>
            </div>
            <div>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder='Optional notes'
                rows={4}
              />
            </div>

            {/* Individual Asset Units */}
            <div className='space-y-3 border border-gray-200 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-md font-semibold text-gray-900'>
                  Individual Asset Units ({assetUnits.length})
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={generateSerialNumbers}
                  className='text-xs'
                >
                  Auto-generate
                </Button>
              </div>
              <p className='text-xs text-gray-500 mb-3'>
                Enter serial numbers and tag numbers for each physical unit
              </p>

              <div className='space-y-3 max-h-60 overflow-y-auto'>
                {assetUnits.map((unit, index) => (
                  <div
                    key={unit.id}
                    className='grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50'
                  >
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>
                        Unit {index + 1} - Serial Number{' '}
                        <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        value={unit.serialNumber}
                        onChange={e =>
                          handleUnitChange(
                            unit.id,
                            'serialNumber',
                            e.target.value,
                          )
                        }
                        placeholder={`e.g., SN${String(index + 1).padStart(3, '0')}`}
                        className='text-sm h-9'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>
                        Unit {index + 1} - Tag Number
                      </label>
                      <Input
                        value={unit.tagNumber}
                        onChange={e =>
                          handleUnitChange(unit.id, 'tagNumber', e.target.value)
                        }
                        placeholder={`e.g., TAG-${String(index + 1).padStart(3, '0')}`}
                        className='text-sm h-9'
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex items-center justify-between bg-gray-50 rounded-b-xl'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit'>Save Asset</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
