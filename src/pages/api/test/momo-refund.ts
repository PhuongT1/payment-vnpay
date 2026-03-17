import { NextApiRequest, NextApiResponse } from "next";
import { getMoMoAPI } from "@/lib/momo/momo-api";

/**
 * Test endpoint to refund a MoMo payment
 * This simulates what happens during TRANSACTION_REFUND_REQUESTED
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { orderId, transId, amount } = req.body;

    if (!orderId || !transId || !amount) {
      return res.status(400).json({
        message: "Missing required fields: orderId, transId, amount",
      });
    }

    const momoAPI = getMoMoAPI();

    console.log("Test: Refunding MoMo payment", {
      orderId,
      transId,
      amount,
    });

    const result = await momoAPI.refundPayment(orderId, parseInt(transId), parseInt(amount));

    console.log("Test: MoMo refund result", {
      orderId,
      resultCode: result.resultCode,
      message: result.message,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Test: Error refunding MoMo payment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to refund payment",
    });
  }
}
