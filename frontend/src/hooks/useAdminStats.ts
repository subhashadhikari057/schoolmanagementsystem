import { useState, useEffect } from 'react';
import { studentService } from '@/api/services/student.service';
import { teacherService } from '@/api/services/teacher.service';
import { subjectService } from '@/api/services/subject.service';
import { staffService } from '@/api/services/staff.service';

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalStaff: number;
  loading: boolean;
  error: string | null;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalStaff: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Fetch all stats in parallel
        const [
          studentCountResponse,
          teacherResponse,
          subjectResponse,
          staffCountResponse,
        ] = await Promise.all([
          studentService.getStudentCount(),
          teacherService.getAllTeachers({ page: 1, limit: 1 }),
          subjectService.getAllSubjects(),
          staffService.getStaffCount(),
        ]);

        // Process student count
        const totalStudents = studentCountResponse.success
          ? studentCountResponse.data.count
          : 0;

        // Process teacher count
        let totalTeachers = 0;
        if (teacherResponse.success && teacherResponse.data) {
          const payload = teacherResponse.data as any;
          if (typeof payload?.total === 'number') {
            totalTeachers = payload.total;
          } else if (Array.isArray(payload)) {
            const allTeachersResponse = await teacherService.getAllTeachers();
            if (allTeachersResponse.success && allTeachersResponse.data) {
              const allPayload = allTeachersResponse.data as any;
              if (Array.isArray(allPayload)) {
                totalTeachers = allPayload.length;
              } else if (typeof allPayload?.total === 'number') {
                totalTeachers = allPayload.total;
              }
            }
          }
        }

        // Process subject count
        const totalSubjects =
          subjectResponse.success && subjectResponse.data
            ? Array.isArray(subjectResponse.data)
              ? subjectResponse.data.length
              : 0
            : 0;

        // Process staff count
        const totalStaff = staffCountResponse.success
          ? staffCountResponse.data.count
          : 0;

        setStats({
          totalStudents,
          totalTeachers,
          totalSubjects,
          totalStaff,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Failed to fetch stats',
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
