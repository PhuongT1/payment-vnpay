/**
 * Test API: VNPay Query Transaction
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getVNPayAPI } from "../../../lib/vnpay/vnpay-api";
import { formatVNPayDate } from "../../../lib/vnpay/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { orderId, transactionDate } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: orderId",
      });
    }

    const vnpayAPI = getVNPayAPI();

    // Get client IP
    const ipAddr =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      "127.0.0.1";

    // Use provided transaction date or default to today
    const txnDate =
      (transactionDate as string) ||
      formatVNPayDate(new Date(Date.now() - 24 * 60 * 60 * 1000)); // Yesterday

    const result = await vnpayAPI.queryTransaction({
      orderId: orderId as string,
      transactionDate: txnDate,
      ipAddr,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Query completed successfully",
    });
  } catch (error) {
    console.error("VNPay Query Error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to query transaction",
    });
  }
}
