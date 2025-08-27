/**
 * =============================================================================
 * Working Days Service
 * =============================================================================
 * Frontend service for working days calculation and breakdown
 * =============================================================================
 */

export interface WorkingDaysBreakdown {
  id?: string;
  month: number;
  year: number;
  totalDays: number;
  saturdays: number;
  holidays: number;
  events: number;
  exams: number;
  availableDays: number;
  isCurrentMonth?: boolean;
  lastCalculated?: string;
  calculated?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class WorkingDaysService {
  private baseUrl = '/api/v1/attendance';

  /**
   * Get current month working days with live calculation
   */
  async getCurrentWorkingDays(): Promise<WorkingDaysBreakdown> {
    try {
      const response = await fetch(`${this.baseUrl}/working-days/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching current working days:', error);
      throw error;
    }
  }

  /**
   * Get working days breakdown for a specific month
   */
  async getWorkingDaysForMonth(
    month: number,
    year: number,
  ): Promise<WorkingDaysBreakdown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/working-days/${month}/${year}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching working days for ${month}/${year}:`, error);
      throw error;
    }
  }

  /**
   * Format month name for display
   */
  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  }

  /**
   * Calculate percentage of working days
   */
  calculateWorkingDaysPercentage(breakdown: WorkingDaysBreakdown): number {
    if (breakdown.totalDays === 0) return 0;
    return Math.round((breakdown.availableDays / breakdown.totalDays) * 100);
  }
}

export const workingDaysService = new WorkingDaysService();
export default workingDaysService;
