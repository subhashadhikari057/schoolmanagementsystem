'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  Heart,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Student } from '@/components/templates/listConfigurations';
import {
  studentService,
  StudentResponse,
} from '@/api/services/student.service';
import { toast } from 'sonner';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

const StudentViewModal: React.FC<StudentViewModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [studentDetails, setStudentDetails] = useState<StudentResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed student data when modal opens
  useEffect(() => {
    if (isOpen && student && student.id) {
      setLoading(true);
      setError(null);

      // Validate student ID before making API call
      const studentId = String(student.id);
      if (!studentId || studentId === 'undefined' || studentId === 'null') {
        setError('Invalid student ID');
        // Convert basic student data to StudentResponse format for fallback
        setStudentDetails({
          id: student.id,
          fullName: student.name,
          email: student.email || '',
          phone: student.phone,
          rollNumber: student.rollNo,
          studentId: student.studentId,
          classId:
            typeof student.class === 'string'
              ? ''
              : (student.class as any)?.id || '',
          className:
            typeof student.class === 'string'
              ? student.class
              : `Grade ${(student.class as any)?.grade || 'Unknown'} ${(student.class as any)?.section || ''}`,
          admissionDate: '',
          academicStatus: student.status.toLowerCase(),
          feeStatus: 'pending',
          isActive: student.status === 'Active',
          createdAt: new Date().toISOString(),
        } as StudentResponse);
        setLoading(false);
        return;
      }

      // Fetch detailed student data from API
      studentService
        .getStudentById(studentId)
        .then(response => {
          if (response.success && response.data) {
            setStudentDetails(response.data);
            setError(null);
          } else {
            setError(response.message || 'Failed to load student details');
            // Convert basic student data to StudentResponse format for fallback
            setStudentDetails({
              id: student.id,
              fullName: student.name,
              email: student.email || '',
              phone: student.phone,
              rollNumber: student.rollNo,
              studentId: student.studentId,
              classId:
                typeof student.class === 'string'
                  ? ''
                  : (student.class as any)?.id || '',
              className:
                typeof student.class === 'string'
                  ? student.class
                  : `Grade ${(student.class as any)?.grade || 'Unknown'} ${(student.class as any)?.section || ''}`,
              admissionDate: '',
              academicStatus: student.status.toLowerCase(),
              feeStatus: 'pending',
              isActive: student.status === 'Active',
              createdAt: new Date().toISOString(),
            } as StudentResponse);
          }
        })
        .catch(err => {
          console.error('Error fetching student details:', err);
          setError('Failed to load student details');
          // Convert basic student data to StudentResponse format for fallback
          setStudentDetails({
            id: student.id,
            fullName: student.name,
            email: student.email || '',
            phone: student.phone,
            rollNumber: student.rollNo,
            studentId: student.studentId,
            classId:
              typeof student.class === 'string'
                ? ''
                : (student.class as any)?.id || '',
            className:
              typeof student.class === 'string'
                ? student.class
                : `Grade ${(student.class as any)?.grade || 'Unknown'} ${(student.class as any)?.section || ''}`,
            admissionDate: '',
            academicStatus: student.status.toLowerCase(),
            feeStatus: 'pending',
            isActive: student.status === 'Active',
            createdAt: new Date().toISOString(),
          } as StudentResponse);
          toast.error('Failed to load student details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (isOpen && student) {
      // If no ID but we have student data, convert to StudentResponse format
      setStudentDetails({
        id: student.id,
        fullName: student.name,
        email: student.email || '',
        phone: student.phone,
        rollNumber: student.rollNo,
        studentId: student.studentId,
        classId:
          typeof student.class === 'string'
            ? ''
            : (student.class as any)?.id || '',
        className:
          typeof student.class === 'string'
            ? student.class
            : `Grade ${(student.class as any)?.grade || 'Unknown'} ${(student.class as any)?.section || ''}`,
        admissionDate: '',
        academicStatus: student.status.toLowerCase(),
        feeStatus: 'pending',
        isActive: student.status === 'Active',
        createdAt: new Date().toISOString(),
      } as StudentResponse);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
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
        <div className='sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Student Profile
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Detailed information about this student
          </p>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {loading && (
            <div className='text-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-green-600 mx-auto mb-4' />
              <p className='text-gray-700'>Loading student details...</p>
            </div>
          )}

          {error && !loading && (
            <div className='text-center py-12'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 mb-2 font-medium'>
                Failed to load student details
              </p>
              <p className='text-gray-500 text-sm'>{error}</p>
            </div>
          )}

          {studentDetails && !loading && (
            <>
              {/* Basic Info */}
              <div className='flex flex-col md:flex-row gap-4 sm:gap-6 pb-6 border-b border-gray-200'>
                <div className='flex-shrink-0'>
                  <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-xl shadow-md bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center'>
                    <User className='w-12 h-12 sm:w-16 sm:h-16 text-green-600' />
                  </div>
                </div>

                <div className='flex-grow'>
                  <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                    {`${studentDetails.firstName || ''} ${studentDetails.middleName || ''} ${studentDetails.lastName || ''}`
                      .replace(/\s+/g, ' ')
                      .trim() || studentDetails.fullName}
                  </h3>

                  <div className='flex flex-wrap gap-2 mt-2'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      {studentDetails.className || 'Student'}
                    </span>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      Roll No: {studentDetails.rollNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        studentDetails.academicStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : studentDetails.academicStatus === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {studentDetails.academicStatus?.charAt(0).toUpperCase() +
                        studentDetails.academicStatus?.slice(1) || 'Active'}
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                    <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                      <Mail className='h-4 w-4 text-gray-400' />
                      <span>{studentDetails.email || 'N/A'}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                      <Phone className='h-4 w-4 text-gray-400' />
                      <span>{studentDetails.phone || 'N/A'}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Calendar className='h-4 w-4 text-gray-400' />
                      <span>DOB: {formatDate(studentDetails.dateOfBirth)}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <GraduationCap className='h-4 w-4 text-gray-400' />
                      <span>
                        Admitted: {formatDate(studentDetails.admissionDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6'>
                {/* Personal Information */}
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                    <User className='h-4 w-4 mr-2 text-green-600' />
                    Personal Information
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Gender
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.gender || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Blood Group
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.bloodGroup || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Ethnicity
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.ethnicity || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className='bg-green-50 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                    <GraduationCap className='h-4 w-4 mr-2 text-green-600' />
                    Academic Information
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-xs text-gray-500 block'>Class</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.className || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Roll Number
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.rollNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Student ID
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.studentId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Fee Status
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          studentDetails.feeStatus === 'paid'
                            ? 'text-green-600'
                            : studentDetails.feeStatus === 'overdue'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {studentDetails.feeStatus?.charAt(0).toUpperCase() +
                          studentDetails.feeStatus?.slice(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className='bg-blue-50 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                    <MapPin className='h-4 w-4 mr-2 text-green-600' />
                    Address Information
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Street
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.street || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>City</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.city || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>State</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.state || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Pin Code
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.pinCode || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className='bg-yellow-50 rounded-lg p-4'>
                  <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center'>
                    <Heart className='h-4 w-4 mr-2 text-green-600' />
                    Additional Information
                  </h4>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Medical Conditions
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.medicalConditions || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Allergies
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.allergies || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Special Needs
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {studentDetails.specialNeeds || 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className='bg-purple-50 rounded-lg p-4 mt-6'>
                <h4 className='text-sm font-semibold text-gray-900 mb-4 flex items-center'>
                  <Users className='h-4 w-4 mr-2 text-green-600' />
                  Parent Information
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h5 className='font-medium text-gray-900 mb-3 border-b pb-2'>
                      Father Details
                    </h5>
                    <div className='space-y-2'>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Name
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {`${studentDetails.fatherFirstName || ''} ${studentDetails.fatherMiddleName || ''} ${studentDetails.fatherLastName || ''}`
                            .replace(/\s+/g, ' ')
                            .trim() || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Email
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.fatherEmail || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Phone
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.fatherPhone || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Occupation
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.fatherOccupation || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className='font-medium text-gray-900 mb-3 border-b pb-2'>
                      Mother Details
                    </h5>
                    <div className='space-y-2'>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Name
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {`${studentDetails.motherFirstName || ''} ${studentDetails.motherMiddleName || ''} ${studentDetails.motherLastName || ''}`
                            .replace(/\s+/g, ' ')
                            .trim() || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Email
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.motherEmail || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Phone
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.motherPhone || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Occupation
                        </span>
                        <span className='text-sm font-medium text-gray-900'>
                          {studentDetails.motherOccupation || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end p-6 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentViewModal;
