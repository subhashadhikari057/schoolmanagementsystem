'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { staffService } from '@/api/services/staff.service';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Loader2,
  Landmark,
  ArrowLeft,
  User,
} from 'lucide-react';
import Avatar from '@/components/atoms/display/Avatar';
import Tabs from '@/components/organisms/tabs/GenericTabs';
import { formatDate } from '@/utils/formatters';

const StaffProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;
  const [staff, setStaff] = useState<any>(null);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch staff details
        const response = await staffService.getStaffById(staffId);
        if (response.success && response.data) {
          setStaff(response.data);

          // Fetch salary history
          try {
            const salaryResponse =
              await staffService.getStaffSalaryHistory(staffId);
            if (salaryResponse.success && salaryResponse.data) {
              setSalaryHistory(salaryResponse.data);
            }
          } catch (err) {
            console.error('Error fetching salary history:', err);
            // Don't set error - we still have the main staff data
          }
        } else {
          setError('Failed to load staff details');
        }
      } catch (err) {
        console.error('Error fetching staff details:', err);
        setError('Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchStaffData();
    }
  }, [staffId]);

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading staff details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-500 font-medium'>
            Error loading staff details
          </p>
          <p className='text-gray-600 text-sm mt-1'>{error}</p>
          <button
            onClick={() => router.back()}
            className='mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!staff) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-700 font-medium'>No staff data found</p>
          <button
            onClick={() => router.back()}
            className='mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Construct full name
  const firstName = staff.firstName || '';
  const middleName = staff.middleName || '';
  const lastName = staff.lastName || '';
  const fullName = middleName
    ? `${firstName} ${middleName} ${lastName}`
    : `${firstName} ${lastName}`;

  // Tab content
  const personalInfoTab = (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>
        Personal Information
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Full Name</p>
          <p className='font-medium'>{fullName}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Email</p>
          <p className='font-medium'>{staff.email || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Phone</p>
          <p className='font-medium'>{staff.phone || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Date of Birth</p>
          <p className='font-medium'>
            {staff.dob ? formatDate(staff.dob) : 'N/A'}
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Gender</p>
          <p className='font-medium'>{staff.gender || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Blood Group</p>
          <p className='font-medium'>{staff.bloodGroup || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Marital Status</p>
          <p className='font-medium'>{staff.maritalStatus || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Emergency Contact</p>
          <p className='font-medium'>{staff.emergencyContact || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const professionalInfoTab = (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>
        Professional Information
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Employee ID</p>
          <p className='font-medium'>{staff.employeeId || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Designation</p>
          <p className='font-medium'>{staff.designation || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Department</p>
          <p className='font-medium'>{staff.department || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Employment Date</p>
          <p className='font-medium'>
            {staff.employmentDate ? formatDate(staff.employmentDate) : 'N/A'}
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Employment Status</p>
          <p className='font-medium'>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                staff.employmentStatus === 'active'
                  ? 'bg-green-100 text-green-800'
                  : staff.employmentStatus === 'on_leave'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {staff.employmentStatus || 'N/A'}
            </span>
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Experience Years</p>
          <p className='font-medium'>
            {staff.experienceYears ? `${staff.experienceYears} years` : 'N/A'}
          </p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Qualification</p>
          <p className='font-medium'>
            {staff.profile?.additionalData?.qualification || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  const salaryInfoTab = (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>
        Salary Information
      </h3>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <p className='text-sm text-gray-500 mb-1'>Basic Salary</p>
          <p className='font-medium text-lg'>
            $
            {staff.basicSalary
              ? Number(staff.basicSalary).toLocaleString()
              : 'N/A'}
          </p>
        </div>
        <div className='bg-green-50 p-4 rounded-lg'>
          <p className='text-sm text-gray-500 mb-1'>Allowances</p>
          <p className='font-medium text-lg'>
            $
            {staff.allowances
              ? Number(staff.allowances).toLocaleString()
              : 'N/A'}
          </p>
        </div>
        <div className='bg-purple-50 p-4 rounded-lg'>
          <p className='text-sm text-gray-500 mb-1'>Total Salary</p>
          <p className='font-medium text-lg'>
            $
            {staff.totalSalary
              ? Number(staff.totalSalary).toLocaleString()
              : 'N/A'}
          </p>
        </div>
      </div>

      <h4 className='text-md font-semibold text-gray-700 mb-3'>
        Salary History
      </h4>

      {salaryHistory && salaryHistory.length > 0 ? (
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Effective Month
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Basic Salary
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Allowances
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Total Salary
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Change Type
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {salaryHistory.map((record, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {formatDate(record.effectiveMonth)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${Number(record.basicSalary).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${Number(record.allowances).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    ${Number(record.totalSalary).toLocaleString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.changeType === 'INITIAL'
                          ? 'bg-blue-100 text-blue-800'
                          : record.changeType === 'PROMOTION'
                            ? 'bg-green-100 text-green-800'
                            : record.changeType === 'DEMOTION'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.changeType}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    {record.changeReason || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <p className='text-gray-500'>No salary history records found</p>
        </div>
      )}
    </div>
  );

  const bankDetailsTab = (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>
        Bank & Legal Information
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Bank Name</p>
          <p className='font-medium'>{staff.bankName || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Account Number</p>
          <p className='font-medium'>{staff.bankAccountNumber || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Branch</p>
          <p className='font-medium'>{staff.bankBranch || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>PAN Number</p>
          <p className='font-medium'>{staff.panNumber || 'N/A'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-500 mb-1'>Citizenship Number</p>
          <p className='font-medium'>{staff.citizenshipNumber || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const userAccountTab = (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <h3 className='text-lg font-semibold text-gray-800 mb-4'>User Account</h3>

      {staff.userAccount ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <p className='text-sm text-gray-500 mb-1'>User ID</p>
            <p className='font-medium'>{staff.userAccount.id || 'N/A'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500 mb-1'>Email</p>
            <p className='font-medium'>{staff.userAccount.email || 'N/A'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500 mb-1'>Roles</p>
            <div className='flex flex-wrap gap-2'>
              {staff.userAccount.roles && staff.userAccount.roles.length > 0 ? (
                staff.userAccount.roles.map((role: string, index: number) => (
                  <span
                    key={index}
                    className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                  >
                    {role}
                  </span>
                ))
              ) : (
                <p>No roles assigned</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='text-center py-8 bg-gray-50 rounded-lg'>
          <User className='h-12 w-12 text-gray-400 mx-auto mb-3' />
          <p className='text-gray-500'>
            This staff member does not have a user account
          </p>
          <p className='text-sm text-gray-400 mt-1'>
            They cannot log into the system
          </p>
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      name: 'Personal Info',
      content: personalInfoTab,
    },
    {
      name: 'Professional Info',
      content: professionalInfoTab,
    },
    {
      name: 'Salary Info',
      content: salaryInfoTab,
    },
    {
      name: 'Bank Details',
      content: bankDetailsTab,
    },
    {
      name: 'User Account',
      content: userAccountTab,
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50 p-4 sm:p-6'>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className='mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors'
      >
        <ArrowLeft className='h-4 w-4 mr-1' />
        <span>Back to Staff List</span>
      </button>

      {/* Profile header */}
      <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
        <div className='flex flex-col md:flex-row gap-6'>
          <div className='flex-shrink-0'>
            <Avatar
              name={fullName}
              className='w-24 h-24 sm:w-32 sm:h-32 rounded-xl shadow-md'
              showInitials={true}
              src={staff.profile?.profilePhotoUrl}
            />
          </div>

          <div className='flex-grow'>
            <h1 className='text-2xl font-bold text-gray-900'>{fullName}</h1>

            <div className='flex flex-wrap gap-2 mt-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                {staff.designation || 'Staff'}
              </span>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
                {staff.department || 'General'}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staff.employmentStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : staff.employmentStatus === 'on_leave'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {staff.employmentStatus || 'N/A'}
              </span>
              {staff.userAccount ? (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  Has Login Account
                </span>
              ) : (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                  No Login Account
                </span>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Mail className='h-4 w-4 text-gray-400' />
                <span>{staff.email || 'N/A'}</span>
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Phone className='h-4 w-4 text-gray-400' />
                <span>{staff.phone || 'N/A'}</span>
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <MapPin className='h-4 w-4 text-gray-400' />
                <span>
                  {staff.profile?.additionalData?.address
                    ? `${staff.profile.additionalData.address.street || ''}, ${staff.profile.additionalData.address.city || ''}, ${staff.profile.additionalData.address.state || ''}`
                    : 'N/A'}
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Calendar className='h-4 w-4 text-gray-400' />
                <span>
                  Joined:{' '}
                  {staff.employmentDate
                    ? formatDate(staff.employmentDate)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} />
    </div>
  );
};

export default StaffProfilePage;
