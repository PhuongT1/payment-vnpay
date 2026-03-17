/**
 * Test utilities and mock data for MoMo payment integration
 */

/**
 * Generate test order data
 */
export function generateTestOrder(overrides?: Partial<TestOrder>) {
  const timestamp = Date.now();
  return {
    orderId: `TEST_${timestamp}`,
    amount: 100000, // 100,000 VND
    orderInfo: "Test MoMo Payment",
    userEmail: "test@example.com",
    currency: "VND",
    ...overrides,
  };
}

export interface TestOrder {
  orderId: string;
  amount: number;
  orderInfo: string;
  userEmail: string;
  currency: string;
}

/**
 * Test scenarios for different payment states
 */
export const TEST_SCENARIOS = {
  // Successful payment scenarios
  SUCCESS: {
    name: "Successful Payment",
    amount: 100000,
    orderInfo: "Test successful payment",
    expectedResultCode: 0,
    description: "Complete payment with test credentials",
  },
  
  LARGE_AMOUNT: {
    name: "Large Amount Payment",
    amount: 50000000, // 50 million VND
    orderInfo: "Test large amount",
    expectedResultCode: 0,
    description: "Test with large transaction amount",
  },

  SMALL_AMOUNT: {
    name: "Small Amount Payment",
    amount: 10000, // 10,000 VND
    orderInfo: "Test small amount",
    expectedResultCode: 0,
    description: "Test with minimum amount",
  },

  // Edge cases
  SPECIAL_CHARACTERS: {
    name: "Special Characters in Order Info",
    amount: 100000,
    orderInfo: "Test đặc biệt & #special @characters",
    expectedResultCode: 0,
    description: "Test with Vietnamese and special characters",
  },

  // Failure scenarios (for testing error handling)
  INVALID_AMOUNT: {
    name: "Invalid Amount",
    amount: -100000, // Negative amount
    orderInfo: "Test invalid amount",
    expectedResultCode: 12, // Invalid amount error
    description: "Test error handling for invalid amount",
  },
};

/**
 * Mock MoMo API responses for testing
 */
export const MOCK_RESPONSES = {
  PAYMENT_CREATED: {
    partnerCode: "MOMOBKUN20240101",
    requestId: "MOMOBKUN20240101_1710497234567",
    orderId: "TEST_1710497234567",
    amount: 100000,
    responseTime: 1710497234567,
    message: "Successful.",
    resultCode: 0,
    payUrl: "https://test-payment.momo.vn/gateway?partnerCode=MOMOBKUN20240101&...",
    deeplink: "momo://app?action=payment&...",
    qrCodeUrl: "https://test-payment.momo.vn/qrcode/...",
  },

  PAYMENT_SUCCESS: {
    partnerCode: "MOMOBKUN20240101",
    orderId: "TEST_1710497234567",
    requestId: "MOMOBKUN20240101_1710497234567",
    amount: 100000,
    resultCode: 0,
    message: "Successful.",
    responseTime: 1710497234567,
    transId: 12345678,
    payType: "qr",
  },

  PAYMENT_FAILED: {
    partnerCode: "MOMOBKUN20240101",
    orderId: "TEST_1710497234567",
    requestId: "MOMOBKUN20240101_1710497234567",
    amount: 100000,
    resultCode: 1003,
    message: "Transaction declined",
    responseTime: 1710497234567,
  },

  REFUND_SUCCESS: {
    partnerCode: "MOMOBKUN20240101",
    orderId: "REFUND_1710497234567",
    requestId: "MOMOBKUN20240101_1710497234567",
    amount: 100000,
    resultCode: 0,
    message: "Refund successful",
    responseTime: 1710497234567,
    transId: 12345679,
  },
};

/**
 * Mock IPN payloads for testing webhook handling
 */
export const MOCK_IPN_PAYLOADS = {
  SUCCESS: {
    partnerCode: "MOMOBKUN20240101",
    orderId: "TEST_1710497234567",
    requestId: "MOMOBKUN20240101_1710497234567",
    amount: 100000,
    orderInfo: "Test MoMo Payment",
    orderType: "momo_wallet",
    transId: 12345678,
    resultCode: 0,
    message: "Successful.",
    payType: "qr",
    responseTime: 1710497234567,
    extraData: JSON.stringify({
      merchantReference: "Q2hlY2tvdXQ6ZTBhNWViNGEtNjk2My00YTgyLWFiMzktMzM1ZGFkMzUyOGIy",
      userEmail: "test@example.com",
    }),
    signature: "mock_signature_here",
  },

  FAILED: {
    partnerCode: "MOMOBKUN20240101",
    orderId: "TEST_1710497234567",
    requestId: "MOMOBKUN20240101_1710497234567",
    amount: 100000,
    orderInfo: "Test MoMo Payment",
    orderType: "momo_wallet",
    transId: 0,
    resultCode: 1003,
    message: "Transaction declined",
    payType: "qr",
    responseTime: 1710497234567,
    extraData: "",
    signature: "mock_signature_here",
  },
};

/**
 * Generate mock Saleor transaction data
 */
export function generateMockSaleorTransaction(status: "PENDING" | "SUCCESS" | "FAILED" = "PENDING") {
  return {
    id: "VHJhbnNhY3Rpb246MQ==",
    pspReference: "MOMOBKUN20240101_1710497234567",
    authorizedAmount: status === "SUCCESS" ? { amount: 100, currency: "USD" } : null,
    chargedAmount: status === "SUCCESS" ? { amount: 100, currency: "USD" } : null,
    events: status === "SUCCESS" ? [
      {
        id: "VHJhbnNhY3Rpb25FdmVudDox",
        pspReference: "12345678",
        type: "CHARGE_SUCCESS",
        createdAt: new Date().toISOString(),
      },
    ] : [],
  };
}

/**
 * Test credentials
 */
export const TEST_CREDENTIALS = {
  PARTNER_CODE: "MOMOBKUN20240101",
  ACCESS_KEY: "klm05TvNBzhg7h7j",
  SECRET_KEY: "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa",
  ENDPOINT: "https://test-payment.momo.vn",
};

/**
 * Test phone numbers for MoMo sandbox
 */
export const TEST_PHONE_NUMBERS = {
  SUCCESS: "0399888999", // Always succeeds
  OTP: "123456", // Test OTP code
};

/**
 * Helper to validate test data
 */
export function validateTestOrder(order: TestOrder): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!order.orderId) {
    errors.push("Order ID is required");
  }

  if (!order.amount || order.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (!order.orderInfo) {
    errors.push("Order info is required");
  }

  if (order.amount < 10000) {
    errors.push("Amount must be at least 10,000 VND");
  }

  if (order.amount > 100000000) {
    errors.push("Amount must not exceed 100,000,000 VND");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format amount for display
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Parse MoMo result code to human-readable message
 */
export function parseResultCode(code: number): { status: string; message: string; severity: "success" | "error" | "warning" } {
  const codes: Record<number, { status: string; message: string; severity: "success" | "error" | "warning" }> = {
    0: { status: "Success", message: "Payment completed successfully", severity: "success" },
    9000: { status: "Confirmed", message: "Transaction confirmed", severity: "success" },
    10: { status: "Invalid Signature", message: "Invalid request signature", severity: "error" },
    11: { status: "Invalid Access Key", message: "Invalid access key", severity: "error" },
    12: { status: "Invalid Amount", message: "Invalid transaction amount", severity: "error" },
    1000: { status: "Initiated", message: "Transaction initiated", severity: "warning" },
    1001: { status: "Processing", message: "Transaction processing", severity: "warning" },
    1002: { status: "Pending", message: "Transaction pending", severity: "warning" },
    1003: { status: "Declined", message: "Transaction declined", severity: "error" },
    1004: { status: "Cancelled", message: "Transaction cancelled", severity: "error" },
  };

  return codes[code] || { status: "Unknown", message: `Unknown code: ${code}`, severity: "error" };
}

/**
 * Generate test report
 */
export function generateTestReport(results: TestResult[]) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const successRate = (passed / total) * 100;

  return {
    total,
    passed,
    failed,
    successRate: successRate.toFixed(2) + "%",
    results,
    summary: `${passed}/${total} tests passed (${successRate.toFixed(1)}%)`,
  };
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

/**
 * Delay helper for testing async flows
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
