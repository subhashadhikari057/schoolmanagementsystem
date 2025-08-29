import { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  RotateCcw,
  GraduationCap,
  Building,
  Phone,
} from 'lucide-react';
import { teacherAttendanceService } from '@/api/services/teacher-attendance.service';
import {
  AttendanceStatus,
  TeacherAttendanceRecord,
} from '@/api/types/teacher-attendance';
import { StaffAttendanceRecord } from '@/api/types/staff-attendance';
import { staffAttendanceService } from '@/api/services/staff-attendance.service';

interface StaffAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  staffType: 'teacher' | 'staff';
}

// Extended interface for UI state management
interface StaffMemberUI {
  id: string;
  name: string;
  employeeId?: string;
  department?: string;
  designation?: string; // Made optional to handle both teachers and staff
  email: string;
  phone?: string;
  imageUrl?: string;
  status?: AttendanceStatus;
  lastAttendance?: string;
  role: 'teacher' | 'staff';
  checkIn?: string;
  checkOut?: string;
  hasUserAccount?: boolean; // For staff members
}

export default function StaffAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  staffType,
}: StaffAttendanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [staffMembers, setStaffMembers] = useState<StaffMemberUI[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const loadTeacherData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);

    try {
      const response =
        await teacherAttendanceService.getTeachersForAttendance(attendanceDate);

      if (response.success && response.data) {
        const teachersWithUI: StaffMemberUI[] = response.data.map(teacher => ({
          ...teacher,
          role: 'teacher' as const,
          hasUserAccount: true, // Teachers always have user accounts
          checkIn:
            teacher.status && ['PRESENT', 'LATE'].includes(teacher.status)
              ? new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : undefined,
        }));

        setStaffMembers(teachersWithUI);
      } else {
        setError('Failed to load teacher data');
        setStaffMembers([]);
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
      setError('Error loading teacher data. Please try again.');
      setStaffMembers([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [attendanceDate]);

  const loadStaffData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);

    try {
      const response =
        await staffAttendanceService.getStaffForAttendance(attendanceDate);

      if (response.success && response.data) {
        const staffWithUI: StaffMemberUI[] = response.data.map(staffMember => ({
          ...staffMember,
          role: 'staff' as const,
          checkIn:
            staffMember.status &&
            ['PRESENT', 'LATE'].includes(staffMember.status)
              ? new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : undefined,
        }));
        setStaffMembers(staffWithUI);
      } else {
        console.error('Failed to load staff data:', response.message);
        setStaffMembers([]);
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
      setError('Failed to load staff data. Please try again.');
      setStaffMembers([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [attendanceDate]);

  // Load teacher data when modal opens or date changes
  useEffect(() => {
    if (isOpen && staffType === 'teacher') {
      loadTeacherData();
    } else if (isOpen && staffType === 'staff') {
      loadStaffData();
    }
  }, [isOpen, staffType, attendanceDate, loadTeacherData, loadStaffData]);

  const updateStaffStatus = (
    staffId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
  ) => {
    const mappedStatus: AttendanceStatus =
      status.toUpperCase() as AttendanceStatus;

    setStaffMembers(
      staffMembers.map(staff =>
        staff.id === staffId
          ? {
              ...staff,
              status: mappedStatus,
              checkIn:
                status === 'present' || status === 'late'
                  ? new Date().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : undefined,
            }
          : staff,
      ),
    );
  };

  const markAllPresent = () => {
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    setStaffMembers(
      staffMembers.map(staff => ({
        ...staff,
        status: 'PRESENT' as AttendanceStatus,
        checkIn: currentTime,
      })),
    );
  };

  const markAllAbsent = () => {
    setStaffMembers(
      staffMembers.map(staff => ({
        ...staff,
        status: 'ABSENT' as AttendanceStatus,
        checkIn: undefined,
      })),
    );
  };

  const resetAttendance = () => {
    if (staffType === 'teacher') {
      // Reload teacher data to reset to original state
      loadTeacherData();
    } else {
      // Reset staff data
      setStaffMembers(
        staffMembers.map(staff => ({
          ...staff,
          status: undefined,
          checkIn: undefined,
          checkOut: undefined,
        })),
      );
    }
  };

  const handleSubmit = async () => {
    // Validate date is not in the future
    const selectedDateObj = new Date(attendanceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDateObj > today) {
      setError(
        'Cannot mark attendance for future dates. Please select today or a past date.',
      );
      return;
    }

    const unmarkedStaff = staffMembers.filter(s => !s.status);
    if (unmarkedStaff.length > 0) {
      alert(
        `Please mark attendance for all ${staffType === 'teacher' ? 'teachers' : 'staff members'}. ${unmarkedStaff.length} remaining.`,
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (staffType === 'teacher') {
        // Use real API for teachers
        const teacherRecords: TeacherAttendanceRecord[] = staffMembers
          .filter(staff => staff.status)
          .map(staff => ({
            teacherId: staff.id,
            status: staff.status!,
            remarks: undefined,
          }));

        const response = await teacherAttendanceService.markAttendance({
          date: attendanceDate,
          sessionType: 'daily',
          teachers: teacherRecords,
          notes: `Teacher attendance marked for ${teacherRecords.length} teachers`,
        });

        if (response.success) {
          setShowSuccess(true);
          // Call the success callback to refresh parent data
          onSuccess?.();
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Failed to save teacher attendance');
        }
      } else {
        // Use real API for staff
        const staffRecords: StaffAttendanceRecord[] = staffMembers
          .filter(staff => staff.status)
          .map(staff => ({
            staffId: staff.id,
            status: staff.status!,
            remarks: undefined,
          }));

        const response = await staffAttendanceService.markAttendance({
          date: attendanceDate,
          sessionType: 'daily',
          staff: staffRecords,
          notes: `Staff attendance marked for ${staffRecords.length} staff members`,
        });

        if (response.success) {
          setShowSuccess(true);
          // Call the success callback to refresh parent data
          onSuccess?.();
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 2000);
        } else {
          setError(response.message || 'Failed to save staff attendance');
        }
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Error saving attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique departments for filtering
  const departments = Array.from(
    new Set(
      staffMembers
        .map(staff => staff.department)
        .filter(dept => dept && dept.trim() !== ''),
    ),
  ).sort();

  // Calculate attendance statistics
  const attendanceStats = {
    total: staffMembers.length,
    present: staffMembers.filter(s => s.status === 'PRESENT').length,
    absent: staffMembers.filter(s => s.status === 'ABSENT').length,
    late: staffMembers.filter(s => s.status === 'LATE').length,
    excused: staffMembers.filter(s => s.status === 'EXCUSED').length,
    unmarked: staffMembers.filter(s => !s.status).length,
  };

  // Filter staff members based on search and department
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.designation &&
        staff.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (staff.department &&
        staff.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment =
      selectedDepartment === 'all' || staff.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-xl max-w-5xl w-full h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex-shrink-0 p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              {staffType === 'teacher' ? (
                <GraduationCap className='w-5 h-5' />
              ) : (
                <UserCog className='w-5 h-5' />
              )}
              <h2 className='text-xl font-semibold'>
                {staffType === 'teacher' ? 'Teacher' : 'Staff'} Attendance
              </h2>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600'
            >
              <XCircle className='w-6 h-6' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-hidden flex flex-col space-y-4 p-6'>
          {isDataLoading && (
            <div className='flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
              <span className='text-blue-800 text-sm'>
                Loading {staffType} data... Please wait.
              </span>
            </div>
          )}

          {isLoading && (
            <div className='flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
              <span className='text-blue-800 text-sm'>
                Saving attendance... Please wait.
              </span>
            </div>
          )}

          {showSuccess && (
            <div className='flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span className='text-green-800 text-sm'>
                Attendance marked successfully for {staffMembers.length}{' '}
                {staffType === 'teacher' ? 'teachers' : 'staff members'}!
              </span>
            </div>
          )}

          {error && (
            <div className='flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <span className='text-red-800 text-sm'>{error}</span>
            </div>
          )}

          {/* Date and Department Filters (removed session filter) */}
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg flex-shrink-0'>
            <div className='space-y-2'>
              <label className='text-xs font-medium text-gray-700'>Date</label>
              <input
                type='date'
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className='w-full h-9 px-3 border border-gray-300 rounded-md text-sm'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-medium text-gray-700'>
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className='w-full h-9 px-3 border border-gray-300 rounded-md text-sm'
              >
                <option value='all'>All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-medium text-gray-700'>Time</label>
              <div className='h-9 px-3 border border-gray-300 rounded-md flex items-center bg-white text-sm'>
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>
          </div>

          {/* Attendance Statistics */}
          <div className='grid grid-cols-3 md:grid-cols-6 gap-2 flex-shrink-0'>
            <div className='text-center p-2 bg-blue-50 rounded-lg'>
              <div className='text-lg font-bold text-blue-600'>
                {attendanceStats.total}
              </div>
              <div className='text-xs text-blue-800'>Total</div>
            </div>
            <div className='text-center p-2 bg-green-50 rounded-lg'>
              <div className='text-lg font-bold text-green-600'>
                {attendanceStats.present}
              </div>
              <div className='text-xs text-green-800'>Present</div>
            </div>
            <div className='text-center p-2 bg-red-50 rounded-lg'>
              <div className='text-lg font-bold text-red-600'>
                {attendanceStats.absent}
              </div>
              <div className='text-xs text-red-800'>Absent</div>
            </div>
            <div className='text-center p-2 bg-yellow-50 rounded-lg'>
              <div className='text-lg font-bold text-yellow-600'>
                {attendanceStats.late}
              </div>
              <div className='text-xs text-yellow-800'>Late</div>
            </div>
            <div className='text-center p-2 bg-purple-50 rounded-lg'>
              <div className='text-lg font-bold text-purple-600'>
                {attendanceStats.excused}
              </div>
              <div className='text-xs text-purple-800'>Excused</div>
            </div>
            <div className='text-center p-2 bg-gray-50 rounded-lg'>
              <div className='text-lg font-bold text-gray-600'>
                {attendanceStats.unmarked}
              </div>
              <div className='text-xs text-gray-800'>Unmarked</div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className='flex flex-col sm:flex-row gap-3 flex-shrink-0'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder={`Search ${staffType}s by name, department, or designation...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div className='flex gap-2'>
              <button
                onClick={markAllPresent}
                disabled={isLoading || isDataLoading}
                className='px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1'
              >
                <CheckCircle className='w-4 h-4' />
                All Present
              </button>
              <button
                onClick={markAllAbsent}
                disabled={isLoading || isDataLoading}
                className='px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1'
              >
                <XCircle className='w-4 h-4' />
                All Absent
              </button>
              <button
                onClick={resetAttendance}
                disabled={isLoading || isDataLoading}
                className='px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1'
              >
                <RotateCcw className='w-4 h-4' />
                Reset
              </button>
            </div>
          </div>

          {/* Staff List */}
          <div className='flex-1 overflow-y-auto border border-gray-200 rounded-lg'>
            <div className='min-w-full'>
              {/* Header */}
              <div className='bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-medium text-gray-700'>
                <div className='col-span-3'>Name & Info</div>
                <div className='col-span-2'>Department</div>
                <div className='col-span-2'>Contact</div>
                <div className='col-span-2'>Status</div>
                <div className='col-span-3'>Actions</div>
              </div>

              {/* Staff Rows */}
              <div className='divide-y divide-gray-200'>
                {filteredStaff.length === 0 ? (
                  <div className='px-4 py-8 text-center text-gray-500'>
                    {isDataLoading ? 'Loading...' : 'No staff members found'}
                  </div>
                ) : (
                  filteredStaff.map(staff => (
                    <div
                      key={staff.id}
                      className='px-4 py-3 grid grid-cols-12 gap-4 hover:bg-gray-50'
                    >
                      {/* Name & Info */}
                      <div className='col-span-3 flex items-center space-x-3'>
                        <div className='flex-shrink-0'>
                          <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                            {staff.imageUrl ? (
                              <img
                                src={staff.imageUrl}
                                alt={staff.name}
                                className='w-10 h-10 rounded-full object-cover'
                              />
                            ) : (
                              <span className='text-sm font-medium text-gray-600'>
                                {staff.name.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='min-w-0'>
                          <div className='flex items-center space-x-2'>
                            <p className='text-sm font-medium text-gray-900 truncate'>
                              {staff.name}
                            </p>
                            {staff.hasUserAccount && (
                              <span
                                className='text-xs text-blue-600'
                                title='Has login access'
                              >
                                🔑
                              </span>
                            )}
                          </div>
                          <p className='text-xs text-gray-500 truncate'>
                            {staff.designation || 'No Designation'}
                          </p>
                          <div className='flex items-center space-x-2'>
                            {staff.employeeId && (
                              <p className='text-xs text-gray-400'>
                                ID: {staff.employeeId}
                              </p>
                            )}
                            {!staff.hasUserAccount && (
                              <span className='text-xs text-blue-600 font-medium'>
                                No Login
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Department */}
                      <div className='col-span-2 flex items-center'>
                        <div className='flex items-center space-x-1'>
                          <Building className='w-4 h-4 text-gray-400' />
                          <span className='text-sm text-gray-600'>
                            {staff.department || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className='col-span-2 flex items-center'>
                        <div className='text-xs text-gray-600'>
                          <div className='flex items-center space-x-1 mb-1'>
                            <Phone className='w-3 h-3 text-gray-400' />
                            <span>{staff.phone || 'N/A'}</span>
                          </div>
                          <div className='truncate'>{staff.email}</div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className='col-span-2 flex items-center'>
                        <div className='flex items-center space-x-2'>
                          {staff.status === 'PRESENT' && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              <CheckCircle className='w-3 h-3 mr-1' />
                              Present
                            </span>
                          )}
                          {staff.status === 'ABSENT' && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                              <XCircle className='w-3 h-3 mr-1' />
                              Absent
                            </span>
                          )}
                          {staff.status === 'LATE' && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                              <Clock className='w-3 h-3 mr-1' />
                              Late
                            </span>
                          )}
                          {staff.status === 'EXCUSED' && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                              <AlertTriangle className='w-3 h-3 mr-1' />
                              Excused
                            </span>
                          )}
                          {!staff.status && (
                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                              Unmarked
                            </span>
                          )}
                          {staff.checkIn && (
                            <div className='text-xs text-gray-500'>
                              {staff.checkIn}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='col-span-3 flex items-center space-x-1'>
                        <button
                          onClick={() => updateStaffStatus(staff.id, 'present')}
                          disabled={isLoading || isDataLoading}
                          className='px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50'
                        >
                          Present
                        </button>
                        <button
                          onClick={() => updateStaffStatus(staff.id, 'absent')}
                          disabled={isLoading || isDataLoading}
                          className='px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50'
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => updateStaffStatus(staff.id, 'late')}
                          disabled={isLoading || isDataLoading}
                          className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 disabled:opacity-50'
                        >
                          Late
                        </button>
                        <button
                          onClick={() => updateStaffStatus(staff.id, 'excused')}
                          disabled={isLoading || isDataLoading}
                          className='px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50'
                        >
                          Excused
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className='flex justify-between items-center pt-4 border-t border-gray-200 flex-shrink-0'>
            <div className='text-sm text-gray-600'>
              {filteredStaff.length} {staffType}s • {attendanceStats.unmarked}{' '}
              unmarked
            </div>
            <div className='flex space-x-3'>
              <button
                onClick={onClose}
                disabled={isLoading}
                className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading || isDataLoading || attendanceStats.unmarked > 0
                }
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Attendance</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
