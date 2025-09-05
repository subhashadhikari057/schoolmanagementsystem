'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/atoms/display/Icon';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import {
  Building2,
  FileText,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
} from 'lucide-react';

interface SchoolInformationTabProps {
  isEditing?: boolean;
}

export default function SchoolInformationTab({
  isEditing = false,
}: SchoolInformationTabProps) {
  const [formData, setFormData] = useState({
    schoolName: 'Springfield Elementary School',
    website: 'www.springfield.edu',
    address: '742 Evergreen Terrace, Springfield',
    principalName: 'Dr. Sarah Johnson',
    establishedYear: '1965',
    schoolCode: 'SPF001',
    phoneNumber: '+1 (555) 123-4567',
    emailAddress: 'admin@springfield.edu',
    registrationNumber: 'REG123456789',
    accreditationStatus: 'Accredited',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const InputGroup = ({
    icon,
    label,
    value,
    field,
    placeholder,
    type = 'text',
    isTextarea = false,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    field: string;
    placeholder: string;
    type?: string;
    isTextarea?: boolean;
  }) => (
    <div className='space-y-3'>
      <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
        {icon}
        {label}
      </label>
      {isTextarea ? (
        <Textarea
          value={value}
          onChange={e => handleInputChange(field, e.target.value)}
          className={`w-full min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm ${
            !isEditing ? 'bg-gray-50 cursor-default' : ''
          }`}
          placeholder={placeholder}
          readOnly={!isEditing}
        />
      ) : (
        <Input
          value={value}
          onChange={e => handleInputChange(field, e.target.value)}
          className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm ${
            !isEditing ? 'bg-gray-50 cursor-default' : ''
          }`}
          placeholder={placeholder}
          type={type}
          readOnly={!isEditing}
        />
      )}
    </div>
  );

  const accreditationOptions = [
    { value: 'Accredited', label: 'Accredited' },
    { value: 'Pending', label: 'Pending Accreditation' },
    { value: 'Not Accredited', label: 'Not Accredited' },
  ];

  return (
    <div className='space-y-8'>
      {/* Basic Information */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl'>
            <Building2 className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Basic Information
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Configure your school's primary details and contact information
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <InputGroup
            icon={<Building2 className='h-4 w-4 text-blue-500' />}
            label='School Name'
            value={formData.schoolName}
            field='schoolName'
            placeholder='Enter school name'
          />

          <InputGroup
            icon={<Hash className='h-4 w-4 text-green-500' />}
            label='School Code'
            value={formData.schoolCode}
            field='schoolCode'
            placeholder='Enter school code'
          />

          <InputGroup
            icon={<MapPin className='h-4 w-4 text-red-500' />}
            label='Website'
            value={formData.website}
            field='website'
            placeholder='Enter website URL'
            type='url'
          />

          <InputGroup
            icon={<Calendar className='h-4 w-4 text-purple-500' />}
            label='Established Year'
            value={formData.establishedYear}
            field='establishedYear'
            placeholder='Enter establishment year'
            type='number'
          />

          <div className='lg:col-span-2'>
            <InputGroup
              icon={<MapPin className='h-4 w-4 text-orange-500' />}
              label='Address'
              value={formData.address}
              field='address'
              placeholder='Enter complete address'
              isTextarea={true}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
