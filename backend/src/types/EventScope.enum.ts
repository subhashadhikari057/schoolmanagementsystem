export enum EventScope {
  PARTIAL = 'PARTIAL', // Normal event - doesn't affect attendance calculations
  SCHOOL_WIDE = 'SCHOOL_WIDE', // School-wide event - treated as holiday for attendance
}
