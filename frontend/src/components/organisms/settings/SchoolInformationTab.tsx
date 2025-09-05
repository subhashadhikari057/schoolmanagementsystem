'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Building2,
  Calendar,
  Hash,
  MapPin,
  Loader2,
  AlertCircle,
  Edit2,
  Globe,
  Mail,
  Phone,
  Plus,
  Trash2,
  Camera,
} from 'lucide-react';
import {
  schoolInformationService,
  SchoolInformation,
  CreateSchoolInformationRequest,
} from '@/api/services/school-information.service';

// InputGroup component moved outside to prevent recreation on every render
const InputGroup = ({
  icon,
  label,
  value,
  field,
  placeholder,
  type = 'text',
  isTextarea = false,
  required = false,
  isEditing,
  errors,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  field: string;
  placeholder: string;
  type?: string;
  isTextarea?: boolean;
  required?: boolean;
  isEditing: boolean;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
}) => (
  <div className='space-y-3'>
    <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
      {icon}
      {label}
      {required && <span className='text-red-500'>*</span>}
    </label>
    {isTextarea ? (
      <Textarea
        value={value as string}
        onChange={e => onChange(field, e.target.value)}
        className={`w-full min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm ${
          !isEditing ? 'bg-gray-50 cursor-default' : ''
        } ${errors[field] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
        placeholder={placeholder}
        readOnly={!isEditing}
      />
    ) : (
      <Input
        value={value}
        onChange={e =>
          onChange(
            field,
            type === 'number' ? parseInt(e.target.value) || 0 : e.target.value,
          )
        }
        className={`w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm ${
          !isEditing ? 'bg-gray-50 cursor-default' : ''
        } ${errors[field] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
        placeholder={placeholder}
        type={type}
        readOnly={!isEditing}
      />
    )}
    {errors[field] && (
      <p className='text-sm text-red-600 flex items-center gap-1'>
        <AlertCircle className='w-4 h-4' />
        {errors[field]}
      </p>
    )}
  </div>
);

// Dynamic array input component for emails and contact numbers
const DynamicArrayInput = ({
  icon,
  label,
  items,
  field,
  placeholder,
  type = 'text',
  isEditing,
  errors,
  onItemChange,
  onAddItem,
  onRemoveItem,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  field: 'emails' | 'contactNumbers';
  placeholder: string;
  type?: string;
  isEditing: boolean;
  errors: Record<string, string>;
  onItemChange: (
    field: 'emails' | 'contactNumbers',
    index: number,
    value: string,
  ) => void;
  onAddItem: (field: 'emails' | 'contactNumbers') => void;
  onRemoveItem: (field: 'emails' | 'contactNumbers', index: number) => void;
}) => (
  <div className='space-y-3'>
    <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
      {icon}
      {label}
      <span className='text-xs text-gray-500'>(Optional)</span>
    </label>

    <div className='space-y-2'>
      {items.map((item, index) => (
        <div key={index} className='flex items-center gap-2'>
          <Input
            value={item}
            onChange={e => onItemChange(field, index, e.target.value)}
            className={`flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm ${
              !isEditing ? 'bg-gray-50 cursor-default' : ''
            } ${errors[`${field.slice(0, -1)}_${index}`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder={placeholder}
            type={type}
            readOnly={!isEditing}
          />
          {isEditing && (
            <button
              type='button'
              onClick={() => onRemoveItem(field, index)}
              className='p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors'
            >
              <Trash2 className='w-4 h-4' />
            </button>
          )}
        </div>
      ))}

      {isEditing && (
        <button
          type='button'
          onClick={() => onAddItem(field)}
          className='flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm'
        >
          <Plus className='w-4 h-4' />
          Add {label.slice(0, -1)}
        </button>
      )}

      {items.length === 0 && !isEditing && (
        <p className='text-sm text-gray-500 italic'>
          No {label.toLowerCase()} added
        </p>
      )}

      {/* Show validation errors */}
      {items.map((_, index) => {
        const errorKey = `${field.slice(0, -1)}_${index}`;
        return errors[errorKey] ? (
          <p
            key={errorKey}
            className='text-sm text-red-600 flex items-center gap-1'
          >
            <AlertCircle className='w-4 h-4' />
            {errors[errorKey]}
          </p>
        ) : null;
      })}
    </div>
  </div>
);

export default function SchoolInformationTab() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInformation | null>(null);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    establishedYear: new Date().getFullYear(),
    address: '',
    website: '',
    emails: [] as string[],
    contactNumbers: [] as string[],
    logo: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load school information on component mount
  useEffect(() => {
    loadSchoolInformation();
  }, []);

  // Update form data when school info changes
  useEffect(() => {
    if (schoolInfo) {
      setFormData({
        schoolName: schoolInfo.schoolName,
        schoolCode: schoolInfo.schoolCode,
        establishedYear: schoolInfo.establishedYear,
        address: schoolInfo.address,
        website: schoolInfo.website || '',
        emails: schoolInfo.emails || [],
        contactNumbers: schoolInfo.contactNumbers || [],
        logo: schoolInfo.logo || '',
      });
      setLogoPreview(schoolInfo.logo || '');
    }
  }, [schoolInfo]);

  const loadSchoolInformation = async () => {
    setIsLoading(true);
    try {
      const response = await schoolInformationService.getSchoolInformation();
      if (response.success) {
        setSchoolInfo(response.data);
      } else {
        console.warn('Failed to load school information:', response.message);
      }
    } catch (error) {
      console.error('Error loading school information:', error);
      toast.error('Failed to load school information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleArrayItemChange = (
    field: 'emails' | 'contactNumbers',
    index: number,
    value: string,
  ) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'emails' | 'contactNumbers') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (
    field: 'emails' | 'contactNumbers',
    index: number,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should be less than 2MB');
        return;
      }

      // Store file for potential upload

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleLogoRemove = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }

    if (!formData.schoolCode.trim()) {
      newErrors.schoolCode = 'School code is required';
    }

    if (
      !formData.establishedYear ||
      formData.establishedYear < 1800 ||
      formData.establishedYear > new Date().getFullYear()
    ) {
      newErrors.establishedYear = 'Please enter a valid establishment year';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Validate website if provided
    if (formData.website && formData.website.trim()) {
      const urlPattern = /^https?:\/\/.+\..+/;
      if (!urlPattern.test(formData.website.trim())) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    // Validate emails
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    formData.emails.forEach((email, index) => {
      if (email.trim() && !emailPattern.test(email.trim())) {
        newErrors[`email_${index}`] = 'Please enter a valid email address';
      }
    });

    // Validate contact numbers
    formData.contactNumbers.forEach((number, index) => {
      if (number.trim() && number.trim().length < 10) {
        newErrors[`contact_${index}`] =
          'Contact number should be at least 10 digits';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    // Check if user is superadmin
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Only Super Admin can modify school information');
      return;
    }

    setIsSaving(true);
    try {
      const requestData: CreateSchoolInformationRequest = {
        schoolName: formData.schoolName.trim(),
        schoolCode: formData.schoolCode.trim(),
        establishedYear: formData.establishedYear,
        address: formData.address.trim(),
        website: formData.website.trim() || undefined,
        emails: formData.emails
          .filter(email => email.trim())
          .map(email => email.trim()),
        contactNumbers: formData.contactNumbers
          .filter(number => number.trim())
          .map(number => number.trim()),
        logo: logoPreview || undefined,
      };

      const response =
        await schoolInformationService.createOrUpdateSchoolInformation(
          requestData,
        );

      if (response.success) {
        setSchoolInfo(response.data);
        toast.success('School information saved successfully');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to save school information');
      }
    } catch (error) {
      console.error('Error saving school information:', error);
      toast.error('Failed to save school information');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='flex items-center gap-3'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
          <span className='text-gray-600'>Loading school information...</span>
        </div>
      </div>
    );
  }

  // Show access denied for non-superadmin users when editing
  if (isEditing && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className='space-y-8'>
        <Card className='p-6 border border-red-200 bg-red-50'>
          <div className='flex items-center gap-4'>
            <AlertCircle className='h-8 w-8 text-red-600' />
            <div>
              <h3 className='text-lg font-semibold text-red-800'>
                Access Restricted
              </h3>
              <p className='text-red-700 mt-1'>
                Only Super Admin can modify school information settings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Action Buttons */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className='flex justify-end gap-3'>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors'
            >
              <Edit2 className='h-4 w-4' />
              Edit Settings
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className='px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors'
              >
                {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                {isSaving ? 'Saving...' : 'Save School Information'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Basic Information */}
      <Card className='p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl'>
            <Building2 className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              School Information
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              {schoolInfo
                ? "Configure your school's basic information and settings"
                : "Set up your school's basic information for the first time"}
            </p>
          </div>
        </div>

        {/* Show empty state if no school info exists */}
        {!schoolInfo && !isEditing ? (
          <div className='text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
            <Building2 className='mx-auto h-16 w-16 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No School Information Found
            </h3>
            <p className='text-gray-600 mb-4'>
              School information has not been set up yet. Contact your Super
              Admin to configure the school details.
            </p>
            {user?.role === 'SUPER_ADMIN' && (
              <p className='text-sm text-blue-600'>
                Click "Edit Settings" to set up your school information.
              </p>
            )}
          </div>
        ) : (
          <div className='space-y-8'>
            {/* Logo and Basic Info Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Logo Section */}
              <div className='lg:col-span-1'>
                <div className='sticky top-6'>
                  <Card className='p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'>
                    <div className='text-center'>
                      <h4 className='text-lg font-semibold text-gray-800 mb-4'>
                        School Logo
                      </h4>

                      {/* Logo Display */}
                      <div className='w-32 h-32 mx-auto mb-4 rounded-xl bg-white shadow-inner border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden'>
                        {logoPreview ? (
                          <Image
                            src={logoPreview}
                            alt='School Logo'
                            width={128}
                            height={128}
                            className='w-full h-full object-cover rounded-lg'
                          />
                        ) : (
                          <div className='text-center'>
                            <Building2 className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                            <p className='text-xs text-gray-500'>
                              No logo uploaded
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Logo Actions */}
                      {isEditing && (
                        <div className='space-y-2'>
                          <Button
                            type='button'
                            onClick={handleLogoUpload}
                            variant='outline'
                            className='w-full text-sm'
                          >
                            <Camera className='w-4 h-4 mr-2' />
                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                          {logoPreview && (
                            <Button
                              type='button'
                              onClick={handleLogoRemove}
                              variant='ghost'
                              className='w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50'
                            >
                              <Trash2 className='w-4 h-4 mr-2' />
                              Remove Logo
                            </Button>
                          )}
                          <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleFileChange}
                            className='hidden'
                          />
                          <p className='text-xs text-gray-500 mt-2'>
                            JPG, PNG or GIF up to 2MB
                          </p>
                        </div>
                      )}

                      {/* Display mode info */}
                      {!isEditing && !logoPreview && (
                        <p className='text-sm text-gray-500'>
                          No logo uploaded yet
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Basic Information */}
              <div className='lg:col-span-2 space-y-6'>
                <Card className='p-6 border border-gray-200'>
                  <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                    <Building2 className='w-5 h-5 text-blue-600' />
                    Basic Information
                  </h4>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <InputGroup
                      icon={<Building2 className='h-4 w-4 text-blue-500' />}
                      label='School Name'
                      value={formData.schoolName}
                      field='schoolName'
                      placeholder='Enter school name'
                      required={true}
                      isEditing={isEditing}
                      errors={errors}
                      onChange={handleInputChange}
                    />

                    <InputGroup
                      icon={<Hash className='h-4 w-4 text-green-500' />}
                      label='School Code'
                      value={formData.schoolCode}
                      field='schoolCode'
                      placeholder='Enter school code'
                      required={true}
                      isEditing={isEditing}
                      errors={errors}
                      onChange={handleInputChange}
                    />

                    <InputGroup
                      icon={<Calendar className='h-4 w-4 text-purple-500' />}
                      label='Established Year'
                      value={formData.establishedYear}
                      field='establishedYear'
                      placeholder='Enter establishment year'
                      type='number'
                      required={true}
                      isEditing={isEditing}
                      errors={errors}
                      onChange={handleInputChange}
                    />

                    <InputGroup
                      icon={<Globe className='h-4 w-4 text-indigo-500' />}
                      label='Website'
                      value={formData.website}
                      field='website'
                      placeholder='https://www.yourschool.com'
                      type='url'
                      required={false}
                      isEditing={isEditing}
                      errors={errors}
                      onChange={handleInputChange}
                    />

                    <div className='md:col-span-2'>
                      <InputGroup
                        icon={<MapPin className='h-4 w-4 text-orange-500' />}
                        label='Address'
                        value={formData.address}
                        field='address'
                        placeholder='Enter complete address'
                        isTextarea={true}
                        required={true}
                        isEditing={isEditing}
                        errors={errors}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Contact Information */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Phone className='w-5 h-5 text-teal-600' />
                Contact Information
                <span className='text-sm text-gray-500 font-normal'>
                  (Optional)
                </span>
              </h4>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <DynamicArrayInput
                  icon={<Mail className='h-4 w-4 text-red-500' />}
                  label='Email Addresses'
                  items={formData.emails}
                  field='emails'
                  placeholder='Enter email address'
                  type='email'
                  isEditing={isEditing}
                  errors={errors}
                  onItemChange={handleArrayItemChange}
                  onAddItem={addArrayItem}
                  onRemoveItem={removeArrayItem}
                />

                <DynamicArrayInput
                  icon={<Phone className='h-4 w-4 text-teal-500' />}
                  label='Contact Numbers'
                  items={formData.contactNumbers}
                  field='contactNumbers'
                  placeholder='Enter contact number'
                  type='tel'
                  isEditing={isEditing}
                  errors={errors}
                  onItemChange={handleArrayItemChange}
                  onAddItem={addArrayItem}
                  onRemoveItem={removeArrayItem}
                />
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Information Notice */}
      {user?.role !== 'SUPER_ADMIN' && (
        <Card className='p-4 bg-blue-50 border border-blue-200'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5' />
            <div>
              <h4 className='text-sm font-medium text-blue-800'>Information</h4>
              <p className='text-sm text-blue-700 mt-1'>
                Only Super Admin users can modify school information settings.
                Contact your Super Admin if you need to update these details.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
