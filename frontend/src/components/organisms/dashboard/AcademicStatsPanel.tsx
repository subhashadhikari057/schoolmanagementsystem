import React from 'react';
import Label from "@/components/atoms/display/Label";
import Metric from "@/components/atoms/data/Metric";

interface AcademicStatsData {
  totalSubjects: number;
  totalFaculties: number;
  scheduledExams: number;
  sections: number;
}

interface AcademicStatsPanelProps {
  data: AcademicStatsData;
  title?: string;
}

export default function AcademicStatsPanel({ data, title = "Academic Stats" }: AcademicStatsPanelProps) {
  const academicStats = [
    {
      value: data.totalSubjects,
      label: "Total Subjects"
    },
    {
      value: data.totalFaculties,
      label: "Total Faculties"
    },
    {
      value: data.scheduledExams,
      label: "Scheduled Exams"
    },
    {
      value: data.sections,
      label: "Sections"
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {academicStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-2 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow min-w-0">
            <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
              <Label className="text-xs sm:text-sm text-gray-600 truncate">{stat.label}</Label>
              <Metric value={stat.value} className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
