/**
 * TypeScript type definitions for MoMo Payment Integration
 */

/**
 * Saleor Transaction Event Types
 */
export type TransactionEventType =
  | "AUTHORIZATION_SUCCESS"
  | "AUTHORIZATION_FAILURE"
  | "AUTHORIZATION_ADJUSTMENT"
  | "AUTHORIZATION_REQUEST"
  | "AUTHORIZATION_ACTION_REQUIRED"
  | "CHARGE_SUCCESS"
  | "CHARGE_FAILURE"
  | "CHARGE_REQUEST"
  | "CHARGE_ACTION_REQUIRED"
  | "REFUND_SUCCESS"
  | "REFUND_FAILURE"
  | "REFUND_REQUEST"
  | "CANCEL_SUCCESS"
  | "CANCEL_FAILURE"
  | "CANCEL_REQUEST"
  | "INFO";

/**
 * Saleor Transaction Action Types
 */
export type TransactionActionEnum =
  | "CHARGE"
  | "REFUND"
  | "VOID"
  | "CANCEL";

/**
 * Transaction Result Types
 */
export type TransactionResult =
  | "AUTHORIZATION_SUCCESS"
  | "AUTHORIZATION_FAILURE"
  | "AUTHORIZATION_ACTION_REQUIRED"
  | "CHARGE_SUCCESS"
  | "CHARGE_FAILURE"
  | "CHARGE_ACTION_REQUIRED"
  | "REFUND_SUCCESS"
  | "REFUND_FAILURE"
  | "REFUND_ACTION_REQUIRED"
  | "CANCEL_SUCCESS"
  | "CANCEL_FAILURE";

/**
 * MoMo specific types
 */
export interface MoMoMetadata {
  merchantReference: string;
  idempotencyKey?: string;
  currency: string;
  userEmail?: string;
  momoOrderId?: string;
  momoRequestId?: string;
  momoTransId?: number;
}

/**
 * Transaction webhook payload structures
 */
export interface TransactionAction {
  actionType: TransactionActionEnum;
  amount: number;
  currency: string;
}

export interface TransactionEvent {
  id: string;
  pspReference: string;
  type: TransactionEventType;
  createdAt: string;
  message?: string;
  externalUrl?: string;
}

export interface Transaction {
  id: string;
  pspReference?: string;
  authorizedAmount?: {
    amount: number;
    currency: string;
  };
  chargedAmount?: {
    amount: number;
    currency: string;
  };
  events?: TransactionEvent[];
  actions?: string[];
}

export interface Checkout {
  id: string;
  totalPrice: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  user?: {
    email: string;
  };
}

export interface Order {
  id: string;
  number: string;
  total: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  userEmail?: string;
}

/**
 * Webhook response structure
 */
export interface TransactionWebhookResponse {
  pspReference: string;
  result: TransactionResult;
  amount: number;
  time?: string;
  externalUrl?: string;
  message?: string;
  data?: Record<string, any>;
}

/**
 * MoMo result codes
 */
export enum MoMoResultCode {
  SUCCESS = 0,
  CONFIRMED = 9000,
  INVALID_SIGNATURE = 10,
  INVALID_ACCESS_KEY = 11,
  INVALID_AMOUNT = 12,
  INVALID_CURRENCY = 13,
  INVALID_ORDER_INFO = 20,
  INVALID_PHONE = 21,
  INVALID_REQUEST_ID = 40,
  DUPLICATE_REQUEST_ID = 41,
  TRANSACTION_NOT_FOUND = 42,
  PAYMENT_EXPIRED = 43,
  TRANSACTION_INITIATED = 1000,
  TRANSACTION_PROCESSING = 1001,
  TRANSACTION_PENDING = 1002,
  TRANSACTION_DECLINED = 1003,
  TRANSACTION_CANCELLED = 1004,
  REFUND_PROCESSING = 1005,
  REFUND_COMPLETED = 1006,
}

/**
 * Helper function to check if MoMo payment was successful
 */
export function isMoMoPaymentSuccessful(resultCode: number): boolean {
  return resultCode === MoMoResultCode.SUCCESS || resultCode === MoMoResultCode.CONFIRMED;
}

/**
 * Helper function to check if MoMo refund was successful
 */
export function isMoMoRefundSuccessful(resultCode: number): boolean {
  return (
    resultCode === MoMoResultCode.SUCCESS ||
    resultCode === MoMoResultCode.REFUND_COMPLETED ||
    resultCode === 1000 // Some refunds return 1000
  );
}

/**
 * Get human-readable message for MoMo result code
 */
export function getMoMoResultMessage(resultCode: number): string {
  const messages: Record<number, string> = {
    [MoMoResultCode.SUCCESS]: "Payment successful",
    [MoMoResultCode.CONFIRMED]: "Payment confirmed",
    [MoMoResultCode.INVALID_SIGNATURE]: "Invalid signature",
    [MoMoResultCode.INVALID_ACCESS_KEY]: "Invalid access key",
    [MoMoResultCode.INVALID_AMOUNT]: "Invalid amount",
    [MoMoResultCode.INVALID_CURRENCY]: "Invalid currency",
    [MoMoResultCode.INVALID_ORDER_INFO]: "Invalid order information",
    [MoMoResultCode.INVALID_PHONE]: "Invalid phone number",
    [MoMoResultCode.INVALID_REQUEST_ID]: "Invalid request ID",
    [MoMoResultCode.DUPLICATE_REQUEST_ID]: "Duplicate request ID",
    [MoMoResultCode.TRANSACTION_NOT_FOUND]: "Transaction not found",
    [MoMoResultCode.PAYMENT_EXPIRED]: "Payment expired",
    [MoMoResultCode.TRANSACTION_INITIATED]: "Transaction initiated",
    [MoMoResultCode.TRANSACTION_PROCESSING]: "Transaction processing",
    [MoMoResultCode.TRANSACTION_PENDING]: "Transaction pending",
    [MoMoResultCode.TRANSACTION_DECLINED]: "Transaction declined",
    [MoMoResultCode.TRANSACTION_CANCELLED]: "Transaction cancelled",
    [MoMoResultCode.REFUND_PROCESSING]: "Refund processing",
    [MoMoResultCode.REFUND_COMPLETED]: "Refund completed",
  };

  return messages[resultCode] || `Unknown result code: ${resultCode}`;
}
