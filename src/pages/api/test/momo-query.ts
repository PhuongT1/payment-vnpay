import { NextApiRequest, NextApiResponse } from "next";
import { getMoMoAPI } from "@/lib/momo/momo-api";

/**
 * Test endpoint to query MoMo payment status
 * This simulates what happens during TRANSACTION_PROCESS_SESSION
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { orderId, requestId } = req.body;

    if (!orderId || !requestId) {
      return res.status(400).json({
        message: "Missing required fields: orderId, requestId",
      });
    }

    const momoAPI = getMoMoAPI();

    console.log("Test: Querying MoMo payment status", {
      orderId,
      requestId,
    });

    const result = await momoAPI.queryPaymentStatus(orderId, requestId);

    console.log("Test: MoMo payment status", {
      orderId,
      resultCode: result.resultCode,
      message: result.message,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Test: Error querying MoMo payment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to query payment",
    });
  }
}
