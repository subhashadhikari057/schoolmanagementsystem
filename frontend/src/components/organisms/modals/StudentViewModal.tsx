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
  FileText,
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

  const InfoItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number | undefined;
    className?: string;
  }> = ({ icon, label, value, className = '' }) => (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className='text-gray-500 mt-1'>{icon}</div>
      <div>
        <p className='text-sm font-medium text-gray-700'>{label}</p>
        <p className='text-sm text-gray-900'>{value || 'Not provided'}</p>
      </div>
    </div>
  );

  const InfoSection: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
  }> = ({ title, children, icon }) => (
    <div className='bg-gray-50 rounded-lg p-4'>
      <div className='flex items-center space-x-2 mb-3'>
        {icon && <div className='text-gray-600'>{icon}</div>}
        <h3 className='font-semibold text-gray-900'>{title}</h3>
      </div>
      <div className='space-y-3'>{children}</div>
    </div>
  );

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <User className='h-6 w-6 text-blue-600' />
            <h2 className='text-xl font-semibold text-gray-900'>
              Student Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <span className='ml-2 text-gray-600'>
                Loading student details...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                <p className='text-red-600 mb-2'>
                  Failed to load student details
                </p>
                <p className='text-gray-500 text-sm'>{error}</p>
              </div>
            </div>
          )}

          {studentDetails && !loading && (
            <div className='space-y-6'>
              {/* Basic Information */}
              <InfoSection title='Basic Information' icon={<User size={20} />}>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <InfoItem
                    icon={<User size={16} />}
                    label='Full Name'
                    value={`${studentDetails.firstName || ''} ${studentDetails.middleName || ''} ${studentDetails.lastName || ''}`
                      .replace(/\s+/g, ' ')
                      .trim()}
                  />
                  <InfoItem
                    icon={<GraduationCap size={16} />}
                    label='Student ID'
                    value={studentDetails.rollNumber}
                  />
                  <InfoItem
                    icon={<Mail size={16} />}
                    label='Email'
                    value={studentDetails.email}
                  />
                  <InfoItem
                    icon={<Phone size={16} />}
                    label='Phone'
                    value={studentDetails.phone || 'Not provided'}
                  />
                  <InfoItem
                    icon={<Calendar size={16} />}
                    label='Date of Birth'
                    value={formatDate(studentDetails.dateOfBirth)}
                  />
                  <InfoItem
                    icon={<User size={16} />}
                    label='Gender'
                    value={studentDetails.gender || 'Not provided'}
                  />
                </div>
              </InfoSection>

              {/* Academic Information */}
              <InfoSection
                title='Academic Information'
                icon={<GraduationCap size={20} />}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <InfoItem
                    icon={<GraduationCap size={16} />}
                    label='Class'
                    value={studentDetails.className || 'Not provided'}
                  />
                  <InfoItem
                    icon={<FileText size={16} />}
                    label='Roll Number'
                    value={studentDetails.rollNumber}
                  />
                  <InfoItem
                    icon={<Calendar size={16} />}
                    label='Admission Date'
                    value={formatDate(studentDetails.admissionDate)}
                  />
                  <InfoItem
                    icon={<AlertCircle size={16} />}
                    label='Status'
                    value={studentDetails.academicStatus}
                  />
                </div>
              </InfoSection>

              {/* Parent Information */}
              <InfoSection
                title='Parent Information'
                icon={<Users size={20} />}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-3 border-b pb-2'>
                      Father Details
                    </h4>
                    <div className='space-y-3'>
                      <InfoItem
                        icon={<User size={16} />}
                        label='Name'
                        value={
                          `${studentDetails.fatherFirstName || ''} ${studentDetails.fatherMiddleName || ''} ${studentDetails.fatherLastName || ''}`
                            .replace(/\s+/g, ' ')
                            .trim() || 'Not provided'
                        }
                      />
                      <InfoItem
                        icon={<Mail size={16} />}
                        label='Email'
                        value={studentDetails.fatherEmail || 'Not provided'}
                      />
                      <InfoItem
                        icon={<Phone size={16} />}
                        label='Phone'
                        value={studentDetails.fatherPhone || 'Not provided'}
                      />
                      <InfoItem
                        icon={<FileText size={16} />}
                        label='Occupation'
                        value={
                          studentDetails.fatherOccupation || 'Not provided'
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-3 border-b pb-2'>
                      Mother Details
                    </h4>
                    <div className='space-y-3'>
                      <InfoItem
                        icon={<User size={16} />}
                        label='Name'
                        value={
                          `${studentDetails.motherFirstName || ''} ${studentDetails.motherMiddleName || ''} ${studentDetails.motherLastName || ''}`
                            .replace(/\s+/g, ' ')
                            .trim() || 'Not provided'
                        }
                      />
                      <InfoItem
                        icon={<Mail size={16} />}
                        label='Email'
                        value={studentDetails.motherEmail || 'Not provided'}
                      />
                      <InfoItem
                        icon={<Phone size={16} />}
                        label='Phone'
                        value={studentDetails.motherPhone || 'Not provided'}
                      />
                      <InfoItem
                        icon={<FileText size={16} />}
                        label='Occupation'
                        value={
                          studentDetails.motherOccupation || 'Not provided'
                        }
                      />
                    </div>
                  </div>
                </div>
              </InfoSection>

              {/* Address Information */}
              <InfoSection
                title='Address Information'
                icon={<MapPin size={20} />}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label='Address'
                    value={studentDetails.address || 'Not provided'}
                  />
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label='City'
                    value={studentDetails.city || 'Not provided'}
                  />
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label='State'
                    value={studentDetails.state || 'Not provided'}
                  />
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label='PIN Code'
                    value={studentDetails.pinCode || 'Not provided'}
                  />
                </div>
              </InfoSection>

              {/* Medical Information */}
              <InfoSection
                title='Medical Information'
                icon={<Heart size={20} />}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <InfoItem
                    icon={<Heart size={16} />}
                    label='Blood Group'
                    value={studentDetails.bloodGroup || 'Not provided'}
                  />
                  <InfoItem
                    icon={<AlertCircle size={16} />}
                    label='Medical Conditions'
                    value={studentDetails.medicalConditions || 'None'}
                  />
                  <InfoItem
                    icon={<AlertCircle size={16} />}
                    label='Allergies'
                    value={studentDetails.allergies || 'None'}
                  />
                  <InfoItem
                    icon={<FileText size={16} />}
                    label='Special Needs'
                    value={studentDetails.specialNeeds || 'None'}
                  />
                </div>
              </InfoSection>

              {/* Additional Information */}
              {(studentDetails.interests || studentDetails.bio) && (
                <InfoSection
                  title='Additional Information'
                  icon={<FileText size={20} />}
                >
                  <div className='space-y-3'>
                    {studentDetails.interests && (
                      <InfoItem
                        icon={<FileText size={16} />}
                        label='Interests'
                        value={studentDetails.interests}
                      />
                    )}
                    {studentDetails.bio && (
                      <InfoItem
                        icon={<FileText size={16} />}
                        label='Bio'
                        value={studentDetails.bio}
                      />
                    )}
                  </div>
                </InfoSection>
              )}
            </div>
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
