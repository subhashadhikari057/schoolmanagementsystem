'use client';

import React, { useState } from 'react';
import GenericList from '@/components/templates/GenericList';
import {
  getListConfig,
  IDCard,
} from '@/components/templates/listConfigurations';
import Statsgrid from '@/components/organisms/dashboard/Statsgrid';
import { ActionButtons } from '@/components/atoms/interactive/ActionButtons';
import { CreditCard, Printer, CheckCircle, AlertCircle } from 'lucide-react';

const IDCardGenerationPage = () => {
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    setSelectedItems(selectedIds);
    console.log('Selected ID cards:', selectedIds);
  };
  // ID Card specific stats data
  const idCardStats = [
    {
      icon: CreditCard,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      value: '248',
      label: 'Total ID Cards',
      change: '5.2%',
      isPositive: true,
    },
    {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      value: '195',
      label: 'Printed Cards',
      change: '12.3%',
      isPositive: true,
    },
    {
      icon: Printer,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      value: '34',
      label: 'Pending Print',
      change: '2.1%',
      isPositive: false,
    },
    {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      value: '19',
      label: 'Generated Only',
      change: '8.7%',
      isPositive: false,
    },
  ];

  // Sample ID Card data
  const idCardsData: IDCard[] = [
    {
      id: 1,
      cardId: 'STU2025001',
      holderName: 'Emily Johnson',
      holderType: 'Student',
      holderInfo: 'Grade 10A',
      generatedDate: '2025-01-15',
      expiryDate: '2026-07-31',
      printStatus: 'Printed',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 1,
      lastPrintDate: '2025-01-16',
      avatar: undefined,
    },
    {
      id: 2,
      cardId: 'TCH2025001',
      holderName: 'Dr. Sarah Mitchell',
      holderType: 'Teacher',
      holderInfo: 'Mathematics Dept',
      generatedDate: '2025-01-10',
      expiryDate: '2026-12-31',
      printStatus: 'Printed',
      template: 'Staff Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 1,
      lastPrintDate: '2025-01-11',
      avatar: undefined,
    },
    {
      id: 3,
      cardId: 'STU2025002',
      holderName: 'James Smith',
      holderType: 'Student',
      holderInfo: 'Grade 11B',
      generatedDate: '2025-01-27',
      expiryDate: '2026-07-31',
      printStatus: 'Pending Print',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 0,
      avatar: undefined,
    },
    {
      id: 4,
      cardId: 'STF2025001',
      holderName: 'John Wilson',
      holderType: 'Staff',
      holderInfo: 'Administration',
      generatedDate: '2025-01-28',
      expiryDate: '2026-12-31',
      printStatus: 'Generated',
      template: 'Staff Template A',
      hasPhoto: false,
      hasQR: true,
      printCount: 0,
      avatar: undefined,
    },
    {
      id: 5,
      cardId: 'STU2025003',
      holderName: 'Sophia Brown',
      holderType: 'Student',
      holderInfo: 'Grade 9C',
      generatedDate: '2025-01-25',
      expiryDate: '2026-07-31',
      printStatus: 'Printed',
      template: 'Student Template A',
      hasPhoto: true,
      hasQR: true,
      printCount: 2,
      lastPrintDate: '2025-01-26',
      avatar: undefined,
    },
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='px-1 sm:px-2 lg:px-4 pt-3 sm:pt-4 lg:pt-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>
            ID Card Generation & Management
          </h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2'>
            Generate, Print, and Manage All ID Cards
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='px-1 sm:px-2 lg:px-4 mt-3 sm:mt-4 lg:mt-6'>
        <div className='max-w-7xl mx-auto'>
          <Statsgrid stats={idCardStats} />
        </div>
      </div>

      {/* Main Content */}
      <div className='px-1 sm:px-2 lg:px-4 mt-4 sm:mt-6 lg:mt-8 mb-6 sm:mb-8 lg:mb-10'>
        <div className='max-w-7xl mx-auto'>
          {/* ID Cards List */}
          <GenericList<IDCard>
            config={getListConfig('id-cards')}
            data={idCardsData}
            currentPage={1}
            totalPages={25}
            totalItems={248}
            itemsPerPage={10}
            customActions={<ActionButtons pageType='id-cards' />}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  );
};

export default IDCardGenerationPage;
