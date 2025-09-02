'use client';

import React, { useState } from 'react';
import { X, Plus, Building2, MapPin, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Room } from '@/types/asset.types';
import { roomService, CreateRoomRequest } from '@/api/services/room.service';

interface RoomCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: Room) => void;
}

interface RoomFormData {
  roomNo: string;
  name: string;
  floor: number;
  building: string;
  capacity: number;
  type: string;
}

const RoomCreateModal: React.FC<RoomCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<RoomFormData>({
    roomNo: '',
    name: '',
    floor: 1,
    building: 'Main Building',
    capacity: 30,
    type: 'Classroom',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'floor' || name === 'capacity' ? parseInt(value) || 0 : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.roomNo.trim()) {
      setError('Room number is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }
    if (!formData.building.trim()) {
      setError('Building is required');
      return;
    }
    if (formData.floor < 1) {
      setError('Floor must be at least 1');
      return;
    }
    if (formData.capacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Creating room...', {
      description: `Adding Room ${formData.roomNo}`,
    });

    try {
      const payload: CreateRoomRequest = {
        roomNo: formData.roomNo.trim(),
        name: formData.name.trim() || undefined,
        floor: formData.floor,
        building: formData.building.trim() || undefined,
        capacity: formData.capacity,
        isAvailable: true,
      };

      const response = await roomService.createRoom(payload);

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'Failed to create room');
      }

      const created = response.data;

      const newRoom: Room = {
        id: created.id,
        roomNo: created.roomNo,
        name: created.name,
        floor: created.floor,
        building: created.building,
        capacity: created.capacity ?? formData.capacity,
        type: 'Classroom',
        assets: [],
        totalAssets: 0,
        totalDamaged: 0,
        totalValue: 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt ?? created.createdAt,
      };

      toast.dismiss(loadingToast);
      toast.success('Room created successfully!', {
        description: `Room ${created.roomNo} has been added to ${created.building || formData.building}`,
        duration: 5000,
      });

      setFormData({
        roomNo: '',
        name: '',
        floor: 1,
        building: 'Main Building',
        capacity: 30,
        type: 'Classroom',
      });

      onSuccess(newRoom);
      onClose();
    } catch (err: any) {
      console.error('Error creating room:', err);
      toast.dismiss(loadingToast);
      const errorMessage =
        err?.message || 'Failed to create room. Please try again.';
      toast.error('Failed to create room', {
        description: errorMessage,
        duration: 6000,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        roomNo: '',
        name: '',
        floor: 1,
        building: 'Main Building',
        capacity: 30,
        type: 'Classroom',
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={handleClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                <Building2 size={22} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  Create New Room
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  Add a new room to your asset management system
                </p>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
              disabled={isLoading}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className='p-6'
          onClick={e => e.stopPropagation()}
        >
          <div className='space-y-5'>
            {/* Room Number and Name */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label
                  htmlFor='roomNo'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Room Number <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='roomNo'
                  name='roomNo'
                  value={formData.roomNo}
                  onChange={handleInputChange}
                  placeholder='e.g., 101'
                  disabled={isLoading}
                  className='w-full text-base h-12 rounded-lg'
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='name'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Room Name <span className='text-red-500'>*</span>
                </label>
                <Input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='e.g., Computer Lab A'
                  disabled={isLoading}
                  className='w-full text-base h-12 rounded-lg'
                />
              </div>
            </div>

            {/* Building and Floor */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label
                  htmlFor='building'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Building <span className='text-red-500'>*</span>
                </label>
                <select
                  id='building'
                  name='building'
                  value={formData.building}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900'
                >
                  <option value='Main Building'>Main Building</option>
                  <option value='Science Building'>Science Building</option>
                  <option value='Academic Building'>Academic Building</option>
                  <option value='Sports Complex'>Sports Complex</option>
                  <option value='Library Building'>Library Building</option>
                </select>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='floor'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Floor <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='number'
                  id='floor'
                  name='floor'
                  value={formData.floor}
                  onChange={handleInputChange}
                  min='1'
                  max='10'
                  disabled={isLoading}
                  className='w-full text-base h-12 rounded-lg'
                />
              </div>
            </div>

            {/* Room Type and Capacity */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label
                  htmlFor='type'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Room Type
                </label>
                <select
                  id='type'
                  name='type'
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-900'
                >
                  <option value='Classroom'>Classroom</option>
                  <option value='Laboratory'>Laboratory</option>
                  <option value='Office'>Office</option>
                  <option value='Library'>Library</option>
                  <option value='Study Area'>Study Area</option>
                  <option value='Conference Room'>Conference Room</option>
                  <option value='Storage'>Storage</option>
                  <option value='Other'>Other</option>
                </select>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='capacity'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Capacity <span className='text-red-500'>*</span>
                </label>
                <Input
                  type='number'
                  id='capacity'
                  name='capacity'
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min='1'
                  placeholder='30'
                  disabled={isLoading}
                  className='w-full text-base h-12 rounded-lg'
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 animate-in slide-in-from-top-2'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <p className='text-sm text-red-700 font-medium'>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100'>
            <Button
              type='button'
              variant='outline'
              onClick={e => {
                e.stopPropagation();
                handleClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={
                isLoading ||
                !formData.roomNo.trim() ||
                !formData.name.trim() ||
                !formData.building.trim() ||
                formData.floor < 1 ||
                formData.capacity < 1
              }
              className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2'></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} className='mr-2' />
                  Create Room
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomCreateModal;
