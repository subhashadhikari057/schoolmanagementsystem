'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
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
} from 'lucide-react';
import { Teacher } from '@/components/templates/listConfigurations';
import Avatar from '@/components/atoms/display/Avatar';
import { teacherService } from '@/api/services/teacher.service';

interface TeacherViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

const TeacherViewModal: React.FC<TeacherViewModalProps> = ({
  isOpen,
  onClose,
  teacher,
}) => {
  const [teacherDetails, setTeacherDetails] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed teacher data when modal opens
  useEffect(() => {
    if (isOpen && teacher && teacher.id) {
      setLoading(true);
      setError(null);

      // Validate teacher ID before making API call
      const teacherId = String(teacher.id);
      if (!teacherId || teacherId === 'undefined' || teacherId === 'null') {
        setError('Invalid teacher ID');
        setTeacherDetails(teacher);
        setLoading(false);
        return;
      }

      // Fetch detailed teacher data from API
      teacherService
        .getTeacherById(teacherId)
        .then(response => {
          if (response.success && response.data) {
            // Map API response to Teacher interface
            console.log('API Response:', response.data);

            // Extract bank details from response
            const bankDetails =
              (response.data as any).bankDetails ||
              (response.data as any).profile?.additionalData?.bankDetails ||
              {};
            const personalDetails = (response.data as any).personal || {};

            // Extract name parts from API response
            const firstName = response.data.firstName || '';
            const middleName = response.data.middleName || '';
            const lastName = response.data.lastName || '';

            // Build full name with middle name if available
            const fullName = middleName
              ? `${firstName} ${middleName} ${lastName}`
              : `${firstName} ${lastName}`;

            const detailedTeacher: Teacher = {
              ...teacher,
              // Update name with middle name if available
              name: fullName || teacher.name,
              // Update with more detailed information from API
              qualification:
                response.data.qualification || teacher.qualification,
              specialization:
                response.data.specialization || teacher.specialization,
              experienceYears:
                response.data.experienceYears || teacher.experienceYears,
              dateOfBirth:
                response.data.dateOfBirth ||
                personalDetails.dateOfBirth ||
                teacher.dateOfBirth,
              gender:
                response.data.gender ||
                personalDetails.gender ||
                teacher.gender,
              bloodGroup:
                response.data.bloodGroup ||
                personalDetails.bloodGroup ||
                teacher.bloodGroup,
              maritalStatus:
                response.data.maritalStatus ||
                personalDetails.maritalStatus ||
                teacher.maritalStatus,
              salary: response.data.totalSalary || teacher.salary,
              basicSalary: response.data.basicSalary || teacher.basicSalary,
              allowances: response.data.allowances || teacher.allowances,
              languagesKnown:
                response.data.languagesKnown || teacher.languagesKnown,
              phone: response.data.phone || teacher.phone,
              address:
                response.data.address ||
                personalDetails.address ||
                teacher.address,
              street:
                response.data.street ||
                personalDetails.street ||
                teacher.street,
              city: response.data.city || personalDetails.city || teacher.city,
              state:
                response.data.state || personalDetails.state || teacher.state,
              pinCode:
                response.data.pinCode ||
                personalDetails.pinCode ||
                teacher.pinCode,
              joinedDate: response.data.employmentDate || teacher.joinedDate,
              teacherId: response.data.employeeId || teacher.teacherId,
              // Bank and legal details - fix property names from API
              bankName:
                response.data.bankName ||
                bankDetails.bankName ||
                bankDetails.bank_name ||
                teacher.bankName,
              bankAccountNumber:
                response.data.bankAccountNumber ||
                bankDetails.accountNumber ||
                bankDetails.bankAccountNumber ||
                teacher.bankAccountNumber,
              bankBranch:
                response.data.bankBranch ||
                bankDetails.branch ||
                bankDetails.bankBranch ||
                teacher.bankBranch,
              panNumber:
                response.data.panNumber ||
                bankDetails.panNumber ||
                bankDetails.pan_number ||
                teacher.panNumber,
              citizenshipNumber:
                response.data.citizenshipNumber ||
                bankDetails.citizenshipNumber ||
                teacher.citizenshipNumber,
              ssfNumber:
                (response.data as any).ssfNumber ||
                bankDetails.ssfNumber ||
                (teacher as any).ssfNumber,
              citNumber:
                (response.data as any).citNumber ||
                bankDetails.citNumber ||
                (teacher as any).citNumber,
              contactInfo: response.data.contactInfo || {
                phone: response.data.phone || teacher.phone,
                email: response.data.email || teacher.email,
                address: response.data.address || teacher.address,
              },
            };
            setTeacherDetails(detailedTeacher);
          } else {
            setError('Failed to load teacher details');
            // Fallback to basic teacher data
            setTeacherDetails(teacher);
          }
        })
        .catch(err => {
          console.error('Error fetching teacher details:', err);
          setError('Failed to load teacher details');
          // Fallback to basic teacher data
          setTeacherDetails(teacher);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setTeacherDetails(null);
    }
  }, [isOpen, teacher]);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in duration-300 text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
          <p className='text-gray-700'>Loading teacher details...</p>
        </div>
      </div>
    );
  }

  // Show error state with fallback to basic data
  if (!teacherDetails && error) {
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

  if (!teacherDetails) return null;

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
            Teacher Profile
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Detailed information about this teacher
          </p>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {/* Basic Info */}
          <div className='flex flex-col md:flex-row gap-4 sm:gap-6 pb-6 border-b border-gray-200'>
            <div className='flex-shrink-0'>
              <Avatar
                name={teacherDetails.name}
                className='w-24 h-24 sm:w-32 sm:h-32 rounded-xl shadow-md'
                showInitials={true}
                src={teacher?.avatar || teacherDetails.avatar}
                role='teacher'
              />
            </div>

            <div className='flex-grow'>
              <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                {teacherDetails.firstName && teacherDetails.lastName
                  ? teacherDetails.middleName
                    ? `${teacherDetails.firstName} ${teacherDetails.middleName} ${teacherDetails.lastName}`
                    : `${teacherDetails.firstName} ${teacherDetails.lastName}`
                  : teacherDetails.name}
              </h3>

              <div className='flex flex-wrap gap-2 mt-2'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  {teacherDetails.designation || 'Teacher'}
                </span>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
                  {teacherDetails.department ||
                    teacherDetails.faculty ||
                    'General'}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    teacherDetails.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : teacherDetails.status === 'On Leave'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {teacherDetails.status}
                </span>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <Mail className='h-4 w-4 text-gray-400' />
                  <span>{teacherDetails.email || 'N/A'}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <Phone className='h-4 w-4 text-gray-400' />
                  <span>
                    {teacherDetails.phone ||
                      teacherDetails.contactInfo?.phone ||
                      'N/A'}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                  <MapPin className='h-4 w-4 text-gray-400' />
                  <span>
                    {teacherDetails.street
                      ? `${teacherDetails.street}, ${teacherDetails.city || 'N/A'}, ${teacherDetails.state || 'N/A'}, ${teacherDetails.province || teacherDetails.state || 'N/A'} - ${teacherDetails.pinCode || 'N/A'}`
                      : teacherDetails.address ||
                        teacherDetails.contactInfo?.address ||
                        'N/A'}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='h-4 w-4 text-gray-400' />
                  <span>Joined: {formatDate(teacherDetails.joinedDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6'>
            {/* Qualification & Specialization */}
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
                    {teacherDetails.qualification || 'N/A'}
                  </span>
                </div>
                {/* <div>
                  <span className="text-xs text-gray-500 block">Specialization</span>
                  <span className="text-sm font-medium text-gray-900">{teacherDetails.specialization || 'N/A'}</span>
                </div> */}
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Experience
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.experienceYears
                      ? `${teacherDetails.experienceYears} years`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subjects & Classes */}
            <div className='bg-blue-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <BookOpen className='h-4 w-4 mr-2 text-blue-600' />
                Subjects & Classes
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>Subjects</span>
                  <div className='flex flex-wrap gap-1 mt-1'>
                    {teacherDetails.subjects &&
                    teacherDetails.subjects.length > 0 ? (
                      teacherDetails.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-blue-800 border border-blue-200'
                        >
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className='text-sm text-gray-500'>
                        No subjects assigned
                      </span>
                    )}
                  </div>
                </div>
                <div className='mt-3'>
                  <span className='text-xs text-gray-500 block'>
                    Class Teacher
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.classTeacher ||
                      'Not assigned as class teacher'}
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className='bg-green-50 rounded-lg p-4'>
              <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                <Briefcase className='h-4 w-4 mr-2 text-green-600' />
                Professional Details
              </h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Employee ID
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.teacherId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Department
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.department || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Designation
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.designation || 'N/A'}
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
                    {teacherDetails.basicSalary
                      ? `$${typeof teacherDetails.basicSalary === 'number' ? teacherDetails.basicSalary.toLocaleString() : teacherDetails.basicSalary}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Allowances
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.allowances
                      ? `$${typeof teacherDetails.allowances === 'number' ? teacherDetails.allowances.toLocaleString() : teacherDetails.allowances}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Total Salary
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.salary
                      ? `$${typeof teacherDetails.salary === 'number' ? teacherDetails.salary.toLocaleString() : teacherDetails.salary}`
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
                    {teacherDetails.bankName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Account Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.bankAccountNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>Branch</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.bankBranch || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    PAN Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.panNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    Citizenship Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {teacherDetails.citizenshipNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    SSF Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String((teacherDetails as any).ssfNumber ?? 'N/A')}
                  </span>
                </div>
                <div>
                  <span className='text-xs text-gray-500 block'>
                    CIT Number
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {String((teacherDetails as any).citNumber ?? 'N/A')}
                  </span>
                </div>
              </div>
            </div>
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

export default TeacherViewModal;
