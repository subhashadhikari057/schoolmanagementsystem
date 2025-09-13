'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
} from '@/api/services/student.service';
import {
  promotionService,
  type PromotionPreviewResponse,
  type IndividualPromotionRequest,
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
  targetClassName?: string;
}

interface PromotionState {
  status: 'idle' | 'loading' | 'running' | 'completed' | 'error' | 'empty';
  progress: number;
  message?: string;
  batchId?: string;
  processedStudents?: number;
  totalStudents?: number;
  promotedStudents?: number;
  retainedStudents?: number;
  graduatedStudents?: number;
  failedStudents?: number;
  errors?: string[];
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
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [promotionResults, setPromotionResults] = useState<any>(null);
  const [missingClasses, setMissingClasses] = useState<string[]>([]);
  const [showMissingClassesModal, setShowMissingClassesModal] = useState(false);
  const [promotionPreview, setPromotionPreview] =
    useState<PromotionPreviewResponse | null>(null);
  const [academicYear] = useState('2024-25');
  const [newAcademicYear] = useState('2025-26');
  // Remove unused state variables
  const loadingRef = useRef(false);
  const selectedStudentsRef = useRef<string[]>([]);

  // Backend data
  const [students, setStudents] = useState<StudentListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load promotion preview data
  const loadPromotionPreview = useCallback(async () => {
    // Prevent multiple simultaneous calls using ref (more reliable than state)
    if (loadingRef.current) {
      console.log('Already loading promotion preview, skipping...');
      return;
    }

    try {
      loadingRef.current = true;
      setPromotionState(prev => ({ ...prev, status: 'loading' }));

      // Note: We don't clear selections here as it might cause infinite re-renders
      // Selection clearing is handled in the data loading functions instead

      const response = await promotionService.previewPromotions({
        academicYear,
        excludedStudentIds: selectedStudentsRef.current,
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
    } catch (error) {
      console.error('Failed to load promotion preview:', error);

      // Handle specific error codes for empty database
      let errorMessage = 'Failed to load promotion preview';

      // Check various error structure possibilities
      const errorResponse = error as {
        response?: { data?: unknown };
        data?: unknown;
      };
      const errorData =
        errorResponse.response?.data || errorResponse.data || error;

      const errorObj = errorData as { code?: string; message?: string };

      if (errorObj?.code === 'NO_CLASSES_FOUND') {
        errorMessage =
          'No classes found. Please add classes to the system before running promotions.';
      } else if (errorObj?.code === 'NO_STUDENTS_FOUND') {
        errorMessage =
          'No active students found. Please add students to classes before running promotions.';
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      setPromotionState(prev => ({
        ...prev,
        status: 'error',
        message: errorMessage,
      }));
      setError(errorMessage);
    } finally {
      loadingRef.current = false;
    }
  }, [academicYear]);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load students
        const studentsRes = await loadAllStudents();

        setStudents(studentsRes);

        // Clear any stale selected students when loading fresh data
        if (studentsRes.length === 0) {
          setSelectedStudentsToStay([]);
          selectedStudentsRef.current = [];
          toast.info(
            'No students found in the database. Please add students first.',
          );
        }

        // Load promotion preview automatically - backend will return empty state instead of errors
        try {
          await loadPromotionPreview();
        } catch (promotionError) {
          console.log(
            'Promotion preview failed (should not happen with new backend):',
            promotionError,
          );
          // If there's still an error, it's a real error, not empty state
        }
      } catch (e) {
        const error = e as Error;
        setError(error?.message || 'Failed to load data');
        toast.error('Failed to load promotions data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [academicYear, loadPromotionPreview]);

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

  // Get class summary for display
  const getClassSummary = (): ClassSummary[] => {
    if (promotionPreview) {
      // Use real promotion preview data showing actual classes and sections
      return promotionPreview.summaryByGrade.map(summary => {
        // Count students from this class who are manually selected to stay
        const manuallySelectedToStay =
          promotionPreview.promotionStudents.filter(
            student =>
              student.currentGrade === summary.fromGrade &&
              student.section === summary.section &&
              selectedStudentsToStay.includes(student.id),
          ).length;

        // Total staying = naturally staying + manually selected to stay
        const totalStaying = summary.stayingStudents + manuallySelectedToStay;

        return {
          class:
            summary.className ||
            `Grade ${summary.fromGrade} ${summary.section}`,
          totalStudents: summary.totalStudents,
          eligibleStudents: summary.eligibleStudents,
          selectedForStay: totalStaying,
          targetClassName: summary.targetClassName, // Pass targetClassName from backend
        };
      });
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
        class: `Grade ${grade}`,
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
    setSelectedStudentsToStay(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];

      // Update ref for preview function
      selectedStudentsRef.current = newSelection;

      return newSelection;
    });

    // Don't refresh preview immediately - let user make multiple selections
    // Preview will refresh when they navigate to other tabs or start promotion
  };

  // Select all visible students to stay (for current page/filter)
  const handleSelectAllIneligible = () => {
    // Get currently visible students based on search and class filter
    const visibleStudents = students
      .filter(student => {
        const matchesSearch =
          searchTerm === '' ||
          (student.fullName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (student.rollNumber || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (student.studentId || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesClass =
          selectedClass === 'all' ||
          (student.className || '') === selectedClass;
        return matchesSearch && matchesClass;
      })
      .map(s => s.id);

    const alreadySelected = visibleStudents.every(id =>
      selectedStudentsToStay.includes(id),
    );

    if (alreadySelected) {
      // Deselect all visible students
      setSelectedStudentsToStay(prev => {
        const newSelection = prev.filter(id => !visibleStudents.includes(id));
        console.log(`Deselected ${visibleStudents.length} visible students`);
        toast.success(`Deselected ${visibleStudents.length} students`);

        // Update ref for preview function
        selectedStudentsRef.current = newSelection;

        return newSelection;
      });
    } else {
      // Select all visible students
      setSelectedStudentsToStay(prev => {
        const newSelection = [...new Set([...prev, ...visibleStudents])];
        console.log(`Selected ${visibleStudents.length} visible students`);
        toast.success(`Selected ${visibleStudents.length} students to stay`);

        // Update ref for preview function
        selectedStudentsRef.current = newSelection;

        return newSelection;
      });
    }
  };

  // Handle individual student promotion
  const handleIndividualPromote = async (studentId: string) => {
    try {
      const request: IndividualPromotionRequest = {
        studentId,
        academicYear,
        toAcademicYear: newAcademicYear,
        reason: 'Individual promotion from admin panel',
      };

      const response = await promotionService.promoteIndividualStudent(request);

      if (response.success) {
        toast.success(response.data.message);
        // Refresh students data to reflect the promotion
        window.location.reload();
      } else {
        toast.error('Failed to promote student. Please try again.');
      }
    } catch (error) {
      console.error('Individual promotion error:', error);

      // Log full error details to console for developers
      const errorResponse = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: { message?: string };
        };
      };
      const errorData = errorResponse?.response?.data;
      const originalError =
        errorData?.message || (error as Error)?.message || '';

      console.error('Individual promotion error details:', {
        status: errorResponse?.response?.status,
        statusText: errorResponse?.response?.statusText,
        data: errorData,
        originalError,
      });

      // Show user-friendly messages
      let userFriendlyMessage = 'Failed to promote student. Please try again.';

      if (
        originalError.includes('Target class') &&
        originalError.includes('does not exist')
      ) {
        const classMatch = originalError.match(/Grade (\d+) ([A-Z])/);
        const targetClass = classMatch
          ? `Grade ${classMatch[1]} ${classMatch[2]}`
          : 'target class';
        userFriendlyMessage = `Please create ${targetClass} first before promoting students to it.`;
      } else if (originalError.includes('already in progress')) {
        userFriendlyMessage =
          'A promotion batch is already running. Please wait for it to complete.';
      } else if (errorResponse?.response?.status === 409) {
        userFriendlyMessage =
          'A promotion process is already running. Please wait and try again.';
      } else if (
        originalError &&
        !originalError.includes('statusCode') &&
        !originalError.includes('Bad Request')
      ) {
        // Show meaningful backend messages that aren't technical errors
        userFriendlyMessage = originalError;
      }

      toast.error(userFriendlyMessage);
    }
  };

  // Calculate promotion statistics
  const getTotalPromotions = () => {
    if (promotionPreview) {
      // The backend already excludes selectedStudentsToStay from the preview
      // So we just count students who will be promoted
      const eligibleForPromotion = promotionPreview.promotionStudents.filter(
        student => student.isEligible && student.promotionType === 'PROMOTED',
      ).length;
      return Math.max(0, eligibleForPromotion);
    }

    return Math.max(
      0,
      students.filter(
        s =>
          s.academicStatus?.toLowerCase?.() === 'active' &&
          !selectedStudentsToStay.includes(s.id),
      ).length,
    );
  };

  const getTotalStaying = () => {
    if (promotionPreview) {
      // The backend preview already accounts for excluded students
      // Count students who will stay (ineligible + retained)
      const stayingStudents = promotionPreview.promotionStudents.filter(
        student => !student.isEligible || student.promotionType === 'RETAINED',
      ).length;

      // Add the count of manually selected students (these are excluded from preview)
      const manuallySelectedCount = selectedStudentsToStay.length;

      return Math.max(0, stayingStudents + manuallySelectedCount);
    }

    const stayingEligible = students.filter(
      s =>
        s.academicStatus?.toLowerCase?.() === 'active' &&
        selectedStudentsToStay.includes(s.id),
    ).length;

    const stayingIneligible = students.filter(
      s => s.academicStatus?.toLowerCase?.() !== 'active',
    ).length;

    return Math.max(0, stayingEligible + stayingIneligible);
  };

  const getTotalGraduating = () => {
    if (promotionPreview) {
      // Count students who will graduate
      const graduatingStudents = promotionPreview.promotionStudents.filter(
        student => student.promotionType === 'GRADUATED',
      ).length;
      return Math.max(0, graduatingStudents);
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
    setPromotionState(prev => ({
      ...prev,
      status: 'idle',
      message: undefined,
    }));
    setError(null);
  };

  // Force refresh promotion preview
  const forceRefreshPreview = async () => {
    resetPreviewState();
    await loadPromotionPreview();
  };

  // Clean up stuck promotion batches
  const handleCleanupStuckBatches = async () => {
    try {
      const response = await promotionService.cleanupStuckBatches();

      if (response.success && response.data) {
        toast.success(response.data.message);

        // If batches were cleaned, refresh the preview
        if (response.data.cleanedBatches.length > 0) {
          await forceRefreshPreview();
        }
      } else {
        toast.error('Failed to cleanup stuck batches. Please try again.');
      }
    } catch (error) {
      console.error('Failed to cleanup stuck batches:', error);
      toast.error('Failed to cleanup stuck batches. Please try again.');
    }
  };

  // Check for missing target classes
  const checkMissingClasses = async (): Promise<string[]> => {
    if (!promotionPreview?.summaryByGrade) return [];

    // Only check for classes where students will actually be promoted
    // (exclude students selected to stay)
    const missing: string[] = [];

    for (const summary of promotionPreview.summaryByGrade) {
      // Calculate how many students from this class will actually be promoted
      const studentsFromThisClass = students.filter(
        s =>
          s.className === summary.className ||
          s.className === `Grade ${summary.fromGrade} ${summary.section}`,
      );

      const selectedFromThisClass = studentsFromThisClass.filter(s =>
        selectedStudentsToStay.includes(s.id),
      ).length;

      const studentsToPromote = summary.totalStudents - selectedFromThisClass;

      // Only check for missing target class if students will actually be promoted
      if (studentsToPromote > 0 && summary.targetClassName) {
        // This is where you'd check if the target class actually exists
        // For now, we'll return empty array since the backend should handle this validation
        // The backend's findOrCreateTargetClass will throw an error if class doesn't exist
      }
    }

    // Return empty array - let the backend handle class validation
    // This prevents false positives for existing classes
    return missing;
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
    // First check for missing classes
    const missing = await checkMissingClasses();
    if (missing.length > 0) {
      setMissingClasses(missing);
      setShowMissingClassesModal(true);
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);
    setPromotionState({ status: 'running', progress: 0 });

    try {
      // Execute the actual promotion
      const response = await promotionService.executePromotions({
        academicYear,
        toAcademicYear: newAcademicYear,
        excludedStudentIds: selectedStudentsRef.current,
        reason: 'Annual student promotion',
      });

      if (response.success && response.data) {
        const batchId = response.data.batchId;

        setPromotionState({
          status: 'running',
          progress: 0,
          message: response.data.message || 'Starting promotion process...',
          batchId,
        });

        toast.success('Promotion started! Processing in background...');

        // Start polling for progress
        pollPromotionProgress(batchId);
      } else {
        throw new Error(response.message || 'Failed to execute promotions');
      }
    } catch (error) {
      console.error('Failed to execute promotions:', error);

      // Handle specific error codes and messages
      const errorResponse = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: { message?: string; code?: string };
        };
      };
      const errorData = errorResponse?.response?.data;
      const originalError =
        errorData?.message || (error as Error).message || 'Promotion failed';

      // Log full error details to console for developers
      console.error('Promotion execution error:', {
        status: errorResponse?.response?.status,
        statusText: errorResponse?.response?.statusText,
        data: errorData,
        originalError,
      });

      let userFriendlyMessage = 'Promotion failed. Please try again.';

      if (errorData?.code === 'NO_CLASSES_FOUND') {
        userFriendlyMessage =
          'No classes found. Please add classes to the system before running promotions.';
      } else if (errorData?.code === 'NO_STUDENTS_FOUND') {
        userFriendlyMessage =
          'No active students found. Please add students to classes before running promotions.';
      } else if (
        originalError.includes('Target class') &&
        originalError.includes('does not exist')
      ) {
        const classMatch = originalError.match(/Grade (\d+) ([A-Z])/);
        const targetClass = classMatch
          ? `Grade ${classMatch[1]} ${classMatch[2]}`
          : 'target class';
        userFriendlyMessage = `Please create ${targetClass} first before running promotions.`;
      } else if (originalError.includes('already in progress')) {
        userFriendlyMessage =
          'A promotion batch is already running. Please wait for it to complete or try again later.';
      } else if (errorResponse?.response?.status === 409) {
        // Don't show technical 409 errors to users
        userFriendlyMessage =
          'A promotion process is already running. Please wait and try again.';
      }

      setPromotionState({
        status: 'error',
        progress: 0,
        message: userFriendlyMessage,
      });
      toast.error(userFriendlyMessage);
    }
  };

  // Handle promotion revert
  const handleRevertPromotion = async (batchId: string) => {
    if (
      !confirm(
        'Are you sure you want to revert this promotion? This will undo all completed promotions in this batch and cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const response = await promotionService.revertPromotionBatch(batchId);

      if (response.success) {
        toast.success(response.data.message);

        // Reset promotion state
        setPromotionState({
          status: 'idle',
          progress: 0,
          message: 'Promotion reverted successfully',
        });

        // Refresh data
        await loadPromotionPreview();
      } else {
        toast.error('Failed to revert promotion. Please try again.');
      }
    } catch (error) {
      console.error('Revert promotion error:', error);
      toast.error(
        (error as any)?.response?.data?.message ||
          'Failed to revert promotion. Please try again.',
      );
    }
  };

  // Poll promotion progress
  const pollPromotionProgress = async (batchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const progressResponse =
          await promotionService.getPromotionProgress(batchId);

        if (progressResponse.success && progressResponse.data) {
          const progress = progressResponse.data;

          setPromotionState({
            status:
              progress.status === 'COMPLETED'
                ? 'completed'
                : progress.status === 'FAILED'
                  ? 'error'
                  : 'running',
            progress: progress.progress,
            message:
              progress.status === 'COMPLETED'
                ? `Successfully processed ${progress.processedStudents} students!`
                : progress.status === 'FAILED'
                  ? 'Promotion failed. Check errors below.'
                  : `Processing... ${progress.processedStudents}/${progress.totalStudents} students`,
            batchId: progress.batchId,
            processedStudents: progress.processedStudents,
            totalStudents: progress.totalStudents,
            promotedStudents: progress.promotedStudents,
            retainedStudents: progress.retainedStudents,
            graduatedStudents: progress.graduatedStudents,
            failedStudents: progress.failedStudents,
            errors: progress.errors,
          });

          // Stop polling when completed or failed
          if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
            clearInterval(pollInterval);

            // Show results dialog
            console.log('📊 Promotion Results:', progress);
            setPromotionResults(progress);
            setShowResultsDialog(true);

            if (progress.status === 'COMPLETED') {
              toast.success(
                `Promotion completed! ${progress.promotedStudents} promoted, ${progress.graduatedStudents} graduated.`,
              );
              // Refresh data after promotion
              await loadPromotionPreview();
            } else {
              toast.error(
                'Promotion failed. Please check the errors and try again.',
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to get promotion progress:', error);
        clearInterval(pollInterval);
        setPromotionState(prev => ({
          ...prev,
          status: 'error',
          message: 'Failed to track promotion progress',
        }));
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 10 minutes to prevent infinite polling
    setTimeout(
      () => {
        clearInterval(pollInterval);
      },
      10 * 60 * 1000,
    );
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    resetPreviewState(); // Reset preview state on refresh
    try {
      console.log('Refreshing data from backend...');

      // Reload students
      const studentsRes = await loadAllStudents();

      setStudents(studentsRes);

      // Clear any stale selected students when refreshing data
      if (studentsRes.length === 0) {
        setSelectedStudentsToStay([]);
        selectedStudentsRef.current = [];
      }

      // Load promotion preview automatically after refresh
      try {
        await loadPromotionPreview();
      } catch (promotionError) {
        console.log(
          'Promotion preview failed during refresh (should not happen with new backend):',
          promotionError,
        );
      }

      toast.success(
        `Data refreshed successfully! Loaded ${studentsRes.length} students from backend.`,
      );
    } catch (error) {
      toast.error('Failed to refresh data: ' + (error as Error).message);
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

            {/* <div className='flex flex-wrap gap-3'>
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
            </div> */}
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
                onIndividualPromote={handleIndividualPromote}
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
                onRevertPromotion={handleRevertPromotion}
                onRefreshPreview={forceRefreshPreview}
                onCleanupStuckBatches={handleCleanupStuckBatches}
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
                Start Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Results Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {promotionResults?.status === 'COMPLETED' ? (
                  <CheckCircle2 className='w-5 h-5 text-green-600' />
                ) : (
                  <AlertTriangle className='w-5 h-5 text-red-600' />
                )}
                Promotion Results
              </DialogTitle>
              <DialogDescription>
                {promotionResults?.status === 'COMPLETED'
                  ? 'Student promotion has been completed successfully.'
                  : 'Student promotion encountered some issues.'}
              </DialogDescription>
            </DialogHeader>

            {promotionResults && (
              <div className='space-y-4'>
                {/* Summary Stats */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center p-3 bg-green-50 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600'>
                      {promotionResults.promotedStudents || 0}
                    </div>
                    <div className='text-sm text-green-700'>Promoted</div>
                  </div>
                  <div className='text-center p-3 bg-purple-50 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {promotionResults.graduatedStudents || 0}
                    </div>
                    <div className='text-sm text-purple-700'>Graduated</div>
                  </div>
                  <div className='text-center p-3 bg-orange-50 rounded-lg'>
                    <div className='text-2xl font-bold text-orange-600'>
                      {promotionResults.retainedStudents || 0}
                    </div>
                    <div className='text-sm text-orange-700'>Retained</div>
                  </div>
                  <div className='text-center p-3 bg-red-50 rounded-lg'>
                    <div className='text-2xl font-bold text-red-600'>
                      {promotionResults.failedStudents || 0}
                    </div>
                    <div className='text-sm text-red-700'>Failed</div>
                  </div>
                </div>

                {/* Errors */}
                {promotionResults.errors &&
                  promotionResults.errors.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='font-medium text-red-600'>Errors:</h4>
                      <div className='max-h-32 overflow-y-auto space-y-1'>
                        {promotionResults.errors.map(
                          (error: string, index: number) => (
                            <div
                              key={index}
                              className='text-sm text-red-600 bg-red-50 p-2 rounded'
                            >
                              {error}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <DialogFooter className='flex gap-2'>
              {promotionResults?.batchId && (
                <Button
                  variant='outline'
                  onClick={() => {
                    handleRevertPromotion(promotionResults.batchId);
                    setShowResultsDialog(false);
                  }}
                  className='text-red-600 border-red-200 hover:bg-red-50'
                >
                  Revert Promotion
                </Button>
              )}
              <Button
                onClick={() => setShowResultsDialog(false)}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Missing Classes Modal */}
      <Dialog
        open={showMissingClassesModal}
        onOpenChange={setShowMissingClassesModal}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600'>
              <AlertTriangle className='h-5 w-5' />
              Missing Target Classes
            </DialogTitle>
            <DialogDescription>
              The following target classes need to be created before running
              promotions:
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
              <h4 className='font-medium text-amber-800 mb-2'>
                Classes to Create:
              </h4>
              <ul className='space-y-1'>
                {missingClasses.map((className, index) => (
                  <li
                    key={index}
                    className='flex items-center gap-2 text-amber-700'
                  >
                    <div className='w-2 h-2 bg-amber-400 rounded-full'></div>
                    <span className='font-medium'>{className}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='text-sm text-gray-600'>
              Please create these classes in the Classes section before
              proceeding with promotions.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowMissingClassesModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowMissingClassesModal(false);
                // Navigate to classes page - you'd implement this navigation
                toast.info('Please create the missing classes and try again.');
              }}
              className='bg-amber-600 hover:bg-amber-700'
            >
              Go to Classes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentPromotionPage;
