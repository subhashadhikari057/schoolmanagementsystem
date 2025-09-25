'use client';

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  profileApi,
  UserProfile,
  UpdateProfileDto,
} from '@/api/services/profile';
import {
  studentService,
  ParentInfo,
  StudentResponse,
} from '@/api/services/student.service';
import { teacherService } from '@/api/services/teacher.service';
import { TeacherListResponse } from '@/api/types/teacher';

// Local types used by this component
type ProfileSettingsHandle = {
  toggleEdit: () => void;
  closeEdit: () => void;
  isEditing: () => boolean;
  handleSave: () => void;
};

interface ProfileSettingsProps {
  onEditingChange?: (editing: boolean) => void;
  editing?: boolean;
}

type FormField = {
  label: string;
  key: string;
  value?: string | number | null;
  readOnly?: boolean;
  editable?: boolean;
  colSpan?: number;
};
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import ReusableButton from '@/components/atoms/form-controls/Button';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Label from '@/components/atoms/display/Label';
import { Card } from '@/components/ui/card';
import Avatar from '@/components/atoms/display/Avatar';

const ProfileSettings = forwardRef<ProfileSettingsHandle, ProfileSettingsProps>(
  (props, ref) => {
    const [studentDetails, setStudentDetails] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(
      undefined,
    );
    useEffect(() => {
      if (typeof props.editing === 'boolean') {
        setEditing(props.editing);
      }
    }, [props.editing]);
    const [formData, setFormData] = useState<UpdateProfileDto>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [externalParents, setExternalParents] = useState<ParentInfo[] | null>(
      null,
    );
    const [teacherDetails, setTeacherDetails] =
      useState<TeacherListResponse | null>(null);
    const [teacherLoading, setTeacherLoading] = useState(false);
    const baseButtonClass = 'p-1 px-2 rounded-lg shadow-sm cursor-pointer';

    // Function to fetch profile photo based on user role
    const fetchProfilePhoto = async (userId: string, role: string) => {
      try {
        const normalizedRole = role.toLowerCase().replace(/_/g, '');
        let profileData: any = null;

        switch (normalizedRole) {
          case 'student': {
            const studentResponse =
              await studentService.getStudentByUserId(userId);
            profileData = studentResponse.data;
            break;
          }
          case 'teacher': {
            const currentTeacherResp = await teacherService.getCurrentTeacher();
            if (currentTeacherResp?.success && currentTeacherResp.data) {
              const teacherResponse = await teacherService.getTeacherById(
                currentTeacherResp.data.id,
              );
              profileData = teacherResponse.data;
            }
            break;
          }
          case 'staff':
            // Staff service doesn't have getCurrentStaff, so we'll handle this differently
            console.log('Staff profile photo fetching not yet implemented');
            return;
          case 'parent':
            // Parent service doesn't have getCurrentParent, so we'll handle this differently
            console.log('Parent profile photo fetching not yet implemented');
            return;
          case 'superadmin':
          case 'admin':
          case 'accountant':
          default:
            // For admin roles, we might not have profile photos yet
            return;
        }

        if (profileData?.profilePhotoUrl) {
          setProfilePhotoUrl(profileData.profilePhotoUrl);
        }
      } catch (error) {
        console.log('Could not fetch profile photo:', error);
        // Silently fail - user will see initials instead
      }
    };

    useEffect(() => {
      // Fetch student details for parent info (for student dashboard)
      if (!profile || profile.role?.toLowerCase() !== 'student') return;
      let mounted = true;
      const fetchStudentDetails = async () => {
        try {
          const resp = await studentService.getStudentByUserId(profile.id);
          if (resp && resp.success && resp.data && mounted) {
            setStudentDetails(resp.data);
          }
        } catch (e) {
          // fallback: do nothing
        }
      };
      fetchStudentDetails();
      return () => {
        mounted = false;
      };
    }, [profile]);

    // Fetch teacher details (including bank info) when logged in as teacher
    useEffect(() => {
      if (!profile || profile.role?.toLowerCase() !== 'teacher') return;
      let mounted = true;
      const fetchTeacher = async () => {
        try {
          setTeacherLoading(true);
          // First get current teacher to get the teacher ID
          const currentTeacherResp = await teacherService.getCurrentTeacher();
          if (
            currentTeacherResp &&
            currentTeacherResp.success &&
            currentTeacherResp.data &&
            mounted
          ) {
            // Then fetch full teacher details including bank info
            const teacherResp = await teacherService.getTeacherById(
              currentTeacherResp.data.id,
            );
            if (
              teacherResp &&
              teacherResp.success &&
              teacherResp.data &&
              mounted
            ) {
              setTeacherDetails(teacherResp.data);
            }
          }
        } catch (e) {
          console.error('Failed to fetch teacher details:', e);
        } finally {
          if (mounted) setTeacherLoading(false);
        }
      };
      fetchTeacher();
      return () => {
        mounted = false;
      };
    }, [profile]);

    useEffect(() => {
      const load = async () => {
        try {
          setLoading(true);
          const userProfile = await profileApi.getProfile();
          if (!userProfile || !userProfile.fullName) {
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
                  address:
                    userProfile.teacherData.profile?.contactInfo?.address,
                }
              : undefined,
            studentData: userProfile.studentData
              ? {
                  address:
                    userProfile.studentData.profile?.additionalData?.address,
                  interests:
                    userProfile.studentData.profile?.interests?.hobbies,
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
          setError(
            err instanceof Error ? err.message : 'Failed to load profile',
          );
        } finally {
          setLoading(false);
        }
      };
      load();
    }, []);

    // Fetch profile photo when profile is loaded
    useEffect(() => {
      if (profile?.id && profile?.role) {
        fetchProfilePhoto(profile.id, profile.role);
      } else {
        setProfilePhotoUrl(undefined);
      }
    }, [profile?.id, profile?.role]);

    // For student dashboard: fetch parents from backend
    useEffect(() => {
      if (!profile || profile.role !== 'student') return;
      let mounted = true;
      const fetchParents = async () => {
        try {
          const resp = await studentService.getStudentParents(profile.id);
          if (
            resp &&
            resp.success &&
            Array.isArray(resp.data) &&
            resp.data.length > 0 &&
            mounted
          ) {
            setExternalParents(resp.data);
          }
        } catch (e) {
          // fallback: do nothing
        }
      };
      fetchParents();
      return () => {
        mounted = false;
      };
    }, [profile]);

    const handleSave = async () => {
      try {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const updatedProfile = await profileApi.updateProfile(formData);
        setProfile(updatedProfile);
        setSuccess('Profile updated successfully');
        setEditing(false);
        props.onEditingChange?.(false);
      } catch (err) {
        setError('Failed to update profile');
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
      props.onEditingChange?.(false);
    };

    const handleEdit = () => {
      setEditing(true);
      setError(null);
      setSuccess(null);
      props.onEditingChange?.(true);
    };

    useImperativeHandle(ref, () => ({
      toggleEdit: () => setEditing(true),
      closeEdit: () => setEditing(false),
      isEditing: () => editing,
      handleSave: handleSave,
    }));

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
      if (!editing) return;
      const keys = key.split('.');
      if (keys.length === 1) {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
      } else if (keys.length === 2) {
        setFormData((prev: any) => {
          const currentValue = prev[keys[0]];
          if (currentValue && typeof currentValue === 'object') {
            return {
              ...prev,
              [keys[0]]: { ...currentValue, [keys[1]]: value },
            };
          }
          return prev;
        });
      }
    };

    if (loading) {
      return (
        <div className='w-full mx-auto'>
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

    const display = (label: string, value?: string | number | null) => (
      <div className='flex items-start justify-between'>
        <div className='text-sm text-muted-foreground'>{label}</div>
        <div className='text-sm font-medium'>{value ?? '-'}</div>
      </div>
    );

    return (
      <div className='w-full mx-auto'>
        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-md mb-4'>
            <Label className='text-red-600'>{error}</Label>
          </div>
        )}
        {success && (
          <div className='p-4 bg-green-50 border border-green-200 rounded-md mb-4'>
            <Label className='text-green-600'>{success}</Label>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left column */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information Card */}
            <Card className='p-6 bg-white rounded-xl border border-gray-200'>
              <div className='flex justify-between items-start mb-2'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-base'>
                      Basic Information
                    </span>
                    {profile?.isActive && (
                      <span className='ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 font-medium'>
                        Active
                      </span>
                    )}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Personal and contact details
                  </div>
                </div>
              </div>
              <div className='flex gap-6 items-center mt-4'>
                <div className='flex flex-col items-center justify-center'>
                  <Avatar
                    src={profilePhotoUrl}
                    name={profile?.fullName || 'Unknown User'}
                    role={(profile?.role?.toLowerCase() as any) || 'student'}
                    className='w-16 h-16 rounded-full mb-2'
                    context='profile-settings'
                  />
                  <div className='text-base font-semibold'>
                    {editing ? (
                      <input
                        className='text-base font-semibold bg-transparent border-b border-gray-300 text-center'
                        value={formData.fullName || ''}
                        onChange={e =>
                          handleInputChange('fullName', e.target.value)
                        }
                      />
                    ) : (
                      (profile?.fullName ?? '-')
                    )}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {profile?.role ?? '-'}
                  </div>
                </div>
                <div className='flex-1 grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-xs text-muted-foreground'>
                      Employee/Student ID
                    </div>
                    <div className='font-medium text-sm'>
                      {profile?.teacherData?.employeeId ??
                        profile?.studentData?.studentId ??
                        studentDetails?.studentId ??
                        '-'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-2'>
                      Joined
                    </div>
                    <div className='font-medium text-sm'>
                      {profile?.createdAt?.split('T')[0] ??
                        studentDetails?.admissionDate?.split('T')[0] ??
                        '-'}
                    </div>
                  </div>
                  <div>
                    {profile?.role?.toLowerCase() === 'student' ? (
                      <>
                        <div className='text-xs text-muted-foreground'>
                          Class
                        </div>
                        <div className='font-medium text-sm'>
                          {studentDetails?.className
                            ? studentDetails.className
                            : studentDetails?.class &&
                                studentDetails.class.grade
                              ? `Grade ${studentDetails.class.grade} ${studentDetails.class.section || ''}`.trim()
                              : studentDetails?.classId
                                ? `Class ID: ${studentDetails.classId}`
                                : '-'}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='text-xs text-muted-foreground'>
                          Department
                        </div>
                        <div className='font-medium text-sm'>
                          {profile?.teacherData?.department ?? '-'}
                        </div>
                      </>
                    )}
                    <div className='text-xs text-muted-foreground mt-2'>
                      Last Login
                    </div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.lastLogin
                        ? new Date(studentDetails.lastLogin).toLocaleString()
                        : studentDetails?.lastLoginAt
                          ? new Date(
                              studentDetails.lastLoginAt,
                            ).toLocaleString()
                          : '-'}
                    </div>
                  </div>
                </div>
              </div>
              <div className='border-t mt-4 pt-4 grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Email Address
                  </div>
                  <div className='bg-gray-100 rounded px-2 py-1 text-sm font-medium mt-1'>
                    {profile?.email ?? '-'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Phone Number
                  </div>
                  {editing ? (
                    <input
                      className='bg-gray-100 rounded px-2 py-1 text-sm font-medium mt-1 w-full border border-gray-300'
                      value={formData.phone || ''}
                      onChange={e => handleInputChange('phone', e.target.value)}
                    />
                  ) : (
                    <div className='bg-gray-100 rounded px-2 py-1 text-sm font-medium mt-1'>
                      {profile?.phone ?? '-'}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card className='p-6 bg-white rounded-xl border border-gray-200'>
              <div className='font-semibold text-base mb-1'>
                Professional Information
              </div>
              <div className='text-sm text-muted-foreground mb-4'>
                Work-related details and qualifications
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <div className='text-xs text-muted-foreground'>Position</div>
                  <div className='font-medium text-sm'>
                    {profile?.role ?? '-'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Department
                  </div>
                  <div className='font-medium text-sm'>
                    {profile?.teacherData?.department ?? '-'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Highest Qualification
                  </div>
                  {editing ? (
                    <input
                      className='font-medium text-sm w-full border border-gray-300 rounded px-2 py-1'
                      value={formData.teacherData?.qualification || ''}
                      onChange={e =>
                        handleInputChange(
                          'teacherData.qualification',
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className='font-medium text-sm'>
                      {profile?.teacherData?.qualification ?? '-'}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Emergency Contact Information */}
            {/* Emergency Contact for Student Dashboard */}
            {profile?.role?.toLowerCase() === 'student' && (
              <Card className='p-6 bg-white rounded-xl border border-gray-200'>
                <div className='font-semibold text-base mb-1'>
                  Emergency Contact Information
                </div>
                <div className='text-sm text-muted-foreground mb-4'>
                  Emergency contact details for urgent situations
                </div>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <div className='text-xs text-blue-700 font-semibold mb-1'>
                      Primary Contact
                    </div>
                    <div className='text-xs text-muted-foreground'>Name</div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => p.isPrimary)
                        ?.fullName ??
                        studentDetails?.parents?.[0]?.fullName ??
                        `${studentDetails?.fatherFirstName ?? ''} ${studentDetails?.fatherMiddleName ?? ''} ${studentDetails?.fatherLastName ?? ''}`.trim() ??
                        '-'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Phone
                    </div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => p.isPrimary)
                        ?.phone ??
                        studentDetails?.parents?.[0]?.phone ??
                        studentDetails?.fatherPhone ??
                        '-'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Email
                    </div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => p.isPrimary)
                        ?.email ??
                        studentDetails?.parents?.[0]?.email ??
                        studentDetails?.fatherEmail ??
                        '-'}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-blue-700 font-semibold mb-1'>
                      Secondary Contact
                    </div>
                    <div className='text-xs text-muted-foreground'>Name</div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => !p.isPrimary)
                        ?.fullName ??
                        studentDetails?.parents?.[1]?.fullName ??
                        `${studentDetails?.motherFirstName ?? ''} ${studentDetails?.motherMiddleName ?? ''} ${studentDetails?.motherLastName ?? ''}`.trim() ??
                        '-'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Phone
                    </div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => !p.isPrimary)
                        ?.phone ??
                        studentDetails?.parents?.[1]?.phone ??
                        studentDetails?.motherPhone ??
                        '-'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Email
                    </div>
                    <div className='font-medium text-sm'>
                      {studentDetails?.parents?.find((p: any) => !p.isPrimary)
                        ?.email ??
                        studentDetails?.parents?.[1]?.email ??
                        studentDetails?.motherEmail ??
                        '-'}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Additional Information */}
            <Card className='p-6 bg-white rounded-xl border border-gray-200'>
              <div className='font-semibold text-base mb-1'>
                Additional Information
              </div>
              <div className='text-sm text-muted-foreground mb-4'>
                Extra details and special notes
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Languages Spoken
                  </div>
                  <div className='font-medium text-sm'>
                    {studentDetails?.languagesSpoken ??
                      studentDetails?.interests ??
                      studentDetails?.specialNeeds ??
                      '-'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Years of Experience
                  </div>
                  <div className='font-medium text-sm'>
                    {studentDetails?.experienceYears ??
                      profile?.teacherData?.experienceYears ??
                      '-'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-muted-foreground'>
                    Medical Conditions
                  </div>
                  <div className='font-medium text-sm'>
                    {studentDetails?.medicalConditions ??
                      studentDetails?.allergies ??
                      '-'}
                  </div>
                </div>
                <div className='md:col-span-2'>
                  <div className='text-xs text-muted-foreground'>
                    Special Notes
                  </div>
                  <div className='font-medium text-sm'>
                    {studentDetails?.bio ?? studentDetails?.specialNotes ?? '-'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className='space-y-6'>
            {profile?.role?.toLowerCase() === 'teacher' ? (
              <Card className='p-6 bg-white rounded-xl border border-gray-200'>
                <div className='font-semibold text-base mb-1'>
                  Bank Information
                </div>
                <div className='text-sm text-muted-foreground mb-4'>
                  Bank details for salary payments
                </div>
                {teacherLoading ? (
                  <div className='space-y-2'>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className='flex justify-between'>
                        <div className='h-4 bg-gray-200 rounded w-24 animate-pulse'></div>
                        <div className='h-4 bg-gray-200 rounded w-32 animate-pulse'></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        Bank Name
                      </span>
                      {editing ? (
                        <input
                          className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                          value={teacherDetails?.bankName || ''}
                          onChange={e => {
                            /* Add bank update logic */
                          }}
                        />
                      ) : (
                        <span className='font-medium text-sm'>
                          {teacherDetails?.bankName ?? '-'}
                        </span>
                      )}
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        Account Number
                      </span>
                      {editing ? (
                        <input
                          className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                          value={teacherDetails?.bankAccountNumber || ''}
                          onChange={e => {
                            /* Add bank update logic */
                          }}
                        />
                      ) : (
                        <span className='font-medium text-sm'>
                          {teacherDetails?.bankAccountNumber ?? '-'}
                        </span>
                      )}
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        Branch
                      </span>
                      {editing ? (
                        <input
                          className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                          value={teacherDetails?.bankBranch || ''}
                          onChange={e => {
                            /* Add bank update logic */
                          }}
                        />
                      ) : (
                        <span className='font-medium text-sm'>
                          {teacherDetails?.bankBranch ?? '-'}
                        </span>
                      )}
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-xs text-muted-foreground'>
                        PAN Number
                      </span>
                      {editing ? (
                        <input
                          className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                          value={teacherDetails?.panNumber || ''}
                          onChange={e => {
                            /* Add bank update logic */
                          }}
                        />
                      ) : (
                        <span className='font-medium text-sm'>
                          {teacherDetails?.panNumber ?? '-'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className='p-6 bg-white rounded-xl border border-gray-200'>
                <div className='font-semibold text-base mb-1'>
                  Personal Details
                </div>
                <div className='text-sm text-muted-foreground mb-4'>
                  Additional personal information
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-xs text-muted-foreground'>
                      Gender
                    </span>
                    {editing ? (
                      <select
                        className='font-medium text-sm border border-gray-300 rounded px-2 py-1'
                        value={studentDetails?.gender || ''}
                        onChange={e => {
                          /* Add student update logic */
                        }}
                      >
                        <option value=''>Select Gender</option>
                        <option value='Male'>Male</option>
                        <option value='Female'>Female</option>
                        <option value='Other'>Other</option>
                      </select>
                    ) : (
                      <span className='font-medium text-sm'>
                        {studentDetails?.gender ?? '-'}
                      </span>
                    )}
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-xs text-muted-foreground'>
                      Date of Birth
                    </span>
                    {editing ? (
                      <input
                        type='date'
                        className='font-medium text-sm border border-gray-300 rounded px-2 py-1'
                        value={studentDetails?.dateOfBirth?.split('T')[0] || ''}
                        onChange={e => {
                          /* Add student update logic */
                        }}
                      />
                    ) : (
                      <span className='font-medium text-sm'>
                        {studentDetails?.dateOfBirth
                          ? new Date(
                              studentDetails.dateOfBirth,
                            ).toLocaleDateString()
                          : '-'}
                      </span>
                    )}
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-xs text-muted-foreground'>
                      Blood Group
                    </span>
                    {editing ? (
                      <select
                        className='font-medium text-sm border border-gray-300 rounded px-2 py-1'
                        value={studentDetails?.bloodGroup || ''}
                        onChange={e => {
                          /* Add student update logic */
                        }}
                      >
                        <option value=''>Select Blood Group</option>
                        <option value='A+'>A+</option>
                        <option value='A-'>A-</option>
                        <option value='B+'>B+</option>
                        <option value='B-'>B-</option>
                        <option value='AB+'>AB+</option>
                        <option value='AB-'>AB-</option>
                        <option value='O+'>O+</option>
                        <option value='O-'>O-</option>
                      </select>
                    ) : (
                      <span className='font-medium text-sm'>
                        {studentDetails?.bloodGroup ?? '-'}
                      </span>
                    )}
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-xs text-muted-foreground'>
                      Ethnicity
                    </span>
                    {editing ? (
                      <input
                        className='font-medium text-sm border border-gray-300 rounded px-2 py-1'
                        value={studentDetails?.ethnicity || ''}
                        onChange={e => {
                          /* Add student update logic */
                        }}
                      />
                    ) : (
                      <span className='font-medium text-sm'>
                        {studentDetails?.ethnicity ?? '-'}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <Card className='p-6 bg-white rounded-xl border border-gray-200'>
              <div className='font-semibold text-base mb-1'>Address</div>
              <div className='text-sm text-muted-foreground mb-4'>
                Residential address details
              </div>
              <div className='space-y-2'>
                {/* Editable address fields */}
                {(() => {
                  let street = '';
                  let city = '';
                  let state = '';
                  let pin = '';
                  if (
                    profile?.role?.toLowerCase() === 'teacher' &&
                    teacherDetails
                  ) {
                    street =
                      teacherDetails.address || teacherDetails.street || '';
                    city = teacherDetails.city || '';
                    state = teacherDetails.state || '';
                    pin = teacherDetails.pinCode || '';
                  } else if (
                    profile?.role?.toLowerCase() === 'student' &&
                    studentDetails
                  ) {
                    street =
                      studentDetails.address || studentDetails.street || '';
                    city = studentDetails.city || '';
                    state = studentDetails.state || '';
                    pin = studentDetails.pinCode || '';
                  } else if (profile?.role?.toLowerCase() === 'parent') {
                    street =
                      profile?.parentData?.profile?.contactInfo?.address || '';
                    city = '';
                    state = '';
                    pin = '';
                  } else {
                    street =
                      profile?.studentData?.profile?.additionalData?.address ||
                      profile?.teacherData?.profile?.contactInfo?.address ||
                      profile?.parentData?.profile?.contactInfo?.address ||
                      '';
                  }
                  return (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-xs text-muted-foreground'>
                          Street Address
                        </span>
                        {editing ? (
                          <input
                            className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                            value={street}
                            onChange={e => {
                              /* Add address update logic */
                            }}
                          />
                        ) : (
                          <span className='font-medium text-sm'>
                            {street || '-'}
                          </span>
                        )}
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-xs text-muted-foreground'>
                          City
                        </span>
                        {editing ? (
                          <input
                            className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                            value={city}
                            onChange={e => {
                              /* Add address update logic */
                            }}
                          />
                        ) : (
                          <span className='font-medium text-sm'>
                            {city || '-'}
                          </span>
                        )}
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-xs text-muted-foreground'>
                          State
                        </span>
                        {editing ? (
                          <input
                            className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                            value={state}
                            onChange={e => {
                              /* Add address update logic */
                            }}
                          />
                        ) : (
                          <span className='font-medium text-sm'>
                            {state || '-'}
                          </span>
                        )}
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-xs text-muted-foreground'>
                          Pin Code
                        </span>
                        {editing ? (
                          <input
                            className='font-medium text-sm border border-gray-300 rounded px-2 py-1 w-32'
                            value={pin}
                            onChange={e => {
                              /* Add address update logic */
                            }}
                          />
                        ) : (
                          <span className='font-medium text-sm'>
                            {pin || '-'}
                          </span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  },
);

export default ProfileSettings;
