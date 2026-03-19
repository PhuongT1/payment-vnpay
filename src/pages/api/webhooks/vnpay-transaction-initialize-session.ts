/**
 * Improved Transaction Initialize Session Webhook
 * Uses the new configuration management system
 * Follows Saleor Stripe app architecture
 */

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";
import {
  TransactionInitializeSessionDocument,
  TransactionInitializeSessionPayloadFragment,
} from "@/generated/graphql";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const transactionInitializeSessionWebhook =
  new SaleorSyncWebhook<TransactionInitializeSessionPayloadFragment>({
    name: "VNPay Transaction Initialize Session",
    webhookPath: "api/webhooks/vnpay-transaction-initialize-session",
    event: "TRANSACTION_INITIALIZE_SESSION",
    apl: saleorApp.apl,
    query: TransactionInitializeSessionDocument,
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

      // Get configuration from metadata (same key as UI uses)
      const METADATA_KEY = "vnpay:configs";
      const MAPPING_KEY = "vnpay:channel_mappings";
      
      // Fetch configs from metadata
      const GET_METADATA = `
        query GetAppMetadata($id: ID!) {
          app(id: $id) {
            id
            privateMetadata {
              key
              value
            }
          }
        }
      `;

      const { data: metadataData } = await client
        .query(GET_METADATA, { id: authData.appId })
        .toPromise();

      const metadata = metadataData?.app?.privateMetadata || [];
      const configMetadata = metadata.find((m: any) => m.key === METADATA_KEY);
      const mappingMetadata = metadata.find((m: any) => m.key === MAPPING_KEY);

      console.log("📦 Metadata found:", {
        hasConfigMetadata: !!configMetadata,
        hasMappingMetadata: !!mappingMetadata,
        configValue: configMetadata?.value ? "exists" : "missing",
      });

      if (!configMetadata?.value) {
        console.error("No VNPay configuration found in metadata");
        return res.status(400).json({
          error: {
            code: "CONFIGURATION_NOT_FOUND",
            message: "No VNPay configuration found. Please configure VNPay in the app settings.",
          },
        });
      }

      // Parse configs
      const allConfigs = JSON.parse(configMetadata.value);
      console.log("📝 All configs loaded:", {
        count: allConfigs.length,
        configs: allConfigs.map((c: any) => ({
          id: c.id,
          name: c.name,
          isActive: c.isActive,
        })),
      });
      
      // Get channel mapping to find correct config
      let configId: string | null = null;
      if (mappingMetadata?.value) {
        const mappings = JSON.parse(mappingMetadata.value);
        configId = mappings[sourceObject.channel.id];
        console.log("🗺️ Channel mapping:", {
          channelId: sourceObject.channel.id,
          mappedConfigId: configId,
        });
      }

      // Find config by mapping or use first active config
      const config = configId 
        ? allConfigs.find((c: any) => c.id === configId && c.isActive)
        : allConfigs.find((c: any) => c.isActive);

      console.log("✅ Selected config:", config ? {
        id: config.id,
        name: config.name,
        isActive: config.isActive,
      } : "NOT FOUND");

      if (!config) {
        // Fallback to environment variables for development
        console.log("⚙️ No config in metadata, checking environment variables...");
        
        const envTmnCode = process.env.VNPAY_TMN_CODE;
        const envHashSecret = process.env.VNPAY_HASH_SECRET;
        const envEnvironment = process.env.VNPAY_ENVIRONMENT || "sandbox";
        
        if (envTmnCode && envHashSecret) {
          console.log("✅ Using config from environment variables");
          config = {
            id: "env_default",
            name: "Environment Config",
            tmnCode: envTmnCode,
            hashSecret: envHashSecret,
            environment: envEnvironment as "sandbox" | "production",
            isActive: true,
          };
        } else {
          console.error("❌ No active VNPay configuration found in metadata or environment");
          return res.status(400).json({
            error: {
              code: "CONFIGURATION_NOT_FOUND",
              message: "No active VNPay configuration found. Please activate a configuration in the app settings.",
            },
          });
        }
      }

      console.log(`Using configuration: ${config.name}`);

      // Map UI config format to VNPayProviderClient format
      const providerConfig = {
        configurationId: config.id,
        configurationName: config.name,
        partnerCode: config.tmnCode,
        secretKey: config.hashSecret,
        environment: config.environment,
        channelId: sourceObject.channel.id,
        redirectUrl: process.env.VNPAY_REDIRECT_URL || `${authData.saleorApiUrl.replace('/graphql/', '')}/api/vnpay/return`,
        ipnUrl: process.env.VNPAY_IPN_URL || `${authData.saleorApiUrl.replace('/graphql/', '')}/api/vnpay/ipn`,
      };

      // Initialize payment provider
      const providerClient = new VNPayProviderClient(providerConfig as any);

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
