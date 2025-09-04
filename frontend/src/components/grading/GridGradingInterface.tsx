'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Button from '@/components/atoms/form-controls/Button';
import Input from '@/components/atoms/form-controls/Input';
import {
  Save,
  Search,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  type GridGradingData,
  type GridGradeEntry,
  gradingService,
} from '@/api/services/grading.service';
import { toast } from 'sonner';

interface GridGradingInterfaceProps {
  classId: string;
  examScheduleId: string;
  calendarEntryId: string;
  onBack: () => void;
  onSuccess: () => void;
}

interface GridCellData {
  studentId: string;
  subjectId: string;
  marksObtained?: number;
  remarks?: string;
  isAbsent: boolean;
  hasExisting: boolean;
  original?: {
    marksObtained?: number;
    remarks?: string;
    isAbsent: boolean;
  };
  modificationReason?: string;
}

export default function GridGradingInterface({
  classId,
  examScheduleId,
  calendarEntryId,
  onBack,
  onSuccess,
}: GridGradingInterfaceProps) {
  const [gridData, setGridData] = useState<GridGradingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cellData, setCellData] = useState<Map<string, GridCellData>>(
    new Map(),
  );
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [showRemarks, setShowRemarks] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [pendingModification, setPendingModification] = useState<{
    cellKey: string;
    updates: Partial<GridCellData>;
    studentName: string;
    subjectName: string;
  } | null>(null);
  const [modificationReason, setModificationReason] = useState('');

  // Load grid grading data
  const loadGridData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await gradingService.getGridGradingData(
        classId,
        examScheduleId,
        calendarEntryId,
      );

      if (response.success && response.data) {
        setGridData(response.data);
        initializeCellData(response.data);
      } else {
        toast.error('Failed to load grading data');
      }
    } catch (error) {
      console.error('Error loading grid data:', error);
      toast.error('Failed to load grading data');
    } finally {
      setIsLoading(false);
    }
  }, [classId, examScheduleId, calendarEntryId]);

  // Initialize cell data from grid data
  const initializeCellData = (data: GridGradingData) => {
    const newCellData = new Map<string, GridCellData>();

    data.students.forEach(student => {
      data.subjects.forEach(subject => {
        const cellKey = `${student.id}-${subject.id}`;
        const subjectData = student.subjects[subject.id];

        newCellData.set(cellKey, {
          studentId: student.id,
          subjectId: subject.id,
          marksObtained: subjectData?.marksObtained,
          remarks: subjectData?.remarks || '',
          isAbsent: subjectData?.isAbsent || false,
          hasExisting: !!subjectData?.resultId,
          original: {
            marksObtained: subjectData?.marksObtained,
            remarks: subjectData?.remarks || '',
            isAbsent: subjectData?.isAbsent || false,
          },
        });
      });
    });

    setCellData(newCellData);
  };

  useEffect(() => {
    loadGridData();
  }, [loadGridData]);

  // Update cell data
  const updateCellData = (cellKey: string, updates: Partial<GridCellData>) => {
    setCellData(prev => {
      const newData = new Map(prev);
      const current = newData.get(cellKey);
      if (current) {
        newData.set(cellKey, { ...current, ...updates });
      }
      return newData;
    });
  };

  // Update cell data directly (no immediate modification check)
  const updateCellDataDirectly = (
    cellKey: string,
    updates: Partial<GridCellData>,
  ) => {
    updateCellData(cellKey, updates);
  };

  // Handle modification reason submission
  const handleModificationReasonSubmit = () => {
    if (!pendingModification || !modificationReason.trim()) {
      toast.error('Please provide a reason for the modification');
      return;
    }

    // Apply the pending changes with the modification reason
    updateCellData(pendingModification.cellKey, {
      ...pendingModification.updates,
      modificationReason: modificationReason.trim(),
    });

    // Close modal and reset state
    setShowModificationModal(false);
    setPendingModification(null);
    setModificationReason('');
  };

  // Show validation errors for missing modification reasons
  const showValidationErrors = (
    changedCells: { cellKey: string; cell: GridCellData }[],
  ) => {
    changedCells.forEach(({ cell }) => {
      const student = gridData?.students.find(s => s.id === cell.studentId);
      const subject = gridData?.subjects.find(s => s.id === cell.subjectId);
      toast.error(
        `Modification reason required for ${student?.user.fullName} in ${subject?.name}`,
      );
    });
  };

  // Get cell key
  const getCellKey = (studentId: string, subjectId: string) =>
    `${studentId}-${subjectId}`;

  // Check if cell has changes
  const hasChanges = (cellKey: string): boolean => {
    const cell = cellData.get(cellKey);
    if (!cell || !cell.hasExisting) return false;

    return (
      cell.marksObtained !== cell.original?.marksObtained ||
      cell.remarks !== cell.original?.remarks ||
      cell.isAbsent !== cell.original?.isAbsent
    );
  };

  // Get cell status
  const getCellStatus = (studentId: string, subjectId: string) => {
    const cellKey = getCellKey(studentId, subjectId);
    const cell = cellData.get(cellKey);
    const subject = gridData?.subjects.find(s => s.id === subjectId);

    if (!cell || !subject) return 'pending';

    if (cell.isAbsent) return 'absent';
    if (cell.marksObtained === undefined) return 'pending';

    return cell.marksObtained >= subject.passMarks ? 'pass' : 'fail';
  };

  // Get cell status color
  const getCellStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'absent':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  // Filter students based on search
  const filteredStudents =
    gridData?.students.filter(student => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        student.user.fullName.toLowerCase().includes(searchLower) ||
        student.rollNumber.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Save all changes
  const handleSaveAll = async () => {
    if (!gridData) return;

    setIsSaving(true);
    try {
      // First, identify all cells that need modification reasons
      const changedExistingCells: { cellKey: string; cell: GridCellData }[] =
        [];
      const gradesToSave: GridGradeEntry[] = [];

      cellData.forEach((cell, cellKey) => {
        // Only save cells that have data or changes
        const hasData =
          cell.marksObtained !== undefined ||
          cell.isAbsent ||
          cell.remarks?.trim();
        const hasChanged = hasChanges(cellKey);

        if (hasData || hasChanged) {
          // Check if this is an existing grade that has changed and needs modification reason
          if (
            cell.hasExisting &&
            hasChanged &&
            !cell.modificationReason?.trim()
          ) {
            changedExistingCells.push({ cellKey, cell });
          }

          const gradeEntry: GridGradeEntry = {
            studentId: cell.studentId,
            subjectId: cell.subjectId,
            marksObtained: cell.marksObtained,
            remarks: cell.remarks,
            isAbsent: cell.isAbsent,
          };

          // Add modification reason if available
          if (
            cell.hasExisting &&
            hasChanged &&
            cell.modificationReason?.trim()
          ) {
            gradeEntry.modificationReason = cell.modificationReason;
          }

          gradesToSave.push(gradeEntry);
        }
      });

      // If there are changed existing grades without modification reasons, show validation errors
      if (changedExistingCells.length > 0) {
        showValidationErrors(changedExistingCells);
        setIsSaving(false);
        return;
      }

      if (gradesToSave.length === 0) {
        toast.warning('No changes to save');
        setIsSaving(false);
        return;
      }

      const response = await gradingService.bulkGridGrading({
        classId,
        examScheduleId,
        calendarEntryId,
        grades: gradesToSave,
      });

      if (response.success) {
        if (response.data.success) {
          toast.success(
            `Successfully saved ${response.data.processedCount} grades`,
          );
          if (response.data.errors.length > 0) {
            toast.warning(`${response.data.errors.length} errors occurred`);
            console.warn('Grading errors:', response.data.errors);
          }
          await loadGridData(); // Reload data
          onSuccess();
        } else {
          toast.error('Some grades failed to save');
          response.data.errors.forEach(error => {
            console.error('Grading error:', error);
          });
        }
      } else {
        toast.error('Failed to save grades');
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset all changes
  const handleResetAll = () => {
    if (gridData) {
      initializeCellData(gridData);
      toast.info('All changes reset');
    }
  };

  if (isLoading) {
    return (
      <Card className='p-8'>
        <div className='text-center'>
          <Clock className='mx-auto h-8 w-8 text-gray-400 animate-spin mb-4' />
          <p className='text-gray-500'>Loading grading interface...</p>
        </div>
      </Card>
    );
  }

  if (!gridData) {
    return (
      <Card className='p-8'>
        <div className='text-center'>
          <AlertTriangle className='mx-auto h-12 w-12 text-red-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Data Available
          </h3>
          <p className='text-gray-500'>
            Unable to load grading data for this class and exam.
          </p>
          <Button onClick={onBack} className='mt-4'>
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card className='p-6'>
        <div className='flex justify-between items-start'>
          <div>
            <h2 className='text-2xl font-semibold text-gray-900'>
              Grade Class {gridData.class.grade}
              {gridData.class.section}
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              {gridData.calendarEntry.name} •{' '}
              {gridData.examSchedule.academicYear}
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              {gridData.statistics.totalStudents} students •{' '}
              {gridData.statistics.totalSubjects} subjects
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-center'>
              <div className='text-lg font-bold text-green-600'>
                {gridData.statistics.gradedEntries}
              </div>
              <div className='text-xs text-gray-500'>Graded</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-orange-600'>
                {gridData.statistics.pendingEntries}
              </div>
              <div className='text-xs text-gray-500'>Pending</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-red-600'>
                {gridData.statistics.absentEntries}
              </div>
              <div className='text-xs text-gray-500'>Absent</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <Card className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search students...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 w-64'
              />
            </div>
            <Button
              onClick={() => setShowRemarks(!showRemarks)}
              className='flex items-center bg-gray-500 text-white hover:bg-gray-600'
            >
              {showRemarks ? (
                <EyeOff className='w-4 h-4 mr-2' />
              ) : (
                <Eye className='w-4 h-4 mr-2' />
              )}
              {showRemarks ? 'Hide' : 'Show'} Remarks
            </Button>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              onClick={handleResetAll}
              className='flex items-center bg-gray-500 text-white hover:bg-gray-600'
            >
              <RotateCcw className='w-4 h-4 mr-2' />
              Reset All
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className='flex items-center'
            >
              <Save className='w-4 h-4 mr-2' />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Grading Grid */}
      <Card className='p-6'>
        <div className='overflow-x-auto'>
          <div className='min-w-full'>
            {/* Grid Header */}
            <div
              className='grid gap-1 mb-4'
              style={{
                gridTemplateColumns: `250px repeat(${gridData.subjects.length}, 200px)${showRemarks ? ` repeat(${gridData.subjects.length}, 250px)` : ''}`,
              }}
            >
              {/* Student Column Header */}
              <div className='p-3 bg-gray-100 border border-gray-300 rounded font-semibold text-gray-800'>
                <div className='flex items-center'>
                  <Users className='w-4 h-4 mr-2' />
                  Student ({filteredStudents.length})
                </div>
              </div>

              {/* Subject Headers */}
              {gridData.subjects.map(subject => (
                <React.Fragment key={subject.id}>
                  <div className='p-3 bg-blue-50 border border-blue-200 rounded text-center'>
                    <div className='font-semibold text-blue-900 text-sm'>
                      {subject.name}
                    </div>
                    <div className='text-xs text-blue-600 mt-1'>
                      {subject.code}
                    </div>
                    <div className='text-xs text-blue-500 mt-1'>
                      Max: {subject.maxMarks} • Pass: {subject.passMarks}
                    </div>
                  </div>
                  {showRemarks && (
                    <div className='p-3 bg-yellow-50 border border-yellow-200 rounded text-center'>
                      <div className='font-semibold text-yellow-900 text-sm'>
                        Remarks
                      </div>
                      <div className='text-xs text-yellow-600 mt-1'>
                        {subject.code}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Grid Body */}
            <div className='space-y-1'>
              {filteredStudents.map((student, studentIndex) => (
                <div
                  key={student.id}
                  className={`grid gap-1 ${studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  style={{
                    gridTemplateColumns: `250px repeat(${gridData.subjects.length}, 200px)${showRemarks ? ` repeat(${gridData.subjects.length}, 250px)` : ''}`,
                  }}
                >
                  {/* Student Info */}
                  <div className='p-3 border border-gray-200 rounded'>
                    <div className='font-medium text-gray-900 text-sm'>
                      {student.user.fullName}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      Roll: {student.rollNumber}
                    </div>
                  </div>

                  {/* Grade Cells */}
                  {gridData.subjects.map(subject => {
                    const cellKey = getCellKey(student.id, subject.id);
                    const cell = cellData.get(cellKey);
                    const status = getCellStatus(student.id, subject.id);
                    const isEditing = editingCell === cellKey;
                    const hasChanged = hasChanges(cellKey);

                    return (
                      <React.Fragment key={`${student.id}-${subject.id}`}>
                        {/* Marks Cell */}
                        <div
                          className={`p-2 border rounded cursor-pointer transition-all ${getCellStatusColor(status)} ${
                            isEditing ? 'ring-2 ring-blue-500' : ''
                          } ${hasChanged ? 'ring-1 ring-yellow-400' : ''}`}
                          onClick={() =>
                            setEditingCell(isEditing ? null : cellKey)
                          }
                        >
                          {isEditing ? (
                            <div className='space-y-2'>
                              <div className='flex items-center space-x-1'>
                                <Input
                                  type='number'
                                  min='0'
                                  max={subject.maxMarks}
                                  value={cell?.marksObtained || ''}
                                  onChange={e => {
                                    const value = e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : undefined;
                                    updateCellDataDirectly(cellKey, {
                                      marksObtained: value,
                                      isAbsent: false,
                                    });
                                  }}
                                  onClick={e => e.stopPropagation()}
                                  placeholder='0'
                                  disabled={cell?.isAbsent}
                                  className='w-16 h-8 text-xs p-1'
                                />
                                <span className='text-xs text-gray-500'>
                                  /{subject.maxMarks}
                                </span>
                              </div>
                              <label className='flex items-center text-xs'>
                                <input
                                  type='checkbox'
                                  checked={cell?.isAbsent || false}
                                  onChange={e => {
                                    updateCellDataDirectly(cellKey, {
                                      isAbsent: e.target.checked,
                                      marksObtained: e.target.checked
                                        ? undefined
                                        : cell?.marksObtained,
                                    });
                                  }}
                                  onClick={e => e.stopPropagation()}
                                  className='mr-1'
                                />
                                Absent
                              </label>
                              {/* Modification reason button for changed existing grades */}
                              {cell?.hasExisting && hasChanged && (
                                <div className='flex items-center space-x-1 mt-1'>
                                  <button
                                    type='button'
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      setPendingModification({
                                        cellKey,
                                        updates: {},
                                        studentName: student.user.fullName,
                                        subjectName: subject.name,
                                      });
                                      setModificationReason(
                                        cell.modificationReason || '',
                                      );
                                      setShowModificationModal(true);
                                    }}
                                    className={`h-6 text-xs px-2 rounded border ${
                                      cell.modificationReason?.trim()
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}
                                  >
                                    {cell.modificationReason?.trim()
                                      ? '✓ Reason'
                                      : '! Reason'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className='text-center'>
                              {cell?.isAbsent ? (
                                <div>
                                  <XCircle className='w-4 h-4 mx-auto text-orange-600' />
                                  <div className='text-xs mt-1'>Absent</div>
                                </div>
                              ) : cell?.marksObtained !== undefined ? (
                                <div>
                                  <div className='font-medium'>
                                    {cell.marksObtained}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    /{subject.maxMarks}
                                  </div>
                                  {status === 'pass' ? (
                                    <CheckCircle className='w-3 h-3 mx-auto text-green-600 mt-1' />
                                  ) : (
                                    <XCircle className='w-3 h-3 mx-auto text-red-600 mt-1' />
                                  )}
                                </div>
                              ) : (
                                <div className='text-gray-400 text-xs'>
                                  Click to grade
                                </div>
                              )}
                              {hasChanged && (
                                <div className='w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-1' />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Remarks Cell */}
                        {showRemarks && (
                          <div className='p-2 border border-gray-200 rounded bg-yellow-50'>
                            {isEditing ? (
                              <Input
                                value={cell?.remarks || ''}
                                onChange={e =>
                                  updateCellData(cellKey, {
                                    remarks: e.target.value,
                                  })
                                }
                                placeholder='Add remarks...'
                                className='w-full h-8 text-xs p-1'
                              />
                            ) : (
                              <div className='text-xs text-gray-600 min-h-[20px]'>
                                {cell?.remarks || '-'}
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className='text-center py-8'>
            <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Students Found
            </h3>
            <p className='text-gray-500'>
              {searchTerm
                ? 'No students match your search criteria'
                : 'No students in this class'}
            </p>
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className='p-4'>
        <h4 className='text-sm font-medium text-gray-900 mb-3'>
          Status Legend
        </h4>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='flex items-center space-x-2'>
            <div className='w-4 h-4 bg-green-50 border border-green-200 rounded'></div>
            <span className='text-sm text-gray-600'>Pass</span>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-4 h-4 bg-red-50 border border-red-200 rounded'></div>
            <span className='text-sm text-gray-600'>Fail</span>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-4 h-4 bg-orange-50 border border-orange-200 rounded'></div>
            <span className='text-sm text-gray-600'>Absent</span>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-4 h-4 bg-gray-50 border border-gray-200 rounded'></div>
            <span className='text-sm text-gray-600'>Not Graded</span>
          </div>
        </div>
        <div className='flex items-center space-x-2 mt-2'>
          <div className='w-2 h-2 bg-yellow-400 rounded-full'></div>
          <span className='text-sm text-gray-600'>Has unsaved changes</span>
        </div>
      </Card>

      {/* Instructions */}
      <Card className='p-4 bg-blue-50 border-blue-200'>
        <h4 className='text-sm font-medium text-blue-900 mb-2 flex items-center'>
          <BookOpen className='w-4 h-4 mr-2' />
          How to Use Grid Grading
        </h4>
        <ul className='text-sm text-blue-800 space-y-1'>
          <li>
            • Click on any cell to edit marks for that student and subject
          </li>
          <li>• Enter marks or check "Absent" if student was not present</li>
          <li>
            • Modification reason is required when changing existing grades
          </li>
          <li>• Use "Show Remarks" to add comments for each subject</li>
          <li>• Click "Save All Changes" to save all modifications at once</li>
        </ul>
      </Card>

      {/* Modification Reason Modal */}
      <Dialog
        open={showModificationModal}
        onOpenChange={setShowModificationModal}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Modification Reason Required</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='text-sm text-gray-600'>
              You are modifying existing grades for:
            </div>
            <div className='bg-gray-50 p-3 rounded-md space-y-1'>
              <div>
                <strong>Student:</strong> {pendingModification?.studentName}
              </div>
              <div>
                <strong>Subject:</strong> {pendingModification?.subjectName}
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Please provide a reason for this modification:
              </label>
              <textarea
                value={modificationReason}
                onChange={e => setModificationReason(e.target.value)}
                placeholder='Enter reason for grade modification...'
                className='w-full p-2 border border-gray-300 rounded-md resize-none'
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowModificationModal(false);
                setPendingModification(null);
                setModificationReason('');
              }}
              className='px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancel
            </Button>
            <Button
              onClick={handleModificationReasonSubmit}
              disabled={!modificationReason.trim()}
            >
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
