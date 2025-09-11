import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Book,
  Save,
  RefreshCw,
  Eye,
  Edit3,
  AlertCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  X,
} from 'lucide-react';
import { useScheduleStore } from '@/store/schedule';
import { SubjectLibrary } from './SubjectLibrary';
import { TimetableGrid } from './TimetableGrid';
import { TeacherAssignmentModal } from './TeacherAssignmentModal';
import { timetableService } from '@/api/services/timetable.service';
import { toast } from 'sonner';
import {
  scheduleService,
  timeslotService,
} from '@/api/services/schedule.service';
import { TimeslotType } from '@sms/shared-types';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxMarks: number;
  passMarks: number;
}

const DraggedSubjectOverlay: React.FC<{ subject: Subject }> = ({ subject }) => (
  <div className='bg-white border-2 border-blue-400 rounded-lg p-3 shadow-lg opacity-90 transform rotate-2'>
    <div className='flex items-center space-x-2'>
      <Book className='w-4 h-4 text-blue-600' />
      <div>
        <p className='text-sm font-semibold text-gray-900'>{subject.name}</p>
        <p className='text-xs text-gray-600'>{subject.code}</p>
      </div>
    </div>
  </div>
);

export function TimetableBuilder() {
  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const {
    selectedClassId,
    selectedClass,
    currentSchedule,
    isEditMode,
    draggedSubject,
    timetableSlots,
    timeSlots,
    validationErrors,
    validationWarnings,
    isLoadingTimetable,
    hasLoadedTimetable,
    setIsEditMode,
    setDraggedSubject,
    setDropZoneHighlight,
    setTimetableSlots,
    setCurrentSchedule,
    setIsLoadingTimetable,
    setHasLoadedTimetable,
    setTimeSlots,
    assignSubjectToSlot,
    validateSchedule,
    resetTimetable,
  } = useScheduleStore();

  // Keep original loaded slots for diffing (non-temp ids)
  interface OriginalSlotSnapshot {
    id: string;
    timeslotId: string;
    day: string;
    subjectId: string | null;
    teacherId: string | null;
    roomId: string | null;
    type: string;
  }
  const originalSlotsRef = useRef<Record<string, OriginalSlotSnapshot>>({});
  // Prevent duplicate concurrent loads (e.g., React StrictMode double effect invocation)
  const classLoadInFlightRef = useRef<Set<string>>(new Set());

  // Load or create schedule for the selected class
  const loadClassSchedule = useCallback(async () => {
    // Fresh system: no class selected yet -> do nothing
    if (!selectedClassId) return; // nothing selected
    if (classLoadInFlightRef.current.has(selectedClassId)) {
      // Another load already in progress for this class (StrictMode / rapid switch)
      return;
    }
    if (selectedClassId && !selectedClass) {
      console.warn(
        'Selected class id has no corresponding class metadata; skipping timetable load',
      );
      return;
    }

    classLoadInFlightRef.current.add(selectedClassId);
    setIsLoadingTimetable(true);
    try {
      // Ensure class meta is valid (prevent creating schedules for stale client-side classId)
      // At this point selectedClass is guaranteed non-null by guards above
      if (!selectedClass!.id || selectedClass!.id !== selectedClassId) {
        console.warn(
          'Selected class metadata mismatch, aborting schedule load',
        );
        classLoadInFlightRef.current.delete(selectedClassId);
        setIsLoadingTimetable(false);
        return;
      }
      // Validate all referenced timeslots are persisted UUIDs
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      const invalidSlots = timetableSlots.filter(s => {
        const tsId = s.timeslotId || s.timeSlotId;
        return !uuidRegex.test(tsId);
      });
      if (invalidSlots.length > 0) {
        alert(
          'Some timetable entries reference unsaved time slots. Please save timeslots in the Timeslot Manager first.',
        );
        classLoadInFlightRef.current.delete(selectedClassId);
        setIsLoadingTimetable(false);
        return;
      }
      // First, load timeslots for this class
      const timeslotResponse =
        await timeslotService.getTimeslotsByClass(selectedClassId);
      if (timeslotResponse.success && timeslotResponse.data) {
        // Map backend timeslot data to frontend format
        const mappedTimeSlots = timeslotResponse.data.map(ts => {
          const dayRaw = (ts.day || '').toString();
          const dayNorm =
            dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase();
          return {
            id: ts.id,
            day: dayNorm,
            startTime: ts.startTime,
            endTime: ts.endTime,
            type: ts.type.toString(),
            label: ts.label || undefined,
            classId: ts.classId,
          };
        });
        setTimeSlots(mappedTimeSlots);
      } else {
        // No timeslots found - user needs to create them in TimeslotManager
        setTimeSlots([]);
      }

      // Get schedules for this class to find active one
      const scheduleResponse =
        await scheduleService.getSchedulesByClass(selectedClassId);
      if (
        !scheduleResponse.success &&
        scheduleResponse.message?.includes('not found')
      ) {
        console.warn('Class not found on server; skipping schedule creation');
        return;
      }

      let scheduleId;
      if (
        scheduleResponse.success &&
        scheduleResponse.data &&
        scheduleResponse.data.length > 0
      ) {
        // Use the first active schedule or first schedule if none active
        const activeSchedule =
          scheduleResponse.data.find(s => s.status === 'active') ||
          scheduleResponse.data[0];
        scheduleId = activeSchedule.id;
        setCurrentSchedule({
          id: activeSchedule.id,
          classId: activeSchedule.classId,
          academicYearId: activeSchedule.academicYear,
          isActive: activeSchedule.status === 'active',
        });
      } else {
        // Create new schedule for the class
        const newScheduleResponse = await scheduleService.createSchedule({
          classId: selectedClassId,
          academicYear: selectedClass!.academicYearId,
          name: `Grade ${selectedClass!.grade} Section ${selectedClass!.section} Timetable`,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          effectiveFrom: new Date(),
        });

        if (newScheduleResponse.success && newScheduleResponse.data) {
          scheduleId = newScheduleResponse.data.id;
          setCurrentSchedule({
            id: newScheduleResponse.data.id,
            classId: newScheduleResponse.data.classId,
            academicYearId: newScheduleResponse.data.academicYear,
            isActive: newScheduleResponse.data.status === 'active',
          });
        } else {
          // Likely race (duplicate create) or other failure; attempt recovery by refetching
          const retrySchedules =
            await scheduleService.getSchedulesByClass(selectedClassId);
          if (
            retrySchedules.success &&
            retrySchedules.data &&
            retrySchedules.data.length > 0
          ) {
            const activeRetry =
              retrySchedules.data.find(s => s.status === 'active') ||
              retrySchedules.data[0];
            scheduleId = activeRetry.id;
            setCurrentSchedule({
              id: activeRetry.id,
              classId: activeRetry.classId,
              academicYearId: activeRetry.academicYear,
              isActive: activeRetry.status === 'active',
            });
          } else {
            throw new Error('Failed to create or recover schedule');
          }
        }
      }

      // Load existing timetable for this schedule
      if (scheduleId) {
        const timetableResponse = await timetableService.getTimetable({
          classId: selectedClassId,
          scheduleId: scheduleId,
          includeConflicts: true,
        });

        if (timetableResponse.success && timetableResponse.data) {
          // Map the response data to match our interface
          const mappedSlots = timetableResponse.data.map(slot => ({
            ...slot,
            timeSlotId: slot.timeslotId, // Map timeslotId to timeSlotId for compatibility
            scheduleId: scheduleId,
            // Use the correct day from the timeslot data, not from the schedule slot
            day: slot.timeslot?.day || slot.day,
            subjectId: slot.subjectId || undefined,
            teacherId: slot.teacherId || undefined,
            roomId: slot.roomId || undefined,
            type: slot.type.toString(), // Convert enum to string
            timeslot: slot.timeslot
              ? {
                  ...slot.timeslot,
                  type: slot.timeslot.type.toString(),
                  label: slot.timeslot.label || undefined,
                }
              : undefined,
            subject: slot.subject
              ? {
                  ...slot.subject,
                  description: slot.subject.description || undefined,
                }
              : undefined,
            teacher: slot.teacher
              ? {
                  ...slot.teacher,
                  employeeId: slot.teacher.employeeId || undefined,
                }
              : undefined,
            room: slot.room
              ? {
                  ...slot.room,
                  name: slot.room.name || undefined,
                  building: slot.room.building || undefined,
                }
              : undefined,
          }));
          setTimetableSlots(mappedSlots);
          // Snapshot originals for diff (only persisted slots)
          const snapshot: Record<string, OriginalSlotSnapshot> = {};
          mappedSlots.forEach(s => {
            if (!s.id.startsWith('temp-')) {
              snapshot[s.id] = {
                id: s.id,
                timeslotId: s.timeslotId || s.timeSlotId,
                // Use the correct day from the timeslot data
                day: s.timeslot?.day || s.day,
                subjectId: s.subjectId || null,
                teacherId: s.teacherId || null,
                roomId: s.roomId || null,
                type: s.type,
              };
            }
          });
          originalSlotsRef.current = snapshot;
        }
      }
    } catch (error) {
      console.error('Error loading class schedule:', error);
      // TODO: Show error toast
    } finally {
      setIsLoadingTimetable(false);
      setHasLoadedTimetable(true);
      if (selectedClassId) {
        classLoadInFlightRef.current.delete(selectedClassId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedClassId,
    selectedClass,
    setIsLoadingTimetable,
    setCurrentSchedule,
    setTimetableSlots,
    setHasLoadedTimetable,
    setTimeSlots,
  ]);

  // Load timetable when class changes
  useEffect(() => {
    if (selectedClassId && selectedClass && !hasLoadedTimetable) {
      loadClassSchedule();
    }
  }, [selectedClassId, selectedClass, hasLoadedTimetable, loadClassSchedule]);

  // Auto-validation when timetable changes
  useEffect(() => {
    if (timetableSlots.length > 0) {
      validateSchedule();
    }
  }, [timetableSlots, validateSchedule]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const subject = active.data.current?.subject;

    if (subject) {
      setDraggedSubject(subject);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setDraggedSubject(null);
    setDropZoneHighlight(null);

    if (!over) return;

    const subject = active.data.current?.subject;
    const timeSlot = over.data.current?.timeSlot;
    const day = over.data.current?.day;
    const timeSlotId = over.data.current?.timeSlotId;

    // Debug information to help diagnose issues
    console.log('Drag end event data:', {
      subject: subject ? { id: subject.id, name: subject.name } : null,
      timeSlot: timeSlot
        ? {
            id: timeSlot.id,
            day: timeSlot.day,
            type: timeSlot.type,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
          }
        : null,
      day,
      timeSlotId,
    });

    if (subject && timeSlot && day && timeSlotId) {
      // Normalize slot type for consistent comparison
      const slotType = (timeSlot.type || '').toLowerCase();
      const isRegular = ['regular', 'period'].includes(slotType);

      if (!isRegular) {
        console.warn('Cannot assign to non-regular timeslot:', timeSlot);
        return; // Only allow assignment to regular academic slots
      }

      // Ensure day is properly normalized before assignment
      const normalizedDay =
        day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

      // Assign the subject to the slot with the normalized day
      assignSubjectToSlot(timeSlotId, normalizedDay, subject);
    } else {
      console.warn('Missing required data for drag and drop:', {
        subject,
        timeSlot,
        day,
        timeSlotId,
      });
    }
  };

  const handleSaveTimetable = async () => {
    if (!currentSchedule) {
      console.error('No schedule available to save');
      toast.error('No schedule available to save');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Saving timetable...');

    // Validate before saving
    const validation = validateSchedule();

    if (!validation.valid && validation.errors.length > 0) {
      // Show validation warnings but allow saving (partial timetables are allowed)
      console.warn('Validation warnings:', validation.errors);
      toast.warning('Saving with validation warnings');
    }

    try {
      // Build diff-based operations
      const uuidRegexLocal = /^[0-9a-fA-F-]{36}$/;
      const createOps = timetableSlots
        .filter(slot => slot.id.startsWith('temp-'))
        .map(slot => ({
          action: 'create' as const,
          slotData: {
            timeslotId: slot.timeslotId || slot.timeSlotId,
            day: slot.day,
            subjectId: slot.subjectId || null,
            // Only persist teacher if it is a valid UUID (mock IDs like 'teacher-003' would break FK)
            teacherId:
              slot.teacherId && uuidRegexLocal.test(slot.teacherId)
                ? slot.teacherId
                : null,
            roomId: slot.roomId || null,
            type:
              slot.type === 'regular'
                ? TimeslotType.REGULAR
                : slot.type === 'break'
                  ? TimeslotType.BREAK
                  : slot.type === 'lunch'
                    ? TimeslotType.LUNCH
                    : TimeslotType.REGULAR,
          },
        }));

      const updateOps = timetableSlots
        .filter(slot => !slot.id.startsWith('temp-'))
        .map(slot => ({
          action: 'update' as const,
          slotData: {
            id: slot.id,
            timeslotId: slot.timeslotId || slot.timeSlotId,
            day: slot.day,
            subjectId: slot.subjectId || null,
            teacherId:
              slot.teacherId && uuidRegexLocal.test(slot.teacherId)
                ? slot.teacherId
                : null,
            roomId: slot.roomId || null,
            type:
              slot.type === 'regular'
                ? TimeslotType.REGULAR
                : slot.type === 'break'
                  ? TimeslotType.BREAK
                  : slot.type === 'lunch'
                    ? TimeslotType.LUNCH
                    : TimeslotType.REGULAR,
          },
        }));

      // Deleted slots: present in original snapshot but not in current list
      const currentIds = new Set(
        timetableSlots.filter(s => !s.id.startsWith('temp-')).map(s => s.id),
      );
      const deleteOps = Object.values(originalSlotsRef.current)
        .filter(orig => !currentIds.has(orig.id))
        .map(orig => ({
          action: 'delete' as const,
          slotData: {
            id: orig.id,
            timeslotId: orig.timeslotId,
            day: orig.day,
            subjectId: null,
            teacherId: null,
            roomId: null,
            type:
              orig.type === 'regular'
                ? TimeslotType.REGULAR
                : orig.type === 'break'
                  ? TimeslotType.BREAK
                  : orig.type === 'lunch'
                    ? TimeslotType.LUNCH
                    : TimeslotType.REGULAR,
          },
        }));

      const operations = [...createOps, ...updateOps, ...deleteOps];

      if (operations.length === 0) {
        toast.dismiss(loadingToast);
        toast.info('No changes to save.');
        return;
      }

      const saveResponse = await timetableService.bulkTimetableOperations({
        scheduleId: currentSchedule.id,
        operations,
      });

      if (saveResponse.success) {
        console.log('Timetable saved successfully');
        toast.dismiss(loadingToast);
        toast.success('Timetable saved successfully!');

        // Reload the timetable to get the latest state
        await loadClassSchedule();
      } else {
        throw new Error(saveResponse.error || 'Failed to save timetable');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to save timetable. Please try again.');
    }
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleResetTimetable = () => {
    if (
      confirm(
        'Are you sure you want to reset the entire timetable? This action cannot be undone.',
      )
    ) {
      resetTimetable();
    }
  };

  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintingPDF, setIsPrintingPDF] = useState(false);

  // Generate printable schedule HTML for PDF
  const generatePrintableSchedule = (
    classInfo: NonNullable<typeof selectedClass>,
    timeSlotsData: typeof timeSlots,
    timetableSlotsData: typeof timetableSlots,
  ): string => {
    // Group timetable slots by day
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ];
    const daySlots = days
      .map(day => {
        const dayTimeSlots = timeSlotsData
          .filter(ts => ts.day === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return {
          day,
          timeSlots: dayTimeSlots.map(timeSlot => {
            const assignment = timetableSlotsData.find(
              slot =>
                (slot.timeslotId || slot.timeSlotId) === timeSlot.id &&
                slot.day === day,
            );
            return {
              timeSlot,
              assignment,
            };
          }),
        };
      })
      .filter(dayData => dayData.timeSlots.length > 0);

    const formatTime = (time: string): string => {
      try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
      } catch {
        return time;
      }
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Class Timetable - Grade ${classInfo.grade} Section ${classInfo.section}</title>
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
            .day-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .day-title {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              padding: 10px 15px;
              font-weight: 600;
              font-size: 16px;
              border-radius: 6px 6px 0 0;
            }
            .schedule-table { 
              width: 100%; 
              border-collapse: collapse; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 0 0 6px 6px;
              overflow: hidden;
            }
            .schedule-table th { 
              background: #f1f5f9;
              color: #374151;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              border-bottom: 2px solid #e2e8f0;
            }
            .schedule-table td { 
              border: 1px solid #e5e7eb; 
              padding: 12px; 
              vertical-align: top;
            }
            .schedule-table tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .time-slot { 
              font-weight: 500; 
              color: #059669;
              font-size: 14px;
            }
            .subject-name { 
              font-weight: 600; 
              color: #1e40af; 
              font-size: 14px;
            }
            .subject-code { 
              color: #6b7280; 
              font-size: 11px; 
              margin-top: 2px;
            }
            .teacher-name {
              color: #7c3aed;
              font-size: 12px;
              margin-top: 2px;
            }
            .slot-type { 
              background: #dcfce7; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-size: 11px; 
              color: #166534;
              text-transform: uppercase;
            }
            .slot-type.break {
              background: #fef3c7;
              color: #92400e;
            }
            .slot-type.lunch {
              background: #d1fae5;
              color: #065f46;
            }
            .no-assignment { 
              color: #dc2626; 
              font-style: italic; 
              font-size: 12px;
            }
            .duration {
              color: #6b7280;
              font-size: 11px;
            }
            @media print { 
              body { margin: 10px; }
              .header { margin-bottom: 15px; padding-bottom: 10px; }
              .info { margin-bottom: 10px; padding: 8px; }
              .day-section { page-break-inside: avoid; margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Weekly Class Timetable</h1>
            <h2>Grade ${classInfo.grade} Section ${classInfo.section}</h2>
            <h3>Academic Year: ${new Date().getFullYear()}</h3>
          </div>
          
          <div class="info">
            <p><strong>Total Days:</strong> ${daySlots.length}</p>
            <p><strong>Total Periods:</strong> ${daySlots.reduce((sum, day) => sum + day.timeSlots.length, 0)}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          ${daySlots
            .map(
              dayData => `
            <div class="day-section">
              <div class="day-title">${dayData.day}</div>
              <table class="schedule-table">
                <thead>
                  <tr>
                    <th style="width: 20%">Time</th>
                    <th style="width: 30%">Subject</th>
                    <th style="width: 25%">Teacher</th>
                    <th style="width: 15%">Type</th>
                    <th style="width: 10%">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  ${dayData.timeSlots
                    .map(({ timeSlot, assignment }) => {
                      const duration = Math.round(
                        (new Date(`2000-01-01T${timeSlot.endTime}`).getTime() -
                          new Date(
                            `2000-01-01T${timeSlot.startTime}`,
                          ).getTime()) /
                          60000,
                      );

                      return `
                    <tr>
                      <td class="time-slot">${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}</td>
                      <td>
                        ${
                          assignment?.subject
                            ? `<div class="subject-name">${assignment.subject.name}</div>
                             <div class="subject-code">Code: ${assignment.subject.code}</div>
                             ${assignment.subject.description ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${assignment.subject.description}</div>` : ''}`
                            : timeSlot.type === 'regular'
                              ? '<span class="no-assignment">No subject assigned</span>'
                              : `<span style="color: #6b7280; font-style: italic;">${timeSlot.label || timeSlot.type}</span>`
                        }
                      </td>
                      <td>
                        ${
                          assignment?.teacher
                            ? `<div class="teacher-name">${assignment.teacher.user?.fullName || 'Unknown Teacher'}</div>
                             ${assignment.teacher.employeeId ? `<div style="font-size: 11px; color: #9ca3af;">ID: ${assignment.teacher.employeeId}</div>` : ''}`
                            : timeSlot.type === 'regular'
                              ? '<span class="no-assignment">Not assigned</span>'
                              : '<span style="color: #9ca3af; font-size: 12px;">—</span>'
                        }
                      </td>
                      <td>
                        <span class="slot-type ${timeSlot.type}">${timeSlot.type.replace('_', ' ')}</span>
                      </td>
                      <td class="duration">${duration} min</td>
                    </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `,
            )
            .join('')}
          
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>This is an official class timetable. Please verify all details before implementation.</p>
          </div>
        </body>
      </html>
    `;
  };

  // Print single class timetable as PDF
  const handlePrintTimetable = async () => {
    if (!selectedClass) {
      alert('No class selected');
      return;
    }

    setIsPrintingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Create a temporary div with the schedule content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generatePrintableSchedule(
        selectedClass,
        timeSlots,
        timetableSlots,
      );
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
      const fileName = `Grade${selectedClass.grade}${selectedClass.section}_ClassTimetable.pdf`;
      pdf.save(fileName);

      alert('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsPrintingPDF(false);
    }
  };

  // Print all classes timetables as ZIP
  const handlePrintAllTimetables = async () => {
    setIsPrintingPDF(true);
    try {
      // Import required libraries
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const { default: JSZip } = await import('jszip');
      const { ClassService } = await import('@/api/services/class.service');

      // Get all classes
      const classServiceInstance = new ClassService();
      const classesResponse = await classServiceInstance.getAllClasses();

      if (!classesResponse.success || !classesResponse.data) {
        alert('Failed to load classes');
        return;
      }

      const classes = classesResponse.data;
      const zip = new JSZip();
      let processedCount = 0;

      // Process each class
      for (const classData of classes) {
        try {
          // Load timeslots and timetable for this class
          const timeslotResponse = await timeslotService.getTimeslotsByClass(
            classData.id,
          );
          const scheduleResponse = await scheduleService.getSchedulesByClass(
            classData.id,
          );

          let classTimeSlots: typeof timeSlots = [];
          let classTimetableSlots: typeof timetableSlots = [];

          if (timeslotResponse.success && timeslotResponse.data) {
            classTimeSlots = timeslotResponse.data.map(ts => ({
              id: ts.id,
              day:
                ts.day.charAt(0).toUpperCase() + ts.day.slice(1).toLowerCase(),
              startTime: ts.startTime,
              endTime: ts.endTime,
              type: ts.type.toString(),
              label: ts.label || undefined,
              classId: ts.classId,
            }));
          }

          if (
            scheduleResponse.success &&
            scheduleResponse.data &&
            scheduleResponse.data.length > 0
          ) {
            const activeSchedule =
              scheduleResponse.data.find(s => s.status === 'active') ||
              scheduleResponse.data[0];

            const timetableResponse = await timetableService.getTimetable({
              classId: classData.id,
              scheduleId: activeSchedule.id,
              includeConflicts: true,
            });

            if (timetableResponse.success && timetableResponse.data) {
              classTimetableSlots = timetableResponse.data.map(slot => ({
                ...slot,
                timeSlotId: slot.timeslotId,
                scheduleId: activeSchedule.id,
                subjectId: slot.subjectId || undefined,
                teacherId: slot.teacherId || undefined,
                roomId: slot.roomId || undefined,
                type: slot.type.toString(),
                timeslot: slot.timeslot
                  ? {
                      ...slot.timeslot,
                      type: slot.timeslot.type.toString(),
                      label: slot.timeslot.label || undefined,
                    }
                  : undefined,
                subject: slot.subject
                  ? {
                      ...slot.subject,
                      description: slot.subject.description || undefined,
                    }
                  : undefined,
                teacher: slot.teacher
                  ? {
                      ...slot.teacher,
                      employeeId: slot.teacher.employeeId || undefined,
                    }
                  : undefined,
                room: slot.room
                  ? {
                      ...slot.room,
                      name: slot.room.name || undefined,
                      building: slot.room.building || undefined,
                    }
                  : undefined,
              }));
            }
          }

          // Skip classes with no timeslots
          if (classTimeSlots.length === 0) {
            console.log(
              `Skipping class Grade ${classData.grade} Section ${classData.section} - no timeslots`,
            );
            continue;
          }

          // Create class object compatible with generatePrintableSchedule
          const classInfo = {
            id: classData.id,
            classId: classData.id,
            gradeLevel: classData.grade,
            grade: classData.grade,
            section: classData.section,
            academicYearId: '',
          };

          // Generate HTML for this class
          const htmlContent = generatePrintableSchedule(
            classInfo,
            classTimeSlots,
            classTimetableSlots,
          );

          // Create temporary div
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '210mm';
          document.body.appendChild(tempDiv);

          // Convert to canvas and PDF
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
          });

          document.body.removeChild(tempDiv);

          // Create PDF
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210;
          const pageHeight = 295;
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

          // Add PDF to ZIP
          const pdfBlob = pdf.output('blob');
          const fileName = `Grade${classInfo.grade}${classInfo.section}_ClassTimetable.pdf`;
          zip.file(fileName, pdfBlob);

          processedCount++;

          // Show progress (optional - could be enhanced with a progress bar)
          console.log(`Processed ${processedCount}/${classes.length} classes`);
        } catch (error) {
          console.error(
            `Error processing class Grade ${classData.grade} Section ${classData.section}:`,
            error,
          );
          // Continue with next class instead of failing entirely
        }
      }

      if (processedCount === 0) {
        alert('No classes with timetables found to export');
        return;
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AllClassTimetables_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      alert(
        `Successfully generated ${processedCount} class timetable PDFs in ZIP file`,
      );
    } catch (error) {
      console.error('Error generating bulk PDFs:', error);
      alert('Failed to generate bulk PDFs');
    } finally {
      setIsPrintingPDF(false);
    }
  };

  const handleExport = async (
    format: 'csv' | 'xlsx' | 'pdf',
    scope: 'all' | 'class' = 'class',
  ) => {
    if (isEditMode) return; // safety
    setIsExportOpen(false);

    // Use new PDF printing for PDF format
    if (format === 'pdf') {
      if (scope === 'class') {
        await handlePrintTimetable();
      } else {
        await handlePrintAllTimetables();
      }
      return;
    }

    // Use existing export for CSV and XLSX
    setIsExporting(true);
    try {
      const resp = await timetableService.exportTimetables({
        format,
        scope,
        classId:
          scope === 'class' && selectedClassId ? selectedClassId : undefined,
      });
      if (!resp.success || !resp.data) {
        alert(resp.error || 'Export failed');
        return;
      }
      const { filename, data, mime } = resp.data;
      const isLikelyBase64 = (str: string) =>
        /^[A-Za-z0-9+/=\r\n]+$/.test(str) &&
        str.replace(/\s+/g, '').length % 4 === 0;
      let blob: Blob;
      if (typeof data === 'string' && isLikelyBase64(data)) {
        const cleaned = data.replace(/\s+/g, '');
        const padded = cleaned.padEnd(
          cleaned.length + ((4 - (cleaned.length % 4)) % 4),
          '=',
        );
        try {
          const binary = atob(padded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);
          blob = new Blob([bytes], { type: mime });
        } catch (decodeErr) {
          console.warn('Base64 decode failed, using raw data', decodeErr);
          blob = new Blob([data], { type: mime || 'application/octet-stream' });
        }
      } else {
        blob = new Blob(
          [typeof data === 'string' ? data : JSON.stringify(data, null, 2)],
          { type: mime || 'text/plain;charset=utf-8' },
        );
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        filename ||
        (scope === 'all'
          ? `all-classes-${Date.now()}.zip`
          : `timetable-${Date.now()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      console.error('Export error', e);
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // moved isExportOpen above to keep related state together
  const exportRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        isExportOpen &&
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isExportOpen]);

  if (!selectedClassId) {
    return (
      <div className='flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300'>
        <div className='text-center'>
          <Book className='mx-auto h-16 w-16 text-gray-400' />
          <h3 className='mt-4 text-lg font-medium text-gray-900'>
            No Class Selected
          </h3>
          <p className='mt-2 text-sm text-gray-500 max-w-sm'>
            Select a class to start building a timetable. If this is a fresh
            system, create classes first.
          </p>
        </div>
      </div>
    );
  }

  // Check if there are no timeslots configured for this class
  if (timeSlots.length === 0) {
    return (
      <div className='flex items-center justify-center h-96 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300'>
        <div className='text-center'>
          <Clock className='mx-auto h-16 w-16 text-yellow-400' />
          <h3 className='mt-4 text-lg font-medium text-gray-900'>
            No Timeslots Added Yet
          </h3>
          <p className='mt-2 text-sm text-gray-600 max-w-sm'>
            Please go to the "Timeslot Manager" tab to add time periods for your
            class schedule first.
          </p>
          <div className='mt-4'>
            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
              Switch to Timeslot Manager to get started
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='space-y-6'>
        {/* Header with Actions */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Timetable Builder
              </h1>
              <p className='mt-1 text-sm text-gray-600'>
                Drag subjects from the library to create your weekly schedule
              </p>
            </div>

            <div className='flex items-center space-x-3'>
              {/* Edit Mode Toggle */}
              <button
                onClick={handleToggleEditMode}
                className={`
                  inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors
                  ${
                    isEditMode
                      ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }
                `}
              >
                {isEditMode ? (
                  <Edit3 className='w-4 h-4 mr-2' />
                ) : (
                  <Eye className='w-4 h-4 mr-2' />
                )}
                {isEditMode ? 'Edit Mode' : 'View Mode'}
              </button>

              {/* Reset Button */}
              {isEditMode && timetableSlots.length > 0 && (
                <button
                  onClick={handleResetTimetable}
                  className='inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Reset
                </button>
              )}

              {/* Export dropdown only in view mode */}
              {!isEditMode && (
                <div
                  className='relative inline-block text-left'
                  ref={exportRef}
                >
                  <button
                    type='button'
                    onClick={() => setIsExportOpen(o => !o)}
                    disabled={isExporting || isPrintingPDF}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${isExporting || isPrintingPDF ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed' : isExportOpen ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >
                    <Download className='w-4 h-4 mr-2' />{' '}
                    {isExporting
                      ? 'Exporting...'
                      : isPrintingPDF
                        ? 'Generating PDF...'
                        : 'Export'}
                    {isExportOpen && !isExporting && !isPrintingPDF && (
                      <X className='w-3 h-3 ml-1' />
                    )}
                  </button>
                  {isExportOpen && !isExporting && !isPrintingPDF && (
                    <div className='absolute right-0 z-30 mt-2 w-64 origin-top-right rounded-md border border-gray-200 bg-white shadow-lg focus:outline-none animate-fade-in'>
                      <div className='p-3 space-y-3 text-sm max-h-96 overflow-auto'>
                        <div>
                          <div className='px-1 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
                            This Class
                          </div>
                          <div className='grid grid-cols-3 gap-2'>
                            <button
                              onClick={() => handleExport('csv', 'class')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <FileText className='w-4 h-4 mb-1' /> CSV
                            </button>
                            <button
                              onClick={() => handleExport('xlsx', 'class')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <FileSpreadsheet className='w-4 h-4 mb-1' /> XLSX
                            </button>
                            <button
                              onClick={() => handleExport('pdf', 'class')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <File className='w-4 h-4 mb-1' /> PDF
                            </button>
                          </div>
                        </div>
                        <div className='border-t pt-2'>
                          <div className='px-1 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase'>
                            All Classes
                          </div>
                          <div className='grid grid-cols-3 gap-2'>
                            <button
                              onClick={() => handleExport('csv', 'all')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <FileText className='w-4 h-4 mb-1' /> CSV
                            </button>
                            <button
                              onClick={() => handleExport('xlsx', 'all')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <FileSpreadsheet className='w-4 h-4 mb-1' /> XLSX
                            </button>
                            <button
                              onClick={() => handleExport('pdf', 'all')}
                              className='flex flex-col items-center px-2 py-2 rounded-md border hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-xs'
                            >
                              <File className='w-4 h-4 mb-1' /> PDF
                            </button>
                          </div>
                        </div>
                        <div className='text-xs text-gray-500 leading-snug'>
                          Exports include: Class, Day, Time, Subject, Teacher,
                          Room, Conflict.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              {isEditMode && (
                <button
                  onClick={handleSaveTimetable}
                  disabled={isLoadingTimetable}
                  className={`
                    inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors
                    ${
                      isLoadingTimetable
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-white bg-blue-600 hover:bg-blue-700'
                    }
                  `}
                >
                  <Save className='w-4 h-4 mr-2' />
                  {isLoadingTimetable ? 'Saving...' : 'Save Timetable'}
                </button>
              )}
            </div>
          </div>

          {/* Validation Messages */}
          {(validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div className='mt-4 space-y-2'>
              {/* Errors */}
              {validationErrors.length > 0 && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
                  <div className='flex items-start'>
                    <AlertCircle className='w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0' />
                    <div>
                      <h4 className='text-sm font-medium text-red-800'>
                        Validation Errors
                      </h4>
                      <ul className='mt-1 text-sm text-red-700 list-disc list-inside'>
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationWarnings.length > 0 && (
                <div className='p-3 bg-amber-50 border border-amber-200 rounded-md'>
                  <div className='flex items-start'>
                    <AlertCircle className='w-5 h-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0' />
                    <div>
                      <h4 className='text-sm font-medium text-amber-800'>
                        Warnings
                      </h4>
                      <ul className='mt-1 text-sm text-amber-700 list-disc list-inside'>
                        {validationWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Subject Library - Left Sidebar */}
          <div className='lg:col-span-1'>
            <SubjectLibrary />
          </div>

          {/* Timetable Grid - Main Content */}
          <div className='lg:col-span-2'>
            <TimetableGrid />
          </div>
        </div>

        {/* Status Bar */}
        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <div className='flex items-center space-x-6'>
              <span>
                <strong>{timetableSlots.length}</strong> assignments
              </span>
              <span>
                <strong>
                  {new Set(timetableSlots.map(slot => slot.subjectId)).size}
                </strong>{' '}
                subjects used
              </span>
              <span>
                <strong>
                  {
                    new Set(
                      timetableSlots
                        .map(slot => slot.teacherId)
                        .filter(Boolean),
                    ).size
                  }
                </strong>{' '}
                teachers assigned
              </span>
              <span className='flex items-center'>
                <span className='inline-block w-3 h-3 rounded-sm bg-amber-300 border border-amber-400 mr-1' />
                <span>Conflict</span>
              </span>
            </div>

            <div className='flex items-center space-x-4'>
              {validationErrors.length > 0 && (
                <span className='text-red-600'>
                  {validationErrors.length} error
                  {validationErrors.length !== 1 ? 's' : ''}
                </span>
              )}
              {validationWarnings.length > 0 && (
                <span className='text-amber-600'>
                  {validationWarnings.length} warning
                  {validationWarnings.length !== 1 ? 's' : ''}
                </span>
              )}
              {validationErrors.length === 0 &&
                validationWarnings.length === 0 &&
                timetableSlots.length > 0 && (
                  <span className='text-green-600'>✓ Valid schedule</span>
                )}
              {timetableSlots.some(s => s.hasConflict) && (
                <span className='text-amber-600'>
                  {timetableSlots.filter(s => s.hasConflict).length} conflict(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedSubject && <DraggedSubjectOverlay subject={draggedSubject} />}
      </DragOverlay>

      {/* Teacher Assignment Modal only in edit mode */}
      {isEditMode && <TeacherAssignmentModal />}
    </DndContext>
  );
}
