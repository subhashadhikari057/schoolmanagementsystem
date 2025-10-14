export type FeeStructureForSingleClassResponse = {
    classId: string;
    grade: number;
    section: string;
    shift: string;
    feeStructure: {
      id: string;
      name: string;
      academicYear: string;
      effectiveFrom: Date;
      status: string;
      version: number;
      historyEffectiveFrom: Date;
      totalAnnual: number;
      totalMonthly: number;
    };
    items: Array<{
      id: string;
      label: string;
      amount: number;
      category: string;
      frequency: 'MONTHLY' | 'ANNUAL' | 'TERM' | 'ONE_TIME';
      isOptional: boolean;
      monthlyAmount: number;
    }>;
  };