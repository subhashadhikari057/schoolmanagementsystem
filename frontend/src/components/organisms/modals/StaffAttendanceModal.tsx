import { useState, useEffect } from 'react';
import {
  UserCog,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Download,
  RotateCcw,
  GraduationCap,
  Building,
  Phone,
} from 'lucide-react';

interface StaffAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffType: 'teacher' | 'staff';
}

interface StaffMember {
  id: string;
  name: string;
  role: 'teacher' | 'staff';
  department: string;
  designation?: string;
  phone?: string;
  email?: string;
  status: 'present' | 'absent' | 'late' | 'excused' | null;
  checkIn?: string;
  checkOut?: string;
  lastAttendance?: string;
  photo?: string;
}

export default function StaffAttendanceModal({
  isOpen,
  onClose,
  staffType,
}: StaffAttendanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [attendanceSession, setAttendanceSession] = useState('full-day');

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Mock data based on staff type
  useEffect(() => {
    if (isOpen) {
      const mockData =
        staffType === 'teacher'
          ? [
              {
                id: 'T001',
                name: 'Dr. Sarah Johnson',
                role: 'teacher' as const,
                department: 'Mathematics',
                designation: 'Head of Department',
                phone: '+1 234-567-8901',
                email: 'sarah.johnson@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T002',
                name: 'Prof. Michael Brown',
                role: 'teacher' as const,
                department: 'Physics',
                designation: 'Senior Teacher',
                phone: '+1 234-567-8902',
                email: 'michael.brown@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T003',
                name: 'Ms. Emily Davis',
                role: 'teacher' as const,
                department: 'English',
                designation: 'Teacher',
                phone: '+1 234-567-8903',
                email: 'emily.davis@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T004',
                name: 'Mr. David Wilson',
                role: 'teacher' as const,
                department: 'Chemistry',
                designation: 'Senior Teacher',
                phone: '+1 234-567-8904',
                email: 'david.wilson@school.edu',
                status: null,
                lastAttendance: '2025-01-26',
              },
              {
                id: 'T005',
                name: 'Dr. Lisa Anderson',
                role: 'teacher' as const,
                department: 'Biology',
                designation: 'Head of Department',
                phone: '+1 234-567-8905',
                email: 'lisa.anderson@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T006',
                name: 'Mr. James Garcia',
                role: 'teacher' as const,
                department: 'History',
                designation: 'Teacher',
                phone: '+1 234-567-8906',
                email: 'james.garcia@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T007',
                name: 'Ms. Rachel Martinez',
                role: 'teacher' as const,
                department: 'Geography',
                designation: 'Teacher',
                phone: '+1 234-567-8907',
                email: 'rachel.martinez@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'T008',
                name: 'Mr. Kevin Lee',
                role: 'teacher' as const,
                department: 'Physical Education',
                designation: 'Sports Teacher',
                phone: '+1 234-567-8908',
                email: 'kevin.lee@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
            ]
          : [
              {
                id: 'S001',
                name: 'John Smith',
                role: 'staff' as const,
                department: 'Administration',
                designation: 'Administrative Officer',
                phone: '+1 234-567-9001',
                email: 'john.smith@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S002',
                name: 'Maria Garcia',
                role: 'staff' as const,
                department: 'Library',
                designation: 'Librarian',
                phone: '+1 234-567-9002',
                email: 'maria.garcia@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S003',
                name: 'Robert Lee',
                role: 'staff' as const,
                department: 'IT Support',
                designation: 'IT Technician',
                phone: '+1 234-567-9003',
                email: 'robert.lee@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S004',
                name: 'Jennifer Taylor',
                role: 'staff' as const,
                department: 'Cafeteria',
                designation: 'Food Service Manager',
                phone: '+1 234-567-9004',
                email: 'jennifer.taylor@school.edu',
                status: null,
                lastAttendance: '2025-01-26',
              },
              {
                id: 'S005',
                name: 'Michael Jackson',
                role: 'staff' as const,
                department: 'Maintenance',
                designation: 'Maintenance Supervisor',
                phone: '+1 234-567-9005',
                email: 'michael.jackson@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S006',
                name: 'Susan Wilson',
                role: 'staff' as const,
                department: 'Security',
                designation: 'Security Officer',
                phone: '+1 234-567-9006',
                email: 'susan.wilson@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S007',
                name: 'Thomas Brown',
                role: 'staff' as const,
                department: 'Transport',
                designation: 'Bus Driver',
                phone: '+1 234-567-9007',
                email: 'thomas.brown@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
              {
                id: 'S008',
                name: 'Linda Davis',
                role: 'staff' as const,
                department: 'Health',
                designation: 'School Nurse',
                phone: '+1 234-567-9008',
                email: 'linda.davis@school.edu',
                status: null,
                lastAttendance: '2025-01-27',
              },
            ];

      setStaffMembers(mockData);
    }
  }, [staffType, isOpen]);

  const updateStaffStatus = (
    staffId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
  ) => {
    setStaffMembers(
      staffMembers.map(staff =>
        staff.id === staffId
          ? {
              ...staff,
              status,
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
        status: 'present',
        checkIn: currentTime,
      })),
    );
  };

  const markAllAbsent = () => {
    setStaffMembers(
      staffMembers.map(staff => ({
        ...staff,
        status: 'absent',
        checkIn: undefined,
      })),
    );
  };

  const resetAttendance = () => {
    setStaffMembers(
      staffMembers.map(staff => ({
        ...staff,
        status: null,
        checkIn: undefined,
        checkOut: undefined,
      })),
    );
  };

  const handleSubmit = async () => {
    const unmarkedStaff = staffMembers.filter(s => s.status === null);
    if (unmarkedStaff.length > 0) {
      alert(
        `Please mark attendance for all ${staffType === 'teacher' ? 'teachers' : 'staff members'}. ${unmarkedStaff.length} remaining.`,
      );
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        resetAttendance();
      }, 2000);
    }, 2000);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className='w-4 h-4' />;
      case 'absent':
        return <XCircle className='w-4 h-4' />;
      case 'late':
        return <Clock className='w-4 h-4' />;
      case 'excused':
        return <AlertTriangle className='w-4 h-4' />;
      default:
        return null;
    }
  };

  const attendanceStats = {
    present: staffMembers.filter(s => s.status === 'present').length,
    absent: staffMembers.filter(s => s.status === 'absent').length,
    late: staffMembers.filter(s => s.status === 'late').length,
    excused: staffMembers.filter(s => s.status === 'excused').length,
    unmarked: staffMembers.filter(s => s.status === null).length,
    total: staffMembers.length,
  };

  const departments = [...new Set(staffMembers.map(staff => staff.department))];

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.designation &&
        staff.designation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment =
      selectedDepartment === 'all' || staff.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl max-w-5xl w-full h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex-shrink-0 p-6 border-b border-gray-200'>
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
        </div>

        <div className='flex-1 overflow-hidden flex flex-col space-y-4 p-6'>
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

          {/* Session Information */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg flex-shrink-0'>
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
              <label className='text-xs font-medium text-gray-700'>
                Session
              </label>
              <select
                value={attendanceSession}
                onChange={e => setAttendanceSession(e.target.value)}
                className='w-full h-9 px-3 border border-gray-300 rounded-md text-sm'
              >
                <option value='morning'>Morning</option>
                <option value='afternoon'>Afternoon</option>
                <option value='full-day'>Full Day</option>
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
              <div className='text-xs text-gray-800'>Pending</div>
            </div>
          </div>

          {/* Search and Quick Actions */}
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 flex-shrink-0'>
            <div className='flex items-center space-x-2 w-full md:w-auto'>
              <div className='relative flex-1 md:w-64'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  placeholder={`Search ${staffType === 'teacher' ? 'teachers' : 'staff'}...`}
                  className='w-full pl-10 h-9 px-3 border border-gray-300 rounded-md text-sm'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className='flex items-center space-x-1 overflow-x-auto'>
              <button
                onClick={markAllPresent}
                className='flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50'
              >
                <CheckCircle className='w-3 h-3' />
                <span>All Present</span>
              </button>
              <button
                onClick={markAllAbsent}
                className='flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50'
              >
                <XCircle className='w-3 h-3' />
                <span>All Absent</span>
              </button>
              <button
                onClick={resetAttendance}
                className='flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50'
              >
                <RotateCcw className='w-3 h-3' />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Staff List - Scrollable */}
          <div className='flex-1 border rounded-lg overflow-hidden'>
            <div className='h-full overflow-y-auto p-3 space-y-2'>
              {filteredStaff.map(staff => (
                <div
                  key={staff.id}
                  className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white'
                >
                  <div className='flex items-center space-x-4 flex-1 min-w-0'>
                    <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-sm font-medium'>
                        {staff.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </span>
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900'>{staff.name}</p>
                      <div className='flex items-center space-x-2 text-sm text-gray-600'>
                        <Building className='w-3 h-3' />
                        <span>{staff.department}</span>
                        {staff.designation && (
                          <>
                            <span>•</span>
                            <span>{staff.designation}</span>
                          </>
                        )}
                      </div>
                      <div className='flex items-center space-x-4 text-xs text-gray-500 mt-1'>
                        {staff.phone && (
                          <div className='flex items-center space-x-1'>
                            <Phone className='w-3 h-3' />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                        {staff.checkIn && (
                          <div className='flex items-center space-x-1'>
                            <Clock className='w-3 h-3' />
                            <span>Check-in: {staff.checkIn}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {staff.status && (
                      <div
                        className={`${getStatusColor(staff.status)} px-2 py-1 rounded-full flex items-center space-x-1 flex-shrink-0`}
                      >
                        {getStatusIcon(staff.status)}
                        <span className='capitalize text-xs'>
                          {staff.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center space-x-1 flex-shrink-0 ml-4'>
                    <button
                      onClick={() => updateStaffStatus(staff.id, 'present')}
                      className={`h-8 w-8 p-0 rounded border flex items-center justify-center ${
                        staff.status === 'present'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircle className='w-3 h-3' />
                    </button>

                    <button
                      onClick={() => updateStaffStatus(staff.id, 'absent')}
                      className={`h-8 w-8 p-0 rounded border flex items-center justify-center ${
                        staff.status === 'absent'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <XCircle className='w-3 h-3' />
                    </button>

                    <button
                      onClick={() => updateStaffStatus(staff.id, 'late')}
                      className={`h-8 w-8 p-0 rounded border flex items-center justify-center ${
                        staff.status === 'late'
                          ? 'bg-yellow-600 text-white border-yellow-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className='w-3 h-3' />
                    </button>

                    <button
                      onClick={() => updateStaffStatus(staff.id, 'excused')}
                      className={`h-8 w-8 p-0 rounded border flex items-center justify-center ${
                        staff.status === 'excused'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <AlertTriangle className='w-3 h-3' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className='space-y-2 flex-shrink-0'>
            <div className='flex justify-between text-sm'>
              <span>Progress</span>
              <span>
                {attendanceStats.total - attendanceStats.unmarked}/
                {attendanceStats.total} marked
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary h-2 rounded-full transition-all'
                style={{
                  width: `${attendanceStats.total > 0 ? ((attendanceStats.total - attendanceStats.unmarked) / attendanceStats.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='flex flex-col md:flex-row justify-between items-center p-6 border-t space-y-2 md:space-y-0 flex-shrink-0'>
          <div className='flex items-center space-x-2'>
            <button className='flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50'>
              <Download className='w-4 h-4' />
              <span>Export</span>
            </button>
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || attendanceStats.unmarked > 0}
              className='px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <span className='flex items-center space-x-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Saving...</span>
                </span>
              ) : (
                `Save Attendance ${attendanceStats.unmarked > 0 ? `(${attendanceStats.unmarked} pending)` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
