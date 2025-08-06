import React, { useState } from 'react';
import {
  X,
  Upload,
  CreditCard,
  Users,
  Calendar,
  Settings,
  QrCode,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GenerateIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateIDCardModal: React.FC<GenerateIDCardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    generationType: 'individual',
    cardType: '',
    template: '',
    recipients: [],
    expiryDate: '',
    batchName: '2025 Academic Year',
    includeQRCode: true,
    includeBarcode: false,
    autoPrint: false,
  });

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecipientToggle = (recipient: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipient)
        ? prev.filter(r => r !== recipient)
        : [...prev, recipient],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('ID cards generated successfully!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        generationType: 'individual',
        cardType: '',
        template: '',
        recipients: [],
        expiryDate: '',
        batchName: '2025 Academic Year',
        includeQRCode: true,
        includeBarcode: false,
        autoPrint: false,
      });
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Failed to generate ID cards. Please try again.');
    }
  };

  if (!isOpen) return null;

  const recipients = [
    { id: 'grade-10a', label: 'Grade 10A - All Students (35)', type: 'class' },
    { id: 'grade-10b', label: 'Grade 10B - All Students (32)', type: 'class' },
    { id: 'new-students', label: 'New Students Only (12)', type: 'filter' },
    { id: 'all-students', label: 'All Students (2,847)', type: 'all' },
    { id: 'all-teachers', label: 'All Teachers (45)', type: 'staff' },
    { id: 'all-staff', label: 'All Staff (23)', type: 'staff' },
  ];

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200'
      onClick={onClose}
    >
      <div
        className='modal-scroll-blend modal-sidebar-blend rounded-2xl w-full max-w-2xl max-h-[85vh] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl'></div>
          <div className='absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-xl'></div>

          <div className='relative flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg'>
                <CreditCard className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-white'>
                  Generate ID Cards
                </h2>
                <p className='text-xs text-blue-100 mt-1'>
                  Create and customize ID cards for students and staff
                </p>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='h-8 w-8 p-0 text-blue-100 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200'
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='p-4 space-y-4 bg-white rounded-b-2xl'
          onClick={e => e.stopPropagation()}
        >
          {/* Generation Type */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-gray-700'>
              Generation Type
            </label>
            <div className='flex gap-4'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='radio'
                  name='generationType'
                  value='individual'
                  checked={formData.generationType === 'individual'}
                  onChange={e =>
                    handleInputChange('generationType', e.target.value)
                  }
                  className='text-blue-600'
                />
                <span className='text-sm text-gray-700'>Individual</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='radio'
                  name='generationType'
                  value='bulk'
                  checked={formData.generationType === 'bulk'}
                  onChange={e =>
                    handleInputChange('generationType', e.target.value)
                  }
                  className='text-blue-600'
                />
                <span className='text-sm text-gray-700'>Bulk Generation</span>
              </label>
            </div>
          </div>

          {/* Card Type and Template */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Card Type <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.cardType}
                onChange={e => handleInputChange('cardType', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              >
                <option value=''>Select type</option>
                <option value='student'>Student ID</option>
                <option value='teacher'>Teacher ID</option>
                <option value='staff'>Staff ID</option>
                <option value='visitor'>Visitor ID</option>
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Template <span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.template}
                onChange={e => handleInputChange('template', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
              >
                <option value=''>Select template</option>
                <option value='student-template-a'>Student Template A</option>
                <option value='student-template-b'>Student Template B</option>
                <option value='staff-template-a'>Staff Template A</option>
                <option value='visitor-template'>Visitor Template</option>
              </select>
            </div>
          </div>

          {/* Select Recipients */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-gray-700'>
              Select Recipients
            </label>
            <div className='border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2'>
              {recipients.map(recipient => (
                <label
                  key={recipient.id}
                  className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer'
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type='checkbox'
                    checked={selectedRecipients.includes(recipient.id)}
                    onChange={e => {
                      e.stopPropagation();
                      handleRecipientToggle(recipient.id);
                    }}
                    className='text-blue-600'
                  />
                  <div className='flex items-center gap-2'>
                    {recipient.type === 'class' && (
                      <Users size={16} className='text-blue-500' />
                    )}
                    {recipient.type === 'filter' && (
                      <Settings size={16} className='text-green-500' />
                    )}
                    {recipient.type === 'all' && (
                      <Users size={16} className='text-purple-500' />
                    )}
                    {recipient.type === 'staff' && (
                      <CreditCard size={16} className='text-orange-500' />
                    )}
                    <span className='text-sm text-gray-700'>
                      {recipient.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiry Date and Batch Name */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Expiry Date
              </label>
              <div className='relative'>
                <Calendar
                  size={16}
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                />
                <input
                  type='date'
                  value={formData.expiryDate}
                  onChange={e =>
                    handleInputChange('expiryDate', e.target.value)
                  }
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='mm/dd/yyyy'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Batch Name
              </label>
              <Input
                value={formData.batchName}
                onChange={e => handleInputChange('batchName', e.target.value)}
                placeholder='2025 Academic Year'
                className='w-full'
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-gray-700'>
              Additional Options
            </label>
            <div className='space-y-3'>
              <label
                className='flex items-center gap-3 cursor-pointer'
                onClick={e => e.stopPropagation()}
              >
                <input
                  type='checkbox'
                  checked={formData.includeQRCode}
                  onChange={e => {
                    e.stopPropagation();
                    handleInputChange('includeQRCode', e.target.checked);
                  }}
                  className='text-blue-600'
                />
                <QrCode size={16} className='text-gray-500' />
                <span className='text-sm text-gray-700'>Include QR Code</span>
              </label>

              <label
                className='flex items-center gap-3 cursor-pointer'
                onClick={e => e.stopPropagation()}
              >
                <input
                  type='checkbox'
                  checked={formData.includeBarcode}
                  onChange={e => {
                    e.stopPropagation();
                    handleInputChange('includeBarcode', e.target.checked);
                  }}
                  className='text-blue-600'
                />
                <Settings size={16} className='text-gray-500' />
                <span className='text-sm text-gray-700'>Include Barcode</span>
              </label>

              <label
                className='flex items-center gap-3 cursor-pointer'
                onClick={e => e.stopPropagation()}
              >
                <input
                  type='checkbox'
                  checked={formData.autoPrint}
                  onChange={e => {
                    e.stopPropagation();
                    handleInputChange('autoPrint', e.target.checked);
                  }}
                  className='text-blue-600'
                />
                <Printer size={16} className='text-gray-500' />
                <span className='text-sm text-gray-700'>
                  Auto-print after generation
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-3 pt-3 border-t border-gray-200'>
            <Button
              type='button'
              variant='outline'
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='px-6'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            >
              <CreditCard size={16} className='mr-2' />
              Generate ID Cards
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateIDCardModal;
