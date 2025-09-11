import { useEffect, useState } from 'react';
import { studentService } from '@/api/services/student.service';
import { teacherService } from '@/api/services/teacher.service';

interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  loading: boolean;
  error: string | null;
  debug?: string;
}

export const useDashboardStats = (): DashboardStats => {
  const [stats, setStats] = useState<DashboardStats>({
    studentCount: 0,
    teacherCount: 0,
    loading: true,
    error: null,
    debug: undefined,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch student count
        const studentCountResponse = await studentService.getStudentCount();

        // For teacher count, use a higher limit to get all teachers if pagination is not working correctly
        const teacherResponse = await teacherService.getAllTeachers({
          limit: 1000, // Use a high number to ensure we get all teachers
          page: 1,
        });

        // Extract the student count
        const studentCount = studentCountResponse.success
          ? studentCountResponse.data.count
          : 0;

        // Debug teacher response
        let debugInfo = JSON.stringify(teacherResponse, null, 2).substring(
          0,
          500,
        );

        // Extract teacher count using a more robust approach
        let teacherCount = 0;
        let extractionMethod = 'unknown';

        if (teacherResponse.success) {
          // Check if it's a paginated response
          if (
            typeof teacherResponse.data === 'object' &&
            teacherResponse.data !== null &&
            'total' in teacherResponse.data
          ) {
            teacherCount = teacherResponse.data.total;
            extractionMethod = 'pagination.total';
          }
          // Check if it's a paginated response with data array
          else if (
            typeof teacherResponse.data === 'object' &&
            teacherResponse.data !== null &&
            'data' in teacherResponse.data &&
            Array.isArray(teacherResponse.data.data)
          ) {
            teacherCount = teacherResponse.data.data.length;
            extractionMethod = 'pagination.data.length';
          }
          // Check if it's a direct array
          else if (Array.isArray(teacherResponse.data)) {
            teacherCount = teacherResponse.data.length;
            extractionMethod = 'array.length';
          }
        }

        debugInfo += `\nExtraction method: ${extractionMethod}, Count: ${teacherCount}`;
        console.log('Teacher stats debug:', debugInfo);

        setStats({
          studentCount,
          teacherCount,
          loading: false,
          error: null,
          debug: debugInfo,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard statistics',
        }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
