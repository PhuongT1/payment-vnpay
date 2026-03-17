/**
 * VNPay IPN (Instant Payment Notification) Handler
 * This endpoint receives payment notifications from VNPay server
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getVNPayAPI } from "../../../lib/vnpay/vnpay-api";
import {
  VNPayIPNResponse,
  VNPayIPNMerchantResponse,
  VNPayIPNResponseCode,
  isVNPayPaymentSuccessful,
  parseVNPayAmount,
} from "../../../lib/vnpay/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VNPayIPNMerchantResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR,
      Message: "Method not allowed",
    });
  }

  console.log("=".repeat(80));
  console.log("📥 VNPay IPN Callback Received");
  console.log("=".repeat(80));

  try {
    const vnpayAPI = getVNPayAPI();
    const ipnData = req.query as unknown as VNPayIPNResponse;

    console.log("IPN Data:", {
      txnRef: ipnData.vnp_TxnRef,
      amount: parseVNPayAmount(Number(ipnData.vnp_Amount)),
      responseCode: ipnData.vnp_ResponseCode,
      transactionStatus: ipnData.vnp_TransactionStatus,
      transactionNo: ipnData.vnp_TransactionNo,
      bankCode: ipnData.vnp_BankCode,
    });

    // Step 1: Verify signature
    const isValidSignature = vnpayAPI.verifyIPNSignature(ipnData);
    if (!isValidSignature) {
      console.error("❌ Invalid signature from VNPay");
      return res.status(200).json({
        RspCode: VNPayIPNResponseCode.INVALID_SIGNATURE,
        Message: "Invalid signature",
      });
    }

    console.log("✅ Signature verified successfully");

    // Step 2: Find order in database
    // TODO: Replace with actual database query
    const order = await findOrderByRef(ipnData.vnp_TxnRef);

    if (!order) {
      console.error(`❌ Order not found: ${ipnData.vnp_TxnRef}`);
      return res.status(200).json({
        RspCode: VNPayIPNResponseCode.ORDER_NOT_FOUND,
        Message: "Order not found",
      });
    }

    // Step 3: Check if order already processed
    if (order.status !== "pending") {
      console.warn(`⚠️ Order already processed: ${ipnData.vnp_TxnRef}`);
      return res.status(200).json({
        RspCode: VNPayIPNResponseCode.ORDER_ALREADY_CONFIRMED,
        Message: "Order already confirmed",
      });
    }

    // Step 4: Verify amount
    const paidAmount = parseVNPayAmount(Number(ipnData.vnp_Amount));
    if (Math.abs(paidAmount - order.amount) > 0.01) {
      console.error(
        `❌ Amount mismatch. Expected: ${order.amount}, Received: ${paidAmount}`
      );
      return res.status(200).json({
        RspCode: VNPayIPNResponseCode.INVALID_AMOUNT,
        Message: "Invalid amount",
      });
    }

    // Step 5: Update order status based on payment result
    const paymentSuccess = isVNPayPaymentSuccessful(ipnData);

    if (paymentSuccess) {
      console.log("✅ Payment successful, updating order...");
      await updateOrderStatus(ipnData.vnp_TxnRef, {
        status: "paid",
        transactionNo: ipnData.vnp_TransactionNo,
        bankCode: ipnData.vnp_BankCode,
        cardType: ipnData.vnp_CardType,
        payDate: ipnData.vnp_PayDate,
      });
    } else {
      console.log("❌ Payment failed, updating order...");
      await updateOrderStatus(ipnData.vnp_TxnRef, {
        status: "failed",
        responseCode: ipnData.vnp_ResponseCode,
        transactionStatus: ipnData.vnp_TransactionStatus,
      });
    }

    // Step 6: Return success response to VNPay
    console.log("✅ IPN processed successfully");
    console.log("=".repeat(80));

    return res.status(200).json({
      RspCode: VNPayIPNResponseCode.SUCCESS,
      Message: "Confirm Success",
    });
  } catch (error) {
    console.error("❌ VNPay IPN Error:", error);
    console.log("=".repeat(80));

    return res.status(200).json({
      RspCode: VNPayIPNResponseCode.UNKNOWN_ERROR,
      Message: "Unknown error",
    });
  }
}

// ============================================================================
// Database Helper Functions (TODO: Implement with actual database)
// ============================================================================

interface Order {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
}

async function findOrderByRef(txnRef: string): Promise<Order | null> {
  // TODO: Implement database query
  // Example:
  // const order = await prisma.order.findUnique({
  //   where: { transactionRef: txnRef }
  // });
  // return order;

  console.log(`[TODO] Find order in database: ${txnRef}`);

  // Mock data for development
  return {
    id: txnRef,
    amount: 100000, // 100,000 VND
    status: "pending",
  };
}

async function updateOrderStatus(
  txnRef: string,
  data: {
    status: string;
    transactionNo?: string;
    bankCode?: string;
    cardType?: string;
    payDate?: string;
    responseCode?: string;
    transactionStatus?: string;
  }
): Promise<void> {
  // TODO: Implement database update
  // Example:
  // await prisma.order.update({
  //   where: { transactionRef: txnRef },
  //   data: {
  //     status: data.status,
  //     vnpayTransactionNo: data.transactionNo,
  //     bankCode: data.bankCode,
  //     // ... other fields
  //   }
  // });

  console.log(`[TODO] Update order in database:`, {
    txnRef,
    ...data,
  });
}
