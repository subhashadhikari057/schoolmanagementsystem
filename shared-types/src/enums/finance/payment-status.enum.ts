/**
 * =============================================================================
 * Payment Status Enum
 * =============================================================================
 * Defines payment status in the Finance Module.
 * Corresponds to PostgreSQL ENUM: finance.payment_status_enum
 * =============================================================================
 */

/**
 * Payment status in the finance system
 * @enum {string}
 */
export enum PaymentStatus {
  /** Payment is pending processing */
  PENDING = "pending",

  /** Payment has been completed successfully */
  COMPLETED = "completed",

  /** Payment processing failed */
  FAILED = "failed",

  /** Payment has been refunded */
  REFUNDED = "refunded",
}

/**
 * Array of all payment statuses
 */
export const PAYMENT_STATUSES = Object.values(PaymentStatus);

/**
 * Type representing any valid payment status
 */
export type PaymentStatusType = `${PaymentStatus}`;

/**
 * Payment status transitions
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  [PaymentStatus.PENDING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED],
  [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // Allow retry
  [PaymentStatus.REFUNDED]: [], // Terminal state
};

/**
 * Check if a payment status transition is valid
 * @param fromStatus - Current payment status
 * @param toStatus - Target payment status
 * @returns True if transition is allowed
 */
export function isValidPaymentStatusTransition(
  fromStatus: PaymentStatus,
  toStatus: PaymentStatus,
): boolean {
  return PAYMENT_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}
