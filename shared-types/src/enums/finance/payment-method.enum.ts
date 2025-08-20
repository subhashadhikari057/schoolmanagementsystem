/**
 * =============================================================================
 * Payment Method Enum
 * =============================================================================
 * Defines payment methods supported in the Finance Module.
 * Corresponds to PostgreSQL ENUM: finance.payment_method_enum
 * =============================================================================
 */

/**
 * Payment methods supported by the system
 * @enum {string}
 */
export enum PaymentMethod {
  /** Cash payment */
  CASH = "cash",

  /** Credit card payment */
  CREDIT_CARD = "credit_card",

  /** Debit card payment */
  DEBIT_CARD = "debit_card",

  /** Bank transfer */
  BANK_TRANSFER = "bank_transfer",

  /** eSewa digital wallet (Nepal) */
  ESEWA = "esewa",

  /** Khalti digital wallet (Nepal) */
  KHALTI = "khalti",

  /** FonePay digital wallet (Nepal) */
  FONEPAY = "fonepay",

  /** Cheque payment */
  CHEQUE = "cheque",
}

/**
 * Array of all payment methods
 */
export const PAYMENT_METHODS = Object.values(PaymentMethod);

/**
 * Type representing any valid payment method
 */
export type PaymentMethodType = `${PaymentMethod}`;

/**
 * Digital payment methods (require online processing)
 */
export const DIGITAL_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.DEBIT_CARD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.ESEWA,
  PaymentMethod.KHALTI,
  PaymentMethod.FONEPAY,
];

/**
 * Offline payment methods (processed manually)
 */
export const OFFLINE_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.CHEQUE,
];

/**
 * Check if a payment method is digital
 * @param method - Payment method to check
 * @returns True if method is digital
 */
export function isDigitalPaymentMethod(method: PaymentMethod): boolean {
  return DIGITAL_PAYMENT_METHODS.includes(method);
}

/**
 * Check if a payment method is offline
 * @param method - Payment method to check
 * @returns True if method is offline
 */
export function isOfflinePaymentMethod(method: PaymentMethod): boolean {
  return OFFLINE_PAYMENT_METHODS.includes(method);
}

/**
 * Get display name for payment method
 * @param method - Payment method
 * @returns Human-readable display name
 */
export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  const displayNames: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "Cash",
    [PaymentMethod.CREDIT_CARD]: "Credit Card",
    [PaymentMethod.DEBIT_CARD]: "Debit Card",
    [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
    [PaymentMethod.ESEWA]: "eSewa",
    [PaymentMethod.KHALTI]: "Khalti",
    [PaymentMethod.FONEPAY]: "FonePay",
    [PaymentMethod.CHEQUE]: "Cheque",
  };

  return displayNames[method];
}
