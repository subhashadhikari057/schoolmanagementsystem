import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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

  // Load or create schedule for the selected class
  const loadClassSchedule = useCallback(async () => {
    if (!selectedClassId || !selectedClass) return;

    setIsLoadingTimetable(true);
    try {
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
          academicYear: selectedClass.academicYearId,
          name: `Grade ${selectedClass.grade} Section ${selectedClass.section} Timetable`,
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
          throw new Error('Failed to create schedule');
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
                day: s.day,
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

    if (subject && timeSlot && day && timeSlotId) {
      const slotType = (timeSlot.type || '').toLowerCase();
      const isRegular = ['regular', 'period'].includes(slotType);
      if (!isRegular) {
        return; // Only allow assignment to regular academic slots
      }
      assignSubjectToSlot(timeSlotId, day, subject);
    }
  };

  const handleSaveTimetable = async () => {
    if (!currentSchedule) {
      console.error('No schedule available to save');
      return;
    }

    const storeState = useScheduleStore.getState();
    const { pendingDeletedTimeslotIds, clearPendingDeletedTimeslots } =
      storeState as {
        pendingDeletedTimeslotIds: string[];
        clearPendingDeletedTimeslots: () => void;
      };

    // If there are pending timeslot deletions, confirm impact
    if (pendingDeletedTimeslotIds && pendingDeletedTimeslotIds.length > 0) {
      const warning =
        `You're about to permanently delete ${pendingDeletedTimeslotIds.length} time slot(s).\n\n` +
        `All timetable entries (subjects/teachers) mapped to these slots will also be deleted.\n\nContinue?`;
      const confirmed = window.confirm(warning);
      if (!confirmed) return;

      // Perform backend deletions sequentially (could be parallel, keep simple for now)
      for (const tsId of pendingDeletedTimeslotIds) {
        try {
          await timeslotService.deleteTimeslot(tsId);
        } catch (e) {
          console.warn('Failed deleting timeslot on save', tsId, e);
        }
      }
      clearPendingDeletedTimeslots();
    }

    // Validate before saving
    const validation = validateSchedule();

    if (!validation.valid && validation.errors.length > 0) {
      // Show validation warnings but allow saving (partial timetables are allowed)
      console.warn('Validation warnings:', validation.errors);
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
        alert('No changes to save.');
        return;
      }

      const saveResponse = await timetableService.bulkTimetableOperations({
        scheduleId: currentSchedule.id,
        operations,
      });

      if (saveResponse.success) {
        console.log('Timetable saved successfully');
        alert('Timetable saved successfully!');

        // Reload the timetable to get the latest state
        await loadClassSchedule();
      } else {
        throw new Error(saveResponse.error || 'Failed to save timetable');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Failed to save timetable. Please try again.');
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

  const handleExport = async (
    format: 'csv' | 'xlsx' | 'pdf',
    scope: 'all' | 'class' = 'class',
  ) => {
    if (isEditMode) return; // safety
    setIsExportOpen(false);
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
            Please select a class from the dropdown above to start building your
            timetable.
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                    disabled={isExporting}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${isExporting ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed' : isExportOpen ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                  >
                    <Download className='w-4 h-4 mr-2' />{' '}
                    {isExporting ? 'Exporting...' : 'Export'}
                    {isExportOpen && !isExporting && (
                      <X className='w-3 h-3 ml-1' />
                    )}
                  </button>
                  {isExportOpen && !isExporting && (
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
