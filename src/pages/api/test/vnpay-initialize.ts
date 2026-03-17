/**
 * Test API: VNPay Initialize Payment
 */

import { NextApiRequest, NextApiResponse } from "next";

import { getVNPayAPI } from "../../../lib/vnpay/vnpay-api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { orderId, amount, orderInfo, bankCode } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, amount",
      });
    }

    const vnpayAPI = getVNPayAPI();

    // Get client IP - handle both IPv4 and IPv6
    let ipAddr = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || 
                 req.socket.remoteAddress || 
                 "127.0.0.1";
    
    // Convert IPv6 localhost to IPv4
    if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") {
      ipAddr = "127.0.0.1";
    }

    const result = await vnpayAPI.createPayment({
      orderId,
      amount,
      orderInfo: orderInfo || `Payment for order ${orderId}`,
      ipAddr,
      bankCode: bankCode || undefined,
      locale: "vn",
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Payment initialized successfully",
    });
  } catch (error) {
    console.error("VNPay Initialize Error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to initialize payment",
    });
  }
}
