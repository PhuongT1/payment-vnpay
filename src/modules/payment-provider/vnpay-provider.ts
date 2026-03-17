/**
 * VNPay Payment Provider Client
 * Integrates with existing VNPay API library
 * Based on Saleor payment app patterns
 */

import { VNPayAPI } from "@/lib/vnpay/vnpay-api";
import { VNPayConfigEntry } from "../payment-app-configuration/input-schemas";
import {
  VNPayCreatePaymentRequest,
  VNPayQueryRequest,
  VNPayRefundRequest,
  isVNPayPaymentSuccessful,
} from "@/lib/vnpay/types";

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  orderInfo: string;
  ipAddress: string;
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  transactionRef?: string;
  errorMessage?: string;
}

export interface QueryPaymentParams {
  orderId: string;
  transactionDate: string;
  ipAddress: string;
}

export interface QueryResult {
  success: boolean;
  paid: boolean;
  amount?: number;
  transactionId?: string;
  errorMessage?: string;
}

export interface RefundParams {
  orderId: string;
  transactionId: string;
  amount: number;
  transactionDate: string;
  ipAddress: string;
  createdBy: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  errorMessage?: string;
}

export class VNPayProviderClient {
  private vnpayAPI: VNPayAPI;
  private config: VNPayConfigEntry;

  constructor(config: VNPayConfigEntry) {
    this.config = config;
    
    // Initialize VNPay API with configuration
    const paymentUrl =
      config.environment === "sandbox"
        ? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
        : "https://payment.vnpay.vn/paymentv2/vpcpay.html";

    const apiUrl =
      config.environment === "sandbox"
        ? "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
        : "https://payment.vnpay.vn/merchant_webapi/api/transaction";

    this.vnpayAPI = new VNPayAPI({
      tmnCode: config.partnerCode,
      hashSecret: config.secretKey,
      paymentUrl,
      apiUrl,
      returnUrl: config.redirectUrl,
      callbackUrl: config.ipnUrl,
    });
  }

  /**
   * Create a payment session
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const request: VNPayCreatePaymentRequest = {
        orderId: params.orderId,
        amount: params.amount,
        locale: "vn",
        orderInfo: params.orderInfo,
        ipAddr: params.ipAddress,
        bankCode: undefined, // Let user choose at VNPay
        orderType: "other",
      };

      const paymentData = await this.vnpayAPI.createPayment(request);

      return {
        success: true,
        paymentUrl: paymentData.paymentUrl,
        transactionRef: paymentData.transactionRef,
      };
    } catch (error) {
      console.error("VNPay createPayment error:", error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Payment creation failed",
      };
    }
  }

  /**
   * Query payment status
   */
  async queryPayment(params: QueryPaymentParams): Promise<QueryResult> {
    try {
      const request: VNPayQueryRequest = {
        orderId: params.orderId,
        transactionDate: params.transactionDate,
        ipAddr: params.ipAddress,
      };

      const response = await this.vnpayAPI.queryTransaction(request);

      const paid = isVNPayPaymentSuccessful(
        response.vnp_ResponseCode,
        response.vnp_TransactionStatus
      );

      return {
        success: true,
        paid,
        amount: response.vnp_Amount ? Number(response.vnp_Amount) / 100 : undefined,
        transactionId: response.vnp_TransactionNo,
      };
    } catch (error) {
      console.error("VNPay queryPayment error:", error);
      return {
        success: false,
        paid: false,
        errorMessage: error instanceof Error ? error.message : "Query failed",
      };
    }
  }

  /**
   * Process a refund
   */
  async processRefund(params: RefundParams): Promise<RefundResult> {
    try {
      const request: VNPayRefundRequest = {
        orderId: params.orderId,
        transId: params.transactionId,
        amount: params.amount,
        transactionDate: params.transactionDate,
        ipAddr: params.ipAddress,
        createdBy: params.createdBy,
        refundType: "02", // Full refund
      };

      const response = await this.vnpayAPI.refundTransaction(request);

      if (response.vnp_ResponseCode === "00") {
        return {
          success: true,
          refundId: response.vnp_TransactionNo,
        };
      }

      return {
        success: false,
        errorMessage: `Refund failed with code: ${response.vnp_ResponseCode}`,
      };
    } catch (error) {
      console.error("VNPay processRefund error:", error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }

  /**
   * Test connection to VNPay
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test query to verify credentials
      const testOrderId = `TEST_${Date.now()}`;
      const testDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const request: VNPayQueryRequest = {
        orderId: testOrderId,
        transactionDate: testDate,
        ipAddr: "127.0.0.1",
      };

      // This will fail for non-existent order, but will validate credentials
      try {
        await this.vnpayAPI.queryTransaction(request);
      } catch (error) {
        // If we get a VNPay response (even an error), credentials are valid
        if (error instanceof Error && error.message.includes("vnp_")) {
          return {
            success: true,
            message: "Connection successful. Credentials are valid.",
          };
        }
        throw error;
      }

      return {
        success: true,
        message: "Connection successful",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Verify IPN signature
   */
  verifyIPNSignature(queryParams: Record<string, string>): boolean {
    return this.vnpayAPI.verifyIPNSignature(queryParams);
  }

  /**
   * Get configuration details (without secrets)
   */
  getConfigInfo() {
    return {
      configurationName: this.config.configurationName,
      environment: this.config.environment,
      partnerCode: this.config.partnerCode,
    };
  }
}
