import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { getVNPayAPI } from "@/lib/vnpay/vnpay-api";
import { formatVNPayDate } from "@/lib/vnpay/types";

/**
 * TRANSACTION_REFUND_REQUESTED webhook
 * 
 * This webhook is called when a refund is requested for a transaction.
 * It will initiate a refund with VNPay.
 */
export const transactionRefundRequestedWebhook = new SaleorAsyncWebhook({
  name: "Transaction Refund Requested - VNPay",
  webhookPath: "api/webhooks/transaction-refund-requested",
  event: "TRANSACTION_REFUND_REQUESTED",
  apl: saleorApp.apl,
  query: `
    subscription TransactionRefundRequested {
      event {
        ... on TransactionRefundRequested {
          action {
            actionType
            amount
            currency
          }
          transaction {
            id
            pspReference
            chargedAmount {
              amount
              currency
            }
            events {
              pspReference
              type
            }
          }
          grantedRefund {
            id
            amount {
              amount
              currency
            }
          }
        }
      }
    }
  `,
});

export default transactionRefundRequestedWebhook.createHandler(async (req, res, ctx) => {
  const { payload } = ctx;

  console.log("Transaction Refund Requested webhook triggered", {
    transactionId: payload.transaction?.id,
    amount: payload.action?.amount,
  });

  try {
    const { action, transaction, grantedRefund } = payload;

    if (!transaction || !transaction.pspReference) {
      console.error("Missing transaction or PSP reference");
      return res.status(400).json({
        result: "REFUND_FAILURE",
        amount: 0,
        message: "Missing transaction reference",
      });
    }

    // Find the charge event to get the VNPay transaction ID
    const chargeEvent = transaction.events?.find(
      (event) => event.type === "CHARGE_SUCCESS"
    );

    if (!chargeEvent || !chargeEvent.pspReference) {
      console.error("Cannot find charge event with PSP reference");
      return res.status(400).json({
        result: "REFUND_FAILURE",
        amount: 0,
        message: "Cannot find original transaction for refund",
      });
    }

    const vnpayTransactionNo = chargeEvent.pspReference;
    const amount = action.amount; // VNPay amount in VND
    const orderId = transaction.pspReference; // Original order ID

    // Get IP address
    const ipAddr = req.headers["x-forwarded-for"] as string || "127.0.0.1";

    // Get transaction date (should be stored, or use estimate)
    const transactionDate = formatVNPayDate(new Date()); // You should store this from original payment

    // Process refund with VNPay
    const vnpayAPI = getVNPayAPI();
    const refundResult = await vnpayAPI.refundTransaction({
      orderId,
      transactionNo: vnpayTransactionNo,
      amount,
      transactionDate,
      transactionType: "02", // Full refund (use "03" for partial)
      createdBy: "saleor-admin",
      ipAddr,
    });

    console.log("VNPay refund result:", {
      orderId,
      responseCode: refundResult.vnp_ResponseCode,
      message: refundResult.vnp_Message,
    });

    if (refundResult.vnp_ResponseCode === "00") {
      // Refund successful
      return res.status(200).json({
        pspReference: refundResult.vnp_TransactionNo || vnpayTransactionNo,
        result: "REFUND_SUCCESS",
        amount: action.amount,
        time: new Date().toISOString(),
        message: "Refund processed successfully",
        data: {
          vnpayTransactionNo: refundResult.vnp_TransactionNo,
          vnpayResponseCode: refundResult.vnp_ResponseCode,
          vnpayMessage: refundResult.vnp_Message,
        },
      });
    } else {
      // Refund failed
      return res.status(200).json({
        pspReference: vnpayTransactionNo,
        result: "REFUND_FAILURE",
        amount: 0,
        message: `Refund failed: ${refundResult.vnp_Message}`,
        data: {
          vnpayResponseCode: refundResult.vnp_ResponseCode,
          vnpayMessage: refundResult.vnp_Message,
        },
      });
    }

  } catch (error) {
    console.error("Error in Transaction Refund Requested:", error);

    return res.status(500).json({
      result: "REFUND_FAILURE",
      amount: 0,
      message: error instanceof Error ? error.message : "Failed to process refund",
    });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
