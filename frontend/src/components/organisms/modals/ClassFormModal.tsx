'use client';

import React, { useState, useEffect } from 'react';
import { X, School, Search, User, Building, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  classService,
  AvailableRoom,
  AvailableTeacher,
} from '@/api/services/class.service';
import { roomService, CreateRoomRequest } from '@/api/services/room.service';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  className: string;
  grade: number;
  section: string;
  capacity: number;
  shift: 'morning' | 'day';
  classTeacherId: string;
  roomId: string;
}

interface NewRoomData {
  roomNo: string;
  name: string;
  floor: number;
  building: string;
}

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];
const SHIFTS = ['morning', 'day'];

const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    className: '',
    grade: 1,
    section: 'A',
    capacity: 30,
    shift: 'morning',
    classTeacherId: '',
    roomId: '',
  });

  const [teachers, setTeachers] = useState<AvailableTeacher[]>([]);
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<AvailableTeacher[]>(
    [],
  );
  const [filteredRooms, setFilteredRooms] = useState<AvailableRoom[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomOption, setRoomOption] = useState<'new' | 'existing'>('existing');
  const [newRoomData, setNewRoomData] = useState<NewRoomData>({
    roomNo: '',
    name: '',
    floor: 1,
    building: '',
  });
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

  // Load teachers and rooms when modal opens or shift changes
  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      loadRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, formData.shift]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, onClose]);

  // Filter teachers based on search term
  useEffect(() => {
    if (!teacherSearchTerm) {
      setFilteredTeachers(teachers);
      return;
    }

    const filtered = teachers.filter(
      teacher =>
        teacher.fullName
          .toLowerCase()
          .includes(teacherSearchTerm.toLowerCase()) ||
        (teacher.employeeId &&
          teacher.employeeId
            .toLowerCase()
            .includes(teacherSearchTerm.toLowerCase())) ||
        teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase()),
    );

    setFilteredTeachers(filtered);
  }, [teacherSearchTerm, teachers]);

  // Filter rooms based on search term (rooms are already filtered by shift from API)
  useEffect(() => {
    let availableRooms = [...rooms];

    // Apply search term filter if provided
    if (roomSearchTerm) {
      availableRooms = availableRooms.filter(
        room =>
          room.roomNo.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
          (room.name &&
            room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())) ||
          (room.building &&
            room.building.toLowerCase().includes(roomSearchTerm.toLowerCase())),
      );
    }

    setFilteredRooms(availableRooms);
  }, [roomSearchTerm, rooms]);

  const loadTeachers = async () => {
    try {
      const response = await classService.getAvailableTeachers();
      if (response.success && response.data) {
        setTeachers(response.data);
        setFilteredTeachers(response.data);
      }
    } catch (error) {
      console.error('Failed to load available teachers:', error);
      toast.error('Failed to load available teachers');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await classService.getAvailableRooms(formData.shift);
      if (response.success && response.data) {
        setRooms(response.data);
        setFilteredRooms(response.data);
      }
    } catch (error) {
      console.error('Failed to load available rooms:', error);
      toast.error('Failed to load available rooms');
    }
  };

  const resetForm = () => {
    setFormData({
      className: '',
      grade: 1,
      section: 'A',
      capacity: 30,
      shift: 'morning',
      classTeacherId: '',
      roomId: '',
    });
    setCurrentStep(1);
    setTeacherSearchTerm('');
    setRoomSearchTerm('');
    setRoomOption('existing');
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'grade' || name === 'capacity' ? parseInt(value, 10) : value,
    }));

    if (error) setError(null);
  };

  const handleTeacherSelect = (teacher: AvailableTeacher) => {
    setFormData(prev => ({
      ...prev,
      classTeacherId: teacher.id,
    }));
    setTeacherSearchTerm(teacher.fullName);
    setIsTeacherDropdownOpen(false);
  };

  const handleRoomSelect = (room: AvailableRoom) => {
    setFormData(prev => ({
      ...prev,
      roomId: room.id,
    }));
    setRoomSearchTerm(`${room.roomNo}${room.name ? ` - ${room.name}` : ''}`);
  };

  const handleNewRoomInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewRoomData(prev => ({
      ...prev,
      [name]:
        name === 'capacity' || name === 'floor' ? parseInt(value, 10) : value,
    }));
  };

  const handleCreateRoom = async () => {
    // Validate room data
    if (!newRoomData.roomNo) {
      setError('Room number is required');
      return;
    }

    if (!newRoomData.floor) {
      setError('Floor number is required');
      return;
    }

    // Check if room number already exists
    try {
      const existingRooms = await roomService.getAllRooms();
      if (existingRooms.success && existingRooms.data) {
        const roomExists = existingRooms.data.rooms.some(
          room =>
            room.roomNo.toLowerCase() === newRoomData.roomNo.toLowerCase() &&
            !room.deletedAt,
        );

        if (roomExists) {
          setError(`Room number ${newRoomData.roomNo} already exists`);
          return;
        }
      }
    } catch (err) {
      console.warn('Error checking for existing rooms:', err);
      // Continue with room creation even if check fails
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create room request
      const roomRequest: CreateRoomRequest = {
        roomNo: newRoomData.roomNo,
        name: newRoomData.name || undefined,
        floor: newRoomData.floor,
        building: newRoomData.building || undefined,
        isAvailable: true,
      };

      const response = await roomService.createRoom(roomRequest);

      if (response.success && response.data) {
        toast.success('Room created successfully', {
          description: `Room ${newRoomData.roomNo} has been created.`,
        });

        // Add the new room to our list and select it
        const newRoom: AvailableRoom = {
          ...response.data,
          assignedClasses: [],
        };
        setRooms(prev => [...prev, newRoom]);
        setFilteredRooms(prev => [...prev, newRoom]);

        // Select the newly created room
        handleRoomSelect(newRoom);

        // Switch back to existing room view
        setRoomOption('existing');
      } else {
        throw new Error(response.message || 'Failed to create room');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error creating room:', error);

      // Handle specific error messages
      let errorMessage = 'Failed to create room';
      let errorDescription = 'An unexpected error occurred';

      if (error.message) {
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          errorMessage = 'Room already exists';
          errorDescription = `Room number ${newRoomData.roomNo} is already in use`;
        } else if (error.message === '{}' || error.message === '') {
          // Handle empty error object or message
          errorMessage = 'Server error';
          errorDescription =
            'The server returned an empty error. Please check if the room already exists or try again later.';
        } else {
          // Use the error message as is if it's not empty
          errorDescription = error.message;
        }
      } else if (typeof error === 'object' && Object.keys(error).length === 0) {
        // Handle empty error object
        errorMessage = 'Server error';
        errorDescription =
          'The server returned an empty error. Please check if the room already exists or try again later.';
      }

      toast.error(errorMessage, {
        description: errorDescription,
      });
      setError(errorDescription);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.grade) return 'Please select a grade';
    if (!formData.section) return 'Please select a section';
    if (!formData.capacity || formData.capacity < 1)
      return 'Please enter a valid capacity';
    if (!formData.shift) return 'Please select a shift';
    if (!formData.classTeacherId) return 'Please select a class teacher';

    return null;
  };

  const validateStep2 = () => {
    if (roomOption === 'existing' && !formData.roomId)
      return 'Please select a room';
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep1();
    if (error) {
      setError(error);
      return;
    }

    // Clear any previous errors when moving to step 2
    setError(null);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error =
      currentStep === 1
        ? validateStep1()
        : roomOption === 'existing'
          ? validateStep2()
          : null;
    if (error) {
      setError(error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const classData = {
        name:
          formData.className ||
          `Grade ${formData.grade} Section ${formData.section}`,
        grade: formData.grade,
        section: formData.section,
        capacity: formData.capacity,
        shift: formData.shift,
        roomId: formData.roomId,
        classTeacherId: formData.classTeacherId,
      };

      const response = await classService.createClass(classData);

      if (response.success) {
        toast.success('Class created successfully', {
          description: `Grade ${formData.grade} Section ${formData.section} in ${formData.shift} shift has been created.`,
        });

        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error(response.message || 'Failed to create class');
      }
    } catch (err) {
      const error = err as Error;
      // Error details are handled by toast notifications below

      // Handle specific error messages
      let errorMessage = 'Failed to create class';
      let errorDescription = 'An unexpected error occurred';

      if (error.message) {
        // Check for common error patterns
        if (error.message.includes('already exists')) {
          errorMessage = 'Class Already Exists';
          // Create a user-friendly description
          if (error.message.includes('morning shift')) {
            errorDescription = `A class for Grade ${formData.grade} Section ${formData.section} already exists in the morning shift. Please choose a different grade, section, or try the day shift.`;
          } else if (error.message.includes('day shift')) {
            errorDescription = `A class for Grade ${formData.grade} Section ${formData.section} already exists in the day shift. Please choose a different grade, section, or try the morning shift.`;
          } else {
            errorDescription = `A class for Grade ${formData.grade} Section ${formData.section} already exists. Please choose a different grade or section.`;
          }
        } else if (
          error.message.includes('room') ||
          error.message.includes('Room')
        ) {
          errorMessage = 'Room Assignment Issue';
          errorDescription = error.message.includes('not available')
            ? 'The selected room is not available for this shift. Please choose a different room or create a new one.'
            : error.message;
        } else if (
          error.message.includes('teacher') ||
          error.message.includes('Teacher')
        ) {
          errorMessage = 'Teacher Assignment Issue';
          errorDescription = error.message.includes('already assigned')
            ? 'The selected teacher is already assigned as a class teacher to another class. Please choose a different teacher.'
            : error.message;
        } else if (error.message === '{}' || error.message === '') {
          // Handle empty error object or message
          errorMessage = 'Server error';
          errorDescription =
            'The server returned an empty error. Please check if the class already exists or try again later.';
        } else {
          // Use the error message as is if it's not empty
          errorDescription = error.message;
        }
      } else if (typeof error === 'object' && Object.keys(error).length === 0) {
        // Handle empty error object
        errorMessage = 'Server error';
        errorDescription =
          'The server returned an empty error. Please check if the class already exists or try again later.';
      }

      toast.error(errorMessage, {
        description: errorDescription,
      });
      setError(errorDescription);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto'
      onClick={() => !isLoading && onClose()}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl animate-in slide-in-from-bottom-4'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100'>
          <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl' />
          <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-200/40 to-pink-200/40 rounded-full blur-xl' />
          <div className='relative flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                <School size={24} className='text-white' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {currentStep === 1 ? 'Create New Class' : 'Assign Room'}
                </h2>
                <p className='text-sm text-gray-600 mt-1'>
                  {currentStep === 1
                    ? 'Enter class details and assign a teacher'
                    : 'Select or create a room for this class'}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='flex items-center space-x-1'>
                <div
                  className={`h-2 w-2 rounded-full ${currentStep === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}
                ></div>
                <div
                  className={`h-2 w-2 rounded-full ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
                ></div>
              </div>
              <button
                onClick={() => !isLoading && onClose()}
                disabled={isLoading}
                className='p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200 disabled:opacity-50'
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Step indicator */}
          <div className='mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  1
                </div>
                <div
                  className={`h-1 w-16 mx-2 ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-200'}`}
                ></div>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  2
                </div>
              </div>
              <div className='text-sm font-medium text-gray-700'>
                Step {currentStep} of 2
              </div>
            </div>
            <div className='flex justify-between mt-2'>
              <span className='text-xs text-gray-600'>Class Details</span>
              <span className='text-xs text-gray-600'>Room Assignment</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Step 1: Class Details */}
            {currentStep === 1 && (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Grade <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='grade'
                      value={formData.grade}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        grade => (
                          <option key={grade} value={grade}>
                            Grade {grade}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Section <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='section'
                      value={formData.section}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                    >
                      {SECTIONS.map(section => (
                        <option key={section} value={section}>
                          Section {section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Capacity <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='number'
                      name='capacity'
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min={1}
                      max={100}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Shift <span className='text-red-500'>*</span>
                    </label>
                    <select
                      name='shift'
                      value={formData.shift}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                    >
                      {SHIFTS.map(shift => (
                        <option key={shift} value={shift}>
                          {shift.charAt(0).toUpperCase() + shift.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='text-sm font-medium leading-none mb-2 block'>
                    Class Name (Optional)
                  </label>
                  <input
                    type='text'
                    name='className'
                    value={formData.className}
                    onChange={handleInputChange}
                    placeholder='Leave blank to auto-generate (e.g., Grade 5 Section A)'
                    className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium leading-none mb-2 block'>
                    Class Teacher <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='flex'>
                      <div className='relative flex-grow'>
                        <input
                          type='text'
                          value={teacherSearchTerm}
                          onChange={e => {
                            setTeacherSearchTerm(e.target.value);
                            setIsTeacherDropdownOpen(true);
                          }}
                          onFocus={() => setIsTeacherDropdownOpen(true)}
                          placeholder='Search for a teacher...'
                          className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 pl-9'
                        />
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                      </div>
                    </div>

                    {isTeacherDropdownOpen && (
                      <div className='absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto'>
                        {filteredTeachers.length > 0 ? (
                          <ul>
                            {filteredTeachers.map(teacher => (
                              <li
                                key={teacher.id}
                                onClick={() => handleTeacherSelect(teacher)}
                                className='px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center'
                              >
                                <User className='h-4 w-4 text-gray-500 mr-2' />
                                <div>
                                  <div className='font-medium'>
                                    {teacher.fullName}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    {teacher.employeeId
                                      ? `ID: ${teacher.employeeId} • `
                                      : ''}
                                    {teacher.email}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className='px-4 py-2 text-gray-500'>
                            No teachers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Class teacher is required and will be assigned to this
                    specific class and section
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Room Assignment */}
            {currentStep === 2 && (
              <div className='space-y-6'>
                <div className='flex justify-center mb-4'>
                  <div className='inline-flex rounded-md shadow-sm'>
                    <button
                      type='button'
                      onClick={() => setRoomOption('existing')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                        roomOption === 'existing'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300`}
                    >
                      Use Existing Room
                    </button>
                    <button
                      type='button'
                      onClick={() => setRoomOption('new')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                        roomOption === 'new'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } border border-gray-300 border-l-0`}
                    >
                      Create New Room
                    </button>
                  </div>
                </div>

                {roomOption === 'existing' ? (
                  <div>
                    <label className='text-sm font-medium leading-none mb-2 block'>
                      Select Room <span className='text-red-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type='text'
                        value={roomSearchTerm}
                        onChange={e => setRoomSearchTerm(e.target.value)}
                        placeholder='Search for a room...'
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 pl-9'
                      />
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                    </div>

                    <div className='mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto'>
                      {filteredRooms.length > 0 ? (
                        <ul className='divide-y divide-gray-200'>
                          {filteredRooms.map(room => (
                            <li
                              key={room.id}
                              onClick={() => handleRoomSelect(room)}
                              className={`px-4 py-3 hover:bg-gray-100 cursor-pointer ${
                                formData.roomId === room.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className='flex items-start'>
                                <Building className='h-5 w-5 text-gray-500 mr-3 mt-0.5' />
                                <div>
                                  <div className='font-medium'>
                                    Room {room.roomNo}
                                    {room.name && ` - ${room.name}`}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    Floor: {room.floor}
                                    {room.building &&
                                      ` • Building: ${room.building}`}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className='px-4 py-3 text-gray-500 text-center'>
                          No rooms found matching your criteria
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='text-sm font-medium leading-none mb-2 block'>
                          Room Number <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='text'
                          name='roomNo'
                          value={newRoomData.roomNo}
                          onChange={handleNewRoomInputChange}
                          placeholder='e.g., 101'
                          className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                        />
                      </div>
                      <div>
                        <label className='text-sm font-medium leading-none mb-2 block'>
                          Room Name
                        </label>
                        <input
                          type='text'
                          name='name'
                          value={newRoomData.name}
                          onChange={handleNewRoomInputChange}
                          placeholder='e.g., Science Lab'
                          className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='text-sm font-medium leading-none mb-2 block'>
                        Floor <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='number'
                        name='floor'
                        value={newRoomData.floor}
                        onChange={handleNewRoomInputChange}
                        min={0}
                        max={20}
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium leading-none mb-2 block'>
                        Building
                      </label>
                      <input
                        type='text'
                        name='building'
                        value={newRoomData.building}
                        onChange={handleNewRoomInputChange}
                        placeholder='e.g., Main Building'
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                      />
                    </div>

                    <button
                      type='button'
                      onClick={handleCreateRoom}
                      disabled={isLoading}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create New Room
                    </button>
                  </div>
                )}

                <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <h4 className='text-sm font-semibold text-blue-800 mb-2'>
                    Selected Class Details
                  </h4>
                  <p className='text-sm text-blue-700'>
                    Grade {formData.grade} Section {formData.section} •{' '}
                    {formData.shift.charAt(0).toUpperCase() +
                      formData.shift.slice(1)}{' '}
                    Shift • Capacity: {formData.capacity}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-md p-4'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
              {currentStep === 1 ? (
                <button
                  type='button'
                  onClick={() => !isLoading && onClose()}
                  disabled={isLoading}
                  className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Cancel
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handlePrevStep}
                  disabled={isLoading}
                  className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Back
                </button>
              )}

              <div>
                {currentStep === 1 ? (
                  <button
                    type='button'
                    onClick={handleNextStep}
                    disabled={isLoading}
                    className='ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  >
                    {isLoading ? 'Creating...' : 'Create Class'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassFormModal;
