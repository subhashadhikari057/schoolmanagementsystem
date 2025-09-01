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

      {/* Contact Information */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl'>
            <Phone className='h-6 w-6 text-green-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Contact Information
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Primary contact details and administrative information
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <InputGroup
            icon={<User className='h-4 w-4 text-blue-500' />}
            label='Principal Name'
            value={formData.principalName}
            field='principalName'
            placeholder="Enter principal's name"
          />

          <InputGroup
            icon={<Phone className='h-4 w-4 text-green-500' />}
            label='Phone Number'
            value={formData.phoneNumber}
            field='phoneNumber'
            placeholder='Enter phone number'
            type='tel'
          />

          <div className='lg:col-span-2'>
            <InputGroup
              icon={<Mail className='h-4 w-4 text-red-500' />}
              label='Email Address'
              value={formData.emailAddress}
              field='emailAddress'
              placeholder='Enter email address'
              type='email'
            />
          </div>
        </div>
      </Card>

      {/* Legal & Registration Details */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl'>
            <FileText className='h-6 w-6 text-purple-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Legal & Registration Details
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              Official registration and accreditation information
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <InputGroup
            icon={<FileText className='h-4 w-4 text-blue-500' />}
            label='Registration Number'
            value={formData.registrationNumber}
            field='registrationNumber'
            placeholder='Enter registration number'
          />

          <div className='space-y-3'>
            <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
              <FileText className='h-4 w-4 text-green-500' />
              Accreditation Status
            </label>
            {isEditing ? (
              <Dropdown
                type='filter'
                options={accreditationOptions}
                selectedValue={formData.accreditationStatus}
                onSelect={value =>
                  handleInputChange('accreditationStatus', value)
                }
                placeholder='Select accreditation status'
                className='w-full'
              />
            ) : (
              <div className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700'>
                {formData.accreditationStatus}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className='mt-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                <FileText className='h-4 w-4 text-green-600' />
              </div>
            </div>
            <div>
              <h4 className='text-sm font-semibold text-green-900'>
                Current Status: {formData.accreditationStatus}
              </h4>
              <p className='text-xs text-green-700 mt-1'>
                {formData.accreditationStatus === 'Accredited'
                  ? 'Your school meets all regulatory requirements and standards.'
                  : formData.accreditationStatus === 'Pending'
                    ? 'Accreditation review is currently in progress.'
                    : 'Please contact the accreditation board for more information.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
