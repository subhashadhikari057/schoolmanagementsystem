'use client';

import React, { useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import {
  profileApi,
  UserProfile,
  UpdateProfileDto,
} from '@/api/services/profile';
import { useAuth } from '@/hooks/useAuth';

// Define the field type structure
interface FormField {
  label: string;
  key: string;
  value: string;
  readOnly: boolean;
  colSpan?: number;
  editable?: boolean;
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileDto>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const baseButtonClass = 'p-1 px-2 rounded-lg shadow-sm cursor-pointer';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile...');
      const userProfile = await profileApi.getProfile();
      console.log('Profile loaded:', userProfile);

      if (!userProfile || !userProfile.fullName) {
        console.error('Invalid profile data:', userProfile);
        setError('Invalid profile data received');
        return;
      }

      setProfile(userProfile);
      setFormData({
        fullName: userProfile.fullName,
        phone: userProfile.phone,
        teacherData: userProfile.teacherData
          ? {
              designation: userProfile.teacherData.designation,
              qualification: userProfile.teacherData.qualification,
              address: userProfile.teacherData.profile?.contactInfo?.address,
            }
          : undefined,
        studentData: userProfile.studentData
          ? {
              address: userProfile.studentData.profile?.additionalData?.address,
              interests: userProfile.studentData.profile?.interests?.hobbies,
            }
          : undefined,
        parentData: userProfile.parentData
          ? {
              occupation: userProfile.parentData.occupation,
              workPlace: userProfile.parentData.workPlace,
              address: userProfile.parentData.profile?.contactInfo?.address,
            }
          : undefined,
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(
        `Failed to load profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedProfile = await profileApi.updateProfile(formData);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName,
        phone: profile.phone,
        teacherData: profile.teacherData
          ? {
              designation: profile.teacherData.designation,
              qualification: profile.teacherData.qualification,
              address: profile.teacherData.profile?.contactInfo?.address,
            }
          : undefined,
        studentData: profile.studentData
          ? {
              address: profile.studentData.profile?.additionalData?.address,
              interests: profile.studentData.profile?.interests?.hobbies,
            }
          : undefined,
        parentData: profile.parentData
          ? {
              occupation: profile.parentData.occupation,
              workPlace: profile.parentData.workPlace,
              address: profile.parentData.profile?.contactInfo?.address,
            }
          : undefined,
      });
    }
    setError(null);
    setSuccess(null);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const getRoleSpecificFields = (): FormField[] => {
    if (!profile) return [];

    const baseFields: FormField[] = [
      {
        label: 'Full Name',
        key: 'fullName',
        value: formData.fullName || '',
        readOnly: !editing,
        editable: true,
      },
      {
        label: 'Email Address',
        key: 'email',
        value: profile.email,
        readOnly: true,
        editable: false,
      },
      {
        label: 'Phone Number',
        key: 'phone',
        value: formData.phone || '',
        readOnly: !editing,
        editable: true,
      },
    ];

    if (profile.teacherData) {
      return [
        ...baseFields,
        {
          label: 'Employee ID',
          key: 'employeeId',
          value: profile.teacherData.employeeId,
          readOnly: true,
          editable: false,
        },
        {
          label: 'Designation',
          key: 'teacherData.designation',
          value: formData.teacherData?.designation || '',
          readOnly: !editing,
          editable: true,
        },
        {
          label: 'Department',
          key: 'department',
          value: profile.teacherData.department,
          readOnly: true,
          editable: false,
        },
        {
          label: 'Qualification',
          key: 'teacherData.qualification',
          value: formData.teacherData?.qualification || '',
          readOnly: !editing,
          editable: true,
        },
        {
          label: 'Address',
          key: 'teacherData.address',
          value: formData.teacherData?.address || '',
          colSpan: 2,
          readOnly: !editing,
          editable: true,
        },
      ];
    }

    if (profile.studentData) {
      return [
        ...baseFields,
        {
          label: 'Student ID',
          key: 'studentId',
          value: profile.studentData.studentId,
          readOnly: true,
          editable: false,
        },
        {
          label: 'Roll Number',
          key: 'rollNumber',
          value: profile.studentData.rollNumber,
          readOnly: true,
          editable: false,
        },
        {
          label: 'Address',
          key: 'studentData.address',
          value: formData.studentData?.address || '',
          colSpan: 2,
          readOnly: !editing,
          editable: true,
        },
        {
          label: 'Interests',
          key: 'studentData.interests',
          value: formData.studentData?.interests || '',
          readOnly: !editing,
          editable: true,
        },
      ];
    }

    if (profile.parentData) {
      return [
        ...baseFields,
        {
          label: 'Occupation',
          key: 'parentData.occupation',
          value: formData.parentData?.occupation || '',
          readOnly: !editing,
          editable: true,
        },
        {
          label: 'Work Place',
          key: 'parentData.workPlace',
          value: formData.parentData?.workPlace || '',
          readOnly: !editing,
          editable: true,
        },
        {
          label: 'Address',
          key: 'parentData.address',
          value: formData.parentData?.address || '',
          colSpan: 2,
          readOnly: !editing,
          editable: true,
        },
      ];
    }

    // For Super Admin and other roles
    return [
      ...baseFields,
      {
        label: 'Role',
        key: 'role',
        value: profile.role,
        readOnly: true,
        editable: false,
      },
    ];
  };

  const handleInputChange = (key: string, value: string) => {
    if (!editing) return; // Prevent changes when not in edit mode

    const keys = key.split('.');
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [key]: value }));
    } else if (keys.length === 2) {
      setFormData(prev => {
        const currentValue = prev[keys[0] as keyof UpdateProfileDto];
        if (currentValue && typeof currentValue === 'object') {
          return {
            ...prev,
            [keys[0]]: {
              ...currentValue,
              [keys[1]]: value,
            },
          };
        }
        return prev;
      });
    }
  };

  if (loading) {
    return (
      <div className='w-full max-w-full mx-auto'>
        <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/3 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-12 bg-gray-200 rounded'></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const fields = getRoleSpecificFields();

  return (
    <div className='w-full max-w-full mx-auto'>
      <Card className='p-8 rounded-xl bg-white border border-gray-100 space-y-6'>
        <div className='flex justify-between items-start'>
          <div>
            <SectionTitle
              className='text-2xl font-semibold'
              text='Personal Information'
            />
            <Label className='text-sm text-muted-foreground'>
              Update your personal details and contact information
            </Label>
          </div>

          {!editing && (
            <ReusableButton
              label='Edit Profile'
              onClick={handleEdit}
              className={`${baseButtonClass} bg-blue-500 text-white hover:bg-blue-400`}
            />
          )}
        </div>

        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
            <Label className='text-red-600'>{error}</Label>
          </div>
        )}

        {success && (
          <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
            <Label className='text-green-600'>{success}</Label>
          </div>
        )}

        <div className='hidden sm:block h-[1px] bg-border mt-4' />
        <div className='pt-4'>
          <form className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            {fields.map((field, index) => (
              <div
                key={index}
                className={field.colSpan === 2 ? 'md:col-span-2' : ''}
              >
                <LabeledInputField
                  label={field.label}
                  value={field.value}
                  onChange={e => handleInputChange(field.key, e.target.value)}
                  readOnly={field.readOnly}
                />
              </div>
            ))}
          </form>

          {editing && (
            <div className='flex justify-end gap-4 mt-6'>
              <ReusableButton
                label='Cancel'
                onClick={handleCancel}
                className={`${baseButtonClass} border border-gray-300 hover:bg-gray-100`}
              />
              <ReusableButton
                label={saving ? 'Saving...' : 'Save Changes'}
                onClick={handleSave}
                className={`${baseButtonClass} bg-blue-500 text-white hover:bg-blue-400 ${saving ? 'opacity-50' : ''}`}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
