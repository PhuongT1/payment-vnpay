import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { getMoMoAPI } from "@/lib/momo/momo-api";

/**
 * TRANSACTION_CHARGE_REQUESTED webhook
 * 
 * This webhook is called when a charge (capture) is requested for an authorized transaction.
 * For MoMo, since it's a direct payment (not two-step), this usually means confirming
 * an already completed payment.
 */
export const transactionChargeRequestedWebhook = new SaleorAsyncWebhook({
  name: "Transaction Charge Requested - MoMo",
  webhookPath: "api/webhooks/transaction-charge-requested",
  event: "TRANSACTION_CHARGE_REQUESTED",
  apl: saleorApp.apl,
  query: `
    subscription TransactionChargeRequested {
      event {
        ... on TransactionChargeRequested {
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
            }
          }
        }
      }
    }
  `,
});

export default transactionChargeRequestedWebhook.createHandler(async (req, res, ctx) => {
  const { payload } = ctx;

  console.log("Transaction Charge Requested webhook triggered", {
    transactionId: payload.transaction?.id,
    amount: payload.action?.amount,
  });

  try {
    const { action, transaction } = payload;

    if (!transaction || !transaction.pspReference) {
      console.error("Missing transaction or PSP reference");
      return res.status(400).json({
        result: "CHARGE_FAILURE",
        amount: 0,
        message: "Missing transaction reference",
      });
    }

    // For MoMo, payments are immediately charged (not a two-step auth+capture flow)
    // So if we're here, we just need to confirm the payment was successful

    // Find the authorization success event
    const authEvent = transaction.events?.find(
      (event) => event.type === "AUTHORIZATION_SUCCESS" || event.type === "CHARGE_SUCCESS"
    );

    if (!authEvent) {
      console.error("No authorization event found");
      return res.status(400).json({
        result: "CHARGE_FAILURE",
        amount: 0,
        message: "No authorized transaction found",
      });
    }

    // Since MoMo is direct charge, we can just confirm the already-completed payment
    const amount = transaction.authorizedAmount?.amount || action.amount;
    
    return res.status(200).json({
      pspReference: authEvent.pspReference || transaction.pspReference,
      result: "CHARGE_SUCCESS",
      amount: amount,
      time: new Date().toISOString(),
      message: "Payment already captured (MoMo direct charge)",
      data: {
        note: "MoMo uses direct charge, no separate capture required",
      },
    });

  } catch (error) {
    console.error("Error in Transaction Charge Requested:", error);

    return res.status(500).json({
      result: "CHARGE_FAILURE",
      amount: 0,
      message: error instanceof Error ? error.message : "Failed to charge transaction",
    });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
