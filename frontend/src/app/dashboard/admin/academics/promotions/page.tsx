'use client';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PromotionOverviewTab from '@/components/organisms/tabs/PromotionOverviewTab';
import StudentSelectionTab from '@/components/organisms/tabs/StudentSelectionTab';
import PromotionProgressTab from '@/components/organisms/tabs/PromotionProgressTab';
import {
  studentService,
  type StudentListResponse,
  type StudentStatsResponse,
} from '@/api/services/student.service';
import { classService, type ClassResponse } from '@/api/services/class.service';
import {
  promotionService,
  type PromotionPreviewResponse,
  type PromotionStudentInfo,
} from '@/api/services/promotion.service';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  AlertTriangle,
  Download,
  History,
  GraduationCap,
  BookOpen,
  RefreshCw,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface ClassSummary {
  class: string;
  totalStudents: number;
  eligibleStudents: number;
  selectedForStay: number;
}

interface PromotionState {
  status: 'idle' | 'loading' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export function StudentPromotionPage() {
  // Core state
  const [selectedStudentsToStay, setSelectedStudentsToStay] = useState<
    string[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Promotion state
  const [promotionState, setPromotionState] = useState<PromotionState>({
    status: 'idle',
    progress: 0,
  });

  // Preview and confirmation
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [promotionPreview, setPromotionPreview] =
    useState<PromotionPreviewResponse | null>(null);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [newAcademicYear, setNewAcademicYear] = useState('2025-26');

  // Backend data
  const [students, setStudents] = useState<StudentListResponse[]>([]);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStatsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load students, classes, and stats in parallel
        const [studentsRes, classesRes, statsRes] = await Promise.all([
          loadAllStudents(),
          classService.getAllClasses(),
          studentService.getStudentStats(),
        ]);

        if (classesRes.success) {
          setClasses(classesRes.data);
        } else {
          throw new Error(classesRes.message || 'Failed to load classes');
        }

        if (statsRes.success) {
          setStudentStats(statsRes.data);
        } else {
          throw new Error(statsRes.message || 'Failed to load student stats');
        }

        setStudents(studentsRes);

        // Show info if no students found
        if (studentsRes.length === 0) {
          toast.info(
            'No students found in the database. Please add students first.',
          );
        }

        // Load promotion preview
        await loadPromotionPreview();
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
        toast.error('Failed to load promotions data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [academicYear]);

  // Helper function to load all students with pagination
  const loadAllStudents = async (): Promise<StudentListResponse[]> => {
    const limit = 100;
    let page = 1;
    let allStudents: StudentListResponse[] = [];

    console.log('Loading students from backend...');

    while (true) {
      console.log(`Fetching page ${page} with limit ${limit}...`);
      const res = await studentService.getAllStudents({ limit, page });
      if (!res.success) {
        throw new Error(res.message || 'Failed to load students');
      }

      const payload = res.data;
      console.log(
        `Loaded ${payload.data?.length || 0} students from page ${page}`,
      );
      allStudents = allStudents.concat(payload.data || []);

      if (page >= (payload.totalPages || 1)) break;
      page += 1;
    }

    console.log(`Total students loaded from backend: ${allStudents.length}`);
    return allStudents;
  };

  // Load promotion preview data
  const loadPromotionPreview = async () => {
    try {
      setPromotionState(prev => ({ ...prev, status: 'loading' }));

      // For now, use mock data until backend API is ready
      const preview =
        await promotionService.mockPreviewPromotions(academicYear);
      setPromotionPreview(preview);

      setPromotionState(prev => ({ ...prev, status: 'idle' }));
    } catch (error: any) {
      console.error('Failed to load promotion preview:', error);
      setPromotionState(prev => ({
        ...prev,
        status: 'error',
        message: error.message || 'Failed to load promotion preview',
      }));
    }
  };

  // Get class summary for display
  const getClassSummary = (): ClassSummary[] => {
    if (promotionPreview) {
      return promotionPreview.summaryByGrade.map(summary => ({
        class: summary.fromGrade.toString(),
        totalStudents: summary.totalStudents,
        eligibleStudents: summary.eligibleStudents,
        selectedForStay: summary.stayingStudents,
      }));
    }

    // Fallback to existing logic if no preview data
    const byGrade = new Map<string, StudentListResponse[]>();
    students.forEach(s => {
      const clsName = s.className || '';
      const match = clsName.match(/(\d{1,2})/);
      const grade = match ? match[1] : 'Unknown';
      const arr = byGrade.get(grade) || [];
      arr.push(s);
      byGrade.set(grade, arr);
    });

    const grades = Array.from(byGrade.keys()).sort(
      (a, b) => Number(a) - Number(b),
    );
    return grades.map(grade => {
      const classStudents = byGrade.get(grade) || [];
      const eligibleStudents = classStudents.filter(
        s => s.academicStatus?.toLowerCase?.() === 'active',
      );
      const selectedForStay = classStudents.filter(s =>
        selectedStudentsToStay.includes(s.id),
      );

      return {
        class: grade,
        totalStudents: classStudents.length,
        eligibleStudents: eligibleStudents.length,
        selectedForStay: selectedForStay.length,
      };
    });
  };

  // Get unique class options for filter
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [students]);

  // Toggle student selection for staying
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentsToStay(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId],
    );
  };

  // Select all ineligible students to stay
  const handleSelectAllIneligible = () => {
    const ineligibleStudents = students
      .filter(s => s.academicStatus?.toLowerCase?.() !== 'active')
      .map(s => s.id);

    const alreadySelected = ineligibleStudents.every(id =>
      selectedStudentsToStay.includes(id),
    );

    if (alreadySelected) {
      setSelectedStudentsToStay(prev =>
        prev.filter(id => !ineligibleStudents.includes(id)),
      );
    } else {
      setSelectedStudentsToStay(prev => [
        ...new Set([...prev, ...ineligibleStudents]),
      ]);
    }
  };

  // Calculate promotion statistics
  const getTotalPromotions = () => {
    if (promotionPreview) {
      return (
        promotionPreview.totalStats.totalPromoting -
        selectedStudentsToStay.length
      );
    }

    return students.filter(
      s =>
        s.academicStatus?.toLowerCase?.() === 'active' &&
        !selectedStudentsToStay.includes(s.id),
    ).length;
  };

  const getTotalStaying = () => {
    if (promotionPreview) {
      return (
        promotionPreview.totalStats.totalStaying + selectedStudentsToStay.length
      );
    }

    const stayingEligible = students.filter(
      s =>
        s.academicStatus?.toLowerCase?.() === 'active' &&
        selectedStudentsToStay.includes(s.id),
    ).length;

    const stayingIneligible = students.filter(
      s => s.academicStatus?.toLowerCase?.() !== 'active',
    ).length;

    return stayingEligible + stayingIneligible;
  };

  const getTotalGraduating = () => {
    if (promotionPreview) {
      const grade12Summary = promotionPreview.summaryByGrade.find(
        s => s.fromGrade === 12,
      );
      return grade12Summary ? grade12Summary.promotingStudents : 0;
    }

    return students.filter(s => {
      const match = s.className?.match(/12/);
      return (
        match &&
        s.academicStatus?.toLowerCase?.() === 'active' &&
        !selectedStudentsToStay.includes(s.id)
      );
    }).length;
  };

  // Handle promotion preview
  const handlePreviewPromotion = async () => {
    setShowConfirmDialog(true);
    await loadPromotionPreview();
  };

  // Execute promotions
  const handleStartPromotion = async () => {
    setShowConfirmDialog(false);
    setPromotionState({ status: 'running', progress: 0 });

    try {
      // Simulate promotion process with progress updates
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPromotionState(prev => ({
          ...prev,
          progress: (i / steps) * 100,
          message:
            i === steps
              ? 'Promotion completed successfully!'
              : `Processing step ${i + 1} of ${steps + 1}...`,
        }));
      }

      setPromotionState({
        status: 'completed',
        progress: 100,
        message: `Successfully promoted ${getTotalPromotions()} students!`,
      });

      toast.success('Student promotion completed successfully!');

      // Refresh data after promotion
      await loadPromotionPreview();
    } catch (error: any) {
      setPromotionState({
        status: 'error',
        progress: 0,
        message: error.message || 'Promotion failed',
      });
      toast.error('Failed to complete student promotion');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      console.log('Refreshing data from backend...');

      // Reload all data
      const [studentsRes, classesRes, statsRes] = await Promise.all([
        loadAllStudents(),
        classService.getAllClasses(),
        studentService.getStudentStats(),
      ]);

      if (classesRes.success) {
        setClasses(classesRes.data);
      }

      if (statsRes.success) {
        setStudentStats(statsRes.data);
      }

      setStudents(studentsRes);

      await loadPromotionPreview();

      toast.success(
        `Data refreshed successfully! Loaded ${studentsRes.length} students from backend.`,
      );
    } catch (error: any) {
      toast.error('Failed to refresh data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header Section */}
        <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='flex items-center space-x-4'>
              <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl'>
                <GraduationCap className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Student Promotion
                </h1>
                <p className='text-gray-600 mt-1'>
                  Academic Year {academicYear} → {newAcademicYear}
                </p>
                <div className='flex items-center gap-2 mt-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <p className='text-sm text-green-600 font-medium'>
                    Live data from backend ({students.length} students loaded)
                  </p>
                </div>
              </div>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outline'
                className='gap-2 hover:bg-gray-50'
                onClick={handleRefresh}
                disabled={promotionState.status === 'loading'}
              >
                <RefreshCw
                  className={`w-4 h-4 ${promotionState.status === 'loading' ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button variant='outline' className='gap-2 hover:bg-gray-50'>
                <History className='w-4 h-4' />
                History
              </Button>
              <Button variant='outline' className='gap-2 hover:bg-gray-50'>
                <Download className='w-4 h-4' />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12'>
            <div className='flex flex-col items-center justify-center space-y-4'>
              <LoadingSpinner />
              <p className='text-gray-600'>Loading students from database...</p>
              <p className='text-sm text-gray-500'>
                Fetching student records, classes, and academic data from
                backend
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className='bg-red-50 border-red-200 rounded-xl'>
            <AlertTriangle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-700'>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className='space-y-8'>
            {/* Overview Section */}
            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <BookOpen className='w-6 h-6 text-blue-600' />
                <h2 className='text-2xl font-bold text-gray-900'>
                  Promotion Overview
                </h2>
              </div>
              <PromotionOverviewTab
                classSummary={getClassSummary()}
                totalStudents={
                  promotionPreview?.totalStats.totalStudents ?? students.length
                }
                totalPromotions={getTotalPromotions()}
                totalStaying={getTotalStaying()}
                totalGraduating={getTotalGraduating()}
              />
            </div>

            {/* Student Selection Section */}
            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <Users className='w-6 h-6 text-blue-600' />
                <h2 className='text-2xl font-bold text-gray-900'>
                  Student Selection
                </h2>
              </div>
              <StudentSelectionTab
                students={students}
                selectedStudentsToStay={selectedStudentsToStay}
                searchTerm={searchTerm}
                selectedClass={selectedClass}
                classOptions={classOptions}
                onSearchChange={setSearchTerm}
                onClassChange={setSelectedClass}
                onToggleStudent={handleToggleStudent}
                onSelectAllIneligible={handleSelectAllIneligible}
              />
            </div>

            {/* Progress Section */}
            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <CheckCircle2 className='w-6 h-6 text-blue-600' />
                <h2 className='text-2xl font-bold text-gray-900'>
                  Promotion Progress
                </h2>
              </div>
              <PromotionProgressTab
                promotionState={promotionState}
                totalPromotions={getTotalPromotions()}
                totalStaying={getTotalStaying()}
                totalGraduating={getTotalGraduating()}
                onPreviewPromotion={handlePreviewPromotion}
                onStartPromotion={handleStartPromotion}
              />
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-amber-600' />
                Confirm Student Promotion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to promote students for academic year{' '}
                {academicYear}? This action will update {getTotalPromotions()}{' '}
                student records.
              </DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-2 gap-4 py-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {getTotalPromotions()}
                </div>
                <div className='text-sm text-gray-500'>Will be promoted</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {getTotalStaying()}
                </div>
                <div className='text-sm text-gray-500'>Will stay</div>
              </div>
            </div>

            <DialogFooter className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartPromotion}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              >
                Confirm Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default StudentPromotionPage;
