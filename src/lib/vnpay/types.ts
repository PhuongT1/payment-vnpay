/**
 * VNPay Payment Gateway - TypeScript Types
 * Documentation: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * VNPay Create Payment Request Parameters
 */
export interface VNPayCreatePaymentRequest {
  vnp_Version: string; // API version, currently: 2.1.0
  vnp_Command: "pay"; // Command type, always "pay" for payment
  vnp_TmnCode: string; // Merchant code from VNPay
  vnp_Amount: number; // Amount in VND * 100 (e.g., 10000 VND = 1000000)
  vnp_BankCode?: string; // Bank code (optional, user selects if not provided)
  vnp_CreateDate: string; // Create date (yyyyMMddHHmmss)
  vnp_CurrCode: "VND"; // Currency code, only VND supported
  vnp_IpAddr: string; // Customer IP address
  vnp_Locale: "vn" | "en"; // Language: vn = Vietnamese, en = English
  vnp_OrderInfo: string; // Order description (no Vietnamese diacritics)
  vnp_OrderType: string; // Order category code
  vnp_ReturnUrl: string; // Return URL after payment
  vnp_TxnRef: string; // Unique transaction reference (order ID)
  vnp_ExpireDate?: string; // Payment expiration date (yyyyMMddHHmmss)
  vnp_SecureHash?: string; // Checksum (generated before sending)
}

/**
 * VNPay Query Transaction Request
 */
export interface VNPayQueryRequest {
  vnp_Version: string;
  vnp_Command: "querydr"; // Query transaction command
  vnp_TmnCode: string;
  vnp_TxnRef: string; // Transaction reference to query
  vnp_OrderInfo: string;
  vnp_TransactionDate: string; // Transaction date (yyyyMMddHHmmss)
  vnp_CreateDate: string;
  vnp_IpAddr: string;
  vnp_SecureHash?: string;
}

/**
 * VNPay Refund Request
 */
export interface VNPayRefundRequest {
  vnp_Version: string;
  vnp_Command: "refund";
  vnp_TmnCode: string;
  vnp_TransactionType: "02" | "03"; // 02 = Full refund, 03 = Partial refund
  vnp_TxnRef: string; // Original transaction reference
  vnp_Amount: number; // Refund amount * 100
  vnp_OrderInfo: string;
  vnp_TransactionNo?: string; // VNPay transaction number
  vnp_TransactionDate: string; // Original transaction date
  vnp_CreateBy: string; // User who initiated refund
  vnp_CreateDate: string;
  vnp_IpAddr: string;
  vnp_SecureHash?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * VNPay Create Payment Response (from redirect)
 */
export interface VNPayCreatePaymentResponse {
  success: boolean;
  paymentUrl: string; // URL to redirect customer for payment
  transactionRef: string; // Transaction reference
}

/**
 * VNPay IPN/Return URL Response Parameters
 */
export interface VNPayIPNResponse {
  vnp_TmnCode: string;
  vnp_Amount: number; // Amount * 100
  vnp_BankCode: string;
  vnp_BankTranNo?: string; // Bank transaction number
  vnp_CardType?: string; // ATM, QRCODE, etc.
  vnp_PayDate?: string; // Payment date (yyyyMMddHHmmss)
  vnp_OrderInfo: string;
  vnp_TransactionNo: string; // VNPay transaction ID
  vnp_ResponseCode: string; // Response code (00 = success)
  vnp_TransactionStatus: string; // Transaction status (00 = success)
  vnp_TxnRef: string; // Original transaction reference
  vnp_SecureHashType?: string;
  vnp_SecureHash: string;
}

/**
 * VNPay Query Transaction Response
 */
export interface VNPayQueryResponse {
  vnp_ResponseCode: string; // 00 = success
  vnp_Message: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_Amount: number;
  vnp_OrderInfo: string;
  vnp_BankCode?: string;
  vnp_PayDate?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionType?: string;
  vnp_TransactionStatus: string; // 00 = success, 01 = incomplete, 02 = error
  vnp_SecureHash: string;
}

/**
 * VNPay Refund Response
 */
export interface VNPayRefundResponse {
  vnp_ResponseCode: string; // 00 = success
  vnp_Message: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_Amount: number;
  vnp_OrderInfo: string;
  vnp_TransactionNo?: string;
  vnp_BankCode?: string;
  vnp_PayDate?: string;
  vnp_TransactionType: string;
  vnp_SecureHash: string;
}

/**
 * VNPay IPN Merchant Response (to VNPay)
 */
export interface VNPayIPNMerchantResponse {
  RspCode: string; // Response code
  Message: string; // Response message
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * VNPay Response Codes
 */
export enum VNPayResponseCode {
  SUCCESS = "00",
  SUSPECTED_FRAUD = "07",
  NOT_REGISTERED_INTERNET_BANKING = "09",
  AUTHENTICATION_FAILED = "10",
  TIMEOUT = "11",
  CARD_LOCKED = "12",
  OTP_INVALID = "13",
  CANCELED = "24",
  INSUFFICIENT_BALANCE = "51",
  DAILY_LIMIT_EXCEEDED = "65",
  MAINTENANCE = "75",
  PASSWORD_LIMIT_EXCEEDED = "79",
  OTHER = "99",
}

/**
 * VNPay Transaction Status
 */
export enum VNPayTransactionStatus {
  SUCCESS = "00",
  INCOMPLETE = "01",
  ERROR = "02",
  REVERSED = "04", // Money deducted at bank but failed at VNPay
  REFUND_PROCESSING = "05",
  REFUND_SENT = "06",
  SUSPECTED = "07",
  REFUND_REJECTED = "09",
}

/**
 * VNPay IPN Response Codes (Merchant to VNPay)
 */
export enum VNPayIPNResponseCode {
  SUCCESS = "00", // Transaction updated successfully
  ORDER_NOT_FOUND = "01",
  ORDER_ALREADY_CONFIRMED = "02",
  INVALID_AMOUNT = "04",
  INVALID_SIGNATURE = "97",
  UNKNOWN_ERROR = "99",
}

/**
 * VNPay Bank Codes
 */
export enum VNPayBankCode {
  VNPAYQR = "VNPAYQR", // QR Code payment
  VNBANK = "VNBANK", // ATM card / Local bank account
  INTCARD = "INTCARD", // International card
  // Specific banks
  NCB = "NCB",
  VIETCOMBANK = "VCB",
  TECHCOMBANK = "TCB",
  VIETTINBANK = "CTG",
  BIDV = "BIDV",
  AGRIBANK = "AGB",
  SACOMBANK = "STB",
  VIETINBANK = "VIB",
  MB = "MB",
  ACB = "ACB",
  OCB = "OCB",
  SHB = "SHB",
  TPBANK = "TPB",
  VPBANK = "VPB",
}

/**
 * VNPay Order Types (Category)
 */
export enum VNPayOrderType {
  FASHION = "fashion",
  ELECTRONICS = "electronic",
  FOOD = "food",
  PHONE_TOPUP = "topup",
  HOTEL = "hotel",
  TRAVEL = "travel",
  OTHER = "other",
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if VNPay payment was successful
 */
export function isVNPayPaymentSuccessful(
  response: VNPayIPNResponse | VNPayQueryResponse
): boolean {
  return (
    response.vnp_ResponseCode === VNPayResponseCode.SUCCESS &&
    response.vnp_TransactionStatus === VNPayTransactionStatus.SUCCESS
  );
}

/**
 * Get human-readable message for VNPay response code
 */
export function getVNPayResponseMessage(code: string): string {
  const messages: Record<string, string> = {
    "00": "Giao dịch thành công",
    "07": "Giao dịch bị nghi ngờ gian lận",
    "09": "Thẻ chưa đăng ký Internet Banking",
    "10": "Xác thực thông tin thẻ không đúng quá 3 lần",
    "11": "Đã hết hạn chờ thanh toán",
    "12": "Thẻ bị khóa",
    "13": "Sai mật khẩu OTP",
    "24": "Khách hàng hủy giao dịch",
    "51": "Tài khoản không đủ số dư",
    "65": "Vượt quá hạn mức giao dịch trong ngày",
    "75": "Ngân hàng đang bảo trì",
    "79": "Nhập sai mật khẩu quá số lần quy định",
    "99": "Lỗi khác",
  };

  return messages[code] || `Mã lỗi: ${code}`;
}

/**
 * Get human-readable message for VNPay transaction status
 */
export function getVNPayTransactionStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    "00": "Giao dịch thành công",
    "01": "Giao dịch chưa hoàn tất",
    "02": "Giao dịch bị lỗi",
    "04": "Giao dịch đảo (đã trừ tiền nhưng chưa thành công)",
    "05": "Đang xử lý hoàn tiền",
    "06": "Đã gửi yêu cầu hoàn tiền",
    "07": "Giao dịch bị nghi ngờ gian lận",
    "09": "Hoàn tiền bị từ chối",
  };

  return messages[status] || `Trạng thái: ${status}`;
}

/**
 * Format amount for VNPay (multiply by 100)
 */
export function formatVNPayAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse amount from VNPay (divide by 100)
 */
export function parseVNPayAmount(vnpayAmount: number): number {
  return vnpayAmount / 100;
}

/**
 * Format date for VNPay (yyyyMMddHHmmss) in GMT+7 timezone
 * VNPay requires dates in Vietnam timezone (Asia/Ho_Chi_Minh)
 */
export function formatVNPayDate(date: Date = new Date()): string {
  // Convert to GMT+7 (Vietnam timezone)
  const vietnamDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  
  const year = vietnamDate.getFullYear();
  const month = String(vietnamDate.getMonth() + 1).padStart(2, "0");
  const day = String(vietnamDate.getDate()).padStart(2, "0");
  const hours = String(vietnamDate.getHours()).padStart(2, "0");
  const minutes = String(vietnamDate.getMinutes()).padStart(2, "0");
  const seconds = String(vietnamDate.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Parse VNPay date string to Date object
 */
export function parseVNPayDate(vnpayDate: string): Date {
  // Format: yyyyMMddHHmmss
  const year = parseInt(vnpayDate.substring(0, 4));
  const month = parseInt(vnpayDate.substring(4, 6)) - 1;
  const day = parseInt(vnpayDate.substring(6, 8));
  const hours = parseInt(vnpayDate.substring(8, 10));
  const minutes = parseInt(vnpayDate.substring(10, 12));
  const seconds = parseInt(vnpayDate.substring(12, 14));

  return new Date(year, month, day, hours, minutes, seconds);
}

/**
 * Remove Vietnamese diacritics for VNPay order info
 */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\w\s]/gi, ""); // Remove special characters
}
