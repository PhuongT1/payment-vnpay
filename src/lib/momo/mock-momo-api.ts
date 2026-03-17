import crypto from "crypto";
import type { CreatePaymentRequest, CreatePaymentResponse } from "./momo-api";

/**
 * Mock MoMo API for testing without real credentials
 * Simulates MoMo responses for development and testing
 */
export class MockMoMoAPI {
  /**
   * Mock create payment - returns fake payment URL
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    console.log("🧪 [MOCK] Creating payment:", {
      orderId: request.orderId,
      amount: request.amount,
    });

    // Simulate API delay
    await this.delay(500);

    const requestId = `MOCK_${Date.now()}`;
    const mockTransId = Math.floor(Math.random() * 1000000000);

    // Generate mock payment URL
    const mockPayUrl = `http://localhost:3000/momo-mock-payment?orderId=${request.orderId}&amount=${request.amount}`;
    const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPayUrl)}`;

    const response: CreatePaymentResponse = {
      partnerCode: "MOCK_PARTNER",
      requestId,
      orderId: request.orderId,
      amount: request.amount,
      responseTime: Date.now(),
      message: "Successful (Mock)",
      resultCode: 0,
      payUrl: mockPayUrl,
      deeplink: `momo://app?action=payment&orderId=${request.orderId}`,
      qrCodeUrl: mockQrUrl,
    };

    console.log("🧪 [MOCK] Payment created:", {
      orderId: response.orderId,
      payUrl: response.payUrl,
    });

    return response;
  }

  /**
   * Mock query payment status
   */
  async queryPaymentStatus(orderId: string, requestId: string): Promise<any> {
    console.log("🧪 [MOCK] Querying payment:", { orderId, requestId });

    await this.delay(300);

    // Always return success for mock
    const response = {
      partnerCode: "MOCK_PARTNER",
      orderId,
      requestId,
      amount: 100000,
      resultCode: 0, // Success
      message: "Successful (Mock)",
      responseTime: Date.now(),
      transId: Math.floor(Math.random() * 1000000000),
      payType: "qr",
    };

    console.log("🧪 [MOCK] Payment status:", {
      orderId,
      resultCode: response.resultCode,
      transId: response.transId,
    });

    return response;
  }

  /**
   * Mock refund payment
   */
  async refundPayment(orderId: string, transId: number, amount: number): Promise<any> {
    console.log("🧪 [MOCK] Refunding payment:", {
      orderId,
      transId,
      amount,
    });

    await this.delay(400);

    const response = {
      partnerCode: "MOCK_PARTNER",
      orderId,
      requestId: `MOCK_REFUND_${Date.now()}`,
      amount,
      resultCode: 0, // Success
      message: "Refund successful (Mock)",
      responseTime: Date.now(),
      transId: Math.floor(Math.random() * 1000000000),
    };

    console.log("🧪 [MOCK] Refund completed:", {
      orderId,
      transId: response.transId,
    });

    return response;
  }

  /**
   * Mock IPN signature verification - always returns true
   */
  verifyIPNSignature(payload: any): boolean {
    console.log("🧪 [MOCK] Verifying IPN signature (always true)");
    return true;
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Get mock MoMo API instance
 */
export function getMockMoMoAPI(): MockMoMoAPI {
  return new MockMoMoAPI();
}
