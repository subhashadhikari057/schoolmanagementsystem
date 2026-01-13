'use client';

import React, { useMemo, useState, useEffect } from 'react';
import LabeledInputField from '@/components/molecules/forms/LabeledInputField';
import Dropdown from '@/components/molecules/interactive/Dropdown';
import { Calendar } from 'lucide-react';
import { parentService } from '@/api/services/parent.service';
import { studentService } from '@/api/services/student.service';

interface StudentExam {
  id: string;
  title: string;
  date: string;
  examType?: string;
  classLabel?: string;
  subjectLabel?: string;
  roomLabel?: string;
  timeLabel?: string;
  instructions?: string;
  status: ExamStatus;
}

type ExamStatus = 'upcoming' | 'today' | 'completed';

interface StudentExamsTabProps {
  statusFilter: string;
  setStatusFilter?: (value: string) => void;
  selectedChild?: string;
}
export default function StudentExamsTab({
  statusFilter,
  setStatusFilter,
  selectedChild,
}: StudentExamsTabProps) {
  const [query, setQuery] = useState('');
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSchedule, setHasSchedule] = useState<boolean | null>(null);

  const formatExamType = (examType?: string) => {
    if (!examType) return '';
    return examType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusFromDate = (dateValue?: Date | null): ExamStatus => {
    if (!dateValue) return 'upcoming';
    const today = new Date();
    const dateOnly = new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (dateOnly.getTime() === todayOnly.getTime()) return 'today';
    if (dateOnly < todayOnly) return 'completed';
    return 'upcoming';
  };

  useEffect(() => {
    const loadExamSchedules = async () => {
      if (selectedChild !== undefined && !selectedChild) {
        setExams([]);
        setHasSchedule(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (selectedChild) {
          const response =
            await parentService.getChildExamRoutine(selectedChild);
          if (!response.success) {
            throw new Error(response.message || 'Failed to load exam routine');
          }

          const schedules = response.data?.schedules || [];
          if (schedules.length === 0) {
            setHasSchedule(false);
            setExams([]);
            return;
          }

          setHasSchedule(true);

          const mappedExams: StudentExam[] = schedules.flatMap(
            (schedule: any) => {
              const classLabel =
                schedule.class?.name ||
                (schedule.class
                  ? `Grade ${schedule.class.grade} - Section ${schedule.class.section}`
                  : response.data?.child?.className);

              return (schedule.slots || []).map((slot: any) => {
                const examDate = slot.dateslot?.examDate
                  ? new Date(slot.dateslot.examDate)
                  : null;
                const dateLabel = examDate
                  ? examDate.toLocaleDateString()
                  : 'TBD';
                const timeLabel =
                  slot.dateslot?.startTime && slot.dateslot?.endTime
                    ? `${slot.dateslot.startTime} - ${slot.dateslot.endTime}`
                    : slot.dateslot?.startTime || '';
                const status = getStatusFromDate(examDate);

                return {
                  id: slot.id,
                  title: schedule.calendarEntry?.name || 'Exam Schedule',
                  date: dateLabel,
                  examType: schedule.calendarEntry?.examType,
                  classLabel,
                  subjectLabel: slot.subject?.name || 'TBD',
                  roomLabel: slot.room?.name || slot.room?.roomNo || 'TBD',
                  timeLabel,
                  instructions: slot.instructions || undefined,
                  status,
                };
              });
            },
          );

          setExams(mappedExams);
          return;
        }

        const response = await studentService.getMyExamRoutine();
        if (!response.success) {
          throw new Error(response.message || 'Failed to load exam routine');
        }

        const schedules = response.data?.schedules || [];
        if (schedules.length === 0) {
          setHasSchedule(false);
          setExams([]);
          return;
        }

        setHasSchedule(true);

        const mappedExams: StudentExam[] = schedules.flatMap(
          (schedule: any) => {
            const classLabel =
              schedule.class?.name ||
              (schedule.class
                ? `Grade ${schedule.class.grade} - Section ${schedule.class.section}`
                : response.data?.child?.className);

            return (schedule.slots || []).map((slot: any) => {
              const examDate = slot.dateslot?.examDate
                ? new Date(slot.dateslot.examDate)
                : null;
              const dateLabel = examDate
                ? examDate.toLocaleDateString()
                : 'TBD';
              const timeLabel =
                slot.dateslot?.startTime && slot.dateslot?.endTime
                  ? `${slot.dateslot.startTime} - ${slot.dateslot.endTime}`
                  : slot.dateslot?.startTime || '';
              const status = getStatusFromDate(examDate);

              return {
                id: slot.id,
                title: schedule.calendarEntry?.name || 'Exam Schedule',
                date: dateLabel,
                examType: schedule.calendarEntry?.examType,
                classLabel,
                subjectLabel: slot.subject?.name || 'TBD',
                roomLabel: slot.room?.name || slot.room?.roomNo || 'TBD',
                timeLabel,
                instructions: slot.instructions || undefined,
                status,
              };
            });
          },
        );

        setExams(mappedExams);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load exam routine';
        setError(message);
        setExams([]);
        setHasSchedule(null);
      } finally {
        setLoading(false);
      }
    };

    loadExamSchedules();
  }, [selectedChild]);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesQuery =
        exam.title.toLowerCase().includes(query.toLowerCase()) ||
        (exam.classLabel || '').toLowerCase().includes(query.toLowerCase()) ||
        (exam.examType || '').toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'upcoming' && exam.status === 'upcoming') ||
        (statusFilter === 'today' && exam.status === 'today') ||
        (statusFilter === 'completed' && exam.status === 'completed');

      return matchesQuery && matchesStatus;
    });
  }, [exams, query, statusFilter]);

  return (
    <div className='space-y-6'>
      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-row gap-3 items-center w-full'>
          <div className='flex-1'>
            <LabeledInputField
              label=''
              placeholder='Search exams...'
              value={query}
              onChange={e => setQuery(e.target.value)}
              className='bg-white border border-gray-200 rounded-lg px-4 py-2 w-full hidden sm:block'
            />
          </div>
          {setStatusFilter && (
            <Dropdown
              type='filter'
              title='Filter Status'
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'today', label: 'Today' },
                { value: 'completed', label: 'Completed' },
              ]}
              selectedValue={statusFilter}
              onSelect={setStatusFilter}
              className='max-w-xs'
            />
          )}
        </div>
      </div>

      {/* Exams List */}
      <div className='space-y-4'>
        {loading && (
          <div className='flex items-center justify-center py-12'>
            <p className='text-gray-600'>Loading exam schedules...</p>
          </div>
        )}
        {!loading && error && (
          <div className='flex items-center justify-center py-12'>
            <p className='text-red-600'>{error}</p>
          </div>
        )}
        {!loading && !error && hasSchedule === false && (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>No exam schedule found.</p>
            </div>
          </div>
        )}
        {!loading &&
        !error &&
        hasSchedule !== false &&
        filteredExams.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>
                No exam routine found for this class.
              </p>
            </div>
          </div>
        ) : (
          filteredExams.map(exam => (
            <div
              key={exam.id}
              className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-3'>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'today'
                          ? 'bg-orange-100 text-orange-700'
                          : exam.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {exam.status}
                    </span>
                    {exam.examType && (
                      <span className='inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700'>
                        {formatExamType(exam.examType)}
                      </span>
                    )}
                  </div>

                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    {exam.title}
                  </h3>

                  <div className='flex items-center gap-6 text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4' />
                      <span>Date: {exam.date}</span>
                    </div>
                    {exam.timeLabel && (
                      <div className='flex items-center gap-2'>
                        <span>Time: {exam.timeLabel}</span>
                      </div>
                    )}
                    {exam.classLabel && (
                      <div className='flex items-center gap-2'>
                        <span>{exam.classLabel}</span>
                      </div>
                    )}
                  </div>
                  <div className='flex flex-wrap gap-3 text-sm text-gray-600 mt-2'>
                    <span>Subject: {exam.subjectLabel}</span>
                    <span>Room: {exam.roomLabel}</span>
                  </div>
                  {exam.instructions && (
                    <p className='text-sm text-gray-500 mt-2'>
                      Instructions: {exam.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
