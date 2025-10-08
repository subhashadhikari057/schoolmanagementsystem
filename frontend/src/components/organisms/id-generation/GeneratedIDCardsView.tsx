'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { showConfirmation } from '@/utils/confirmation-toast';
import {
  idCardApiService,
  IDCardListItem,
  IDCardListResponse,
} from '@/services/id-card.service';

interface GeneratedIDCardsViewProps {
  onViewCard?: (cardId: string) => void;
}

export default function GeneratedIDCardsView({
  onViewCard,
}: GeneratedIDCardsViewProps) {
  const [loading, setLoading] = useState(true);
  const [idCards, setIdCards] = useState<IDCardListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchIDCards = async () => {
    try {
      setLoading(true);
      const response: IDCardListResponse =
        await idCardApiService.getAllIDCards({
          page,
          limit: 12,
          search: search || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          isActive:
            statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        });

      setIdCards(response.idCards);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching ID cards:', error);
      toast.error('Failed to load ID cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIDCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchIDCards();
  };

  const handleDelete = async (idCard: IDCardListItem) => {
    showConfirmation({
      title: 'Delete ID Card',
      message: `Are you sure you want to delete the ID card for ${idCard.issuedFor.fullName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await idCardApiService.deleteIDCard(idCard.id);
          toast.success('ID card deleted successfully');
          fetchIDCards();
        } catch (error: unknown) {
          const errorMessage =
            (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
            (error as { message?: string })?.message ||
            'Failed to delete ID card';
          toast.error(errorMessage);
        }
      },
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'STUDENT':
        return 'bg-blue-100 text-blue-800';
      case 'TEACHER':
        return 'bg-green-100 text-green-800';
      case 'STAFF':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header with Filters */}
      <div className='bg-white p-4 rounded-lg shadow space-y-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900'>
            Generated ID Cards
          </h2>
          <p className='text-sm text-gray-600'>
            View and manage all generated ID cards
          </p>
        </div>

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='md:col-span-2'>
            <div className='flex gap-2'>
              <Input
                placeholder='Search by name or email...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className='flex-1'
              />
              <Button onClick={handleSearch} className='gap-2'>
                <Search className='w-4 h-4' />
                Search
              </Button>
            </div>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='STUDENT'>Student</SelectItem>
              <SelectItem value='TEACHER'>Teacher</SelectItem>
              <SelectItem value='STAFF'>Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className='flex items-center justify-between text-sm text-gray-600 pt-2 border-t'>
          <span>
            Showing {idCards.length} of {total} ID cards
          </span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      {/* ID Cards Grid */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-sm text-gray-500'>Loading ID cards...</p>
          </div>
        </div>
      ) : idCards.length === 0 ? (
        <Card className='p-12'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CreditCard className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No ID cards found
            </h3>
            <p className='text-gray-600 mb-4'>
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by generating ID cards from the Generate ID Cards tab'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {idCards.map(idCard => (
              <Card key={idCard.id} className='p-4 hover:shadow-lg transition-all'>
                <div className='space-y-3'>
                  {/* Card Preview Placeholder */}
                  <div className='h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300'>
                    <div className='text-center'>
                      <CreditCard className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                      <p className='text-xs text-gray-500'>ID Card Preview</p>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-medium text-gray-900 truncate flex-1'>
                        {idCard.issuedFor.fullName}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getTypeColor(idCard.type)}`}
                      >
                        {idCard.type}
                      </span>
                    </div>

                    <div className='text-sm text-gray-600 space-y-1'>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        <span className='truncate'>{idCard.issuedFor.email}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          Expires: {new Date(idCard.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='w-4 h-4' />
                        <span className='truncate'>{idCard.template.name}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className='flex items-center justify-between pt-2'>
                      <span
                        className={`text-xs font-medium ${
                          idCard.isActive
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {idCard.isActive ? '● Active' : '● Inactive'}
                      </span>
                      {idCard.batchName && (
                        <span className='text-xs text-gray-500'>
                          Batch: {idCard.batchName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex items-center gap-2 pt-2 border-t'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onViewCard?.(idCard.id)}
                      className='flex-1 border-blue-200 text-blue-700 hover:bg-blue-50'
                    >
                      <Eye className='w-3 h-3 mr-1' />
                      View
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleDelete(idCard)}
                      className='border-red-200 text-red-700 hover:bg-red-50'
                    >
                      <Trash2 className='w-3 h-3' />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className='w-4 h-4' />
                Previous
              </Button>
              <span className='text-sm text-gray-600'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
