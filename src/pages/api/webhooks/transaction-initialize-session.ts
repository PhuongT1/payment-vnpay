import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { getVNPayAPI } from "@/lib/vnpay/vnpay-api";

/**
 * TRANSACTION_INITIALIZE_SESSION webhook
 * 
 * This webhook is called when checkout is being finalized and payment is about to be initialized.
 * It should return payment gateway data including the redirect URL for VNPay payment.
 */
export const transactionInitializeSessionWebhook = new SaleorAsyncWebhook({
  name: "Transaction Initialize Session - VNPay",
  webhookPath: "api/webhooks/transaction-initialize-session",
  event: "TRANSACTION_INITIALIZE_SESSION",
  apl: saleorApp.apl,
  query: `
    subscription TransactionInitializeSession {
      event {
        ... on TransactionInitializeSession {
          action {
            actionType
            amount
            currency
          }
          sourceObject {
            __typename
            ... on Checkout {
              id
              totalPrice {
                gross {
                  amount
                  currency
                }
              }
              user {
                email
              }
            }
            ... on Order {
              id
              total {
                gross {
                  amount
                  currency
                }
              }
              userEmail
            }
          }
          merchantReference
          idempotencyKey
          data
        }
      }
    }
  `,
});

export default transactionInitializeSessionWebhook.createHandler(async (req, res, ctx) => {
  const { payload, baseUrl, authData } = ctx;

  console.log("Transaction Initialize Session webhook triggered", {
    merchantReference: payload.merchantReference,
    idempotencyKey: payload.idempotencyKey,
  });

  try {
    const { action, sourceObject, merchantReference, idempotencyKey } = payload;

    if (!action || !sourceObject) {
      console.error("Missing required data in webhook payload");
      return res.status(400).json({
        result: "AUTHORIZATION_ACTION_REQUIRED",
        amount: 0,
        message: "Missing required data",
      });
    }

    const amount = action.amount; // VNPay accepts amount in VND (will be multiplied by 100 in API)
    const currency = action.currency;

    // Get user email from checkout or order
    const userEmail = sourceObject.__typename === "Checkout" 
      ? sourceObject.user?.email 
      : sourceObject.userEmail;

    // Create orderId using merchantReference or generate one
    const orderId = merchantReference || `SALEOR_${Date.now()}`;

    // Initialize VNPay payment
    const vnpayAPI = getVNPayAPI();

    // Get customer IP address (use a default for webhook context)
    const ipAddr = req.headers["x-forwarded-for"] as string || "127.0.0.1";

    const vnpayPayment = await vnpayAPI.createPayment({
      orderId,
      amount,
      orderInfo: `Payment for order ${merchantReference}`,
      ipAddr,
      locale: "vn",
    });

    console.log("VNPay payment created successfully", {
      orderId,
      paymentUrl: vnpayPayment.paymentUrl,
    });

    // Return response following Saleor's payment app protocol
    return res.status(200).json({
      pspReference: orderId,
      result: "AUTHORIZATION_ACTION_REQUIRED",
      amount: action.amount,
      data: {
        paymentUrl: vnpayPayment.paymentUrl,
        vnpayOrderId: orderId,
        currency,
        userEmail,
      },
      message: "Please complete payment on VNPay",
    });

  } catch (error) {
    console.error("Error in Transaction Initialize Session:", error);

    return res.status(500).json({
      result: "AUTHORIZATION_FAILURE",
      amount: 0,
      message: error instanceof Error ? error.message : "Failed to initialize VNPay payment",
    });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
