'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomWithAssets } from '@/types/asset.types';

interface ReportsTabProps {
  room: RoomWithAssets;
}

interface KPIData {
  totalItems: number;
  totalValue: number;
  categoryBreakdown: Array<{ category: string; count: number; value: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  warrantyExpiring: Array<{
    item: string;
    tag: string;
    expiry: string;
    daysLeft: number;
  }>;
  topVendors: Array<{ vendor: string; itemCount: number; totalValue: number }>;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ room }) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '7' | '30' | '90' | '365'
  >('30');

  useEffect(() => {
    generateKPIData();
  }, [room, selectedTimeframe]);

  const generateKPIData = () => {
    setLoading(true);
    try {
      // Calculate KPIs from room data
      const categoryMap = new Map<string, { count: number; value: number }>();
      const statusMap = new Map<string, number>();
      const warrantyExpiring: Array<{
        item: string;
        tag: string;
        expiry: string;
        daysLeft: number;
      }> = [];

      let totalItems = 0;
      let totalValue = 0;

      room.assets.forEach(model => {
        // Category breakdown
        const existing = categoryMap.get(model.category) || {
          count: 0,
          value: 0,
        };
        categoryMap.set(model.category, {
          count: existing.count + model.totalQuantity,
          value: existing.value + model.totalValue,
        });

        model.items.forEach(item => {
          totalItems++;
          // Assuming each item has a proportional value
          const itemValue = model.totalValue / model.totalQuantity;
          totalValue += itemValue;

          // Status distribution
          const statusCount = statusMap.get(item.status) || 0;
          statusMap.set(item.status, statusCount + 1);

          // Warranty expiring check
          if (item.warrantyExpiry) {
            const expiryDate = new Date(item.warrantyExpiry);
            const today = new Date();
            const daysLeft = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
            );

            if (daysLeft >= 0 && daysLeft <= parseInt(selectedTimeframe)) {
              warrantyExpiring.push({
                item: model.name,
                tag: item.tag,
                expiry: item.warrantyExpiry,
                daysLeft,
              });
            }
          }
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(
        ([category, data]) => ({
          category,
          count: data.count,
          value: data.value,
        }),
      );

      const statusDistribution = Array.from(statusMap.entries()).map(
        ([status, count]) => ({
          status,
          count,
          percentage: Math.round((count / totalItems) * 100),
        }),
      );

      setKpiData({
        totalItems,
        totalValue,
        categoryBreakdown,
        statusDistribution,
        warrantyExpiring: warrantyExpiring.sort(
          (a, b) => a.daysLeft - b.daysLeft,
        ),
        topVendors: [], // TODO: Implement when vendor data is available
      });
    } catch (error) {
      console.error('Failed to generate KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_SERVICE':
        return 'text-green-600';
      case 'DAMAGED':
        return 'text-red-600';
      case 'UNDER_REPAIR':
        return 'text-yellow-600';
      case 'REPLACED':
      case 'DISPOSED':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const exportData = (type: 'items' | 'models' | 'acquisitions') => {
    // TODO: Implement actual export functionality
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${room.name || room.roomNo}_${type}_${timestamp}.csv`;

    // For now, just show a toast
    console.log(`Exporting ${type} data to ${filename}`);
    // TODO: Generate and download CSV
  };

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-gray-500'>Generating reports...</div>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No data available
          </h3>
          <p className='text-sm text-gray-500'>
            Add some assets to this room to generate reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header with Controls */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Room Reports & Analytics
        </h3>
        <div className='flex items-center space-x-3'>
          <select
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value as any)}
            className='text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='7'>Next 7 days</option>
            <option value='30'>Next 30 days</option>
            <option value='90'>Next 90 days</option>
            <option value='365'>Next year</option>
          </select>
          <Button variant='outline' size='sm' onClick={() => generateKPIData()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{kpiData.totalItems}</div>
            <p className='text-xs text-muted-foreground'>
              Across {kpiData.categoryBreakdown.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Value</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(kpiData.totalValue)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Average:{' '}
              {formatCurrency(
                kpiData.totalValue / Math.max(kpiData.totalItems, 1),
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Working Assets
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {kpiData.statusDistribution.find(s => s.status === 'IN_SERVICE')
                ?.count || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {kpiData.statusDistribution.find(s => s.status === 'IN_SERVICE')
                ?.percentage || 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Issues</CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {(kpiData.statusDistribution.find(s => s.status === 'DAMAGED')
                ?.count || 0) +
                (kpiData.statusDistribution.find(
                  s => s.status === 'UNDER_REPAIR',
                )?.count || 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <PieChart className='h-5 w-5' />
              <span>By Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {kpiData.categoryBreakdown.map(category => (
                <div
                  key={category.category}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                    <span className='text-sm font-medium capitalize'>
                      {category.category}
                    </span>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-semibold'>
                      {category.count} items
                    </div>
                    <div className='text-xs text-gray-500'>
                      {formatCurrency(category.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5' />
              <span>Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {kpiData.statusDistribution.map(status => (
                <div
                  key={status.status}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status.status === 'IN_SERVICE'
                          ? 'bg-green-500'
                          : status.status === 'DAMAGED'
                            ? 'bg-red-500'
                            : status.status === 'UNDER_REPAIR'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                      }`}
                    ></div>
                    <span className='text-sm font-medium'>
                      {status.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-semibold'>
                      {status.count} items
                    </div>
                    <div className='text-xs text-gray-500'>
                      {status.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warranty Expiring */}
      {kpiData.warrantyExpiring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Calendar className='h-5 w-5' />
              <span>Warranty Expiring ({selectedTimeframe} days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-2'>Asset</th>
                    <th className='text-left py-2'>Tag</th>
                    <th className='text-left py-2'>Expiry Date</th>
                    <th className='text-left py-2'>Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiData.warrantyExpiring.slice(0, 10).map((item, index) => (
                    <tr key={index} className='border-b border-gray-100'>
                      <td className='py-2 font-medium'>{item.item}</td>
                      <td className='py-2 text-gray-600'>{item.tag}</td>
                      <td className='py-2'>
                        {new Date(item.expiry).toLocaleDateString()}
                      </td>
                      <td className='py-2'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.daysLeft <= 7
                              ? 'bg-red-100 text-red-800'
                              : item.daysLeft <= 30
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.daysLeft} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Download className='h-5 w-5' />
            <span>Export Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button
              variant='outline'
              onClick={() => exportData('items')}
              className='flex items-center space-x-2'
            >
              <FileText className='h-4 w-4' />
              <span>Export Items (CSV)</span>
            </Button>
            <Button
              variant='outline'
              onClick={() => exportData('models')}
              className='flex items-center space-x-2'
            >
              <FileText className='h-4 w-4' />
              <span>Export Models (CSV)</span>
            </Button>
            <Button
              variant='outline'
              onClick={() => exportData('acquisitions')}
              className='flex items-center space-x-2'
            >
              <FileText className='h-4 w-4' />
              <span>Export Acquisitions (CSV)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
