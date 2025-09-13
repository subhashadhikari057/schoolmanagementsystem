'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Loader2,
  Landmark,
  Key,
} from 'lucide-react';
import { Staff } from '@/components/templates/listConfigurations';
import Avatar from '@/components/atoms/display/Avatar';
import { staffService } from '@/api/services/staff.service';

interface StaffViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

const StaffViewModal: React.FC<StaffViewModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const [staffDetails, setStaffDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // Fetch detailed staff data when modal opens
  useEffect(() => {
    if (isOpen && staff && staff.id) {
      setLoading(true);
      setError(null);

      // Validate staff ID before making API call
      const staffId = String(staff.id);
      if (!staffId || staffId === 'undefined' || staffId === 'null') {
        setError('Invalid staff ID');
        setStaffDetails({
          ...staff,
          name: staff.name || 'Unknown Staff',
          designation: staff.designation || 'Staff',
          department: staff.department || 'General',
          status: staff.status || 'Active',
          email: staff.email || '',
          phone: staff.phone || '',
          avatar: staff.avatar || '',
        });
        setLoading(false);
        return;
      }

      // Fetch detailed staff data from API
      staffService
        .getStaffById(staffId)
        .then(response => {
          if (response.success && response.data) {
            // Map API response to Staff interface
            console.log('API Response:', response.data);

            // Extract bank details from response
            const bankDetails = (response.data as any).bankDetails || {};
            const personalDetails = (response.data as any).personal || {};

            // Extract name parts from API response
            const firstName = response.data.firstName || '';
            const middleName = response.data.middleName || '';
            const lastName = response.data.lastName || '';

            // Build full name with middle name if available
            const fullName = middleName
              ? `${firstName} ${middleName} ${lastName}`
              : `${firstName} ${lastName}`;

            const detailedStaff: Staff = {
              ...staff,
              // Update name with middle name if available
              name: fullName || staff.name,
              // Update with more detailed information from API
              qualification: response.data.qualification || staff.qualification,
              experienceYears:
                response.data.experienceYears || staff.experienceYears,
              dateOfBirth:
                response.data.dateOfBirth ||
                personalDetails.dateOfBirth ||
                staff.dateOfBirth,
              gender:
                response.data.gender || personalDetails.gender || staff.gender,
              bloodGroup:
                response.data.bloodGroup ||
                personalDetails.bloodGroup ||
                staff.bloodGroup,
              maritalStatus:
                response.data.maritalStatus ||
                personalDetails.maritalStatus ||
                staff.maritalStatus,
              totalSalary: response.data.totalSalary || staff.totalSalary,
              basicSalary: response.data.basicSalary || staff.basicSalary,
              allowances: response.data.allowances || staff.allowances,
              phone: response.data.phone || staff.phone,
              address:
                response.data.address ||
                personalDetails.address ||
                staff.address,
              street:
                response.data.street || personalDetails.street || staff.street,
              city: response.data.city || personalDetails.city || staff.city,
              state:
                response.data.state || personalDetails.state || staff.state,
              pinCode:
                response.data.pinCode ||
                personalDetails.pinCode ||
                staff.pinCode,
              joinedDate: response.data.employmentDate || staff.joinedDate,
              employeeId: response.data.employeeId || staff.employeeId,
              // Bank and legal details - fix property names from API
              bankName:
                response.data.bankName ||
                bankDetails.bankName ||
                staff.bankName,
              bankAccountNumber:
                response.data.bankAccountNumber ||
                bankDetails.accountNumber ||
                staff.bankAccountNumber,
              bankBranch:
                response.data.bankBranch ||
                bankDetails.branch ||
                staff.bankBranch,
              panNumber:
                response.data.panNumber ||
                bankDetails.panNumber ||
                staff.panNumber,
              citizenshipNumber:
                response.data.citizenshipNumber ||
                bankDetails.citizenshipNumber ||
                staff.citizenshipNumber,
              contactInfo: response.data.contactInfo || {
                phone: response.data.phone || staff.phone,
                email: response.data.email || staff.email,
                address: response.data.address || staff.address,
              },
              hasLoginAccount: response.data.userId ? true : false,
            };
            setStaffDetails(detailedStaff);

            // If staff has login account, fetch salary history
            if (response.data.userId) {
              setLoadingSalary(true);
              staffService
                .getStaffSalaryHistory(staffId)
                .then(salaryResponse => {
                  if (salaryResponse.success && salaryResponse.data) {
                    setSalaryHistory(salaryResponse.data.data || []);
                  }
                })
                .catch(err => {
                  console.error('Error fetching salary history:', err);
                })
                .finally(() => {
                  setLoadingSalary(false);
                });
            }
          } else {
            setError('Failed to load staff details');
            // Fallback to basic staff data with safe defaults
            setStaffDetails({
              ...staff,
              name: staff.name || 'Unknown Staff',
              designation: staff.designation || 'Staff',
              department: staff.department || 'General',
              status: staff.status || 'Active',
              email: staff.email || '',
              phone: staff.phone || '',
              avatar: staff.avatar || '',
            });
          }
        })
        .catch(err => {
          console.error('Error fetching staff details:', err);
          setError('Failed to load staff details');
          // Fallback to basic staff data with safe defaults
          setStaffDetails({
            ...staff,
            name: staff.name || 'Unknown Staff',
            designation: staff.designation || 'Staff',
            department: staff.department || 'General',
            status: staff.status || 'Active',
            email: staff.email || '',
            phone: staff.phone || '',
            avatar: staff.avatar || '',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setStaffDetails(null);
      setSalaryHistory([]);
    }
  }, [isOpen, staff]);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading staff details...</p>
        </div>
      </div>
    );
  }

  // Show error state with fallback to basic data
  if (!staffDetails && error) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300'>
          <div className='text-center mb-4'>
            <p className='text-red-500 font-medium'>Error loading details</p>
            <p className='text-gray-600 text-sm mt-1'>{error}</p>
          </div>
          <div className='flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!staffDetails) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4'
      role='dialog'
      aria-modal='true'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl w-full max-w-full sm:max-w-3xl lg:max-w-4xl shadow-2xl animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Staff Profile
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Detailed information about this staff member
          </p>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {/* Basic Info */}
          <div className='flex flex-col md:flex-row gap-4 sm:gap-6 pb-6 border-b border-gray-200'>
            <div className='flex-shrink-0'>
              <Avatar
                name={String(staffDetails?.name || 'Unknown Staff')}
                className='w-24 h-24 sm:w-32 sm:h-32 rounded-xl shadow-md'
                showInitials={true}
                src={staff?.avatar || String(staffDetails?.avatar || '')}
                role='staff'
              />
            </div>

            <div className='flex-grow'>
              <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                {staffDetails?.firstName && staffDetails?.lastName
                  ? staffDetails?.middleName
                    ? `${String(staffDetails?.firstName || '')} ${String(staffDetails?.middleName || '')} ${String(staffDetails?.lastName || '')}`
                    : `${String(staffDetails?.firstName || '')} ${String(staffDetails?.lastName || '')}`
                  : String(staffDetails?.name || 'Unknown Staff')}
              </h3>

              <div className='flex flex-wrap gap-2 mt-2'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {String(staffDetails?.designation || 'Staff')}
                </span>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
                  {String(staffDetails?.department || 'General')}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staffDetails?.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : staffDetails?.status === 'On Leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {String(staffDetails?.status || 'Active')}
                </span>
                {staffDetails?.hasLoginAccount && (
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Login Account
                  </span>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <Mail className='h-4 w-4 text-gray-400' />
                  <span>{String(staffDetails?.email || 'N/A')}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <Phone className='h-4 w-4 text-gray-400' />
                  <span>
                    {String(
                      staffDetails?.phone ||
                        staffDetails?.contactInfo?.phone ||
                        'N/A',
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <MapPin className='h-4 w-4 text-gray-400' />
                  <span>
                    {staffDetails?.street
                      ? `${String(staffDetails?.street || '')}, ${String(staffDetails?.city || 'N/A')}, ${String(staffDetails?.state || 'N/A')}, ${String(staffDetails?.province || staffDetails?.state || 'N/A')} - ${String(staffDetails?.pinCode || 'N/A')}`
                      : String(
                          staffDetails?.address ||
                            staffDetails?.contactInfo?.address ||
                            'N/A',
                        )}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='h-4 w-4 text-gray-400' />
                  <span>Joined: {formatDate(staffDetails?.joinedDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6'>
            {/* Qualification & Experience */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <GraduationCap className='h-4 w-4 mr-2 text-blue-600' />
                Qualification
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Qualification
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.qualification || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Experience
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staffDetails?.experienceYears
                      ? `${String(staffDetails?.experienceYears)} years`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department & Role */}
            <div className='bg-blue-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Briefcase className='h-4 w-4 mr-2 text-blue-600' />
                Department & Role
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Department
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.department || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Designation
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.designation || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    System Access
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staffDetails.hasLoginAccount
                      ? 'Has login access'
                      : 'No login access'}
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className='bg-green-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Key className='h-4 w-4 mr-2 text-green-600' />
                Professional Details
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employee ID
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.employeeId || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employment Status
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.status || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Joining Date
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatDate(staffDetails.joinedDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className='bg-yellow-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Award className='h-4 w-4 mr-2 text-yellow-600' />
                Salary Information
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Basic Salary
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staffDetails.basicSalary
                      ? `$${typeof staffDetails.basicSalary === 'number' ? staffDetails.basicSalary.toLocaleString() : staffDetails.basicSalary}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Allowances
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staffDetails.allowances
                      ? `$${typeof staffDetails.allowances === 'number' ? staffDetails.allowances.toLocaleString() : staffDetails.allowances}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Total Salary
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staffDetails.totalSalary
                      ? `$${typeof staffDetails.totalSalary === 'number' ? staffDetails.totalSalary.toLocaleString() : staffDetails.totalSalary}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank and Legal Information */}
            <div className='bg-blue-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Landmark className='h-4 w-4 mr-2 text-blue-600' />
                Bank & Legal Information
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>Bank Name</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.bankName || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Account Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.bankAccountNumber || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>Branch</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.bankBranch || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    PAN Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.panNumber || 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Citizenship Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String(staffDetails?.citizenshipNumber || 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            {/* Removed Salary History section as requested */}
          </div>
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl flex justify-end sticky bottom-0'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffViewModal;
