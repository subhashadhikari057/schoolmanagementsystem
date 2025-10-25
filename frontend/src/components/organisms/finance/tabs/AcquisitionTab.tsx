'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  History,
  ShoppingCart,
  HelpCircle,
  Info,
  Upload,
  CheckCircle,
  Clock,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { RoomWithAssets, Acquisition } from '@/types/asset.types';

// Import the modals
import ViewAcquisitionModal from '../modals/ViewAcquisitionModal';
import EditAcquisitionModal from '../modals/EditAcquisitionModal';
import HistoryAcquisitionModal from '../modals/HistoryAcquisitionModal';

interface AcquisitionTabProps {
  room: RoomWithAssets;
  onAcquisitionUpdate?: () => void;
  onNotification?: (
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
  ) => void;
  onOpenRecordAcquisition?: () => void;
  onOpenImportCSV?: () => void;
  onCountChange?: (count: number) => void; // New: callback to update parent badge count
}

const AcquisitionTab: React.FC<AcquisitionTabProps> = ({
  room,
  onAcquisitionUpdate,
  onNotification,
  onOpenRecordAcquisition,
  onOpenImportCSV,
  onCountChange, // New prop
}) => {
  const [acquisitions, setAcquisitions] = useState<Acquisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAcquisition, setSelectedAcquisition] =
    useState<Acquisition | null>(null);

  // Helper content for guidance
  const helpContent = {
    title: 'Acquisition Management Guide',
    sections: [
      {
        title: 'Recording Acquisitions',
        content:
          "Use 'Record Acquisition' to log new asset purchases. Include vendor details, costs, warranties, and delivery information for complete tracking.",
      },
      {
        title: 'Bulk Import',
        content:
          'Import multiple acquisitions from CSV files. Useful for processing large purchase orders or historical data migration.',
      },
      {
        title: 'Tracking Status',
        content:
          'Monitor acquisition status: Ordered, Delivered, Installed, or Cancelled. This helps track the complete procurement lifecycle.',
      },
      {
        title: 'Financial Records',
        content:
          'Maintain detailed cost records including unit costs, total values, payment terms, and vendor information for audit compliance.',
      },
    ],
  };

  useEffect(() => {
    loadAcquisitions();
  }, [room.id]);

  // Notify parent whenever acquisitions count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(acquisitions.length);
    }
  }, [acquisitions.length, onCountChange]);

  const loadAcquisitions = async () => {
    setLoading(true);
    try {
      // Mock data for acquisitions with comprehensive details
      const mockAcquisitions: Acquisition[] = [
        {
          id: 'acq-001',
          assetName: 'Epson EB-2250U Projector',
          brand: 'Epson',
          modelNo: 'EB-2250U',
          category: 'electronics',
          quantity: 2,
          unitCost: 1250,
          totalValue: 2500,
          vendor: {
            name: 'TechVision Supplies Inc.',
            panVat: 'PAN-123456789',
            contact: 'sales@techvision.com | +1 (555) 234-5678',
            address: '789 Technology Park, Silicon Valley, CA 94025',
            invoiceDate: '2024-09-15',
            paymentMode: 'BANK',
            paymentTiming: 'FULL',
          },
          warrantyMonths: 36,
          management: {
            roomId: room.id,
            assignedDate: '2024-09-22',
            status: 'IN_SERVICE',
            notes:
              'Installed in Room 301 for multimedia presentations. Both units tested and working perfectly.',
          },
          createdAt: '2024-09-15T10:30:00Z',
        },
        {
          id: 'acq-002',
          assetName: 'Student Desk & Chair Set',
          brand: 'SchoolMaster',
          modelNo: 'SM-DESK-40',
          category: 'furniture',
          quantity: 30,
          unitCost: 150,
          totalValue: 4500,
          vendor: {
            name: 'Premium School Furniture Co.',
            panVat: 'PAN-987654321',
            contact: 'orders@schoolfurniture.com | +1 (555) 876-5432',
            address: '456 Industrial Blvd, Manufacturing District, TX 75001',
            invoiceDate: '2024-08-10',
            paymentMode: 'BANK',
            paymentTiming: 'INSTALLMENT',
          },
          warrantyMonths: 60,
          management: {
            roomId: room.id,
            assignedDate: '2024-08-20',
            status: 'IN_SERVICE',
            notes:
              'Complete classroom furniture setup. 30 ergonomic desk-chair combos installed and arranged.',
          },
          createdAt: '2024-08-10T09:15:00Z',
        },
        {
          id: 'acq-003',
          assetName: 'HP LaserJet Pro M404dn',
          brand: 'HP',
          modelNo: 'M404dn',
          category: 'electronics',
          quantity: 1,
          unitCost: 350,
          totalValue: 350,
          vendor: {
            name: 'Office Depot Business Solutions',
            panVat: 'PAN-456789123',
            contact: 'business@officedepot.com | +1 (555) 321-9876',
            address: '123 Commerce Street, Business Park, NY 10001',
            invoiceDate: '2024-10-01',
            paymentMode: 'CASH',
            paymentTiming: 'FULL',
          },
          warrantyMonths: 12,
          management: {
            roomId: room.id,
            status: 'IN_SERVICE',
            notes:
              'Printer delivered and in storage. Awaiting IT setup and network configuration.',
          },
          createdAt: '2024-10-01T11:20:00Z',
        },
        {
          id: 'acq-004',
          assetName: 'Whiteboard - Magnetic Surface',
          brand: 'Quartet',
          modelNo: 'QRT-8060',
          category: 'furniture',
          quantity: 2,
          unitCost: 180,
          totalValue: 360,
          vendor: {
            name: 'ClassRoom Essentials Ltd.',
            panVat: 'PAN-789123456',
            contact: 'info@classroomessentials.com | +1 (555) 654-3210',
            address: '901 Education Ave, Learning District, IL 60601',
            invoiceDate: '2024-07-20',
            paymentMode: 'BANK',
            paymentTiming: 'FULL',
          },
          warrantyMonths: 120,
          management: {
            roomId: room.id,
            assignedDate: '2024-07-28',
            status: 'IN_SERVICE',
            notes:
              'Both whiteboards mounted on front and side walls. Installation professionally done with proper wall anchors.',
          },
          createdAt: '2024-07-20T08:40:00Z',
        },
        {
          id: 'acq-005',
          assetName: 'Dell OptiPlex 7090 Desktop',
          brand: 'Dell',
          modelNo: 'OptiPlex-7090',
          category: 'electronics',
          quantity: 1,
          unitCost: 950,
          totalValue: 950,
          vendor: {
            name: 'Dell Business Direct',
            panVat: 'PAN-321654987',
            contact: 'education@dell.com | +1 (555) 111-2233',
            address: '500 Tech Drive, Round Rock, TX 78682',
            invoiceDate: '2024-09-05',
            paymentMode: 'BANK',
            paymentTiming: 'FULL',
          },
          warrantyMonths: 36,
          management: {
            roomId: room.id,
            notes:
              'Teacher workstation computer ordered. Expected delivery in 2-3 weeks. Includes Windows 11 Pro and Office 365.',
          },
          createdAt: '2024-09-05T13:25:00Z',
        },
      ];

      setAcquisitions(mockAcquisitions);
    } catch (error) {
      console.error('Failed to load acquisitions:', error);
      toast.error('Failed to load acquisitions');
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

  // Modal action handlers
  const handleViewAcquisition = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setIsViewModalOpen(true);
  };

  const handleEditAcquisition = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (acquisition: Acquisition) => {
    setSelectedAcquisition(acquisition);
    setIsHistoryModalOpen(true);
  };

  const handleUpdateAcquisition = (updatedAcquisition: Acquisition) => {
    // Update the acquisition in the list
    setAcquisitions(prev =>
      prev.map(acq =>
        acq.id === updatedAcquisition.id ? updatedAcquisition : acq,
      ),
    );

    // Notify parent if needed
    if (onAcquisitionUpdate) {
      onAcquisitionUpdate();
    }

    // Show notification
    if (onNotification) {
      onNotification(
        'success',
        `Acquisition "${updatedAcquisition.assetName}" was updated successfully`,
      );
    } else {
      toast.success(`Acquisition updated successfully`);
    }
  };

  return (
    <div className='w-full overflow-hidden'>
      {/* Tab Header with Contextual Actions */}
      <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
          <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
            <ShoppingCart className='h-5 w-5 mr-2 text-green-600' />
            Acquisition History
          </h2>
          <div className='flex items-center space-x-2 text-sm text-gray-600'>
            <span>
              {acquisitions.length} acquisition
              {acquisitions.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span>
              {formatCurrency(
                acquisitions.reduce(
                  (sum, acq) => sum + (acq.totalValue || 0),
                  0,
                ),
              )}{' '}
              total value
            </span>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              onOpenRecordAcquisition?.();
            }}
            className='bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
          >
            <Plus className='h-4 w-4 mr-2' />
            Record Acquisition
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              onOpenImportCSV?.();
            }}
            className='bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          >
            <Upload className='h-4 w-4 mr-2' />
            Import CSV
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowHelp(!showHelp)}
            className='bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            title='Show help and guidance'
          >
            <HelpCircle className='h-4 w-4 mr-2' />
            Help
          </Button>
        </div>
      </div>

      {/* Contextual Help Panel */}
      {showHelp && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center'>
              <Info className='h-5 w-5 text-green-600 mr-2' />
              <h3 className='font-semibold text-green-900'>
                {helpContent.title}
              </h3>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className='text-green-400 hover:text-green-600 transition-colors'
            >
              ×
            </button>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {helpContent.sections.map((section, index) => (
              <div
                key={index}
                className='bg-white rounded-md p-3 border border-green-100'
              >
                <h4 className='font-medium text-green-900 mb-2'>
                  {section.title}
                </h4>
                <p className='text-sm text-green-700 leading-relaxed'>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
          <div className='mt-4 p-3 bg-white rounded-md border border-green-100'>
            <div className='flex items-center text-sm text-green-700'>
              <HelpCircle className='h-4 w-4 mr-2' />
              <span className='font-medium'>Tip:</span>
              <span className='ml-1'>
                Use Ctrl+Shift+N to quickly open the Record Acquisition form
              </span>
            </div>
          </div>
        </div>
      )}

      <div className='bg-white rounded-lg shadow w-full p-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Acquisition History
          </h3>
          <p className='text-sm text-gray-500'>
            Use "Record Acquisition" button in the header to add new
            acquisitions
          </p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-gray-500'>Loading acquisitions...</div>
          </div>
        ) : acquisitions.length === 0 ? (
          <div className='text-center py-12'>
            <ShoppingCart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No acquisitions recorded
            </h3>
            <p className='text-sm text-gray-500 mb-6 max-w-md mx-auto'>
              Start tracking your asset purchases by recording acquisitions.
              This helps maintain complete financial records and asset history.
            </p>
            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
              <Button
                onClick={() => {
                  onOpenRecordAcquisition?.();
                }}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Plus className='h-4 w-4 mr-2' />
                Record Your First Acquisition
              </Button>
              <Button
                variant='outline'
                onClick={() => setShowHelp(true)}
                className='border-gray-300'
              >
                <HelpCircle className='h-4 w-4 mr-2' />
                Learn More
              </Button>
            </div>
          </div>
        ) : (
          <div className='relative'>
            <div className='text-xs text-gray-500 mb-2 flex items-center'>
              <svg
                className='w-4 h-4 mr-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                />
              </svg>
              Scroll horizontally to see more information
            </div>
            <div className='bg-white rounded-lg shadow overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 table-fixed'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64'>
                      Asset Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48'>
                      Vendor
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32'>
                      Invoice Date
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24'>
                      Quantity
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32'>
                      Total Value
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36'>
                      Procurement Status
                    </th>

                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {acquisitions.map(acquisition => (
                    <tr key={acquisition.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm font-medium text-gray-900 truncate max-w-[240px]'>
                            {acquisition.assetName}
                          </div>
                          <div className='text-sm text-gray-500 truncate max-w-[240px]'>
                            {acquisition.brand}{' '}
                            {acquisition.modelNo && `• ${acquisition.modelNo}`}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[180px]'>
                        {acquisition.vendor.name}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {acquisition.vendor.invoiceDate
                          ? new Date(
                              acquisition.vendor.invoiceDate,
                            ).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center'>
                        {acquisition.quantity}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {acquisition.totalValue
                          ? formatCurrency(acquisition.totalValue)
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <Badge variant='secondary'>
                          {acquisition.management.status?.replace('_', ' ') ||
                            'Pending'}
                        </Badge>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        {/* Procurement Status */}
                        {acquisition.management.status === 'IN_SERVICE' ? (
                          <Badge className='bg-green-100 text-green-800 border-green-200'>
                            <CheckCircle className='h-3 w-3 mr-1' />
                            Active & In Use
                          </Badge>
                        ) : acquisition.management.assignedDate ? (
                          <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
                            <Package className='h-3 w-3 mr-1' />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge className='bg-purple-100 text-purple-800 border-purple-200'>
                            <Clock className='h-3 w-3 mr-1' />
                            Pending Assignment
                          </Badge>
                        )}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <div className='flex items-center justify-end space-x-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            title='View acquisition details'
                            onClick={() => handleViewAcquisition(acquisition)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            title='Edit acquisition details'
                            onClick={() => handleEditAcquisition(acquisition)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            title='View acquisition history'
                            onClick={() => handleViewHistory(acquisition)}
                          >
                            <History className='h-4 w-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewAcquisitionModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        acquisition={selectedAcquisition}
      />

      <EditAcquisitionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        acquisition={selectedAcquisition}
        onSave={handleUpdateAcquisition}
      />

      <HistoryAcquisitionModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        acquisition={selectedAcquisition}
      />
    </div>
  );
};

export default AcquisitionTab;
