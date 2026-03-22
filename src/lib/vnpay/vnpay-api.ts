/**
 * VNPay Payment Gateway API Client
 * Documentation: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */

import crypto from "crypto";
import querystring from "querystring";
import { VNPAY_PAYMENT_GATEWAY_URL, VNPAY_API_QUERY_URL, getVNPayReturnUrl } from "@/lib/env-config";

import {
  formatVNPayAmount,
  formatVNPayDate,
  removeVietnameseDiacritics,
  VNPayCreatePaymentRequest,
  VNPayCreatePaymentResponse,
  VNPayIPNResponse,
  VNPayQueryRequest,
  VNPayQueryResponse,
  VNPayRefundRequest,
  VNPayRefundResponse,
} from "./types";

export class VNPayAPI {
  private tmnCode: string;
  private hashSecret: string;
  private paymentUrl: string;
  private apiUrl: string;
  private returnUrl: string;

  constructor(config: {
    tmnCode: string;
    hashSecret: string;
    paymentUrl?: string;
    apiUrl?: string;
    returnUrl?: string;
  }) {
    this.tmnCode = config.tmnCode;
    this.hashSecret = config.hashSecret;
    this.paymentUrl = config.paymentUrl || VNPAY_PAYMENT_GATEWAY_URL;
    this.apiUrl = config.apiUrl || VNPAY_API_QUERY_URL;
    this.returnUrl = config.returnUrl || getVNPayReturnUrl();
  }

  /**
   * Create payment URL for customer redirect
   */
  async createPayment(params: {
    orderId: string;
    amount: number;
    orderInfo: string;
    ipAddr: string;
    bankCode?: string;
    locale?: "vn" | "en";
    returnUrl?: string;
    version?: string;
    command?: "pay";
  }): Promise<VNPayCreatePaymentResponse> {
    const createDate = formatVNPayDate();
    const expireDate = formatVNPayDate(
      new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    );

    const command = params.command === "pay" ? "pay" : "pay";

    // Build request parameters
    const vnpParams: Record<string, string> = {
      vnp_Version: params.version || "2.1.0",
      vnp_Command: command,
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: formatVNPayAmount(params.amount).toString(),
      vnp_CurrCode: "VND",
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: removeVietnameseDiacritics(params.orderInfo),
      vnp_OrderType: "other",
      vnp_Locale: params.locale || "vn",
      vnp_ReturnUrl: params.returnUrl || this.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Add bank code if specified
    if (params.bankCode) {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    // Generate secure hash
    const secureHash = this.generateSecureHash(vnpParams);
    vnpParams.vnp_SecureHash = secureHash;
    
    // Build payment URL
    const paymentUrl = `${this.paymentUrl}?${querystring.stringify(vnpParams)}`;

    console.log("VNPay Create Payment Request:", {
      orderId: params.orderId,
      amount: params.amount,
      tmnCode: this.tmnCode,
      createDate,
      expireDate,
      secureHashPreview: secureHash.substring(0, 20) + "...",
      paymentUrlPreview: paymentUrl.substring(0, 150) + "...",
    });

    return {
      success: true,
      paymentUrl,
      transactionRef: params.orderId,
    };
  }

  /**
   * Query transaction status
   */
  async queryTransaction(params: {
    orderId: string;
    transactionDate: string;
    ipAddr: string;
  }): Promise<VNPayQueryResponse> {
    const createDate = formatVNPayDate();

    const vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "querydr",
      vnp_TmnCode: this.tmnCode,
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: `Query transaction ${params.orderId}`,
      vnp_TransactionDate: params.transactionDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: params.ipAddr,
    };

    // Generate secure hash
    const secureHash = this.generateSecureHash(vnpParams);
    vnpParams.vnp_SecureHash = secureHash;

    console.log("VNPay Query Request:", {
      orderId: params.orderId,
      transactionDate: params.transactionDate,
    });

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify(vnpParams),
      });

      const data = await response.json();

      console.log("VNPay Query Response:", {
        responseCode: data.vnp_ResponseCode,
        transactionStatus: data.vnp_TransactionStatus,
        message: data.vnp_Message,
      });

      return data as VNPayQueryResponse;
    } catch (error) {
      console.error("VNPay Query Error:", error);
      throw new Error(`VNPay query failed: ${error}`);
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(params: {
    orderId: string;
    transactionNo?: string;
    amount: number;
    transactionDate: string;
    transactionType?: "02" | "03"; // 02 = full, 03 = partial
    createdBy: string;
    ipAddr: string;
  }): Promise<VNPayRefundResponse> {
    const createDate = formatVNPayDate();

    const vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "refund",
      vnp_TmnCode: this.tmnCode,
      vnp_TransactionType: params.transactionType || "02",
      vnp_TxnRef: params.orderId,
      vnp_Amount: formatVNPayAmount(params.amount).toString(),
      vnp_OrderInfo: `Refund for ${params.orderId}`,
      vnp_TransactionDate: params.transactionDate,
      vnp_CreateBy: params.createdBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: params.ipAddr,
    };

    if (params.transactionNo) {
      vnpParams.vnp_TransactionNo = params.transactionNo;
    }

    // Generate secure hash
    const secureHash = this.generateSecureHash(vnpParams);
    vnpParams.vnp_SecureHash = secureHash;

    console.log("VNPay Refund Request:", {
      orderId: params.orderId,
      amount: params.amount,
      transactionType: params.transactionType,
    });

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify(vnpParams),
      });

      const data = await response.json();

      console.log("VNPay Refund Response:", {
        responseCode: data.vnp_ResponseCode,
        message: data.vnp_Message,
      });

      return data as VNPayRefundResponse;
    } catch (error) {
      console.error("VNPay Refund Error:", error);
      throw new Error(`VNPay refund failed: ${error}`);
    }
  }

  /**
   * Verify IPN callback signature
   */
  verifyIPNSignature(params: VNPayIPNResponse): boolean {
    const secureHash = params.vnp_SecureHash;
    const paramsWithoutHash = { ...params };
    delete (paramsWithoutHash as any).vnp_SecureHash;
    delete (paramsWithoutHash as any).vnp_SecureHashType;

    // Convert all values to strings for hash calculation
    const stringParams = Object.keys(paramsWithoutHash).reduce((acc, key) => {
      acc[key] = String((paramsWithoutHash as any)[key]);
      return acc;
    }, {} as Record<string, string>);

    const calculatedHash = this.generateSecureHash(stringParams);

    const isValid = secureHash === calculatedHash;

    console.log("VNPay IPN Signature Verification:", {
      isValid,
      receivedHash: secureHash.substring(0, 20) + "...",
      calculatedHash: calculatedHash.substring(0, 20) + "...",
    });

    return isValid;
  }

  /**
   * Generate HMAC SHA512 secure hash
   * Per VNPay Java demo: KEY is NOT encoded, but VALUE must be URL encoded
   */
  private generateSecureHash(params: Record<string, string>): string {
    // Sort parameters by key
    const sortedKeys = Object.keys(params).sort();

    // Create hash data string: key=URLEncode(value)&key2=URLEncode(value2)
    // Based on VNPay Java demo code
    const hashData = sortedKeys
      .map((key) => {
        const encodedValue = encodeURIComponent(params[key])
          .replace(/%20/g, '+');  // VNPay uses + for space (like Java URLEncoder)
        return `${key}=${encodedValue}`;
      })
      .join("&");

    // Generate HMAC SHA512
    const hmac = crypto.createHmac("sha512", this.hashSecret);
    const secureHash = hmac.update(Buffer.from(hashData, "utf-8")).digest("hex");

    console.log("VNPay Hash Generation:", {
      hashDataPreview: hashData.substring(0, 200) + "...",
      hashSecretLength: this.hashSecret.length,
      secureHashPreview: secureHash.substring(0, 20) + "...",
    });

    return secureHash;
  }

  /**
   * Get configuration info
   */
  getConfig() {
    return {
      tmnCode: this.tmnCode,
      paymentUrl: this.paymentUrl,
      apiUrl: this.apiUrl,
      returnUrl: this.returnUrl,
      hasCredentials: !!(this.tmnCode && this.hashSecret),
    };
  }
}

/**
 * Get VNPay API instance from environment variables
 */
export function getVNPayAPI(): VNPayAPI {
  const tmnCode = process.env.VNPAY_TMN_CODE || "";
  const hashSecret = process.env.VNPAY_HASH_SECRET || "";

  if (!tmnCode || !hashSecret) {
    console.warn(
      "⚠️ VNPay credentials not configured. Please set VNPAY_TMN_CODE and VNPAY_HASH_SECRET in .env"
    );
  }

  return new VNPayAPI({
    tmnCode,
    hashSecret,
  });
}
