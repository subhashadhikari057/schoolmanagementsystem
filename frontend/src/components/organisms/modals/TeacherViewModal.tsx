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
    if (isOpen && teacher) {
      setLoading(true);
      setError(null);

      // Fetch detailed teacher data from API
      teacherService
        .getTeacherById(String(teacher.id))
        .then(response => {
          if (response.success && response.data) {
            // Map API response to Teacher interface
            const detailedTeacher: Teacher = {
              ...teacher,
              // Update with more detailed information from API
              qualification:
                response.data.qualification || teacher.qualification,
              specialization:
                response.data.specialization || teacher.specialization,
              experienceYears:
                response.data.experienceYears || teacher.experienceYears,
              dateOfBirth: response.data.dateOfBirth || teacher.dateOfBirth,
              gender: response.data.gender || teacher.gender,
              bloodGroup: response.data.bloodGroup || teacher.bloodGroup,
              salary: response.data.totalSalary || teacher.salary,
              basicSalary: response.data.basicSalary || teacher.basicSalary,
              allowances: response.data.allowances || teacher.allowances,
              languagesKnown:
                response.data.languagesKnown || teacher.languagesKnown,
              phone: response.data.phone || teacher.phone,
              address: response.data.address || teacher.address,
              street: response.data.street || teacher.street,
              city: response.data.city || teacher.city,
              state: response.data.state || teacher.state,
              pinCode: response.data.pinCode || teacher.pinCode,
              joinedDate: response.data.employmentDate || teacher.joinedDate,
              teacherId: response.data.employeeId || teacher.teacherId,
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

          <h2 className='text-2xl font-bold text-gray-800'>Teacher Profile</h2>
          <p className='text-gray-600 mt-1'>
            Detailed information about this teacher
          </p>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Basic Info */}
          <div className='flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-200'>
            <div className='flex-shrink-0'>
              <Avatar
                name={teacherDetails.name}
                className='w-32 h-32 rounded-xl shadow-md'
                showInitials={true}
                src={teacherDetails.avatar}
              />
            </div>

            <div className='flex-grow'>
              <h3 className='text-xl font-bold text-gray-900'>
                {teacherDetails.name}
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
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Mail className='h-4 w-4 text-gray-400' />
                  <span>{teacherDetails.email || 'N/A'}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Phone className='h-4 w-4 text-gray-400' />
                  <span>
                    {teacherDetails.phone ||
                      teacherDetails.contactInfo?.phone ||
                      'N/A'}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <MapPin className='h-4 w-4 text-gray-400' />
                  <span>
                    {teacherDetails.street
                      ? `${teacherDetails.street}, ${teacherDetails.city || 'N/A'}, ${teacherDetails.state || 'N/A'} - ${teacherDetails.pinCode || 'N/A'}`
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
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
          </div>
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

export default TeacherViewModal;
