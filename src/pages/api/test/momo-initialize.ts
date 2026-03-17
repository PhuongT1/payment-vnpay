import { NextApiRequest, NextApiResponse } from "next";
import { getMoMoAPI } from "@/lib/momo/momo-api";

/**
 * Test endpoint to initialize a MoMo payment
 * This simulates what happens during TRANSACTION_INITIALIZE_SESSION
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { amount, orderId, orderInfo, userEmail } = req.body;

    if (!amount || !orderId || !orderInfo) {
      return res.status(400).json({
        message: "Missing required fields: amount, orderId, orderInfo",
      });
    }

    const momoAPI = getMoMoAPI();

    // Get base URL
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const returnUrl = `${baseUrl}/api/test/momo-return`;
    const notifyUrl = `${baseUrl}/api/momo/ipn`;

    console.log("Test: Initializing MoMo payment", {
      orderId,
      amount,
      returnUrl,
      notifyUrl,
    });

    const result = await momoAPI.createPayment({
      orderId,
      orderInfo,
      amount: parseInt(amount),
      returnUrl,
      notifyUrl,
      extraData: JSON.stringify({
        userEmail,
        test: true,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log("Test: MoMo payment created", {
      orderId: result.orderId,
      requestId: result.requestId,
      resultCode: result.resultCode,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Test: Error initializing MoMo payment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize payment",
    });
  }
}
