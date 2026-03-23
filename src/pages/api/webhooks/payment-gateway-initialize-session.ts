/**
 * PAYMENT_GATEWAY_INITIALIZE_SESSION Webhook
 * 
 * CRITICAL: This webhook makes VNPay appear as a payment option in checkout!
 * 
 * Saleor calls this webhook to get available payment gateways.
 * We return VNPay gateway configuration which makes it visible in checkout.
 * 
 * Flow:
 * 1. Customer reaches checkout payment step
 * 2. Saleor calls this webhook
 * 3. We check if VNPay is configured for this channel
 * 4. Return gateway config → VNPay appears in payment list
 * 5. Customer selects VNPay → TRANSACTION_INITIALIZE_SESSION is called
 */

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import {
  PaymentGatewayInitializeSessionDocument,
  PaymentGatewayInitializeSessionPayloadFragment,
} from "@/generated/graphql";

export const config = {
  api: {
    bodyParser: false,
  },
};

export const paymentGatewayInitializeSessionWebhook =
  new SaleorSyncWebhook<PaymentGatewayInitializeSessionPayloadFragment>({
    name: "VNPay Payment Gateway Initialize Session",
    webhookPath: "api/webhooks/payment-gateway-initialize-session",
    event: "PAYMENT_GATEWAY_INITIALIZE_SESSION",
    apl: saleorApp.apl,
    query: PaymentGatewayInitializeSessionDocument,
  });

export default paymentGatewayInitializeSessionWebhook.createHandler(
  async (req, res, context) => {
    const { payload, authData } = context;
    const { sourceObject } = payload;

    console.log("Payment Gateway Initialize Session webhook triggered", {
      channel: sourceObject.channel.slug,
      objectType: sourceObject.__typename,
    });

    try {
      // Create GraphQL client
      const client = createClient(authData.saleorApiUrl, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      // Check if we have any VNPay configurations in metadata
      const metadataQuery = `
        query GetAppMetadata {
          app {
            id
            privateMetadata {
              key
              value
            }
          }
        }
      `;

      const metadataResult = await client.query(metadataQuery, {}).toPromise();
      
      if (metadataResult.error) {
        console.error("Failed to fetch metadata:", metadataResult.error);
        // Return empty array - no payment gateway available
        return res.status(200).json({ data: [] });
      }

      // Check if vnpay:configs exists
      const configMetadata = metadataResult.data?.app?.privateMetadata?.find(
        (item: any) => item.key === "vnpay:configs"
      );

      if (!configMetadata) {
        console.log("No VNPay configurations found - gateway not available");
        return res.status(200).json({ data: [] });
      }

      let configs: any[] = [];
      try {
        configs = JSON.parse(configMetadata.value);
      } catch (e) {
        console.error("Failed to parse configs:", e);
        return res.status(200).json({ data: [] });
      }

      if (configs.length === 0) {
        console.log("No active VNPay configurations - gateway not available");
        return res.status(200).json({ data: [] });
      }

      const activeConfigs = configs.filter((c) => c?.isActive);

      if (activeConfigs.length === 0) {
        console.log("No active VNPay configurations - gateway not available");
        return res.status(200).json({ data: [] });
      }

      // Check if there's a mapping for this channel
      const mappingMetadata = metadataResult.data?.app?.privateMetadata?.find(
        (item: any) => item.key === "vnpay:channel_mappings"
      );

      let mappings: Record<string, string> = {};
      if (mappingMetadata) {
        try {
          mappings = JSON.parse(mappingMetadata.value);
        } catch (e) {
          console.error("Failed to parse mappings:", e);
        }
      }

      // Check if this channel has a VNPay configuration assigned
      const channelConfigId = mappings[sourceObject.channel.id];
      const selectedConfig = channelConfigId
        ? activeConfigs.find((c) => c.id === channelConfigId)
        : activeConfigs[0];

      if (!selectedConfig) {
        console.log(`No VNPay configuration assigned to channel ${sourceObject.channel.slug}`);
        return res.status(200).json({ data: [] });
      }

      // Return VNPay as available payment gateway
      console.log("VNPay payment gateway is available for this checkout");

      return res.status(200).json({
        data: [
          {
            id: "vnpay.payment.app",
            name: "VNPay",
            currencies: ["VND", "USD"], // VNPay supports these currencies
            config: [
              {
                field: "gateway_id",
                value: "vnpay",
              },
              {
                field: "environment",
                value: selectedConfig.environment || "sandbox",
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Payment Gateway Initialize Session error:", error);
      
      // On error, return empty array (no gateway available)
      // Don't fail the checkout - just hide VNPay option
      return res.status(200).json({
        data: [],
      });
    }
  }
);
