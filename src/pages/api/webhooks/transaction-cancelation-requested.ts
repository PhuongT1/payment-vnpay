import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";

/**
 * TRANSACTION_CANCELATION_REQUESTED webhook
 * 
 * This webhook is called when a transaction cancellation is requested.
 * For MoMo, once a payment is completed, it cannot be cancelled - only refunded.
 * We can only cancel if the payment hasn't been completed yet.
 */
export const transactionCancelationRequestedWebhook = new SaleorAsyncWebhook({
  name: "Transaction Cancelation Requested - MoMo",
  webhookPath: "api/webhooks/transaction-cancelation-requested",
  event: "TRANSACTION_CANCELATION_REQUESTED",
  apl: saleorApp.apl,
  query: `
    subscription TransactionCancelationRequested {
      event {
        ... on TransactionCancelationRequested {
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
            chargedAmount {
              amount
              currency
            }
            events {
              pspReference
              type
              createdAt
            }
          }
        }
      }
    }
  `,
});

export default transactionCancelationRequestedWebhook.createHandler(async (req, res, ctx) => {
  const { payload } = ctx;

  console.log("Transaction Cancelation Requested webhook triggered", {
    transactionId: payload.transaction?.id,
  });

  try {
    const { transaction } = payload;

    if (!transaction) {
      console.error("Missing transaction");
      return res.status(400).json({
        result: "CANCEL_FAILURE",
        amount: 0,
        message: "Missing transaction",
      });
    }

    // Check if payment has been charged
    const chargeEvent = transaction.events?.find(
      (event) => event.type === "CHARGE_SUCCESS"
    );

    if (chargeEvent) {
      // Payment already charged - cannot cancel, must refund instead
      console.log("Payment already charged, cancellation not possible");
      return res.status(200).json({
        pspReference: transaction.pspReference,
        result: "CANCEL_FAILURE",
        amount: 0,
        message: "Cannot cancel completed payment. Please process a refund instead.",
        data: {
          note: "MoMo payments are immediately charged and cannot be cancelled after completion",
        },
      });
    }

    // Check if payment is only authorized but not charged
    const authEvent = transaction.events?.find(
      (event) => event.type === "AUTHORIZATION_SUCCESS"
    );

    if (authEvent) {
      // For MoMo, authorization = charge, so this shouldn't happen
      // But if it does, we'll accept the cancellation
      console.log("Authorized transaction found, marking as cancelled");
      return res.status(200).json({
        pspReference: transaction.pspReference,
        result: "CANCEL_SUCCESS",
        amount: transaction.authorizedAmount?.amount || 0,
        time: new Date().toISOString(),
        message: "Transaction cancelled successfully",
      });
    }

    // No charge or auth event - payment likely initialized but not completed
    console.log("No payment found, marking as cancelled");
    return res.status(200).json({
      pspReference: transaction.pspReference || `CANCEL_${Date.now()}`,
      result: "CANCEL_SUCCESS",
      amount: 0,
      time: new Date().toISOString(),
      message: "Transaction cancelled (no payment was made)",
    });

  } catch (error) {
    console.error("Error in Transaction Cancelation Requested:", error);

    return res.status(500).json({
      result: "CANCEL_FAILURE",
      amount: 0,
      message: error instanceof Error ? error.message : "Failed to cancel transaction",
    });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
