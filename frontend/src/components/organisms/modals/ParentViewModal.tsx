'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Users,
  AlertCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Parent } from '@/components/templates/listConfigurations';
import { parentService, ParentResponse } from '@/api/services/parent.service';
import {
  studentService,
  StudentResponse,
} from '@/api/services/student.service';
import { toast } from 'sonner';

interface ParentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
}

const ParentViewModal: React.FC<ParentViewModalProps> = ({
  isOpen,
  onClose,
  parent,
}) => {
  const [parentDetails, setParentDetails] = useState<ParentResponse | null>(
    null,
  );
  const [studentDetails, setStudentDetails] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentFetchErrors, setStudentFetchErrors] = useState<
    Record<string, string>
  >({});

  // Fetch detailed parent and student data when modal opens
  useEffect(() => {
    if (isOpen && parent && parent.id) {
      setLoading(true);
      setError(null);
      setStudentDetails([]);

      // Validate parent ID before making API call
      const parentId = String(parent.id);
      if (!parentId || parentId === 'undefined' || parentId === 'null') {
        setError('Invalid parent ID');
        // Convert basic parent data to ParentResponse format for fallback
        setParentDetails({
          id: parent.id,
          userId: parent.userId,
          fullName: parent.name,
          email: parent.email || '',
          phone: parent.phone,
          children: parent.children,
          createdAt: new Date().toISOString(),
        } as ParentResponse);
        setLoading(false);
        return;
      }

      // Fetch detailed parent data from API
      parentService
        .getParentById(parentId)
        .then(async response => {
          if (response.success && response.data) {
            setParentDetails(response.data);
            setError(null);

            // Fetch student details for each child
            if (response.data.children && response.data.children.length > 0) {
              try {
                console.log('📊 Parent children data:', response.data.children);
                setStudentFetchErrors({}); // Reset errors

                // The children array contains objects with the relationship between parent and student
                // Based on the schema, we need to use the studentId field
                const childrenWithIds = response.data.children
                  .filter(child => child && typeof child === 'object')
                  .map(child => {
                    // In ParentStudentLink model, studentId is the ID of the student
                    // This is the correct field to use for fetching student details
                    const studentId = (child as any).studentId;
                    console.log(`Child data:`, child);
                    return { child, studentId };
                  })
                  .filter(({ studentId }) => !!studentId);

                if (childrenWithIds.length === 0) {
                  console.warn('No valid student IDs found in children data');
                  return;
                }

                // Track errors per student ID
                const newStudentFetchErrors: Record<string, string> = {};

                const studentDetailsPromises = childrenWithIds.map(
                  ({ studentId }) => {
                    console.log(
                      `🔍 Fetching student details for ID: ${studentId}`,
                    );
                    return studentService
                      .getStudentById(studentId)
                      .catch(err => {
                        console.error(
                          `Error fetching student details for ID ${studentId}:`,
                          err,
                        );
                        // Store the error message for this student
                        newStudentFetchErrors[studentId] =
                          'Student information temporarily unavailable';
                        return { success: false, data: null };
                      });
                  },
                );

                const studentResults = await Promise.all(
                  studentDetailsPromises,
                );
                const validStudentDetails = studentResults
                  .filter(result => result.success && result.data)
                  .map(result => result.data as StudentResponse);

                // Update student details and errors
                setStudentDetails(validStudentDetails);
                setStudentFetchErrors(newStudentFetchErrors);

                console.log('🏫 Student details fetched:', validStudentDetails);
                console.log(
                  '🔄 Mapping of studentIds to students:',
                  childrenWithIds.map(({ studentId }) => ({
                    studentId,
                    foundStudent:
                      validStudentDetails.find(s => s.id === studentId)
                        ?.fullName || 'not found',
                  })),
                );
                if (Object.keys(newStudentFetchErrors).length > 0) {
                  console.warn('Student fetch errors:', newStudentFetchErrors);
                }
              } catch (err) {
                console.error('Error processing student data:', err);
                toast.error('Error loading student details');
              }
            }
          } else {
            setError(response.message || 'Failed to load parent details');
            // Convert basic parent data to ParentResponse format for fallback
            setParentDetails({
              id: parent.id,
              userId: parent.userId,
              fullName: parent.name,
              email: parent.email || '',
              phone: parent.phone,
              children: parent.children,
              createdAt: new Date().toISOString(),
            } as ParentResponse);
          }
        })
        .catch(err => {
          console.error('Error fetching parent details:', err);
          setError('Failed to load parent details');
          // Convert basic parent data to ParentResponse format for fallback
          setParentDetails({
            id: parent.id,
            userId: parent.userId,
            fullName: parent.name,
            email: parent.email || '',
            phone: parent.phone,
            children: parent.children,
            createdAt: new Date().toISOString(),
          } as ParentResponse);
          toast.error('Failed to load parent details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (isOpen && parent) {
      // If no ID but we have parent data, convert to ParentResponse format
      setParentDetails({
        id: parent.id,
        userId: parent.userId,
        fullName: parent.name,
        email: parent.email || '',
        phone: parent.phone,
        children: parent.children,
        createdAt: new Date().toISOString(),
      } as ParentResponse);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, parent]);

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
        <div className='sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-t-xl border-b border-gray-100 z-10'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors'
          >
            <X className='h-5 w-5 text-gray-500' />
          </button>

          <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
            Parent Profile
          </h2>
          <p className='text-gray-600 mt-1 text-sm sm:text-base'>
            Detailed information about this parent and their children
          </p>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6'>
          {loading && (
            <div className='text-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
              <p className='text-gray-700'>Loading parent details...</p>
            </div>
          )}

          {error && !loading && (
            <div className='text-center py-12'>
              <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <p className='text-red-600 mb-2 font-medium'>
                Failed to load parent details
              </p>
              <p className='text-gray-500 text-sm'>{error}</p>
            </div>
          )}

          {parentDetails && !loading && (
            <>
              {/* Basic Info */}
              <div className='flex flex-col md:flex-row gap-4 sm:gap-6 pb-6 border-b border-gray-200'>
                <div className='flex-shrink-0'>
                  <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-xl shadow-md bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center'>
                    <User className='w-12 h-12 sm:w-16 sm:h-16 text-blue-600' />
                  </div>
                </div>

                <div className='flex-grow'>
                  <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                    {parentDetails.fullName}
                  </h3>

                  <div className='flex flex-wrap gap-2 mt-2'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      Parent
                    </span>
                    {/* Check for occupation in both profile and direct property */}
                    {(parentDetails.profile?.occupation ||
                      parentDetails.occupation) && (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                        {parentDetails.profile?.occupation ||
                          parentDetails.occupation}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parentDetails.deletedAt
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {parentDetails.deletedAt ? 'Inactive' : 'Active'}
                    </span>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                    <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                      <Mail className='h-4 w-4 text-gray-400' />
                      <span>{parentDetails.email || 'N/A'}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600 break-words'>
                      <Phone className='h-4 w-4 text-gray-400' />
                      <span>{parentDetails.phone || 'N/A'}</span>
                    </div>
                    {parentDetails.profile?.dateOfBirth && (
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <Calendar className='h-4 w-4 text-gray-400' />
                        <span>
                          DOB: {formatDate(parentDetails.profile.dateOfBirth)}
                        </span>
                      </div>
                    )}
                    {parentDetails.profile?.workPlace && (
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <Briefcase className='h-4 w-4 text-gray-400' />
                        <span>{parentDetails.profile.workPlace}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* No personal info tabs as requested */}

              {/* Children Information */}
              <div className='bg-green-50 rounded-lg p-4 mt-6'>
                <h4 className='text-sm font-semibold text-gray-900 mb-4 flex items-center'>
                  <Users className='h-4 w-4 mr-2 text-blue-600' />
                  Children Information
                </h4>
                <div className='grid grid-cols-1 gap-6'>
                  {parentDetails.children &&
                  parentDetails.children.length > 0 ? (
                    parentDetails.children.map((child, index) => {
                      // Find matching student details using the studentId field from ParentStudentLink
                      const studentId = (child as any).studentId;
                      const matchingStudent = studentDetails.find(
                        student => student.id === studentId,
                      );

                      return (
                        <div
                          key={child.id || index}
                          className='border-l-4 border-blue-400 pl-4 bg-white rounded-r-lg p-3'
                        >
                          <h5 className='font-medium text-gray-900 mb-3 flex items-center'>
                            <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2'>
                              Student
                            </span>
                          </h5>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                            <div>
                              <span className='text-xs text-gray-500 block'>
                                Name
                              </span>
                              <span className='text-sm font-medium text-gray-900'>
                                {matchingStudent
                                  ? matchingStudent.firstName &&
                                    matchingStudent.lastName
                                    ? `${matchingStudent.firstName} ${matchingStudent.middleName ? matchingStudent.middleName + ' ' : ''}${matchingStudent.lastName}`
                                    : matchingStudent.fullName || 'N/A'
                                  : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className='text-xs text-gray-500 block'>
                                Class
                              </span>
                              <span className='text-sm font-medium text-gray-900'>
                                {matchingStudent?.className || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className='text-xs text-gray-500 block'>
                                Roll Number
                              </span>
                              <span className='text-sm font-medium text-gray-900'>
                                {matchingStudent?.rollNumber || 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className='text-xs text-gray-500 block'>
                                Student ID
                              </span>
                              <span className='text-sm font-medium text-gray-900'>
                                {matchingStudent?.studentId ||
                                  (child as any).studentId ||
                                  'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Student Address Information */}
                          {matchingStudent && (
                            <div className='mt-4 border-t pt-4 border-gray-100'>
                              <h6 className='text-sm font-semibold text-gray-800 mb-3 flex items-center'>
                                <MapPin className='h-4 w-4 mr-2 text-blue-600' />
                                Student Address Information
                              </h6>
                              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-blue-50 p-3 rounded-md'>
                                <div>
                                  <span className='text-xs text-gray-600 font-medium block'>
                                    Street
                                  </span>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {matchingStudent.street || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className='text-xs text-gray-600 font-medium block'>
                                    City
                                  </span>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {matchingStudent.city || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className='text-xs text-gray-600 font-medium block'>
                                    State
                                  </span>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {matchingStudent.state || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className='text-xs text-gray-600 font-medium block'>
                                    Pin Code
                                  </span>
                                  <span className='text-sm font-medium text-gray-900'>
                                    {matchingStudent.pinCode || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          {!matchingStudent && (
                            <div className='mt-4 border-t pt-4 border-gray-100'>
                              <h6 className='text-sm font-semibold text-gray-800 mb-3 flex items-center'>
                                <MapPin className='h-4 w-4 mr-2 text-blue-600' />
                                Student Address Information
                              </h6>
                              <div className='bg-amber-50 p-3 rounded-md'>
                                <div className='text-sm text-amber-700'>
                                  {studentFetchErrors[
                                    (child as any).studentId || ''
                                  ] ? (
                                    <span>
                                      <AlertCircle className='h-4 w-4 inline-block mr-1' />
                                      Student information temporarily
                                      unavailable. Please try again in a few
                                      minutes.
                                    </span>
                                  ) : (
                                    <span>
                                      <AlertCircle className='h-4 w-4 inline-block mr-1' />
                                      Student information not available. The
                                      student record may be incomplete.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center py-6 bg-white rounded-lg'>
                      <GraduationCap className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-600 mb-2'>
                        No children linked to this parent
                      </p>
                      <p className='text-sm text-gray-500'>
                        You can add children using the Edit button
                      </p>
                    </div>
                  )}
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

export default ParentViewModal;
