/**
 * Improved Transaction Initialize Session Webhook
 * Uses the new configuration management system
 * Follows Saleor Stripe app architecture
 * 
 * CRITICAL: VNPay return URL must point to STOREFRONT, not payment app!
 */

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { saleorApp } from "@/saleor-app";
import { createClient } from "@/lib/create-graphql-client";
import { VNPayProviderClient } from "@/modules/payment-provider/vnpay-provider";
import { getExchangeRate } from "@/lib/env-config";
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
    const checkoutId = (sourceObject as any)?.id ?? "unknown";

    console.log(`📥 [Payment Init] checkout=${checkoutId} channel=${sourceObject?.channel?.id} amount=${action?.amount} ${action?.currency}`);

    try {
      // COD — no payment gateway needed, return immediate success
      if ((payload as any).data?.type === "cod") {
        console.log(`✅ [COD] checkout=${checkoutId} amount=${action.amount}`);
        return res.status(200).json({
          pspReference: `cod_${Date.now()}`,
          result: "CHARGE_SUCCESS",
          amount: action.amount,
        });
      }

      const client = createClient(authData.saleorApiUrl, {
        headers: { Authorization: `Bearer ${authData.token}` },
      });

      // Fetch configs from app metadata
      const METADATA_KEY = "vnpay:configs";
      const MAPPING_KEY = "vnpay:channel_mappings";

      const GET_METADATA = `
        query GetAppMetadata($id: ID!) {
          app(id: $id) {
            id
            privateMetadata { key value }
          }
        }
      `;

      const { data: metadataData } = await client
        .query(GET_METADATA, { id: authData.appId })
        .toPromise();

      const metadata = metadataData?.app?.privateMetadata || [];
      const configMetadata = metadata.find((m: any) => m.key === METADATA_KEY);
      const mappingMetadata = metadata.find((m: any) => m.key === MAPPING_KEY);

      if (!configMetadata?.value) {
        console.error(`❌ [Payment Init] checkout=${checkoutId} — No VNPay config in metadata`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_config_${Date.now()}`,
          message: "No VNPay configuration found. Please configure VNPay in the app settings.",
        });
      }

      const allConfigs = JSON.parse(configMetadata.value);

      // Resolve config: channel mapping → first active
      let configId: string | null = null;
      if (mappingMetadata?.value) {
        configId = JSON.parse(mappingMetadata.value)[sourceObject.channel.id];
      }

      const config = configId
        ? allConfigs.find((c: any) => c.id === configId && c.isActive)
        : allConfigs.find((c: any) => c.isActive);

      if (!config) {
        console.error(`❌ [Payment Init] checkout=${checkoutId} — No active VNPay config`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_no_active_config_${Date.now()}`,
          message: "No active VNPay configuration found for this channel.",
        });
      }

      const storefrontReturnUrl = (config.returnUrl || "").trim();
      const ipnUrl = (config.ipnUrl || "").trim();

      if (!storefrontReturnUrl || !ipnUrl) {
        console.error(`❌ [Payment Init] checkout=${checkoutId} — Missing returnUrl or ipnUrl`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_missing_urls_${Date.now()}`,
          message: "VNPay configuration is missing returnUrl or ipnUrl.",
        });
      }

      const providerClient = new VNPayProviderClient({
        configurationId: config.id,
        configurationName: config.name,
        partnerCode: config.tmnCode,
        secretKey: config.hashSecret,
        environment: config.environment,
        channelId: sourceObject.channel.id,
        redirectUrl: storefrontReturnUrl,
        ipnUrl,
      } as any);

      const rawAmount = action.amount;
      const currency = action.currency;
      const orderId = merchantReference || sourceObject.id;
      const ipAddress = req.headers["x-forwarded-for"] as string || "127.0.0.1";

      // Convert amount to VND using per-config exchange rates (fallback to env-config)
      const configRates: Record<string, number> = config.exchangeRates || {};
      const currencyKey = currency.toUpperCase();
      const exchangeRate =
        currencyKey in configRates
          ? configRates[currencyKey]
          : currencyKey === "VND"
          ? 1
          : getExchangeRate(currency);
      const amount = Math.round(rawAmount * exchangeRate);

      console.log("💰 Payment:", { rawAmount, currency, exchangeRate, amountVND: amount, orderId });

      if (amount < 5000) {
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_amount_too_small_${Date.now()}`,
          message: "Minimum payment amount is 5,000 VND.",
        });
      }

      if (amount > 1000000000) {
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_amount_too_large_${Date.now()}`,
          message: "Maximum payment amount is 1,000,000,000 VND.",
        });
      }

      // Amount is already in VND after conversion
      const paymentResult = await providerClient.createPayment({
        orderId,
        amount,
        currency: "VND",
        orderInfo: `Order ${orderId} - ${amount} VND`,
        ipAddress,
      });

      if (!paymentResult.success) {
        console.error(`❌ [Payment Init] checkout=${checkoutId} amount=${amount} — ${paymentResult.errorMessage}`);
        return res.status(200).json({
          result: "CHARGE_FAILURE",
          amount: action.amount,
          pspReference: `err_payment_failed_${Date.now()}`,
          message: paymentResult.errorMessage || "Failed to create VNPay payment.",
        });
      }

      console.log(`✅ [Payment Init] checkout=${checkoutId} txRef=${paymentResult.transactionRef} amount=${amount}${currency}`);

      return res.status(200).json({
        pspReference: paymentResult.transactionRef,
        data: { paymentUrl: paymentResult.paymentUrl },
        result: "CHARGE_ACTION_REQUIRED",
        amount: action.amount,
      });
    } catch (error) {
      console.error("Transaction initialize error:", error);
      return res.status(200).json({
        result: "CHARGE_FAILURE",
        amount: (context.payload as any)?.action?.amount ?? 0,
        pspReference: `err_exception_${Date.now()}`,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
);
