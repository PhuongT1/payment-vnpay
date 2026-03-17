import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { getVNPayAPI } from "@/lib/vnpay/vnpay-api";
import { formatVNPayDate } from "@/lib/vnpay/types";

/**
 * TRANSACTION_PROCESS_SESSION webhook
 * 
 * This webhook is called to process/finalize the payment after user authorization.
 * For VNPay, this will query the payment status and confirm if payment was successful.
 */
export const transactionProcessSessionWebhook = new SaleorAsyncWebhook({
  name: "Transaction Process Session - VNPay",
  webhookPath: "api/webhooks/transaction-process-session",
  event: "TRANSACTION_PROCESS_SESSION",
  apl: saleorApp.apl,
  query: `
    subscription TransactionProcessSession {
      event {
        ... on TransactionProcessSession {
          action {
            actionType
            amount
            currency
          }
          transaction {
            id
            pspReference
            authorizedAmount {
              amount
              currency
            }
          }
          sourceObject {
            __typename
            ... on Checkout {
              id
            }
            ... on Order {
              id
              number
            }
          }
          merchantReference
          data
        }
      }
    }
  `,
});

export default transactionProcessSessionWebhook.createHandler(async (req, res, ctx) => {
  const { payload } = ctx;

  console.log("Transaction Process Session webhook triggered", {
    merchantReference: payload.merchantReference,
    transactionId: payload.transaction?.id,
  });

  try {
    const { action, transaction, merchantReference, data } = payload;

    if (!transaction || !transaction.pspReference) {
      console.error("Missing transaction or PSP reference");
      return res.status(400).json({
        result: "CHARGE_FAILURE",
        amount: 0,
        message: "Missing transaction reference",
      });
    }

    // Extract VNPay order ID from transaction reference
    const vnpayOrderId = transaction.pspReference;
    
    // Get transaction date (try from data, or use recent time)
    const transactionDate = data?.transactionDate || formatVNPayDate(new Date());

    // Query VNPay payment status
    const vnpayAPI = getVNPayAPI();
    const ipAddr = req.headers["x-forwarded-for"] as string || "127.0.0.1";
    
    const paymentStatus = await vnpayAPI.queryTransaction({
      orderId: vnpayOrderId,
      transactionDate,
      ipAddr,
    });

    console.log("VNPay payment status:", {
      orderId: vnpayOrderId,
      responseCode: paymentStatus.vnp_ResponseCode,
      transactionStatus: paymentStatus.vnp_TransactionStatus,
      message: paymentStatus.vnp_Message,
    });

    // VNPay response codes:
    // 00 = Success
    // Other codes = Failed or pending

    if (paymentStatus.vnp_ResponseCode === "00" && paymentStatus.vnp_TransactionStatus === "00") {
      // Payment successful
      const amount = paymentStatus.vnp_Amount / 100; // Convert from VND*100 to VND

      return res.status(200).json({
        pspReference: paymentStatus.vnp_TransactionNo || vnpayOrderId,
        result: "CHARGE_SUCCESS",
        amount: amount,
        time: new Date().toISOString(),
        externalUrl: `https://sandbox.vnpayment.vn/merchantv2/`,
        message: "Payment completed successfully",
        data: {
          vnpayTransactionNo: paymentStatus.vnp_TransactionNo,
          vnpayResponseCode: paymentStatus.vnp_ResponseCode,
          vnpayMessage: paymentStatus.vnp_Message,
          bankCode: paymentStatus.vnp_BankCode,
        },
      });
    } else {
      // Payment failed or pending
      return res.status(200).json({
        pspReference: vnpayOrderId,
        result: "CHARGE_FAILURE",
        amount: 0,
        message: `Payment failed: ${paymentStatus.vnp_Message}`,
        data: {
          vnpayResponseCode: paymentStatus.vnp_ResponseCode,
          vnpayTransactionStatus: paymentStatus.vnp_TransactionStatus,
          vnpayMessage: paymentStatus.vnp_Message,
        },
      });
    }

  } catch (error) {
    console.error("Error in Transaction Process Session:", error);

    return res.status(500).json({
      result: "CHARGE_FAILURE",
      amount: 0,
      message: error instanceof Error ? error.message : "Failed to process VNPay payment",
    });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
