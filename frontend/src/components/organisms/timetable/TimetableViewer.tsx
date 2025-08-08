'use client';

import React, { useState } from 'react';
import TimetableHeader from '@/components/molecules/timetable/TimetableHeader';
import TimetableGrid from '@/components/molecules/timetable/TimetableGrid';
import TimetableLegend from '@/components/molecules/timetable/TimetableLegend';
import { TimetableViewerProps, TimetableData } from '@/types/timetable';
import { formatTeacherName } from '@/utils/timetableFormatters';

interface TimetableViewerComponentProps extends TimetableViewerProps {
  timetableData: TimetableData;
}

export default function TimetableViewer({
  classId,
  sectionId,
  initialGrade,
  initialSection,
  timetableData,
  onGradeChange,
  onSectionChange,
  onExport,
  onCreateSchedule,
  onBulkManage,
  readOnly = false,
}: TimetableViewerComponentProps) {
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedSection, setSelectedSection] = useState(initialSection);

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    onGradeChange?.(grade);
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    onSectionChange?.(section);
  };

  const handleBulkManage = () => {
    console.log('Bulk manage clicked');
    onBulkManage?.();
  };

  const handleExport = () => {
    console.log('Export current clicked');
    onExport?.('pdf');
  };

  const handleCreateSchedule = () => {
    console.log('Create schedule clicked');
    onCreateSchedule?.();
  };

  const handleViewDetails = () => {
    console.log('View details clicked');
  };

  const handleEditSchedule = () => {
    console.log('Edit schedule clicked');
  };

  const handleDuplicate = () => {
    console.log('Duplicate clicked');
  };

  const handleExportAction = () => {
    console.log('Export action clicked');
    onExport?.('excel');
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <TimetableHeader
          grade={selectedGrade}
          section={selectedSection}
          teacherName={formatTeacherName(
            timetableData.classTeacher.firstName,
            timetableData.classTeacher.lastName,
          )}
          employeeId={timetableData.classTeacher.employeeId}
          room={timetableData.room}
          weekCount='432'
          onGradeChange={handleGradeChange}
          onSectionChange={handleSectionChange}
          onBulkManage={handleBulkManage}
          onExport={handleExport}
          onCreateSchedule={handleCreateSchedule}
          onViewDetails={handleViewDetails}
          onEditSchedule={handleEditSchedule}
          onDuplicate={handleDuplicate}
          onExportAction={handleExportAction}
        />

        <TimetableGrid schedule={timetableData.schedule} />

        <TimetableLegend
          weeklyHours={timetableData.weeklyHours}
          totalSubjects={timetableData.totalSubjects}
          lastUpdated={timetableData.lastUpdated}
        />
      </div>
    </div>
  );
}
