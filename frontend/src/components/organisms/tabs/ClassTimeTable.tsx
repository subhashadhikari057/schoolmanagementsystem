'use client';

import React, { useState } from 'react';
import { mockQuery } from '@/constants/timetableMockData';
import SectionTitle from '@/components/atoms/display/SectionTitle';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import ToggleButton from '@/components/atoms/form-controls/ToggleButton';
import { Download, Eye, Menu, Plus } from 'lucide-react';
import CreateScheduleModal from '@/components/organisms/modals/CreateScheduleModal';

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const dayKeys = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const gradeOptions = ['Grade 10', 'Grade 11', 'Grade 12'].map(g => ({
  value: g,
  label: g,
}));
const sectionOptions = ['A', 'B', 'C'].map(s => ({ value: s, label: s }));

function formatTeacherName(first: string, last: string) {
  return `${first} ${last}`.trim();
}

function getPeriodColor(type: string) {
  const colors: Record<string, string> = {
    regular: 'bg-blue-50 border-blue-200 text-blue-900',
    break: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    lunch: 'bg-green-50 border-green-200 text-green-900',
    activity: 'bg-orange-50 border-orange-200 text-orange-900',
    study_hall: 'bg-purple-50 border-purple-200 text-purple-900',
    free_period: 'bg-gray-50 border-gray-200 text-gray-900',
  };
  return colors[type] || colors.free_period;
}

export default function ClassTimeTable() {
  const timetableData = mockQuery.timetableData;
  const [selectedGrade, setSelectedGrade] = useState(timetableData.grade);
  const [selectedSection, setSelectedSection] = useState(timetableData.section);
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] =
    useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInitialData, setEditInitialData] = useState<any>(null);

  const actionButtons = [
    {
      id: 'bulk-manager',
      label: 'Bulk Manager',
      icon: <Menu size={16} />,
      onClick: () => alert('Bulk Manager clicked'),
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
    },
    {
      id: 'export-current',
      label: 'Export Current',
      icon: <Download size={16} />,
      onClick: () => alert('Export Current clicked'),
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
    },
    {
      id: 'Edit Schedule',
      label: 'Edit Schedule',
      icon: <Eye size={16} />,
      onClick: () => {
        // Extract start/end time from timeSlot string (e.g., '8:00 - 8:50')
        const parseTimeSlot = (timeSlotStr: string) => {
          const [start, end] = timeSlotStr.split('-').map(s => s.trim());
          return { startTime: start || '', endTime: end || '' };
        };
        setEditInitialData({
          basicInfo: {
            scheduleName: 'Class Timetable', // No name in mock, use default
            grade: timetableData.grade || '',
            section: timetableData.section || '',
            academicYear: '2024-25', // Not in mock, use default
            startDate: '', // Not in mock, leave blank
            endDate: '', // Not in mock, leave blank
            effectiveFrom: '', // Not in mock, leave blank
            status: 'draft', // Not in mock, use default
          },
          timeSlots:
            timetableData.schedule?.map(slot => {
              const { startTime, endTime } = parseTimeSlot(slot.timeSlot);
              // Use the first period's type for the slot, fallback to 'regular'
              const firstPeriod = Object.values(slot.periods)[0];
              return {
                startTime,
                endTime,
                type: firstPeriod?.type || 'regular',
              };
            }) || [],
        });
        setIsEditMode(true);
        setIsCreateScheduleModalOpen(true);
      },
      className: 'bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg',
    },
    {
      id: 'create-schedule',
      label: 'Create Schedule',
      icon: <Plus size={16} />,
      onClick: () => setIsCreateScheduleModalOpen(true),
      className: 'bg-[#2F80ED] text-white hover:bg-blue-600 rounded-lg',
    },
  ];

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <SectionTitle text='Class Timetable Viewer' level={1} className='mb-1' />
      <p className='text-gray-600 mb-4'>
        View detailed class schedules with teacher and room information
      </p>

      <div className='flex flex-wrap gap-6 items-center mb-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Grade:
          </label>
          <Dropdown
            type='filter'
            options={gradeOptions}
            selectedValue={selectedGrade}
            onSelect={setSelectedGrade}
            placeholder='Select Grade'
            className='min-w-[120px]'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Section:
          </label>
          <Dropdown
            type='filter'
            options={sectionOptions}
            selectedValue={selectedSection}
            onSelect={setSelectedSection}
            placeholder='Select Section'
            className='min-w-[80px]'
          />
        </div>
        <div className='flex flex-col gap-1 text-sm text-gray-700'>
          <span>
            Teacher:{' '}
            <b>
              {formatTeacherName(
                timetableData.classTeacher.firstName,
                timetableData.classTeacher.lastName,
              )}
            </b>
          </span>
          <span>
            Employee ID: <b>{timetableData.classTeacher.employeeId}</b>
          </span>
          <span>
            Room: <b>{timetableData.room}</b>
          </span>
        </div>
        <div className='flex gap-2 ml-auto'>
          {actionButtons.map(btn => (
            <ToggleButton
              key={btn.id}
              onClick={btn.onClick}
              className={btn.className}
            >
              <div className='flex items-center gap-2'>
                {btn.icon}
                <span>{btn.label}</span>
              </div>
            </ToggleButton>
          ))}
        </div>
      </div>

      <div className='overflow-x-auto bg-white rounded-md shadow mb-6'>
        <table className='min-w-[900px] w-full border-collapse'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='p-2 border border-gray-200'>Time Slot</th>
              {days.map(day => (
                <th key={day} className='p-2 border border-gray-200'>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timetableData.schedule.map((timeSlot, idx) => (
              <tr key={idx}>
                <td className='p-2 border border-gray-200 font-medium w-24'>
                  {timeSlot.timeSlot}
                </td>
                {dayKeys.map(dayKey => {
                  const period =
                    timeSlot.periods[dayKey as keyof typeof timeSlot.periods];
                  return (
                    <td
                      key={dayKey}
                      className='p-2 border border-gray-200 w-36 h-36 align-top'
                    >
                      {period ? (
                        <div
                          className={`p-2 rounded-md h-full flex flex-col justify-between ${getPeriodColor(period.type)}`}
                        >
                          <div className='font-semibold'>{period.subject}</div>
                          <div className='text-xs text-gray-600'>
                            {formatTeacherName(
                              period.teacher.firstName,
                              period.teacher.lastName,
                            )}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {period.room}
                          </div>
                          <div className='text-[11px] text-gray-400'>
                            {period.type.replace('_', ' ')}
                          </div>
                        </div>
                      ) : (
                        <div className='h-full flex items-center justify-center bg-gray-50 rounded-md border-2 border-dashed border-gray-200'>
                          <span className='text-xs text-gray-400'>
                            Free Period
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='bg-white rounded-lg shadow p-4 max-w-full'>
        <h3 className='font-semibold mb-2'>Legend & Stats</h3>
        <div className='flex flex-wrap justify-between gap-8'>
          <div>
            <div className='font-medium mb-1'>Period Types</div>
            <ul className='flex gap-4 flex-wrap text-sm text-gray-700'>
              <li>
                <span className='inline-block w-3 h-3 bg-blue-100 border-2 border-blue-300 mr-2' />
                Regular
              </li>
              <li>
                <span className='inline-block w-3 h-3 bg-yellow-100 border-2 border-yellow-300 mr-2' />
                Break
              </li>
              <li>
                <span className='inline-block w-3 h-3 bg-green-200 border-2 border-green-300 mr-2' />
                Lunch
              </li>
              <li>
                <span className='inline-block w-3 h-3 bg-purple-200 border-2 border-purple-300 mr-2' />
                Study Hall
              </li>
              <li>
                <span className='inline-block w-3 h-3 bg-orange-200 border-2 border-orange-300 mr-2' />
                Activity
              </li>
              <li>
                <span className='inline-block w-3 h-3 bg-gray-100 border-2 border-gray-200 mr-2' />
                Free
              </li>
            </ul>
          </div>
          <div className='text-sm text-gray-800'>
            <div>
              Weekly Hours: <b>{timetableData.weeklyHours}</b>
            </div>
            <div>
              Subjects: <b>{timetableData.totalSubjects}</b>
            </div>
            <div>
              Last Updated:{' '}
              <b>{timetableData.lastUpdated.toLocaleDateString()}</b>
            </div>
          </div>
        </div>
      </div>

      <CreateScheduleModal
        isOpen={isCreateScheduleModalOpen}
        onClose={() => {
          setIsCreateScheduleModalOpen(false);
          setIsEditMode(false);
        }}
        onSuccess={() =>
          alert(
            isEditMode
              ? 'Schedule updated successfully!'
              : 'Schedule created successfully!',
          )
        }
        isEditMode={isEditMode}
        initialData={
          isEditMode && editInitialData ? editInitialData : undefined
        }
      />
    </div>
  );
}
