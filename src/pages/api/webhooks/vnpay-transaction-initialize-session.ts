/**
 * Improved Transaction Initialize Session Webhook
 * Uses the new configuration management system
 * Follows Saleor Stripe app architecture
 */

import { SaleorAsyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayConfigManager } from "@/modules/payment-app-configuration/config-manager";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * GraphQL fragment for transaction initialize session event
 */
const TransactionInitializeSessionWebhookPayload = `
  fragment TransactionInitializeSessionWebhookPayload on TransactionInitializeSession {
    action {
      amount
      currency
      actionType
    }
    sourceObject {
      __typename
      ... on Checkout {
        id
        channel {
          id
          slug
        }
        totalPrice {
          gross {
            amount
            currency
          }
        }
      }
      ... on Order {
        id
        channel {
          id
          slug
        }
        total {
          gross {
            amount
            currency
          }
        }
      }
    }
    data
    merchantReference
  }
`;

export const transactionInitializeSessionWebhook =
  new SaleorAsyncWebhook({
    name: "VNPay Transaction Initialize Session",
    webhookPath: "api/webhooks/vnpay-transaction-initialize-session",
    event: "TRANSACTION_INITIALIZE_SESSION",
    apl: saleorApp.apl,
    query: TransactionInitializeSessionWebhookPayload,
  });

export default transactionInitializeSessionWebhook.createHandler(
  async (req, res, context) => {
    const { payload, authData } = context;
    const { action, sourceObject, merchantReference } = payload;

    console.log("Transaction Initialize Session webhook triggered");

    try {
      // Create GraphQL client
      const client = createClient(authData.saleorApiUrl, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      // Get configuration manager
      const configManager = new VNPayConfigManager(client, authData.appId);

      // Try to get configuration for the channel
      let config = await configManager.getConfigurationByChannelId(
        sourceObject.channel.id
      );

      // Fallback to first available configuration
      if (!config) {
        config = await configManager.getDefaultConfiguration();
      }

      if (!config) {
        console.error("No VNPay configuration found");
        return res.status(400).json({
          error: {
            code: "CONFIGURATION_NOT_FOUND",
            message: "No VNPay configuration found. Please configure VNPay in the app settings.",
          },
        });
      }

      console.log(`Using configuration: ${config.configurationName}`);

      // Initialize payment provider
      const providerClient = new VNPayProviderClient(config);

      // Get payment details
      const amount = action.amount;
      const currency = action.currency;
      const orderId = merchantReference || sourceObject.id;
      const ipAddress = req.headers["x-forwarded-for"] as string || "127.0.0.1";

      // Create payment
      const paymentResult = await providerClient.createPayment({
        orderId,
        amount,
        currency,
        orderInfo: `Order ${orderId} - ${amount} ${currency}`,
        ipAddress,
      });

      if (!paymentResult.success) {
        console.error("Payment creation failed:", paymentResult.errorMessage);
        return res.status(400).json({
          error: {
            code: "PAYMENT_CREATION_FAILED",
            message: paymentResult.errorMessage || "Failed to create payment",
          },
        });
      }

      console.log("Payment created successfully:", paymentResult.transactionRef);

      // Return success response with payment URL
      return res.status(200).json({
        pspReference: paymentResult.transactionRef,
        data: {
          paymentUrl: paymentResult.paymentUrl,
          configurationId: config.configurationId,
        },
        result: "AUTHORIZATION_ACTION_REQUIRED",
        amount: action.amount,
        actions: [
          {
            actionType: "REDIRECT",
            url: paymentResult.paymentUrl,
          },
        ],
      });
    } catch (error) {
      console.error("Transaction initialize error:", error);
      
      return res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      });
    }
  }
);
