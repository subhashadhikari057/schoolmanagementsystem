'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
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
  status: 'idle' | 'loading' | 'running' | 'completed' | 'error' | 'empty';
  progress: number;
  message?: string;
}

function StudentPromotionPage() {
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
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [hasTriedPreview, setHasTriedPreview] = useState(false);
  const loadingRef = useRef(false);

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

        // Load promotion preview automatically - backend will return empty state instead of errors
        try {
          await loadPromotionPreview();
        } catch (promotionError: any) {
          console.log(
            'Promotion preview failed (should not happen with new backend):',
            promotionError,
          );
          // If there's still an error, it's a real error, not empty state
        }
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
    // Prevent multiple simultaneous calls using ref (more reliable than state)
    if (
      loadingRef.current ||
      (hasTriedPreview && promotionState.status === 'error')
    ) {
      console.log(
        'Already loading promotion preview or already tried, skipping...',
      );
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoadingPreview(true);
      setHasTriedPreview(true);
      setPromotionState(prev => ({ ...prev, status: 'loading' }));

      const response = await promotionService.previewPromotions({
        academicYear,
        excludedStudentIds: selectedStudentsToStay,
      });

      if (response.success && response.data) {
        setPromotionPreview(response.data);

        // Check if we have empty state and show friendly message
        if (response.data.metadata?.message) {
          setPromotionState(prev => ({
            ...prev,
            status: 'empty',
            message: response.data.metadata?.message,
          }));
        } else {
          setPromotionState(prev => ({ ...prev, status: 'idle' }));
        }
      } else {
        // Handle non-success response
        let errorMessage =
          response.message || 'Failed to load promotion preview';

        setPromotionState(prev => ({
          ...prev,
          status: 'error',
          message: errorMessage,
        }));
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Failed to load promotion preview:', error);

      // Handle specific error codes for empty database
      let errorMessage = 'Failed to load promotion preview';

      // Check various error structure possibilities
      const errorData = error.response?.data || error.data || error;

      if (errorData?.code === 'NO_CLASSES_FOUND') {
        errorMessage =
          'No classes found. Please add classes to the system before running promotions.';
      } else if (errorData?.code === 'NO_STUDENTS_FOUND') {
        errorMessage =
          'No active students found. Please add students to classes before running promotions.';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPromotionState(prev => ({
        ...prev,
        status: 'error',
        message: errorMessage,
      }));
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
      setIsLoadingPreview(false);
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

  // Reset preview state to allow retrying
  const resetPreviewState = () => {
    loadingRef.current = false;
    setHasTriedPreview(false);
    setIsLoadingPreview(false);
    setPromotionState(prev => ({
      ...prev,
      status: 'idle',
      message: undefined,
    }));
    setError(null);
  };

  // Handle promotion preview
  const handlePreviewPromotion = async () => {
    // Reset state to allow fresh preview
    resetPreviewState();
    setShowConfirmDialog(true);
    await loadPromotionPreview();
  };

  // Execute promotions
  const handleStartPromotion = async () => {
    setShowConfirmDialog(false);
    setPromotionState({ status: 'running', progress: 0 });

    try {
      // Execute the actual promotion
      const response = await promotionService.executePromotions({
        academicYear,
        toAcademicYear: newAcademicYear,
        excludedStudentIds: selectedStudentsToStay,
        reason: 'Annual student promotion',
      });

      if (response.success && response.data) {
        setPromotionState({
          status: 'completed',
          progress: 100,
          message:
            response.data.message ||
            `Successfully promoted ${response.data.promoted} students!`,
        });

        toast.success('Student promotion completed successfully!');

        // Refresh data after promotion
        await loadPromotionPreview();
      } else {
        throw new Error(response.message || 'Failed to execute promotions');
      }
    } catch (error: any) {
      console.error('Failed to execute promotions:', error);

      // Handle specific error codes for empty database
      let errorMessage = error.message || 'Promotion failed';
      if (error.response?.data?.code === 'NO_CLASSES_FOUND') {
        errorMessage =
          'No classes found. Please add classes to the system before running promotions.';
      } else if (error.response?.data?.code === 'NO_STUDENTS_FOUND') {
        errorMessage =
          'No active students found. Please add students to classes before running promotions.';
      }

      setPromotionState({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    resetPreviewState(); // Reset preview state on refresh
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

      // Load promotion preview automatically after refresh
      try {
        await loadPromotionPreview();
      } catch (promotionError: any) {
        console.log(
          'Promotion preview failed during refresh (should not happen with new backend):',
          promotionError,
        );
      }

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
        {(promotionState.status === 'empty' || error) && (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-8'>
            {promotionState.status === 'empty' ||
            (error && error.includes('No classes found')) ||
            (error && error.includes('No active students found')) ? (
              <div className='text-center max-w-md mx-auto'>
                <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-8 h-8 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {promotionState.status === 'empty'
                    ? promotionState.message?.includes('No classes found')
                      ? 'No Classes Found'
                      : 'No Students Found'
                    : error && error.includes('No classes found')
                      ? 'No Classes Found'
                      : 'No Students Found'}
                </h3>
                <p className='text-gray-600 mb-6'>
                  {promotionState.status === 'empty'
                    ? promotionState.message
                    : error && error.includes('No classes found')
                      ? 'You need to add classes to the system before you can run student promotions.'
                      : 'You need to add students to classes before you can run student promotions.'}
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={() => {
                      const isNoClasses =
                        promotionState.status === 'empty'
                          ? promotionState.message?.includes('No classes found')
                          : error && error.includes('No classes found');
                      window.location.href = isNoClasses
                        ? '/dashboard/admin/academics/classes'
                        : '/dashboard/admin/academics/students';
                    }}
                    className='w-full bg-blue-600 hover:bg-blue-700'
                  >
                    {promotionState.status === 'empty'
                      ? promotionState.message?.includes('No classes found')
                        ? 'Add Classes'
                        : 'Add Students'
                      : error && error.includes('No classes found')
                        ? 'Add Classes'
                        : 'Add Students'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleRefresh}
                    className='w-full'
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <Alert className='bg-red-50 border-red-200'>
                <AlertTriangle className='h-4 w-4 text-red-600' />
                <AlertDescription className='text-red-700'>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && promotionState.status !== 'empty' && (
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
