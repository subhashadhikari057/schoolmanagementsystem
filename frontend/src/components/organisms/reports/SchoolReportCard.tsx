/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import {
  schoolInformationService,
  SchoolInformation,
} from '@/api/services/school-information.service';

type ReportCardData = {
  schoolInfo: SchoolInformation;
  filters: { year: number; startDate: string; endDate: string };
  students: any;
  teachers: any;
  exams: any;
  promotions: any;
  footer: any;
};

const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#a855f7',
  '#dc2626',
  '#0891b2',
  '#f59e0b',
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
];

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className='p-4 border border-gray-200 shadow-sm h-full'>
    <p className='text-sm font-semibold mb-3 text-gray-900'>{title}</p>
    <div className='h-64'>{children}</div>
  </Card>
);

const NoData = ({ message = 'No data available' }) => (
  <div className='flex items-center justify-center h-full text-gray-500 text-sm'>
    {message}
  </div>
);

export default function SchoolReportCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>(
    `${new Date().getFullYear()}-01-01`,
  );
  const [endDate, setEndDate] = useState<string>(
    `${new Date().getFullYear()}-12-31`,
  );
  const reportRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await schoolInformationService.getReportCardData({
        year,
        startDate,
        endDate,
      });
      setData((res as any).data || res);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    toast.loading('Preparing PDF...');
    // Apply print-friendly inline overrides to avoid unsupported color parsing (e.g., oklch)
    const cleanup = (() => {
      const style = document.createElement('style');
      style.setAttribute('data-report-export-style', 'true');
      style.innerHTML = `
        [data-report-export] *, [data-report-export] *::before, [data-report-export] *::after {
          color: #111 !important;
          border-color: #d1d5db !important;
          background-color: transparent !important;
        }
        [data-report-export] {
          background-color: #ffffff !important;
        }
        [data-report-export] .bg-white { background-color: #ffffff !important; }
        [data-report-export] .bg-gray-50 { background-color: #f9fafb !important; }
        [data-report-export] .bg-gray-100 { background-color: #f3f4f6 !important; }
        [data-report-export] .bg-gray-200 { background-color: #e5e7eb !important; }
      `;
      document.head.appendChild(style);
      reportRef.current?.setAttribute('data-report-export', 'true');
      return () => {
        style.remove();
        reportRef.current?.removeAttribute('data-report-export');
      };
    })();

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: clonedDoc => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root {
              --tw-bg-opacity: 1 !important;
              --tw-text-opacity: 1 !important;
              --tw-border-opacity: 1 !important;
              --tw-shadow-color: #000 !important;
              --tw-ring-color: #000 !important;
            }
            [data-report-export], [data-report-export] * {
              background-color: #ffffff !important;
              color: #111111 !important;
              border-color: #d1d5db !important;
            }
          `;
          clonedDoc.head.appendChild(style);
          clonedDoc
            .querySelector('[data-report-export]')
            ?.setAttribute('data-report-export', 'true');
        },
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`School_Report_Card_${year}.pdf`);
      toast.success('PDF exported');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    } finally {
      cleanup();
    }
  };

  const studentCharts = data?.students || {};
  const teacherCharts = data?.teachers || {};
  const examCharts = data?.exams || {};
  const promotionCharts = data?.promotions || {};

  const gradeAverages = useMemo(() => {
    if (!examCharts?.averageByGrade) return [];
    return examCharts.averageByGrade.map((g: any) => {
      const avg =
        g.subjects && g.subjects.length
          ? Number(
              (
                g.subjects.reduce(
                  (sum: number, s: any) => sum + (s.average || 0),
                  0,
                ) / g.subjects.length
              ).toFixed(2),
            )
          : 0;
      return { grade: g.grade, average: avg };
    });
  }, [examCharts?.averageByGrade]);

  return (
    <div className='space-y-4'>
      <Card className='p-4 border border-gray-200 shadow-sm'>
        <div className='flex flex-wrap gap-3 items-end'>
          <div className='flex flex-col'>
            <Label>Year</Label>
            <Input
              type='number'
              value={year}
              onChange={e => setYear(e.target.value)}
            />
          </div>
          <div className='flex flex-col'>
            <Label>Start Date</Label>
            <Input
              type='date'
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className='flex flex-col'>
            <Label>End Date</Label>
            <Input
              type='date'
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className='flex gap-2 ml-auto'>
            <Button variant='outline' onClick={loadData} disabled={loading}>
              {loading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <RefreshCw className='w-4 h-4' />
              )}
              Refresh
            </Button>
            <Button onClick={handleExportPdf} variant='default'>
              <Download className='w-4 h-4 mr-2' />
              Download PDF
            </Button>
          </div>
        </div>
        {error && <p className='text-sm text-red-600 mt-2'>{error}</p>}
      </Card>

      <div
        ref={reportRef}
        className='space-y-4 bg-white p-4 border border-gray-100 rounded-lg'
      >
        {/* Header */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-3'>
          <div className='flex items-center gap-3'>
            {data?.schoolInfo?.logo ? (
              <img
                src={data.schoolInfo.logo}
                alt='School logo'
                className='h-12 w-12 object-contain'
              />
            ) : (
              <div className='h-12 w-12 bg-gray-100 rounded' />
            )}
            <div>
              <p className='text-xs text-gray-500'>
                SCHOOL REPORT CARD – {year}
              </p>
              <p className='text-lg font-bold text-gray-900'>
                {data?.schoolInfo?.schoolName || 'School Name'}
              </p>
              <p className='text-sm text-gray-600'>
                {data?.schoolInfo?.municipality || 'N/A'},{' '}
                {data?.schoolInfo?.district || 'N/A'},{' '}
                {data?.schoolInfo?.province || 'N/A'}
              </p>
            </div>
          </div>
          <div className='text-sm text-gray-700'>
            <div>School Code: {data?.schoolInfo?.schoolCode || 'N/A'}</div>
            <div>Established: {data?.schoolInfo?.establishedYear || 'N/A'}</div>
            <div>
              Contact:{' '}
              {(data?.schoolInfo?.contactNumbers || []).join(', ') || 'N/A'}
            </div>
          </div>
        </div>

        {/* School details */}
        <Card className='p-4 border border-gray-200 shadow-sm'>
          <p className='text-sm font-semibold mb-3 text-gray-900'>
            School Details
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700'>
            <div>
              Head Teacher: {data?.schoolInfo?.headTeacherName || 'N/A'}
            </div>
            <div>School Type: {data?.schoolInfo?.schoolType || 'N/A'}</div>
            <div>
              Email:{' '}
              {data?.schoolInfo?.email ||
                (data?.schoolInfo?.emails || []).join(', ') ||
                'N/A'}
            </div>
            <div>
              Running Class: {data?.schoolInfo?.classRegisteredUpto || 'N/A'}
            </div>
            <div>Address: {data?.schoolInfo?.address || 'N/A'}</div>
            <div>
              Province/District/Municipality:{' '}
              {data?.schoolInfo?.province || 'N/A'} /{' '}
              {data?.schoolInfo?.district || 'N/A'} /{' '}
              {data?.schoolInfo?.municipality || 'N/A'}
            </div>
          </div>
        </Card>

        {/* Students */}
        <div className='space-y-3'>
          <div className='text-base font-semibold text-gray-900'>
            Section A — Students
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
            <ChartCard title='Enrollment by Grade (Girls vs Boys)'>
              {studentCharts.enrollmentByGrade?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.enrollmentByGrade}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='girls' stackId='a' fill='#f472b6' />
                    <Bar dataKey='boys' stackId='a' fill='#60a5fa' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Ethnicity Distribution'>
              {studentCharts.ethnicity?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={studentCharts.ethnicity}
                      dataKey='count'
                      nameKey='label'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label
                    >
                      {studentCharts.ethnicity.map((_: any, idx: number) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Mother Tongue Distribution'>
              {studentCharts.motherTongue?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.motherTongue.slice(0, 12)}>
                    <XAxis
                      dataKey='label'
                      interval={0}
                      angle={-30}
                      textAnchor='end'
                      height={80}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#8b5cf6' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Disability Types'>
              {studentCharts.disabilityTypes?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={studentCharts.disabilityTypes}
                      dataKey='count'
                      nameKey='label'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label
                    >
                      {studentCharts.disabilityTypes.map(
                        (_: any, idx: number) => (
                          <Cell
                            key={idx}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Students with Disability by Grade'>
              {studentCharts.disabilityByGrade?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.disabilityByGrade}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='girls' fill='#f472b6' />
                    <Bar dataKey='boys' fill='#60a5fa' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Scholarship by Type'>
              {studentCharts.scholarshipsByType?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.scholarshipsByType}>
                    <XAxis
                      dataKey='label'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#0ea5e9' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData message='No scholarship assignments available' />
              )}
            </ChartCard>

            <ChartCard title='Scholarship Recipients by Gender'>
              {studentCharts.scholarshipsByGender?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={studentCharts.scholarshipsByGender}
                      dataKey='count'
                      nameKey='label'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label
                    >
                      {studentCharts.scholarshipsByGender.map(
                        (_: any, idx: number) => (
                          <Cell
                            key={idx}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Class Size Distribution'>
              {studentCharts.classSize?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.classSize}>
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='total' fill='#16a34a' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Attendance Rate by Grade'>
              {studentCharts.attendanceByGrade?.length ? (
                <ResponsiveContainer>
                  <BarChart data={studentCharts.attendanceByGrade}>
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey='rate' fill='#f97316' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData message='Attendance data not available for range' />
              )}
            </ChartCard>
          </div>
        </div>

        {/* Teachers */}
        <div className='space-y-3'>
          <div className='text-base font-semibold text-gray-900'>
            Section B — Teachers
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
            <ChartCard title='Teacher Gender Distribution'>
              {teacherCharts.gender?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={teacherCharts.gender}
                      dataKey='count'
                      nameKey='label'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label
                    >
                      {teacherCharts.gender.map((_: any, idx: number) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Qualification Distribution'>
              {teacherCharts.qualification?.length ? (
                <ResponsiveContainer>
                  <BarChart data={teacherCharts.qualification}>
                    <XAxis
                      dataKey='label'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#2563eb' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Designation Distribution'>
              {teacherCharts.designation?.length ? (
                <ResponsiveContainer>
                  <BarChart data={teacherCharts.designation}>
                    <XAxis
                      dataKey='label'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#a855f7' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Teachers per Department'>
              {teacherCharts.department?.length ? (
                <ResponsiveContainer>
                  <BarChart data={teacherCharts.department}>
                    <XAxis
                      dataKey='label'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#f97316' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Teacher Count by Level'>
              {teacherCharts.level?.length ? (
                <ResponsiveContainer>
                  <BarChart data={teacherCharts.level}>
                    <XAxis dataKey='label' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#10b981' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Salary Distribution'>
              {teacherCharts.salary?.length ? (
                <ResponsiveContainer>
                  <BarChart data={teacherCharts.salary}>
                    <XAxis dataKey='label' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#dc2626' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>
          </div>
        </div>

        {/* Exams */}
        <div className='space-y-3'>
          <div className='text-base font-semibold text-gray-900'>
            Section C — Exams & Performance
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
            <ChartCard title='Average Marks by Subject'>
              {examCharts.averageBySubject?.length ? (
                <ResponsiveContainer>
                  <BarChart data={examCharts.averageBySubject}>
                    <XAxis
                      dataKey='subject'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey='average' fill='#2563eb' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData message='Exam results are not available for the selected year.' />
              )}
            </ChartCard>

            <ChartCard title='Average Marks by Grade'>
              {gradeAverages.length ? (
                <ResponsiveContainer>
                  <BarChart data={gradeAverages}>
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey='average' fill='#16a34a' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Average by Gender (per Subject)'>
              {examCharts.averageBySubject?.length ? (
                <ResponsiveContainer>
                  <BarChart data={examCharts.averageBySubject}>
                    <XAxis
                      dataKey='subject'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='maleAverage' name='Male' fill='#60a5fa' />
                    <Bar dataKey='femaleAverage' name='Female' fill='#f472b6' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Pass / Fail by Subject'>
              {examCharts.passFailBySubject?.length ? (
                <ResponsiveContainer>
                  <BarChart data={examCharts.passFailBySubject}>
                    <XAxis
                      dataKey='subject'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='pass' stackId='a' fill='#16a34a' />
                    <Bar dataKey='fail' stackId='a' fill='#dc2626' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Top Subjects by Average Score'>
              {examCharts.averageBySubject?.length ? (
                <ResponsiveContainer>
                  <BarChart
                    data={[...examCharts.averageBySubject]
                      .sort((a: any, b: any) => b.average - a.average)
                      .slice(0, 5)}
                  >
                    <XAxis
                      dataKey='subject'
                      interval={0}
                      angle={-25}
                      textAnchor='end'
                      height={70}
                      fontSize={10}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey='average' fill='#f59e0b' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Score Distribution'>
              {examCharts.scoreDistribution?.length ? (
                <ResponsiveContainer>
                  <BarChart data={examCharts.scoreDistribution}>
                    <XAxis dataKey='bucket' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='count' fill='#a855f7' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>
          </div>
        </div>

        {/* Promotions */}
        <div className='space-y-3'>
          <div className='text-base font-semibold text-gray-900'>
            Section D — Promotion / Retention
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
            <ChartCard title='Promotion Outcomes (Overall)'>
              {promotionCharts?.overall ? (
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      {
                        name: 'Overall',
                        promoted: promotionCharts.overall.promoted || 0,
                        retained: promotionCharts.overall.retained || 0,
                        graduated: promotionCharts.overall.graduated || 0,
                      },
                    ]}
                  >
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='promoted' stackId='a' fill='#16a34a' />
                    <Bar dataKey='retained' stackId='a' fill='#f59e0b' />
                    <Bar dataKey='graduated' stackId='a' fill='#2563eb' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Promotion Outcomes by Gender'>
              {promotionCharts.byGender?.length ? (
                <ResponsiveContainer>
                  <BarChart data={promotionCharts.byGender}>
                    <XAxis dataKey='gender' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='promoted' stackId='a' fill='#16a34a' />
                    <Bar dataKey='retained' stackId='a' fill='#f59e0b' />
                    <Bar dataKey='graduated' stackId='a' fill='#2563eb' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>

            <ChartCard title='Promotion Outcomes by Grade'>
              {promotionCharts.byGrade?.length ? (
                <ResponsiveContainer>
                  <BarChart data={promotionCharts.byGrade}>
                    <XAxis dataKey='grade' fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='promoted' stackId='a' fill='#16a34a' />
                    <Bar dataKey='retained' stackId='a' fill='#f59e0b' />
                    <Bar dataKey='graduated' stackId='a' fill='#2563eb' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </ChartCard>
          </div>
        </div>

        {/* Footer summary */}
        <Card className='p-4 border border-gray-200 shadow-sm'>
          <p className='text-sm font-semibold mb-2 text-gray-900'>Summary</p>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700'>
            <div>
              <p className='text-gray-500'>Total Students</p>
              <p className='font-semibold'>
                {data?.footer?.totalStudents ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-gray-500'>Total Teachers</p>
              <p className='font-semibold'>
                {data?.footer?.totalTeachers ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-gray-500'>Student–Teacher Ratio</p>
              <p className='font-semibold'>
                {data?.footer?.studentTeacherRatio ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-gray-500'>Exam Coverage</p>
              <p className='font-semibold'>
                {data?.footer?.examCoverage ?? 0} results
              </p>
            </div>
            <div>
              <p className='text-gray-500'>Attendance Coverage</p>
              <p className='font-semibold'>
                {data?.footer?.attendanceCoverage ?? 0} students
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
