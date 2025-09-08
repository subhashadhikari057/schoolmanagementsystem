import React, { useEffect, useState, useCallback } from 'react';
import { X, User, Search, Check } from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { TeacherService } from '@/api/services/teacher.service';

interface Teacher {
  id: string;
  userId: string;
  employeeId?: string;
  designation: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export function TeacherAssignmentModal() {
  const {
    isTeacherModalOpen,
    selectedSlotForTeacher,
    availableTeachers,
    closeTeacherModal,
    assignTeacherToSlot,
    setAvailableTeachers,
  } = useScheduleStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      const service = new TeacherService();
      const resp = await service.getAllTeachers();
      if (resp.success && resp.data) {
        // Handle both direct array and paginated response
        const teacherList = Array.isArray(resp.data)
          ? resp.data
          : resp.data.data;

        // Map API response to Teacher shape expected by store
        const mapped: Teacher[] = teacherList.map(t => ({
          id: t.id,
          userId: t.id, // backend Teacher entity id; userId not directly returned in list, reuse id
          employeeId: t.employeeId,
          designation: t.designation || 'Teacher',
          user: {
            id: t.id,
            fullName: t.fullName,
            email: t.email,
          },
        }));
        setAvailableTeachers(mapped);
      } else {
        console.error('Failed to load teachers list');
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  }, [setAvailableTeachers]);

  // Load teachers when modal opens
  useEffect(() => {
    if (isTeacherModalOpen && availableTeachers.length === 0) {
      loadTeachers();
    }
  }, [isTeacherModalOpen, availableTeachers.length, loadTeachers]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isTeacherModalOpen) {
      setSearchTerm('');
      setSelectedTeacher(selectedSlotForTeacher?.teacher || null);
    }
  }, [isTeacherModalOpen, selectedSlotForTeacher]);

  const handleAssignTeacher = () => {
    if (!selectedTeacher || !selectedSlotForTeacher) return;

    assignTeacherToSlot(selectedSlotForTeacher.id, selectedTeacher);
    closeTeacherModal();
  };

  // Filter teachers based on search term
  const filteredTeachers = availableTeachers.filter(
    teacher =>
      teacher.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isTeacherModalOpen || !selectedSlotForTeacher) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4'>
        {/* Transparent Blur Backdrop */}
        <div
          className='fixed inset-0 bg-black/20 backdrop-blur-md transition-all duration-300'
          onClick={closeTeacherModal}
        />

        {/* Modal */}
        <div className='relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <div className='flex-1'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Assign Teacher
              </h2>
              <p className='mt-1 text-sm text-gray-600'>
                {selectedSlotForTeacher.subject?.name} •{' '}
                {selectedSlotForTeacher.day}
              </p>
            </div>
            <button
              onClick={closeTeacherModal}
              className='ml-4 text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>

          {/* Content */}
          <div className='flex flex-col max-h-[calc(90vh-140px)]'>
            {/* Search */}
            <div className='p-6 border-b border-gray-200'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search teachers...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* Teacher List */}
            <div className='flex-1 overflow-y-auto p-6'>
              {filteredTeachers.length === 0 ? (
                <div className='text-center py-8'>
                  <User className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-4 text-sm font-medium text-gray-900'>
                    No teachers found
                  </h3>
                  <p className='mt-2 text-sm text-gray-500'>
                    {searchTerm
                      ? 'Try adjusting your search criteria.'
                      : 'No teachers available.'}
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {filteredTeachers.map(teacher => {
                    const isSelected = selectedTeacher?.id === teacher.id;

                    return (
                      <div
                        key={teacher.id}
                        className={`
                          relative p-4 border rounded-lg cursor-pointer transition-all
                          ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                        onClick={() => setSelectedTeacher(teacher)}
                      >
                        <div className='flex items-center space-x-4'>
                          <div
                            className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                          `}
                          >
                            <User className='w-5 h-5' />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <h3 className='text-sm font-medium text-gray-900 truncate'>
                              {teacher.user.fullName}
                            </h3>
                            <p className='text-sm text-gray-600'>
                              {teacher.designation}
                            </p>
                            {teacher.employeeId && (
                              <p className='text-xs text-gray-500'>
                                ID: {teacher.employeeId}
                              </p>
                            )}
                          </div>

                          {isSelected && (
                            <Check className='w-5 h-5 text-blue-600 flex-shrink-0' />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50'>
            <button
              onClick={closeTeacherModal}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleAssignTeacher}
              disabled={!selectedTeacher}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  selectedTeacher
                    ? 'text-white bg-blue-600 hover:bg-blue-700'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }
              `}
            >
              Assign Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
