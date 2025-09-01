'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  AlertCircle,
  Check,
  Printer,
  Copy,
  Edit,
} from 'lucide-react';
import { useExamTimetableStore } from '@/store/exam-timetable';
import { ExamDateslotType } from '@sms/shared-types';
import {
  examTimetableService,
  examScheduleService,
} from '@/api/services/exam-timetable.service';
import { classSubjectService } from '@/api/services/class-subject.service';
import { classService } from '@/api/services/class.service';
import { calendarService } from '@/api/services/calendar.service';
import { toast } from 'sonner';

// Types - using the store's Subject type
interface StoreSubject {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxMarks?: number;
  passMarks?: number;
}

interface ExamDateslot {
  id: string;
  examDate: Date;
  startTime?: string;
  endTime?: string;
  label?: string;
  type: ExamDateslotType;
}

interface ExamTimetableSlot {
  id: string;
  dateslotId: string;
  subjectId?: string;
  subject?: StoreSubject;
  instructions?: string;
}

// Component for dragged subject overlay
const DraggedSubjectOverlay: React.FC<{ subject: StoreSubject }> = ({
  subject,
}) => (
  <div className='bg-blue-100 border border-blue-300 rounded-lg p-3 shadow-lg transform rotate-2'>
    <div className='flex items-center space-x-2'>
      <BookOpen className='w-4 h-4 text-blue-600' />
      <div>
        <div className='font-medium text-blue-800'>{subject.name}</div>
        <div className='text-xs text-blue-600'>{subject.code}</div>
      </div>
    </div>
  </div>
);

// Subject library component for exam timetables
const ExamSubjectLibrary: React.FC<{ isViewMode?: boolean }> = ({
  isViewMode = false,
}) => {
  const {
    availableSubjects,
    examTimetableSlots,
    selectedClassId,
    setAvailableSubjects,
  } = useExamTimetableStore();

  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');

  // Load subjects for the selected class
  const loadClassSubjects = useCallback(async () => {
    if (!selectedClassId) return;

    setIsLoadingSubjects(true);
    try {
      const response = await classSubjectService.getClassSubjects({
        classId: selectedClassId,
        includeSubjectDetails: true,
        includeTeacher: false,
      });
      if (response.success && response.data) {
        // Extract subjects from class-subject assignments
        const subjects: StoreSubject[] = response.data
          .map(cs => cs.subject)
          .filter((subject): subject is NonNullable<typeof subject> =>
            Boolean(subject),
          )
          .map(subject => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            description: subject.description || undefined,
            maxMarks: subject.maxMarks,
            passMarks: subject.passMarks,
          }));
        setAvailableSubjects(subjects);
      }
    } catch (error) {
      console.error('Error loading class subjects:', error);
      toast.error('Failed to load subjects for this class');
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [selectedClassId, setAvailableSubjects]);

  useEffect(() => {
    loadClassSubjects();
  }, [loadClassSubjects]);

  // Filter subjects based on search
  const filteredSubjects = availableSubjects.filter(
    subject =>
      subject.name.toLowerCase().includes(subjectFilter.toLowerCase()) ||
      subject.code.toLowerCase().includes(subjectFilter.toLowerCase()),
  );

  // Check if subject is already assigned
  const getAssignedCount = (subjectId: string) => {
    return examTimetableSlots.filter(slot => slot.subjectId === subjectId)
      .length;
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-medium text-gray-800 flex items-center'>
          <BookOpen className='w-5 h-5 mr-2' />
          Subject Library
        </h3>
      </div>

      {/* Search filter */}
      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search subjects...'
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </div>

      {/* Subjects list - horizontal layout */}
      <div className='overflow-x-auto'>
        {isLoadingSubjects ? (
          <div className='text-center py-4'>
            <RefreshCw className='w-5 h-5 animate-spin mx-auto text-gray-400' />
            <p className='text-sm text-gray-500 mt-2'>Loading subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className='text-center py-4'>
            <BookOpen className='w-8 h-8 mx-auto text-gray-400' />
            <p className='text-sm text-gray-500 mt-2'>No subjects found</p>
          </div>
        ) : (
          <div className='flex space-x-3 min-w-max pb-2'>
            {filteredSubjects.map(subject => {
              const assignedCount = getAssignedCount(subject.id);
              return (
                <DraggableExamSubject
                  key={subject.id}
                  subject={subject}
                  assignedCount={assignedCount}
                  isViewMode={isViewMode}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Draggable subject component for exam timetables
const DraggableExamSubject: React.FC<{
  subject: StoreSubject;
  assignedCount: number;
  isViewMode?: boolean;
}> = ({ subject, assignedCount, isViewMode = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `exam-subject-${subject.id}`,
      disabled: isViewMode, // Disable dragging in view mode
      data: {
        type: 'subject',
        subject,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border transition-all duration-200 cursor-move min-w-[200px] max-w-[250px]
        ${isDragging ? 'opacity-50 shadow-lg transform rotate-2' : ''}
        ${
          assignedCount > 0
            ? 'bg-green-50 border-green-200 hover:bg-green-100'
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
        }
        hover:shadow-md
      `}
    >
      <div className='text-center'>
        <div className='font-medium text-gray-800 text-sm'>{subject.name}</div>
        <div className='text-xs text-gray-600'>{subject.code}</div>
        {assignedCount > 0 && (
          <div className='mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded'>
            {assignedCount} assigned
          </div>
        )}
      </div>
    </div>
  );
};

// Exam dateslot grid component
const ExamDateslotGrid: React.FC<{
  configuredDateslots: ExamDateslot[];
  isViewMode: boolean;
}> = ({ configuredDateslots, isViewMode }) => {
  const { examTimetableSlots } = useExamTimetableStore();

  // Group configured dateslots by date
  const dateGroups = configuredDateslots.reduce(
    (groups, dateslot) => {
      const dateKey = dateslot.examDate.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(dateslot);
      return groups;
    },
    {} as Record<string, ExamDateslot[]>,
  );

  // Get assignment for dateslot
  const getAssignment = (dateslotId: string) => {
    return examTimetableSlots.find(slot => slot.dateslotId === dateslotId);
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200'>
      <div className='p-4 border-b border-gray-200'>
        <h3 className='text-lg font-medium text-gray-800 flex items-center'>
          <Calendar className='w-5 h-5 mr-2' />
          Exam Timetable Grid
        </h3>
        <p className='text-sm text-gray-600 mt-1'>
          Drag subjects from the library to exam slots to build your timetable
        </p>
      </div>

      <div className='p-4'>
        {Object.keys(dateGroups).length === 0 ? (
          <div className='text-center py-8'>
            <Calendar className='w-12 h-12 mx-auto text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mt-2'>
              No exam dates found
            </h3>
            <p className='text-gray-500'>
              Please ensure the selected exam period has dateslots created
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            {/* Show helpful message if no subjects assigned yet */}
            {examTimetableSlots.length === 0 && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
                <div className='flex items-start'>
                  <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5 mr-3' />
                  <div>
                    <h4 className='font-medium text-blue-800'>
                      Ready to Build Exam Timetable
                    </h4>
                    <p className='text-sm text-blue-700 mt-1'>
                      Drag subjects from the Subject Library on the left to the
                      exam slots below to create your exam timetable. Each
                      subject can be assigned to multiple exam sessions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Horizontal layout for exam dates */}
            <div className='min-w-max'>
              {/* Header row with dates */}
              <div className='border-b-2 border-gray-200 bg-gray-50 rounded-t-lg'>
                <div className='flex'>
                  {Object.entries(dateGroups)
                    .sort(
                      ([a], [b]) =>
                        new Date(a).getTime() - new Date(b).getTime(),
                    )
                    .map(([dateStr, dateslots]) => (
                      <div
                        key={dateStr}
                        className='flex-1 min-w-[300px] px-4 py-3 border-r border-gray-200 last:border-r-0'
                      >
                        <div className='text-center'>
                          <h4 className='text-lg font-medium text-gray-800 flex items-center justify-center'>
                            <Calendar className='w-4 h-4 mr-2' />
                            {new Date(dateStr).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {dateslots.some(slot => {
                              const assignment = getAssignment(slot.id);
                              return assignment && assignment.subject;
                            }) && (
                              <Check className='w-4 h-4 ml-2 text-green-600' />
                            )}
                          </h4>
                          <p className='text-xs text-gray-500 mt-1'>
                            {dateslots.length} slot
                            {dateslots.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Content row with time slots */}
              <div className='flex bg-white rounded-b-lg'>
                {Object.entries(dateGroups)
                  .sort(
                    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
                  )
                  .map(([dateStr, dateslots]) => (
                    <div
                      key={dateStr}
                      className='flex-1 min-w-[300px] p-4 border-r border-gray-200 last:border-r-0'
                    >
                      <div className='space-y-3'>
                        {dateslots
                          .sort((a, b) =>
                            (a.startTime || '').localeCompare(
                              b.startTime || '',
                            ),
                          )
                          .map(dateslot => {
                            const assignment = getAssignment(dateslot.id);
                            const isExamSlot =
                              dateslot.type === ExamDateslotType.EXAM;

                            return (
                              <DroppableExamSlot
                                key={dateslot.id}
                                dateslot={dateslot}
                                assignment={assignment}
                                isExamSlot={isExamSlot}
                                isViewMode={isViewMode}
                              />
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable exam slot component
const DroppableExamSlot: React.FC<{
  dateslot: ExamDateslot;
  assignment: ExamTimetableSlot | undefined;
  isExamSlot: boolean;
  isViewMode: boolean;
}> = ({ dateslot, assignment, isExamSlot, isViewMode }) => {
  const { removeSubjectFromDateslot } = useExamTimetableStore();

  const { isOver, setNodeRef } = useDroppable({
    id: `dateslot-${dateslot.id}`,
    disabled: !isExamSlot || isViewMode, // Only allow drops on exam slots when not in view mode
    data: {
      type: 'dateslot',
      dateslotId: dateslot.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 rounded-lg border-2 border-dashed transition-all duration-200
        ${
          isExamSlot
            ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-300 bg-gray-50'
        }
        ${assignment ? 'border-solid border-green-400 bg-green-50' : ''}
        ${isOver && isExamSlot ? 'border-blue-500 bg-blue-100' : ''}
        min-h-[120px]
      `}
    >
      {/* Time header */}
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center text-sm text-gray-600'>
          <Clock className='w-4 h-4 mr-1' />
          {dateslot.startTime && dateslot.endTime
            ? `${dateslot.startTime} - ${dateslot.endTime}`
            : 'All Day'}
        </div>
        <div
          className={`
          px-2 py-1 rounded text-xs font-medium
          ${
            dateslot.type === ExamDateslotType.EXAM
              ? 'bg-blue-100 text-blue-800'
              : dateslot.type === ExamDateslotType.BREAK
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
          }
        `}
        >
          {dateslot.type}
        </div>
      </div>

      {/* Assignment content */}
      {assignment && assignment.subject ? (
        <div className='space-y-2'>
          <div className='font-medium text-gray-800'>
            {assignment.subject.name}
          </div>
          <div className='text-sm text-gray-600'>{assignment.subject.code}</div>
          {assignment.instructions && (
            <div className='text-xs text-gray-500'>
              {assignment.instructions}
            </div>
          )}
          {!isViewMode && (
            <button
              onClick={() => removeSubjectFromDateslot(assignment.id)}
              className='text-red-600 hover:text-red-800 text-xs flex items-center'
            >
              Remove
            </button>
          )}
        </div>
      ) : isExamSlot ? (
        <div className='text-center text-gray-500'>
          <BookOpen className='w-6 h-6 mx-auto mb-1' />
          <div className='text-sm'>Drop subject here</div>
        </div>
      ) : (
        <div className='text-center text-gray-400'>
          <div className='text-sm'>{dateslot.label || dateslot.type}</div>
        </div>
      )}
    </div>
  );
};

export function ExamTimetableBuilder() {
  const {
    selectedCalendarEntryId,
    selectedCalendarEntry,
    selectedClassId,
    selectedClass,
    selectedExamScheduleId,
    examDateslots,
    examTimetableSlots,
    draggedSubject,
    isLoadingTimetable,
    validationErrors,
    validationWarnings,
    setDraggedSubject,
    setExamTimetableSlots,
    setIsLoadingTimetable,
    setHasLoadedTimetable,
    setSelectedExamSchedule,
    validateExamTimetable,
  } = useExamTimetableStore();

  const [showSubjects, setShowSubjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [userExplicitlyEditing, setUserExplicitlyEditing] = useState(false);
  const examLoadInFlightRef = useRef(new Set<string>());

  // Load exam timetable data
  const loadExamTimetable = useCallback(async () => {
    // Validate both IDs are proper UUIDs before making API calls
    if (
      !selectedCalendarEntryId ||
      !selectedCalendarEntryId.match(/^[0-9a-fA-F-]{36}$/)
    ) {
      console.log('Invalid calendar entry ID, skipping timetable load');
      return;
    }
    if (!selectedClassId || !selectedClassId.match(/^[0-9a-fA-F-]{36}$/)) {
      console.log('Invalid class ID, skipping timetable load');
      return;
    }

    const loadKey = `${selectedCalendarEntryId}-${selectedClassId}`;
    if (examLoadInFlightRef.current.has(loadKey)) return;
    examLoadInFlightRef.current.add(loadKey);

    setIsLoadingTimetable(true);
    try {
      // First, ensure exam schedule exists for this class and exam
      let examScheduleId = selectedExamScheduleId;

      if (!examScheduleId) {
        // Try to find existing exam schedule
        const existingSchedules =
          await examScheduleService.getExamSchedulesByCalendarEntry(
            selectedCalendarEntryId,
          );

        if (existingSchedules.success && existingSchedules.data) {
          const classSchedule = existingSchedules.data.find(
            schedule => schedule.classId === selectedClassId,
          );

          if (classSchedule) {
            examScheduleId = classSchedule.id;
            setSelectedExamSchedule(classSchedule.id);
            console.log('Found existing exam schedule:', classSchedule.id);
          } else {
            // Create new exam schedule for this class
            console.log('Creating new exam schedule for class');
            const scheduleResponse =
              await examScheduleService.createExamSchedule({
                classId: selectedClassId,
                calendarEntryId: selectedCalendarEntryId,
                name: `${selectedCalendarEntry?.name || 'Exam'} - ${selectedClass?.name || `Grade ${selectedClass?.grade} ${selectedClass?.section}`}`,
                academicYear: new Date().getFullYear().toString(),
                status: 'draft',
              });

            if (scheduleResponse.success && scheduleResponse.data) {
              examScheduleId = scheduleResponse.data.id;
              setSelectedExamSchedule(scheduleResponse.data.id);
              console.log(
                'Created new exam schedule:',
                scheduleResponse.data.id,
              );
            } else {
              throw new Error('Failed to create exam schedule');
            }
          }
        }
      }

      // Now load the exam timetable with the schedule ID
      if (examScheduleId) {
        const timetableResponse = await examTimetableService.getExamTimetable(
          selectedClassId,
          selectedCalendarEntryId,
          examScheduleId,
        );

        if (timetableResponse.success && timetableResponse.data) {
          setExamTimetableSlots(timetableResponse.data);
          setHasLoadedTimetable(true);
          console.log(
            'Loaded exam timetable with',
            timetableResponse.data.length,
            'slots',
          );
        } else {
          // No timetable slots yet - this is normal for new schedules
          setExamTimetableSlots([]);
          setHasLoadedTimetable(true);
          console.log(
            'No timetable slots found - ready for subject assignment',
          );
        }
      } else {
        // No schedule could be created or found
        setExamTimetableSlots([]);
        setHasLoadedTimetable(true);
        toast.error(
          'Could not create exam schedule for this class. Please try again.',
        );
      }
    } catch (error) {
      console.error('Error loading exam timetable:', error);
      setExamTimetableSlots([]);
      setHasLoadedTimetable(true);

      // Show user-friendly error message
      console.error('Unexpected error in loadExamTimetable:', error);
      toast.error('Failed to load exam timetable. Please try again.');
    } finally {
      setIsLoadingTimetable(false);
      examLoadInFlightRef.current.delete(loadKey);
    }
  }, [
    selectedCalendarEntryId,
    selectedClassId,
    selectedExamScheduleId,
    selectedCalendarEntry,
    selectedClass,
    setExamTimetableSlots,
    setIsLoadingTimetable,
    setHasLoadedTimetable,
    setSelectedExamSchedule,
  ]);

  // Load timetable when selections change
  useEffect(() => {
    if (
      selectedCalendarEntryId &&
      selectedClassId &&
      examDateslots.length > 0
    ) {
      loadExamTimetable();
    }
  }, [
    selectedCalendarEntryId,
    selectedClassId,
    examDateslots.length,
    loadExamTimetable,
  ]);

  // Reset view mode when class or exam period changes to prevent conflicts
  useEffect(() => {
    setIsViewMode(false);
    setShowSubjects(true);
    setUserExplicitlyEditing(false); // Reset editing flag when selections change
  }, [selectedCalendarEntryId, selectedClassId]);

  // Auto-switch to view mode when timetable has assignments (only after loading completes)
  // Don't auto-switch if user explicitly chose to edit
  useEffect(() => {
    const hasAssignments = examTimetableSlots.length > 0;
    if (
      hasAssignments &&
      !isViewMode &&
      !isLoadingTimetable &&
      !userExplicitlyEditing
    ) {
      setIsViewMode(true);
    }
  }, [
    examTimetableSlots.length,
    isViewMode,
    isLoadingTimetable,
    userExplicitlyEditing,
  ]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const subject = event.active.data.current?.subject;
    if (subject) {
      setDraggedSubject(subject);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setDraggedSubject(null);

    if (!over) return;

    const subject = active.data.current?.subject;
    const dateslotId = over.data.current?.dateslotId;

    if (subject && dateslotId) {
      handleSubjectAssignment(dateslotId, subject);
    }
  };

  // Handle subject assignment
  const handleSubjectAssignment = async (
    dateslotId: string,
    subject: StoreSubject,
  ) => {
    try {
      await useExamTimetableStore
        .getState()
        .assignSubjectToDateslot(dateslotId, subject.id);
      toast.success(`Assigned ${subject.name} to exam slot`);
    } catch (error) {
      console.error('Error assigning subject:', error);
      toast.error('Failed to assign subject');
    }
  };

  // Save timetable
  const handleSaveTimetable = async () => {
    if (!selectedExamScheduleId) {
      toast.error('No exam schedule selected');
      return;
    }

    setIsSaving(true);
    try {
      // Validate timetable
      await validateExamTimetable();

      // The individual assignments are already saved via assignSubjectToDateslot
      // This is just a final validation and status update
      toast.success('Exam timetable saved successfully');

      // Switch to view mode after successful save
      setIsViewMode(true);
      setUserExplicitlyEditing(false); // Allow auto-switch in future
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error('Failed to save exam timetable');
    } finally {
      setIsSaving(false);
    }
  };

  // Print timetable as PDF
  const handlePrintTimetable = async () => {
    let classInfo = selectedClass;
    let calendarInfo = selectedCalendarEntry;

    // If objects are not available in store, fetch them using IDs
    if (!classInfo && selectedClassId) {
      try {
        const classResponse = await classService.getClassById(selectedClassId);
        if (classResponse.success && classResponse.data) {
          classInfo = classResponse.data;
        }
      } catch (error) {
        console.error('Error fetching class info:', error);
      }
    }

    if (!calendarInfo && selectedCalendarEntryId) {
      try {
        const calendarResponse = await calendarService.getCalendarEntryById(
          selectedCalendarEntryId,
        );
        if (calendarResponse) {
          calendarInfo = {
            ...calendarResponse,
            startDate: new Date(calendarResponse.startDate),
            endDate: new Date(calendarResponse.endDate),
          };
        }
      } catch (error) {
        console.error('Error fetching calendar info:', error);
      }
    }

    if (!classInfo || !calendarInfo) {
      toast.error('Missing class or exam information');
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Create a temporary div with the schedule content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatePrintableSchedule(classInfo, calendarInfo);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      document.body.appendChild(tempDiv);

      // Convert to canvas and then PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      const fileName = `${classInfo.name || `Grade${classInfo.grade}${classInfo.section}`}_${calendarInfo.name}_ExamTimetable.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Generate printable schedule HTML - Row format for one exam per day
  const generatePrintableSchedule = (
    classInfo: NonNullable<typeof selectedClass>,
    calendarInfo: NonNullable<typeof selectedCalendarEntry>,
  ): string => {
    // Only include EXAM type slots for printing
    const examSlots = examDateslots.filter(
      d =>
        d.type === ExamDateslotType.EXAM && d.startTime && d.endTime && d.label,
    );

    // Sort exam slots by date
    const sortedExamSlots = examSlots.sort(
      (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime(),
    );

    const getAssignment = (dateslotId: string) => {
      return examTimetableSlots.find(slot => slot.dateslotId === dateslotId);
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Timetable - ${classInfo.name}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 15px; 
            }
            .header h1 { 
              color: #1e40af; 
              margin-bottom: 8px; 
              font-size: 20px;
            }
            .header h2 { 
              color: #374151; 
              margin-bottom: 6px; 
              font-size: 16px;
            }
            .header h3 { 
              color: #6b7280; 
              margin-bottom: 10px; 
              font-size: 14px;
            }
            .info { 
              margin-bottom: 15px; 
              font-size: 12px;
              background: #f8fafc;
              padding: 10px;
              border-radius: 6px;
            }
            .schedule-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .schedule-table th { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            .schedule-table td { 
              border: 1px solid #e5e7eb; 
              padding: 12px; 
              vertical-align: top;
            }
            .schedule-table tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .exam-slot:hover { 
              background-color: #e0f2fe; 
            }
            .subject-name { 
              font-weight: 600; 
              color: #1e40af; 
              font-size: 16px;
            }
            .subject-code { 
              color: #6b7280; 
              font-size: 12px; 
              margin-top: 2px;
            }
            .time-slot { 
              font-weight: 500; 
              color: #059669;
            }
            .duration { 
              background: #dcfce7; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px; 
              color: #166534;
            }
            .no-assignment { 
              color: #dc2626; 
              font-style: italic; 
            }
            @media print { 
              body { margin: 10px; }
              .header { margin-bottom: 15px; padding-bottom: 10px; }
              .info { margin-bottom: 10px; padding: 8px; }
              .schedule-table { page-break-inside: avoid; margin-top: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exam Timetable</h1>
            <h2>${calendarInfo.name}</h2>
            <h3>Class: ${classInfo.name} (Grade ${classInfo.grade} ${classInfo.section})</h3>
            <p>Academic Year: ${new Date().getFullYear()}</p>
          </div>
          
          <div class="info">
            <p><strong>Exam Period:</strong> ${new Date(calendarInfo.startDate).toLocaleDateString()} - ${new Date(calendarInfo.endDate).toLocaleDateString()}</p>
            <p><strong>Total Exams:</strong> ${sortedExamSlots.length}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <table class="schedule-table">
            <thead>
              <tr>
                <th style="width: 12%">Date</th>
                <th style="width: 12%">Day</th>
                <th style="width: 15%">Time</th>
                <th style="width: 35%">Subject</th>
                <th style="width: 12%">Exam Type</th>
                <th style="width: 14%">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${sortedExamSlots
                .map(dateslot => {
                  const assignment = getAssignment(dateslot.id);
                  const examDate = new Date(dateslot.examDate);

                  return `
                  <tr class="exam-slot">
                    <td><strong>${examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></td>
                    <td>${examDate.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td class="time-slot">${dateslot.startTime} - ${dateslot.endTime}</td>
                    <td>
                      ${
                        assignment?.subject
                          ? `<div class="subject-name">${assignment.subject.name}</div>
                         <div class="subject-code">Code: ${assignment.subject.code}</div>
                         ${assignment.subject.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${assignment.subject.description}</div>` : ''}`
                          : '<span class="no-assignment">No subject assigned</span>'
                      }
                    </td>
                    <td>${dateslot.label}</td>
                    <td>
                      <span class="duration">
                        ${Math.round((new Date('2000-01-01T' + dateslot.endTime).getTime() - new Date('2000-01-01T' + dateslot.startTime).getTime()) / 60000)} min
                      </span>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>This is an official exam timetable. Please verify all details before the examination period.</p>
          </div>
        </body>
      </html>
    `;
  };

  // Copy timetable to other classes
  const handleCopyTimetable = async (targetClassIds: string[]) => {
    if (!selectedExamScheduleId) {
      toast.error('No exam schedule to copy');
      return;
    }

    setIsCopying(true);
    try {
      const response = await examTimetableService.copyExamTimetable({
        sourceExamScheduleId: selectedExamScheduleId,
        targetClassIds,
        copySubjects: true,
        copyRooms: false,
        copyInstructions: true,
      });

      if (response.success) {
        toast.success(
          `Timetable copied to ${targetClassIds.length} class(es) successfully`,
        );
      } else {
        throw new Error('Failed to copy timetable');
      }
    } catch (error) {
      console.error('Error copying timetable:', error);
      toast.error('Failed to copy timetable');
    } finally {
      setIsCopying(false);
    }
  };

  // Show loading state
  if (isLoadingTimetable) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='text-center'>
          <RefreshCw className='w-8 h-8 animate-spin mx-auto text-gray-400' />
          <p className='text-gray-600 mt-2'>Loading exam timetable...</p>
        </div>
      </div>
    );
  }

  // Show selection required state
  if (!selectedCalendarEntryId || !selectedClassId) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='text-center'>
          <AlertTriangle className='w-12 h-12 mx-auto text-yellow-500' />
          <h3 className='text-lg font-medium text-gray-900 mt-2'>
            Selection Required
          </h3>
          <p className='text-gray-600 mt-1'>
            Please select both an exam period and a class from the dropdowns
            above to build the exam timetable.
          </p>
        </div>
      </div>
    );
  }

  // Check dateslot configuration status
  // Only EXAM type slots need configuration (startTime, endTime, label)
  // Other types (BREAK, LUNCH, PREPARATION) are automatically considered configured
  const configuredDateslots = examDateslots.filter(
    d =>
      d.type === ExamDateslotType.EXAM
        ? d.startTime && d.endTime && d.label // EXAM slots need full configuration
        : true, // Non-EXAM slots are always considered configured
  );
  const unconfiguredCount = examDateslots.filter(
    d =>
      d.type === ExamDateslotType.EXAM &&
      (!d.startTime || !d.endTime || !d.label),
  ).length;

  if (examDateslots.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='text-center'>
          <Calendar className='w-12 h-12 mx-auto text-gray-400' />
          <h3 className='text-lg font-medium text-gray-900 mt-2'>
            No Exam Dateslots
          </h3>
          <p className='text-gray-600 mt-1'>
            No dateslots found for this exam period. Please check the Date Slot
            Manager tab.
          </p>
        </div>
      </div>
    );
  }

  if (configuredDateslots.length === 0 && unconfiguredCount > 0) {
    return (
      <div className='bg-white rounded-lg shadow p-8'>
        <div className='text-center'>
          <Clock className='w-12 h-12 mx-auto text-yellow-500' />
          <h3 className='text-lg font-medium text-gray-900 mt-2'>
            Dateslots Need Configuration
          </h3>
          <p className='text-gray-600 mt-1'>
            {unconfiguredCount} exam date{unconfiguredCount > 1 ? 's' : ''}{' '}
            found, but time slots need to be configured. Please go to the Date
            Slot Manager tab to add time and labels to the exam dates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={isViewMode ? undefined : handleDragStart}
      onDragEnd={isViewMode ? undefined : handleDragEnd}
    >
      <div className='space-y-6'>
        {/* Header with actions */}
        <div className='bg-white rounded-lg shadow p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-gray-800 flex items-center'>
                <Users className='w-5 h-5 mr-2' />
                Exam Timetable Builder
              </h2>
              <div className='space-y-1'>
                <p className='text-sm text-gray-600'>
                  Building timetable for{' '}
                  {selectedClass?.name ||
                    `Grade ${selectedClass?.grade} ${selectedClass?.section}`}{' '}
                  - {selectedCalendarEntry?.name}
                </p>
                {configuredDateslots.length > 0 && (
                  <p className='text-xs text-green-600'>
                    {configuredDateslots.length} configured exam slot
                    {configuredDateslots.length > 1 ? 's' : ''} available
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              {/* View Mode Controls */}
              {isViewMode ? (
                <>
                  <button
                    onClick={() => {
                      setIsViewMode(false);
                      setShowSubjects(true); // Show subjects when entering edit mode
                      setUserExplicitlyEditing(true); // Prevent auto-switch back to view mode
                    }}
                    className='px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md flex items-center'
                  >
                    <Edit className='w-4 h-4 mr-1' />
                    Edit Timetable
                  </button>

                  <button
                    onClick={handlePrintTimetable}
                    className='px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md flex items-center'
                  >
                    <Printer className='w-4 h-4 mr-1' />
                    Print Schedule
                  </button>

                  <CopyTimetableButton
                    onCopy={handleCopyTimetable}
                    isCopying={isCopying}
                    currentClass={selectedClass}
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSubjects(!showSubjects)}
                    className='px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center'
                  >
                    {showSubjects ? (
                      <EyeOff className='w-4 h-4 mr-1' />
                    ) : (
                      <Eye className='w-4 h-4 mr-1' />
                    )}
                    {showSubjects ? 'Hide' : 'Show'} Subjects
                  </button>

                  <button
                    onClick={handleSaveTimetable}
                    disabled={isSaving || examTimetableSlots.length === 0}
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                  >
                    {isSaving ? (
                      <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <Save className='w-4 h-4 mr-2' />
                    )}
                    {isSaving ? 'Saving...' : 'Save Timetable'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Validation messages */}
          {(validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div className='mt-4 space-y-2'>
              {validationErrors.map((error, index) => (
                <div
                  key={index}
                  className='flex items-center text-red-600 text-sm'
                >
                  <AlertCircle className='w-4 h-4 mr-2' />
                  {error}
                </div>
              ))}
              {validationWarnings.map((warning, index) => (
                <div
                  key={index}
                  className='flex items-center text-yellow-600 text-sm'
                >
                  <AlertTriangle className='w-4 h-4 mr-2' />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content layout */}
        <div className='space-y-6'>
          {/* Subject library - show when editing or when toggled in view mode */}
          {(!isViewMode || showSubjects) && (
            <div className='w-full'>
              <ExamSubjectLibrary isViewMode={isViewMode} />
            </div>
          )}

          {/* Timetable grid - full width for horizontal layout */}
          <div className='w-full'>
            <ExamDateslotGrid
              configuredDateslots={configuredDateslots}
              isViewMode={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedSubject ? (
          <DraggedSubjectOverlay subject={draggedSubject} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Copy Timetable Button Component
interface CopyTimetableButtonProps {
  onCopy: (targetClassIds: string[]) => Promise<void>;
  isCopying: boolean;
  currentClass: any;
}

const CopyTimetableButton: React.FC<CopyTimetableButtonProps> = ({
  onCopy,
  isCopying,
  currentClass,
}) => {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Load available classes when modal opens
  const loadAvailableClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await classService.getAllClasses();
      if (response.success && response.data) {
        // Exclude current class from available options
        const otherClasses = response.data.filter(
          cls => cls.id !== currentClass?.id,
        );
        setAvailableClasses(otherClasses);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Filter classes based on search and grade
  const filteredClasses = availableClasses.filter((cls: any) => {
    const matchesSearch =
      !searchTerm ||
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.grade.toString().includes(searchTerm);

    const matchesGrade =
      selectedGrade === 'all' || cls.grade.toString() === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  // Group classes by grade
  const classesByGrade = filteredClasses.reduce(
    (acc: Record<string, any[]>, cls: any) => {
      const grade = cls.grade.toString();
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(cls);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // Get unique grades for filter
  const availableGrades = [
    ...new Set(availableClasses.map((cls: any) => cls.grade.toString())),
  ].sort();

  const handleCopyClick = () => {
    setShowCopyModal(true);
    loadAvailableClasses();
  };

  const handleCopyConfirm = async () => {
    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }

    try {
      await onCopy(selectedClassIds);
      setShowCopyModal(false);
      setSelectedClassIds([]);
      setSearchTerm('');
      setSelectedGrade('all');
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId],
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredClasses.map((cls: any) => cls.id);
    const allSelected = allFilteredIds.every(id =>
      selectedClassIds.includes(id),
    );

    if (allSelected) {
      setSelectedClassIds(prev =>
        prev.filter(id => !allFilteredIds.includes(id)),
      );
    } else {
      setSelectedClassIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const handleGradeSelectAll = (grade: string) => {
    const gradeClasses = classesByGrade[grade] || [];
    const gradeClassIds = gradeClasses.map((cls: any) => cls.id);
    const allSelected = gradeClassIds.every(id =>
      selectedClassIds.includes(id),
    );

    if (allSelected) {
      // Deselect all in this grade
      setSelectedClassIds(prev =>
        prev.filter(id => !gradeClassIds.includes(id)),
      );
    } else {
      // Select all in this grade
      setSelectedClassIds(prev => [...new Set([...prev, ...gradeClassIds])]);
    }
  };

  return (
    <>
      <button
        onClick={handleCopyClick}
        disabled={isCopying}
        className='px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md flex items-center disabled:opacity-50'
      >
        {isCopying ? (
          <RefreshCw className='w-4 h-4 mr-1 animate-spin' />
        ) : (
          <Copy className='w-4 h-4 mr-1' />
        )}
        {isCopying ? 'Copying...' : 'Copy to Classes'}
      </button>

      {/* Enhanced Copy Modal */}
      {showCopyModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col'>
            <h3 className='text-lg font-semibold mb-4'>
              Copy Timetable to Classes
            </h3>

            <p className='text-sm text-gray-600 mb-4'>
              Select the classes where you want to copy this exam timetable.
              Each class will get its own linked copy.
            </p>

            {/* Search and Filter Controls */}
            <div className='flex flex-col sm:flex-row gap-4 mb-4'>
              <div className='flex-1'>
                <input
                  type='text'
                  placeholder='Search classes by name, section, or grade...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div className='sm:w-48'>
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='all'>All Grades</option>
                  {availableGrades.map(grade => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSelectAllFiltered}
                className='px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md whitespace-nowrap'
              >
                {filteredClasses.length > 0 &&
                filteredClasses.every(cls => selectedClassIds.includes(cls.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Selected Count */}
            <div className='mb-4 text-sm text-gray-600'>
              {selectedClassIds.length} of {availableClasses.length} classes
              selected
            </div>

            {isLoadingClasses ? (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw className='w-6 h-6 animate-spin text-gray-400' />
                <span className='ml-2 text-gray-600'>Loading classes...</span>
              </div>
            ) : (
              <div className='flex-1 overflow-y-auto border rounded-lg'>
                {filteredClasses.length === 0 ? (
                  <div className='p-4 text-center text-gray-500'>
                    {availableClasses.length === 0
                      ? 'No other classes available'
                      : 'No classes match your search criteria'}
                  </div>
                ) : (
                  <div className='space-y-2 p-2'>
                    {Object.entries(classesByGrade)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([grade, classes]) => (
                        <div key={grade} className='border rounded-lg'>
                          {/* Grade Header */}
                          <div className='bg-gray-50 px-3 py-2 border-b flex items-center justify-between'>
                            <span className='font-medium text-gray-700'>
                              Grade {grade}
                            </span>
                            <div className='flex items-center space-x-2'>
                              <span className='text-xs text-gray-500'>
                                {
                                  classes.filter((cls: any) =>
                                    selectedClassIds.includes(cls.id),
                                  ).length
                                }
                                /{classes.length} selected
                              </span>
                              <button
                                onClick={() => handleGradeSelectAll(grade)}
                                className='text-xs px-2 py-1 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded'
                              >
                                {classes.every((cls: any) =>
                                  selectedClassIds.includes(cls.id),
                                )
                                  ? 'Deselect All'
                                  : 'Select All'}
                              </button>
                            </div>
                          </div>

                          {/* Grade Classes */}
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 p-2'>
                            {classes.map((cls: any) => (
                              <div
                                key={cls.id}
                                className={`p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                  selectedClassIds.includes(cls.id)
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'border-gray-200'
                                }`}
                                onClick={() => toggleClassSelection(cls.id)}
                              >
                                <div className='flex items-center'>
                                  <input
                                    type='checkbox'
                                    checked={selectedClassIds.includes(cls.id)}
                                    onChange={() =>
                                      toggleClassSelection(cls.id)
                                    }
                                    className='mr-2 text-blue-600'
                                    onClick={e => e.stopPropagation()}
                                  />
                                  <div className='min-w-0 flex-1'>
                                    <div className='font-medium text-sm truncate'>
                                      {cls.name}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      Section {cls.section}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-end space-x-3 mt-6 pt-4 border-t'>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setSelectedClassIds([]);
                  setSearchTerm('');
                  setSelectedGrade('all');
                }}
                className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md'
              >
                Cancel
              </button>
              <button
                onClick={handleCopyConfirm}
                disabled={selectedClassIds.length === 0 || isCopying}
                className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {isCopying ? (
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                ) : (
                  <Copy className='w-4 h-4 mr-2' />
                )}
                Copy to {selectedClassIds.length} Class
                {selectedClassIds.length !== 1 ? 'es' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
