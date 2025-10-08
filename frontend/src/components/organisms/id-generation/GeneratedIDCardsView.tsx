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
      const response: IDCardListResponse = await idCardApiService.getAllIDCards(
        {
          page,
          limit: 12,
          search: search || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          isActive:
            statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        },
      );

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
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
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
      {/* Enhanced Header with Filters */}
      <div className='bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 p-6 sm:p-8 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm'>
        {/* Header Section */}
        <div className='flex items-center space-x-4 mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
            <CreditCard className='w-6 h-6 text-white' />
          </div>
          <div>
            <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-1'>
              Generated ID Cards
            </h2>
            <p className='text-gray-600'>
              View, manage, and download all your generated ID cards
            </p>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6'>
          {/* Search */}
          <div className='lg:col-span-6'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-5 w-5 text-gray-400' />
              </div>
              <Input
                placeholder='Search by name, email, or template...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className='pl-10 py-3 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm'
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className='lg:col-span-2'>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='py-3 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm'>
                <SelectValue placeholder='All Types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='STUDENT'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full' />
                    <span>Student</span>
                  </div>
                </SelectItem>
                <SelectItem value='TEACHER'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' />
                    <span>Teacher</span>
                  </div>
                </SelectItem>
                <SelectItem value='STAFF'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full' />
                    <span>Staff</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className='lg:col-span-2'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='py-3 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' />
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value='inactive'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full' />
                    <span>Inactive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className='lg:col-span-2'>
            <Button
              onClick={handleSearch}
              className='w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'
            >
              <Search className='w-4 h-4 mr-2' />
              Search
            </Button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200/50'>
          <div className='flex items-center space-x-6 text-sm'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              <span className='text-gray-600'>
                Showing{' '}
                <span className='font-semibold text-gray-900'>
                  {idCards.length}
                </span>{' '}
                of <span className='font-semibold text-gray-900'>{total}</span>{' '}
                ID cards
              </span>
            </div>
            {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-orange-500 rounded-full' />
                <span className='text-gray-600'>Filtered results</span>
              </div>
            )}
          </div>
          <div className='text-sm text-gray-600'>
            Page <span className='font-semibold text-gray-900'>{page}</span> of{' '}
            <span className='font-semibold text-gray-900'>{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Enhanced ID Cards Grid */}
      {loading ? (
        <div className='flex items-center justify-center py-16'>
          <div className='text-center'>
            <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-gray-600 font-medium'>Loading ID cards...</p>
            <p className='text-sm text-gray-500 mt-1'>
              Please wait while we fetch your cards
            </p>
          </div>
        </div>
      ) : idCards.length === 0 ? (
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200/50 p-12'>
          <div className='text-center max-w-md mx-auto'>
            <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6'>
              <CreditCard className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No matching ID cards found'
                : 'No ID cards generated yet'}
            </h3>
            <p className='text-gray-600 mb-6 leading-relaxed'>
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? "Try adjusting your search criteria or filters to find the ID cards you're looking for."
                : 'Start by generating ID cards from the Generate ID Cards tab to see them here.'}
            </p>
            {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setPage(1);
                }}
                variant='outline'
                className='border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6 py-2 rounded-xl'
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'>
            {idCards.map(idCard => (
              <div key={idCard.id} className='group relative'>
                <div className='bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden'>
                  {/* Card Preview */}
                  <div className='relative h-48 bg-gradient-to-br from-gray-50 via-white to-gray-100 border-b border-gray-200/50'>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg'>
                          <CreditCard className='w-8 h-8 text-white' />
                        </div>
                        <p className='text-sm font-medium text-gray-600'>
                          ID Card Preview
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          {idCard.template.name}
                        </p>
                      </div>
                    </div>
                    {/* Status Indicator */}
                    <div className='absolute top-4 right-4'>
                      <div
                        className={`w-3 h-3 rounded-full ${idCard.isActive ? 'bg-green-500' : 'bg-gray-400'} shadow-lg`}
                      />
                    </div>
                    {/* Type Badge */}
                    <div className='absolute top-4 left-4'>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getTypeColor(idCard.type)}`}
                      >
                        {idCard.type}
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className='p-6 space-y-4'>
                    {/* Name and Status */}
                    <div>
                      <h3 className='font-semibold text-gray-900 text-lg mb-1 truncate'>
                        {idCard.issuedFor.fullName}
                      </h3>
                      <div className='flex items-center justify-between'>
                        <span
                          className={`text-sm font-medium ${idCard.isActive ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {idCard.isActive ? '● Active' : '● Inactive'}
                        </span>
                        {idCard.batchName && (
                          <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
                            {idCard.batchName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className='space-y-3 text-sm text-gray-600'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <User className='w-4 h-4 text-blue-600' />
                        </div>
                        <span className='truncate'>
                          {idCard.issuedFor.email}
                        </span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <Calendar className='w-4 h-4 text-green-600' />
                        </div>
                        <span>
                          Expires:{' '}
                          {new Date(idCard.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                          <CreditCard className='w-4 h-4 text-purple-600' />
                        </div>
                        <span className='truncate'>{idCard.template.name}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex items-center gap-3 pt-4 border-t border-gray-100'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onViewCard?.(idCard.id)}
                        className='flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-medium py-2 rounded-xl transition-all duration-200'
                      >
                        <Eye className='w-4 h-4 mr-2' />
                        View & Download
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDelete(idCard)}
                        className='border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 px-3 py-2 rounded-xl transition-all duration-200'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className='bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6'>
              <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                <div className='text-sm text-gray-600'>
                  Showing page{' '}
                  <span className='font-semibold text-gray-900'>{page}</span> of{' '}
                  <span className='font-semibold text-gray-900'>
                    {totalPages}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className='rounded-xl border-gray-300 hover:bg-gray-50 font-medium px-4 py-2'
                  >
                    First
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='rounded-xl border-gray-300 hover:bg-gray-50 font-medium px-4 py-2'
                  >
                    <ChevronLeft className='w-4 h-4 mr-1' />
                    Previous
                  </Button>
                  <div className='flex items-center space-x-1'>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-xl font-medium ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className='rounded-xl border-gray-300 hover:bg-gray-50 font-medium px-4 py-2'
                  >
                    Next
                    <ChevronRight className='w-4 h-4 ml-1' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className='rounded-xl border-gray-300 hover:bg-gray-50 font-medium px-4 py-2'
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
