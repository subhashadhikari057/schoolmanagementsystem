'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Select, {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AssetItem } from '@/types/asset.types';

interface MoveAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // return moved item info so parent can update local state
  onSuccess: (movedItem?: any) => void;
  item: AssetItem | null;
}

const MoveAssetModal: React.FC<MoveAssetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
}) => {
  const [targetRoom, setTargetRoom] = useState('');
  if (!isOpen || !item) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4 flex items-center justify-center'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md p-6'>
        <div className='mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>Move Asset</h2>
              <p className='text-sm text-gray-500'>
                Move the selected asset to a different room
              </p>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 rounded'
            >
              <X />
            </button>
          </div>
        </div>

        <div className='rounded-lg bg-gray-50 p-4 mb-4 border border-gray-100'>
          <div className='font-medium text-gray-900'>{item.serialNumber}</div>
          <div className='text-sm text-gray-500'>
            Currently in: {item.assignedTo?.name || 'Unknown'}
          </div>
        </div>

        <div className='mb-6'>
          <Label>Move to Room</Label>
          <Select value={targetRoom} onValueChange={v => setTargetRoom(v)}>
            <SelectTrigger className='mt-1 h-12 rounded-lg text-base border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300'>
              <SelectValue placeholder='Select destination room' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Select destination room</SelectItem>
              <SelectItem value='1'>Room 101 - Computer Lab A</SelectItem>
              <SelectItem value='2'>Room 102 - Science Lab</SelectItem>
              <SelectItem value='3'>Room 201 - Library</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center justify-end space-x-3 border-t pt-4'>
          <Button
            variant='outline'
            onClick={onClose}
            className='border-gray-200'
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!targetRoom || !item) return;
              // frontend-only move: return moved item info (simulate new assignment)
              const movedItem = {
                ...item,
                assignedTo: {
                  type: 'room',
                  id: targetRoom,
                  name: `Room ${targetRoom}`,
                },
                updatedAt: new Date().toISOString(),
              };
              onSuccess(movedItem);
              onClose();
            }}
            disabled={!targetRoom}
            className='bg-gradient-to-r from-slate-900 to-black text-white'
          >
            Move Asset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoveAssetModal;
