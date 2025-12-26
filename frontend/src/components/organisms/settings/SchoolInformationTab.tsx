'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import EthnicitySelect from '@/components/molecules/form/EthnicitySelect';
import { ClassService } from '@/api/services/class.service';
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
  Banknote,
  User,
  GraduationCap,
  Layers,
  Check,
} from 'lucide-react';
import {
  schoolInformationService,
  SchoolInformation,
  CreateSchoolInformationRequest,
} from '@/api/services/school-information.service';

type Gender = 'Male' | 'Female' | 'Other' | '';

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
            type === 'number'
              ? e.target.value === ''
                ? ''
                : Number(e.target.value)
              : e.target.value,
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

const CheckboxField = ({
  label,
  value,
  field,
  isEditing,
  onChange,
}: {
  label: string;
  value: boolean;
  field: string;
  isEditing: boolean;
  onChange: (field: string, checked: boolean) => void;
}) => (
  <label className='flex items-center gap-3 text-sm font-medium text-gray-700'>
    <input
      type='checkbox'
      checked={value}
      onChange={e => onChange(field, e.target.checked)}
      disabled={!isEditing}
      className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
    />
    {label}
  </label>
);

export default function SchoolInformationTab() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInformation | null>(null);
  const [availableGrades, setAvailableGrades] = useState<number[]>([]);
  const [formData, setFormData] = useState<{
    schoolName: string;
    schoolCode: string;
    establishedYear: number;
    address: string;
    website: string;
    emails: string[];
    contactNumbers: string[];
    logo: string;
    province: string;
    district: string;
    municipality: string;
    ward: string;
    schoolClassification: string;
    schoolType: string;
    classRegisteredUpto: string;
    seeCode: string;
    hsebCode: string;
    phoneNumber: string;
    email: string;
    bank: string;
    accountNumber: string;
    panNumber: string;
    headTeacherName: string;
    headTeacherContactNumber: string;
    headTeacherQualification: string;
    headTeacherGender: Gender;
    headTeacherIsTeaching: boolean;
    headTeacherCaste: string;
    grantReceivingFrom: string;
    latitude: number | '';
    longitude: number | '';
    elevation: number | '';
    hasEcdLevel: boolean;
    hasBasicLevel1To5: boolean;
    hasBasicLevel6To8: boolean;
    ecdApprovalDate: string;
    primaryApprovalDate: string;
    lowerSecondaryApprovalDate: string;
    runningEcdPpc: boolean;
    runningGrade1: boolean;
    runningGrade2: boolean;
    runningGrade3: boolean;
    runningGrade4: boolean;
    runningGrade5: boolean;
    runningGrade6: boolean;
    runningGrade7: boolean;
    runningGrade8: boolean;
    runningGrade9: boolean;
    runningGrade10: boolean;
    runningGrade11: boolean;
    runningGrade12: boolean;
    scienceSubjectTaughtIn11And12: boolean;
    selectedForModelSchool: boolean;
    complaintHearingMechanism: boolean;
    foreignAffiliation: boolean;
    informalSchool: boolean;
    mobileSchool: boolean;
    openSchool: boolean;
    specialDisabilitySchool: boolean;
    multilingualEducation: boolean;
    mgmlImplemented: boolean;
    residentialScholarshipProgram: boolean;
    zeroPositionGrantBasicSchool: boolean;
    technicalStreamRunning: boolean;
  }>({
    schoolName: '',
    schoolCode: '',
    establishedYear: new Date().getFullYear(),
    address: '',
    website: '',
    emails: [] as string[],
    contactNumbers: [] as string[],
    logo: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    schoolClassification: '',
    schoolType: '',
    classRegisteredUpto: '',
    seeCode: '',
    hsebCode: '',
    phoneNumber: '',
    email: '',
    bank: '',
    accountNumber: '',
    panNumber: '',
    headTeacherName: '',
    headTeacherContactNumber: '',
    headTeacherQualification: '',
    headTeacherGender: '',
    headTeacherIsTeaching: false,
    headTeacherCaste: '',
    grantReceivingFrom: '',
    latitude: '' as number | '',
    longitude: '' as number | '',
    elevation: '' as number | '',
    hasEcdLevel: false,
    hasBasicLevel1To5: false,
    hasBasicLevel6To8: false,
    ecdApprovalDate: '',
    primaryApprovalDate: '',
    lowerSecondaryApprovalDate: '',
    runningEcdPpc: false,
    runningGrade1: false,
    runningGrade2: false,
    runningGrade3: false,
    runningGrade4: false,
    runningGrade5: false,
    runningGrade6: false,
    runningGrade7: false,
    runningGrade8: false,
    runningGrade9: false,
    runningGrade10: false,
    runningGrade11: false,
    runningGrade12: false,
    scienceSubjectTaughtIn11And12: false,
    selectedForModelSchool: false,
    complaintHearingMechanism: false,
    foreignAffiliation: false,
    informalSchool: false,
    mobileSchool: false,
    openSchool: false,
    specialDisabilitySchool: false,
    multilingualEducation: false,
    mgmlImplemented: false,
    residentialScholarshipProgram: false,
    zeroPositionGrantBasicSchool: false,
    technicalStreamRunning: false,
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const classService = new ClassService();

  // Load school information on component mount
  useEffect(() => {
    loadSchoolInformation();
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const res = await classService.getAllClasses();
      if (res.success && Array.isArray(res.data)) {
        const grades = Array.from(
          new Set(
            res.data
              .map(c => c.grade)
              .filter(g => typeof g === 'number' && g > 0 && g <= 12),
          ),
        ).sort((a, b) => a - b);
        setAvailableGrades(grades);
      }
    } catch (error) {
      console.warn('Failed to load class grades', error);
    }
  };

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
        province: schoolInfo.province || '',
        district: schoolInfo.district || '',
        municipality: schoolInfo.municipality || '',
        ward: schoolInfo.ward || '',
        schoolClassification: schoolInfo.schoolClassification || '',
        schoolType: schoolInfo.schoolType || '',
        classRegisteredUpto: schoolInfo.classRegisteredUpto || '',
        seeCode: schoolInfo.seeCode || '',
        hsebCode: schoolInfo.hsebCode || '',
        phoneNumber: schoolInfo.phoneNumber || '',
        email: schoolInfo.email || '',
        bank: schoolInfo.bank || '',
        accountNumber: schoolInfo.accountNumber || '',
        panNumber: schoolInfo.panNumber || '',
        headTeacherName: schoolInfo.headTeacherName || '',
        headTeacherContactNumber: schoolInfo.headTeacherContactNumber || '',
        headTeacherQualification: schoolInfo.headTeacherQualification || '',
        headTeacherGender:
          (schoolInfo.headTeacherGender as Gender | null) || '',
        headTeacherIsTeaching: schoolInfo.headTeacherIsTeaching ?? false,
        headTeacherCaste: schoolInfo.headTeacherCaste || '',
        grantReceivingFrom: schoolInfo.grantReceivingFrom || '',
        latitude:
          schoolInfo.latitude === null || schoolInfo.latitude === undefined
            ? ''
            : schoolInfo.latitude,
        longitude:
          schoolInfo.longitude === null || schoolInfo.longitude === undefined
            ? ''
            : schoolInfo.longitude,
        elevation:
          schoolInfo.elevation === null || schoolInfo.elevation === undefined
            ? ''
            : schoolInfo.elevation,
        hasEcdLevel: schoolInfo.hasEcdLevel ?? false,
        hasBasicLevel1To5: schoolInfo.hasBasicLevel1To5 ?? false,
        hasBasicLevel6To8: schoolInfo.hasBasicLevel6To8 ?? false,
        ecdApprovalDate: schoolInfo.ecdApprovalDate || '',
        primaryApprovalDate: schoolInfo.primaryApprovalDate || '',
        lowerSecondaryApprovalDate: schoolInfo.lowerSecondaryApprovalDate || '',
        runningEcdPpc: schoolInfo.runningEcdPpc ?? false,
        runningGrade1: schoolInfo.runningGrade1 ?? false,
        runningGrade2: schoolInfo.runningGrade2 ?? false,
        runningGrade3: schoolInfo.runningGrade3 ?? false,
        runningGrade4: schoolInfo.runningGrade4 ?? false,
        runningGrade5: schoolInfo.runningGrade5 ?? false,
        runningGrade6: schoolInfo.runningGrade6 ?? false,
        runningGrade7: schoolInfo.runningGrade7 ?? false,
        runningGrade8: schoolInfo.runningGrade8 ?? false,
        runningGrade9: schoolInfo.runningGrade9 ?? false,
        runningGrade10: schoolInfo.runningGrade10 ?? false,
        runningGrade11: schoolInfo.runningGrade11 ?? false,
        runningGrade12: schoolInfo.runningGrade12 ?? false,
        scienceSubjectTaughtIn11And12:
          schoolInfo.scienceSubjectTaughtIn11And12 ?? false,
        selectedForModelSchool: schoolInfo.selectedForModelSchool ?? false,
        complaintHearingMechanism:
          schoolInfo.complaintHearingMechanism ?? false,
        foreignAffiliation: schoolInfo.foreignAffiliation ?? false,
        informalSchool: schoolInfo.informalSchool ?? false,
        mobileSchool: schoolInfo.mobileSchool ?? false,
        openSchool: schoolInfo.openSchool ?? false,
        specialDisabilitySchool: schoolInfo.specialDisabilitySchool ?? false,
        multilingualEducation: schoolInfo.multilingualEducation ?? false,
        mgmlImplemented: schoolInfo.mgmlImplemented ?? false,
        residentialScholarshipProgram:
          schoolInfo.residentialScholarshipProgram ?? false,
        zeroPositionGrantBasicSchool:
          schoolInfo.zeroPositionGrantBasicSchool ?? false,
        technicalStreamRunning: schoolInfo.technicalStreamRunning ?? false,
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

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
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
        province: formData.province.trim() || undefined,
        district: formData.district.trim() || undefined,
        municipality: formData.municipality.trim() || undefined,
        ward: formData.ward.trim() || undefined,
        schoolClassification: formData.schoolClassification.trim() || undefined,
        schoolType: formData.schoolType.trim() || undefined,
        classRegisteredUpto: formData.classRegisteredUpto.trim() || undefined,
        seeCode: formData.seeCode.trim() || undefined,
        hsebCode: formData.hsebCode.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        email: formData.email.trim() || undefined,
        bank: formData.bank.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        panNumber: formData.panNumber.trim() || undefined,
        headTeacherName: formData.headTeacherName.trim() || undefined,
        headTeacherContactNumber:
          formData.headTeacherContactNumber.trim() || undefined,
        headTeacherQualification:
          formData.headTeacherQualification.trim() || undefined,
        headTeacherGender: formData.headTeacherGender || undefined,
        headTeacherIsTeaching: formData.headTeacherIsTeaching,
        headTeacherCaste: formData.headTeacherCaste.trim() || undefined,
        grantReceivingFrom: formData.grantReceivingFrom.trim() || undefined,
        latitude:
          formData.latitude === '' ? undefined : Number(formData.latitude),
        longitude:
          formData.longitude === '' ? undefined : Number(formData.longitude),
        elevation:
          formData.elevation === '' ? undefined : Number(formData.elevation),
        hasEcdLevel: formData.hasEcdLevel,
        hasBasicLevel1To5: formData.hasBasicLevel1To5,
        hasBasicLevel6To8: formData.hasBasicLevel6To8,
        ecdApprovalDate: formData.ecdApprovalDate || undefined,
        primaryApprovalDate: formData.primaryApprovalDate || undefined,
        lowerSecondaryApprovalDate:
          formData.lowerSecondaryApprovalDate || undefined,
        runningEcdPpc: formData.runningEcdPpc,
        runningGrade1: formData.runningGrade1,
        runningGrade2: formData.runningGrade2,
        runningGrade3: formData.runningGrade3,
        runningGrade4: formData.runningGrade4,
        runningGrade5: formData.runningGrade5,
        runningGrade6: formData.runningGrade6,
        runningGrade7: formData.runningGrade7,
        runningGrade8: formData.runningGrade8,
        runningGrade9: formData.runningGrade9,
        runningGrade10: formData.runningGrade10,
        runningGrade11: formData.runningGrade11,
        runningGrade12: formData.runningGrade12,
        scienceSubjectTaughtIn11And12: formData.scienceSubjectTaughtIn11And12,
        selectedForModelSchool: formData.selectedForModelSchool,
        complaintHearingMechanism: formData.complaintHearingMechanism,
        foreignAffiliation: formData.foreignAffiliation,
        informalSchool: formData.informalSchool,
        mobileSchool: formData.mobileSchool,
        openSchool: formData.openSchool,
        specialDisabilitySchool: formData.specialDisabilitySchool,
        multilingualEducation: formData.multilingualEducation,
        mgmlImplemented: formData.mgmlImplemented,
        residentialScholarshipProgram: formData.residentialScholarshipProgram,
        zeroPositionGrantBasicSchool: formData.zeroPositionGrantBasicSchool,
        technicalStreamRunning: formData.technicalStreamRunning,
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
                      label='IEMIS Code'
                      value={formData.schoolCode}
                      field='schoolCode'
                      placeholder='Enter IEMIS code'
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

            {/* Location & Classification */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-orange-600' />
                Location & Classification
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Province'
                  value={formData.province}
                  field='province'
                  placeholder='Province'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='District'
                  value={formData.district}
                  field='district'
                  placeholder='District'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Municipality'
                  value={formData.municipality}
                  field='municipality'
                  placeholder='Municipality'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Ward'
                  value={formData.ward}
                  field='ward'
                  placeholder='Ward'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Building2 className='h-4 w-4 text-blue-500' />}
                  label='School Classification'
                  value={formData.schoolClassification}
                  field='schoolClassification'
                  placeholder='Classification'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Building2 className='h-4 w-4 text-blue-500' />}
                  label='School Type'
                  value={formData.schoolType}
                  field='schoolType'
                  placeholder='School Type'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Hash className='h-4 w-4 text-green-500' />}
                  label='Class Registered Upto'
                  value={formData.classRegisteredUpto}
                  field='classRegisteredUpto'
                  placeholder='e.g., Grade 12'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Hash className='h-4 w-4 text-green-500' />}
                  label='SEE Code'
                  value={formData.seeCode}
                  field='seeCode'
                  placeholder='SEE Code'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Hash className='h-4 w-4 text-green-500' />}
                  label='HSEB Code'
                  value={formData.hsebCode}
                  field='hsebCode'
                  placeholder='HSEB Code'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            {/* Contact & Finance */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Phone className='w-5 h-5 text-blue-600' />
                Contact & Finance
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <InputGroup
                  icon={<Phone className='h-4 w-4 text-teal-500' />}
                  label='Phone Number'
                  value={formData.phoneNumber}
                  field='phoneNumber'
                  placeholder='Primary phone number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Mail className='h-4 w-4 text-red-500' />}
                  label='Email'
                  value={formData.email}
                  field='email'
                  placeholder='Primary email'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Banknote className='h-4 w-4 text-green-600' />}
                  label='Bank'
                  value={formData.bank}
                  field='bank'
                  placeholder='Bank name'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Hash className='h-4 w-4 text-green-600' />}
                  label='Account Number'
                  value={formData.accountNumber}
                  field='accountNumber'
                  placeholder='Account number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Hash className='h-4 w-4 text-green-600' />}
                  label='PAN Number'
                  value={formData.panNumber}
                  field='panNumber'
                  placeholder='PAN number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            {/* Head Teacher */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <User className='w-5 h-5 text-purple-600' />
                Head Teacher Information
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <InputGroup
                  icon={<User className='h-4 w-4 text-purple-500' />}
                  label="Head Teacher's Name"
                  value={formData.headTeacherName}
                  field='headTeacherName'
                  placeholder='Full name'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Phone className='h-4 w-4 text-teal-500' />}
                  label="Head Teacher's Contact Number"
                  value={formData.headTeacherContactNumber}
                  field='headTeacherContactNumber'
                  placeholder='Contact number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<GraduationCap className='h-4 w-4 text-indigo-500' />}
                  label="Head Teacher's Qualification"
                  value={formData.headTeacherQualification}
                  field='headTeacherQualification'
                  placeholder='Qualification'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <div className='space-y-3'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <User className='h-4 w-4 text-purple-500' />
                    Head Teacher Gender
                  </label>
                  <select
                    value={formData.headTeacherGender}
                    onChange={e =>
                      handleInputChange(
                        'headTeacherGender',
                        e.target.value as Gender,
                      )
                    }
                    disabled={!isEditing}
                    className='w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white'
                  >
                    <option value=''>Select</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Other'>Other</option>
                  </select>
                </div>
                <CheckboxField
                  label='Is Head Teacher Teaching?'
                  value={formData.headTeacherIsTeaching}
                  field='headTeacherIsTeaching'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <div className='space-y-3'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <User className='h-4 w-4 text-purple-500' />
                    Head Teacher Caste
                  </label>
                  <EthnicitySelect
                    value={formData.headTeacherCaste}
                    onChange={value =>
                      handleInputChange('headTeacherCaste', value)
                    }
                    disabled={!isEditing}
                    placeholder='Select ethnicity'
                  />
                </div>
              </div>
            </Card>

            {/* Grants & Geography */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Globe className='w-5 h-5 text-indigo-600' />
                Grants & Geographic Details
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <InputGroup
                  icon={<Banknote className='h-4 w-4 text-green-600' />}
                  label='Grant Receiving From'
                  value={formData.grantReceivingFrom}
                  field='grantReceivingFrom'
                  placeholder='Grant source'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Latitude'
                  value={formData.latitude}
                  field='latitude'
                  placeholder='e.g., 27.7172'
                  type='number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Longitude'
                  value={formData.longitude}
                  field='longitude'
                  placeholder='e.g., 85.3240'
                  type='number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<MapPin className='h-4 w-4 text-orange-500' />}
                  label='Elevation'
                  value={formData.elevation}
                  field='elevation'
                  placeholder='Elevation (meters)'
                  type='number'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            {/* Levels & Approval Dates */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Layers className='w-5 h-5 text-blue-600' />
                Levels & Approval Dates
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <CheckboxField
                  label='Has ECD Level'
                  value={formData.hasEcdLevel}
                  field='hasEcdLevel'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Basic Level (1–5)'
                  value={formData.hasBasicLevel1To5}
                  field='hasBasicLevel1To5'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Basic Level (6–8)'
                  value={formData.hasBasicLevel6To8}
                  field='hasBasicLevel6To8'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <InputGroup
                  icon={<Calendar className='h-4 w-4 text-purple-500' />}
                  label='ECD Approval Date'
                  value={formData.ecdApprovalDate}
                  field='ecdApprovalDate'
                  placeholder=''
                  type='date'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Calendar className='h-4 w-4 text-purple-500' />}
                  label='Primary Approval Date'
                  value={formData.primaryApprovalDate}
                  field='primaryApprovalDate'
                  placeholder=''
                  type='date'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
                <InputGroup
                  icon={<Calendar className='h-4 w-4 text-purple-500' />}
                  label='Lower Secondary Approval Date'
                  value={formData.lowerSecondaryApprovalDate}
                  field='lowerSecondaryApprovalDate'
                  placeholder=''
                  type='date'
                  isEditing={isEditing}
                  errors={errors}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            {/* Running Grades */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Building2 className='w-5 h-5 text-blue-600' />
                Running Grades
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <CheckboxField
                  label='ECD / PPC'
                  value={formData.runningEcdPpc}
                  field='runningEcdPpc'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                {(availableGrades.length
                  ? availableGrades.filter(g => g >= 1 && g <= 12)
                  : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                ).map(grade => (
                  <CheckboxField
                    key={grade}
                    label={`Grade ${grade}`}
                    value={(formData as any)[`runningGrade${grade}`]}
                    field={`runningGrade${grade}`}
                    isEditing={isEditing}
                    onChange={handleCheckboxChange}
                  />
                ))}
              </div>
            </Card>

            {/* Status & Program Indicators */}
            <Card className='p-6 border border-gray-200'>
              <h4 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
                <Check className='w-5 h-5 text-green-600' />
                School Status & Program Indicators
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <CheckboxField
                  label='Science Subject Taught in Grade 11–12'
                  value={formData.scienceSubjectTaughtIn11And12}
                  field='scienceSubjectTaughtIn11And12'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Selected for Model School Development'
                  value={formData.selectedForModelSchool}
                  field='selectedForModelSchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Complaint Hearing Mechanism Available'
                  value={formData.complaintHearingMechanism}
                  field='complaintHearingMechanism'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Operated with Affiliation from Foreign Educational Institution'
                  value={formData.foreignAffiliation}
                  field='foreignAffiliation'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Informal School'
                  value={formData.informalSchool}
                  field='informalSchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Mobile (Ghunti) School'
                  value={formData.mobileSchool}
                  field='mobileSchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Open School'
                  value={formData.openSchool}
                  field='openSchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='School for Children with Special Disabilities'
                  value={formData.specialDisabilitySchool}
                  field='specialDisabilitySchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Multilingual Education School'
                  value={formData.multilingualEducation}
                  field='multilingualEducation'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='MGML Implemented'
                  value={formData.mgmlImplemented}
                  field='mgmlImplemented'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Residential Scholarship Program Running'
                  value={formData.residentialScholarshipProgram}
                  field='residentialScholarshipProgram'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Zero-Position Grant Receiving Basic School'
                  value={formData.zeroPositionGrantBasicSchool}
                  field='zeroPositionGrantBasicSchool'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label='Technical Stream Running in School'
                  value={formData.technicalStreamRunning}
                  field='technicalStreamRunning'
                  isEditing={isEditing}
                  onChange={handleCheckboxChange}
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
