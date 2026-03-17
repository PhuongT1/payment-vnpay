import crypto from "crypto";
import { getMockMoMoAPI, type MockMoMoAPI } from "./mock-momo-api";

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  orderInfo: string;
  amount: number;
  returnUrl: string;
  notifyUrl: string;
  extraData?: string;
}

export interface CreatePaymentResponse {
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface MoMoIPNPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

export class MoMoAPI {
  private config: MoMoConfig;

  constructor(config: MoMoConfig) {
    this.config = config;
  }

  /**
   * Generate HMAC SHA256 signature for MoMo requests
   */
  private generateSignature(data: Record<string, any>): string {
    const rawSignature = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("&");

    return crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");
  }

  /**
   * Verify MoMo IPN signature
   */
  verifyIPNSignature(payload: MoMoIPNPayload): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = payload;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    return signature === expectedSignature;
  }

  /**
   * Create a MoMo payment request
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const requestId = `${this.config.partnerCode}_${Date.now()}`;
    const orderType = "momo_wallet";
    const requestType = "captureWallet";
    const extraData = request.extraData || "";

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${request.amount}&extraData=${extraData}&ipnUrl=${request.notifyUrl}&orderId=${request.orderId}&orderInfo=${request.orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${request.returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: "Test",
      storeId: this.config.partnerCode,
      requestId,
      amount: request.amount,
      orderId: request.orderId,
      orderInfo: request.orderInfo,
      redirectUrl: request.returnUrl,
      ipnUrl: request.notifyUrl,
      lang: "vi",
      extraData,
      requestType,
      signature,
      orderType,
    };

    console.log("MoMo API Request:", {
      endpoint: `${this.config.endpoint}/v2/gateway/api/create`,
      partnerCode: this.config.partnerCode,
      requestId,
      orderId: request.orderId,
      amount: request.amount,
      signature: signature.substring(0, 20) + "...",
    });

    const response = await fetch(`${this.config.endpoint}/v2/gateway/api/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("MoMo API Response:", {
      status: response.status,
      statusText: response.statusText,
      resultCode: data.resultCode,
      message: data.message,
    });

    if (!response.ok) {
      throw new Error(`MoMo API error (${response.status}): ${data.message || response.statusText}`);
    }

    if (data.resultCode !== 0) {
      throw new Error(`MoMo error: ${data.message} (code: ${data.resultCode})`);
    }

    return data;
  }

  /**
   * Query payment status from MoMo
   */
  async queryPaymentStatus(orderId: string, requestId: string): Promise<any> {
    const requestIdQuery = `${this.config.partnerCode}_${Date.now()}`;

    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestIdQuery}`;

    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId: requestIdQuery,
      orderId,
      lang: "vi",
      signature,
    };

    const response = await fetch(`${this.config.endpoint}/v2/gateway/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("MoMo Query Response:", {
      status: response.status,
      orderId,
      resultCode: data.resultCode,
      message: data.message,
    });

    if (!response.ok) {
      throw new Error(`MoMo query API error (${response.status}): ${data.message || response.statusText}`);
    }

    return data;
  }

  /**
   * Refund a MoMo transaction
   */
  async refundPayment(orderId: string, transId: number, amount: number): Promise<any> {
    const requestId = `${this.config.partnerCode}_${Date.now()}`;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&description=Refund&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}&transId=${transId}`;

    const signature = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId,
      orderId,
      amount,
      transId,
      lang: "vi",
      description: "Refund",
      signature,
    };

    const response = await fetch(`${this.config.endpoint}/v2/gateway/api/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log("MoMo Refund Response:", {
      status: response.status,
      orderId,
      transId,
      resultCode: data.resultCode,
      message: data.message,
    });

    if (!response.ok) {
      throw new Error(`MoMo refund API error (${response.status}): ${data.message || response.statusText}`);
    }

    return data;
  }
}

/**
 * Get MoMo API instance from environment variables
 * Returns mock API if MOMO_MOCK_MODE=true
 */
export function getMoMoAPI(): MoMoAPI | MockMoMoAPI {
  // Check if mock mode is enabled
  if (process.env.MOMO_MOCK_MODE === "true") {
    console.log("🧪 [MOCK MODE] Using Mock MoMo API - No real API calls will be made");
    return getMockMoMoAPI() as any;
  }

  const config: MoMoConfig = {
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn",
  };

  if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    console.warn("⚠️  Missing MoMo credentials. Enable mock mode with MOMO_MOCK_MODE=true");
    throw new Error("Missing MoMo configuration. Please set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, and MOMO_SECRET_KEY, or enable MOMO_MOCK_MODE=true");
  }

  return new MoMoAPI(config);
}
