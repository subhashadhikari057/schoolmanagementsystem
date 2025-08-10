/**
 * =============================================================================
 * Staff View Modal Component
 * =============================================================================
 * Modal for viewing staff member details with profile information
 * =============================================================================
 */

'use client';

import React from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { StaffMember } from '@/components/templates/StaffColumns';
import Avatar from '@/components/atoms/display/Avatar';

interface StaffViewModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
}

const StaffViewModal: React.FC<StaffViewModalProps> = ({
  staff,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !staff) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto'>
      <div
        className='bg-white rounded-xl w-full max-w-4xl shadow-2xl animate-in fade-in duration-300'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-100'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-2xl font-bold text-gray-800'>Staff Profile</h2>
          <p className='text-gray-600 mt-1'>
            Detailed information about this staff member
          </p>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Basic Info */}
          <div className='flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-200'>
            <div className='flex-shrink-0'>
              <Avatar
                name={staff.fullName}
                className='w-32 h-32 rounded-xl shadow-md'
                showInitials={true}
                src={staff.profile?.profilePhotoUrl}
              />
            </div>

            <div className='flex-grow'>
              <h3 className='text-xl font-bold text-gray-900'>
                {staff.fullName}
              </h3>

              <div className='flex flex-wrap gap-2 mt-2'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {staff.designation || 'Staff Member'}
                </span>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize'>
                  {staff.department?.replace(/_/g, ' ') || 'General'}
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
                  {staff.employmentStatus
                    ?.replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()) || 'Active'}
                </span>
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
                  <span>Staff ID: {staff.id}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='h-4 w-4 text-gray-400' />
                  <span>Joined: {formatDate(staff.employmentDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            {/* Employment Details */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Briefcase className='h-4 w-4 mr-2 text-blue-600' />
                Employment Details
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employee ID
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.id}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employment Date
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {formatDate(staff.employmentDate)}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Experience
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.experienceYears
                      ? `${staff.experienceYears} years`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Department & Role */}
            <div className='bg-blue-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Building className='h-4 w-4 mr-2 text-blue-600' />
                Department & Role
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Department
                  </span>
                  <span className='text-sm font-medium text-gray-900 capitalize'>
                    {staff.department?.replace(/_/g, ' ') || 'General'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Designation
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.designation || 'Staff Member'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employment Status
                  </span>
                  <span className='text-sm font-medium text-gray-900 capitalize'>
                    {staff.employmentStatus?.replace(/_/g, ' ') || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className='bg-green-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <UserCheck className='h-4 w-4 mr-2 text-green-600' />
                Professional Details
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>Full Name</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.firstName}{' '}
                    {staff.middleName ? `${staff.middleName} ` : ''}
                    {staff.lastName}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Email Address
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.email || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Phone Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.phone || 'Not provided'}
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
                    {staff.basicSalary
                      ? `$${typeof staff.basicSalary === 'number' ? staff.basicSalary.toLocaleString() : staff.basicSalary}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Allowances
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.allowances
                      ? `$${typeof staff.allowances === 'number' ? staff.allowances.toLocaleString() : staff.allowances}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Total Salary
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {staff.totalSalary
                      ? `$${typeof staff.totalSalary === 'number' ? staff.totalSalary.toLocaleString() : staff.totalSalary}`
                      : staff.basicSalary
                        ? `$${typeof staff.basicSalary === 'number' ? staff.basicSalary.toLocaleString() : staff.basicSalary}`
                        : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {staff.profile?.bio && (
            <div className='border-t border-gray-200 pt-6 mt-6'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3'>
                About
              </h4>
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-gray-700 leading-relaxed'>
                  {staff.profile.bio}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end'>
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
